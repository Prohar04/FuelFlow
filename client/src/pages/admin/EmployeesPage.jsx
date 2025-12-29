import DashboardLayout from '../../components/shared/DashboardLayout';
import EmployeesManagementPage from '../../components/shared/EmployeesManagementPage';

export default function EmployeesPage() {
  return (
    <DashboardLayout role="admin">
      <EmployeesManagementPage userRole="admin" showPumpFilter={true} />
    </DashboardLayout>
  );
}
