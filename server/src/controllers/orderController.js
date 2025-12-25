import RefillOrder from '../models/RefillOrder.js';
import Invoice from '../models/Invoice.js';
import Supplier from '../models/Supplier.js';
import Pump from '../models/Pump.js';
import InventoryLedger from '../models/InventoryLedger.js';
import { formatError, formatSuccess, generateInvoiceNo } from '../utils/helpers.js';
import { sendSupplierOrderEmail } from '../utils/email.js';

/**
 * Create refill order
 * POST /api/orders
 * Manager only
 */
export const createOrder = async (req, res, next) => {
  try {
    const { supplierId, items, scheduledDeliveryDate, scheduledDeliverySlot } = req.body;

    // Validate input
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'SupplierId and items array are required')
      );
    }

    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required')
      );
    }

    // Verify supplier exists and belongs to this pump
    const supplier = await Supplier.findById(supplierId);
    if (!supplier || supplier.pumpId.toString() !== pumpId.toString()) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Supplier not found or does not belong to this pump')
      );
    }

    // Get pump details
    const pump = await Pump.findById(pumpId);

    // Create refill order
    const order = await RefillOrder.create({
      pumpId,
      managerId: req.user._id,
      supplierId,
      items,
      scheduledDeliveryDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : undefined,
      scheduledDeliverySlot,
      status: 'created',
    });

    // Generate invoice number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dailyInvoiceCount = await Invoice.countDocuments({
      invoiceNo: new RegExp(`^INV-${pump.code}/${today}/`),
    });

    const invoiceNo = generateInvoiceNo(pump.code, dailyInvoiceCount + 1);

    // Create invoice
    const invoice = await Invoice.create({
      refillOrderId: order._id,
      invoiceNo,
    });

    // Update order with invoice ID
    order.invoiceId = invoice._id;
    await order.save();

    // Send email to supplier
    try {
      const emailResult = await sendSupplierOrderEmail({
        toEmail: supplier.email,
        supplierName: supplier.name,
        pumpName: pump.name,
        pumpAddress: pump.address ? 
          `${pump.address.street || ''}, ${pump.address.city || ''}, ${pump.address.state || ''}, ${pump.address.zipCode || ''}`.trim() 
          : 'N/A',
        managerEmail: req.user.email,
        orderRefNo: invoiceNo,
        items,
        scheduledDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate).toLocaleDateString() : null,
        scheduledSlot: scheduledDeliverySlot || null,
      });

      // Update email log
      order.emailLog = {
        sent: true,
        sentAt: new Date(),
        to: supplier.email,
        messageId: emailResult.messageId,
      };
      order.status = 'emailed';
      await order.save();
    } catch (emailError) {
      console.error('Failed to send supplier order email:', emailError);
      // Don't fail order creation if email fails
    }

    // Return order with populated fields
    const populatedOrder = await RefillOrder.findById(order._id)
      .populate('pumpId', 'name code address')
      .populate('managerId', 'name email') 
      .populate('supplierId')
      .populate('invoiceId');

    return res.status(201).json(
      formatSuccess(populatedOrder, 'Order created and email sent to supplier')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders (scoped by pump)
 * GET /api/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const { pumpId, status, startDate, endDate } = req.query;

    let queryPumpId = pumpId;
    if (req.user.role === 'manager') {
      queryPumpId = req.user.pumpId;
    }

    if (!queryPumpId && req.user.role === 'admin') {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required for admin users')
      );
    }

    let query = { pumpId: queryPumpId };

    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await RefillOrder.find(query)
      .populate('pumpId', 'name code')
      .populate('managerId', 'name email')
      .populate('supplierId')
      .populate('invoiceId')
      .sort({ createdAt: -1 });

    return res.status(200).json(formatSuccess(orders));
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PATCH /api/orders/:id/status
 * Manager only
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Status is required')
      );
    }

    const order = await RefillOrder.findById(id);

    if (!order) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Order not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && order.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    // Update status
    order.status = status;
    await order.save();

    // If status is delivered, create inventory stock-in entries
    if (status === 'delivered') {
      for (const item of order.items) {
        await InventoryLedger.create({
          pumpId: order.pumpId,
          fuelType: item.fuelType,
          type: 'stock_in',
          quantity: item.quantity,
          refType: 'order',
          refId: order._id,
        });
      }
    }

    const populatedOrder = await RefillOrder.findById(id)
      .populate('pumpId', 'name code')
      .populate('managerId', 'name email')
      .populate('supplierId')
      .populate('invoiceId');

    return res.status(200).json(
      formatSuccess(populatedOrder, 'Order status updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice for an order
 * GET /api/orders/:id/invoice
 */
export const getOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await RefillOrder.findById(id)
      .populate('pumpId', 'name code address')
      .populate('managerId', 'name email')
      .populate('supplierId')
      .populate('invoiceId');

    if (!order) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Order not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && order.pumpId._id.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    return res.status(200).json(formatSuccess(order));
  } catch (error) {
    next(error);
  }
};
