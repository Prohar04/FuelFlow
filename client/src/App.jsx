import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';

// Admin
import { AdminDashboard, PumpsPage, EmployeesPage as AdminEmployeesPage, PricesPage } from './pages/admin';

// Manager
import { 
  ManagerDashboard, 
  EmployeesPage as ManagerEmployeesPage,
  AttendancePage,
  ShiftsPage,
  PayrollPage,
  InventoryPage,
  SuppliersPage,
  OrdersPage,
  AnalyticsPage,
  ReportsPage
} from './pages/manager';

// Cashier
import { POSPage, SalesHistoryPage } from './pages/cashier';

// Employee
import { 
  AttendancePage as EmployeeAttendancePage,
  ShiftsPage as EmployeeShiftsPage,
  PayrollPage as EmployeePayrollPage
} from './pages/employee';

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
      <ThemeProvider>
          <LanguageProvider>
            <Toaster position="top-right" />
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/pumps" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PumpsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEmployeesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/prices" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PricesPage />
              </ProtectedRoute>
            } />

            {/* Manager routes */}
            <Route path="/manager/dashboard" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/manager/employees" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerEmployeesPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/attendance" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AttendancePage />
              </ProtectedRoute>
            } />
            <Route path="/manager/shifts" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ShiftsPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/payroll" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <PayrollPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/inventory" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <InventoryPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/suppliers" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <SuppliersPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/orders" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/analytics" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/reports" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            {/* Cashier routes */}
            <Route path="/pos/sales" element={
              <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
                <POSPage />
              </ProtectedRoute>
            } />
            <Route path="/pos/history" element={
              <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
                <SalesHistoryPage />
              </ProtectedRoute>
            } />

            {/* Employee/Universal routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/me/attendance" element={
              <ProtectedRoute>
                <EmployeeAttendancePage />
              </ProtectedRoute>
            } />
            <Route path="/me/shifts" element={
              <ProtectedRoute>
                <EmployeeShiftsPage />
              </ProtectedRoute>
            } />
            <Route path="/me/payroll" element={
              <ProtectedRoute>
                <EmployeePayrollPage />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </LanguageProvider>
      </ThemeProvider>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
