import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { getShifts, createShift, deleteShift } from "../../services/shiftApi";
import api from "../../services/api";
import { Plus, Calendar, Clock, User, Trash2, X } from "lucide-react";
import "./ShiftManagementPage.css";

export default function ShiftManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [shiftsRes, employeesRes] = await Promise.all([
        getShifts({ from: firstDay.toISOString(), to: lastDay.toISOString() }),
        api.get(`/users?pumpId=${user.pumpId}&status=active`),
      ]);

      setShifts(shiftsRes.data || []);
      setEmployees(employeesRes.data?.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      employeeId: "",
      date: today,
      startTime: "08:00",
      endTime: "16:00",
      notes: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      employeeId: "",
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.employeeId ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert(
        language === "bn"
          ? "সব ফিল্ড পূরণ করুন"
          : "Please fill all required fields"
      );
      return;
    }

    try {
      setSubmitting(true);

      const startAt = new Date(`${formData.date}T${formData.startTime}`);
      const endAt = new Date(`${formData.date}T${formData.endTime}`);

      if (endAt <= startAt) {
        alert(
          language === "bn"
            ? "শেষ সময় শুরুর সময়ের পরে হতে হবে"
            : "End time must be after start time"
        );
        return;
      }

      // Get the selected employee to determine their role
      const selectedEmployee = employees.find(
        (emp) => emp._id === formData.employeeId
      );
      const roleRequired =
        selectedEmployee?.role === "cashier"
          ? "cashier"
          : selectedEmployee?.jobTitle === "fuel_boy"
          ? "fuelBoy"
          : selectedEmployee?.jobTitle === "security_guard"
          ? "security"
          : "general";

      await createShift({
        employeeId: formData.employeeId,
        roleRequired,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: formData.notes,
        status: "published",
      });

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert(
        error.message ||
          (language === "bn"
            ? "শিডিউল তৈরি করতে ব্যর্থ"
            : "Failed to create schedule")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (
      !confirm(
        language === "bn"
          ? "আপনি কি এই শিডিউল মুছতে চান?"
          : "Are you sure you want to delete this schedule?"
      )
    ) {
      return;
    }

    try {
      await deleteShift(shiftId);
      await loadData();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert(
        language === "bn" ? "শিডিউল মুছতে ব্যর্থ" : "Failed to delete schedule"
      );
    }
  };

  const getEmployeeName = (employee) => {
    // If employee is populated object
    if (employee && typeof employee === "object" && employee.name) {
      return employee.name;
    }
    // If employee is just an ID, look up in employees list
    if (employee) {
      const emp = employees.find((e) => e._id === employee);
      return emp ? emp.name : "Unknown";
    }
    return "Unknown";
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "bn" ? "bn-BD" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout role='manager'>
        <div className='loading-container'>
          <div className='spinner-large'></div>
          <p>{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role='manager'>
      <div className='shift-page'>
        {/* Header */}
        <div className='shift-page-header'>
          <div className='header-title'>
            <Calendar size={24} />
            <h1>{language === "bn" ? "শিডিউল" : "Schedule"}</h1>
          </div>
          <button className='btn-create-schedule' onClick={handleOpenModal}>
            <Plus size={18} />
            {language === "bn" ? "নতুন শিডিউল" : "New Schedule"}
          </button>
        </div>

        {/* Schedule List */}
        <div className='schedule-list'>
          {shifts.length === 0 ? (
            <div className='empty-state'>
              <Calendar size={48} />
              <h3>{language === "bn" ? "কোনো শিডিউল নেই" : "No schedules"}</h3>
              <p>
                {language === "bn"
                  ? "নতুন শিডিউল তৈরি করতে বাটনে ক্লিক করুন"
                  : "Click the button to create a new schedule"}
              </p>
            </div>
          ) : (
            <div className='schedule-cards'>
              {shifts.map((shift) => (
                <div key={shift._id} className='schedule-card'>
                  <div className='schedule-card-header'>
                    <div className='employee-info'>
                      <User size={18} />
                      <span className='employee-name'>
                        {getEmployeeName(shift.employeeId)}
                      </span>
                    </div>
                    <button
                      className='btn-delete'
                      onClick={() => handleDeleteShift(shift._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className='schedule-card-body'>
                    <div className='schedule-detail'>
                      <Calendar size={16} />
                      <span>{formatDate(shift.startAt)}</span>
                    </div>
                    <div className='schedule-detail'>
                      <Clock size={16} />
                      <span>
                        {formatTime(shift.startAt)} - {formatTime(shift.endAt)}
                      </span>
                    </div>
                  </div>
                  {shift.notes && (
                    <div className='schedule-notes'>{shift.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Schedule Modal */}
        {showModal && (
          <div className='modal-overlay' onClick={handleCloseModal}>
            <div className='modal-content' onClick={(e) => e.stopPropagation()}>
              <div className='modal-header'>
                <h2>
                  {language === "bn"
                    ? "নতুন শিডিউল তৈরি করুন"
                    : "Create New Schedule"}
                </h2>
                <button className='btn-close' onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className='modal-body'>
                <div className='form-group'>
                  <label>
                    {language === "bn"
                      ? "কর্মচারী নির্বাচন করুন"
                      : "Select Employee"}{" "}
                    *
                  </label>
                  <select
                    name='employeeId'
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>
                      {language === "bn"
                        ? "-- নির্বাচন করুন --"
                        : "-- Select --"}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>{language === "bn" ? "তারিখ" : "Date"} *</label>
                  <input
                    type='date'
                    name='date'
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className='form-row'>
                  <div className='form-group'>
                    <label>
                      {language === "bn" ? "শুরুর সময়" : "Start Time"} *
                    </label>
                    <input
                      type='time'
                      name='startTime'
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='form-group'>
                    <label>
                      {language === "bn" ? "শেষ সময়" : "End Time"} *
                    </label>
                    <input
                      type='time'
                      name='endTime'
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className='form-group'>
                  <label>
                    {language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (Optional)"}
                  </label>
                  <textarea
                    name='notes'
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={
                      language === "bn"
                        ? "অতিরিক্ত তথ্য..."
                        : "Additional information..."
                    }
                  />
                </div>

                <div className='modal-actions'>
                  <button
                    type='button'
                    className='btn-cancel'
                    onClick={handleCloseModal}
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type='submit'
                    className='btn-submit'
                    disabled={submitting}
                  >
                    {submitting
                      ? language === "bn"
                        ? "তৈরি হচ্ছে..."
                        : "Creating..."
                      : language === "bn"
                      ? "শিডিউল তৈরি করুন"
                      : "Create Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
