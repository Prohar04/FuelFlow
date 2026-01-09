import AuditLog from '../models/AuditLog.js';

/**
 * Audit logging service for tracking all shift-related changes
 */

/**
 * Log a shift change
 * @param {String} userId - ID of user making the change
 * @param {String} action - Action type (create, update, delete, publish, unpublish)
 * @param {String} shiftId - ID of the shift
 * @param {Object} changes - Before/after values
 * @param {String} reason - Reason for change (required for published shift edits)
 * @param {String} pumpId - ID of the pump
 */
export const logShiftChange = async (userId, action, shiftId, changes, reason, pumpId) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      action,
      entityType: 'shift',
      entityId: shiftId,
      changes,
      reason,
      pumpId,
    });
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not block operations
    return null;
  }
};

/**
 * Log a schedule period publish/unpublish
 * @param {String} userId - ID of user making the change
 * @param {String} action - Action type (publish or unpublish)
 * @param {String} scheduleId - ID of the schedule period
 * @param {String} pumpId - ID of the pump
 */
export const logSchedulePublish = async (userId, action, scheduleId, pumpId) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      action,
      entityType: 'schedulePeriod',
      entityId: scheduleId,
      pumpId,
    });
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Log a template change
 * @param {String} userId - ID of user making the change
 * @param {String} action - Action type (create, update, delete)
 * @param {String} templateId - ID of the template
 * @param {Object} changes - Before/after values
 * @param {String} pumpId - ID of the pump
 */
export const logTemplateChange = async (userId, action, templateId, changes, pumpId) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      action,
      entityType: 'template',
      entityId: templateId,
      changes,
      pumpId,
    });
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter criteria
 * @returns {Array} Audit logs
 */
export const getAuditLogs = async (filters = {}) => {
  const {
    pumpId,
    entityType,
    entityId,
    userId,
    startDate,
    endDate,
    limit = 100,
    skip = 0,
  } = filters;

  const query = {};

  if (pumpId) query.pumpId = pumpId;
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);

  return logs;
};

/**
 * Get audit logs for a specific shift
 * @param {String} shiftId - ID of the shift
 * @returns {Array} Audit logs for the shift
 */
export const getShiftAuditLogs = async (shiftId) => {
  return await getAuditLogs({
    entityType: 'shift',
    entityId: shiftId,
  });
};
