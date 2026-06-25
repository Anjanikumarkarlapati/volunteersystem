import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChatbotWidget from './components/common/ChatbotWidget.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import OAuthRoleSelection from './pages/OAuthRoleSelection.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import SquadsPage from './pages/SquadsPage.jsx';
import OpportunitiesPage from './pages/OpportunitiesPage.jsx';
import OpportunityDetailPage from './pages/OpportunityDetailPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import OrganizationsPage from './pages/OrganizationsPage.jsx';
import AdminTasksPage from './pages/AdminTasksPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AdminApprovalsPage from './pages/AdminApprovalsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/role-selection" element={<OAuthRoleSelection />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Social features */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute roles={['volunteer']}>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/squads"
            element={
              <ProtectedRoute roles={['volunteer']}>
                <SquadsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/feedback" element={<FeedbackPage />} />

          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <ProtectedRoute roles={['admin']}>
                <OrganizationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ChatbotWidget />
    </GoogleOAuthProvider>
  );
}
