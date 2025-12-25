import { verifyAccessToken } from '../utils/jwt.js';
import { formatError } from '../utils/helpers.js';
import User from '../models/User.js';

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        formatError('UNAUTHORIZED', 'No authentication token provided')
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json(
        formatError('UNAUTHORIZED', 'Invalid or expired token')
      );
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json(
        formatError('UNAUTHORIZED', 'User not found')
      );
    }

    if (user.status === 'terminated') {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Your account has been terminated')
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(
      formatError('INTERNAL_ERROR', 'Authentication failed')
    );
  }
};

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth middleware
 * @param {...string} allowedRoles - Allowed roles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        formatError('UNAUTHORIZED', 'Authentication required')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        formatError(
          'FORBIDDEN',
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Middleware to check pump scope access
 * Ensures managers can only access their assigned pump
 * Admins can access all pumps
 * Must be used after requireAuth middleware
 * 
 * Usage: Place after requireAuth. The route should have pumpId in params, body, or query.
 * This middleware will check req.params.pumpId, req.body.pumpId, or req.query.pumpId
 */
export const requirePumpScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(
      formatError('UNAUTHORIZED', 'Authentication required')
    );
  }

  // Admin has access to all pumps
  if (req.user.role === 'admin') {
    return next();
  }

  // Get pumpId from request (check params, body, and query)
  const resourcePumpId = req.params.pumpId || req.body.pumpId || req.query.pumpId;

  if (!resourcePumpId) {
    // If no pumpId in request, allow (will be filtered at controller level)
    return next();
  }

  // Check if user's pump matches resource pump
  if (!req.user.pumpId || req.user.pumpId.toString() !== resourcePumpId.toString()) {
    return res.status(403).json(
      formatError(
        'FORBIDDEN',
        'You do not have permission to access resources for this pump'
      )
    );
  }

  next();
};

/**
 * Optional auth middleware - attaches user if token is valid but doesn't require it
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-passwordHash');

      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (error) {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if error
  }
};
