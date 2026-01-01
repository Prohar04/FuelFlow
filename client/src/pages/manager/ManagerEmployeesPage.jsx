import DashboardLayout from '../../components/shared/DashboardLayout';
import EmployeesManagementPage from '../../components/shared/EmployeesManagementPage';

export default function ManagerEmployeesPage() {
  return (
    <DashboardLayout role="manager">
      <EmployeesManagementPage userRole="manager" />
    </DashboardLayout>
  );
}
