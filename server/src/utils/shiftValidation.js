/**
 * Shift validation utilities
 */

/**
 * Validate time range (startTime must be before endTime)
 * Note: Handles overnight shifts (e.g., 22:00 - 06:00)
 */
export const validateTimeRange = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // For overnight shifts, endTime can be "less than" startTime
  // We'll allow this but flag it
  const isOvernightShift = endMinutes < startMinutes;

  return {
    valid: true, // We allow overnight shifts
    isOvernightShift,
    startMinutes,
    endMinutes,
  };
};

/**
 * Validate that breaks are within shift hours and don't overlap
 */
export const validateBreaks = (startTime, endTime, breaks) => {
  const errors = [];
  const { startMinutes, endMinutes, isOvernightShift } = validateTimeRange(startTime, endTime);

  const allBreaks = [];

  // Add lunch break if exists
  if (breaks?.lunch?.startTime && breaks?.lunch?.endTime) {
    allBreaks.push({
      name: 'Lunch',
      startTime: breaks.lunch.startTime,
      endTime: breaks.lunch.endTime,
    });
  }

  // Add other breaks
  if (breaks?.other && Array.isArray(breaks.other)) {
    breaks.other.forEach((b, idx) => {
      if (b.startTime && b.endTime) {
        allBreaks.push({
          name: b.name || `Break ${idx + 1}`,
          startTime: b.startTime,
          endTime: b.endTime,
        });
      }
    });
  }

  // Validate each break
  allBreaks.forEach((breakItem) => {
    const [breakStartHour, breakStartMin] = breakItem.startTime.split(':').map(Number);
    const [breakEndHour, breakEndMin] = breakItem.endTime.split(':').map(Number);

    const breakStartMinutes = breakStartHour * 60 + breakStartMin;
    const breakEndMinutes = breakEndHour * 60 + breakEndMin;

    // Check if break end is after break start
    if (breakEndMinutes <= breakStartMinutes) {
      errors.push(`${breakItem.name}: End time must be after start time`);
    }

    // Check if break is within shift hours (simplified check for non-overnight)
    if (!isOvernightShift) {
      if (breakStartMinutes < startMinutes || breakStartMinutes > endMinutes) {
        errors.push(`${breakItem.name}: Start time is outside shift hours`);
      }
      if (breakEndMinutes < startMinutes || breakEndMinutes > endMinutes) {
        errors.push(`${breakItem.name}: End time is outside shift hours`);
      }
    }
  });

  // Check for overlapping breaks
  for (let i = 0; i < allBreaks.length; i++) {
    for (let j = i + 1; j < allBreaks.length; j++) {
      const break1 = allBreaks[i];
      const break2 = allBreaks[j];

      const [b1StartHour, b1StartMin] = break1.startTime.split(':').map(Number);
      const [b1EndHour, b1EndMin] = break1.endTime.split(':').map(Number);
      const [b2StartHour, b2StartMin] = break2.startTime.split(':').map(Number);
      const [b2EndHour, b2EndMin] = break2.endTime.split(':').map(Number);

      const b1Start = b1StartHour * 60 + b1StartMin;
      const b1End = b1EndHour * 60 + b1EndMin;
      const b2Start = b2StartHour * 60 + b2StartMin;
      const b2End = b2EndHour * 60 + b2EndMin;

      // Check for overlap
      if ((b1Start < b2End && b1End > b2Start) || (b2Start < b1End && b2End > b1Start)) {
        errors.push(`${break1.name} and ${break2.name} overlap`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate weekdays array
 */
export const validateWeekdays = (weekdays) => {
  if (!Array.isArray(weekdays)) {
    return { valid: false, error: 'Weekdays must be an array' };
  }

  if (weekdays.length === 0) {
    return { valid: false, error: 'At least one weekday must be selected' };
  }

  const invalidDays = weekdays.filter((day) => day < 0 || day > 6 || !Number.isInteger(day));

  if (invalidDays.length > 0) {
    return { valid: false, error: 'Weekdays must be integers between 0 and 6' };
  }

  // Check for duplicates
  const uniqueDays = [...new Set(weekdays)];
  if (uniqueDays.length !== weekdays.length) {
    return { valid: false, error: 'Duplicate weekdays found' };
  }

  return { valid: true };
};

/**
 * Check if an employee is already assigned to another shift at the same time
 * This is a helper that should be called with database query results
 */
export const checkEmployeeConflicts = (newShift, existingShifts, employeeIds) => {
  const conflicts = [];

  employeeIds.forEach((employeeId) => {
    const employeeIdStr = employeeId.toString();

    existingShifts.forEach((existingShift) => {
      // Skip if same shift (for updates)
      if (newShift._id && existingShift._id.toString() === newShift._id.toString()) {
        return;
      }

      // Check if employee is assigned to this existing shift
      const isAssigned = existingShift.assignedUserIds.some(
        (id) => id.toString() === employeeIdStr
      );

      if (!isAssigned) return;

      // Check if dates match
      const newDate = new Date(newShift.date).toDateString();
      const existingDate = new Date(existingShift.date).toDateString();

      if (newDate !== existingDate) return;

      // Check if times overlap
      const [newStartHour, newStartMin] = newShift.startTime.split(':').map(Number);
      const [newEndHour, newEndMin] = newShift.endTime.split(':').map(Number);
      const [existingStartHour, existingStartMin] = existingShift.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMin] = existingShift.endTime.split(':').map(Number);

      const newStart = newStartHour * 60 + newStartMin;
      const newEnd = newEndHour * 60 + newEndMin;
      const existingStart = existingStartHour * 60 + existingStartMin;
      const existingEnd = existingEndHour * 60 + existingEndMin;

      // Check for time overlap
      if ((newStart < existingEnd && newEnd > existingStart) || 
          (existingStart < newEnd && existingEnd > newStart)) {
        conflicts.push({
          employeeId: employeeIdStr,
          conflictingShift: existingShift,
          message: `Employee already assigned to "${existingShift.shiftName}" on ${existingDate} from ${existingShift.startTime} to ${existingShift.endTime}`,
        });
      }
    });
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

/**
 * Calculate break duration in minutes from start and end time
 */
export const calculateBreakDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
};
