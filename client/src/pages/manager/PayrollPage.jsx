import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import {
  generateWeeklyPayroll as generatePayroll,
  getPayrolls,
  markPayrollAsGiven,
  getPayrollSummary,
} from "../../services/payrollApi";
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PayrollDetailsModal from "../../components/manager/PayrollDetailsModal";
import "./PayrollPage.css";
import "./PayrollPage_additions.css";

// Helper function to get the start of a week (Sunday)
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to get the end of a week (Saturday)
const getWeekEnd = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
};

// Format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Format date range for display
const formatDateRange = (start, end, language) => {
  const options = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    options
  );
  const endStr = end.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    ...options,
    year: "numeric",
  });
  return `${startStr} - ${endStr}`;
};

export default function PayrollPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Week-based selection
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    getWeekStart(new Date())
  );
  const [selectedWeekEnd, setSelectedWeekEnd] = useState(
    getWeekEnd(new Date())
  );

  // Fetch existing payrolls when week changes
  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
  }, [selectedWeekStart]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await getPayrolls({
        startDate: formatDate(selectedWeekStart),
        endDate: formatDate(selectedWeekEnd),
      });
      setPayrolls(response.data || []);
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await getPayrollSummary(
        formatDate(selectedWeekStart),
        formatDate(selectedWeekEnd)
      );
      setSummary(response.data || null);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setSummary(null);
    }
  };

  const handleGeneratePayroll = async () => {
    const weekRange = formatDateRange(
      selectedWeekStart,
      selectedWeekEnd,
      language
    );
    if (
      !confirm(
        language === "bn"
          ? `${weekRange} সপ্তাহের জন্য পেরোল তৈরি করবেন?`
          : `Generate payroll for the week of ${weekRange}?`
      )
    ) {
      return;
    }

    try {
      setGenerating(true);
      await generatePayroll(
        formatDate(selectedWeekStart),
        formatDate(selectedWeekEnd)
      );
      alert(
        language === "bn"
          ? "সাপ্তাহিক পেরোল সফলভাবে তৈরি হয়েছে!"
          : "Weekly payroll generated successfully!"
      );
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      console.error("Failed to generate payroll:", error);
      alert(
        error.response?.data?.error?.message || "Failed to generate payroll"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsGiven = async (payrollId) => {
    if (
      !confirm(
        language === "bn"
          ? "এই পেরোল প্রদান হিসাবে চিহ্নিত করবেন? কর্মচারীকে একটি ইমেল পাঠানো হবে।"
          : "Mark this payroll as given? An email will be sent to the employee."
      )
    ) {
      return;
    }

    try {
      await markPayrollAsGiven(payrollId);
      alert(
        language === "bn"
          ? "পেরোল প্রদান হিসাবে চিহ্নিত এবং ইমেল পাঠানো হয়েছে!"
          : "Payroll marked as given and email sent!"
      );
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      console.error("Failed to mark payroll as given:", error);
      alert(
        error.response?.data?.error?.message ||
          "Failed to mark payroll as given"
      );
    }
  };

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailsModal(true);
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setSelectedWeekStart(newStart);
    setSelectedWeekEnd(getWeekEnd(newStart));
  };

  const handleNextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setSelectedWeekStart(newStart);
    setSelectedWeekEnd(getWeekEnd(newStart));
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()));
    setSelectedWeekEnd(getWeekEnd(new Date()));
  };

  return (
    <DashboardLayout role='manager'>
      <div className='payroll-page'>
        <div className='page-header'>
          <div>
            <h1>{language === "bn" ? "সাপ্তাহিক পেরোল" : "Weekly Payroll"}</h1>
            <p className='text-secondary'>
              {language === "bn"
                ? "শিফট সময়সূচির উপর ভিত্তি করে সাপ্তাহিক পেরোল তৈরি ও পরিচালনা করুন"
                : "Generate and manage weekly payroll based on shift schedules"}
            </p>
          </div>
          <button
            className='btn btn-primary'
            onClick={handleGeneratePayroll}
            disabled={generating}
          >
            {generating
              ? language === "bn"
                ? "তৈরি হচ্ছে..."
                : "Generating..."
              : language === "bn"
              ? "সাপ্তাহিক পেরোল তৈরি করুন"
              : "Generate Weekly Payroll"}
          </button>
        </div>

        {/* Week Selector */}
        <div className='week-selector'>
          <button onClick={handlePreviousWeek} className='btn btn-secondary'>
            <ChevronLeft size={20} />
          </button>
          <div className='week-display'>
            <Calendar size={20} />
            <span className='week-text'>
              {formatDateRange(selectedWeekStart, selectedWeekEnd, language)}
            </span>
          </div>
          <button onClick={handleNextWeek} className='btn btn-secondary'>
            <ChevronRight size={20} />
          </button>
          <button
            onClick={handleCurrentWeek}
            className='btn btn-outline current-week-btn'
          >
            {language === "bn" ? "এই সপ্তাহ" : "This Week"}
          </button>
        </div>

        {/* Summary Cards - Only show if payrolls exist */}
        {summary && payrolls.length > 0 && (
          <div className='summary-cards'>
            <div className='summary-card'>
              <div className='summary-icon'>
                <Clock size={24} />
              </div>
              <div>
                <p className='summary-label'>
                  {language === "bn" ? "মোট ঘণ্টা" : "Total Hours"}
                </p>
                <p className='summary-value'>
                  {summary.totalHoursWorked?.toFixed(1) || "0"} hrs
                </p>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon'>
                <DollarSign size={24} />
              </div>
              <div>
                <p className='summary-label'>
                  {language === "bn" ? "মোট নেট পে" : "Total Net Pay"}
                </p>
                <p className='summary-value'>
                  ৳{summary.totalNetPay?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon pending'>
                <Clock size={24} />
              </div>
              <div>
                <p className='summary-label'>
                  {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
                </p>
                <p className='summary-value'>{summary.pendingPayrolls || 0}</p>
                <p className='summary-amount'>
                  ৳{summary.pendingAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon given'>
                <CheckCircle size={24} />
              </div>
              <div>
                <p className='summary-label'>
                  {language === "bn" ? "প্রদত্ত" : "Given"}
                </p>
                <p className='summary-value'>{summary.givenPayrolls || 0}</p>
                <p className='summary-amount'>
                  ৳{summary.givenAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Table */}
        <div className='payroll-table-container'>
          {loading ? (
            <div className='loading'>
              {language === "bn" ? "লোড হচ্ছে..." : "Loading payrolls..."}
            </div>
          ) : payrolls.length === 0 ? (
            <div className='empty-state'>
              <Calendar size={48} />
              <h3>
                {language === "bn"
                  ? "এই সপ্তাহের জন্য কোন পেরোল নেই"
                  : "No Payroll for This Week"}
              </h3>
              <p>
                {language === "bn"
                  ? "শিফট সময়সূচির উপর ভিত্তি করে পেরোল তৈরি করতে নিচের বাটনে ক্লিক করুন"
                  : "Click the button below to generate payroll based on shift schedules"}
              </p>
              <button
                className='btn btn-primary'
                onClick={handleGeneratePayroll}
                disabled={generating}
              >
                {generating
                  ? language === "bn"
                    ? "তৈরি হচ্ছে..."
                    : "Generating..."
                  : language === "bn"
                  ? "সাপ্তাহিক পেরোল তৈরি করুন"
                  : "Generate Weekly Payroll"}
              </button>
            </div>
          ) : (
            <table className='payroll-table'>
              <thead>
                <tr>
                  <th>{language === "bn" ? "কর্মচারী" : "Employee"}</th>
                  <th>{language === "bn" ? "ভূমিকা" : "Role"}</th>
                  <th>{language === "bn" ? "ঘণ্টা হার" : "Hourly Rate"}</th>
                  <th>{language === "bn" ? "ঘণ্টা কাজ" : "Hours Worked"}</th>
                  <th>{language === "bn" ? "মোট আয়" : "Gross Pay"}</th>
                  <th>{language === "bn" ? "কর্তন" : "Deductions"}</th>
                  <th>{language === "bn" ? "নেট পে" : "Net Pay"}</th>
                  <th>{language === "bn" ? "স্ট্যাটাস" : "Status"}</th>
                  <th>{language === "bn" ? "কার্যক্রম" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>
                      <div className='employee-cell'>
                        <strong>{payroll.userId?.name}</strong>
                        <span className='text-secondary'>
                          {payroll.userId?.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className='role-badge'>{payroll.userId?.role}</span>
                    </td>
                    <td>৳{payroll.hourlyRate?.toFixed(2)}/hr</td>
                    <td>
                      <strong>
                        {payroll.totalHoursWorked?.toFixed(1) || 0}
                      </strong>{" "}
                      hrs
                    </td>
                    <td>৳{payroll.grossPay?.toFixed(2)}</td>
                    <td className='deduction'>
                      {payroll.deductions > 0
                        ? `-৳${payroll.deductions?.toFixed(2)}`
                        : "৳0.00"}
                    </td>
                    <td className='net-pay'>৳{payroll.netPay?.toFixed(2)}</td>
                    <td>
                      <span
                        className={`status-badge status-${payroll.paymentStatus}`}
                      >
                        {payroll.paymentStatus === "given" ? (
                          <>
                            <CheckCircle size={14} />{" "}
                            {language === "bn" ? "প্রদত্ত" : "Given"}
                          </>
                        ) : (
                          <>
                            <Clock size={14} />{" "}
                            {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className='action-buttons'>
                        <button
                          className='btn btn-sm btn-secondary'
                          onClick={() => handleViewDetails(payroll)}
                        >
                          {language === "bn" ? "বিস্তারিত" : "Details"}
                        </button>
                        {payroll.paymentStatus === "pending" && (
                          <button
                            className='btn btn-sm btn-success'
                            onClick={() => handleMarkAsGiven(payroll._id)}
                          >
                            {language === "bn" ? "প্রদান করুন" : "Mark Given"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPayroll && (
          <PayrollDetailsModal
            payroll={selectedPayroll}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedPayroll(null);
            }}
            onMarkAsGiven={handleMarkAsGiven}
            onRefresh={() => {
              fetchPayrolls();
              fetchSummary();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
