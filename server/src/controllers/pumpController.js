import Pump from '../models/Pump.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Create new pump (Admin only)
 * POST /api/pumps
 */
export const createPump = async (req, res, next) => {
  try {
    const { name, address, location } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Pump name is required')
      );
    }

    // Create pump
    const pump = await Pump.create({
      name,
      address,
      location,
      createdBy: req.user._id,
    });

    return res.status(201).json(
      formatSuccess(pump, 'Pump created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pumps (Admin sees all, Manager sees only their pump)
 * GET /api/pumps
 */
export const getPumps = async (req, res, next) => {
  try {
    let query = { status: 'active' };

    // If not admin, filter by user's pump
    if (req.user.role !== 'admin') {
      if (!req.user.pumpId) {
        return res.status(200).json(formatSuccess([]));
      }
      query._id = req.user.pumpId;
    }

    const pumps = await Pump.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(formatSuccess(pumps));
  } catch (error) {
    next(error);
  }
};

/**
 * Get single pump by ID
 * GET /api/pumps/:id
 */
export const getPumpById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check pump access
    if (req.user.role !== 'admin' && req.user.pumpId?.toString() !== id) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied to this pump')
      );
    }

    const pump = await Pump.findById(id).populate('createdBy', 'name email');

    if (!pump) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Pump not found')
      );
    }

    return res.status(200).json(formatSuccess(pump));
  } catch (error) {
    next(error);
  }
};

/**
 * Update pump (Admin only)
 * PATCH /api/pumps/:id
 */
export const updatePump = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, location, status } = req.body;

    const pump = await Pump.findById(id);

    if (!pump) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Pump not found')
      );
    }

    // Update fields
    if (name) pump.name = name;
    if (address) pump.address = address;
    if (location) pump.location = location;
    if (status) pump.status = status;

    await pump.save();

    return res.status(200).json(
      formatSuccess(pump, 'Pump updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate pump and all associated employees
 * POST /api/pumps/:id/terminate
 */
export const terminatePump = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const pump = await Pump.findById(id);

    if (!pump) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Pump not found')
      );
    }

    // Import User and email function
    const User = (await import('../models/User.js')).default;
    const { sendTerminationEmail } = await import('../utils/email.js');

    // Find all employees associated with this pump
    const employees = await User.find({ pumpId: id, status: 'active' });

    // Send termination emails to all employees
    const emailPromises = employees.map(async (employee) => {
      try {
        await sendTerminationEmail({
          toEmail: employee.email,
          name: employee.name,
          pumpName: pump.name,
          reason: reason || 'Pump location terminated',
        });
      } catch (emailError) {
        console.error(`Failed to send termination email to ${employee.email}:`, emailError);
      }
    });

    await Promise.all(emailPromises);

    // Delete all employees from database
    await User.deleteMany({ pumpId: id });

    // Mark pump as terminated
    pump.status = 'terminated';
    await pump.save();

    return res.status(200).json(
      formatSuccess(
        {
          pump,
          employeesTerminated: employees.length,
        },
        `Pump terminated successfully. ${employees.length} employee(s) removed and notified.`
      )
    );
  } catch (error) {
    next(error);
  }
};
