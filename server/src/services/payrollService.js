import Shift from '../models/Shift.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Payroll from '../models/Payroll.js';

/**
 * Calculate total hours worked from shifts for a given period
 * @param {ObjectId} userId - Employee user ID
 * @param {Date} periodStart - Start date of period
 * @param {Date} periodEnd - End date of period
 * @returns {Object} { totalHours, shiftHours: [{ shiftId, date, hours }] }
 */
export const calculateShiftHours = async (userId, periodStart, periodEnd) => {
  const shifts = await Shift.find({
    employeeId: userId,
    startAt: { $gte: periodStart, $lte: periodEnd },
    isActive: true,
  }).sort({ startAt: 1 });

  let totalHours = 0;
  const shiftHours = [];

  for (const shift of shifts) {
    // Use the virtual field computedHours which accounts for breaks
    const hours = shift.computedHours || 0;
    totalHours += hours;

    shiftHours.push({
      shiftId: shift._id,
      date: shift.startAt,
      hours: parseFloat(hours.toFixed(2)),
    });
  }

  return {
    totalHours: parseFloat(totalHours.toFixed(2)),
    shiftHours,
  };
};

/**
 * Get attendance summary for a given period
 * @param {ObjectId} userId - Employee user ID
 * @param {Date} periodStart - Start date of period
 * @param {Date} periodEnd - End date of period
 * @returns {Object} Attendance summary
 */
export const getAttendanceSummary = async (userId, periodStart, periodEnd) => {
  const attendanceRecords = await Attendance.find({
    userId,
    date: { $gte: periodStart, $lte: periodEnd },
  });

  return {
    totalDays: attendanceRecords.length,
    presentDays: attendanceRecords.filter((a) => a.status === 'present').length,
    absentDays: attendanceRecords.filter((a) => a.status === 'absent').length,
    lateDays: attendanceRecords.filter((a) => a.status === 'late').length,
    leaveDays: attendanceRecords.filter((a) => a.status === 'leave').length,
  };
};

/**
 * Calculate payroll for a single employee
 * @param {ObjectId} userId - Employee user ID
 * @param {ObjectId} pumpId - Pump ID
 * @param {Date} periodStart - Start date of period
 * @param {Date} periodEnd - End date of period
 * @param {Number} monthlySalary - Monthly salary for the employee
 * @param {Number} additionalDeductions - Optional additional deductions
 * @returns {Object} Payroll calculation data
 */
export const calculateEmployeePayroll = async (
  userId,
  pumpId,
  periodStart,
  periodEnd,
  monthlySalary,
  additionalDeductions = 0
) => {
  // Get shift hours (for reference only)
  const { totalHours, shiftHours } = await calculateShiftHours(
    userId,
    periodStart,
    periodEnd
  );

  // Get attendance summary
  const attendanceSummary = await getAttendanceSummary(
    userId,
    periodStart,
    periodEnd
  );

  // Calculate deductions based on attendance
  // Absent: -10 per day, Late: -5 per day
  const absentDeduction = attendanceSummary.absentDays * 10;
  const lateDeduction = attendanceSummary.lateDays * 5;
  const attendanceDeductions = absentDeduction + lateDeduction;
  
  // Calculate pay: Monthly Salary - Attendance Deductions - Additional Deductions
  const baseSalary = monthlySalary;
  const totalDeductions = attendanceDeductions + additionalDeductions;
  const grossPay = baseSalary;
  const netPay = grossPay - totalDeductions;

  return {
    userId,
    pumpId,
    periodStart,
    periodEnd,
    monthlySalary,
    totalHoursWorked: totalHours, // For reference
    shiftHours, // For reference
    baseSalary: parseFloat(baseSalary.toFixed(2)),
    attendanceSummary,
    absentDeduction: parseFloat(absentDeduction.toFixed(2)),
    lateDeduction: parseFloat(lateDeduction.toFixed(2)),
    attendanceDeductions: parseFloat(attendanceDeductions.toFixed(2)),
    grossPay: parseFloat(grossPay.toFixed(2)),
    deductions: parseFloat(totalDeductions.toFixed(2)),
    netPay: parseFloat(netPay.toFixed(2)),
    paymentStatus: 'pending',
  };
};

/**
 * Generate monthly payroll for all employees in a pump
 * @param {ObjectId} pumpId - Pump ID
 * @param {Date} periodStart - Start date of month
 * @param {Date} periodEnd - End date of month
 * @param {Object} options - Additional options
 * @returns {Array} Array of created payroll records
 */
export const generateMonthlyPayroll = async (
  pumpId,
  periodStart,
  periodEnd,
  options = {}
) => {
  // Get all active employees for this pump
  const employees = await User.find({
    pumpId,
    status: 'active',
    role: { $in: ['employee', 'cashier'] },
  });

  const payrollRecords = [];

  for (const employee of employees) {
    // Check if payroll already exists for this period
    const existingPayroll = await Payroll.findOne({
      userId: employee._id,
      pumpId,
      periodStart,
      periodEnd,
    });

    if (existingPayroll) {
      // Skip if already generated
      continue;
    }

    // Use employee's monthly salary
    const monthlySalary = employee.salary || 0;

    if (monthlySalary === 0) {
      // Skip employees without salary set
      continue;
    }

    // Calculate payroll
    const payrollData = await calculateEmployeePayroll(
      employee._id,
      pumpId,
      periodStart,
      periodEnd,
      monthlySalary,
      options.additionalDeductions || 0
    );

    // Create payroll record
    const payroll = await Payroll.create(payrollData);
    payrollRecords.push(payroll);
  }

  return payrollRecords;
};

// Keep the old name for backward compatibility
export const generateWeeklyPayroll = generateMonthlyPayroll;

/**
 * Get payroll summary for a pump
 * @param {ObjectId} pumpId - Pump ID
 * @param {Date} periodStart - Optional start date filter
 * @param {Date} periodEnd - Optional end date filter
 * @returns {Object} Payroll summary statistics
 */
export const getPayrollSummary = async (pumpId, periodStart, periodEnd) => {
  const query = { pumpId };

  if (periodStart && periodEnd) {
    query.periodStart = { $gte: periodStart };
    query.periodEnd = { $lte: periodEnd };
  }

  const payrolls = await Payroll.find(query);

  const summary = {
    totalPayrolls: payrolls.length,
    pendingPayrolls: payrolls.filter((p) => p.paymentStatus === 'pending').length,
    givenPayrolls: payrolls.filter((p) => p.paymentStatus === 'given').length,
    totalHoursWorked: payrolls.reduce((sum, p) => sum + p.totalHoursWorked, 0),
    totalGrossPay: payrolls.reduce((sum, p) => sum + p.grossPay, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions, 0),
    totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0),
    pendingAmount: payrolls
      .filter((p) => p.paymentStatus === 'pending')
      .reduce((sum, p) => sum + p.netPay, 0),
    givenAmount: payrolls
      .filter((p) => p.paymentStatus === 'given')
      .reduce((sum, p) => sum + p.netPay, 0),
  };

  return summary;
};
