import Price from '../models/Price.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Get current fuel prices (public)
 * GET /api/prices/current
 */
export const getCurrentPrices = async (req, res, next) => {
  try {
    // Get the latest price for each fuel type where effectiveFrom is <= today
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const prices = await Price.aggregate([
      {
        $match: {
          effectiveFrom: { $lte: today },
        },
      },
      {
        $sort: { fuelType: 1, effectiveFrom: -1 },
      },
      {
        $group: {
          _id: '$fuelType',
          latestPrice: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: { newRoot: '$latestPrice' },
      },
      {
        $project: {
          fuelType: 1,
          unitPrice: 1,
          effectiveFrom: 1,
          source: 1,
        },
      },
    ]);

    return res.status(200).json(formatSuccess(prices));
  } catch (error) {
    next(error);
  }
};

/**
 * Create/Update fuel price
 * POST /api/prices
 * Admin only
 */
export const createPrice = async (req, res, next) => {
  try {
    const { fuelType, unitPrice, effectiveFrom } = req.body;

    // Validate input
    if (!fuelType || unitPrice === undefined) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'FuelType and unitPrice are required')
      );
    }

    const price = await Price.create({
      fuelType,
      unitPrice,
      source: 'manual',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      createdBy: req.user._id,
    });

    return res.status(201).json(
      formatSuccess(price, 'Price created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get price history for a fuel type
 * GET /api/prices/history
 * Admin only
 */
export const getPriceHistory = async (req, res, next) => {
  try {
    const { fuelType } = req.query;

    let query = {};
    if (fuelType) query.fuelType = fuelType;

    const prices = await Price.find(query)
      .populate('createdBy', 'name email')
      .sort({ effectiveFrom: -1 })
      .limit(100);

    return res.status(200).json(formatSuccess(prices));
  } catch (error) {
    next(error);
  }
};
