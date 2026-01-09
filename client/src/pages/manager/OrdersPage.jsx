import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderInvoice,
} from "../../services/orderApi";
import { getSuppliers } from "../../services/supplierApi";
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import "./OrdersPage.css";

// Fuel types
const FUEL_TYPES = ["Petrol", "Diesel", "Octane", "CNG", "LPG"];

// Delivery slots
const DELIVERY_SLOTS = [
  {
    value: "morning",
    label: "Morning (8AM - 12PM)",
    labelBn: "সকাল (৮টা - ১২টা)",
  },
  {
    value: "afternoon",
    label: "Afternoon (12PM - 5PM)",
    labelBn: "দুপুর (১২টা - ৫টা)",
  },
  {
    value: "evening",
    label: "Evening (5PM - 9PM)",
    labelBn: "সন্ধ্যা (৫টা - ৯টা)",
  },
];

// Status config
const STATUS_CONFIG = {
  created: {
    label: "Created",
    labelBn: "তৈরি",
    color: "#6b7280",
    icon: Clock,
  },
  emailed: {
    label: "Email Sent",
    labelBn: "ইমেল পাঠানো",
    color: "#3b82f6",
    icon: Mail,
  },
  pending: {
    label: "Pending",
    labelBn: "অপেক্ষমাণ",
    color: "#f59e0b",
    icon: Clock,
  },
  delivered: {
    label: "Delivered",
    labelBn: "সরবরাহ হয়েছে",
    color: "#10b981",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    labelBn: "বাতিল",
    color: "#ef4444",
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const { language } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create order form
  const [orderForm, setOrderForm] = useState({
    supplierId: "",
    items: [{ fuelType: "", quantity: "" }],
    scheduledDeliveryDate: "",
    scheduledDeliverySlot: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Expanded orders (for mobile view)
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const response = await getOrders(filters);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error(
        language === "bn" ? "অর্ডার লোড করতে ব্যর্থ" : "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers({ status: "active" });
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // Validate
    if (!orderForm.supplierId) {
      toast.error(
        language === "bn"
          ? "সাপ্লায়ার নির্বাচন করুন"
          : "Please select a supplier"
      );
      return;
    }

    const validItems = orderForm.items.filter(
      (item) => item.fuelType && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error(
        language === "bn"
          ? "অন্তত একটি জ্বালানি আইটেম যোগ করুন"
          : "Please add at least one fuel item"
      );
      return;
    }

    try {
      setFormLoading(true);
      await createOrder({
        supplierId: orderForm.supplierId,
        items: validItems.map((item) => ({
          fuelType: item.fuelType,
          quantity: parseFloat(item.quantity),
        })),
        scheduledDeliveryDate: orderForm.scheduledDeliveryDate || undefined,
        scheduledDeliverySlot: orderForm.scheduledDeliverySlot || undefined,
      });

      toast.success(
        language === "bn"
          ? "অর্ডার তৈরি এবং সাপ্লায়ারকে ইমেল পাঠানো হয়েছে"
          : "Order created and email sent to supplier"
      );
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn"
            ? "অর্ডার তৈরি করতে ব্যর্থ"
            : "Failed to create order")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    console.log("handleUpdateStatus called:", orderId, newStatus);

    const statusLabels = {
      pending: language === "bn" ? "অপেক্ষমাণ" : "pending",
      delivered: language === "bn" ? "সরবরাহ হয়েছে" : "delivered",
      cancelled: language === "bn" ? "বাতিল" : "cancelled",
    };

    const confirmed = window.confirm(
      language === "bn"
        ? `এই অর্ডার "${statusLabels[newStatus]}" হিসাবে চিহ্নিত করবেন?`
        : `Mark this order as "${newStatus}"?`
    );

    if (!confirmed) {
      console.log("User cancelled the confirmation");
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      console.log("Calling updateOrderStatus API...");
      const result = await updateOrderStatus(orderId, newStatus);
      console.log("API result:", result);
      toast.success(
        language === "bn"
          ? "অর্ডার স্ট্যাটাস আপডেট হয়েছে"
          : "Order status updated"
      );
      await fetchOrders();
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn"
            ? "স্ট্যাটাস আপডেট করতে ব্যর্থ"
            : "Failed to update status")
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const response = await getOrderInvoice(order._id);
      setSelectedOrder(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error(
        language === "bn"
          ? "অর্ডার বিস্তারিত লোড করতে ব্যর্থ"
          : "Failed to load order details"
      );
    }
  };

  const resetForm = () => {
    setOrderForm({
      supplierId: "",
      items: [{ fuelType: "", quantity: "" }],
      scheduledDeliveryDate: "",
      scheduledDeliverySlot: "",
    });
  };

  const addItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { fuelType: "", quantity: "" }],
    });
  };

  const removeItem = (index) => {
    if (orderForm.items.length > 1) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    setOrderForm({ ...orderForm, items: newItems });
  };

  const toggleExpand = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // Calculate order summary
  const orderSummary = {
    total: orders.length,
    pending: orders.filter(
      (o) => o.status === "pending" || o.status === "emailed"
    ).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <DashboardLayout role='manager'>
      <div className='orders-page'>
        {/* Header */}
        <div className='page-header'>
          <div>
            <h1>
              <ShoppingCart size={28} />
              {language === "bn" ? "জ্বালানি অর্ডার" : "Fuel Orders"}
            </h1>
            <p className='text-secondary'>
              {language === "bn"
                ? "সাপ্লায়ারদের কাছে জ্বালানি অর্ডার তৈরি ও ট্র্যাক করুন"
                : "Create and track fuel orders to suppliers"}
            </p>
          </div>
          <Button
            variant='primary'
            leftIcon={<Plus size={18} />}
            onClick={() => setShowCreateModal(true)}
          >
            {language === "bn" ? "নতুন অর্ডার" : "New Order"}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className='summary-cards'>
          <div className='summary-card'>
            <div className='summary-icon'>
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "মোট অর্ডার" : "Total Orders"}
              </p>
              <p className='summary-value'>{orderSummary.total}</p>
            </div>
          </div>

          <div className='summary-card pending'>
            <div className='summary-icon pending'>
              <Clock size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
              </p>
              <p className='summary-value'>{orderSummary.pending}</p>
            </div>
          </div>

          <div className='summary-card delivered'>
            <div className='summary-icon delivered'>
              <Truck size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "সরবরাহ হয়েছে" : "Delivered"}
              </p>
              <p className='summary-value'>{orderSummary.delivered}</p>
            </div>
          </div>

          <div className='summary-card cancelled'>
            <div className='summary-icon cancelled'>
              <XCircle size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "বাতিল" : "Cancelled"}
              </p>
              <p className='summary-value'>{orderSummary.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='filters-bar'>
          <div className='filter-group'>
            <label>{language === "bn" ? "স্ট্যাটাস:" : "Status:"}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='input'
            >
              <option value=''>{language === "bn" ? "সব" : "All"}</option>
              <option value='created'>
                {language === "bn" ? "তৈরি" : "Created"}
              </option>
              <option value='emailed'>
                {language === "bn" ? "ইমেল পাঠানো" : "Email Sent"}
              </option>
              <option value='pending'>
                {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
              </option>
              <option value='delivered'>
                {language === "bn" ? "সরবরাহ হয়েছে" : "Delivered"}
              </option>
              <option value='cancelled'>
                {language === "bn" ? "বাতিল" : "Cancelled"}
              </option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className='orders-container'>
          {loading ? (
            <div className='loading-state'>
              <ShoppingCart size={48} />
              <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading orders..."}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className='empty-state'>
              <ShoppingCart size={64} />
              <h3>
                {language === "bn" ? "কোন অর্ডার নেই" : "No Orders Found"}
              </h3>
              <p>
                {statusFilter
                  ? language === "bn"
                    ? "এই ফিল্টারে কোন অর্ডার নেই"
                    : "No orders match this filter"
                  : language === "bn"
                  ? "প্রথম অর্ডার তৈরি করুন"
                  : "Create your first order to get started"}
              </p>
              {!statusFilter && (
                <Button
                  variant='primary'
                  leftIcon={<Plus size={18} />}
                  onClick={() => setShowCreateModal(true)}
                >
                  {language === "bn" ? "নতুন অর্ডার" : "New Order"}
                </Button>
              )}
            </div>
          ) : (
            <div className='orders-list'>
              {orders.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status]?.icon || Clock;
                const isExpanded = expandedOrders.has(order._id);

                return (
                  <div
                    key={order._id}
                    className={`order-card status-${order.status}`}
                  >
                    <div
                      className='order-header'
                      onClick={() => toggleExpand(order._id)}
                    >
                      <div className='order-info'>
                        <div className='order-ref'>
                          <FileText size={18} />
                          <span>{order.invoiceId?.invoiceNo || "N/A"}</span>
                        </div>
                        <span
                          className='status-badge'
                          style={{
                            background: `${
                              STATUS_CONFIG[order.status]?.color
                            }20`,
                            color: STATUS_CONFIG[order.status]?.color,
                          }}
                        >
                          <StatusIcon size={14} />
                          {language === "bn"
                            ? STATUS_CONFIG[order.status]?.labelBn
                            : STATUS_CONFIG[order.status]?.label}
                        </span>
                      </div>
                      <div className='order-meta'>
                        <span className='supplier-name'>
                          {order.supplierId?.companyName || "Unknown Supplier"}
                        </span>
                        <span className='order-date'>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className='expand-toggle'>
                        {isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='order-details'>
                        {/* Items */}
                        <div className='detail-section'>
                          <h4>
                            <Package size={16} />
                            {language === "bn" ? "আইটেম" : "Items"}
                          </h4>
                          <div className='items-list'>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className='item-row'>
                                <span className='fuel-type'>
                                  {item.fuelType}
                                </span>
                                <span className='quantity'>
                                  {item.quantity?.toLocaleString()} L
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        {order.scheduledDeliveryDate && (
                          <div className='detail-section'>
                            <h4>
                              <Calendar size={16} />
                              {language === "bn" ? "ডেলিভারি" : "Delivery"}
                            </h4>
                            <p>
                              {formatDate(order.scheduledDeliveryDate)}
                              {order.scheduledDeliverySlot &&
                                ` (${
                                  DELIVERY_SLOTS.find(
                                    (s) =>
                                      s.value === order.scheduledDeliverySlot
                                  )?.[
                                    language === "bn" ? "labelBn" : "label"
                                  ] || order.scheduledDeliverySlot
                                })`}
                            </p>
                          </div>
                        )}

                        {/* Email Status */}
                        {order.emailLog?.sent && (
                          <div className='detail-section'>
                            <h4>
                              <Mail size={16} />
                              {language === "bn" ? "ইমেল" : "Email"}
                            </h4>
                            <p className='email-info'>
                              {language === "bn"
                                ? "পাঠানো হয়েছে:"
                                : "Sent to:"}{" "}
                              {order.emailLog.to}
                              <br />
                              <small>
                                {formatDateTime(order.emailLog.sentAt)}
                              </small>
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div
                          className='order-actions'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant='secondary'
                            size='sm'
                            leftIcon={<Eye size={16} />}
                            onClick={() => handleViewDetails(order)}
                          >
                            {language === "bn" ? "বিস্তারিত" : "Details"}
                          </Button>

                          {(order.status === "created" ||
                            order.status === "emailed" ||
                            order.status === "pending") && (
                            <>
                              <Button
                                variant='primary'
                                size='sm'
                                leftIcon={<Truck size={16} />}
                                loading={updatingOrderId === order._id}
                                disabled={updatingOrderId !== null}
                                onClick={() =>
                                  handleUpdateStatus(order._id, "delivered")
                                }
                              >
                                {language === "bn"
                                  ? "সরবরাহ হয়েছে"
                                  : "Mark Delivered"}
                              </Button>
                              <Button
                                variant='danger'
                                size='sm'
                                leftIcon={<XCircle size={16} />}
                                loading={updatingOrderId === order._id}
                                disabled={updatingOrderId !== null}
                                onClick={() =>
                                  handleUpdateStatus(order._id, "cancelled")
                                }
                              >
                                {language === "bn" ? "বাতিল" : "Cancel"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Order Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title={
            language === "bn" ? "নতুন অর্ডার তৈরি করুন" : "Create New Order"
          }
          size='lg'
        >
          <form onSubmit={handleCreateOrder} className='order-form'>
            {/* Supplier Selection */}
            <div className='form-group'>
              <label>{language === "bn" ? "সাপ্লায়ার" : "Supplier"} *</label>
              <select
                value={orderForm.supplierId}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, supplierId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>
                  {language === "bn"
                    ? "সাপ্লায়ার নির্বাচন করুন"
                    : "Select supplier"}
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.companyName} (
                    {supplier.fuelTypes?.join(", ") || "All fuels"})
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className='form-hint warning'>
                  {language === "bn"
                    ? "কোন সাপ্লায়ার নেই। প্রথমে সাপ্লায়ার যোগ করুন।"
                    : "No suppliers found. Add suppliers first."}
                </p>
              )}
            </div>

            {/* Fuel Items */}
            <div className='form-group'>
              <label>
                {language === "bn" ? "জ্বালানি আইটেম" : "Fuel Items"} *
              </label>
              <div className='items-form'>
                {orderForm.items.map((item, index) => (
                  <div key={index} className='item-row-form'>
                    <select
                      value={item.fuelType}
                      onChange={(e) =>
                        updateItem(index, "fuelType", e.target.value)
                      }
                      className='input fuel-select'
                      required
                    >
                      <option value=''>
                        {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Type"}
                      </option>
                      {FUEL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type='number'
                      min='1'
                      placeholder={
                        language === "bn" ? "পরিমাণ (L)" : "Quantity (L)"
                      }
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      className='input quantity-input'
                      required
                    />
                    {orderForm.items.length > 1 && (
                      <button
                        type='button'
                        className='btn-icon danger'
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  leftIcon={<Plus size={16} />}
                  onClick={addItem}
                >
                  {language === "bn" ? "আরও আইটেম যোগ করুন" : "Add More Items"}
                </Button>
              </div>
            </div>

            {/* Scheduled Delivery */}
            <div className='form-row'>
              <div className='form-group'>
                <label>
                  {language === "bn"
                    ? "ডেলিভারি তারিখ (ঐচ্ছিক)"
                    : "Delivery Date (Optional)"}
                </label>
                <input
                  type='date'
                  value={orderForm.scheduledDeliveryDate}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      scheduledDeliveryDate: e.target.value,
                    })
                  }
                  className='input'
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className='form-group'>
                <label>
                  {language === "bn"
                    ? "সময়সূচি (ঐচ্ছিক)"
                    : "Time Slot (Optional)"}
                </label>
                <select
                  value={orderForm.scheduledDeliverySlot}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      scheduledDeliverySlot: e.target.value,
                    })
                  }
                  className='input'
                >
                  <option value=''>
                    {language === "bn"
                      ? "সময় নির্বাচন করুন"
                      : "Select time slot"}
                  </option>
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {language === "bn" ? slot.labelBn : slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='form-info'>
              <Mail size={16} />
              <span>
                {language === "bn"
                  ? "অর্ডার তৈরির পর সাপ্লায়ারকে স্বয়ংক্রিয়ভাবে ইমেল পাঠানো হবে"
                  : "An email will be automatically sent to the supplier after order creation"}
              </span>
            </div>

            <div className='modal-actions'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button
                type='submit'
                variant='primary'
                loading={formLoading}
                disabled={suppliers.length === 0}
              >
                {language === "bn" ? "অর্ডার তৈরি করুন" : "Create Order"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Order Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          title={language === "bn" ? "অর্ডার বিস্তারিত" : "Order Details"}
          size='lg'
        >
          {selectedOrder && (
            <div className='order-details-modal'>
              {/* Header */}
              <div className='details-header'>
                <div>
                  <h3>{selectedOrder.invoiceId?.invoiceNo}</h3>
                  <p className='text-secondary'>
                    {language === "bn" ? "তৈরি হয়েছে:" : "Created:"}{" "}
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <span
                  className='status-badge large'
                  style={{
                    background: `${
                      STATUS_CONFIG[selectedOrder.status]?.color
                    }20`,
                    color: STATUS_CONFIG[selectedOrder.status]?.color,
                  }}
                >
                  {language === "bn"
                    ? STATUS_CONFIG[selectedOrder.status]?.labelBn
                    : STATUS_CONFIG[selectedOrder.status]?.label}
                </span>
              </div>

              {/* Supplier Info */}
              <div className='details-section'>
                <h4>
                  {language === "bn"
                    ? "সাপ্লায়ার তথ্য"
                    : "Supplier Information"}
                </h4>
                <div className='info-grid'>
                  <div>
                    <label>{language === "bn" ? "নাম" : "Name"}</label>
                    <p>{selectedOrder.supplierId?.companyName}</p>
                  </div>
                  <div>
                    <label>{language === "bn" ? "ইমেল" : "Email"}</label>
                    <p>{selectedOrder.supplierId?.email}</p>
                  </div>
                  <div>
                    <label>{language === "bn" ? "ফোন" : "Phone"}</label>
                    <p>{selectedOrder.supplierId?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className='details-section'>
                <h4>{language === "bn" ? "অর্ডার আইটেম" : "Order Items"}</h4>
                <table className='items-table'>
                  <thead>
                    <tr>
                      <th>
                        {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Type"}
                      </th>
                      <th>{language === "bn" ? "পরিমাণ" : "Quantity"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.fuelType}</td>
                        <td>{item.quantity?.toLocaleString()} L</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <strong>{language === "bn" ? "মোট" : "Total"}</strong>
                      </td>
                      <td>
                        <strong>
                          {(selectedOrder.items || [])
                            .reduce(
                              (sum, item) => sum + (item.quantity || 0),
                              0
                            )
                            .toLocaleString()}{" "}
                          L
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Delivery Schedule */}
              {selectedOrder.scheduledDeliveryDate && (
                <div className='details-section'>
                  <h4>
                    {language === "bn"
                      ? "ডেলিভারি সময়সূচি"
                      : "Delivery Schedule"}
                  </h4>
                  <p>
                    <Calendar size={16} />
                    {formatDate(selectedOrder.scheduledDeliveryDate)}
                    {selectedOrder.scheduledDeliverySlot && (
                      <>
                        {" - "}
                        {
                          DELIVERY_SLOTS.find(
                            (s) =>
                              s.value === selectedOrder.scheduledDeliverySlot
                          )?.[language === "bn" ? "labelBn" : "label"]
                        }
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Email Log */}
              {selectedOrder.emailLog?.sent && (
                <div className='details-section'>
                  <h4>{language === "bn" ? "ইমেল লগ" : "Email Log"}</h4>
                  <div className='email-log'>
                    <CheckCircle size={16} color='#10b981' />
                    <span>
                      {language === "bn" ? "পাঠানো হয়েছে" : "Sent to"}{" "}
                      <strong>{selectedOrder.emailLog.to}</strong>
                      <br />
                      <small>
                        {formatDateTime(selectedOrder.emailLog.sentAt)}
                      </small>
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {(selectedOrder.status === "created" ||
                selectedOrder.status === "emailed" ||
                selectedOrder.status === "pending") && (
                <div className='details-actions'>
                  <Button
                    variant='primary'
                    leftIcon={<Truck size={18} />}
                    loading={updatingOrderId === selectedOrder._id}
                    disabled={updatingOrderId !== null}
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, "delivered")
                    }
                  >
                    {language === "bn"
                      ? "সরবরাহ হয়েছে চিহ্নিত করুন"
                      : "Mark as Delivered"}
                  </Button>
                  <Button
                    variant='danger'
                    leftIcon={<XCircle size={18} />}
                    loading={updatingOrderId === selectedOrder._id}
                    disabled={updatingOrderId !== null}
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, "cancelled")
                    }
                  >
                    {language === "bn" ? "অর্ডার বাতিল করুন" : "Cancel Order"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
