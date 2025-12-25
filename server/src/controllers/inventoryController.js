import InventoryLedger from '../models/InventoryLedger.js';
import InventoryConfig from '../models/InventoryConfig.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Get current inventory stock levels
 * GET /api/inventory
 */
export const getInventory = async (req, res, next) => {
  try {
    const { pumpId, fuelType } = req.query;

    // Determine which pump to query
    let queryPumpId = pumpId;
    if (req.user.role === 'manager') {
      queryPumpId = req.user.pumpId;
    } else if (!pumpId && req.user.role === 'admin') {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required for admin users')
      );
    }

    // Build aggregation pipeline to calculate current stock
    const matchStage = { pumpId: queryPumpId };
    if (fuelType) matchStage.fuelType = fuelType;

    const stockLevels = await InventoryLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { pumpId: '$pumpId', fuelType: '$fuelType' },
          currentStock: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          _id: 0,
          pumpId: '$_id.pumpId',
          fuelType: '$_id.fuelType',
          currentStock: 1,
        },
      },
    ]);

    // Get low stock thresholds
    const configs = await InventoryConfig.find({ pumpId: queryPumpId });
    const configMap = new Map(configs.map(c => [c.fuelType, c.lowStockThreshold]));

    // Add low stock alerts
    const inventoryWithAlerts = stockLevels.map(stock => ({
      ...stock,
      lowStockThreshold: configMap.get(stock.fuelType) || 0,
      isLowStock: stock.currentStock < (configMap.get(stock.fuelType) || 0),
    }));

    return res.status(200).json(formatSuccess(inventoryWithAlerts));
  } catch (error) {
    next(error);
  }
};

/**
 * Create stock-in entry (refill)
 * POST /api/inventory/stock-in
 * Manager only
 */
export const createStockIn = async (req, res, next) => {
  try {
    const { fuelType, quantity, notes, refId } = req.body;

    // Validate input
    if (!fuelType || !quantity) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'FuelType and quantity are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required')
      );
    }

    // Create stock-in ledger entry
    const entry = await InventoryLedger.create({
      pumpId,
      fuelType,
      type: 'stock_in',
      quantity: Math.abs(quantity), // Ensure positive
      refType: refId ? 'order' : 'manual',
      refId: refId || undefined,
      notes,
    });

    return res.status(201).json(
      formatSuccess(entry, 'Stock-in entry created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create inventory adjustment
 * POST /api/inventory/adjustment
 * Admin/Manager only
 */
export const createAdjustment = async (req, res, next) => {
  try {
    const { fuelType, quantity, notes } = req.body;

    // Validate input
    if (!fuelType || quantity === undefined) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'FuelType and quantity are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required')
      );
    }

    // Create adjustment ledger entry
    const entry = await InventoryLedger.create({
      pumpId,
      fuelType,
      type: 'adjustment',
      quantity, // Can be positive or negative
      refType: 'manual',
      notes,
    });

    return res.status(201).json(
      formatSuccess(entry, 'Inventory adjustment created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory ledger history
 * GET /api/inventory/ledger
 */
export const getInventoryLedger = async (req, res, next) => {
  try {
    const { pumpId, fuelType, type, startDate, endDate } = req.query;

    // Determine which pump to query
    let queryPumpId = pumpId;
    if (req.user.role === 'manager') {
      queryPumpId = req.user.pumpId;
    }

    let query = {};
    if (queryPumpId) query.pumpId = queryPumpId;
    if (fuelType) query.fuelType = fuelType;
    if (type) query.type = type;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const ledger = await InventoryLedger.find(query)
      .populate('pumpId', 'name code')
      .sort({ createdAt: -1 })
      .limit(200); // Limit results

    return res.status(200).json(formatSuccess(ledger));
  } catch (error) {
    next(error);
  }
};

/**
 * Set/Update low stock threshold
 * POST /api/inventory/threshold
 * Manager only
 */
export const setLowStockThreshold = async (req, res, next) => {
  try {
    const { fuelType, lowStockThreshold } = req.body;

    if (!fuelType || lowStockThreshold === undefined) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'FuelType and lowStockThreshold are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required')
      );
    }

    // Upsert config
    const config = await InventoryConfig.findOneAndUpdate(
      { pumpId, fuelType },
      { lowStockThreshold },
      { upsert: true, new: true }
    );

    return res.status(200).json(
      formatSuccess(config, 'Low stock threshold updated successfully')
    );
  } catch (error) {
    next(error);
  }
};
