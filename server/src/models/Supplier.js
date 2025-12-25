import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    // Basic Information
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternativePhone: {
      type: String,
      trim: true,
    },

    // Address Information
    address: {
      line1: {
        type: String,
        required: true,
        trim: true,
      },
      line2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: 'Bangladesh',
        trim: true,
      },
    },

    // Business Details
    fuelTypes: {
      type: [String],
      enum: ['Petrol', 'Diesel', 'Octane', 'CNG'],
      required: true,
      index: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Net 30',
    },
    creditLimit: {
      type: Number,
      min: 0,
    },
    minimumOrderQuantity: {
      type: Number,
      min: 0,
    },

    // Additional Information
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filter
supplierSchema.index({ companyName: 'text', contactPerson: 'text' });
supplierSchema.index({ fuelTypes: 1, status: 1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.address.line1,
    this.address.line2,
    this.address.city,
    this.address.state,
    this.address.postalCode,
    this.address.country,
  ].filter(Boolean);
  return parts.join(', ');
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
