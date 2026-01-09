import { useState, useEffect, useRef } from "react";
import {
  Fuel,
  DollarSign,
  ShoppingCart,
  Receipt,
  Check,
  Printer,
  X,
  AlertCircle,
  Package,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createSale, getCurrentPrices } from "../../services/salesApi";
import { getInventory } from "../../services/inventoryApi";
import toast from "react-hot-toast";
import "./POSPage.css";

const FUEL_TYPES = ["Petrol", "Diesel", "Octane", "CNG", "LPG"];

const FUEL_ICONS = {
  Petrol: "#3b82f6",
  Diesel: "#10b981",
  Octane: "#f59e0b",
  CNG: "#8b5cf6",
  LPG: "#ec4899",
};

export default function POSPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const quantityInputRef = useRef(null);

  const [prices, setPrices] = useState({});
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const [formData, setFormData] = useState({
    fuelType: "",
    quantity: "",
    unitPrice: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pricesRes, inventoryRes] = await Promise.allSettled([
        getCurrentPrices(),
        getInventory(),
      ]);

      // Process prices
      if (pricesRes.status === "fulfilled" && pricesRes.value.success) {
        const priceMap = {};
        pricesRes.value.data.forEach((p) => {
          priceMap[p.fuelType] = p.unitPrice;
        });
        setPrices(priceMap);
      }

      // Process inventory
      if (inventoryRes.status === "fulfilled" && inventoryRes.value.success) {
        const stockMap = {};
        inventoryRes.value.data.forEach((item) => {
          stockMap[item.fuelType] = item.currentStock || 0;
        });
        setInventory(stockMap);
      }
    } catch (error) {
      toast.error(
        language === "bn" ? "ডেটা লোড করতে ব্যর্থ" : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshInventory = async () => {
    try {
      const response = await getInventory();
      if (response.success) {
        const stockMap = {};
        response.data.forEach((item) => {
          stockMap[item.fuelType] = item.currentStock || 0;
        });
        setInventory(stockMap);
      }
    } catch (error) {
      console.error("Failed to refresh inventory:", error);
    }
  };

  const handleFuelSelect = (fuelType) => {
    const unitPrice = prices[fuelType] || 0;
    setFormData({
      ...formData,
      fuelType,
      unitPrice,
    });
    setErrors({});
    // Focus quantity input after selecting fuel
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 100);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        quantity: value,
      });
      setErrors({});
    }
  };

  const handleQuickAmount = (amount) => {
    if (!formData.unitPrice) return;
    const quantity = (amount / formData.unitPrice).toFixed(2);
    setFormData({
      ...formData,
      quantity,
    });
    setErrors({});
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    return quantity * formData.unitPrice;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fuelType) {
      newErrors.fuelType =
        language === "bn" ? "জ্বালানি নির্বাচন করুন" : "Select a fuel type";
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity =
        language === "bn" ? "পরিমাণ লিখুন" : "Enter quantity";
    }

    // Check if enough stock is available
    const requestedQty = parseFloat(formData.quantity) || 0;
    const availableStock = inventory[formData.fuelType] || 0;
    if (requestedQty > availableStock) {
      newErrors.quantity =
        language === "bn"
          ? `পর্যাপ্ত মজুদ নেই। উপলব্ধ: ${availableStock.toFixed(2)} L`
          : `Insufficient stock. Available: ${availableStock.toFixed(2)} L`;
    }

    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = language === "bn" ? "দাম সেট নেই" : "Price not set";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const saleData = {
        fuelType: formData.fuelType,
        quantity: parseFloat(formData.quantity),
        unitPrice: formData.unitPrice,
      };

      const response = await createSale(saleData);

      if (response.success) {
        setLastSale(response.data);
        setShowReceipt(true);
        // Refresh inventory after successful sale
        await refreshInventory();
        toast.success(
          language === "bn"
            ? "বিক্রয় সফল হয়েছে!"
            : "Sale completed successfully!"
        );
      }
    } catch (error) {
      console.error("Sale error:", error);
      toast.error(
        error.response?.data?.error?.message ||
          (language === "bn" ? "বিক্রয় ব্যর্থ হয়েছে" : "Sale failed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    setLastSale(null);
    setFormData({
      fuelType: "",
      quantity: "",
      unitPrice: 0,
    });
    // Refresh inventory when starting new sale
    refreshInventory();
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

  if (loading) {
    return (
      <DashboardLayout role='cashier'>
        <div className='pos-loading'>
          <div className='spinner-large'></div>
          <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Receipt Modal
  if (showReceipt && lastSale) {
    return (
      <DashboardLayout role='cashier'>
        <div className='receipt-container'>
          <div className='receipt-card'>
            <div className='receipt-header'>
              <Check size={48} className='success-icon' />
              <h2>
                {language === "bn" ? "বিক্রয় সম্পন্ন!" : "Sale Complete!"}
              </h2>
            </div>

            <div className='receipt-content' id='printable-receipt'>
              <div className='receipt-title'>
                <h3>{lastSale.pumpId?.name || "Fuel Pump"}</h3>
                <p>{lastSale.pumpId?.address?.street || ""}</p>
              </div>

              <div className='receipt-divider'></div>

              <div className='receipt-info'>
                <div className='receipt-row'>
                  <span>{language === "bn" ? "রসিদ নং" : "Receipt No"}</span>
                  <span className='receipt-value'>
                    {lastSale.receiptId?.receiptNo || "N/A"}
                  </span>
                </div>
                <div className='receipt-row'>
                  <span>{language === "bn" ? "তারিখ" : "Date"}</span>
                  <span>{formatDateTime(lastSale.createdAt)}</span>
                </div>
                <div className='receipt-row'>
                  <span>{language === "bn" ? "ক্যাশিয়ার" : "Cashier"}</span>
                  <span>{lastSale.cashierId?.name || user?.name}</span>
                </div>
              </div>

              <div className='receipt-divider'></div>

              <div className='receipt-items'>
                <div className='item-row header'>
                  <span>{language === "bn" ? "আইটেম" : "Item"}</span>
                  <span>{language === "bn" ? "পরিমাণ" : "Qty"}</span>
                  <span>{language === "bn" ? "মূল্য" : "Price"}</span>
                  <span>{language === "bn" ? "মোট" : "Total"}</span>
                </div>
                <div className='item-row'>
                  <span>{lastSale.fuelType}</span>
                  <span>{lastSale.quantity} L</span>
                  <span>{formatCurrency(lastSale.unitPrice)}</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
              </div>

              <div className='receipt-divider'></div>

              <div className='receipt-total'>
                <span>{language === "bn" ? "মোট" : "Total"}</span>
                <span className='total-amount'>
                  {formatCurrency(lastSale.total)}
                </span>
              </div>

              <div className='receipt-footer'>
                <p>{language === "bn" ? "ধন্যবাদ!" : "Thank you!"}</p>
                <p className='small'>
                  {language === "bn" ? "আবার আসবেন" : "Please come again"}
                </p>
              </div>
            </div>

            <div className='receipt-actions'>
              <button className='btn-secondary' onClick={handlePrintReceipt}>
                <Printer size={20} />
                {language === "bn" ? "প্রিন্ট" : "Print"}
              </button>
              <button className='btn-primary' onClick={handleNewSale}>
                <ShoppingCart size={20} />
                {language === "bn" ? "নতুন বিক্রয়" : "New Sale"}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role='cashier'>
      <div className='pos-page'>
        <div className='pos-header'>
          <h1>
            <ShoppingCart size={28} />
            {language === "bn" ? "পয়েন্ট অফ সেল" : "Point of Sale"}
          </h1>
          <p>
            {language === "bn"
              ? "জ্বালানি নির্বাচন করুন এবং পরিমাণ লিখুন"
              : "Select fuel type and enter quantity"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='pos-form'>
          {/* Fuel Type Selection */}
          <div className='form-section'>
            <label className='section-label'>
              <Fuel size={20} />
              {language === "bn"
                ? "জ্বালানি নির্বাচন করুন"
                : "Select Fuel Type"}
            </label>
            <div className='fuel-grid'>
              {FUEL_TYPES.map((fuel) => {
                const price = prices[fuel];
                const stock = inventory[fuel] || 0;
                const isSelected = formData.fuelType === fuel;
                const isDisabled = !price;
                const isLowStock = stock < 100;
                const isOutOfStock = stock <= 0;

                return (
                  <button
                    key={fuel}
                    type='button'
                    className={`fuel-btn ${isSelected ? "selected" : ""} ${
                      isDisabled || isOutOfStock ? "disabled" : ""
                    } ${isLowStock && !isOutOfStock ? "low-stock" : ""}`}
                    onClick={() =>
                      !isDisabled && !isOutOfStock && handleFuelSelect(fuel)
                    }
                    disabled={isDisabled || isOutOfStock}
                    style={{
                      "--fuel-color": FUEL_ICONS[fuel],
                    }}
                  >
                    <Fuel size={32} />
                    <span className='fuel-name'>{fuel}</span>
                    <span className='fuel-price'>
                      {price ? `${formatCurrency(price)}/L` : "N/A"}
                    </span>
                    <span
                      className={`fuel-stock ${isLowStock ? "low" : ""} ${
                        isOutOfStock ? "out" : ""
                      }`}
                    >
                      <Package size={12} />
                      {isOutOfStock
                        ? language === "bn"
                          ? "স্টক নেই"
                          : "Out of Stock"
                        : `${stock.toFixed(0)} L`}
                    </span>
                    {isLowStock && !isOutOfStock && (
                      <AlertTriangle size={16} className='low-stock-icon' />
                    )}
                    {isSelected && (
                      <Check size={20} className='selected-icon' />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.fuelType && (
              <p className='error-text'>
                <AlertCircle size={14} />
                {errors.fuelType}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className='form-section'>
            <label className='section-label'>
              <DollarSign size={20} />
              {language === "bn" ? "পরিমাণ (লিটার)" : "Quantity (Liters)"}
            </label>
            <div className='quantity-input-wrapper'>
              <input
                ref={quantityInputRef}
                type='text'
                inputMode='decimal'
                className={`quantity-input ${errors.quantity ? "error" : ""}`}
                placeholder={
                  language === "bn" ? "পরিমাণ লিখুন" : "Enter quantity"
                }
                value={formData.quantity}
                onChange={handleQuantityChange}
                disabled={!formData.fuelType}
              />
              <span className='quantity-suffix'>L</span>
            </div>
            {errors.quantity && (
              <p className='error-text'>
                <AlertCircle size={14} />
                {errors.quantity}
              </p>
            )}

            {/* Quick Amount Buttons */}
            {formData.fuelType && (
              <div className='quick-amounts'>
                <span className='quick-label'>
                  {language === "bn" ? "দ্রুত পরিমাণ:" : "Quick Amount:"}
                </span>
                {[100, 200, 500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    type='button'
                    className='quick-btn'
                    onClick={() => handleQuickAmount(amount)}
                  >
                    ৳{amount}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sale Summary */}
          {formData.fuelType && formData.quantity && (
            <div className='sale-summary'>
              <div className='summary-row'>
                <span>{language === "bn" ? "জ্বালানি" : "Fuel"}</span>
                <span>{formData.fuelType}</span>
              </div>
              <div className='summary-row'>
                <span>
                  {language === "bn" ? "বর্তমান মজুদ" : "Current Stock"}
                </span>
                <span>{(inventory[formData.fuelType] || 0).toFixed(2)} L</span>
              </div>
              <div className='summary-row'>
                <span>{language === "bn" ? "পরিমাণ" : "Quantity"}</span>
                <span>{formData.quantity} L</span>
              </div>
              <div className='summary-row'>
                <span>
                  {language === "bn" ? "বিক্রয়ের পর মজুদ" : "Stock After Sale"}
                </span>
                <span
                  className={`${
                    (inventory[formData.fuelType] || 0) -
                      parseFloat(formData.quantity || 0) <
                    100
                      ? "low-stock-text"
                      : ""
                  }`}
                >
                  {(
                    (inventory[formData.fuelType] || 0) -
                    parseFloat(formData.quantity || 0)
                  ).toFixed(2)}{" "}
                  L
                </span>
              </div>
              <div className='summary-row'>
                <span>{language === "bn" ? "দাম/লিটার" : "Price/Liter"}</span>
                <span>{formatCurrency(formData.unitPrice)}</span>
              </div>
              <div className='summary-divider'></div>
              <div className='summary-row total'>
                <span>{language === "bn" ? "মোট" : "Total"}</span>
                <span className='total-amount'>
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type='submit'
            className='submit-btn'
            disabled={submitting || !formData.fuelType || !formData.quantity}
          >
            {submitting ? (
              <>
                <div className='spinner-small'></div>
                {language === "bn" ? "প্রক্রিয়াকরণ..." : "Processing..."}
              </>
            ) : (
              <>
                <Receipt size={24} />
                {language === "bn" ? "বিক্রয় সম্পন্ন করুন" : "Complete Sale"}
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
