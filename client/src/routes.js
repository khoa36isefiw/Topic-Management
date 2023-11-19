import LoginLayout from "./layouts/LoginLayout";
import MainLayout from "./layouts/MainLayout";
import CompleteRegistrationPage from "./pages/account/CompleteRegistrationPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/account/LoginPage";
import AccessCodePage from "./pages/account/AccessCodePage";
import RegisterPage from "./pages/account/RegisterPage";
import PrivateRoute from './PrivateRoute';
import ThesisPage from "./pages/ThesisPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SubmissionPage from "./pages/SubmissionPage";
import EditThesisPage from "./pages/EditThesisPage";
import SettingsPage from "./pages/account/SettingsPage";
import AccountPage from "./pages/AccountPage";
import AccountsPage from "./pages/AccountsPage";
import ThesesPage from "./pages/ThesesPage";
import DefenseWeekPage from "./pages/DefenseWeekPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SchedulePage from "./pages/SchedulePage";

const routes = [
  {
    path: '/',
    element: <PrivateRoute redirect='/auth/login'><MainLayout /></PrivateRoute>,
    children: [
      {
        path: '',
        element: <DashboardPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'account',
        element: <AccountsPage />
      },
      {
        path: 'account/new',
        element: <AccountPage />
      },
      {
        path: 'account/:aid',
        element: <AccountPage />
      },
      {
        path: 'announcement',
        element: <AnnouncementsPage />
      },
      {
        path: 'defense',
        element: <DefenseWeekPage />
      },
      {
        path: 'schedule',
        element: <SchedulePage />
      },
      {
        path: 'thesis',
        element: <ThesesPage />
      },
      {
        path: 'thesis/my',
        element: <ThesisPage />
      },
      {
        path: 'thesis/new',
        element: <EditThesisPage />
      },
      {
        path: 'thesis/:tid',
        element: <ThesisPage />
      },
      {
        path: 'thesis/:tid/edit',
        element: <EditThesisPage />
      },
      {
        path: 'thesis/:tid/submission',
        element: <SubmissionsPage />
      },
      {
        path: 'thesis/:tid/submission/:sid',
        element: <SubmissionPage />
      }
    ]
  },
  {
    path: '/auth',
    element: <LoginLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      {
        path: 'complete',
        element: <CompleteRegistrationPage />
      },
      {
        path: 'code',
        element: <AccessCodePage />
      },
    ]
  },
];

export default routes;
