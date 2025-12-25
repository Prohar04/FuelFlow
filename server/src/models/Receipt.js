import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      // Format: PUMP-CODE/YYYYMMDD/XXXX
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup by receipt number
receiptSchema.index({ receiptNo: 1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
