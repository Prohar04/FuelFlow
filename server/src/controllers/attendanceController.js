import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Create or update attendance record
 * POST /api/attendance
 * Manager only
 */
export const createAttendance = async (req, res, next) => {
  try {
    const { userId, date, status, checkIn, checkOut, notes } = req.body;

    // Validate input
    if (!userId || !date || !status) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'UserId, date, and status are required')
      );
    }

    // Validate that date is today only
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate.getTime() < today.getTime()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Cannot modify attendance for past dates. Previous attendance records are locked.')
      );
    }

    if (inputDate.getTime() > today.getTime()) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Cannot mark attendance for future dates. Please mark attendance for today only.')
      );
    }

    // Get user to verify pump assignment
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Manager can only create attendance for their pump
    if (req.user.role === 'manager' && user.pumpId?.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'You can only create attendance for employees in your pump')
      );
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({ userId, date: new Date(date) });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      if (checkIn) existingAttendance.checkIn = checkIn;
      if (checkOut) existingAttendance.checkOut = checkOut;
      if (notes !== undefined) existingAttendance.notes = notes;

      await existingAttendance.save();

      return res.status(200).json(
        formatSuccess(existingAttendance, 'Attendance updated successfully')
      );
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      userId,
      pumpId: user.pumpId,
      date: new Date(date),
      status,
      checkIn,
      checkOut,
      notes,
    });

    return res.status(201).json(
      formatSuccess(attendance, 'Attendance created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance records (scoped by role)
 * GET /api/attendance
 */
export const getAttendance = async (req, res, next) => {
  try {
    const { userId, startDate, endDate, pumpId } = req.query;

    let query = {};

    // Apply filters
    if (userId) query.userId = userId;
    if (pumpId) query.pumpId = pumpId;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'cashier' || req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email role jobTitle')
      .populate('pumpId', 'name code')
      .sort({ date: -1 });

    return res.status(200).json(formatSuccess(attendance));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's attendance
 * GET /api/attendance/me
 */
export const getMyAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { userId: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('pumpId', 'name code')
      .sort({ date: -1 });

    return res.status(200).json(formatSuccess(attendance));
  } catch (error) {
    next(error);
  }
};
