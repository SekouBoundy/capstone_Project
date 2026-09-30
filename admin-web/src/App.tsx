import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { RequireAdmin } from '@/auth/RequireAdmin';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { VerificationsPage } from '@/pages/VerificationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ModerationPage } from '@/pages/ModerationPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAdmin>
            <AppShell />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="verifications" element={<VerificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="moderation" element={<ModerationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
