import api from './api';

const handleApiError = (error) => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  return error.message || 'An error occurred';
};

// Create supplier
export const createSupplier = async (supplierData) => {
  try {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get all suppliers with optional search and filter
export const getSuppliers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.fuelType) queryParams.append('fuelType', params.fuelType);
    if (params.status) queryParams.append('status', params.status);

    const response = await api.get(`/suppliers?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get supplier by ID
export const getSupplierById = async (id) => {
  try {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update supplier
export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete supplier
export const deleteSupplier = async (id) => {
  try {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
