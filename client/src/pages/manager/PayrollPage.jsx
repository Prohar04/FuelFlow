import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../components/shared/DashboardLayout';
import {
  generateWeeklyPayroll as generatePayroll,
  getPayrolls,
  markPayrollAsGiven,
  getPayrollSummary,
} from '../../services/payrollApi';
import { Calendar, DollarSign, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import PayrollDetailsModal from '../../components/manager/PayrollDetailsModal';
import './PayrollPage.css';
import './PayrollPage_additions.css';

export default function PayrollPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Month-based selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const getMonthName = (monthIndex) => {
    const months = language === 'bn'
      ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      const response = await getPayrolls({
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
      });
      setPayrolls(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      const response = await getPayrollSummary(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      );
      setSummary(response.data || null);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleGeneratePayroll = async () => {
    const monthName = getMonthName(selectedMonth);
    if (!confirm(language === 'bn' 
      ? `${monthName} ${selectedYear} এর জন্য পেরোল তৈরি করবেন?`
      : `Generate payroll for ${monthName} ${selectedYear}?`)) {
      return;
    }

    try {
      setGenerating(true);
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      await generatePayroll(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      );
      alert(language === 'bn' ? 'পেরোল সফলভাবে তৈরি হয়েছে!' : 'Payroll generated successfully!');
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      alert(error.response?.data?.error?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsGiven = async (payrollId) => {
    if (!confirm(language === 'bn' 
      ? 'এই পেরোল প্রদান হিসাবে চিহ্নিত করবেন? কর্মচারীকে একটি ইমেল পাঠানো হবে।'
      : 'Mark this payroll as given? An email will be sent to the employee.')) {
      return;
    }

    try {
      await markPayrollAsGiven(payrollId);
      alert(language === 'bn' ? 'পেরোল প্রদান হিসাবে চিহ্নিত এবং ইমেল পাঠানো হয়েছে!' : 'Payroll marked as given and email sent!');
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      console.error('Failed to mark payroll as given:', error);
      alert(error.response?.data?.error?.message || 'Failed to mark payroll as given');
    }
  };

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailsModal(true);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <DashboardLayout role="manager">
      <div className="payroll-page">
        <div className="page-header">
          <div>
            <h1>{language === 'bn' ? 'পেরোল' : 'Payroll'}</h1>
            <p className="text-secondary">
              {language === 'bn' ? 'কর্মচারী পেরোল এবং পেমেন্ট পরিচালনা করুন' : 'Manage employee payroll and payments'}
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleGeneratePayroll}
            disabled={generating}
          >
            {generating 
              ? (language === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...') 
              : (language === 'bn' ? 'পেরোল তৈরি করুন' : 'Generate Payroll')}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="summary-label">{language === 'bn' ? 'মোট নেট পে' : 'Total Net Pay'}</p>
                <p className="summary-value">৳{summary.totalNetPay?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon pending">
                <Clock size={24} />
              </div>
              <div>
                <p className="summary-label">{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</p>
                <p className="summary-value">{summary.pendingPayrolls || 0}</p>
                <p className="summary-amount">৳{summary.pendingAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon given">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="summary-label">{language === 'bn' ? 'প্রদত্ত' : 'Given'}</p>
                <p className="summary-value">{summary.givenPayrolls || 0}</p>
                <p className="summary-amount">৳{summary.givenAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="month-selector">
          <button onClick={handlePreviousMonth} className="btn btn-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="month-display">
            <Calendar size={20} />
            <span className="month-text">{getMonthName(selectedMonth)} {selectedYear}</span>
          </div>
          <button onClick={handleNextMonth} className="btn btn-secondary">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Payroll Table */}
        <div className="payroll-table-container">
          {loading ? (
            <div className="loading">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading payrolls...'}</div>
          ) : payrolls.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <p>{language === 'bn' ? 'এই মাসের জন্য কোন পেরোল রেকর্ড পাওয়া যায়নি' : 'No payroll records found for this month'}</p>
              <button className="btn btn-primary" onClick={handleGeneratePayroll}>
                {language === 'bn' ? 'পেরোল তৈরি করুন' : 'Generate Payroll'}
              </button>
            </div>
          ) : (
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>{language === 'bn' ? 'কর্মচারী' : 'Employee'}</th>
                  <th>{language === 'bn' ? 'ভূমিকা' : 'Role'}</th>
                  <th>{language === 'bn' ? 'মাসিক বেতন' : 'Monthly Salary'}</th>
                  <th>{language === 'bn' ? 'উপস্থিতি' : 'Attendance'}</th>
                  <th>{language === 'bn' ? 'কর্তন' : 'Deductions'}</th>
                  <th>{language === 'bn' ? 'নেট পে' : 'Net Pay'}</th>
                  <th>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th>{language === 'bn' ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>
                      <div className="employee-cell">
                        <strong>{payroll.userId?.name}</strong>
                        <span className="text-secondary">{payroll.userId?.email}</span>
                      </div>
                    </td>
                    <td>{payroll.userId?.role}</td>
                    <td>৳{payroll.monthlySalary?.toFixed(2)}</td>
                    <td>
                      <div className="attendance-cell">
                        <span className="attendance-stat present">P: {payroll.attendanceSummary?.presentDays || 0}</span>
                        <span className="attendance-stat absent">A: {payroll.attendanceSummary?.absentDays || 0}</span>
                        <span className="attendance-stat late">L: {payroll.attendanceSummary?.lateDays || 0}</span>
                      </div>
                    </td>
                    <td>৳{payroll.deductions?.toFixed(2)}</td>
                    <td className="net-pay">৳{payroll.netPay?.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${payroll.paymentStatus}`}>
                        {payroll.paymentStatus === 'given' ? (
                          <><CheckCircle size={14} /> {language === 'bn' ? 'প্রদত্ত' : 'Given'}</>
                        ) : (
                          <><Clock size={14} /> {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewDetails(payroll)}
                        >
                          {language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                        </button>
                        {payroll.paymentStatus === 'pending' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleMarkAsGiven(payroll._id)}
                          >
                            {language === 'bn' ? 'প্রদত্ত হিসাবে চিহ্নিত করুন' : 'Mark as Given'}
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
