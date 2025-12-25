import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
    },
    periodStart: {  
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    // Monthly salary for the employee
    monthlySalary: {
      type: Number,
      required: true,
      min: 0,
    },
    // Total hours worked during the period (for reference only)
    totalHoursWorked: {
      type: Number,
      default: 0,
    },
    // Breakdown of shifts for transparency
    shiftHours: [
      {
        shiftId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Shift',
        },
        date: Date,
        hours: Number,
      },
    ],
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    attendanceSummary: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 }, 
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
    },
    // Deduction for absent days (absent × 10)
    absentDeduction: {
      type: Number,
      default: 0,
    },
    // Deduction for late days (late × 5)
    lateDeduction: {
      type: Number,
      default: 0,
    },
    // Total attendance-based deductions
    attendanceDeductions: {
      type: Number,
      default: 0,
    },
    grossPay: {
      type: Number,
      required: true,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netPay: {
      type: Number,
      required: true,
      min: 0,
    },
    // Payment status tracking
    paymentStatus: {
      type: String,
      enum: ['pending', 'given'],
      default: 'pending',
      index: true,
    },
    // When payment was marked as given
    paidAt: {
      type: Date,
    },
    // Manager who marked payment as given
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying payroll by user, pump, and period
payrollSchema.index({ userId: 1, periodStart: -1 });
payrollSchema.index({ pumpId: 1, periodStart: -1 });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
