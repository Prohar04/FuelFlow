import { useState, useEffect } from 'react';
import { Users, Filter, TrendingUp } from 'lucide-react';
import './EmployeeSidebar.css';

/**
 * Employee Sidebar Component
 * Shows employees with filters, hours tracking, and conflict indicators
 */
export default function EmployeeSidebar({
  employees = [],
  shifts = [],
  selectedDate,
  onEmployeeSelect,
  language = 'en',
}) {
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeStats, setEmployeeStats] = useState({});

  // Calculate employee statistics
  useEffect(() => {
    const stats = {};
    const weekStart = getWeekStart(selectedDate || new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    employees.forEach((employee) => {
      const employeeShifts = shifts.filter(
        (shift) =>
          (shift.employeeId?._id || shift.employeeId) === employee._id &&
          new Date(shift.startAt) >= weekStart &&
          new Date(shift.startAt) <= weekEnd &&
          shift.status !== 'cancelled'
      );

      const weeklyHours = employeeShifts.reduce((total, shift) => {
        return total + (shift.computedHours || 0);
      }, 0);

      // Check for conflicts (simplified - just overlapping shifts)
      const hasConflicts = employeeShifts.some((shift, index) => {
        return employeeShifts.some((otherShift, otherIndex) => {
          if (index === otherIndex) return false;
          const start1 = new Date(shift.startAt);
          const end1 = new Date(shift.endAt);
          const start2 = new Date(otherShift.startAt);
          const end2 = new Date(otherShift.endAt);
          return (
            (start1 >= start2 && start1 < end2) ||
            (end1 > start2 && end1 <= end2) ||
            (start1 <= start2 && end1 >= end2)
          );
        });
      });

      stats[employee._id] = {
        weeklyHours,
        shiftCount: employeeShifts.length,
        hasConflicts,
        nearLimit: weeklyHours >= 50, // Warning at 50+ hours
      };
    });

    setEmployeeStats(stats);
  }, [employees, shifts, selectedDate]);

  // Filter employees
  useEffect(() => {
    let filtered = employees;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((emp) => {
        if (roleFilter === 'cashier') return emp.role === 'cashier';
        if (roleFilter === 'fuelBoy') return emp.jobTitle === 'fuel_boy';
        if (roleFilter === 'security') return emp.jobTitle === 'security_guard';
        if (roleFilter === 'general') return emp.role === 'employee' && !emp.jobTitle;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by weekly hours (ascending - show employees with fewer hours first)
    filtered.sort((a, b) => {
      const hoursA = employeeStats[a._id]?.weeklyHours || 0;
      const hoursB = employeeStats[b._id]?.weeklyHours || 0;
      return hoursA - hoursB;
    });

    setFilteredEmployees(filtered);
  }, [employees, roleFilter, searchTerm, employeeStats]);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getRoleBadgeColor = (employee) => {
    if (employee.role === 'cashier') return '#ffc107';
    if (employee.jobTitle === 'fuel_boy') return '#17a2b8';
    if (employee.jobTitle === 'security_guard') return '#6f42c1';
    return '#6c757d';
  };

  const getRoleLabel = (employee) => {
    if (employee.role === 'cashier') return 'Cashier';
    if (employee.jobTitle === 'fuel_boy') return 'Fuel Boy';
    if (employee.jobTitle === 'security_guard') return 'Security';
    return 'General';
  };

  return (
    <div className="employee-sidebar">
      <div className="sidebar-header">
        <h3>
          <Users size={20} />
          {language === 'bn' ? 'কর্মচারী' : 'Employees'}
        </h3>
        <span className="employee-count">{filteredEmployees.length}</span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder={language === 'bn' ? 'খুঁজুন...' : 'Search employees...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Role Filter */}
      <div className="sidebar-filters">
        <Filter size={16} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">{language === 'bn' ? 'সব ভূমিকা' : 'All Roles'}</option>
          <option value="cashier">{language === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}</option>
          <option value="fuelBoy">{language === 'bn' ? 'ফুয়েল বয়' : 'Fuel Boy'}</option>
          <option value="security">{language === 'bn' ? 'সিকিউরিটি' : 'Security'}</option>
          <option value="general">{language === 'bn' ? 'সাধারণ' : 'General'}</option>
        </select>
      </div>

      {/* Employee List */}
      <div className="employee-list">
        {filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <p>{language === 'bn' ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const stats = employeeStats[employee._id] || {};
            const maxHours = 60;
            const hoursPercentage = Math.min((stats.weeklyHours / maxHours) * 100, 100);

            return (
              <div
                key={employee._id}
                className={`employee-card ${stats.hasConflicts ? 'has-conflict' : ''} ${
                  stats.nearLimit ? 'near-limit' : ''
                }`}
                onClick={() => onEmployeeSelect && onEmployeeSelect(employee)}
              >
                <div className="employee-header">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <div className="employee-name">{employee.name}</div>
                    <div
                      className="employee-role"
                      style={{ color: getRoleBadgeColor(employee) }}
                    >
                      {getRoleLabel(employee)}
                    </div>
                  </div>
                </div>

                <div className="employee-stats">
                  <div className="stat-row">
                    <span className="stat-label">
                      {language === 'bn' ? 'সাপ্তাহিক ঘণ্টা' : 'Weekly Hours'}
                    </span>
                    <span className="stat-value">
                      {stats.weeklyHours?.toFixed(1) || '0.0'}h / {maxHours}h
                    </span>
                  </div>
                  <div className="hours-bar">
                    <div
                      className="hours-fill"
                      style={{
                        width: `${hoursPercentage}%`,
                        backgroundColor: stats.nearLimit ? '#dc3545' : '#28a745',
                      }}
                    ></div>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">
                      {language === 'bn' ? 'শিফট' : 'Shifts'}
                    </span>
                    <span className="stat-value">{stats.shiftCount || 0}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="employee-badges">
                  {stats.hasConflicts && (
                    <span className="badge conflict">
                      {language === 'bn' ? 'দ্বন্দ্ব' : 'Conflict'}
                    </span>
                  )}
                  {stats.nearLimit && (
                    <span className="badge warning">
                      {language === 'bn' ? 'সীমার কাছাকাছি' : 'Near Limit'}
                    </span>
                  )}
                  {stats.weeklyHours === 0 && (
                    <span className="badge available">
                      {language === 'bn' ? 'উপলব্ধ' : 'Available'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Suggest Best Employees */}
      {filteredEmployees.length > 0 && (
        <div className="sidebar-footer">
          <button className="suggest-btn">
            <TrendingUp size={16} />
            {language === 'bn' ? 'সেরা কর্মচারী পরামর্শ' : 'Suggest Best Employees'}
          </button>
        </div>
      )}
    </div>
  );
}
