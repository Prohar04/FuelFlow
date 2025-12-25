import mongoose from 'mongoose';

const inventoryConfigSchema = new mongoose.Schema(
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
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      // Alert when current stock falls below this value (in liters)
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index - one config per fuel type per pump
inventoryConfigSchema.index({ pumpId: 1, fuelType: 1 }, { unique: true });

const InventoryConfig = mongoose.model('InventoryConfig', inventoryConfigSchema);

export default InventoryConfig;
