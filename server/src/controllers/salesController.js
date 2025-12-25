import Sale from '../models/Sale.js';
import Receipt from '../models/Receipt.js';
import InventoryLedger from '../models/InventoryLedger.js';
import Pump from '../models/Pump.js';
import { formatError, formatSuccess, generateReceiptNo } from '../utils/helpers.js';

/**
 * Create new sale
 * POST /api/sales
 * Cashier only
 */
export const createSale = async (req, res, next) => {
  try {
    const { fuelType, quantity, unitPrice } = req.body;

    // Validate input
    if (!fuelType || !quantity || !unitPrice) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'FuelType, quantity, and unitPrice are required')
      );
    }

    const pumpId = req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'User must be assigned to a pump')
      );
    }

    // Get pump details for receipt generation
    const pump = await Pump.findById(pumpId);

    if (!pump) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Pump not found')
      );
    }

    // Create sale
    const sale = await Sale.create({
      pumpId,
      cashierId: req.user._id,
      fuelType,
      quantity,
      unitPrice,
    });

    // Generate receipt number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dailyReceiptCount = await Receipt.countDocuments({
      receiptNo: new RegExp(`^${pump.code}/${today}/`),
    });

    const receiptNo = generateReceiptNo(pump.code, dailyReceiptCount + 1);

    // Create receipt
    const receipt = await Receipt.create({
      saleId: sale._id,
      receiptNo,
    });

    // Update sale with receipt ID
    sale.receiptId = receipt._id;
    await sale.save();

    // Create inventory stock-out ledger entry
    await InventoryLedger.create({
      pumpId,
      fuelType,
      type: 'stock_out',
      quantity: -quantity, // Negative for stock out
      refType: 'sale',
      refId: sale._id,
    });

    // Return sale with receipt
    const saleWithReceipt = await Sale.findById(sale._id)
      .populate('pumpId', 'name code address')
      .populate('cashierId', 'name email')
      .populate('receiptId');

    return res.status(201).json(
      formatSuccess(saleWithReceipt, 'Sale created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales (scoped by role)
 * GET /api/sales
 */
export const getSales = async (req, res, next) => {
  try {
    const { pumpId, cashierId, fuelType, startDate, endDate } = req.query;

    let query = {};

    // Apply filters
    if (pumpId) query.pumpId = pumpId;
    if (cashierId) query.cashierId = cashierId;
    if (fuelType) query.fuelType = fuelType;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'cashier') {
      query.cashierId = req.user._id;
    } else if (req.user.role === 'employee') {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Employees cannot access sales records')
      );
    }

    const sales = await Sale.find(query)
      .populate('pumpId', 'name code')
      .populate('cashierId', 'name email')
      .populate('receiptId')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to recent 100 sales

    return res.status(200).json(formatSuccess(sales));
  } catch (error) {
    next(error);
  }
};

/**
 * Get sale by ID
 * GET /api/sales/:id
 */
export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id)
      .populate('pumpId', 'name code address')
      .populate('cashierId', 'name email')
      .populate('receiptId');

    if (!sale) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Sale not found')
      );
    }

    // Check access
    if (req.user.role === 'manager') {
      if (sale.pumpId._id.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    } else if (req.user.role === 'cashier') {
      if (sale.cashierId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    } else if (req.user.role === 'employee') {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    return res.status(200).json(formatSuccess(sale));
  } catch (error) {
    next(error);
  }
};
