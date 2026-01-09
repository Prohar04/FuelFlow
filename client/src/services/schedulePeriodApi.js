import api, { handleApiError } from './api';

/**
 * Schedule Period API Service
 */

// Create a new schedule period
export const createSchedulePeriod = async (periodData) => {
  try {
    const response = await api.post('/schedule-periods', periodData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get all schedule periods (with optional filters)
export const getSchedulePeriods = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.pumpId) params.append('pumpId', filters.pumpId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/schedule-periods?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Publish a schedule period
export const publishSchedulePeriod = async (id) => {
  try {
    const response = await api.post(`/schedule-periods/${id}/publish`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Unpublish a schedule period (admin only)
export const unpublishSchedulePeriod = async (id) => {
  try {
    const response = await api.post(`/schedule-periods/${id}/unpublish`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
