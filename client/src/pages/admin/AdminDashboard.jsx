import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  BarChart3, Users, MapPin, TrendingUp, DollarSign, Package, Calendar,
  Activity, PieChart as PieChartIcon, Filter 
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [prices, setPrices] = useState([]);
  
  // Filters
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedPump, setSelectedPump] = useState('all');

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedPump]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const params = {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };
      
      if (selectedPump !== 'all') {
        params.pumpId = selectedPump;
      }

      const [salesRes, employeesRes, pumpsRes, pricesRes] = await Promise.all([
        api.get('/sales', { params }),
        api.get('/users'),
        api.get('/pumps'),
        api.get('/prices/current'),
      ]);

      if (salesRes.data.success) setSales(salesRes.data.data || []);
      if (employeesRes.data.success) setEmployees(employeesRes.data.data || []);
      if (pumpsRes.data.success) setPumps(pumpsRes.data.data || []);
      if (pricesRes.data.success) setPrices(pricesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalSales = sales.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const activePumps = pumps.filter(p => p.status === 'active').length;

  // Sales by date (for trend chart)
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, count: 0 };
    }
    acc[date].revenue += sale.totalAmount || 0;
    acc[date].count += 1;
    return acc;
  }, {});
  const revenueTrend = Object.values(salesByDate).slice(-14); // Last 14 days

  // Sales by fuel type
  const salesByFuelType = sales.reduce((acc, sale) => {
    const type = sale.fuelType || 'Unknown';
    if (!acc[type]) {
      acc[type] = { name: type, value: 0, quantity: 0 };
    }
    acc[type].value += sale.totalAmount || 0;
    acc[type].quantity += sale.quantity || 0;
    return acc;
  }, {});
  const fuelTypeData = Object.values(salesByFuelType);

  // Sales by pump
  const salesByPump = sales.reduce((acc, sale) => {
    const pumpName = sale.pumpId?.name || 'Unknown';
    if (!acc[pumpName]) {
      acc[pumpName] = { name: pumpName, sales: 0, revenue: 0 };
    }
    acc[pumpName].sales += 1;
    acc[pumpName].revenue += sale.totalAmount || 0;
    return acc;
  }, {});
  const pumpData = Object.values(salesByPump);

  // Employee distribution
  const employeesByRole = employees.reduce((acc, emp) => {
    const role = emp.role || 'Unknown';
    if (!acc[role]) {
      acc[role] = { name: role.charAt(0).toUpperCase() + role.slice(1), value: 0 };
    }
    acc[role].value += 1;
    return acc;
  }, {});
  const employeeRoleData = Object.values(employeesByRole);

  // Top cashiers
  const cashierSales = sales.reduce((acc, sale) => {
    const cashierId = sale.cashierId?._id;
    const cashierName = sale.cashierId?.name || 'Unknown';
    if (cashierId) {
      if (!acc[cashierId]) {
        acc[cashierId] = { name: cashierName, sales: 0, revenue: 0 };
      }
      acc[cashierId].sales += 1;
      acc[cashierId].revenue += sale.totalAmount || 0;
    }
    return acc;
  }, {});
  const topCashiers = Object.values(cashierSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const formatCurrency = (value) => `৳${value.toLocaleString()}`;

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* Filters */}
        <Card>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Calendar size={20} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date Range:</span>
              <select
                className="input"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ width: 'auto', padding: 'var(--spacing-sm) var(--spacing-md)' }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Filter size={20} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Pump:</span>
              <select
                className="input"
                value={selectedPump}
                onChange={(e) => setSelectedPump(e.target.value)}
                style={{ width: 'auto', padding: 'var(--spacing-sm) var(--spacing-md)' }}
              >
                <option value="all">All Pumps</option>
                {pumps.map((pump) => (
                  <option key={pump._id} value={pump._id}>
                    {pump.name}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="secondary" size="sm" onClick={fetchData}>
              Refresh Data
            </Button>
          </div>
        </Card>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                <DollarSign />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Revenue</p>
                <h2 style={{ margin: 0 }}>{formatCurrency(totalRevenue)}</h2>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-success, #4CAF50)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                <TrendingUp />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Sales</p>
                <h2 style={{ margin: 0 }}>{totalSales}</h2>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-warning, #FF9800)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                <Users />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Active Employees</p>
                <h2 style={{ margin: 0 }}>{activeEmployees}</h2>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-danger, #F44336)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                <MapPin />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Active Pumps</p>
                <h2 style={{ margin: 0 }}>{activePumps}</h2>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card title="Revenue Trend" icon={<Activity />} subtitle={`Last ${Math.min(revenueTrend.length, 14)} days`}>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="count" stroke="#2196F3" strokeWidth={2} name="Sales Count" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
              No sales data available for the selected period
            </p>
          )}
        </Card>

        {/* Sales by Fuel Type & Pump */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <Card title="Sales by Fuel Type" icon={<PieChartIcon />}>
            {fuelTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fuelTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fuelTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
                No fuel type data available
              </p>
            )}
          </Card>

          <Card title="Sales by Pump" icon={<BarChart3 />}>
            {pumpData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pumpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" />
                  <Bar dataKey="sales" fill="#2196F3" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
                No pump data available
              </p>
            )}
          </Card>
        </div>

        {/* Employee Distribution & Top Cashiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <Card title="Employee Distribution" icon={<Users />}>
            {employeeRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={employeeRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {employeeRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
                No employee data available
              </p>
            )}
          </Card>

          <Card title="Top Cashiers" icon={<TrendingUp />} subtitle="By revenue">
            {topCashiers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {topCashiers.map((cashier, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: COLORS[index % COLORS.length],
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{cashier.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {formatCurrency(cashier.revenue)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {cashier.sales} sales
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
                No cashier data available
              </p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
