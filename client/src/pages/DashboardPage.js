import { useAccount } from '../providers/account';
import AdminDashboardPage from './admin/DashboardPage';
import FacultyDashboardPage from './faculty/DashboardPage';
import StudentDashboardPage from './student/DashboardPage';

function DashboardPage() {
  const { account } = useAccount();
  switch (account.kind) {
    case 'administrator': return <AdminDashboardPage />;
    case 'faculty': return <FacultyDashboardPage />;
    default: return <StudentDashboardPage />;
  }
}

export default DashboardPage;
