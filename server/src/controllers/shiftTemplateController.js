import ShiftTemplate from '../models/ShiftTemplate.js';
import { formatError, formatSuccess } from '../utils/helpers.js';
import {
  validateTimeRange,
  validateBreaks,
  validateWeekdays,
  calculateBreakDuration,
} from '../utils/shiftValidation.js';

/**
 * Create shift template
 * POST /api/shift-templates
 * Manager only
 */
export const createTemplate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      weekdays,
      breaks,
    } = req.body;

    // Validate input
    if (!name || !startTime || !endTime) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Name, startTime, and endTime are required')
      );
    }

    // Manager can only create templates for their pump
    const pumpId = req.user.role === 'admin' ? req.body.pumpId : req.user.pumpId;

    if (!pumpId) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'PumpId is required')
      );
    }

    // Validate time range
    const timeValidation = validateTimeRange(startTime, endTime);
    if (!timeValidation.valid) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Invalid time range')
      );
    }

    // Validate weekdays if provided
    if (weekdays && weekdays.length > 0) {
      const weekdayValidation = validateWeekdays(weekdays);
      if (!weekdayValidation.valid) {
        return res.status(400).json(
          formatError('VALIDATION_ERROR', weekdayValidation.error)
        );
      }
    }

    // Validate breaks if provided
    let processedBreaks = breaks || {};
    if (breaks) {
      // Auto-calculate break durations
      if (breaks.lunch?.startTime && breaks.lunch?.endTime && !breaks.lunch?.duration) {
        processedBreaks.lunch.duration = calculateBreakDuration(breaks.lunch.startTime, breaks.lunch.endTime);
      }

      if (breaks.other && Array.isArray(breaks.other)) {
        processedBreaks.other = breaks.other.map((b) => {
          if (b.startTime && b.endTime && !b.duration) {
            b.duration = calculateBreakDuration(b.startTime, b.endTime);
          }
          return b;
        });
      }

      const breakValidation = validateBreaks(startTime, endTime, processedBreaks);
      if (!breakValidation.valid) {
        return res.status(400).json(
          formatError('VALIDATION_ERROR', `Break validation failed: ${breakValidation.errors.join(', ')}`)
        );
      }
    }

    // Create template
    const template = await ShiftTemplate.create({
      pumpId,
      name,
      description: description || '',
      startTime,
      endTime,
      weekdays: weekdays || [],
      breaks: processedBreaks,
      createdBy: req.user._id,
    });

    const populatedTemplate = await ShiftTemplate.findById(template._id)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email');

    return res.status(201).json(
      formatSuccess(populatedTemplate, 'Shift template created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shift templates (scoped by pump)
 * GET /api/shift-templates
 */
export const getTemplates = async (req, res, next) => {
  try {
    let query = { isActive: true };

    // Scope by user role
    if (req.user.role === 'manager') {
      query.pumpId = req.user.pumpId;
    } else if (req.user.role === 'admin') {
      // Admin can optionally filter by pumpId
      if (req.query.pumpId) {
        query.pumpId = req.query.pumpId;
      }
    } else {
      // Other roles cannot access templates
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    const templates = await ShiftTemplate.find(query)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(formatSuccess(templates));
  } catch (error) {
    next(error);
  }
};

/**
 * Get single shift template by ID
 * GET /api/shift-templates/:id
 */
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await ShiftTemplate.findById(id)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Template not found')
      );
    }

    if (!template.isActive) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Template not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && template.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    return res.status(200).json(formatSuccess(template));
  } catch (error) {
    next(error);
  }
};

/**
 * Update shift template
 * PATCH /api/shift-templates/:id
 * Manager only
 */
export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, startTime, endTime, weekdays, breaks } = req.body;

    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Template not found')
      );
    }

    if (!template.isActive) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Cannot update inactive template')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && template.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    // Validate time range if updating times
    const newStartTime = startTime || template.startTime;
    const newEndTime = endTime || template.endTime;
    const timeValidation = validateTimeRange(newStartTime, newEndTime);
    if (!timeValidation.valid) {
      return res.status(400).json(
        formatError('VALIDATION_ERROR', 'Invalid time range')
      );
    }

    // Validate weekdays if updating
    if (weekdays && weekdays.length > 0) {
      const weekdayValidation = validateWeekdays(weekdays);
      if (!weekdayValidation.valid) {
        return res.status(400).json(
          formatError('VALIDATION_ERROR', weekdayValidation.error)
        );
      }
    }

    // Validate breaks if updating
    if (breaks) {
      // Auto-calculate break durations
      if (breaks.lunch?.startTime && breaks.lunch?.endTime && !breaks.lunch?.duration) {
        breaks.lunch.duration = calculateBreakDuration(breaks.lunch.startTime, breaks.lunch.endTime);
      }

      if (breaks.other && Array.isArray(breaks.other)) {
        breaks.other = breaks.other.map((b) => {
          if (b.startTime && b.endTime && !b.duration) {
            b.duration = calculateBreakDuration(b.startTime, b.endTime);
          }
          return b;
        });
      }

      const breakValidation = validateBreaks(newStartTime, newEndTime, breaks);
      if (!breakValidation.valid) {
        return res.status(400).json(
          formatError('VALIDATION_ERROR', `Break validation failed: ${breakValidation.errors.join(', ')}`)
        );
      }
    }

    // Update fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (startTime) template.startTime = startTime;
    if (endTime) template.endTime = endTime;
    if (weekdays !== undefined) template.weekdays = weekdays;
    if (breaks !== undefined) template.breaks = breaks;

    await template.save();

    const updatedTemplate = await ShiftTemplate.findById(id)
      .populate('pumpId', 'name code')
      .populate('createdBy', 'name email');

    return res.status(200).json(
      formatSuccess(updatedTemplate, 'Template updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shift template (soft delete)
 * DELETE /api/shift-templates/:id
 * Manager only
 */
export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Template not found')
      );
    }

    // Check pump access
    if (req.user.role === 'manager' && template.pumpId.toString() !== req.user.pumpId?.toString()) {
      return res.status(403).json(
        formatError('FORBIDDEN', 'Access denied')
      );
    }

    // Soft delete
    template.isActive = false;
    await template.save();

    return res.status(200).json(
      formatSuccess(null, 'Template deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};
