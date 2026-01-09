import api, { handleApiError } from './api';

/**
 * Shift Template API Service
 */

// Create a new shift template
export const createTemplate = async (templateData) => {
  try {
    const response = await api.post('/shift-templates', templateData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get all shift templates
export const getTemplates = async (pumpId = null) => {
  try {
    const params = pumpId ? `?pumpId=${pumpId}` : '';
    const response = await api.get(`/shift-templates${params}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get a single shift template by ID
export const getTemplateById = async (id) => {
  try {
    const response = await api.get(`/shift-templates/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update a shift template
export const updateTemplate = async (id, templateData) => {
  try {
    const response = await api.patch(`/shift-templates/${id}`, templateData);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete a shift template (soft delete)
export const deleteTemplate = async (id) => {
  try {
    const response = await api.delete(`/shift-templates/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
