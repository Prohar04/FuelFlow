import api from "./api";

/**
 * Get current inventory stock levels
 * @param {string} pumpId - Optional pump ID (for admin)
 * @param {string} fuelType - Optional filter by fuel type
 * @returns {Promise} API response with inventory data
 */
export const getInventory = async (pumpId = null, fuelType = null) => {
  const params = new URLSearchParams();
  if (pumpId) params.append("pumpId", pumpId);
  if (fuelType) params.append("fuelType", fuelType);

  const response = await api.get(`/inventory?${params.toString()}`);
  return response.data;
};

/**
 * Create stock-in entry (refill)
 * @param {Object} data - Stock-in data
 * @param {string} data.fuelType - Type of fuel
 * @param {number} data.quantity - Quantity to add
 * @param {string} data.notes - Optional notes
 * @param {string} data.refId - Optional reference to order
 * @param {string} data.pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const createStockIn = async (data) => {
  const response = await api.post("/inventory/stock-in", data);
  return response.data;
};

/**
 * Create inventory adjustment
 * @param {Object} data - Adjustment data
 * @param {string} data.fuelType - Type of fuel
 * @param {number} data.quantity - Adjustment quantity (positive or negative)
 * @param {string} data.notes - Optional notes
 * @param {string} data.pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const createAdjustment = async (data) => {
  const response = await api.post("/inventory/adjustment", data);
  return response.data;
};

/**
 * Get inventory ledger history
 * @param {Object} filters - Filter options
 * @returns {Promise} API response with ledger entries
 */
export const getInventoryLedger = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.pumpId) params.append("pumpId", filters.pumpId);
  if (filters.fuelType) params.append("fuelType", filters.fuelType);
  if (filters.type) params.append("type", filters.type);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await api.get(`/inventory/ledger?${params.toString()}`);
  return response.data;
};

/**
 * Set low stock threshold
 * @param {Object} data - Threshold data
 * @param {string} data.fuelType - Type of fuel
 * @param {number} data.lowStockThreshold - Threshold value
 * @param {string} data.pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const setLowStockThreshold = async (data) => {
  const response = await api.post("/inventory/threshold", data);
  return response.data;
};
