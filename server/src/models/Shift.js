import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      // Single employee per shift (changed from assignedUserIds array)
    },
    roleRequired: {
      type: String,
      enum: ['cashier', 'fuelBoy', 'security', 'general'],
      required: true,
      // Role required for this shift
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
      // Full DateTime for shift start
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startAt;
        },
        message: 'End time must be after start time',
      },
      // Full DateTime for shift end
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
      // Total break time in minutes (simplified from breaks object)
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'draft',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      // Optional notes for the shift
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Manager who created this shift
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Manager who last updated this shift
    },
    changeReason: {
      type: String,
      trim: true,
      // Required when editing a published shift
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      // For soft deletion
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to compute shift duration in hours
shiftSchema.virtual('computedHours').get(function () {
  if (!this.startAt || !this.endAt) return 0;
  const durationMs = this.endAt - this.startAt;
  const durationHours = durationMs / (1000 * 60 * 60);
  const breakHours = (this.breakMinutes || 0) / 60;
  return Math.max(0, durationHours - breakHours);
});

// Ensure virtuals are included in JSON output
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

// Compound indexes for efficient querying
shiftSchema.index({ pumpId: 1, startAt: 1 });
shiftSchema.index({ employeeId: 1, startAt: 1 });
shiftSchema.index({ pumpId: 1, status: 1, startAt: 1 });

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;
