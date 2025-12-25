import Shift from '../models/Shift.js';
import User from '../models/User.js';

/**
 * Conflict detection service for shift scheduling
 * Validates shifts against business rules and existing schedules
 */

/**
 * Check for all types of conflicts for a shift
 * @param {Object} shift - Shift data to validate
 * @param {Array} existingShifts - Existing shifts for the employee (optional, will query if not provided)
 * @param {Object} options - Configuration options
 * @returns {Object} { hasConflicts, conflicts, warnings }
 */
export const checkShiftConflicts = async (shift, existingShifts = null, options = {}) => {
  const {
    strictMode = false,
    maxHoursPerDay = 12,
    maxHoursPerWeek = 60,
    minRestGapHours = 8,
  } = options;

  const conflicts = [];
  const warnings = [];

  // Fetch existing shifts if not provided
  if (!existingShifts) {
    const startOfDay = new Date(shift.startAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(shift.startAt);
    endOfDay.setHours(23, 59, 59, 999);

    existingShifts = await Shift.find({
      employeeId: shift.employeeId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      isActive: true,
      status: { $ne: 'cancelled' },
      _id: { $ne: shift._id }, // Exclude current shift if updating
    });
  }

  // 1. Check for overlapping shifts
  const overlapping = existingShifts.filter((existing) => {
    return (
      (shift.startAt >= existing.startAt && shift.startAt < existing.endAt) ||
      (shift.endAt > existing.startAt && shift.endAt <= existing.endAt) ||
      (shift.startAt <= existing.startAt && shift.endAt >= existing.endAt)
    );
  });

  if (overlapping.length > 0) {
    conflicts.push({
      type: 'overlapping_shift',
      severity: 'error',
      message: `Employee has ${overlapping.length} overlapping shift(s)`,
      details: overlapping.map((s) => ({
        shiftId: s._id,
        startAt: s.startAt,
        endAt: s.endAt,
      })),
    });
  }

  // 2. Check max hours per day
  const dailyHours = await getEmployeeDailyHours(shift.employeeId, shift.startAt, shift._id);
  const shiftHours = calculateShiftHours(shift);
  const totalDailyHours = dailyHours + shiftHours;

  if (totalDailyHours > maxHoursPerDay) {
    const conflict = {
      type: 'max_hours_per_day',
      severity: strictMode ? 'error' : 'warning',
      message: `Total hours (${totalDailyHours.toFixed(1)}h) exceeds daily limit (${maxHoursPerDay}h)`,
      details: { dailyHours, shiftHours, totalDailyHours, maxHoursPerDay },
    };
    
    if (strictMode) {
      conflicts.push(conflict);
    } else {
      warnings.push(conflict);
    }
  }

  // 3. Check max hours per week
  const weeklyHours = await getEmployeeWeeklyHours(shift.employeeId, shift.startAt, shift._id);
  const totalWeeklyHours = weeklyHours + shiftHours;

  if (totalWeeklyHours > maxHoursPerWeek) {
    const conflict = {
      type: 'max_hours_per_week',
      severity: strictMode ? 'error' : 'warning',
      message: `Total weekly hours (${totalWeeklyHours.toFixed(1)}h) exceeds limit (${maxHoursPerWeek}h)`,
      details: { weeklyHours, shiftHours, totalWeeklyHours, maxHoursPerWeek },
    };
    
    if (strictMode) {
      conflicts.push(conflict);
    } else {
      warnings.push(conflict);
    }
  }

  // 4. Check minimum rest gap
  const restGapViolation = await validateRestGap(shift.employeeId, shift.startAt, shift.endAt, minRestGapHours, shift._id);
  
  if (restGapViolation) {
    const conflict = {
      type: 'insufficient_rest',
      severity: strictMode ? 'error' : 'warning',
      message: `Less than ${minRestGapHours}h rest between shifts`,
      details: restGapViolation,
    };
    
    if (strictMode) {
      conflicts.push(conflict);
    } else {
      warnings.push(conflict);
    }
  }

  // 5. Check role mismatch
  if (shift.employeeId) {
    const employee = await User.findById(shift.employeeId).select('role jobTitle');
    if (employee) {
      const roleMismatch = checkRoleMismatch(employee, shift.roleRequired);
      if (roleMismatch) {
        warnings.push({
          type: 'role_mismatch',
          severity: 'warning',
          message: roleMismatch.message,
          details: roleMismatch.details,
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    warnings,
  };
};

/**
 * Calculate shift duration in hours
 */
const calculateShiftHours = (shift) => {
  if (!shift.startAt || !shift.endAt) return 0;
  const durationMs = new Date(shift.endAt) - new Date(shift.startAt);
  const durationHours = durationMs / (1000 * 60 * 60);
  const breakHours = (shift.breakMinutes || 0) / 60;
  return Math.max(0, durationHours - breakHours);
};

/**
 * Get total hours worked by employee on a specific day
 */
export const getEmployeeDailyHours = async (employeeId, date, excludeShiftId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    employeeId,
    startAt: { $gte: startOfDay, $lte: endOfDay },
    isActive: true,
    status: { $ne: 'cancelled' },
  };

  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }

  const shifts = await Shift.find(query);
  
  return shifts.reduce((total, shift) => {
    return total + calculateShiftHours(shift);
  }, 0);
};

/**
 * Get total hours worked by employee in the week containing the given date
 */
export const getEmployeeWeeklyHours = async (employeeId, date, excludeShiftId = null) => {
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
  weekEnd.setHours(23, 59, 59, 999);

  const query = {
    employeeId,
    startAt: { $gte: weekStart, $lte: weekEnd },
    isActive: true,
    status: { $ne: 'cancelled' },
  };

  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }

  const shifts = await Shift.find(query);
  
  return shifts.reduce((total, shift) => {
    return total + calculateShiftHours(shift);
  }, 0);
};

/**
 * Validate minimum rest gap between shifts
 */
export const validateRestGap = async (employeeId, newShiftStart, newShiftEnd, minGapHours, excludeShiftId = null) => {
  const minGapMs = minGapHours * 60 * 60 * 1000;
  
  // Check shifts before the new shift
  const beforeQuery = {
    employeeId,
    endAt: { $lte: new Date(newShiftStart) },
    isActive: true,
    status: { $ne: 'cancelled' },
  };
  
  if (excludeShiftId) {
    beforeQuery._id = { $ne: excludeShiftId };
  }
  
  const shiftsBefore = await Shift.find(beforeQuery).sort({ endAt: -1 }).limit(1);
  
  if (shiftsBefore.length > 0) {
    const previousShift = shiftsBefore[0];
    const gap = new Date(newShiftStart) - new Date(previousShift.endAt);
    
    if (gap < minGapMs) {
      return {
        previousShiftId: previousShift._id,
        previousShiftEnd: previousShift.endAt,
        newShiftStart,
        gapHours: gap / (1000 * 60 * 60),
        requiredGapHours: minGapHours,
      };
    }
  }
  
  // Check shifts after the new shift
  const afterQuery = {
    employeeId,
    startAt: { $gte: new Date(newShiftEnd) },
    isActive: true,
    status: { $ne: 'cancelled' },
  };
  
  if (excludeShiftId) {
    afterQuery._id = { $ne: excludeShiftId };
  }
  
  const shiftsAfter = await Shift.find(afterQuery).sort({ startAt: 1 }).limit(1);
  
  if (shiftsAfter.length > 0) {
    const nextShift = shiftsAfter[0];
    const gap = new Date(nextShift.startAt) - new Date(newShiftEnd);
    
    if (gap < minGapMs) {
      return {
        nextShiftId: nextShift._id,
        nextShiftStart: nextShift.startAt,
        newShiftEnd,
        gapHours: gap / (1000 * 60 * 60),
        requiredGapHours: minGapHours,
      };
    }
  }
  
  return null;
};

/**
 * Check if employee's role matches the required role for the shift
 */
const checkRoleMismatch = (employee, roleRequired) => {
  // Map employee roles to shift role requirements
  const roleMapping = {
    cashier: 'cashier',
    employee: 'general', // Default for general employees
  };

  // Check jobTitle for specific employee types
  if (employee.role === 'employee') {
    if (employee.jobTitle === 'fuel_boy' && roleRequired === 'fuelBoy') {
      return null; // Match
    }
    if (employee.jobTitle === 'security_guard' && roleRequired === 'security') {
      return null; // Match
    }
  }

  const employeeRoleType = roleMapping[employee.role] || employee.role;

  if (employeeRoleType !== roleRequired && roleRequired !== 'general') {
    return {
      message: `Employee role (${employee.role}${employee.jobTitle ? '/' + employee.jobTitle : ''}) may not match shift requirement (${roleRequired})`,
      details: {
        employeeRole: employee.role,
        employeeJobTitle: employee.jobTitle,
        roleRequired,
      },
    };
  }

  return null;
};
