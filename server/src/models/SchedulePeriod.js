import mongoose from 'mongoose';

const schedulePeriodSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique periods per pump
schedulePeriodSchema.index({ pumpId: 1, startDate: 1, endDate: 1 }, { unique: true });

// Index for querying by pump and status
schedulePeriodSchema.index({ pumpId: 1, status: 1 });

const SchedulePeriod = mongoose.model('SchedulePeriod', schedulePeriodSchema);

export default SchedulePeriod;
