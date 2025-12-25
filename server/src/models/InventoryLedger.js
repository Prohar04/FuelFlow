import mongoose from 'mongoose';

const inventoryLedgerSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
    },
    fuelType: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['stock_in', 'stock_out', 'adjustment'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Positive for stock_in, negative for stock_out and adjustment
    },
    refType: {
      type: String,
      enum: ['sale', 'order', 'manual'],
      // Reference type indicating what triggered this ledger entry
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      // Reference to Sale, RefillOrder, or null for manual adjustments
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying inventory by pump and fuel type
inventoryLedgerSchema.index({ pumpId: 1, fuelType: 1, createdAt: -1 });

const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);

export default InventoryLedger;
