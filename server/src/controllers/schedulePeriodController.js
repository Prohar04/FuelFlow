import SchedulePeriod from '../models/SchedulePeriod.js';
import Shift from '../models/Shift.js';
import { formatError, formatSuccess } from '../utils/helpers.js';
import { logSchedulePublish } from '../services/auditLogService.js';
import { notifySchedulePublished } from '../services/notificationService.js';

/**
 * Create a schedule period
 * POST /api/schedule-periods
 * Manager/Admin only
 */
export const createSchedulePeriod = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Start date and end date are required')
      );
    }

    // Manager can only create periods for their pump
    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Pump ID is required')
      );
    }

    // Check for overlapping periods
    const overlapping = await SchedulePeriod.findOne({
      pumpId,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlapping) {
      return res.status(400).json(
        formatError('CONFLICT_ERROR', 'A schedule period already exists for this date range')
      );
    }

    const schedulePeriod = await SchedulePeriod.create({
      pumpId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user._id,
    });

    const populated = await SchedulePeriod.findById(schedulePeriod._id)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email');

    return res.status(201).json(
      formatSuccess(populated, 'Schedule period created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get schedule periods
 * GET /api/schedule-periods
 * Manager/Admin only
 */
export const getSchedulePeriods = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = {};

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'admin' && req.query.pumpId) {
      query.pumpId = req.query.pumpId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const periods = await SchedulePeriod.find(query)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email')
      .populate('publishedBy', 'name email')
      .sort({ startDate: -1 });

    return res.status(200).json(formatSuccess(periods));
  } catch (error) {
    next(error);
  }
};

/**
 * Publish a schedule period
 * POST /api/schedule-periods/:id/publish
 * Manager/Admin only
 */
export const publishSchedulePeriod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const period = await SchedulePeriod.findById(id).populate('pumpId', 'name');

    if (!period) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Schedule period not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && period.pumpId._id.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    if (period.status === 'published') {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Schedule period is already published')
      );
    }

    // Update all draft shifts in this period to published
    const updateResult = await Shift.updateMany(
      {
        pumpId: period.pumpId._id,
        startAt: { $gte: period.startDate, $lte: period.endDate },
        status: 'draft',
        isActive: true,
      },
      {
        $set: { status: 'published' },
      }
    );

    // Update period status
    period.status = 'published';
    period.publishedAt = new Date();
    period.publishedBy = req.user._id;
    await period.save();

    // Create audit log
    await logSchedulePublish(req.user._id, 'publish', period._id, period.pumpId._id);

    // Get all employees with shifts in this period
    const shifts = await Shift.find({
      pumpId: period.pumpId._id,
      startAt: { $gte: period.startDate, $lte: period.endDate },
      status: 'published',
      isActive: true,
    }).distinct('employeeId');

    // Send notifications to all employees
    if (shifts.length > 0) {
      await notifySchedulePublished(
        shifts,
        period._id,
        period.startDate,
        period.endDate,
        period.pumpId.name
      );
    }

    const populated = await SchedulePeriod.findById(period._id)
      .populate('pumpId', 'name code')
      .populate('publishedBy', 'name email');

    return res.status(200).json(
      formatSuccess(
        {
          period: populated,
          shiftsPublished: updateResult.modifiedCount,
          employeesNotified: shifts.length,
        },
        'Schedule period published successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish a schedule period (optional, for corrections)
 * POST /api/schedule-periods/:id/unpublish
 * Admin only
 */
export const unpublishSchedulePeriod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const period = await SchedulePeriod.findById(id);

    if (!period) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Schedule period not found')
      );
    }

    if (period.status !== 'published') {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Schedule period is not published')
      );
    }

    // Update all published shifts in this period back to draft
    await Shift.updateMany(
      {
        pumpId: period.pumpId,
        startAt: { $gte: period.startDate, $lte: period.endDate },
        status: 'published',
        isActive: true,
      },
      {
        $set: { status: 'draft' },
      }
    );

    // Update period status
    period.status = 'draft';
    period.publishedAt = null;
    period.publishedBy = null;
    await period.save();

    // Create audit log
    await logSchedulePublish(req.user._id, 'unpublish', period._id, period.pumpId);

    return res.status(200).json(
      formatSuccess(period, 'Schedule period unpublished successfully')
    );
  } catch (error) {
    next(error);
  }
};
