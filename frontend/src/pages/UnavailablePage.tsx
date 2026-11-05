import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/** Màn hình có trong kho tri thức nhưng nằm ngoài phạm vi bản demo (đăng tin, ký hợp đồng...). */
export function UnavailablePage() {
  const { user } = useAuth();
  const base = user?.role === 'TUTOR' ? '/tutor' : '/student';
  return (
    <section className="card">
      <h2>Chức năng chưa có trong bản demo</h2>
      <p className="muted">Bản demo tập trung vào trợ lý hỗ trợ và các màn hình tra cứu.</p>
      <Link className="admin-button" to={base}>
        Về trang tổng quan
      </Link>
    </section>
  );
}
