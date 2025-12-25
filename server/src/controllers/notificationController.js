import { formatError, formatSuccess } from '../utils/helpers.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../services/notificationService.js';

/**
 * Get user's notifications
 * GET /api/notifications
 * Authenticated users
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = 'false', limit = 50 } = req.query;

    const notifications = await getUserNotifications(
      req.user._id,
      unreadOnly === 'true',
      parseInt(limit)
    );

    const unreadCount = await getUnreadCount(req.user._id);

    return res.status(200).json(
      formatSuccess({
        notifications,
        unreadCount,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 * Authenticated users
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await markAsRead(id);

    if (!notification) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Notification not found')
      );
    }

    // Verify notification belongs to user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    return res.status(200).json(
      formatSuccess(notification, 'Notification marked as read')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 * Authenticated users
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user._id);

    return res.status(200).json(
      formatSuccess(
        { modifiedCount: result.modifiedCount },
        'All notifications marked as read'
      )
    );
  } catch (error) {
    next(error);
  }
};
