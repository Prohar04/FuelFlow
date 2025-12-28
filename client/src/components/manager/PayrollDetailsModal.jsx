import { X, Calendar, DollarSign, Clock, User, MapPin, CheckCircle } from 'lucide-react';
import { getPayslip } from '../../services/payrollApi';
import { useState, useEffect } from 'react';
import './PayrollDetailsModal.css';

export default function PayrollDetailsModal({ payroll, onClose, onMarkAsGiven, onRefresh }) {
  const [detailedPayroll, setDetailedPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslipDetails();
  }, [payroll._id]);

  const fetchPayslipDetails = async () => {
    try {
      setLoading(true);
      const response = await getPayslip(payroll._id);
      setDetailedPayroll(response.data);
    } catch (error) {
      console.error('Failed to fetch payslip details:', error);
      setDetailedPayroll(payroll); // Fallback to basic payroll data
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsGiven = async () => {
    await onMarkAsGiven(payroll._id);
    onClose();
    if (onRefresh) onRefresh();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const data = detailedPayroll || payroll;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payroll-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Payroll Details</h2>
            <p className="text-secondary">Detailed breakdown of employee payment</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="modal-body">
            <div className="loading-state">Loading details...</div>
          </div>
        ) : (
          <div className="modal-body">
            {/* Employee Info */}
            <div className="info-section">
              <h3>Employee Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <User size={18} />
                  <div>
                    <p className="info-label">Name</p>
                    <p className="info-value">{data.userId?.name}</p>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={18} />
                  <div>
                    <p className="info-label">Role</p>
                    <p className="info-value">{data.userId?.role}</p>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={18} />
                  <div>
                    <p className="info-label">Pump</p>
                    <p className="info-value">{data.pumpId?.name}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={18} />
                  <div>
                    <p className="info-label">Period</p>
                    <p className="info-value">
                      {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shift Hours Breakdown */}
            {data.shiftHours && data.shiftHours.length > 0 && (
              <div className="info-section">
                <h3>Shift Hours Breakdown</h3>
                <div className="shifts-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.shiftHours.map((shift, index) => (
                        <tr key={index}>
                          <td>{formatDate(shift.date)}</td>
                          <td>{shift.hours.toFixed(2)} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>{data.totalHoursWorked?.toFixed(2)} hrs</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            {data.attendanceSummary && (
              <div className="info-section">
                <h3>Attendance Summary</h3>
                <div className="attendance-grid">
                  <div className="attendance-item">
                    <p className="attendance-label">Total Days</p>
                    <p className="attendance-value">{data.attendanceSummary.totalDays}</p>
                  </div>
                  <div className="attendance-item present">
                    <p className="attendance-label">Present</p>
                    <p className="attendance-value">{data.attendanceSummary.presentDays}</p>
                  </div>
                  <div className="attendance-item absent">
                    <p className="attendance-label">Absent</p>
                    <p className="attendance-value">{data.attendanceSummary.absentDays}</p>
                  </div>
                  <div className="attendance-item late">
                    <p className="attendance-label">Late</p>
                    <p className="attendance-value">{data.attendanceSummary.lateDays}</p>
                  </div>
                  <div className="attendance-item leave">
                    <p className="attendance-label">Leave</p>
                    <p className="attendance-value">{data.attendanceSummary.leaveDays}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Calculation */}
            <div className="info-section">
              <h3>Payment Calculation</h3>
              <div className="calculation-breakdown">
                <div className="calc-row">
                  <span>Monthly Salary</span>
                  <span>৳{data.monthlySalary?.toFixed(2)}</span>
                </div>
                <div className="calc-row subtotal">
                  <span>Gross Pay</span>
                  <span>৳{data.grossPay?.toFixed(2)}</span>
                </div>
                {data.absentDeduction > 0 && (
                  <div className="calc-row deduction">
                    <span>Absent Deduction ({data.attendanceSummary?.absentDays} days × ৳10)</span>
                    <span>- ৳{data.absentDeduction?.toFixed(2)}</span>
                  </div>
                )}
                {data.lateDeduction > 0 && (
                  <div className="calc-row deduction">
                    <span>Late Deduction ({data.attendanceSummary?.lateDays} days × ৳5)</span>
                    <span>- ৳{data.lateDeduction?.toFixed(2)}</span>
                  </div>
                )}
                {data.deductions > (data.absentDeduction + data.lateDeduction) && (
                  <div className="calc-row deduction">
                    <span>Other Deductions</span>
                    <span>- ৳{(data.deductions - data.absentDeduction - data.lateDeduction).toFixed(2)}</span>
                  </div>
                )}
                <div className="calc-row total">
                  <span>Net Pay</span>
                  <span>৳{data.netPay?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="info-section">
              <h3>Payment Status</h3>
              <div className="payment-status">
                <div className={`status-indicator status-${data.paymentStatus}`}>
                  {data.paymentStatus === 'given' ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Payment Given</span>
                    </>
                  ) : (
                    <>
                      <Clock size={20} />
                      <span>Payment Pending</span>
                    </>
                  )}
                </div>
                {data.paymentStatus === 'given' && data.paidBy && (
                  <div className="payment-info">
                    <p><strong>Paid By:</strong> {data.paidBy.name}</p>
                    <p><strong>Paid At:</strong> {formatDate(data.paidAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {data.notes && (
              <div className="info-section">
                <h3>Notes</h3>
                <p className="notes-text">{data.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {data.paymentStatus === 'pending' && (
            <button className="btn btn-success" onClick={handleMarkAsGiven}>
              <CheckCircle size={18} />
              Mark as Given & Send Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
