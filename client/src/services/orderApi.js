import api from "./api";

/**
 * Create a new refill order
 * @param {Object} orderData - Order data
 * @param {string} orderData.supplierId - Supplier ID
 * @param {Array} orderData.items - Array of { fuelType, quantity }
 * @param {string} orderData.scheduledDeliveryDate - Optional delivery date
 * @param {string} orderData.scheduledDeliverySlot - Optional slot: morning/afternoon/evening
 * @param {string} orderData.pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

/**
 * Get orders with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise} API response
 */
export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.pumpId) params.append("pumpId", filters.pumpId);
  if (filters.status) params.append("status", filters.status);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await api.get(`/orders?${params.toString()}`);
  return response.data;
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status: created/emailed/pending/delivered/cancelled
 * @returns {Promise} API response
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    // Re-throw with the original error so the component can access error.response
    throw error;
  }
};

/**
 * Get invoice for an order
 * @param {string} orderId - Order ID
 * @returns {Promise} API response
 */
export const getOrderInvoice = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/invoice`);
  return response.data;
};
