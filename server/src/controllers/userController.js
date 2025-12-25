import User from '../models/User.js';
import Pump from '../models/Pump.js';
import { formatError, formatSuccess, generateTempPassword } from '../utils/helpers.js';
import { sendOnboardingEmail, sendTerminationEmail, sendReinstatementEmail } from '../utils/email.js';

/**
 * Create new user/employee
 * POST /api/users
 * Admin can create any user, Manager can create employees for their pump only
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, role, jobTitle, pumpId } = req.body;

    // Validate input
    if (!name || !email || !role) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Name, email, and role are required')
      );
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'cashier', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', `Role must be one of: ${validRoles.join(', ')}`)
      );
    }

    // Non-admin roles require pumpId
    if (role !== 'admin' && !pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Pump assignment is required for non-admin roles')
      );
    }

    // Manager can only create employees and cashiers for their own pump (not managers or admins)
    if (req.user.role === 'manager') {
      if (role === 'admin' || role === 'manager') {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Managers can only create employee and cashier accounts (not managers or admins)')
        );
      }

      if (pumpId !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Managers can only create employees for their assigned pump')
        );
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json(
        formatError('DUPLICATE_ERROR', 'Email already exists')
      );
    }

    // Verify pump exists
    if (pumpId) {
      const pump = await Pump.findById(pumpId);
      if (!pump) {
        return res.status(404).json(
          formatError('NOT_FOUND', 'Pump not found')
        );
      }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: tempPassword, // Will be hashed by pre-save hook
      role,
      jobTitle,
      pumpId: pumpId || null,
    });

    // Get pump details for email
    const pump = pumpId ? await Pump.findById(pumpId) : null;

    // Send onboarding email
    try {
      await sendOnboardingEmail({
        toEmail: user.email,
        name: user.name,
        role: user.role,
        pumpName: pump?.name || 'FuelFlow System',
        tempPassword,
      });
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't fail user creation if email fails
    }

    // Return user without password
    const userResponse = await User.findById(user._id).populate('pumpId', 'name code');

    return res.status(201).json(
      formatSuccess(userResponse, 'User created successfully and onboarding email sent')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (scoped by role)
 * GET /api/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, pumpId, status } = req.query;

    let query = {};

    // Apply filters
    if (role) query.role = role;
    if (status) query.status = status;

    // Scope by user role
    if (req.user.role === 'manager') {
      // Manager sees only users from their pump
      query.pumpId = req.user.pumpId;
    } else if (pumpId && req.user.role === 'admin') {
      // Admin can filter by pump
      query.pumpId = pumpId;
    }

    const users = await User.find(query)
      .populate('pumpId', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json(formatSuccess(users));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/users/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('pumpId', 'name code address');

    return res.status(200).json(formatSuccess(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate('pumpId', 'name code address');

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Check access: admin can see all, manager can see only their pump users, others see only self
    if (req.user.role === 'admin') {
      // Admin can see all
    } else if (req.user.role === 'manager') {
      if (user.pumpId?.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    } else {
      if (user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    }

    return res.status(200).json(formatSuccess(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PATCH /api/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, jobTitle, pumpId, salary } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'manager') {
      if (user.pumpId?.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    } else if (req.user.role !== 'admin') {
      // Non-admin, non-manager can only update self
      if (user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Access denied')
        );
      }
    }

    // Prevent managers and admins from changing their own role or pump assignment
    const isSelfUpdate = user._id.toString() === req.user._id.toString();
    const isManagerOrAdmin = req.user.role === 'manager' || req.user.role === 'admin';
    
    if (isSelfUpdate && isManagerOrAdmin) {
      if (role && role !== user.role) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'You cannot change your own role. Contact a system administrator.')
        );
      }
      
      if (pumpId && pumpId !== user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'You cannot change your own pump assignment. Contact a system administrator.')
        );
      }
    }

    // Validate salary if provided
    if (salary !== undefined) {
      if (salary < 0) {
        return res.status(400).json(
          formatError('VALIDATION_ERROR', 'Salary must be a positive number')
        );
      }
    }

    // Track changes for employment history
    const changes = {};
    if (role && role !== user.role) changes.role = role;
    if (jobTitle && jobTitle !== user.jobTitle) changes.jobTitle = jobTitle;
    if (pumpId && pumpId !== user.pumpId?.toString()) changes.pumpId = pumpId;

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (jobTitle) user.jobTitle = jobTitle;
    if (pumpId) user.pumpId = pumpId;
    if (salary !== undefined) user.salary = salary;

    // Add to employment history if role/pump changed
    if (changes.role || changes.pumpId) {
      user.addEmploymentHistory(
        changes.role || user.role,
        changes.jobTitle || user.jobTitle,
        changes.pumpId || user.pumpId,
        'Updated by admin/manager'
      );
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate('pumpId', 'name code');

    return res.status(200).json(
      formatSuccess(updatedUser, 'User updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate user
 * POST /api/users/:id/terminate
 */
export const terminateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'manager') {
      if (user.pumpId?.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Managers can only terminate employees from their pump')
        );
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Only admin and managers can terminate users')
      );
    }

    // Prevent self-termination
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json(
        formatError('INVALID_OPERATION', 'You cannot terminate yourself')
      );
    }

    // Update user status
    user.status = 'terminated';
    user.terminationDate = new Date();
    user.terminationReason = reason || 'No reason provided';

    // Add to employment history
    user.addEmploymentHistory(
      user.role,
      user.jobTitle,
      user.pumpId,
      `Terminated: ${user.terminationReason}`
    );

    await user.save();

    // Get pump details for email
    const pump = await Pump.findById(user.pumpId);

    // Send termination email
    try {
      await sendTerminationEmail({
        toEmail: user.email,
        name: user.name,
        pumpName: pump?.name || 'FuelFlow System',
        reason: user.terminationReason,
      });
    } catch (emailError) {
      console.error('Failed to send termination email:', emailError);
      // Don't fail termination if email fails
    }

    return res.status(200).json(
      formatSuccess(user, 'User terminated successfully and notification email sent')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reinstate a terminated user
 * POST /api/users/:id/reinstate
 */
export const reinstateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'User not found')
      );
    }

    // Check if user is actually terminated
    if (user.status !== 'terminated') {
      return res.status(400).json(
        formatError('INVALID_OPERATION', 'User is not terminated')
      );
    }

    // Check permissions
    if (req.user.role === 'manager') {
      if (user.pumpId?.toString() !== req.user.pumpId?.toString()) {
        return res.status(403).json(
          formatError('FORBIDDEN', 'Managers can only reinstate employees from their pump')
        );
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Only admin and managers can reinstate users')
      );
    }

    // Reinstate user
    user.status = 'active';
    
    // Add to employment history
    user.addEmploymentHistory(
      user.role,
      user.jobTitle,
      user.pumpId,
      'Reinstated: Employee reactivated in the system'
    );

    await user.save();

    // Get pump details for email
    const pump = await Pump.findById(user.pumpId);

    // Send reinstatement email
    try {
      await sendReinstatementEmail({
        toEmail: user.email,
        name: user.name,
        pumpName: pump?.name || 'FuelFlow System',
        role: user.role,
      });
    } catch (emailError) {
      console.error('Failed to send reinstatement email:', emailError);
      // Don't fail reinstatement if email fails
    }

    return res.status(200).json(
      formatSuccess(user, 'User reinstated successfully and notification email sent')
    );
  } catch (error) {
    next(error);
  }
};
