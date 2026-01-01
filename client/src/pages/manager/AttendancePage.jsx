import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';

export default function AttendancePage() {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [today] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get employees from manager's pump
      const employeesRes = await api.get('/users');
      
      // Get today's attendance records
      const todayStr = today.toISOString().split('T')[0];
      const attendanceRes = await api.get(`/attendance?startDate=${todayStr}&endDate=${todayStr}`);

      if (employeesRes.data.success) {
        const emps = employeesRes.data.data.filter(e => e.status === 'active');
        setEmployees(emps);

        // Initialize attendance data from existing records
        const initialData = {};
        if (attendanceRes.data.success) {
          attendanceRes.data.data.forEach(record => {
            initialData[record.userId._id || record.userId] = {
              status: record.status,
              checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
              checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
              notes: record.notes || '',
            };
          });
        }
        setAttendanceData(initialData);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status,
        // Set default times when marking present
        checkIn: status === 'present' && !prev[userId]?.checkIn ? '09:00' : prev[userId]?.checkIn || '',
        checkOut: status === 'present' && !prev[userId]?.checkOut ? '17:00' : prev[userId]?.checkOut || '',
      }
    }));
  };

  const handleFieldChange = (userId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const handleBulkAction = (status) => {
    const newData = {};
    employees.forEach(emp => {
      newData[emp._id] = {
        status,
        checkIn: status === 'present' ? '09:00' : '',
        checkOut: status === 'present' ? '17:00' : '',
        notes: attendanceData[emp._id]?.notes || '',
      };
    });
    setAttendanceData(newData);
    toast.success(`All employees marked as ${status}`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const todayStr = today.toISOString().split('T')[0];
      const promises = [];

      for (const emp of employees) {
        const data = attendanceData[emp._id];
        if (!data?.status) continue; // Skip if no status selected

        const payload = {
          userId: emp._id,
          date: todayStr,
          status: data.status,
          notes: data.notes || '',
        };

        // Add times if present and status is present or late
        if ((data.status === 'present' || data.status === 'late') && data.checkIn) {
          payload.checkIn = `${todayStr}T${data.checkIn}:00`;
        }
        if ((data.status === 'present' || data.status === 'late') && data.checkOut) {
          payload.checkOut = `${todayStr}T${data.checkOut}:00`;
        }

        promises.push(api.post('/attendance', payload));
      }

      await Promise.all(promises);
      toast.success('Attendance saved successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'absent':
        return <XCircle size={16} style={{ color: '#ef4444' }} />;
      case 'late':
        return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'leave':
        return <AlertCircle size={16} style={{ color: '#3b82f6' }} />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long',
      day: 'numeric' 
    });
  };

  const hasUnsavedChanges = () => {
    return employees.some(emp => attendanceData[emp._id]?.status);
  };

  return (
    <DashboardLayout role="manager">
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* Header Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Calendar size={24} />
              <span>Mark Attendance</span>
            </div>
          }
          subtitle={formatDate(today)}
        >
          <div style={{ 
            padding: 'var(--spacing-md)', 
            background: '#eff6ff', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            color: '#1e40af'
          }}>
            ℹ️ You can only mark attendance for today. Previous attendance records are locked and cannot be modified.
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle size={16} />}
              onClick={() => handleBulkAction('present')}
            >
              Mark All Present
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={16} />}
              onClick={() => handleBulkAction('absent')}
            >
              Mark All Absent
            </Button>
          </div>

          {/* Employee List */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
              <div className="spinner"></div>
            </div>
          ) : employees.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {employees.map((employee) => {
                const data = attendanceData[employee._id] || {};
                return (
                  <div
                    key={employee._id}
                    style={{
                      padding: 'var(--spacing-lg)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: data.status ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    }}
                  >
                    {/* Employee Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                      <div>
                        <div style={{ display:' flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                          <Users size={18} style={{ color: 'var(--color-text-secondary)' }} />
                          <h3 style={{ margin: 0, fontSize: '1rem' }}>{employee.name}</h3>
                          {data.status && getStatusIcon(data.status)}
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {employee.role} • {employee.jobTitle}
                        </p>
                      </div>
                    </div>

                    {/* Status Selection */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 600 }}>
                        Status *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-xs)' }}>
                        {['present', 'absent', 'late', 'leave'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(employee._id, status)}
                            style={{
                              padding: 'var(--spacing-sm)',
                              border: data.status === status ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: data.status === status ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                              color: data.status === status ? 'white' : 'var(--color-text)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: data.status === status ? 600 : 400,
                              textTransform: 'capitalize',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                          >
                            {getStatusIcon(status)}
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Check-in/Check-out Times (only for present/late) */}
                    {(data.status === 'present' || data.status === 'late') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <div className="input-wrapper">
                          <label className="input-label" style={{ fontSize: '0.875rem' }}>Check In</label>
                          <input
                            type="time"
                            className="input"
                            value={data.checkIn || ''}
                            onChange={(e) => handleFieldChange(employee._id, 'checkIn', e.target.value)}
                            style={{ fontSize: '0.875rem' }}
                          />
                        </div>
                        <div className="input-wrapper">
                          <label className="input-label" style={{ fontSize: '0.875rem' }}>Check Out</label>
                          <input
                            type="time"
                            className="input"
                            value={data.checkOut || ''}
                            onChange={(e) => handleFieldChange(employee._id, 'checkOut', e.target.value)}
                            style={{ fontSize: '0.875rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: '0.875rem' }}>Notes (optional)</label>
                      <textarea
                        className="input"
                        rows="2"
                        value={data.notes || ''}
                        onChange={(e) => handleFieldChange(employee._id, 'notes', e.target.value)}
                        placeholder="Add any notes about this employee's attendance..."
                        style={{ fontSize: '0.875rem', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
              No active employees found in your pump.
            </p>
          )}

          {/* Save Button */}
          {employees.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
              <Button
                leftIcon={<Save size={18} />}
                onClick={handleSaveAll}
                loading={saving}
                disabled={!hasUnsavedChanges()}
                fullWidth
              >
                Save All Attendance
              </Button>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-secondary)', 
                textAlign: 'center', 
                marginTop: 'var(--spacing-sm)' 
              }}>
                {hasUnsavedChanges() ? 'You have unsaved changes' : 'No changes to save'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
