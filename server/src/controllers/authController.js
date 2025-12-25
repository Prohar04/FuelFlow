import User from '../models/User.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import { formatError, formatSuccess } from '../utils/helpers.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import crypto from 'crypto';

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Email and password are required')
      );
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+passwordHash').populate('pumpId', 'name code');

    if (!user) {
      return res.status(401).json(
        formatError('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    }

    // Check if account is terminated
    if (user.status === 'terminated') {
      return res.status(403).json(
        formatError('ACCOUNT_TERMINATED', 'Your account has been terminated')
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json(
        formatError('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle,
      pumpId: user.pumpId,
      status: user.status,
      preferences: user.preferences, // Include preferences
    };

    return res.status(200).json(
      formatSuccess(
        {
          user: userData,
          accessToken,
          refreshToken,
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Refresh token is required')
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json(
        formatError('INVALID_TOKEN', 'Invalid or expired refresh token')
      );
    }

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json(
        formatError('USER_NOT_FOUND', 'User not found')
      );
    }

    if (user.status === 'terminated') {
      return res.status(403).json(
        formatError('ACCOUNT_TERMINATED', 'Your account has been terminated')
      );
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    return res.status(200).json(
      formatSuccess(tokens, 'Token refreshed successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token deletion)
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    // In JWT-based auth, logout is handled client-side by deleting tokens
    // This endpoint exists for consistency and potential future use (e.g., token blacklisting)

    return res.status(200).json(
      formatSuccess(null, 'Logout successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Email is required')
      );
    }

    // Find user
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json(
        formatSuccess(
          null,
          'If the email exists, a password reset link has been sent'
        )
      );
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        name: user.name,
        resetToken,
      });

      return res.status(200).json(
        formatSuccess(
          null,
          'If the email exists, a password reset link has been sent'
        )
      );
    } catch (emailError) {
      // If email fails, clear reset token
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Failed to send password reset email:', emailError);

      return res.status(500).json(
        formatError('EMAIL_ERROR', 'Failed to send password reset email')
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Token and new password are required')
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json(
        formatError('WEAK_PASSWORD', 'Password must be at least 8 characters long')
      );
    }

    // Hash the token from request
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() },
    }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');

    if (!user) {
      return res.status(400).json(
        formatError('INVALID_TOKEN', 'Invalid or expired reset token')
      );
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.lastPasswordChangeAt = new Date();
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    return res.status(200).json(
      formatSuccess(null, 'Password reset successful')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password for logged-in user
 * POST /api/auth/change-password
 * Requires authentication
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Current password and new password are required')
      );
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json(
        formatError('WEAK_PASSWORD', 'Password must be at least 6 characters long')
      );
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json(
        formatError('INVALID_PASSWORD', 'Current password is incorrect')
      );
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.lastPasswordChangeAt = new Date();
    await user.save();

    return res.status(200).json(
      formatSuccess(null, 'Password changed successfully')
    );
  } catch (error) {
    next(error);
  }
};
