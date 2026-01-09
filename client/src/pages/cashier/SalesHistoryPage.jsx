import { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Calendar,
  Fuel,
  DollarSign,
  Filter,
  X,
  Eye,
  Printer,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { getSales, getSaleById } from "../../services/salesApi";
import toast from "react-hot-toast";
import "./SalesHistoryPage.css";

const FUEL_COLORS = {
  Petrol: "#3b82f6",
  Diesel: "#10b981",
  Octane: "#f59e0b",
  CNG: "#8b5cf6",
  LPG: "#ec4899",
};

export default function SalesHistoryPage() {
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    fuelType: "",
    dateFrom: "",
    dateTo: "",
  });

  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalQuantity: 0,
  });

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await getSales();
      if (response.success) {
        setSales(response.data || []);
      }
    } catch (error) {
      console.error("Fetch sales error:", error);
      toast.error(
        language === "bn"
          ? "বিক্রয় ইতিহাস লোড করতে ব্যর্থ"
          : "Failed to load sales history"
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (sale) =>
          sale.receiptId?.receiptNo?.toLowerCase().includes(searchLower) ||
          sale.fuelType?.toLowerCase().includes(searchLower)
      );
    }

    // Fuel type filter
    if (filters.fuelType) {
      result = result.filter((sale) => sale.fuelType === filters.fuelType);
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((sale) => new Date(sale.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((sale) => new Date(sale.createdAt) <= toDate);
    }

    setFilteredSales(result);

    // Calculate stats
    const totalRevenue = result.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalQuantity = result.reduce((sum, s) => sum + (s.quantity || 0), 0);
    setStats({
      totalSales: result.length,
      totalRevenue,
      totalQuantity,
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fuelType: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handleViewDetails = async (sale) => {
    try {
      const response = await getSaleById(sale._id);
      if (response.success) {
        setSelectedSale(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error(
        language === "bn"
          ? "বিস্তারিত লোড করতে ব্যর্থ"
          : "Failed to load details"
      );
    }
  };

  const handlePrintReceipt = () => {
    window.print();
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getFuelTypes = () => {
    const types = new Set(sales.map((s) => s.fuelType));
    return Array.from(types);
  };

  if (loading) {
    return (
      <DashboardLayout role='cashier'>
        <div className='history-loading'>
          <div className='spinner-large'></div>
          <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role='cashier'>
      <div className='sales-history-page'>
        {/* Header */}
        <div className='page-header'>
          <div className='header-title'>
            <Receipt size={28} />
            <div>
              <h1>{language === "bn" ? "বিক্রয় ইতিহাস" : "Sales History"}</h1>
              <p>
                {language === "bn"
                  ? "আপনার সমস্ত বিক্রয় রেকর্ড দেখুন"
                  : "View all your sales records"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='stats-grid'>
          <div className='stat-card'>
            <div className='stat-icon sales'>
              <Receipt size={22} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "মোট বিক্রয়" : "Total Sales"}
              </p>
              <h3 className='stat-value'>{formatNumber(stats.totalSales)}</h3>
            </div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon revenue'>
              <DollarSign size={22} />
            </div>
            <div className='stat-content'>
              <p className='stat-label'>
                {language === "bn" ? "মোট আয়" : "Total Revenue"}
              </p>
              <h3 className='stat-value'>
                {formatCurrency(stats.totalRevenue)}
              </h3>
            </div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon quantity'>
              <Fuel size={22} />
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
        </div>

        {/* Filters */}
        <div className='filters-section'>
          <div className='search-box'>
            <Search size={20} />
            <input
              type='text'
              placeholder={
                language === "bn"
                  ? "রসিদ নম্বর খুঁজুন..."
                  : "Search by receipt number..."
              }
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div className='filter-group'>
            <Filter size={18} />
            <select
              value={filters.fuelType}
              onChange={(e) => handleFilterChange("fuelType", e.target.value)}
            >
              <option value=''>
                {language === "bn" ? "সব জ্বালানি" : "All Fuel Types"}
              </option>
              {getFuelTypes().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className='filter-group'>
            <Calendar size={18} />
            <input
              type='date'
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              placeholder={language === "bn" ? "থেকে" : "From"}
            />
          </div>

          <div className='filter-group'>
            <Calendar size={18} />
            <input
              type='date'
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              placeholder={language === "bn" ? "পর্যন্ত" : "To"}
            />
          </div>

          {(filters.search ||
            filters.fuelType ||
            filters.dateFrom ||
            filters.dateTo) && (
            <button className='clear-filters-btn' onClick={clearFilters}>
              <X size={16} />
              {language === "bn" ? "ফিল্টার মুছুন" : "Clear"}
            </button>
          )}
        </div>

        {/* Sales Table */}
        <div className='sales-table-container'>
          {filteredSales.length > 0 ? (
            <table className='sales-table'>
              <thead>
                <tr>
                  <th>{language === "bn" ? "রসিদ নং" : "Receipt No"}</th>
                  <th>{language === "bn" ? "জ্বালানি" : "Fuel"}</th>
                  <th>{language === "bn" ? "পরিমাণ" : "Quantity"}</th>
                  <th>{language === "bn" ? "দাম/L" : "Price/L"}</th>
                  <th>{language === "bn" ? "মোট" : "Total"}</th>
                  <th>{language === "bn" ? "তারিখ" : "Date"}</th>
                  <th>{language === "bn" ? "সময়" : "Time"}</th>
                  <th>{language === "bn" ? "অ্যাকশন" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale._id}>
                    <td className='receipt-no'>
                      {sale.receiptId?.receiptNo || "N/A"}
                    </td>
                    <td>
                      <span
                        className='fuel-badge'
                        style={{
                          background: `${
                            FUEL_COLORS[sale.fuelType] || "#6b7280"
                          }20`,
                          color: FUEL_COLORS[sale.fuelType] || "#6b7280",
                        }}
                      >
                        <Fuel size={14} />
                        {sale.fuelType}
                      </span>
                    </td>
                    <td>{sale.quantity} L</td>
                    <td>{formatCurrency(sale.unitPrice)}</td>
                    <td className='total-cell'>{formatCurrency(sale.total)}</td>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{formatTime(sale.createdAt)}</td>
                    <td>
                      <button
                        className='view-btn'
                        onClick={() => handleViewDetails(sale)}
                        title={
                          language === "bn" ? "বিস্তারিত দেখুন" : "View Details"
                        }
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className='empty-state'>
              <Receipt size={64} />
              <h3>
                {language === "bn"
                  ? "কোন বিক্রয় পাওয়া যায়নি"
                  : "No sales found"}
              </h3>
              <p>
                {filters.search ||
                filters.fuelType ||
                filters.dateFrom ||
                filters.dateTo
                  ? language === "bn"
                    ? "আপনার ফিল্টার পরিবর্তন করুন"
                    : "Try adjusting your filters"
                  : language === "bn"
                  ? "আপনি এখনো কোন বিক্রয় করেননি"
                  : "You haven't made any sales yet"}
              </p>
            </div>
          )}
        </div>

        {/* Sale Details Modal */}
        {showModal && selectedSale && (
          <div className='modal-overlay' onClick={() => setShowModal(false)}>
            <div className='modal-content' onClick={(e) => e.stopPropagation()}>
              <div className='modal-header'>
                <h2>
                  <Receipt size={24} />
                  {language === "bn" ? "বিক্রয় বিস্তারিত" : "Sale Details"}
                </h2>
                <button
                  className='close-btn'
                  onClick={() => setShowModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className='modal-body'>
                <div className='receipt-preview' id='printable-receipt'>
                  <div className='receipt-title'>
                    <h3>{selectedSale.pumpId?.name || "Fuel Pump"}</h3>
                    <p>{selectedSale.pumpId?.address?.street || ""}</p>
                  </div>

                  <div className='receipt-divider'></div>

                  <div className='receipt-info'>
                    <div className='info-row'>
                      <span>
                        {language === "bn" ? "রসিদ নং" : "Receipt No"}
                      </span>
                      <span className='info-value'>
                        {selectedSale.receiptId?.receiptNo || "N/A"}
                      </span>
                    </div>
                    <div className='info-row'>
                      <span>
                        {language === "bn" ? "তারিখ ও সময়" : "Date & Time"}
                      </span>
                      <span>{formatDateTime(selectedSale.createdAt)}</span>
                    </div>
                    <div className='info-row'>
                      <span>
                        {language === "bn" ? "ক্যাশিয়ার" : "Cashier"}
                      </span>
                      <span>{selectedSale.cashierId?.name || "N/A"}</span>
                    </div>
                  </div>

                  <div className='receipt-divider'></div>

                  <div className='receipt-details'>
                    <div className='detail-row'>
                      <span className='detail-label'>
                        {language === "bn" ? "জ্বালানি" : "Fuel Type"}
                      </span>
                      <span
                        className='fuel-badge large'
                        style={{
                          background: `${
                            FUEL_COLORS[selectedSale.fuelType] || "#6b7280"
                          }20`,
                          color:
                            FUEL_COLORS[selectedSale.fuelType] || "#6b7280",
                        }}
                      >
                        <Fuel size={16} />
                        {selectedSale.fuelType}
                      </span>
                    </div>
                    <div className='detail-row'>
                      <span className='detail-label'>
                        {language === "bn" ? "পরিমাণ" : "Quantity"}
                      </span>
                      <span className='detail-value'>
                        {selectedSale.quantity} L
                      </span>
                    </div>
                    <div className='detail-row'>
                      <span className='detail-label'>
                        {language === "bn" ? "দাম/লিটার" : "Price per Liter"}
                      </span>
                      <span className='detail-value'>
                        {formatCurrency(selectedSale.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div className='receipt-divider'></div>

                  <div className='receipt-total'>
                    <span>{language === "bn" ? "মোট" : "Total"}</span>
                    <span className='total-amount'>
                      {formatCurrency(selectedSale.total)}
                    </span>
                  </div>

                  <div className='receipt-footer'>
                    <p>{language === "bn" ? "ধন্যবাদ!" : "Thank you!"}</p>
                  </div>
                </div>
              </div>

              <div className='modal-footer'>
                <button className='btn-secondary' onClick={handlePrintReceipt}>
                  <Printer size={18} />
                  {language === "bn" ? "প্রিন্ট" : "Print Receipt"}
                </button>
                <button
                  className='btn-primary'
                  onClick={() => setShowModal(false)}
                >
                  {language === "bn" ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
