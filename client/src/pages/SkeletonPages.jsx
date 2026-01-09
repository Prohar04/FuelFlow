import DashboardLayout from '../components/shared/DashboardLayout';
import Card from '../components/ui/Card';

const SkeletonPage = ({ title, description, role = 'admin' }) => (
  <DashboardLayout role={role}>
    <Card title={title}>
      <p style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      <p style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-lg)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
        This feature is ready for implementation. The backend API is fully functional. 
        Connect to the appropriate endpoints documented in the README.
      </p>
    </Card>
  </DashboardLayout>
);

// Admin pages
export const EmployeesPage = () => <SkeletonPage title="Employee Management" description="Create, view, and manage employees across all pumps. Send onboarding emails with temporary passwords." role="admin" />;
export const PricesPage = () => <SkeletonPage title="Fuel Price Management" description="Set and manage fuel prices. View price history." role="admin" />;

// Manager pages  
export const ManagerDashboard = () => <SkeletonPage title="Manager Dashboard" description="Overview of your pump's operations, sales, and inventory." role="manager" />;
export const ManagerEmployeesPage = () => <SkeletonPage title="Employee Management" description="Manage employees for your assigned pump." role="manager" />;
export const AttendancePage = () => <SkeletonPage title="Attendance Tracking" description="Mark and view employee attendance records." role="manager" />;
export const ShiftsPage = () => <SkeletonPage title="Shift Scheduling" description="Create and manage employee shift schedules." role="manager" />;
export const PayrollPage = () => <SkeletonPage title="Payroll Management" description="Generate payroll and manage payslips." role="manager" />;
export const InventoryPage = () => <SkeletonPage title="Inventory Management" description="Track fuel inventory, view low-stock alerts, manage stock levels." role="manager" />;
export const SuppliersPage = () => <SkeletonPage title="Supplier Management" description="Manage fuel suppliers for your pump." role="manager" />;
export const OrdersPage = () => <SkeletonPage title="Refill Orders" description="Create refill orders, send emails to suppliers, track deliveries." role="manager" />;
export const AnalyticsPage = () => <SkeletonPage title="Analytics Dashboard" description="View sales analytics, revenue trends, and fuel consumption for your pump." role="manager" />;
export const ReportsPage = () => <SkeletonPage title="Reports" description="Generate and export daily, weekly, and monthly reports for your pump." role="manager" />;

// Cashier pages
export const POSPage = () => <SkeletonPage title="Point of Sale" description="Create sales, generate receipts, update inventory automatically." role="cashier" />;
export const SalesHistoryPage = () => <SkeletonPage title="Sales History" description="View your sales history and receipts." role="cashier" />;

// Employee pages
export const ProfilePage = () => <SkeletonPage title="My Profile" description="View your profile and employment history." role="employee" />;
export const EmployeeAttendancePage = () => <SkeletonPage title="My Attendance" description="View your attendance records." role="employee" />;
export const EmployeeShiftsPage = () => <SkeletonPage title="My Shifts" description="View your assigned shifts." role="employee" />;
export const EmployeePayrollPage = () => <SkeletonPage title="My Payroll" description="View your payroll and download payslips." role="employee" />;
