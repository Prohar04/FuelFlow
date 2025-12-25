import Shift from '../models/Shift.js';
import User from '../models/User.js';
import { formatError, formatSuccess } from '../utils/helpers.js';
import { checkShiftConflicts } from '../services/conflictDetectionService.js';
import { logShiftChange } from '../services/auditLogService.js';
import { notifyShiftAssigned, notifyShiftUpdated, notifyShiftCancelled } from '../services/notificationService.js';

/**
 * Create shift
 * POST /api/shifts
 * Manager/Admin only
 */
export const createShift = async (req, res, next) => {
  try {
    const {
      employeeId,
      roleRequired,
      startAt,
      endAt,
      breakMinutes = 0,
      notes,
    } = req.body;

    // Validate required fields
    if (!employeeId || !roleRequired || !startAt || !endAt) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Employee, role, start time, and end time are required')
      );
    }

    // Manager can only create shifts for their pump
    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Pump ID is required')
      );
    }

    // Verify employee exists and belongs to the pump
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Employee not found')
      );
    }

    if (employee.pumpId?.toString() !== pumpId.toString()) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Employee does not belong to this pump')
      );
    }

    // Check for conflicts
    const shiftData = {
      employeeId,
      roleRequired,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      breakMinutes,
      pumpId,
    };

    const conflictCheck = await checkShiftConflicts(shiftData, null, {
      strictMode: false, // TODO: Make this configurable per pump
      maxHoursPerDay: 12,
      maxHoursPerWeek: 60,
      minRestGapHours: 8,
    });

    // If strict mode is enabled and there are conflicts, block creation
    if (conflictCheck.hasConflicts) {
      return res.status(400).json(
        formatError('CONFLICT_ERROR', 'Shift conflicts detected', {
          conflicts: conflictCheck.conflicts,
          warnings: conflictCheck.warnings,
        })
      );
    }

    // Create shift
    const shift = await Shift.create({
      pumpId,
      employeeId,
      roleRequired,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      breakMinutes: breakMinutes || 0,
      notes: notes || '',
      status: 'draft',
      createdBy: req.user._id,
    });

    // Create audit log
    await logShiftChange(req.user._id, 'create', shift._id, { after: shift.toObject() }, null, pumpId);

    // Send notification to employee
    await notifyShiftAssigned(employeeId, shift._id);

    const populatedShift = await Shift.findById(shift._id)
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .populate('createdBy', 'name email');

    return res.status(201).json(
      formatSuccess(
        {
          shift: populatedShift,
          conflicts: conflictCheck.warnings, // Return warnings for info
        },
        'Shift created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get shifts
 * GET /api/shifts
 */
export const getShifts = async (req, res, next) => {
  try {
    const {
      from,
      to,
      status,
      employeeId,
      roleRequired,
      includeInactive = 'false',
    } = req.query;

    let query = {};

    // Only show active shifts by default
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    // Apply filters
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (roleRequired) query.roleRequired = roleRequired;

    // Date range filter
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'admin' && req.query.pumpId) {
      query.pumpId = req.query.pumpId;
    } else if (req.user.role === 'cashier' || req.user.role === 'employee') {
      query.employeeId = req.user._id;
    }

    const shifts = await Shift.find(query)
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ startAt: 1 });

    return res.status(200).json(formatSuccess(shifts));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's shifts
 * GET /api/shifts/me
 */
export const getMyShifts = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;

    let query = {
      employeeId: req.user._id,
      isActive: true,
    };

    // Employees can only see published shifts
    // Managers/admins can see all their shifts
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    // Date range filter
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }

    const shifts = await Shift.find(query)
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .sort({ startAt: 1 });

    return res.status(200).json(formatSuccess(shifts));
  } catch (error) {
    next(error);
  }
};

/**
 * Update shift
 * PATCH /api/shifts/:id
 * Manager/Admin only
 */
