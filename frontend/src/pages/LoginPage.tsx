import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../auth/useAuth';
import { ApiError } from '../services/httpClient';

const DEMO_ACCOUNTS = [
  { email: 'hocvien@ptutor.demo', label: 'Học viên' },
  { email: 'giasu@ptutor.demo', label: 'Gia sư' },
  { email: 'hotro@ptutor.demo', label: 'Nhân viên hỗ trợ' },
  { email: 'admin@ptutor.demo', label: 'Quản trị viên' }
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
      <div className="login-card">
        <div className="app-brand" style={{ margin: 0 }}>
          <span className="app-brand-mark">P</span>
          PTutor
        </div>
        <h1>Đăng nhập</h1>
        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
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
        <div className="login-accounts">
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.email} type="button" className="login-account" onClick={() => setEmail(account.email)}>
              <strong>{account.label}</strong>
              <span>{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
