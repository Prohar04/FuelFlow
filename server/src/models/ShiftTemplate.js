import mongoose from 'mongoose';

const shiftTemplateSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
      // Templates are pump-specific
    },
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Morning Shift", "Night Shift", "Weekend Shift"
    },
    description: {
      type: String,
      trim: true,
      // Optional description of the template
    },
    startTime: {
      type: String,
      required: true,
      // Format: "HH:MM" (24-hour format)
    },
    endTime: {
      type: String,
      required: true,
      // Format: "HH:MM" (24-hour format)
    },
    roleRequired: {
      type: String,
      enum: ['cashier', 'fuelBoy', 'security', 'general'],
      required: true,
      // Role required for shifts created from this template
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
      // Total break time in minutes
    },
    recurrence: {
      type: {
        type: String,
        enum: ['none', 'daily', 'weekly'],
        default: 'none',
      },
      weekdays: [
        {
          type: Number,
          min: 0,
          max: 6,
          // For weekly recurrence: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        },
      ],
    },
    // Legacy fields kept for backward compatibility
    weekdays: [
      {
        type: Number,
        min: 0,
        max: 6,
        // Default weekdays for this template
        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      },
    ],
    breaks: {
      lunch: {
        startTime: {
          type: String,
          // Format: "HH:MM"
        },
        endTime: {
          type: String,
          // Format: "HH:MM"
        },
        duration: {
          type: Number,
          // Duration in minutes
        },
      },
      other: [
        {
          name: {
            type: String,
            trim: true,
            // e.g., "Tea Break", "Prayer Break"
          },
          startTime: {
            type: String,
            // Format: "HH:MM"
          },
          endTime: {
            type: String,
            // Format: "HH:MM"
          },
          duration: {
            type: Number,
            // Duration in minutes
          },
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
      // For soft deletion
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Manager who created this template
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying templates by pump
shiftTemplateSchema.index({ pumpId: 1, isActive: 1 });

const ShiftTemplate = mongoose.model('ShiftTemplate', shiftTemplateSchema);

export default ShiftTemplate;
