import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Package,
  TrendingUp,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { getInventory } from "../../services/inventoryApi";
import { getOrders } from "../../services/orderApi";
import { getSales } from "../../services/salesApi";
import api from "../../services/api";
import toast from "react-hot-toast";
import "./ManagerDashboard.css";

// Chart colors
const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  orange: "#f97316",
};

const FUEL_COLORS = {
  Petrol: "#3b82f6",
  Diesel: "#10b981",
  Octane: "#f59e0b",
  CNG: "#8b5cf6",
  LPG: "#ec4899",
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalOrders: 0,
  });
  const [inventoryData, setInventoryData] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [salesByFuel, setSalesByFuel] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [salesStats, setSalesStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    weekSales: 0,
    weekRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [employeesRes, inventoryRes, ordersRes, attendanceRes, salesRes] =
        await Promise.allSettled([
          api.get("/users"),
          getInventory(),
          getOrders(),
          api.get("/attendance"),
          getSales(),
        ]);

      // Process employees
      if (
        employeesRes.status === "fulfilled" &&
        employeesRes.value.data.success
      ) {
        const employees = employeesRes.value.data.data || [];
        const active = employees.filter((e) => e.status === "active");
        setStats((prev) => ({
          ...prev,
          totalEmployees: employees.length,
          activeEmployees: active.length,
        }));
      }

      // Process inventory
      if (inventoryRes.status === "fulfilled" && inventoryRes.value.success) {
        const inventory = inventoryRes.value.data || [];
        const chartData = inventory.map((item) => ({
          name: item.fuelType,
          stock: item.currentStock || 0,
          fill: FUEL_COLORS[item.fuelType] || COLORS.primary,
        }));
        setInventoryData(chartData);
      }

      // Process orders
      if (ordersRes.status === "fulfilled" && ordersRes.value.success) {
        const orders = ordersRes.value.data || [];

        // Count by status
        const statusCounts = {
          pending: 0,
          delivered: 0,
          cancelled: 0,
          created: 0,
        };
        orders.forEach((order) => {
          if (order.status === "created" || order.status === "emailed") {
            statusCounts.pending++;
          } else if (statusCounts[order.status] !== undefined) {
            statusCounts[order.status]++;
          }
        });

        setStats((prev) => ({
          ...prev,
          pendingOrders: statusCounts.pending + statusCounts.created,
          deliveredOrders: statusCounts.delivered,
          totalOrders: orders.length,
        }));

        setOrdersByStatus([
          {
            name: language === "bn" ? "অপেক্ষমাণ" : "Pending",
            value: statusCounts.pending,
            color: COLORS.warning,
          },
          {
            name: language === "bn" ? "সরবরাহ হয়েছে" : "Delivered",
            value: statusCounts.delivered,
            color: COLORS.success,
          },
          {
            name: language === "bn" ? "বাতিল" : "Cancelled",
            value: statusCounts.cancelled,
            color: COLORS.danger,
          },
        ]);

        // Recent orders
        setRecentOrders(orders.slice(0, 5));
      }

      // Process attendance
      if (
        attendanceRes.status === "fulfilled" &&
        attendanceRes.value.data.success
      ) {
        const attendance = attendanceRes.value.data.data || [];
        const today = new Date().toDateString();

        // Today's attendance
        const todayRecords = attendance.filter(
          (a) => new Date(a.date).toDateString() === today
        );
        const present = todayRecords.filter(
          (a) => a.status === "present"
        ).length;
        const absent = todayRecords.filter((a) => a.status === "absent").length;

        setStats((prev) => ({
          ...prev,
          presentToday: present,
          absentToday: absent,
        }));

        // Build attendance trend for last 7 days
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          const dayRecords = attendance.filter(
            (a) => new Date(a.date).toDateString() === dateStr
          );
          const dayPresent = dayRecords.filter(
            (a) => a.status === "present"
          ).length;
          const dayAbsent = dayRecords.filter(
            (a) => a.status === "absent"
          ).length;

          trendData.push({
            day: date.toLocaleDateString(
              language === "bn" ? "bn-BD" : "en-US",
              {
                weekday: "short",
              }
            ),
            present: dayPresent,
            absent: dayAbsent,
          });
        }
        setAttendanceTrend(trendData);
      }

      // Process sales
      if (salesRes.status === "fulfilled" && salesRes.value.success) {
        const sales = salesRes.value.data || [];
        setRecentSales(sales.slice(0, 5));

        // Calculate today's and week's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        let todaySalesCount = 0;
        let todayRevenue = 0;
        let weekSalesCount = 0;
        let weekRevenue = 0;
        const fuelTotals = {};

        sales.forEach((sale) => {
          const saleDate = new Date(sale.createdAt);
          const amount = sale.quantity * sale.unitPrice;

          // Today's stats
          if (saleDate >= today) {
            todaySalesCount++;
            todayRevenue += amount;
          }

          // Week's stats
          if (saleDate >= weekAgo) {
            weekSalesCount++;
            weekRevenue += amount;
          }

          // Aggregate by fuel type
          if (!fuelTotals[sale.fuelType]) {
            fuelTotals[sale.fuelType] = { quantity: 0, revenue: 0, count: 0 };
          }
          fuelTotals[sale.fuelType].quantity += sale.quantity;
          fuelTotals[sale.fuelType].revenue += amount;
          fuelTotals[sale.fuelType].count++;
        });

        setSalesStats({
          todaySales: todaySalesCount,
          todayRevenue,
          weekSales: weekSalesCount,
          weekRevenue,
        });

        // Sales by fuel type for chart
        const fuelChartData = Object.entries(fuelTotals).map(
          ([fuel, data]) => ({
            name: fuel,
            quantity: data.quantity,
            revenue: data.revenue,
            count: data.count,
            fill: FUEL_COLORS[fuel] || COLORS.primary,
          })
        );
        setSalesByFuel(fuelChartData);

        // Sales trend for last 7 days
        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const daySales = sales.filter((s) => {
            const saleDate = new Date(s.createdAt);
            return saleDate >= date && saleDate < nextDate;
          });

          const dayRevenue = daySales.reduce(
            (sum, s) => sum + s.quantity * s.unitPrice,
            0
          );
          const dayQuantity = daySales.reduce((sum, s) => sum + s.quantity, 0);

          salesTrend.push({
            day: date.toLocaleDateString(
              language === "bn" ? "bn-BD" : "en-US",
              {
                weekday: "short",
              }
            ),
            revenue: dayRevenue,
            quantity: dayQuantity,
            count: daySales.length,
          });
        }
        setSalesData(salesTrend);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error(
        language === "bn"
          ? "ড্যাশবোর্ড ডেটা লোড করতে ব্যর্থ"
          : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(
      num
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      created: {
        color: "#6b7280",
        label: language === "bn" ? "তৈরি" : "Created",
      },
      emailed: {
        color: "#3b82f6",
        label: language === "bn" ? "ইমেল" : "Emailed",
      },
      pending: {
        color: "#f59e0b",
        label: language === "bn" ? "অপেক্ষমাণ" : "Pending",
      },
      delivered: {
        color: "#10b981",
        label: language === "bn" ? "সরবরাহ" : "Delivered",
      },
      cancelled: {
        color: "#ef4444",
        label: language === "bn" ? "বাতিল" : "Cancelled",
      },
    };
    const cfg = config[status] || config.pending;
    return (
      <span
        className='status-badge'
        style={{ background: `${cfg.color}20`, color: cfg.color }}
      >
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role='manager'>
        <div className='dashboard-loading'>
          <div className='spinner-large'></div>
          <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading dashboard..."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role='manager'>
      <div className='manager-dashboard'>
        {/* Stats Cards */}
        <div className='stats-grid'>
          {/* Employees */}
          <div
            className='stat-card'
            onClick={() => navigate("/manager/employees")}
          >
            <div className='stat-icon employees'>
              <Users size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "মোট কর্মচারী" : "Total Employees"}
              </p>
              <h3 className='stat-value'>
                {formatNumber(stats.totalEmployees)}
              </h3>
              <p className='stat-change positive'>
                <CheckCircle size={14} />
                {stats.activeEmployees}{" "}
                {language === "bn" ? "সক্রিয়" : "active"}
              </p>
            </div>
          </div>

          {/* Today's Attendance */}
          <div
            className='stat-card'
            onClick={() => navigate("/manager/attendance")}
          >
            <div className='stat-icon attendance'>
              <Calendar size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "আজকের উপস্থিতি" : "Today's Attendance"}
              </p>
              <h3 className='stat-value'>{formatNumber(stats.presentToday)}</h3>
              <p className='stat-change negative'>
                <XCircle size={14} />
                {stats.absentToday} {language === "bn" ? "অনুপস্থিত" : "absent"}
              </p>
            </div>
          </div>

          {/* Pending Orders */}
          <div
            className='stat-card'
            onClick={() => navigate("/manager/orders")}
          >
            <div className='stat-icon orders'>
              <Truck size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "অপেক্ষমাণ অর্ডার" : "Pending Orders"}
              </p>
              <h3 className='stat-value'>
                {formatNumber(stats.pendingOrders)}
              </h3>
              <p className='stat-change positive'>
                <CheckCircle size={14} />
                {stats.deliveredOrders}{" "}
                {language === "bn" ? "সরবরাহ" : "delivered"}
              </p>
            </div>
          </div>

          {/* Inventory Status */}
          <div
            className='stat-card'
            onClick={() => navigate("/manager/inventory")}
          >
            <div className='stat-icon inventory'>
              <Package size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Types"}
              </p>
              <h3 className='stat-value'>
                {formatNumber(inventoryData.length)}
              </h3>
              <p className='stat-change'>
                <TrendingUp size={14} />
                {language === "bn" ? "ইনভেন্টরি দেখুন" : "View inventory"}
              </p>
            </div>
          </div>

          {/* Today's Sales */}
          <div className='stat-card'>
            <div className='stat-icon sales'>
              <DollarSign size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "আজকের বিক্রয়" : "Today's Sales"}
              </p>
              <h3 className='stat-value'>
                {formatNumber(salesStats.todaySales)}
              </h3>
              <p className='stat-change positive'>
                <DollarSign size={14} />৳
                {formatNumber(salesStats.todayRevenue.toFixed(0))}
              </p>
            </div>
          </div>

          {/* Weekly Revenue */}
          <div className='stat-card'>
            <div className='stat-icon revenue'>
              <TrendingUp size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "সাপ্তাহিক আয়" : "Weekly Revenue"}
              </p>
              <h3 className='stat-value'>
                ৳{formatNumber(salesStats.weekRevenue.toFixed(0))}
              </h3>
              <p className='stat-change positive'>
                <CheckCircle size={14} />
                {salesStats.weekSales} {language === "bn" ? "বিক্রয়" : "sales"}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className='charts-grid'>
          {/* Fuel Inventory Chart */}
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <Package size={20} />
                {language === "bn" ? "জ্বালানি মজুদ" : "Fuel Inventory"}
              </h3>
              <button
                className='chart-action'
                onClick={() => navigate("/manager/inventory")}
              >
                {language === "bn" ? "বিস্তারিত" : "Details"}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className='chart-body'>
              {inventoryData.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <BarChart data={inventoryData} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                    <XAxis type='number' />
                    <YAxis dataKey='name' type='category' width={80} />
                    <Tooltip
                      formatter={(value) => [
                        `${formatNumber(value)} L`,
                        "Stock",
                      ]}
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey='stock' radius={[0, 4, 4, 0]}>
                      {inventoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-chart'>
                  <Package size={48} />
                  <p>
                    {language === "bn" ? "কোন ডেটা নেই" : "No inventory data"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Orders by Status Pie Chart */}
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <Truck size={20} />
                {language === "bn" ? "অর্ডার স্থিতি" : "Orders by Status"}
              </h3>
              <button
                className='chart-action'
                onClick={() => navigate("/manager/orders")}
              >
                {language === "bn" ? "বিস্তারিত" : "Details"}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className='chart-body'>
              {stats.totalOrders > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-chart'>
                  <Truck size={48} />
                  <p>
                    {language === "bn" ? "কোন অর্ডার নেই" : "No orders yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales by Fuel Type */}
        <div className='charts-grid'>
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <DollarSign size={20} />
                {language === "bn"
                  ? "জ্বালানি অনুযায়ী বিক্রয়"
                  : "Sales by Fuel Type"}
              </h3>
            </div>
            <div className='chart-body'>
              {salesByFuel.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <PieChart>
                    <Pie
                      data={salesByFuel}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey='revenue'
                    >
                      {salesByFuel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `৳${formatNumber(value.toFixed(0))}`,
                        props.payload.name,
                      ]}
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-chart'>
                  <DollarSign size={48} />
                  <p>
                    {language === "bn" ? "কোন বিক্রয় নেই" : "No sales data"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <TrendingUp size={20} />
                {language === "bn"
                  ? "বিক্রয় প্রবণতা (৭ দিন)"
                  : "Sales Trend (7 Days)"}
              </h3>
            </div>
            <div className='chart-body'>
              {salesData.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient
                        id='colorRevenue'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='5%'
                          stopColor={COLORS.success}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset='95%'
                          stopColor={COLORS.success}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                    <XAxis dataKey='day' />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue"
                          ? `৳${formatNumber(value.toFixed(0))}`
                          : formatNumber(value),
                        name === "revenue"
                          ? language === "bn"
                            ? "আয়"
                            : "Revenue"
                          : language === "bn"
                          ? "পরিমাণ"
                          : "Quantity",
                      ]}
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      name={language === "bn" ? "আয়" : "Revenue"}
                      stroke={COLORS.success}
                      fillOpacity={1}
                      fill='url(#colorRevenue)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-chart'>
                  <TrendingUp size={48} />
                  <p>{language === "bn" ? "কোন ডেটা নেই" : "No sales data"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className='chart-card full-width'>
          <div className='chart-header'>
            <h3>
              <Calendar size={20} />
              {language === "bn"
                ? "উপস্থিতি প্রবণতা (সাত দিন)"
                : "Attendance Trend (7 Days)"}
            </h3>
            <button
              className='chart-action'
              onClick={() => navigate("/manager/attendance")}
            >
              {language === "bn" ? "বিস্তারিত" : "Details"}
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className='chart-body'>
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient
                      id='colorPresent'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop
                        offset='5%'
                        stopColor={COLORS.success}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset='95%'
                        stopColor={COLORS.success}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id='colorAbsent'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop
                        offset='5%'
                        stopColor={COLORS.danger}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset='95%'
                        stopColor={COLORS.danger}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                  <XAxis dataKey='day' />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type='monotone'
                    dataKey='present'
                    name={language === "bn" ? "উপস্থিত" : "Present"}
                    stroke={COLORS.success}
                    fillOpacity={1}
                    fill='url(#colorPresent)'
                  />
                  <Area
                    type='monotone'
                    dataKey='absent'
                    name={language === "bn" ? "অনুপস্থিত" : "Absent"}
                    stroke={COLORS.danger}
                    fillOpacity={1}
                    fill='url(#colorAbsent)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='empty-chart'>
                <Calendar size={48} />
                <p>
                  {language === "bn" ? "কোন ডেটা নেই" : "No attendance data"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders & Sales */}
        <div className='recent-grid'>
          {/* Recent Orders */}
          <div className='recent-section'>
            <div className='section-header'>
              <h3>
                <Truck size={20} />
                {language === "bn" ? "সাম্প্রতিক অর্ডার" : "Recent Orders"}
              </h3>
              <button
                className='chart-action'
                onClick={() => navigate("/manager/orders")}
              >
                {language === "bn" ? "সব দেখুন" : "View All"}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className='recent-list'>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} className='recent-item'>
                    <div className='recent-info'>
                      <span className='recent-title'>
                        {order.invoiceId?.invoiceNo || "N/A"}
                      </span>
                      <span className='recent-subtitle'>
                        {order.supplierId?.companyName || "Unknown Supplier"}
                      </span>
                    </div>
                    <div className='recent-meta'>
                      <span className='recent-date'>
                        {new Date(order.createdAt).toLocaleDateString(
                          language === "bn" ? "bn-BD" : "en-US"
                        )}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className='empty-list'>
                  <Truck size={32} />
                  <p>
                    {language === "bn" ? "কোন অর্ডার নেই" : "No recent orders"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className='recent-section'>
            <div className='section-header'>
              <h3>
                <DollarSign size={20} />
                {language === "bn" ? "সাম্প্রতিক বিক্রয়" : "Recent Sales"}
              </h3>
            </div>
            <div className='recent-list'>
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale._id} className='recent-item'>
                    <div className='recent-info'>
                      <span className='recent-title'>
                        {sale.receiptId?.receiptNo || "N/A"}
                      </span>
                      <span className='recent-subtitle'>
                        {sale.fuelType} - {formatNumber(sale.quantity)}L
                      </span>
                    </div>
                    <div className='recent-meta'>
                      <span className='recent-amount'>
                        ৳
                        {formatNumber(
                          (sale.quantity * sale.unitPrice).toFixed(0)
                        )}
                      </span>
                      <span className='recent-date'>
                        {new Date(sale.createdAt).toLocaleTimeString(
                          language === "bn" ? "bn-BD" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='empty-list'>
                  <DollarSign size={32} />
                  <p>
                    {language === "bn" ? "কোন বিক্রয় নেই" : "No recent sales"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='quick-actions'>
          <h3>{language === "bn" ? "দ্রুত কার্যক্রম" : "Quick Actions"}</h3>
          <div className='actions-grid'>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/employees")}
            >
              <Users size={20} />
              {language === "bn" ? "কর্মচারী" : "Employees"}
            </button>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/attendance")}
            >
              <Calendar size={20} />
              {language === "bn" ? "উপস্থিতি" : "Attendance"}
            </button>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/shifts")}
            >
              <Clock size={20} />
              {language === "bn" ? "শিফট" : "Shifts"}
            </button>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/payroll")}
            >
              <DollarSign size={20} />
              {language === "bn" ? "বেতন" : "Payroll"}
            </button>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/inventory")}
            >
              <Package size={20} />
              {language === "bn" ? "ইনভেন্টরি" : "Inventory"}
            </button>
            <button
              className='action-btn'
              onClick={() => navigate("/manager/orders")}
            >
              <Truck size={20} />
              {language === "bn" ? "অর্ডার" : "Orders"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
