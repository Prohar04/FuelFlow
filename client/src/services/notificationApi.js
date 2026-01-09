import api, { handleApiError } from './api';

/**
 * Notification API Service
 */

// Get user's notifications
export const getNotifications = async (unreadOnly = false, limit = 50) => {
  try {
    const params = new URLSearchParams();
    params.append('unreadOnly', unreadOnly.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
