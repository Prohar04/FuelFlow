import mongoose from 'mongoose';

const refillOrderSchema = new mongoose.Schema(
  {
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump',
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: [
      {
        fuelType: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Smart booking
    scheduledDeliveryDate: {
      type: Date,
    },
    scheduledDeliverySlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
    },
    status: {
      type: String,
      enum: ['created', 'emailed', 'pending', 'delivered', 'cancelled'],
      default: 'created',
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    // Email log
    emailLog: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      to: String,
      messageId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying orders by pump and status
refillOrderSchema.index({ pumpId: 1, status: 1, createdAt: -1 });

const RefillOrder = mongoose.model('RefillOrder', refillOrderSchema);

export default RefillOrder;
