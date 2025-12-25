import mongoose from 'mongoose';

const pumpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pump name is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      match: [/^\d{3}$/, 'Pump code must be a 3-digit number'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Bangladesh',
      },
    },
    location: {
      street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['active', 'terminated'],
      default: 'active',
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

// Create geospatial index for location
pumpSchema.index({ location: '2dsphere' });

// Auto-generate pump code before saving
pumpSchema.pre('save', async function (next) {
  if (!this.isNew || this.code) {
    return next();
  }

  try {
    // Find the highest existing pump code
    const lastPump = await this.constructor
      .findOne({}, { code: 1 })
      .sort({ code: -1 })
      .lean();

    if (lastPump && lastPump.code) {
      const lastCode = parseInt(lastPump.code, 10);
      this.code = String(lastCode + 1).padStart(3, '0');
    } else {
      // First pump starts at 001
      this.code = '001';
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Pump = mongoose.model('Pump', pumpSchema);

export default Pump;
