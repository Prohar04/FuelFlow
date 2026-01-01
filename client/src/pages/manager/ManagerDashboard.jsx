import { useState, useEffect } from 'react';
import { Users, Calendar, Package, TrendingUp, AlertCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    lowStockAlerts: 0,
    pendingOrders: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch employees for the manager's pump
      const employeesRes = await api.get('/users');
      
      if (employeesRes.data.success) {
        const employees = employeesRes.data.data;
        const active = employees.filter(e => e.status === 'active');
        
        setStats(prev => ({
          ...prev,
          totalEmployees: employees.length,
          activeEmployees: active.length,
        }));

        // Get 5 most recent employees
        setRecentEmployees(employees.slice(0, 5));
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <Users size={24} />,
      color: '#3b82f6',
      change: `${stats.activeEmployees} active`,
    },
    {
      title: 'Attendance',
      value: 'View',
      icon: <Calendar size={24} />,
      color: '#10b981',
      onClick: () => navigate('/manager/attendance'),
    },
    {
      title: 'Inventory',
      value: 'Manage',
      icon: <Package size={24} />,
      color: '#f59e0b',
      onClick: () => navigate('/manager/inventory'),
    },
    {
      title: 'Analytics',
      value: 'View',
      icon: <TrendingUp size={24} />,
      color: '#8b5cf6',
      onClick: () => navigate('/manager/analytics'),
    },
  ];

  return (
    <DashboardLayout role="manager">
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: 'var(--spacing-md)' 
        }}>
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              style={{
                padding: 'var(--spacing-lg)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                if (stat.onClick) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (stat.onClick) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.875rem', 
                    marginBottom: 'var(--spacing-xs)' 
                  }}>
                    {stat.title}
                  </p>
                  <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    margin: 0,
                    marginBottom: 'var(--spacing-xs)' 
                  }}>
                    {stat.value}
                  </h2>
                  {stat.change && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {stat.change}
                    </p>
                  )}
                </div>
                <div style={{ 
                  padding: 'var(--spacing-sm)', 
                  background: stat.color + '20', 
                  color: stat.color,
                  borderRadius: 'var(--radius-md)' 
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Employees */}
        <Card
          title="Recent Employees"
          subtitle="Latest additions to your team"
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus size={16} />}
              onClick={() => navigate('/manager/employees')}
            >
              Manage All
            </Button>
          }
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
              <div className="spinner"></div>
            </div>
          ) : recentEmployees.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
              {recentEmployees.map((employee) => (
                <div
                  key={employee._id}
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{employee.name}</span>
                      <span style={{
                        padding: '2px 6px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        textTransform: 'capitalize',
                      }}>
                        {employee.role}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--color-text-secondary)', 
                      margin: '4px 0 0 0' 
                    }}>
                      {employee.jobTitle} • {employee.email}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    background: employee.status === 'active' ? '#10b98120' : '#ef444420',
                    color: employee.status === 'active' ? '#10b981' : '#ef4444',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                  }}>
                    {employee.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ 
              textAlign: 'center', 
              color: 'var(--color-text-secondary)', 
              padding: 'var(--spacing-xl)' 
            }}>
              No employees found. Add your first employee!
            </p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" subtitle="Common manager tasks">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--spacing-md)' 
          }}>
            <Button
              variant="secondary"
              leftIcon={<UserPlus size={18} />}
              onClick={() => navigate('/manager/employees')}
              style={{ justifyContent: 'flex-start' }}
            >
              Add Employee
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Calendar size={18} />}
              onClick={() => navigate('/manager/attendance')}
              style={{ justifyContent: 'flex-start' }}
            >
              Mark Attendance
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Package size={18} />}
              onClick={() => navigate('/manager/inventory')}
              style={{ justifyContent: 'flex-start' }}
            >
              Check Inventory
            </Button>
            <Button
              variant="secondary"
              leftIcon={<TrendingUp size={18} />}
              onClick={() => navigate('/manager/analytics')}
              style={{ justifyContent: 'flex-start' }}
            >
              View Analytics
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
