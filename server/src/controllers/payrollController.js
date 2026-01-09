import Payroll from '../models/Payroll.js';
import User from '../models/User.js';
import Pump from '../models/Pump.js';
import { formatError, formatSuccess } from '../utils/helpers.js';
import {
  generateWeeklyPayroll,
  getPayrollSummary as getPayrollSummaryService,
} from '../services/payrollService.js';
import { sendPayrollNotificationEmail } from '../utils/email.js';

/**
 * Generate weekly payroll for employees
 * POST /api/payroll/generate-weekly
 * Manager only
 */
export const generateWeeklyPayrollController = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.body;

    // Validate input
    if (!periodStart || !periodEnd) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'periodStart and periodEnd are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'pumpId is required')
      );
    }

    // Generate payroll using service
    const payrolls = await generateWeeklyPayroll(
      pumpId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    // Populate and return
    const populatedPayrolls = await Payroll.find({
      _id: { $in: payrolls.map((p) => p._id) },
    })
      .populate('userId', 'name email role jobTitle')
      .populate('pumpId', 'name code');

    return res.status(201).json(
      formatSuccess(
        populatedPayrolls,
        `Generated ${populatedPayrolls.length} payroll records`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark payroll as given and send email notification
 * PATCH /api/payroll/:id/mark-given
 * Manager only
 */
export const markPayrollAsGiven = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find payroll
    const payroll = await Payroll.findById(id)
      .populate('userId', 'name email')
      .populate('pumpId', 'name');

    if (!payroll) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Payroll not found')
      );
    }

    // Check access
    if (req.user.role === 'manager') {
      if (payroll.pumpId._id.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    }

    // Check if already marked as given
    if (payroll.paymentStatus === 'given') {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Payroll already marked as given')
      );
    }

    // Update payroll status
    payroll.paymentStatus = 'given';
    payroll.paidAt = new Date();
    payroll.paidBy = req.user._id;
    await payroll.save();

    // Send email notification to employee
    try {
      await sendPayrollNotificationEmail({
        toEmail: payroll.userId.email,
        employeeName: payroll.userId.name,
        pumpName: payroll.pumpId.name,
        managerName: req.user.name,
        periodStart: payroll.periodStart.toLocaleDateString(),
        periodEnd: payroll.periodEnd.toLocaleDateString(),
        hoursWorked: payroll.totalHoursWorked,
        hourlyRate: payroll.hourlyRate,
        grossPay: payroll.grossPay,
        deductions: payroll.deductions,
        netPay: payroll.netPay,
      });
    } catch (emailError) {
      console.error('Failed to send payroll email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    // Populate and return updated payroll
    const updatedPayroll = await Payroll.findById(id)
      .populate('userId', 'name email role jobTitle')
      .populate('pumpId', 'name code')
      .populate('paidBy', 'name email');

    return res.status(200).json(
      formatSuccess(updatedPayroll, 'Payroll marked as given and email sent')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payroll summary statistics
 * GET /api/payroll/summary
 * Manager only
 */
export const getPayrollSummaryController = async (req, res, next) => {
  try {
    const { periodStart, periodEnd } = req.query;

    const pumpId = req.user.role === 'admin' ? req.query.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'pumpId is required')
      );
    }

    const summary = await getPayrollSummaryService(
      pumpId,
      periodStart ? new Date(periodStart) : null,
      periodEnd ? new Date(periodEnd) : null
    );

    return res.status(200).json(formatSuccess(summary));
  } catch (error) {
    next(error);
  }
};

/**
 * Get payroll records (scoped by role)
 * GET /api/payroll
 */
export const getPayroll = async (req, res, next) => {
  try {
    const { userId, pumpId, startDate, endDate, paymentStatus } = req.query;

    let query = {};

    // Apply filters
    if (userId) query.userId = userId;
    if (pumpId) query.pumpId = pumpId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
      query.periodStart = {};
      if (startDate) query.periodStart.$gte = new Date(startDate);
      if (endDate) query.periodStart.$lte = new Date(endDate);
    }

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'cashier' || req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    const payrolls = await Payroll.find(query)
      .populate('userId', 'name email role jobTitle')
      .populate('pumpId', 'name code')
      .populate('paidBy', 'name email')
      .sort({ periodStart: -1 });

    return res.status(200).json(formatSuccess(payrolls));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's payroll
 * GET /api/payroll/me
 */
export const getMyPayroll = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { userId: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.periodStart = {};
      if (startDate) query.periodStart.$gte = new Date(startDate);
      if (endDate) query.periodStart.$lte = new Date(endDate);
    }

    const payrolls = await Payroll.find(query)
      .populate('pumpId', 'name code')
      .populate('paidBy', 'name email')
      .sort({ periodStart: -1 });

    return res.status(200).json(formatSuccess(payrolls));
  } catch (error) {
    next(error);
  }
};

/**
 * Get payslip for a specific payroll
 * GET /api/payroll/:id/payslip
 */
export const getPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate('userId', 'name email role jobTitle')
      .populate('pumpId', 'name code address')
      .populate('paidBy', 'name email')
      .populate('shiftHours.shiftId', 'startAt endAt');

    if (!payroll) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Payroll not found')
      );
    }

    // Check access
    if (req.user.role === 'manager') {
      if (payroll.pumpId._id.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    } else if (req.user.role !== 'admin') {
      if (payroll.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    }

    return res.status(200).json(formatSuccess(payroll));
  } catch (error) {
    next(error);
  }
};
