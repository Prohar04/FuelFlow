import crypto from 'crypto';

/**
 * Generate a temporary password for new employees
 * @returns {string} Random temporary password
 */
export const generateTempPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // 16 character hex string
};

/**
 * Generate receipt number
 * Format: PUMP-CODE/YYYYMMDD/XXXX
 * @param {string} pumpCode - 3-digit pump code
 * @param {number} dailyCounter - Daily counter for receipts
 * @returns {string} Receipt number
 */
export const generateReceiptNo = (pumpCode, dailyCounter) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const counter = String(dailyCounter).padStart(4, '0');

  return `${pumpCode}/${year}${month}${day}/${counter}`;
};

/**
 * Generate invoice number
 * Format: INV-PUMP-CODE/YYYYMMDD/XXXX
 * @param {string} pumpCode - 3-digit pump code
 * @param {number} dailyCounter - Daily counter for invoices
 * @returns {string} Invoice number
 */
export const generateInvoiceNo = (pumpCode, dailyCounter) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const counter = String(dailyCounter).padStart(4, '0');

  return `INV-${pumpCode}/${year}${month}${day}/${counter}`;
};

/**
 * Check if user has permission to access a resource for a specific pump
 * @param {Object} user - User object with role and pumpId
 * @param {string} resourcePumpId - Pump ID of the resource being accessed
 * @returns {boolean} Whether user has access
 */
export const checkPumpAccess = (user, resourcePumpId) => {
  // Admin can access all pumps
  if (user.role === 'admin') {
    return true;
  }

  // Others can only access their assigned pump
  return user.pumpId && user.pumpId.toString() === resourcePumpId.toString();
};

/**
 * Format error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error object
 */
export const formatError = (code, message, details = null) => {
  const error = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    error.error.details = details;
  }

  return error;
};

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success object
 */
export const formatSuccess = (data, message = null) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};
