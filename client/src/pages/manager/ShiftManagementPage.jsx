import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { getShifts, createShift, updateShift, deleteShift, bulkPublishShifts } from '../../services/shiftApi';
import api from '../../services/api';
import { Plus, Calendar as CalendarIcon, Users, Send, Filter } from 'lucide-react';
import ShiftCalendar from '../../components/manager/ShiftCalendar';
import EmployeeSidebar from '../../components/manager/EmployeeSidebar';
import ShiftModal from '../../components/manager/ShiftModal';
import BulkShiftModal from '../../components/manager/BulkShiftModal';
import './ShiftManagementPage.css';

export default function ShiftManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [calendarView, setCalendarView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'draft', 'published'
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get date range for current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Build filters
      const filters = {
        from: firstDay.toISOString(),
        to: lastDay.toISOString(),
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const [shiftsRes, employeesRes] = await Promise.all([
        getShifts(filters),
        api.get(`/users?pumpId=${user.pumpId}&status=active`),
      ]);


      setShifts(shiftsRes.data || []);
      setEmployees(employeesRes.data?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(language === 'bn' ? 'ডেটা লোড করতে ব্যর্থ' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = (slotInfo) => {
    setSelectedShift({
      startAt: slotInfo.startAt,
      endAt: slotInfo.endAt,
    });
    setShowModal(true);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setShowModal(true);
  };

  const handleShiftUpdate = async (shiftId, updates) => {
    try {
      await updateShift(shiftId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating shift:', error);
      alert(error.message || (language === 'bn' ? 'শিফট আপডেট করতে ব্যর্থ' : 'Failed to update shift'));
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedShift?._id) {
        // Update existing shift
        await updateShift(selectedShift._id, formData);
      } else {
        // Create new shift
        await createShift(formData);
      }
      await loadData();
      setShowModal(false);
      setSelectedShift(null);
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      await deleteShift(shiftId);
      await loadData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert(language === 'bn' ? 'শিফট মুছতে ব্যর্থ' : 'Failed to delete shift');
    }
  };

  const handleBulkPublish = async () => {
    if (selectedShiftIds.length === 0) {
      alert(language === 'bn' ? 'প্রকাশের জন্য শিফট নির্বাচন করুন' : 'Please select shifts to publish');
      return;
    }

    if (!confirm(
      language === 'bn'
        ? `${selectedShiftIds.length}টি শিফট প্রকাশ করবেন? কর্মচারীরা বিজ্ঞপ্তি পাবেন।`
        : `Publish ${selectedShiftIds.length} shift(s)? Employees will be notified.`
    )) {
      return;
    }

    try {
      setPublishing(true);
      await bulkPublishShifts(selectedShiftIds);
      setSelectedShiftIds([]);
      await loadData();
      alert(language === 'bn' ? 'শিফট প্রকাশিত হয়েছে!' : 'Shifts published successfully!');
    } catch (error) {
      console.error('Error publishing shifts:', error);
      alert(language === 'bn' ? 'শিফট প্রকাশ করতে ব্যর্থ' : 'Failed to publish shifts');
    } finally {
      setPublishing(false);
    }
  };

  const handleShiftSelect = (shiftId, selected) => {
    if (selected) {
      setSelectedShiftIds([...selectedShiftIds, shiftId]);
    } else {
      setSelectedShiftIds(selectedShiftIds.filter(id => id !== shiftId));
    }
  };

  const handleSelectAllDrafts = () => {
    const draftShifts = shifts.filter(s => s.status === 'draft');
    if (selectedShiftIds.length === draftShifts.length) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(draftShifts.map(s => s._id));
    }
  };

  const handleEmployeeSelect = (employee) => {
    // Pre-fill modal with selected employee
    setSelectedShift({
      employeeId: employee._id,
      roleRequired: employee.role === 'cashier' ? 'cashier' : 
                    employee.jobTitle === 'fuel_boy' ? 'fuelBoy' :
                    employee.jobTitle === 'security_guard' ? 'security' : 'general',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // +8 hours
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="shift-management-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>
              <CalendarIcon size={28} />
              {language === 'bn' ? 'শিফট ব্যবস্থাপনা' : 'Shift Management'}
            </h1>
            <p className="text-secondary">
              {language === 'bn' 
                ? 'কর্মচারীদের জন্য শিফট তৈরি এবং পরিচালনা করুন' 
                : 'Create and manage shifts for employees'}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setShowBulkModal(true)}>
              <Users size={20} />
              {language === 'bn' ? 'একাধিক শিডিউল' : 'Schedule Multiple'}
            </button>
            <button className="btn-primary" onClick={() => handleCreateShift({ startAt: new Date(), endAt: new Date() })}>
              <Plus size={20} />
              {language === 'bn' ? 'নতুন শিফট' : 'New Shift'}
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <Filter size={16} />
            {language === 'bn' ? 'সব' : 'All'}
            <span className="tab-count">{shifts.length}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            {language === 'bn' ? 'খসড়া' : 'Draft'}
            <span className="tab-count">{shifts.filter(s => s.status === 'draft').length}</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'published' ? 'active' : ''}`}
            onClick={() => setStatusFilter('published')}
          >
            {language === 'bn' ? 'প্রকাশিত' : 'Published'}
            <span className="tab-count">{shifts.filter(s => s.status === 'published').length}</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {statusFilter === 'draft' && shifts.filter(s => s.status === 'draft').length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-left">
              <button className="btn-link" onClick={handleSelectAllDrafts}>
                {selectedShiftIds.length === shifts.filter(s => s.status === 'draft').length
                  ? language === 'bn' ? 'সব বাতিল করুন' : 'Deselect All'
                  : language === 'bn' ? 'সব নির্বাচন করুন' : 'Select All'}
              </button>
              {selectedShiftIds.length > 0 && (
                <span className="selected-count">
                  {selectedShiftIds.length} {language === 'bn' ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <button
              className="btn-success"
              onClick={handleBulkPublish}
              disabled={selectedShiftIds.length === 0 || publishing}
            >
              <Send size={18} />
              {publishing
                ? language === 'bn' ? 'প্রকাশ হচ্ছে...' : 'Publishing...'
                : language === 'bn' ? 'নির্বাচিত প্রকাশ করুন' : 'Publish Selected'}
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="shift-content">
          {/* Employee Sidebar - LEFT SIDE */}
          <EmployeeSidebar
            employees={employees}
            shifts={shifts}
            selectedDate={selectedDate}
            onEmployeeSelect={handleEmployeeSelect}
            language={language}
          />

          {/* Calendar - RIGHT SIDE */}
          <div className="calendar-section">
            <ShiftCalendar
              shifts={shifts}
              employees={employees}
              onShiftClick={handleEditShift}
              onSlotSelect={handleCreateShift}
              onShiftUpdate={handleShiftUpdate}
              view={calendarView}
              onViewChange={setCalendarView}
              selectedShiftIds={selectedShiftIds}
              onShiftSelect={handleShiftSelect}
              selectionMode={statusFilter === 'draft'}
            />
          </div>
        </div>

        {/* Shift Modal */}
        <ShiftModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedShift(null);
          }}
          onSubmit={handleSubmit}
          shift={selectedShift}
          employees={employees}
          language={language}
        />

        {/* Bulk Shift Modal */}
        <BulkShiftModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            loadData();
            setShowBulkModal(false);
          }}
          employees={employees}
          language={language}
        />
      </div>
    </DashboardLayout>
  );
}
