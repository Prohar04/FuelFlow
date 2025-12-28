import { useState, useEffect } from 'react';
import { X, Users, Calendar, Clock, Repeat, AlertTriangle } from 'lucide-react';
import { bulkCreateShifts } from '../../services/shiftApi';
import './BulkShiftModal.css';

/**
 * Bulk Shift Modal Component
 * Create shifts for multiple employees with recurrence patterns
 */
export default function BulkShiftModal({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  language = 'en',
}) {
  const [formData, setFormData] = useState({
    employeeIds: [],
    roleRequired: 'general',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    notes: '',
    recurrence: {
      type: 'once',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      weekdays: [], // [0-6] for Sunday-Saturday
    },
  });

  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeIds: [],
        roleRequired: 'general',
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 30,
        notes: '',
        recurrence: {
          type: 'once',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          weekdays: [],
        },
      });
      setSelectAll(false);
      setError(null);
      setPreview(null);
    }
  }, [isOpen]);

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData({ ...formData, employeeIds: [] });
    } else {
      setFormData({ ...formData, employeeIds: employees.map((e) => e._id) });
    }
    setSelectAll(!selectAll);
  };

  const handleEmployeeToggle = (employeeId) => {
    const newIds = formData.employeeIds.includes(employeeId)
      ? formData.employeeIds.filter((id) => id !== employeeId)
      : [...formData.employeeIds, employeeId];
    
    setFormData({ ...formData, employeeIds: newIds });
    setSelectAll(newIds.length === employees.length);
  };

  const handleWeekdayToggle = (day) => {
    const newWeekdays = formData.recurrence.weekdays.includes(day)
      ? formData.recurrence.weekdays.filter((d) => d !== day)
      : [...formData.recurrence.weekdays, day];
    
    setFormData({
      ...formData,
      recurrence: { ...formData.recurrence, weekdays: newWeekdays },
    });
  };

  const calculatePreview = () => {
    const { recurrence, employeeIds } = formData;
    const dates = [];
    const startDate = new Date(recurrence.startDate);
    const endDate = new Date(recurrence.endDate);

    if (recurrence.type === 'once') {
      dates.push(startDate);
    } else if (recurrence.type === 'daily') {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (recurrence.type === 'weekly') {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (recurrence.weekdays.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    setPreview({
      totalShifts: dates.length * employeeIds.length,
      dates: dates.length,
      employees: employeeIds.length,
    });
  };

  useEffect(() => {
    if (formData.employeeIds.length > 0 && formData.recurrence.startDate) {
      calculatePreview();
    } else {
      setPreview(null);
    }
  }, [formData.employeeIds, formData.recurrence]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.employeeIds.length === 0) {
      setError(language === 'bn' ? 'অন্তত একজন কর্মচারী নির্বাচন করুন' : 'Please select at least one employee');
      return;
    }

    if (formData.recurrence.type === 'weekly' && formData.recurrence.weekdays.length === 0) {
      setError(language === 'bn' ? 'অন্তত একটি সপ্তাহের দিন নির্বাচন করুন' : 'Please select at least one weekday');
      return;
    }

    setLoading(true);
    try {
      await bulkCreateShifts(formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create shifts');
    } finally {
      setLoading(false);
    }
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

  const weekdayLabels = language === 'bn'
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-shift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Users size={24} />
            {language === 'bn' ? 'একাধিক শিফট তৈরি করুন' : 'Schedule Multiple Employees'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-banner">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div className="form-section">
            <div className="section-header">
              <h3>
                <Users size={18} />
                {language === 'bn' ? 'কর্মচারী নির্বাচন করুন' : 'Select Employees'}
              </h3>
              <button
                type="button"
                className="btn-link"
                onClick={handleSelectAll}
              >
                {selectAll
                  ? language === 'bn' ? 'সব বাতিল করুন' : 'Deselect All'
                  : language === 'bn' ? 'সব নির্বাচন করুন' : 'Select All'}
              </button>
            </div>
            <div className="employee-grid">
              {employees.map((emp) => (
                <label key={emp._id} className="employee-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.employeeIds.includes(emp._id)}
                    onChange={() => handleEmployeeToggle(emp._id)}
                  />
                  <div className="employee-info">
                    <span className="employee-name">{emp.name}</span>
                    <span className="employee-role">{emp.role}</span>
                  </div>
                </label>
              ))}
            </div>
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

          {/* Time Settings */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock size={16} />
                {language === 'bn' ? 'শুরুর সময়' : 'Start Time'} *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Clock size={16} />
                {language === 'bn' ? 'শেষ সময়' : 'End Time'} *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>{language === 'bn' ? 'বিরতি (মিনিট)' : 'Break (min)'}</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Recurrence Pattern */}
          <div className="form-section">
            <h3>
              <Repeat size={18} />
              {language === 'bn' ? 'পুনরাবৃত্তি প্যাটার্ন' : 'Recurrence Pattern'}
            </h3>
            
            <div className="recurrence-type">
              <label className="radio-label">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="once"
                  checked={formData.recurrence.type === 'once'}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, type: e.target.value },
                  })}
                />
                <span>{language === 'bn' ? 'একবার' : 'One-time'}</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="daily"
                  checked={formData.recurrence.type === 'daily'}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, type: e.target.value },
                  })}
                />
                <span>{language === 'bn' ? 'প্রতিদিন' : 'Daily'}</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="recurrenceType"
                  value="weekly"
                  checked={formData.recurrence.type === 'weekly'}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, type: e.target.value },
                  })}
                />
                <span>{language === 'bn' ? 'সাপ্তাহিক' : 'Weekly'}</span>
              </label>
            </div>

            {/* Date Range */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'} *
                </label>
                <input
                  type="date"
                  value={formData.recurrence.startDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: { ...formData.recurrence, startDate: e.target.value },
                  })}
                  required
                />
              </div>
              {formData.recurrence.type !== 'once' && (
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    {language === 'bn' ? 'শেষ তারিখ' : 'End Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence.endDate}
                    min={formData.recurrence.startDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence: { ...formData.recurrence, endDate: e.target.value },
                    })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Weekday Selection for Weekly */}
            {formData.recurrence.type === 'weekly' && (
              <div className="weekday-selector">
                <label>{language === 'bn' ? 'সপ্তাহের দিন নির্বাচন করুন' : 'Select Weekdays'} *</label>
                <div className="weekday-buttons">
                  {weekdayLabels.map((label, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`weekday-btn ${formData.recurrence.weekdays.includes(index) ? 'active' : ''}`}
                      onClick={() => handleWeekdayToggle(index)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>{language === 'bn' ? 'নোট' : 'Notes'}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              placeholder={language === 'bn' ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="preview-panel">
              <h4>{language === 'bn' ? 'পূর্বরূপ' : 'Preview'}</h4>
              <div className="preview-stats">
                <div className="preview-stat">
                  <span className="stat-value">{preview.totalShifts}</span>
                  <span className="stat-label">{language === 'bn' ? 'মোট শিফট' : 'Total Shifts'}</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-value">{preview.employees}</span>
                  <span className="stat-label">{language === 'bn' ? 'কর্মচারী' : 'Employees'}</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-value">{preview.dates}</span>
                  <span className="stat-label">{language === 'bn' ? 'দিন' : 'Days'}</span>
                </div>
              </div>
              <p className="preview-note">
                {language === 'bn'
                  ? 'শিফটগুলি খসড়া হিসাবে তৈরি হবে। প্রকাশের পরে কর্মচারীরা দেখতে পাবেন।'
                  : 'Shifts will be created as drafts. Employees will see them after publishing.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={loading || formData.employeeIds.length === 0}>
              {loading
                ? language === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...'
                : language === 'bn' ? 'শিফট তৈরি করুন' : 'Create Shifts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
