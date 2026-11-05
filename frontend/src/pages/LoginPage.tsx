import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../auth/useAuth';
import { ApiError } from '../services/httpClient';

const DEMO_ACCOUNTS = [
  { email: 'hocvien@ptutor.demo', label: 'Học viên', short: 'HV' },
  { email: 'giasu@ptutor.demo', label: 'Gia sư', short: 'GS' },
  { email: 'hotro@ptutor.demo', label: 'Nhân viên hỗ trợ', short: 'NV' },
  { email: 'admin@ptutor.demo', label: 'Quản trị viên', short: 'QT' }
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const signedIn = await login(email, password);
      navigate(homePathFor(signedIn.role), { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'INVALID_CREDENTIALS'
          ? 'Email hoặc mật khẩu không đúng.'
          : 'Không đăng nhập được. Thử lại sau.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        <div className="app-brand">
          <span className="app-brand-mark">P</span>
          PTutor
        </div>
        <h2>Trợ lý hỗ trợ cho học viên và gia sư</h2>
        <div className="login-chat">
          <div className="login-bubble mine">Làm sao để yêu cầu hoàn tiền?</div>
          <div className="login-bubble bot">Ở trang Buổi học, bấm Yêu cầu hoàn tiền. [1]</div>
          <div className="login-bubble mine">Số dư ví của tôi là bao nhiêu?</div>
          <div className="login-bubble bot">250.000 ₫</div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <h1>Đăng nhập</h1>
          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <div className="admin-alert admin-alert-danger">{error}</div>}
            <button className="admin-button" type="submit" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          <div className="login-divider">Tài khoản demo</div>
          <div className="login-accounts">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className={email === account.email ? 'login-account selected' : 'login-account'}
                onClick={() => setEmail(account.email)}
              >
                <span className="app-avatar">{account.short}</span>
                <span>
                  <strong>{account.label}</strong>
                  <span>{account.email}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
