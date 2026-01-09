import api from "./api";

/**
 * Create a new fuel sale
 * @param {Object} saleData - { fuelType, quantity, unitPrice }
 */
export const createSale = async (saleData) => {
  const response = await api.post("/sales", saleData);
  return response.data;
};

/**
 * Get sales history
 * @param {Object} filters - { fuelType, startDate, endDate }
 */
export const getSales = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.fuelType) params.append("fuelType", filters.fuelType);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await api.get(`/sales?${params.toString()}`);
  return response.data;
};

/**
 * Get sale by ID
 * @param {string} saleId
 */
export const getSaleById = async (saleId) => {
  const response = await api.get(`/sales/${saleId}`);
  return response.data;
};

/**
 * Get current fuel prices
 */
export const getCurrentPrices = async () => {
  const response = await api.get("/prices/current");
  return response.data;
};

/**
 * Get today's sales summary for cashier
 */
export const getTodaySalesSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const response = await api.get("/sales", {
    params: {
      startDate: today.toISOString(),
      endDate: new Date().toISOString(),
    },
  });

  return response.data;
};
