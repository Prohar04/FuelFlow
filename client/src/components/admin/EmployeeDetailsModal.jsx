import { useState, useEffect } from 'react';
import { X, User, DollarSign, Calendar, MapPin, History, UserX, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import api from '../../services/api';
import './EmployeeDetailsModal.css';

export default function EmployeeDetailsModal({ isOpen, onClose, employee, pumps, onUpdate, currentUser }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salary: 0,
    pumpId: '',
    role: '',
    jobTitle: '',
  });
  const [terminationReason, setTerminationReason] = useState('');
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        salary: employee.salary || 0,
        pumpId: employee.pumpId?._id || employee.pumpId || '',
        role: employee.role || '',
        jobTitle: employee.jobTitle || '',
      });
    }
  }, [employee]);

  if (!employee) return null;

  // Check if viewing own profile and if user is manager/admin
  const isSelf = currentUser && employee._id === currentUser._id;
  const isManagerOrAdmin = currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin');
  const cannotEditCriticalFields = isSelf && isManagerOrAdmin;

  const handleUpdateSalary = async () => {
    setLoading(true);
    try {
      const response = await api.patch(`/users/${employee._id}`, {
        salary: parseFloat(formData.salary),
      });

      if (response.data.success) {
        toast.success('Salary updated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update salary');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePump = async () => {
    setLoading(true);
    try {
      const response = await api.patch(`/users/${employee._id}`, {
        pumpId: formData.pumpId,
      });

      if (response.data.success) {
        toast.success('Pump assignment updated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update pump');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    setLoading(true);
    try {
      const response = await api.patch(`/users/${employee._id}`, {
        role: formData.role,
        jobTitle: formData.jobTitle,
      });

      if (response.data.success) {
        toast.success('Role updated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminationReason.trim()) {
      toast.error('Please provide a termination reason');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/users/${employee._id}/terminate`, {
        reason: terminationReason,
      });

      if (response.data.success) {
        toast.success('Employee terminated successfully');
        onUpdate();
        onClose();
        setShowTerminateDialog(false);
        setTerminationReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to terminate employee');
    } finally {
      setLoading(false);
    }
  };

  const handleReinstate = async () => {
    if (!confirm('Are you sure you want to reinstate this employee? They will receive an email notification.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/users/${employee._id}/reinstate`);

      if (response.data.success) {
        toast.success('Employee reinstated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to reinstate employee');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'salary', label: 'Salary', icon: DollarSign },
    { id: 'pump', label: 'Pump Assignment', icon: MapPin },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Details" size="lg">
      <div className="employee-details-modal">
        {/* Tabs */}
        <div className="tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="tab-panel">
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{employee.name}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{employee.email}</p>
                </div>
                <div className="info-item">
                  <label>Role</label>
                  <p className="role-badge">{employee.role}</p>
                </div>
                <div className="info-item">
                  <label>Job Title</label>
                  <p>{employee.jobTitle || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <p className={`status-badge status-${employee.status}`}>
                    {employee.status}
                  </p>
                </div>
                <div className="info-item">
                  <label>Assigned Pump</label>
                  <p>{employee.pumpId?.name || 'N/A'} {employee.pumpId?.code ? `(${employee.pumpId.code})` : ''}</p>
                </div>
              </div>

              <div className="section-divider"></div>

              <div className="info-item">
                <label>Employment Details</label>
                <div className="detail-row">
                  <span>Created:</span>
                  <span>{new Date(employee.createdAt).toLocaleDateString()}</span>
                </div>
                {employee.terminationDate && (
                  <>
                    <div className="detail-row">
                      <span>Terminated:</span>
                      <span>{new Date(employee.terminationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Reason:</span>
                      <span>{employee.terminationReason}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Terminate Button */}
              {employee.status === 'active' && !showTerminateDialog && !isSelf && (
                <Button
                  variant="danger"
                  leftIcon={<UserX size={18} />}
                  onClick={() => setShowTerminateDialog(true)}
                  style={{ marginTop: 'var(--spacing-lg)' }}
                >
                  Terminate Employee
                </Button>
              )}

              {/* Self-termination warning */}
              {employee.status === 'active' && isSelf && (
                <div style={{ 
                  marginTop: 'var(--spacing-lg)', 
                  padding: 'var(--spacing-md)', 
                  background: '#fef3c7', 
                  borderRadius: 'var(--radius-md)',
                  color: '#92400e'
                }}>
                  ⚠️ You cannot terminate your own account. Contact a system administrator.
                </div>
              )}

              {/* Termination Dialog */}
              {showTerminateDialog && (
                <div className="terminate-dialog">
                  <h4>Terminate Employee</h4>
                  <p>Please provide a reason for termination:</p>
                  <textarea
                    className="input"
                    rows="4"
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    placeholder="Enter termination reason..."
                  />
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <Button
                      variant="danger"
                      onClick={handleTerminate}
                      loading={loading}
                      fullWidth
                    >
                      Confirm Termination
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowTerminateDialog(false);
                        setTerminationReason('');
                      }}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Reinstate Button */}
              {employee.status === 'terminated' && (
                <Button
                  variant="success"
                  leftIcon={<UserX size={18} />}
                  onClick={handleReinstate}
                  loading={loading}
                  style={{ marginTop: 'var(--spacing-lg)' }}
                >
                  Reinstate Employee
                </Button>
              )}
            </div>
          )}

          {/* Salary Tab */}
          {activeTab === 'salary' && (
            <div className="tab-panel">
              <div className="form-section">
                <h4>Base Salary</h4>
                <p className="section-description">
                  Set the base monthly salary for this employee. This will be used for payroll calculations.
                </p>
                <Input
                  label="Monthly Salary (BDT)"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  leftIcon={<DollarSign size={18} />}
                  placeholder="e.g., 25000"
                />
                <div className="current-salary">
                  <span>Current Salary:</span>
                  <strong>৳{employee.salary?.toLocaleString() || '0'}</strong>
                </div>
                <Button
                  leftIcon={<Save size={18} />}
                  onClick={handleUpdateSalary}
                  loading={loading}
                  fullWidth
                  disabled={formData.salary === employee.salary}
                >
                  Update Salary
                </Button>
              </div>
            </div>
          )}

          {/* Pump Assignment Tab */}
          {activeTab === 'pump' && (
            <div className="tab-panel">
              <div className="form-section">
                <h4>Pump Assignment</h4>
                <p className="section-description">
                  Change the pump this employee is assigned to. This will update their work location.
                </p>
                <div className="input-wrapper">
                  <label className="input-label">Select Pump</label>
                  <select
                    className="input"
                    value={formData.pumpId}
                    onChange={(e) => setFormData({ ...formData, pumpId: e.target.value })}
                    disabled={cannotEditCriticalFields}
                  >
                    <option value="">Select a pump</option>
                    {pumps.map((pump) => (
                      <option key={pump._id} value={pump._id}>
                        {pump.name} ({pump.code})
                      </option>
                    ))}
                  </select>
                  {cannotEditCriticalFields && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                      ⚠️ You cannot change your own pump assignment
                    </p>
                  )}
                </div>
                <div className="current-salary">
                  <span>Current Pump:</span>
                  <strong>{employee.pumpId?.name || 'N/A'}</strong>
                </div>
                <Button
                  leftIcon={<MapPin size={18} />}
                  onClick={handleUpdatePump}
                  loading={loading}
                  fullWidth
                  disabled={formData.pumpId === (employee.pumpId?._id || employee.pumpId) || cannotEditCriticalFields}
                >
                  Update Pump Assignment
                </Button>
              </div>

              <div className="section-divider"></div>

              <div className="form-section">
                <h4>Role & Job Title</h4>
                <div className="input-wrapper">
                  <label className="input-label">Role</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={cannotEditCriticalFields}
                  >
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="employee">Employee</option>
                  </select>
                  {cannotEditCriticalFields && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                      ⚠️ You cannot change your own role
                    </p>
                  )}
                </div>
                <Input
                  label="Job Title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g., Senior Cashier"
                />
                <Button
                  leftIcon={<Save size={18} />}
                  onClick={handleUpdateRole}
                  loading={loading}
                  fullWidth
                  disabled={formData.role === employee.role && formData.jobTitle === employee.jobTitle || cannotEditCriticalFields}
                >
                  Update Role
                </Button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-panel">
              <h4>Employment History</h4>
              {employee.employmentHistory && employee.employmentHistory.length > 0 ? (
                <div className="history-list">
                  {employee.employmentHistory.map((record, index) => (
                    <div key={index} className="history-item">
                      <div className="history-header">
                        <Calendar size={16} />
                        <span className="history-date">
                          {new Date(record.changedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="history-details">
                        <p><strong>Role:</strong> {record.role}</p>
                        <p><strong>Job Title:</strong> {record.jobTitle || 'N/A'}</p>
                        {record.reason && <p><strong>Reason:</strong> {record.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No employment history available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
