import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fuelType: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Petrol", "Diesel", "Octane"
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      // Quantity in liters
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      // Price per liter
    },
    total: {
      type: Number,
      min: 0,
      // Total = quantity * unitPrice  (auto-calculated)
    },
    paymentMethod: {
      type: String,
      enum: ['cash'],
      default: 'cash',
      // v1 only supports cash, can be extended later
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total before saving
saleSchema.pre('save', function (next) {
  this.total = this.quantity * this.unitPrice;
  next();
});

// Index for querying sales by pump, cashier, and date
saleSchema.index({ pumpId: 1, createdAt: -1 });
saleSchema.index({ cashierId: 1, createdAt: -1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
