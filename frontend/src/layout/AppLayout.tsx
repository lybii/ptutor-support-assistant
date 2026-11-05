import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { CurrentUser } from '../auth/authStorage';
import { useAuth } from '../auth/useAuth';
import { AssistantWidget } from '../components/assistant/AssistantWidget';
import { SupportRequestDialog } from '../components/assistant/SupportRequestDialog';
import { Icon, type IconName } from '../components/icons';
import { endAssistantConversationOnLogout } from '../services/assistantApi';
import { getUnreadCount } from '../services/accountApi';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const STUDENT_NAV: NavGroup[] = [
  { items: [{ to: '/student', label: 'Tổng quan', icon: 'home', end: true }] },
  {
    label: 'Học tập',
    items: [
      { to: '/student/contracts', label: 'Hợp đồng', icon: 'contract' },
      { to: '/student/studying-requests', label: 'Tin tìm gia sư', icon: 'search' },
      { to: '/student/applications', label: 'Đơn ứng tuyển', icon: 'send' }
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { to: '/student/wallet', label: 'Ví', icon: 'wallet' },
      { to: '/student/refund-requests', label: 'Hoàn tiền', icon: 'refund' }
    ]
  },
  {
    label: 'Tài khoản',
    items: [
      { to: '/student/notifications', label: 'Thông báo', icon: 'bell' },
      { to: '/student/support-requests', label: 'Yêu cầu hỗ trợ', icon: 'support' },
      { to: '/student/profile', label: 'Hồ sơ', icon: 'user' }
    ]
  }
];

const TUTOR_NAV: NavGroup[] = [
  { items: [{ to: '/tutor', label: 'Tổng quan', icon: 'home', end: true }] },
  {
    label: 'Giảng dạy',
    items: [
      { to: '/tutor/contracts', label: 'Hợp đồng', icon: 'contract' },
      { to: '/tutor/proposals', label: 'Đề nghị dạy', icon: 'send' },
      { to: '/tutor/certificates', label: 'Chứng chỉ', icon: 'award' }
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { to: '/tutor/wallet', label: 'Ví', icon: 'wallet' },
      { to: '/tutor/refund-requests', label: 'Hoàn tiền', icon: 'refund' }
    ]
  },
  {
    label: 'Tài khoản',
    items: [
      { to: '/tutor/notifications', label: 'Thông báo', icon: 'bell' },
      { to: '/tutor/support-requests', label: 'Yêu cầu hỗ trợ', icon: 'support' },
      { to: '/tutor/profile', label: 'Hồ sơ', icon: 'user' }
    ]
  }
];

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Trợ lý',
    items: [
      { to: '/admin/assistant/documents', label: 'Kho tri thức', icon: 'book' },
      { to: '/admin/assistant/unanswered', label: 'Câu hỏi chưa trả lời', icon: 'question' },
      { to: '/admin/assistant/stats', label: 'Thống kê', icon: 'chart' }
    ]
  },
  { label: 'Hỗ trợ', items: [{ to: '/admin/support-requests', label: 'Yêu cầu hỗ trợ', icon: 'support' }] }
];

const EMPLOYEE_NAV: NavGroup[] = [
  { label: 'Hỗ trợ', items: [{ to: '/admin/support-requests', label: 'Yêu cầu hỗ trợ', icon: 'support' }] }
];

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Học viên',
  TUTOR: 'Gia sư',
  EMPLOYEE: 'Nhân viên hỗ trợ',
  ADMIN: 'Quản trị viên'
};

function navFor(role: string): NavGroup[] {
  if (role === 'STUDENT') return STUDENT_NAV;
  if (role === 'TUTOR') return TUTOR_NAV;
  if (role === 'ADMIN') return ADMIN_NAV;
  return EMPLOYEE_NAV;
}

export function displayName(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'email'>): string {
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email;
}

export function initials(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'email'>): string {
  const parts = [user.lastName, user.firstName].filter(Boolean) as string[];
  const letters = parts.length ? parts.map((part) => part.trim()[0]) : [user.email[0]];
  return letters.slice(-2).join('').toUpperCase();
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
      <Icon name="bell" />
      {count > 0 && <span className="app-bell-count">{count > 9 ? '9+' : count}</span>}
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

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" to="/">
          <span className="app-brand-mark">P</span>
          PTutor
        </Link>
        <nav className="app-nav" aria-label="Điều hướng chính">
          {navFor(user.role).map((group, index) => (
            <div key={group.label ?? index} style={{ display: 'contents' }}>
              {group.label && <div className="app-nav-label">{group.label}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-user-card">
          <span className="app-avatar">{initials(user)}</span>
          <span className="app-user-text">
            <strong>{displayName(user)}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </span>
          <button type="button" className="app-icon-button" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-inner">
            <span className="app-topbar-role">{ROLE_LABELS[user.role]}</span>
            <div className="app-topbar-actions">{isLearner && <NotificationBell basePath={basePath} />}</div>
          </div>
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
