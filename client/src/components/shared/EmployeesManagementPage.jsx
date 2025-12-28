import { useState, useEffect } from 'react';
import { Plus, UserPlus, Mail, Eye, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import EmployeeDetailsModal from '../admin/EmployeeDetailsModal';
import api from '../../services/api';

export default function EmployeesManagementPage({ userRole, showPumpFilter = false }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier',
    jobTitle: '',
    pumpId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Define allowed roles based on user role
  const getAllowedRoles = () => {
    if (userRole === 'admin') {
      return [
        { value: 'manager', label: 'Manager' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'employee', label: 'Employee' },
      ];
    } else if (userRole === 'manager') {
      // Managers can only create cashier and employee
      return [
        { value: 'cashier', label: 'Cashier' },
        { value: 'employee', label: 'Employee' },
      ];
    }
    return [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const requests = [api.get('/users')];
      
      // Only fetch pumps if admin or if needed for display
      if (userRole === 'admin' || showPumpFilter) {
        requests.push(api.get('/pumps'));
      }

      const responses = await Promise.all(requests);
      
      if (responses[0].data.success) setEmployees(responses[0].data.data);
      if (responses[1]?.data.success) setPumps(responses[1].data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/users', formData);

      if (response.data.success) {
        toast.success('Employee created! Onboarding email sent.');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', role: 'cashier', jobTitle: '', pumpId: '' });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <Card 
        title="Employee Management" 
        subtitle={`${employees.length} employee${employees.length !== 1 ? 's' : ''} registered`}
        action={
          <Button leftIcon={<UserPlus size={18} />} onClick={() => setIsModalOpen(true)}>
            Add Employee
          </Button>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
            <div className="spinner"></div>
          </div>
        ) : employees.length > 0 ? (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {employees.map((employee) => (
              <div 
                key={employee._id} 
                style={{ 
                  padding: 'var(--spacing-lg)', 
                  background: 'var(--color-bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  opacity: employee.status === 'terminated' ? 0.7 : 1,
                  border: employee.status === 'terminated' ? '1px solid var(--color-danger, #dc3545)' : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <h3 style={{ margin: 0 }}>{employee.name}</h3>
                    <span style={{ 
                      padding: '2px 8px', 
                      background: 'var(--color-primary)', 
                      color: 'white', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {employee.role}
                    </span>
                    {employee.status === 'terminated' && (
                      <span style={{ 
                        padding: '2px 8px', 
                        background: 'var(--color-danger, #dc3545)', 
                        color: 'white', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        Terminated
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-xs) 0', fontSize: '0.875rem' }}>
                    <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {employee.email} • {employee.jobTitle}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <span>
                      <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Salary: ৳{employee.salary?.toLocaleString() || '0'}/month
                    </span>
                    {employee.pumpId?.name && (
                      <span>
                        Pump: {employee.pumpId.name} ({employee.pumpId.code})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewDetails(employee)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
            No employees found. Click "Add Employee" to create one.
          </p>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Employee" size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g., john@example.com"
            helperText="Onboarding email with temporary password will be sent to this address"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="input-wrapper">
              <label className="input-label">Role</label>
              <select
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                {getAllowedRoles().map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              {userRole === 'manager' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Managers can only create Cashier and Employee accounts
                </p>
              )}
            </div>

            <Input
              label="Job Title"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g., Senior Cashier"
              required
            />
          </div>

          {/* Only show pump selector for admin */}
          {userRole === 'admin' && (
            <div className="input-wrapper">
              <label className="input-label">Assign to Pump</label>
              <select
                className="input"
                value={formData.pumpId}
                onChange={(e) => setFormData({ ...formData, pumpId: e.target.value })}
                required
              >
                <option value="">Select a pump</option>
                {pumps.map((pump) => (
                  <option key={pump._id} value={pump._id}>
                    {pump.name} ({pump.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {userRole === 'manager' && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              ℹ️ Employee will be assigned to your pump automatically
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button type="submit" fullWidth loading={submitting}>
              Create & Send Email
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        pumps={pumps}
        onUpdate={fetchData}
        currentUser={user}
      />
    </>
  );
}
