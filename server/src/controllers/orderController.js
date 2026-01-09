import RefillOrder from "../models/RefillOrder.js";
import Invoice from "../models/Invoice.js";
import Supplier from "../models/Supplier.js";
import Pump from "../models/Pump.js";
import InventoryLedger from "../models/InventoryLedger.js";
import {
  formatError,
  formatSuccess,
  generateInvoiceNo,
} from "../utils/helpers.js";
import { sendSupplierOrderEmail } from "../utils/email.js";

/**
 * Create refill order
 * POST /api/orders
 * Manager only
 */
export const createOrder = async (req, res, next) => {
  try {
    const { supplierId, items, scheduledDeliveryDate, scheduledDeliverySlot } =
      req.body;

    // Validate input
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json(
          formatError(
            "VALIDATION_ERROR",
            "SupplierId and items array are required"
          )
        );
    }

    const pumpId =
      req.user.role === "admin" ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res
        .status(400)
        .json(formatError("VALIDATION_ERROR", "PumpId is required"));
    }

    // Verify supplier exists and is active
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res
        .status(404)
        .json(formatError("NOT_FOUND", "Supplier not found"));
    }

    if (supplier.status !== "active") {
      return res
        .status(400)
        .json(formatError("VALIDATION_ERROR", "Supplier is not active"));
    }

    // Get pump details
    const pump = await Pump.findById(pumpId);

    // Create refill order
    const order = await RefillOrder.create({
      pumpId,
      managerId: req.user._id,
      supplierId,
      items,
      scheduledDeliveryDate: scheduledDeliveryDate
        ? new Date(scheduledDeliveryDate)
        : undefined,
      scheduledDeliverySlot,
      status: "created",
    });

    // Generate unique invoice number with retry logic
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    let invoice = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!invoice && attempts < maxAttempts) {
      attempts++;
      const dailyInvoiceCount = await Invoice.countDocuments({
        invoiceNo: new RegExp(`^INV-${pump.code}/${today}/`),
      });

      const invoiceNo = generateInvoiceNo(
        pump.code,
        dailyInvoiceCount + attempts
      );

      try {
        invoice = await Invoice.create({
          refillOrderId: order._id,
          invoiceNo,
        });
      } catch (err) {
        // If duplicate key error, retry with next number
        if (err.code === 11000) {
          console.log(`Invoice ${invoiceNo} already exists, retrying...`);
          continue;
        }
        throw err;
      }
    }

    if (!invoice) {
      // Clean up the order if invoice creation failed
      await RefillOrder.findByIdAndDelete(order._id);
      return res
        .status(500)
        .json(formatError("SERVER_ERROR", "Failed to generate invoice number"));
    }

    // Update order with invoice ID
    order.invoiceId = invoice._id;
    await order.save();

    // Send email to supplier
    try {
      const emailResult = await sendSupplierOrderEmail({
        toEmail: supplier.email,
        supplierName: supplier.companyName,
        pumpName: pump.name,
        pumpAddress: pump.address
          ? `${pump.address.street || ""}, ${pump.address.city || ""}, ${
              pump.address.state || ""
            }, ${pump.address.zipCode || ""}`.trim()
          : "N/A",
        managerEmail: req.user.email,
        orderRefNo: invoiceNo,
        items,
        scheduledDate: scheduledDeliveryDate
          ? new Date(scheduledDeliveryDate).toLocaleDateString()
          : null,
        scheduledSlot: scheduledDeliverySlot || null,
      });

      // Update email log
      order.emailLog = {
        sent: true,
        sentAt: new Date(),
        to: supplier.email,
        messageId: emailResult.messageId,
      };
      order.status = "emailed";
      await order.save();
    } catch (emailError) {
      console.error("Failed to send supplier order email:", emailError);
      // Don't fail order creation if email fails
    }

    // Return order with populated fields
    const populatedOrder = await RefillOrder.findById(order._id)
      .populate("pumpId", "name code address")
      .populate("managerId", "name email")
      .populate("supplierId")
      .populate("invoiceId");

    return res
      .status(201)
      .json(
        formatSuccess(
          populatedOrder,
          "Order created and email sent to supplier"
        )
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

    let query = {};

    // Scope by role
    if (req.user.role === "manager") {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === "admin" && pumpId) {
      query.pumpId = pumpId;
    }
    // Admin without pumpId gets all orders

    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await RefillOrder.find(query)
      .populate("pumpId", "name code")
      .populate("managerId", "name email")
      .populate("supplierId")
      .populate("invoiceId")
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
      return res
        .status(400)
        .json(formatError("VALIDATION_ERROR", "Status is required"));
    }

    // Validate status value
    const validStatuses = [
      "created",
      "emailed",
      "pending",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json(
          formatError(
            "VALIDATION_ERROR",
            `Invalid status. Must be one of: ${validStatuses.join(", ")}`
          )
        );
    }

    const order = await RefillOrder.findById(id);

    if (!order) {
      return res.status(404).json(formatError("NOT_FOUND", "Order not found"));
    }

    // Check pump access for managers
    const userPumpId = req.user.pumpId?.toString();
    const orderPumpId = order.pumpId?.toString();

    if (req.user.role === "manager" && orderPumpId !== userPumpId) {
      return res.status(403).json(formatError("FORBIDDEN", "Access denied"));
    }

    // Prevent updating already delivered or cancelled orders
    if (order.status === "delivered" || order.status === "cancelled") {
      return res
        .status(400)
        .json(
          formatError(
            "VALIDATION_ERROR",
            `Cannot update order with status: ${order.status}`
          )
        );
    }

    // Update status
    order.status = status;
    await order.save();

    // If status is delivered, create inventory stock-in entries
    if (status === "delivered") {
      for (const item of order.items) {
        await InventoryLedger.create({
          pumpId: order.pumpId,
          fuelType: item.fuelType,
          type: "stock_in",
          quantity: item.quantity,
          refType: "order",
          refId: order._id,
        });
      }
    }

    const populatedOrder = await RefillOrder.findById(id)
      .populate("pumpId", "name code")
      .populate("managerId", "name email")
      .populate("supplierId")
      .populate("invoiceId");

    return res
      .status(200)
      .json(formatSuccess(populatedOrder, "Order status updated successfully"));
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
      .populate("pumpId", "name code address")
      .populate("managerId", "name email")
      .populate("supplierId")
      .populate("invoiceId");

    if (!order) {
      return res.status(404).json(formatError("NOT_FOUND", "Order not found"));
    }

    // Check pump access
    if (
      req.user.role === "manager" &&
      order.pumpId._id.toString() !== req.user.pumpId?.toString()
    ) {
      return res.status(403).json(formatError("FORBIDDEN", "Access denied"));
    }

    return res.status(200).json(formatSuccess(order));
  } catch (error) {
    next(error);
  }
};
