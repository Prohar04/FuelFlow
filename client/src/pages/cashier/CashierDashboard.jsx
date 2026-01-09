import { useState, useEffect } from "react";
import {
  DollarSign,
  Fuel,
  Receipt,
  TrendingUp,
  ShoppingCart,
  Clock,
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
} from "recharts";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { getSales, getCurrentPrices } from "../../services/salesApi";
import toast from "react-hot-toast";
import "./CashierDashboard.css";

const FUEL_COLORS = {
  Petrol: "#3b82f6",
  Diesel: "#10b981",
  Octane: "#f59e0b",
  CNG: "#8b5cf6",
  LPG: "#ec4899",
};

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalQuantity: 0,
    averageTransaction: 0,
  });
  const [salesByFuel, setSalesByFuel] = useState([]);
  const [prices, setPrices] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch sales and prices in parallel
      const [salesRes, pricesRes] = await Promise.allSettled([
        getSales({
          startDate: today.toISOString(),
          endDate: endOfDay.toISOString(),
        }),
        getCurrentPrices(),
      ]);

      // Process sales
      if (salesRes.status === "fulfilled" && salesRes.value.success) {
        const sales = salesRes.value.data || [];
        setTodaySales(sales);
        setRecentSales(sales.slice(0, 5));

        // Calculate stats
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalQuantity = sales.reduce(
          (sum, s) => sum + (s.quantity || 0),
          0
        );

        setStats({
          totalSales: sales.length,
          totalRevenue,
          totalQuantity,
          averageTransaction:
            sales.length > 0 ? totalRevenue / sales.length : 0,
        });

        // Group by fuel type
        const fuelGroups = {};
        sales.forEach((sale) => {
          if (!fuelGroups[sale.fuelType]) {
            fuelGroups[sale.fuelType] = {
              name: sale.fuelType,
              quantity: 0,
              revenue: 0,
              count: 0,
            };
          }
          fuelGroups[sale.fuelType].quantity += sale.quantity || 0;
          fuelGroups[sale.fuelType].revenue += sale.total || 0;
          fuelGroups[sale.fuelType].count += 1;
        });

        const chartData = Object.values(fuelGroups).map((group) => ({
          ...group,
          fill: FUEL_COLORS[group.name] || "#6b7280",
        }));
        setSalesByFuel(chartData);
      }

      // Process prices
      if (pricesRes.status === "fulfilled" && pricesRes.value.success) {
        setPrices(pricesRes.value.data || []);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(
      num
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <DashboardLayout role='cashier'>
        <div className='dashboard-loading'>
          <div className='spinner-large'></div>
          <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading dashboard..."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role='cashier'>
      <div className='cashier-dashboard'>
        {/* Welcome Header */}
        <div className='welcome-header'>
          <div className='welcome-text'>
            <h1>
              {language === "bn" ? "স্বাগতম, " : "Welcome, "}
              {user?.name || "Cashier"}!
            </h1>
            <p>
              {language === "bn"
                ? "আজকের বিক্রয়ের সারসংক্ষেপ"
                : "Here's your sales summary for today"}
            </p>
          </div>
          <button
            className='new-sale-btn'
            onClick={() => navigate("/cashier/pos")}
          >
            <ShoppingCart size={20} />
            {language === "bn" ? "নতুন বিক্রয়" : "New Sale"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className='stats-grid'>
          <div className='stat-card revenue'>
            <div className='stat-icon'>
              <DollarSign size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "আজকের আয়" : "Today's Revenue"}
              </p>
              <h3 className='stat-value'>
                {formatCurrency(stats.totalRevenue)}
              </h3>
            </div>
          </div>

          <div className='stat-card sales'>
            <div className='stat-icon'>
              <Receipt size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "মোট বিক্রয়" : "Total Sales"}
              </p>
              <h3 className='stat-value'>{formatNumber(stats.totalSales)}</h3>
            </div>
          </div>

          <div className='stat-card quantity'>
            <div className='stat-icon'>
              <Fuel size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "মোট লিটার" : "Total Liters"}
              </p>
              <h3 className='stat-value'>
                {formatNumber(stats.totalQuantity.toFixed(2))} L
              </h3>
            </div>
          </div>

          <div className='stat-card average'>
            <div className='stat-icon'>
              <TrendingUp size={24} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "গড় লেনদেন" : "Avg Transaction"}
              </p>
              <h3 className='stat-value'>
                {formatCurrency(stats.averageTransaction)}
              </h3>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className='charts-grid'>
          {/* Sales by Fuel Type */}
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <Fuel size={20} />
                {language === "bn"
                  ? "জ্বালানি অনুযায়ী বিক্রয়"
                  : "Sales by Fuel Type"}
              </h3>
            </div>
            <div className='chart-body'>
              {salesByFuel.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <BarChart data={salesByFuel}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "quantity"
                          ? `${value} L`
                          : formatCurrency(value),
                        name === "quantity"
                          ? language === "bn"
                            ? "পরিমাণ"
                            : "Quantity"
                          : language === "bn"
                          ? "আয়"
                          : "Revenue",
                      ]}
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey='quantity' radius={[4, 4, 0, 0]}>
                      {salesByFuel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-chart'>
                  <Fuel size={48} />
                  <p>
                    {language === "bn"
                      ? "আজ কোন বিক্রয় নেই"
                      : "No sales today"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className='chart-card'>
            <div className='chart-header'>
              <h3>
                <DollarSign size={20} />
                {language === "bn" ? "আয় বিতরণ" : "Revenue Distribution"}
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
                      formatter={(value) => formatCurrency(value)}
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
                    {language === "bn" ? "আজ কোন আয় নেই" : "No revenue today"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='bottom-grid'>
          {/* Current Prices */}
          <div className='prices-card'>
            <div className='card-header'>
              <h3>
                <DollarSign size={20} />
                {language === "bn" ? "বর্তমান দাম" : "Current Prices"}
              </h3>
            </div>
            <div className='prices-list'>
              {prices.length > 0 ? (
                prices.map((price) => (
                  <div key={price._id} className='price-item'>
                    <div
                      className='price-fuel'
                      style={{
                        background: `${
                          FUEL_COLORS[price.fuelType] || "#6b7280"
                        }20`,
                        color: FUEL_COLORS[price.fuelType] || "#6b7280",
                      }}
                    >
                      <Fuel size={18} />
                      {price.fuelType}
                    </div>
                    <div className='price-value'>
                      {formatCurrency(price.unitPrice)}
                      <span>/L</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className='empty-text'>
                  {language === "bn" ? "কোন দাম সেট নেই" : "No prices set"}
                </p>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className='recent-card'>
            <div className='card-header'>
              <h3>
                <Clock size={20} />
                {language === "bn" ? "সাম্প্রতিক বিক্রয়" : "Recent Sales"}
              </h3>
              <button
                className='view-all-btn'
                onClick={() => navigate("/cashier/history")}
              >
                {language === "bn" ? "সব দেখুন" : "View All"}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className='recent-list'>
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale._id} className='recent-item'>
                    <div className='sale-info'>
                      <span className='sale-receipt'>
                        {sale.receiptId?.receiptNo || "N/A"}
                      </span>
                      <span className='sale-details'>
                        {sale.fuelType} • {sale.quantity} L
                      </span>
                    </div>
                    <div className='sale-meta'>
                      <span className='sale-amount'>
                        {formatCurrency(sale.total)}
                      </span>
                      <span className='sale-time'>
                        {formatTime(sale.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='empty-list'>
                  <Receipt size={32} />
                  <p>
                    {language === "bn"
                      ? "আজ কোন বিক্রয় নেই"
                      : "No sales today yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='quick-actions'>
          <button
            className='action-btn primary'
            onClick={() => navigate("/cashier/pos")}
          >
            <ShoppingCart size={20} />
            {language === "bn" ? "নতুন বিক্রয়" : "New Sale"}
          </button>
          <button
            className='action-btn'
            onClick={() => navigate("/cashier/history")}
          >
            <Receipt size={20} />
            {language === "bn" ? "বিক্রয় ইতিহাস" : "Sales History"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
