import Notification from '../models/Notification.js';
import Shift from '../models/Shift.js';
import User from '../models/User.js';

/**
 * Notification service for in-app notifications
 */

/**
 * Create a notification
 * @param {String} userId - Recipient user ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} metadata - Additional data
 */
const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      metadata,
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Notify employee of new shift assignment
 * @param {String} employeeId - Employee ID
 * @param {String} shiftId - Shift ID
 */
export const notifyShiftAssigned = async (employeeId, shiftId) => {
  const shift = await Shift.findById(shiftId).populate('pumpId', 'name');
  
  if (!shift) return null;

  const shiftDate = new Date(shift.startAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const shiftTime = `${new Date(shift.startAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${new Date(shift.endAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return await createNotification(
    employeeId,
    'shift_assigned',
    'New Shift Assigned',
    `You have been assigned a shift at ${shift.pumpId?.name || 'your pump'} on ${shiftDate} from ${shiftTime}`,
    {
      shiftId: shift._id,
      shiftDate: shift.startAt,
      shiftTime,
      pumpId: shift.pumpId?._id,
      pumpName: shift.pumpId?.name,
    }
  );
};

/**
 * Notify employee of shift update
 * @param {String} employeeId - Employee ID
 * @param {String} shiftId - Shift ID
 * @param {Object} changes - What changed
 */
export const notifyShiftUpdated = async (employeeId, shiftId, changes = {}) => {
  const shift = await Shift.findById(shiftId).populate('pumpId', 'name');
  
  if (!shift) return null;

  const shiftDate = new Date(shift.startAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  let changeMessage = 'Your shift has been updated';
  if (changes.time) {
    changeMessage = 'Your shift time has been changed';
  } else if (changes.date) {
    changeMessage = 'Your shift date has been changed';
  }

  return await createNotification(
    employeeId,
    'shift_updated',
    'Shift Updated',
    `${changeMessage} for ${shiftDate} at ${shift.pumpId?.name || 'your pump'}`,
    {
      shiftId: shift._id,
      shiftDate: shift.startAt,
      changes,
      pumpId: shift.pumpId?._id,
    }
  );
};

/**
 * Notify employee of shift cancellation
 * @param {String} employeeId - Employee ID
 * @param {String} shiftId - Shift ID
 */
export const notifyShiftCancelled = async (employeeId, shiftId) => {
  const shift = await Shift.findById(shiftId).populate('pumpId', 'name');
  
  if (!shift) return null;

  const shiftDate = new Date(shift.startAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return await createNotification(
    employeeId,
    'shift_cancelled',
    'Shift Cancelled',
    `Your shift on ${shiftDate} at ${shift.pumpId?.name || 'your pump'} has been cancelled`,
    {
      shiftId: shift._id,
      shiftDate: shift.startAt,
      pumpId: shift.pumpId?._id,
    }
  );
};

/**
 * Notify all employees when schedule is published
 * @param {Array} employeeIds - Array of employee IDs
 * @param {String} scheduleId - Schedule period ID
 * @param {Date} startDate - Schedule start date
 * @param {Date} endDate - Schedule end date
 * @param {String} pumpName - Pump name
 */
export const notifySchedulePublished = async (employeeIds, scheduleId, startDate, endDate, pumpName) => {
  const periodText = `${new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  const notifications = employeeIds.map((employeeId) =>
    createNotification(
      employeeId,
      'schedule_published',
      'Schedule Published',
      `The work schedule for ${periodText} at ${pumpName} has been published`,
      {
        scheduleId,
        startDate,
        endDate,
        periodText,
      }
    )
  );

  return await Promise.all(notifications);
};

/**
 * Get user's notifications
 * @param {String} userId - User ID
 * @param {Boolean} unreadOnly - Only return unread notifications
 * @param {Number} limit - Maximum number of notifications to return
 */
export const getUserNotifications = async (userId, unreadOnly = false, limit = 50) => {
  const query = { userId };
  
  if (unreadOnly) {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return notifications;
};

/**
 * Mark notification as read
 * @param {String} notificationId - Notification ID
 */
export const markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );

  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User ID
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true }
  );

  return result;
};

/**
 * Get unread notification count for a user
 * @param {String} userId - User ID
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    userId,
    read: false,
  });

  return count;
};
