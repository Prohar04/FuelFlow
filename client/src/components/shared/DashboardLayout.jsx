import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, Users, MapPin, DollarSign, LogOut, 
  Sun, Moon, Monitor, Menu, X, Languages, Calendar,
  Clock, Wallet, Truck, Package, BarChart3, FileText
} from 'lucide-react';
import { useState } from 'react';
import './DashboardLayout.css';

export default function DashboardLayout({ role = 'admin', children }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const menus = {
      admin: [
        { path: '/admin/dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        { path: '/admin/pumps', label: t('pumps'), icon: <MapPin size={20} /> },
        { path: '/admin/employees', label: t('employees'), icon: <Users size={20} /> },
        { path: '/admin/prices', label: t('prices'), icon: <DollarSign size={20} /> },
      ],
      manager: [
        { path: '/manager/dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        { path: '/manager/employees', label: t('employees'), icon: <Users size={20} /> },
        { path: '/manager/attendance', label: t('attendance'), icon: <Calendar size={20} /> },
        { path: '/manager/shifts', label: t('shifts'), icon: <Clock size={20} /> },
        { path: '/manager/payroll', label: t('payroll'), icon: <Wallet size={20} /> },
        { path: '/manager/inventory', label: t('inventory'), icon: <Package size={20} /> },
        { path: '/manager/suppliers', label: t('suppliers'), icon: <Truck size={20} /> },
        { path: '/manager/orders', label: t('orders'), icon: <DollarSign size={20} /> },
        { path: '/manager/analytics', label: t('analytics'), icon: <BarChart3 size={20} /> },
        { path: '/manager/reports', label: t('reports'), icon: <FileText size={20} /> },
      ],
    };
    return menus[role] || [];
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <h2>FuelFlow</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {getMenuItems().map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="language-switcher">
            <button 
              className={language === 'en' ? 'active' : ''}
              onClick={() => setLanguage('en')}
              title="English"
            >
              EN
            </button>
            <button 
              className={language === 'bn' ? 'active' : ''}
              onClick={() => setLanguage('bn')}
              title="বাংলা"
            >
              বাং
            </button>
          </div>

          <div className="theme-switcher">
            <button 
              className={theme === 'light' ? 'active' : ''}
              onClick={() => setTheme('light')}
            >
              <Sun size={16} />
            </button>
            <button 
              className={theme === 'system' ? 'active' : ''}
              onClick={() => setTheme('system')}
            >
              <Monitor size={16} />
            </button>
            <button 
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => setTheme('dark')}
            >
              <Moon size={16} />
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{t('welcome')}, {user?.name}</h1>
            <p className="text-sm text-secondary">{user?.role} • {user?.pumpId?.name || 'All Pumps'}</p>
          </div>
          <button 
            className="profile-avatar"
            onClick={() => navigate('/profile')}
            title="View Profile"
          >
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </button>
        </header>

        <div className="dashboard-content">
          {/* <Outlet /> */}
          {children}
        </div>
      </main>
    </div>
  );
}
