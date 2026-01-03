import api, { handleApiError } from './api';

/**
 * Shift API Service
 */

// Create a new shift
export const createShift = async (shiftData) => {
  try {
    const response = await api.post('/shifts', shiftData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get all shifts (with optional filters)
export const getShifts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.pumpId) params.append('pumpId', filters.pumpId);
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.roleRequired) params.append('roleRequired', filters.roleRequired);
    if (filters.includeInactive) params.append('includeInactive', filters.includeInactive);

    const response = await api.get(`/shifts?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get current user's shifts
export const getMyShifts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);

    const response = await api.get(`/shifts/me?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update a shift
export const updateShift = async (id, shiftData) => {
  try {
    const response = await api.patch(`/shifts/${id}`, shiftData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete a shift (soft delete)
export const deleteShift = async (id) => {
  try {
    const response = await api.delete(`/shifts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Bulk create shifts (for recurring shifts)
export const bulkCreateShifts = async (bulkData) => {
  try {
    const response = await api.post('/shifts/bulk', bulkData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get shifts by weekday
export const getShiftsByWeekday = async (day) => {
  try {
    const response = await api.get(`/shifts/weekday/${day}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Check for shift conflicts without creating
export const checkShiftConflicts = async (shiftData) => {
  try {
    const response = await api.post('/shifts/check-conflicts', shiftData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Bulk publish shifts
export const bulkPublishShifts = async (shiftIds) => {
  try {
    const response = await api.patch('/shifts/bulk-publish', { shiftIds });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get unpublished (draft) shifts
export const getUnpublishedShifts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.pumpId) params.append('pumpId', filters.pumpId);

    const response = await api.get(`/shifts/unpublished?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

