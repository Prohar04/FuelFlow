import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema(
  {
    fuelType: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Petrol", "Diesel", "Octane"
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      // Price per liter
    },
    source: {
      type: String,
      enum: ['manual', 'api'],
      default: 'manual',
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for getting current prices
priceSchema.index({ fuelType: 1, effectiveFrom: -1 });

const Price = mongoose.model('Price', priceSchema);

export default Price;
