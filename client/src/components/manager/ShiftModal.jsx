import { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock, User, FileText } from 'lucide-react';
import { checkShiftConflicts } from '../../services/shiftApi';
import './ShiftModal.css';

/**
 * Shift Modal Component
 * Create/Edit shift with conflict detection and validation
 */
export default function ShiftModal({
  isOpen,
  onClose,
  onSubmit,
  shift = null,
  employees = [],
  language = 'en',
}) {
  const [formData, setFormData] = useState({
    employeeId: '',
    roleRequired: 'general',
    startAt: '',
    endAt: '',
    breakMinutes: 0,
    notes: '',
    changeReason: '',
  });

  const [conflicts, setConflicts] = useState({ hasConflicts: false, conflicts: [], warnings: [] });
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const isEditMode = !!shift;
  const isPublished = shift?.status === 'published';

  // Initialize form data
  useEffect(() => {
    if (shift) {
      setFormData({
        employeeId: shift.employeeId?._id || shift.employeeId || '',
        roleRequired: shift.roleRequired || 'general',
        startAt: shift.startAt ? new Date(shift.startAt).toISOString().slice(0, 16) : '',
        endAt: shift.endAt ? new Date(shift.endAt).toISOString().slice(0, 16) : '',
        breakMinutes: shift.breakMinutes || 0,
        notes: shift.notes || '',
        changeReason: '',
      });
    } else {
      // Reset for new shift
      setFormData({
        employeeId: '',
        roleRequired: 'general',
        startAt: '',
        endAt: '',
        breakMinutes: 0,
        notes: '',
        changeReason: '',
      });
    }
    setConflicts({ hasConflicts: false, conflicts: [], warnings: [] });
  }, [shift, isOpen]);

  // Auto-check conflicts when key fields change
  useEffect(() => {
    if (formData.employeeId && formData.startAt && formData.endAt) {
      const timer = setTimeout(() => {
        handleCheckConflicts();
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [formData.employeeId, formData.startAt, formData.endAt, formData.breakMinutes]);

  const handleCheckConflicts = async () => {
    if (!formData.employeeId || !formData.startAt || !formData.endAt) return;

    setCheckingConflicts(true);
    try {
      const result = await checkShiftConflicts({
        employeeId: formData.employeeId,
        roleRequired: formData.roleRequired,
        startAt: formData.startAt,
        endAt: formData.endAt,
        breakMinutes: formData.breakMinutes,
        shiftId: shift?._id,
      });

      setConflicts(result.data || { hasConflicts: false, conflicts: [], warnings: [] });
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.employeeId || !formData.startAt || !formData.endAt) {
      alert(language === 'bn' ? 'সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    if (isPublished && !formData.changeReason) {
      alert(
        language === 'bn'
          ? 'প্রকাশিত শিফট সম্পাদনার জন্য পরিবর্তনের কারণ প্রয়োজন'
          : 'Change reason is required for editing published shifts'
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to save shift');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e._id === employeeId);
    return employee?.name || 'Unknown';
  };

  const getRoleLabel = (role) => {
    const labels = {
      cashier: language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier',
      fuelBoy: language === 'bn' ? 'ফুয়েল বয়' : 'Fuel Boy',
      security: language === 'bn' ? 'সিকিউরিটি' : 'Security',
      general: language === 'bn' ? 'সাধারণ' : 'General',
    };
    return labels[role] || role;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEditMode
              ? language === 'bn'
                ? 'শিফট সম্পাদনা'
                : 'Edit Shift'
              : language === 'bn'
              ? 'নতুন শিফট'
              : 'New Shift'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isPublished && (
          <div className="published-warning">
            <AlertTriangle size={18} />
            <span>
              {language === 'bn'
                ? 'এই শিফট প্রকাশিত হয়েছে। পরিবর্তনের কারণ প্রয়োজন।'
                : 'This shift is published. Change reason required.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Employee Selection */}
          <div className="form-group">
            <label>
              <User size={16} />
              {language === 'bn' ? 'কর্মচারী' : 'Employee'} *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            >
              <option value="">
                {language === 'bn' ? 'কর্মচারী নির্বাচন করুন' : 'Select Employee'}
              </option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role === 'cashier' ? 'Cashier' : emp.jobTitle || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Role Required */}
          <div className="form-group">
            <label>{language === 'bn' ? 'প্রয়োজনীয় ভূমিকা' : 'Role Required'} *</label>
            <select
              value={formData.roleRequired}
              onChange={(e) => setFormData({ ...formData, roleRequired: e.target.value })}
              required
            >
              <option value="cashier">{getRoleLabel('cashier')}</option>
              <option value="fuelBoy">{getRoleLabel('fuelBoy')}</option>
              <option value="security">{getRoleLabel('security')}</option>
              <option value="general">{getRoleLabel('general')}</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock size={16} />
                {language === 'bn' ? 'শুরুর সময়' : 'Start Time'} *
              </label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Clock size={16} />
                {language === 'bn' ? 'শেষ সময়' : 'End Time'} *
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Break Minutes */}
          <div className="form-group">
            <label>{language === 'bn' ? 'বিরতি (মিনিট)' : 'Break Minutes'}</label>
            <input
              type="number"
              min="0"
              max="120"
              value={formData.breakMinutes}
              onChange={(e) =>
                setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>
              <FileText size={16} />
              {language === 'bn' ? 'নোট' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder={language === 'bn' ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
            />
          </div>

          {/* Change Reason (for published shifts) */}
          {isPublished && (
            <div className="form-group">
              <label className="required">
                {language === 'bn' ? 'পরিবর্তনের কারণ' : 'Change Reason'} *
              </label>
              <textarea
                value={formData.changeReason}
                onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                rows="2"
                placeholder={
                  language === 'bn'
                    ? 'পরিবর্তনের কারণ ব্যাখ্যা করুন...'
                    : 'Explain reason for change...'
                }
                required
              />
            </div>
          )}

          {/* Conflict Warnings */}
          {checkingConflicts && (
            <div className="conflict-check">
              <div className="spinner"></div>
              <span>{language === 'bn' ? 'দ্বন্দ্ব পরীক্ষা করা হচ্ছে...' : 'Checking conflicts...'}</span>
            </div>
          )}

          {(conflicts.conflicts.length > 0 || conflicts.warnings.length > 0) && (
            <div className="conflicts-panel">
              {conflicts.conflicts.map((conflict, index) => (
                <div key={index} className="conflict-item error">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>{conflict.type.replace(/_/g, ' ').toUpperCase()}</strong>
                    <p>{conflict.message}</p>
                  </div>
                </div>
              ))}
              {conflicts.warnings.map((warning, index) => (
                <div key={index} className="conflict-item warning">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>{warning.type.replace(/_/g, ' ').toUpperCase()}</strong>
                    <p>{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || conflicts.hasConflicts}
            >
              {loading
                ? language === 'bn'
                  ? 'সংরক্ষণ করা হচ্ছে...'
                  : 'Saving...'
                : isEditMode
                ? language === 'bn'
                  ? 'আপডেট'
                  : 'Update'
                : language === 'bn'
                ? 'তৈরি করুন'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
