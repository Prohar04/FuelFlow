import { formatError, formatSuccess } from '../utils/helpers.js';
import { getAuditLogs } from '../services/auditLogService.js';

/**
 * Get audit logs
 * GET /api/audit-logs
 * Manager/Admin only
 */
export const getAuditLogsController = async (req, res, next) => {
  try {
    const {
      entityType,
      entityId,
      startDate,
      endDate,
      limit = 100,
      skip = 0,
    } = req.query;

    // Build filters
    const filters = {
      limit: parseInt(limit),
      skip: parseInt(skip),
    };

    // Scope by user role
    if (req.user.role === 'manager') {
      filters.pumpId = req.user.pumpId;
    } else if (req.user.role === 'admin' && req.query.pumpId) {
      filters.pumpId = req.query.pumpId;
    }

    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const logs = await getAuditLogs(filters);

    return res.status(200).json(formatSuccess(logs));
  } catch (error) {
    next(error);
  }
};
