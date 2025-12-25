import User from '../models/User.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Get current user's preferences
 * GET /api/preferences/me
 */
export const getMyPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    return res.status(200).json(formatSuccess(user.preferences));
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's preferences
 * PATCH /api/preferences/me
 */
export const updateMyPreferences = async (req, res, next) => {
  try {
    const { language, theme } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Update preferences
    if (language && ['en', 'bn'].includes(language)) {
      user.preferences.language = language;
    }

    if (theme && ['system', 'dark', 'light'].includes(theme)) {
      user.preferences.theme = theme;
    }

    await user.save();

    return res.status(200).json(
      formatSuccess(user.preferences, 'Preferences updated successfully')
    );
  } catch (error) {
    next(error);
  }
};
