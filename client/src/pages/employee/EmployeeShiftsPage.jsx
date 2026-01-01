import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { getMyShifts } from '../../services/shiftApi';
import { Calendar, Clock, MapPin } from 'lucide-react';
import './EmployeeShiftsPage.css';

/**
 * Employee Shifts Page
 * Shows published shifts for the logged-in employee
 */
export default function EmployeeShiftsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const response = await getMyShifts();
      setShifts(response.data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredShifts = () => {
    const now = new Date();
    
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.startAt);
      
      if (filter === 'upcoming') {
        return shiftStart >= now;
      } else if (filter === 'past') {
        return shiftStart < now;
      }
      return true; // 'all'
    }).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredShifts = getFilteredShifts();

  if (loading) {
    return (
      <DashboardLayout role={user.role}>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user.role}>
      <div className="employee-shifts-page">
        <div className="page-header">
          <div>
            <h1>
              <Calendar size={28} />
              {language === 'bn' ? 'আমার শিফট' : 'My Shifts'}
            </h1>
            <p className="text-secondary">
              {language === 'bn' 
                ? 'আপনার নির্ধারিত শিফট দেখুন' 
                : 'View your scheduled shifts'}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            {language === 'bn' ? 'আসন্ন' : 'Upcoming'}
            <span className="tab-count">
              {shifts.filter(s => new Date(s.startAt) >= new Date()).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            {language === 'bn' ? 'অতীত' : 'Past'}
            <span className="tab-count">
              {shifts.filter(s => new Date(s.startAt) < new Date()).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {language === 'bn' ? 'সব' : 'All'}
            <span className="tab-count">{shifts.length}</span>
          </button>
        </div>

        {/* Shifts List */}
        <div className="shifts-list">
          {filteredShifts.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>{language === 'bn' ? 'কোন শিফট নেই' : 'No shifts found'}</h3>
              <p>
                {language === 'bn'
                  ? 'এই ফিল্টারের জন্য কোন শিফট পাওয়া যায়নি'
                  : 'No shifts found for this filter'}
              </p>
            </div>
          ) : (
            filteredShifts.map((shift) => (
              <div key={shift._id} className="shift-card">
                <div className="shift-date">
                  <div className="date-icon">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="date-text">{formatDate(shift.startAt)}</div>
                    <div className="day-text">
                      {new Date(shift.startAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                        weekday: 'long',
                      })}
                    </div>
                  </div>
                </div>

                <div className="shift-details">
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>
                      {formatTime(shift.startAt)} - {formatTime(shift.endAt)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{shift.pumpId?.name || 'N/A'}</span>
                  </div>
                  {shift.notes && (
                    <div className="shift-notes">
                      <strong>{language === 'bn' ? 'নোট:' : 'Notes:'}</strong> {shift.notes}
                    </div>
                  )}
                </div>

                <div className="shift-meta">
                  <span className="role-badge">{shift.roleRequired}</span>
                  {shift.breakMinutes > 0 && (
                    <span className="break-info">
                      {language === 'bn' ? 'বিরতি:' : 'Break:'} {shift.breakMinutes} {language === 'bn' ? 'মিনিট' : 'min'}
                    </span>
                  )}
                  <span className="hours-info">
                    {shift.computedHours?.toFixed(1) || '0.0'} {language === 'bn' ? 'ঘণ্টা' : 'hrs'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
