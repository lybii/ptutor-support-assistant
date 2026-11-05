// Mọi route trong knowledge-base/_routes.yaml phải có ở đây (assistant-service/scripts/check_catalog.py kiểm tra),
// vì nút hành động của trợ lý điều hướng tới các route đó.
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import type { UserRole } from './auth/authStorage';
import { homePathFor, useAuth } from './auth/useAuth';
import { AppLayout } from './layout/AppLayout';
import {
  ApplicationsPage,
  CertificatesPage,
  ContractDetailPage,
  ContractsPage,
  DashboardPage,
  NotFoundPage,
  NotificationsPage,
  ProfilePage,
  ProposalsPage,
  RefundRequestDetailPage,
  RefundRequestsPage,
  StudyingRequestsPage,
  WalletPage
} from './pages/account/AccountPages';
import { AssistantStatsPage } from './pages/admin/assistant/AssistantStatsPage';
import { KbDocumentEditorPage } from './pages/admin/assistant/KbDocumentEditorPage';
import { KbDocumentListPage } from './pages/admin/assistant/KbDocumentListPage';
import { UnansweredQuestionsPage } from './pages/admin/assistant/UnansweredQuestionsPage';
import { SupportRequestDetailPage as AdminSupportRequestDetailPage } from './pages/admin/support-requests/SupportRequestDetailPage';
import { SupportRequestQueuePage } from './pages/admin/support-requests/SupportRequestQueuePage';
import { SupportRequestDetailPage } from './pages/common-user/SupportRequestDetailPage';
import { SupportRequestsPage } from './pages/common-user/SupportRequestsPage';
import { LoginPage } from './pages/LoginPage';
import { UnavailablePage } from './pages/UnavailablePage';

function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user?.role)} replace />;
}

function guarded(roles: UserRole[]) {
  return (
    <RequireRole roles={roles}>
      <AppLayout />
    </RequireRole>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/public" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

          <Route element={guarded(['STUDENT'])}>
            <Route path="/student" element={<DashboardPage />} />
            <Route path="/student/dashboard" element={<DashboardPage />} />
            <Route path="/student/studying-requests" element={<StudyingRequestsPage />} />
            <Route path="/student/studying-requests/new" element={<UnavailablePage />} />
            <Route
              path="/student/studying-requests/:studyingRequestId/tutor-requests/:tutorRequestId"
              element={<UnavailablePage />}
            />
            <Route
              path="/student/studying-requests/:studyingRequestId/tutor-requests/:tutorRequestId/contracts/new"
              element={<UnavailablePage />}
            />
            <Route path="/student/studying-requests/:requestId" element={<UnavailablePage />} />
            <Route path="/student/studying-requests/:requestId/edit" element={<UnavailablePage />} />
            <Route path="/student/teaching-requests" element={<UnavailablePage />} />
            <Route path="/student/applications" element={<ApplicationsPage />} />
            <Route path="/student/contracts" element={<ContractsPage />} />
            <Route path="/student/contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="/student/contracts/:contractId/lessons" element={<ContractDetailPage />} />
            <Route path="/student/contracts/:contractId/refund-request" element={<UnavailablePage />} />
            <Route path="/student/refund-requests" element={<RefundRequestsPage />} />
            <Route path="/student/refund-requests/:refundRequestId" element={<RefundRequestDetailPage />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
            <Route path="/student/support-requests" element={<SupportRequestsPage />} />
            <Route path="/student/support-requests/:requestId" element={<SupportRequestDetailPage />} />
            <Route path="/student/wallet" element={<WalletPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
            <Route path="/student/*" element={<NotFoundPage />} />
          </Route>

          <Route element={guarded(['TUTOR'])}>
            <Route path="/tutor" element={<DashboardPage />} />
            <Route path="/tutor/dashboard" element={<DashboardPage />} />
            <Route path="/tutor/profile" element={<ProfilePage />} />
            <Route path="/tutor/certificates" element={<CertificatesPage />} />
            <Route path="/tutor/studying-requests/:requestId" element={<UnavailablePage />} />
            <Route path="/tutor/proposals" element={<ProposalsPage />} />
            <Route path="/tutor/contracts" element={<ContractsPage />} />
            <Route path="/tutor/contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="/tutor/refund-requests" element={<RefundRequestsPage />} />
            <Route path="/tutor/refund-requests/:refundRequestId" element={<RefundRequestDetailPage />} />
            <Route path="/tutor/notifications" element={<NotificationsPage />} />
            <Route path="/tutor/support-requests" element={<SupportRequestsPage />} />
            <Route path="/tutor/support-requests/:requestId" element={<SupportRequestDetailPage />} />
            <Route path="/tutor/wallet" element={<WalletPage />} />
            <Route path="/tutor/sections/:section" element={<UnavailablePage />} />
            <Route path="/tutor/*" element={<NotFoundPage />} />
          </Route>

          <Route element={guarded(['ADMIN'])}>
            <Route path="/admin/assistant/documents" element={<KbDocumentListPage />} />
            <Route path="/admin/assistant/documents/new" element={<KbDocumentEditorPage />} />
            <Route path="/admin/assistant/documents/:documentId" element={<KbDocumentEditorPage />} />
            <Route path="/admin/assistant/unanswered" element={<UnansweredQuestionsPage />} />
            <Route path="/admin/assistant/stats" element={<AssistantStatsPage />} />
          </Route>

          <Route element={guarded(['ADMIN', 'EMPLOYEE'])}>
            <Route path="/admin/support-requests" element={<SupportRequestQueuePage />} />
            <Route path="/admin/support-requests/:requestId" element={<AdminSupportRequestDetailPage />} />
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
