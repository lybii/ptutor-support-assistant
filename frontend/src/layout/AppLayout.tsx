import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AssistantWidget } from '../components/assistant/AssistantWidget';
import { SupportRequestDialog } from '../components/assistant/SupportRequestDialog';
import { endAssistantConversationOnLogout } from '../services/assistantApi';
import { getUnreadCount } from '../services/accountApi';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { to: '/student', label: 'Tổng quan', end: true },
  { to: '/student/contracts', label: 'Hợp đồng' },
  { to: '/student/studying-requests', label: 'Tin tìm gia sư' },
  { to: '/student/applications', label: 'Đơn ứng tuyển' },
  { to: '/student/refund-requests', label: 'Hoàn tiền' },
  { to: '/student/wallet', label: 'Ví' },
  { to: '/student/notifications', label: 'Thông báo' },
  { to: '/student/support-requests', label: 'Yêu cầu hỗ trợ' },
  { to: '/student/profile', label: 'Hồ sơ' }
];

const TUTOR_NAV: NavItem[] = [
  { to: '/tutor', label: 'Tổng quan', end: true },
  { to: '/tutor/contracts', label: 'Hợp đồng' },
  { to: '/tutor/proposals', label: 'Đề nghị dạy' },
  { to: '/tutor/certificates', label: 'Chứng chỉ' },
  { to: '/tutor/refund-requests', label: 'Hoàn tiền' },
  { to: '/tutor/wallet', label: 'Ví' },
  { to: '/tutor/notifications', label: 'Thông báo' },
  { to: '/tutor/support-requests', label: 'Yêu cầu hỗ trợ' },
  { to: '/tutor/profile', label: 'Hồ sơ' }
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/assistant/documents', label: 'Kho tri thức' },
  { to: '/admin/assistant/unanswered', label: 'Câu hỏi chưa trả lời' },
  { to: '/admin/assistant/stats', label: 'Thống kê trợ lý' },
  { to: '/admin/support-requests', label: 'Yêu cầu hỗ trợ' }
];

const EMPLOYEE_NAV: NavItem[] = [{ to: '/admin/support-requests', label: 'Yêu cầu hỗ trợ' }];

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Học viên',
  TUTOR: 'Gia sư',
  EMPLOYEE: 'Nhân viên hỗ trợ',
  ADMIN: 'Quản trị viên'
};

function navFor(role: string): NavItem[] {
  if (role === 'STUDENT') return STUDENT_NAV;
  if (role === 'TUTOR') return TUTOR_NAV;
  if (role === 'ADMIN') return ADMIN_NAV;
  return EMPLOYEE_NAV;
}

function NotificationBell({ basePath }: { basePath: string }) {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getUnreadCount(controller.signal)
      .then((result) => setCount(result.unreadCount))
      .catch(() => undefined);
    return () => controller.abort();
  }, [location.pathname]);

  return (
    <Link className="app-bell" to={`${basePath}/notifications`} aria-label={`Thông báo, ${count} chưa đọc`}>
      🔔
      {count > 0 && <span className="app-bell-count">{count}</span>}
    </Link>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = useCallback(() => {
    endAssistantConversationOnLogout(user?.userId);
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate, user?.userId]);

  if (!user) return null;
  const isLearner = user.role === 'STUDENT' || user.role === 'TUTOR';
  const basePath = user.role === 'TUTOR' ? '/tutor' : '/student';
  const fullName = [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" to="/">
          <span className="app-brand-mark">P</span>
          PTutor
        </Link>
        {navFor(user.role).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          {isLearner && <NotificationBell basePath={basePath} />}
          <div className="app-user">
            <strong>{fullName}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </div>
          <button type="button" className="app-logout" onClick={onLogout}>
            Đăng xuất
          </button>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      {isLearner && (
        <AssistantWidget
          renderSupportDialog={(draft, close) => (
            <SupportRequestDialog draft={draft} basePath={basePath} onClose={close} />
          )}
        />
      )}
    </div>
  );
}