export const updateShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      roleRequired,
      startAt,
      endAt,
      breakMinutes,
      notes,
      changeReason,
    } = req.body;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Shift not found')
      );
    }

    if (!shift.isActive) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Cannot update inactive shift')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && shift.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    // If shift is published, require change reason
    if (shift.status === 'published' && !changeReason) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Change reason is required for published shifts')
      );
    }

    // Store original values for audit log
    const originalShift = shift.toObject();

    // Build updated shift data
    const updatedData = {
      _id: shift._id,
      employeeId: employeeId || shift.employeeId,
      roleRequired: roleRequired || shift.roleRequired,
      startAt: startAt ? new Date(startAt) : shift.startAt,
      endAt: endAt ? new Date(endAt) : shift.endAt,
      breakMinutes: breakMinutes !== undefined ? breakMinutes : shift.breakMinutes,
      pumpId: shift.pumpId,
    };

    // Check for conflicts
    const conflictCheck = await checkShiftConflicts(updatedData, null, {
      strictMode: false,
      maxHoursPerDay: 12,
      maxHoursPerWeek: 60,
      minRestGapHours: 8,
    });

    if (conflictCheck.hasConflicts) {
      return res.status(400).json(
        formatError('CONFLICT_ERROR', 'Shift conflicts detected', {
          conflicts: conflictCheck.conflicts,
          warnings: conflictCheck.warnings,
        })
      );
    }

    // Detect what changed for notifications
    const changes = {};
    if (startAt && new Date(startAt).getTime() !== shift.startAt.getTime()) {
      changes.time = true;
    }
    if (endAt && new Date(endAt).getTime() !== shift.endAt.getTime()) {
      changes.time = true;
    }
    if (startAt && new Date(startAt).toDateString() !== shift.startAt.toDateString()) {
      changes.date = true;
    }

    // Update fields
    if (employeeId) shift.employeeId = employeeId;
    if (roleRequired) shift.roleRequired = roleRequired;
    if (startAt) shift.startAt = new Date(startAt);
    if (endAt) shift.endAt = new Date(endAt);
    if (breakMinutes !== undefined) shift.breakMinutes = breakMinutes;
    if (notes !== undefined) shift.notes = notes;
    if (changeReason) shift.changeReason = changeReason;
    shift.updatedBy = req.user._id;

    await shift.save();

    // Create audit log
    await logShiftChange(
      req.user._id,
      'update',
      shift._id,
      { before: originalShift, after: shift.toObject() },
      changeReason,
      shift.pumpId
    );

    // Send notification if employee or time changed
    if (employeeId || changes.time || changes.date) {
      await notifyShiftUpdated(shift.employeeId, shift._id, changes);
    }

    const updatedShift = await Shift.findById(id)
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return res.status(200).json(
      formatSuccess(
        {
          shift: updatedShift,
          warnings: conflictCheck.warnings,
        },
        'Shift updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shift (soft delete)
 * DELETE /api/shifts/:id
 * Manager/Admin only
 */
export const deleteShift = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Shift not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && shift.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    // Store original for audit
    const originalShift = shift.toObject();

    // Soft delete
    shift.isActive = false;
    shift.status = 'cancelled';
    await shift.save();

    // Create audit log
    await logShiftChange(
      req.user._id,
      'delete',
      shift._id,
      { before: originalShift, after: shift.toObject() },
      null,
      shift.pumpId
    );

    // Notify employee
    await notifyShiftCancelled(shift.employeeId, shift._id);

    return res.status(200).json(
      formatSuccess(null, 'Shift deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Check shift conflicts without creating
 * POST /api/shifts/check-conflicts
 * Manager/Admin only
 */
export const checkConflicts = async (req, res, next) => {
  try {
    const {
      employeeId,
      roleRequired,
      startAt,
      endAt,
      breakMinutes = 0,
      shiftId, // Optional, for update scenario
    } = req.body;

    if (!employeeId || !roleRequired || !startAt || !endAt) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Employee, role, start time, and end time are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    const shiftData = {
      _id: shiftId,
      employeeId,
      roleRequired,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      breakMinutes,
      pumpId,
    };

    const conflictCheck = await checkShiftConflicts(shiftData, null, {
      strictMode: false,
      maxHoursPerDay: 12,
      maxHoursPerWeek: 60,
      minRestGapHours: 8,
    });

    return res.status(200).json(
      formatSuccess({
        hasConflicts: conflictCheck.hasConflicts,
        conflicts: conflictCheck.conflicts,
        warnings: conflictCheck.warnings,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create shifts
 * POST /api/shifts/bulk
 * Manager/Admin only
 */
export const bulkCreateShifts = async (req, res, next) => {
  try {
    const {
      employeeIds, // Array of employee IDs
      roleRequired,
      startTime, // Time string (e.g., "09:00")
      endTime,
      breakMinutes = 0,
      notes,
      recurrence, // { type: 'once' | 'daily' | 'weekly', startDate, endDate, weekdays: [0-6] }
    } = req.body;

    // Validation
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'At least one employee must be selected')
      );
    }

    if (!roleRequired || !startTime || !endTime || !recurrence) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Role, times, and recurrence pattern are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Pump ID is required')
      );
    }

    // Verify all employees exist and belong to the pump
    const employees = await User.find({ _id: { $in: employeeIds } });
    
    if (employees.length !== employeeIds.length) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'One or more employees not found')
      );
    }

    const invalidEmployees = employees.filter(
      (emp) => emp.pumpId?.toString() !== pumpId.toString()
    );

    if (invalidEmployees.length > 0) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Some employees do not belong to this pump')
      );
    }

    // Generate date array based on recurrence pattern
    const dates = [];
    const startDate = new Date(recurrence.startDate);
    const endDate = recurrence.endDate ? new Date(recurrence.endDate) : startDate;

    if (recurrence.type === 'once') {
      dates.push(startDate);
    } else if (recurrence.type === 'daily') {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (recurrence.type === 'weekly') {
      // weekdays: array of day numbers (0 = Sunday, 1 = Monday, etc.)
      const weekdays = recurrence.weekdays || [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (weekdays.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Generate shifts for each employee and each date
    const shiftsToCreate = [];
    const conflicts = [];
    const warnings = [];

    for (const employeeId of employeeIds) {
      for (const date of dates) {
        // Combine date with time
        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');
        
        const startAt = new Date(date);
        startAt.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const endAt = new Date(date);
        endAt.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        // If end time is before start time, assume next day
        if (endAt <= startAt) {
          endAt.setDate(endAt.getDate() + 1);
        }

        const shiftData = {
          pumpId,
          employeeId,
          roleRequired,
          startAt,
          endAt,
          breakMinutes,
          notes: notes || '',
          status: 'draft',
          createdBy: req.user._id,
        };

        // Check conflicts for this shift
        const conflictCheck = await checkShiftConflicts(shiftData, null, {
          strictMode: false,
          maxHoursPerDay: 12,
          maxHoursPerWeek: 60,
          minRestGapHours: 8,
        });

        if (conflictCheck.hasConflicts) {
          conflicts.push({
            employeeId,
            date: startAt.toISOString(),
            conflicts: conflictCheck.conflicts,
          });
        } else {
          shiftsToCreate.push(shiftData);
          if (conflictCheck.warnings.length > 0) {
            warnings.push({
              employeeId,
              date: startAt.toISOString(),
              warnings: conflictCheck.warnings,
            });
          }
        }
      }
    }

    // If there are blocking conflicts, return them
    if (conflicts.length > 0) {
      return res.status(400).json(
        formatError('CONFLICT_ERROR', 'Some shifts have conflicts', {
          conflicts,
          warnings,
          wouldCreate: shiftsToCreate.length,
        })
      );
    }

    // Create all shifts
    const createdShifts = await Shift.insertMany(shiftsToCreate);

    // Create audit logs for each shift
    for (const shift of createdShifts) {
      await logShiftChange(req.user._id, 'create', shift._id, { after: shift.toObject() }, null, pumpId);
      // Note: Not sending notifications for draft shifts
    }

    // Populate the created shifts
    const populatedShifts = await Shift.find({
      _id: { $in: createdShifts.map((s) => s._id) },
    })
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .populate('createdBy', 'name email');

    return res.status(201).json(
      formatSuccess(
        {
          shifts: populatedShifts,
          count: populatedShifts.length,
          warnings,
        },
        `${populatedShifts.length} shifts created successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk publish shifts
 * PATCH /api/shifts/bulk-publish
 * Manager/Admin only
 */
export const bulkPublishShifts = async (req, res, next) => {
  try {
    const { shiftIds } = req.body;

    if (!shiftIds || !Array.isArray(shiftIds) || shiftIds.length === 0) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'At least one shift ID must be provided')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    // Find all shifts
    const shifts = await Shift.find({
      _id: { $in: shiftIds },
      isActive: true,
    });

    if (shifts.length === 0) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'No shifts found')
      );
    }

    // Check pump access for managers
    if (req.user.role === 'manager') {
      const invalidShifts = shifts.filter(
        (shift) => shift.pumpId.toString() !== pumpId?.toString()
      );

      if (invalidShifts.length > 0) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied to some shifts')
        );
      }
    }

    // Filter only draft shifts
    const draftShifts = shifts.filter((shift) => shift.status === 'draft');

    if (draftShifts.length === 0) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'No draft shifts to publish')
      );
    }

    // Update all to published
    const updatedShiftIds = [];
    const notificationPromises = [];

    for (const shift of draftShifts) {
      shift.status = 'published';
      shift.updatedBy = req.user._id;
      await shift.save();

      updatedShiftIds.push(shift._id);

      // Create audit log
      await logShiftChange(
        req.user._id,
        'publish',
        shift._id,
        { before: { status: 'draft' }, after: { status: 'published' } },
        'Bulk publish',
        shift.pumpId
      );

      // Send notification to employee
      notificationPromises.push(notifyShiftAssigned(shift.employeeId, shift._id));
    }

    // Send all notifications
    await Promise.allSettled(notificationPromises);

    return res.status(200).json(
      formatSuccess(
        {
          publishedCount: draftShifts.length,
          shiftIds: updatedShiftIds,
        },
        `${draftShifts.length} shifts published successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get unpublished (draft) shifts
 * GET /api/shifts/unpublished
 * Manager/Admin only
 */
export const getUnpublishedShifts = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const pumpId = req.user.role === 'admin' ? req.query.pumpId : req.user.pumpId;

    let query = {
      status: 'draft',
      isActive: true,
    };

    if (pumpId) {
      query.pumpId = pumpId;
    }

    // Date range filter
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }

    const shifts = await Shift.find(query)
      .populate('pumpId', 'name code')
      .populate('employeeId', 'name email role jobTitle')
      .populate('createdBy', 'name email')
      .sort({ startAt: 1 });

    return res.status(200).json(
      formatSuccess({
        shifts,
        count: shifts.length,
      })
    );
  } catch (error) {
    next(error);
  }
};

