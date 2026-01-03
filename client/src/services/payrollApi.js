import api from './api';

/**
 * Generate weekly payroll for employees
 * @param {string} periodStart - Start date (YYYY-MM-DD)
 * @param {string} periodEnd - End date (YYYY-MM-DD)
 * @param {string} pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const generateWeeklyPayroll = async (periodStart, periodEnd, pumpId = null) => {
  const payload = { periodStart, periodEnd };
  if (pumpId) payload.pumpId = pumpId;
  
  const response = await api.post('/payroll/generate-weekly', payload);
  return response.data;
};

/**
 * Get payroll records with filters
 * @param {Object} filters - Filter options
 * @returns {Promise} API response
 */
export const getPayrolls = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.pumpId) params.append('pumpId', filters.pumpId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  
  const response = await api.get(`/payroll?${params.toString()}`);
  return response.data;
};

/**
 * Mark payroll as given
 * @param {string} payrollId - Payroll ID
 * @returns {Promise} API response
 */
export const markPayrollAsGiven = async (payrollId) => {
  const response = await api.patch(`/payroll/${payrollId}/mark-given`);
  return response.data;
};

/**
 * Get payroll summary statistics
 * @param {string} periodStart - Optional start date
 * @param {string} periodEnd - Optional end date
 * @param {string} pumpId - Optional pump ID (for admin)
 * @returns {Promise} API response
 */
export const getPayrollSummary = async (periodStart = null, periodEnd = null, pumpId = null) => {
  const params = new URLSearchParams();
  
  if (periodStart) params.append('periodStart', periodStart);
  if (periodEnd) params.append('periodEnd', periodEnd);
  if (pumpId) params.append('pumpId', pumpId);
  
  const response = await api.get(`/payroll/summary?${params.toString()}`);
  return response.data;
};

/**
 * Get current user's payroll
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise} API response
 */
export const getMyPayroll = async (startDate = null, endDate = null) => {
  const params = new URLSearchParams();
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await api.get(`/payroll/me?${params.toString()}`);
  return response.data;
};

/**
 * Get payslip details
 * @param {string} payrollId - Payroll ID
 * @returns {Promise} API response
 */
export const getPayslip = async (payrollId) => {
  const response = await api.get(`/payroll/${payrollId}/payslip`);
  return response.data;
};
