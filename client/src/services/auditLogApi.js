import api, { handleApiError } from './api';

/**
 * Audit Log API Service
 */

// Get audit logs (manager/admin only)
export const getAuditLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.pumpId) params.append('pumpId', filters.pumpId);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());

    const response = await api.get(`/audit-logs?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
