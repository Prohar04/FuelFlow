import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    refillOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefillOrder',
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      // Format: INV-PUMP-CODE/YYYYMMDD/XXXX
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup by invoice number
invoiceSchema.index({ invoiceNo: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
