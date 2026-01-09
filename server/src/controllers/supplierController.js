import Supplier from '../models/Supplier.js';
import { formatError, formatSuccess } from '../utils/helpers.js';

/**
 * Create a new supplier
 * POST /api/suppliers
 * Manager/Admin only
 */
export const createSupplier = async (req, res, next) => {
  try {
    const supplierData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const supplier = await Supplier.create(supplierData);

    const populatedSupplier = await Supplier.findById(supplier._id)
      .populate('createdBy', 'name email');

    return res.status(201).json(
      formatSuccess(populatedSupplier, 'Supplier created successfully')
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json(
        formatError('DUPLICATE_ERROR', 'A supplier with this email already exists')
      );
    }
    next(error);
  }
};

/**
 * Get all suppliers with search and filter
 * GET /api/suppliers
 * Manager/Admin only
 */
export const getSuppliers = async (req, res, next) => {
  try {
    const { search, fuelType, status } = req.query;

    const query = {};

    // Search by company name or contact person
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by fuel type
    if (fuelType) {
      query.fuelTypes = fuelType;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const suppliers = await Supplier.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(
      formatSuccess(suppliers, `Found ${suppliers.length} supplier(s)`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier by ID
 * GET /api/suppliers/:id
 * Manager/Admin only
 */
export const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!supplier) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Supplier not found')
      );
    }

    return res.status(200).json(
      formatSuccess(supplier, 'Supplier retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update supplier
 * PUT /api/suppliers/:id
 * Manager/Admin only
 */
export const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Supplier not found')
      );
    }

    // Update fields
    Object.assign(supplier, req.body);
    supplier.updatedBy = req.user._id;

    await supplier.save();

    const updatedSupplier = await Supplier.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return res.status(200).json(
      formatSuccess(updatedSupplier, 'Supplier updated successfully')
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json(
        formatError('DUPLICATE_ERROR', 'A supplier with this email already exists')
      );
    }
    next(error);
  }
};

/**
 * Delete supplier (soft delete by setting status to inactive)
 * DELETE /api/suppliers/:id
 * Admin only
 */
export const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Supplier not found')
      );
    }

    // Soft delete by setting status to inactive
    supplier.status = 'inactive';
    supplier.updatedBy = req.user._id;
    await supplier.save();

    return res.status(200).json(
      formatSuccess(null, 'Supplier deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};
