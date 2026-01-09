import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import {
  getInventory,
  createStockIn,
  createAdjustment,
  getInventoryLedger,
  setLowStockThreshold,
} from "../../services/inventoryApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  Settings,
  History,
  TrendingUp,
  TrendingDown,
  Droplet,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import "./InventoryPage.css";

// Fuel type colors
const FUEL_COLORS = {
  Petrol: "#ef4444",
  Diesel: "#3b82f6",
  Octane: "#10b981",
  CNG: "#f59e0b",
  LPG: "#8b5cf6",
  default: "#6b7280",
};

const getFuelColor = (fuelType) => {
  return FUEL_COLORS[fuelType] || FUEL_COLORS.default;
};

export default function InventoryPage() {
  const { language } = useLanguage();

  const [inventory, setInventory] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    fuelType: "",
    quantity: "",
    notes: "",
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    fuelType: "",
    quantity: "",
    notes: "",
  });
  const [thresholdForm, setThresholdForm] = useState({
    fuelType: "",
    lowStockThreshold: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getInventory();
      setInventory(response.data || []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error(
        language === "bn"
          ? "ইনভেন্টরি লোড করতে ব্যর্থ"
          : "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
    toast.success(
      language === "bn" ? "ইনভেন্টরি আপডেট হয়েছে" : "Inventory refreshed"
    );
  };

  const fetchLedger = async () => {
    try {
      const response = await getInventoryLedger();
      setLedger(response.data || []);
      setShowLedgerModal(true);
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
      toast.error(
        language === "bn"
          ? "লেজার লোড করতে ব্যর্থ"
          : "Failed to load ledger history"
      );
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!stockInForm.fuelType || !stockInForm.quantity) {
      toast.error(
        language === "bn"
          ? "জ্বালানি প্রকার এবং পরিমাণ প্রয়োজন"
          : "Fuel type and quantity are required"
      );
      return;
    }

    try {
      setFormLoading(true);
      await createStockIn({
        fuelType: stockInForm.fuelType,
        quantity: parseFloat(stockInForm.quantity),
        notes: stockInForm.notes,
      });
      toast.success(
        language === "bn"
          ? "স্টক সফলভাবে যোগ হয়েছে"
          : "Stock added successfully"
      );
      setShowStockInModal(false);
      setStockInForm({ fuelType: "", quantity: "", notes: "" });
      fetchInventory();
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn" ? "স্টক যোগ করতে ব্যর্থ" : "Failed to add stock")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.fuelType || adjustmentForm.quantity === "") {
      toast.error(
        language === "bn"
          ? "জ্বালানি প্রকার এবং পরিমাণ প্রয়োজন"
          : "Fuel type and quantity are required"
      );
      return;
    }

    try {
      setFormLoading(true);
      await createAdjustment({
        fuelType: adjustmentForm.fuelType,
        quantity: parseFloat(adjustmentForm.quantity),
        notes: adjustmentForm.notes,
      });
      toast.success(
        language === "bn"
          ? "সমন্বয় সফলভাবে হয়েছে"
          : "Adjustment made successfully"
      );
      setShowAdjustmentModal(false);
      setAdjustmentForm({ fuelType: "", quantity: "", notes: "" });
      fetchInventory();
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn"
            ? "সমন্বয় করতে ব্যর্থ"
            : "Failed to make adjustment")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetThreshold = async (e) => {
    e.preventDefault();
    if (!thresholdForm.fuelType || thresholdForm.lowStockThreshold === "") {
      toast.error(
        language === "bn"
          ? "জ্বালানি প্রকার এবং থ্রেশহোল্ড প্রয়োজন"
          : "Fuel type and threshold are required"
      );
      return;
    }

    try {
      setFormLoading(true);
      await setLowStockThreshold({
        fuelType: thresholdForm.fuelType,
        lowStockThreshold: parseFloat(thresholdForm.lowStockThreshold),
      });
      toast.success(
        language === "bn"
          ? "থ্রেশহোল্ড সেট হয়েছে"
          : "Threshold set successfully"
      );
      setShowThresholdModal(false);
      setThresholdForm({ fuelType: "", lowStockThreshold: "" });
      fetchInventory();
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn"
            ? "থ্রেশহোল্ড সেট করতে ব্যর্থ"
            : "Failed to set threshold")
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Prepare chart data
  const chartData = inventory.map((item) => ({
    fuelType: item.fuelType,
    currentStock: item.currentStock,
    lowStockThreshold: item.lowStockThreshold || 0,
    isLowStock: item.isLowStock,
    fill: getFuelColor(item.fuelType),
  }));

  // Calculate totals
  const totalStock = inventory.reduce(
    (sum, item) => sum + (item.currentStock || 0),
    0
  );
  const lowStockCount = inventory.filter((item) => item.isLowStock).length;

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='chart-tooltip'>
          <p className='tooltip-title'>{data.fuelType}</p>
          <p className='tooltip-value'>
            <strong>{data.currentStock?.toLocaleString()}</strong> L
          </p>
          {data.lowStockThreshold > 0 && (
            <p className='tooltip-threshold'>
              {language === "bn" ? "ন্যূনতম:" : "Min:"}{" "}
              {data.lowStockThreshold?.toLocaleString()} L
            </p>
          )}
          {data.isLowStock && (
            <p className='tooltip-warning'>
              <AlertTriangle size={14} />
              {language === "bn" ? "স্টক কম!" : "Low Stock!"}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getEntryTypeLabel = (type) => {
    const labels = {
      stock_in: language === "bn" ? "স্টক ইন" : "Stock In",
      stock_out: language === "bn" ? "স্টক আউট" : "Stock Out",
      adjustment: language === "bn" ? "সমন্বয়" : "Adjustment",
    };
    return labels[type] || type;
  };

  // Get unique fuel types from existing inventory + common types
  const fuelTypes = [
    ...new Set([
      "Petrol",
      "Diesel",
      "Octane",
      "CNG",
      "LPG",
      ...inventory.map((i) => i.fuelType),
    ]),
  ];

  return (
    <DashboardLayout role='manager'>
      <div className='inventory-page'>
        {/* Header */}
        <div className='page-header'>
          <div>
            <h1>
              <Package size={28} />
              {language === "bn" ? "ইনভেন্টরি" : "Fuel Inventory"}
            </h1>
            <p className='text-secondary'>
              {language === "bn"
                ? "জ্বালানি স্টক স্তর ট্র্যাক ও পরিচালনা করুন"
                : "Track and manage fuel stock levels"}
            </p>
          </div>
          <div className='header-actions'>
            <Button
              variant='secondary'
              leftIcon={
                <RefreshCw size={18} className={refreshing ? "spin" : ""} />
              }
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {language === "bn" ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button
              variant='secondary'
              leftIcon={<History size={18} />}
              onClick={fetchLedger}
            >
              {language === "bn" ? "ইতিহাস" : "History"}
            </Button>
            <Button
              variant='primary'
              leftIcon={<Plus size={18} />}
              onClick={() => setShowStockInModal(true)}
            >
              {language === "bn" ? "স্টক যোগ করুন" : "Add Stock"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className='summary-cards'>
          <div className='summary-card'>
            <div className='summary-icon'>
              <Droplet size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "মোট স্টক" : "Total Stock"}
              </p>
              <p className='summary-value'>
                {totalStock.toLocaleString()} <span>L</span>
              </p>
            </div>
          </div>

          <div className='summary-card'>
            <div className='summary-icon'>
              <Package size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Types"}
              </p>
              <p className='summary-value'>{inventory.length}</p>
            </div>
          </div>

          <div className={`summary-card ${lowStockCount > 0 ? "warning" : ""}`}>
            <div
              className={`summary-icon ${lowStockCount > 0 ? "warning" : ""}`}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className='summary-label'>
                {language === "bn" ? "কম স্টক সতর্কতা" : "Low Stock Alerts"}
              </p>
              <p className='summary-value'>{lowStockCount}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className='loading-state'>
            <Package size={48} />
            <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading inventory..."}</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className='empty-state'>
            <Package size={64} />
            <h3>
              {language === "bn"
                ? "কোন ইনভেন্টরি ডেটা নেই"
                : "No Inventory Data"}
            </h3>
            <p>
              {language === "bn"
                ? "প্রথম স্টক যোগ করে শুরু করুন"
                : "Get started by adding your first stock entry"}
            </p>
            <Button
              variant='primary'
              leftIcon={<Plus size={18} />}
              onClick={() => setShowStockInModal(true)}
            >
              {language === "bn" ? "স্টক যোগ করুন" : "Add Stock"}
            </Button>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className='chart-container'>
              <div className='chart-header'>
                <h2>
                  {language === "bn"
                    ? "জ্বালানি স্টক স্তর"
                    : "Fuel Stock Levels"}
                </h2>
                <div className='chart-actions'>
                  <Button
                    variant='ghost'
                    size='sm'
                    leftIcon={<Minus size={16} />}
                    onClick={() => setShowAdjustmentModal(true)}
                  >
                    {language === "bn" ? "সমন্বয়" : "Adjust"}
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    leftIcon={<Settings size={16} />}
                    onClick={() => setShowThresholdModal(true)}
                  >
                    {language === "bn" ? "থ্রেশহোল্ড" : "Thresholds"}
                  </Button>
                </div>
              </div>

              <div className='chart-wrapper'>
                <ResponsiveContainer width='100%' height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                    <XAxis
                      dataKey='fuelType'
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                      angle={-45}
                      textAnchor='end'
                      height={60}
                    />
                    <YAxis
                      tick={{
                        fill: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                      tickFormatter={(value) => `${value.toLocaleString()} L`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey='currentStock'
                      radius={[8, 8, 0, 0]}
                      maxBarSize={80}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          opacity={entry.isLowStock ? 0.6 : 1}
                          stroke={entry.isLowStock ? "#ef4444" : "none"}
                          strokeWidth={entry.isLowStock ? 2 : 0}
                        />
                      ))}
                    </Bar>
                    {/* Show threshold line if any */}
                    {chartData.some((d) => d.lowStockThreshold > 0) && (
                      <ReferenceLine
                        y={Math.max(
                          ...chartData.map((d) => d.lowStockThreshold)
                        )}
                        stroke='#ef4444'
                        strokeDasharray='5 5'
                        label={{
                          value:
                            language === "bn" ? "ন্যূনতম স্তর" : "Min Level",
                          fill: "#ef4444",
                          fontSize: 12,
                        }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Cards */}
            <div className='inventory-grid'>
              {inventory.map((item) => (
                <div
                  key={item.fuelType}
                  className={`inventory-card ${
                    item.isLowStock ? "low-stock" : ""
                  }`}
                  style={{ borderLeftColor: getFuelColor(item.fuelType) }}
                >
                  <div className='inventory-card-header'>
                    <div
                      className='fuel-icon'
                      style={{ background: getFuelColor(item.fuelType) }}
                    >
                      <Droplet size={20} />
                    </div>
                    <h3>{item.fuelType}</h3>
                    {item.isLowStock && (
                      <span className='low-stock-badge'>
                        <AlertTriangle size={14} />
                        {language === "bn" ? "কম" : "Low"}
                      </span>
                    )}
                  </div>
                  <div className='inventory-card-body'>
                    <p className='stock-value'>
                      {item.currentStock?.toLocaleString()}{" "}
                      <span className='unit'>L</span>
                    </p>
                    {item.lowStockThreshold > 0 && (
                      <p className='threshold-info'>
                        {language === "bn" ? "ন্যূনতম:" : "Min:"}{" "}
                        {item.lowStockThreshold?.toLocaleString()} L
                      </p>
                    )}
                  </div>
                  <div className='inventory-card-footer'>
                    {item.currentStock > (item.lowStockThreshold || 0) * 2 ? (
                      <span className='status-good'>
                        <TrendingUp size={14} />
                        {language === "bn" ? "ভালো" : "Good"}
                      </span>
                    ) : item.isLowStock ? (
                      <span className='status-critical'>
                        <TrendingDown size={14} />
                        {language === "bn" ? "সংকট" : "Critical"}
                      </span>
                    ) : (
                      <span className='status-ok'>
                        {language === "bn" ? "ঠিক আছে" : "OK"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stock In Modal */}
        <Modal
          isOpen={showStockInModal}
          onClose={() => setShowStockInModal(false)}
          title={language === "bn" ? "স্টক যোগ করুন" : "Add Stock"}
        >
          <form onSubmit={handleStockIn} className='modal-form'>
            <div className='form-group'>
              <label>
                {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Type"}
              </label>
              <select
                value={stockInForm.fuelType}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, fuelType: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>
                  {language === "bn" ? "নির্বাচন করুন" : "Select fuel type"}
                </option>
                {fuelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={language === "bn" ? "পরিমাণ (লিটার)" : "Quantity (Liters)"}
              type='number'
              min='0'
              step='0.01'
              value={stockInForm.quantity}
              onChange={(e) =>
                setStockInForm({ ...stockInForm, quantity: e.target.value })
              }
              required
            />
            <Input
              label={language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (Optional)"}
              value={stockInForm.notes}
              onChange={(e) =>
                setStockInForm({ ...stockInForm, notes: e.target.value })
              }
              placeholder={
                language === "bn"
                  ? "যেমন: সাপ্লায়ার ডেলিভারি"
                  : "e.g., Supplier delivery"
              }
            />
            <div className='modal-actions'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setShowStockInModal(false)}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button type='submit' variant='primary' loading={formLoading}>
                {language === "bn" ? "যোগ করুন" : "Add Stock"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Adjustment Modal */}
        <Modal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          title={language === "bn" ? "স্টক সমন্বয়" : "Stock Adjustment"}
        >
          <form onSubmit={handleAdjustment} className='modal-form'>
            <p className='modal-description'>
              {language === "bn"
                ? "স্টক বাড়াতে পজিটিভ এবং কমাতে নেগেটিভ মান দিন"
                : "Use positive values to add, negative to subtract"}
            </p>
            <div className='form-group'>
              <label>
                {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Type"}
              </label>
              <select
                value={adjustmentForm.fuelType}
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    fuelType: e.target.value,
                  })
                }
                className='input'
                required
              >
                <option value=''>
                  {language === "bn" ? "নির্বাচন করুন" : "Select fuel type"}
                </option>
                {inventory.map((item) => (
                  <option key={item.fuelType} value={item.fuelType}>
                    {item.fuelType} ({item.currentStock?.toLocaleString()} L)
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={
                language === "bn"
                  ? "সমন্বয় পরিমাণ (লিটার)"
                  : "Adjustment Amount (Liters)"
              }
              type='number'
              step='0.01'
              value={adjustmentForm.quantity}
              onChange={(e) =>
                setAdjustmentForm({
                  ...adjustmentForm,
                  quantity: e.target.value,
                })
              }
              placeholder={
                language === "bn" ? "যেমন: -50 বা 100" : "e.g., -50 or 100"
              }
              required
            />
            <Input
              label={language === "bn" ? "কারণ" : "Reason"}
              value={adjustmentForm.notes}
              onChange={(e) =>
                setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })
              }
              placeholder={
                language === "bn"
                  ? "সমন্বয়ের কারণ লিখুন"
                  : "Reason for adjustment"
              }
              required
            />
            <div className='modal-actions'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setShowAdjustmentModal(false)}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button type='submit' variant='primary' loading={formLoading}>
                {language === "bn" ? "সমন্বয় করুন" : "Apply Adjustment"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Threshold Modal */}
        <Modal
          isOpen={showThresholdModal}
          onClose={() => setShowThresholdModal(false)}
          title={
            language === "bn"
              ? "কম স্টক থ্রেশহোল্ড সেট করুন"
              : "Set Low Stock Threshold"
          }
        >
          <form onSubmit={handleSetThreshold} className='modal-form'>
            <p className='modal-description'>
              {language === "bn"
                ? "স্টক এই স্তরের নিচে গেলে সতর্কতা দেখাবে"
                : "You will be alerted when stock falls below this level"}
            </p>
            <div className='form-group'>
              <label>
                {language === "bn" ? "জ্বালানি প্রকার" : "Fuel Type"}
              </label>
              <select
                value={thresholdForm.fuelType}
                onChange={(e) =>
                  setThresholdForm({
                    ...thresholdForm,
                    fuelType: e.target.value,
                  })
                }
                className='input'
                required
              >
                <option value=''>
                  {language === "bn" ? "নির্বাচন করুন" : "Select fuel type"}
                </option>
                {fuelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={
                language === "bn"
                  ? "ন্যূনতম স্তর (লিটার)"
                  : "Minimum Level (Liters)"
              }
              type='number'
              min='0'
              step='1'
              value={thresholdForm.lowStockThreshold}
              onChange={(e) =>
                setThresholdForm({
                  ...thresholdForm,
                  lowStockThreshold: e.target.value,
                })
              }
              placeholder={language === "bn" ? "যেমন: 500" : "e.g., 500"}
              required
            />
            <div className='modal-actions'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setShowThresholdModal(false)}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button type='submit' variant='primary' loading={formLoading}>
                {language === "bn" ? "সেট করুন" : "Set Threshold"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Ledger History Modal */}
        <Modal
          isOpen={showLedgerModal}
          onClose={() => setShowLedgerModal(false)}
          title={language === "bn" ? "ইনভেন্টরি ইতিহাস" : "Inventory History"}
          size='lg'
        >
          <div className='ledger-list'>
            {ledger.length === 0 ? (
              <p className='empty-text'>
                {language === "bn" ? "কোন ইতিহাস নেই" : "No history available"}
              </p>
            ) : (
              <table className='ledger-table'>
                <thead>
                  <tr>
                    <th>{language === "bn" ? "তারিখ" : "Date"}</th>
                    <th>{language === "bn" ? "জ্বালানি" : "Fuel"}</th>
                    <th>{language === "bn" ? "প্রকার" : "Type"}</th>
                    <th>{language === "bn" ? "পরিমাণ" : "Quantity"}</th>
                    <th>{language === "bn" ? "নোট" : "Notes"}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.slice(0, 50).map((entry) => (
                    <tr key={entry._id}>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>
                        <span
                          className='fuel-badge'
                          style={{ background: getFuelColor(entry.fuelType) }}
                        >
                          {entry.fuelType}
                        </span>
                      </td>
                      <td>
                        <span className={`type-badge type-${entry.type}`}>
                          {getEntryTypeLabel(entry.type)}
                        </span>
                      </td>
                      <td
                        className={
                          entry.quantity > 0
                            ? "quantity-positive"
                            : "quantity-negative"
                        }
                      >
                        {entry.quantity > 0 ? "+" : ""}
                        {entry.quantity?.toLocaleString()} L
                      </td>
                      <td>{entry.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
