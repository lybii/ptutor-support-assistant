// Các trang tài khoản của học viên, gia sư: đọc API "của tôi" của backend (cùng API mà trợ lý tra cứu).
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useResource } from '../../hooks/useResource';
import {
  getAccountData,
  getAccountRows,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Row
} from '../../services/accountApi';
import { AdminState } from '../admin/components/AdminUi';
import { day, FieldList, moment, money, personName, RecordTable, Status, text, type Column } from './accountFormat';

function useBase() {
  const { user } = useAuth();
  const isTutor = user?.role === 'TUTOR';
  return { isTutor, base: isTutor ? '/tutor' : '/student', self: isTutor ? '/api/v1/tutors/me' : '/api/v1/students/me' };
}

function useRows(path: string) {
  const load = useCallback((signal: AbortSignal) => getAccountRows(path, signal), [path]);
  return useResource(load);
}

function useRecord<T = Row>(path: string) {
  const load = useCallback((signal: AbortSignal) => getAccountData<T>(path, signal), [path]);
  return useResource(load);
}

function ListCard({ title, path, columns, empty }: { title?: string; path: string; columns: Column[]; empty: string }) {
  const { data, error, isLoading } = useRows(path);
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {isLoading || error ? (
        <AdminState loading={isLoading} error={error} />
      ) : (
        <RecordTable rows={data ?? []} columns={columns} empty={empty} />
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Tổng quan

export function DashboardPage() {
  const { user } = useAuth();
  const { base, isTutor } = useBase();
  const contracts = useRows('/api/v1/users/me/contracts');
  const wallet = useRecord('/api/v1/users/me/wallet');
  const loadUnread = useCallback(
    (signal: AbortSignal) => getAccountData<{ unreadCount: number }>('/api/v1/users/me/notifications/unread-count', signal),
    []
  );
  const unread = useResource(loadUnread);
  const active = (contracts.data ?? []).filter((row) => row.status === 'ACTIVE').length;

  return (
    <>
      <h1 className="page-title">Xin chào, {user?.firstName ?? ''}</h1>
      <div className="stat-grid">
        <Link className="stat-card" to={`${base}/contracts`}>
          <span>Hợp đồng đang học</span>
          <strong>{contracts.isLoading ? '…' : active}</strong>
        </Link>
        <Link className="stat-card" to={`${base}/wallet`}>
          <span>Số dư ví</span>
          <strong>{wallet.isLoading ? '…' : money(wallet.data?.balance)}</strong>
        </Link>
        <Link className="stat-card" to={`${base}/notifications`}>
          <span>Thông báo chưa đọc</span>
          <strong>{unread.isLoading ? '…' : (unread.data?.unreadCount ?? 0)}</strong>
        </Link>
      </div>
      <section className="card">
        <h2>Hợp đồng gần đây</h2>
        {contracts.isLoading || contracts.error ? (
          <AdminState loading={contracts.isLoading} error={contracts.error} />
        ) : (
          <RecordTable rows={contracts.data ?? []} columns={contractColumns(base, isTutor)} empty="Chưa có hợp đồng." />
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Hợp đồng

function contractColumns(base: string, isTutor: boolean): Column[] {
  return [
    {
      header: 'Môn học',
      render: (row) => (
        <Link to={`${base}/contracts/${String(row.id)}`}>
          {text(row.subjectName)} · {text(row.gradeName)}
        </Link>
      )
    },
    { header: isTutor ? 'Học viên' : 'Gia sư', render: (row) => personName(row, isTutor ? 'student' : 'tutor') },
    { header: 'Hình thức', render: (row) => text(row.teachingMode) },
    { header: 'Học phí / buổi', render: (row) => money(row.price) },
    { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
  ];
}

export function ContractsPage() {
  const { base, isTutor } = useBase();
  return (
    <>
      <h1 className="page-title">Hợp đồng</h1>
      <ListCard path="/api/v1/users/me/contracts" columns={contractColumns(base, isTutor)} empty="Chưa có hợp đồng." />
    </>
  );
}

const lessonColumns: Column[] = [
  { header: 'Buổi', render: (row) => text(row.title) },
  { header: 'Ngày', render: (row) => day(row.date) },
  { header: 'Giờ', render: (row) => `${text(row.startTime)} – ${text(row.endTime)}` },
  { header: 'Trạng thái', render: (row) => <Status value={row.status} /> },
  { header: 'Ghi chú', render: (row) => text(row.note) }
];

const installmentColumns: Column[] = [
  { header: 'Kỳ', render: (row) => text(row.sequenceNumber) },
  { header: 'Số tiền', render: (row) => money(row.amount) },
  { header: 'Hạn', render: (row) => day(row.dueDate) },
  { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
];

export function ContractDetailPage() {
  const { contractId = '' } = useParams();
  const { base, self, isTutor } = useBase();
  const { data, error, isLoading } = useRecord(`/api/v1/users/me/contracts/${contractId}`);

  return (
    <>
      <Link className="admin-back" to={`${base}/contracts`}>
        ← Hợp đồng
      </Link>
      <h1 className="page-title">
        {data ? `${text(data.subjectName)} · ${text(data.gradeName)}` : 'Chi tiết hợp đồng'}
      </h1>
      {isLoading || error || !data ? (
        <AdminState loading={isLoading} error={error ?? (data ? null : 'Không tìm thấy hợp đồng.')} />
      ) : (
        <>
          <section className="card">
            <FieldList
              items={[
                ['Trạng thái', <Status key="s" value={data.status} />],
                [isTutor ? 'Học viên' : 'Gia sư', personName(data, isTutor ? 'student' : 'tutor')],
                ['Hình thức', text(data.teachingMode)],
                ['Học phí / buổi', money(data.price)],
                ['Kỳ thanh toán', text(data.paymentPeriod)],
                ['Tổng số buổi', text(data.totalLessons)],
                ['Lịch học', text(data.preferredSchedule)],
                ['Bắt đầu', day(data.startDate)]
              ]}
            />
          </section>
          <ListCard
            title="Buổi học"
            path={`${self}/contracts/${contractId}/lessons`}
            columns={lessonColumns}
            empty="Chưa có buổi học."
          />
          {!isTutor && (
            <ListCard
              title="Kỳ học phí"
              path={`${self}/contracts/${contractId}/payment-installments`}
              columns={installmentColumns}
              empty="Chưa có kỳ học phí."
            />
          )}
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Ví

export function WalletPage() {
  const wallet = useRecord('/api/v1/users/me/wallet');
  return (
    <>
      <h1 className="page-title">Ví</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Số dư khả dụng</span>
          <strong>{wallet.isLoading ? '…' : money(wallet.data?.balance)}</strong>
        </div>
        <div className="stat-card">
          <span>Đang chờ xử lý</span>
          <strong>{wallet.isLoading ? '…' : money(wallet.data?.pendingBalance)}</strong>
        </div>
      </div>
      <ListCard
        title="Giao dịch ví"
        path="/api/v1/users/me/wallet/transactions"
        empty="Chưa có giao dịch."
        columns={[
          { header: 'Thời gian', render: (row) => moment(row.createdAt) },
          { header: 'Nội dung', render: (row) => text(row.description) },
          { header: 'Loại', render: (row) => text(row.transactionType) },
          { header: 'Số tiền', render: (row) => money(row.amount) },
          { header: 'Số dư sau', render: (row) => money(row.balanceAfter) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
      <ListCard
        title="Yêu cầu rút tiền"
        path="/api/v1/users/me/wallet/withdrawals"
        empty="Chưa có yêu cầu rút tiền."
        columns={[
          { header: 'Thời gian', render: (row) => moment(row.createdAt) },
          { header: 'Số tiền', render: (row) => money(row.amount) },
          { header: 'Ghi chú', render: (row) => text(row.note) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

// ------------------------------------------------------------------ Hoàn tiền

export function RefundRequestsPage() {
  const { base, self } = useBase();
  return (
    <>
      <h1 className="page-title">Yêu cầu hoàn tiền</h1>
      <ListCard
        path={`${self}/refund-requests`}
        empty="Chưa có yêu cầu hoàn tiền."
        columns={[
          {
            header: 'Hợp đồng',
            render: (row) => (
              <Link to={`${base}/refund-requests/${String(row.id)}`}>
                {text(row.subjectName)} · {text(row.gradeName)}
              </Link>
            )
          },
          { header: 'Gửi lúc', render: (row) => moment(row.createdAt) },
          { header: 'Số tiền hoàn', render: (row) => money(row.refundAmount) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

export function RefundRequestDetailPage() {
  const { refundRequestId = '' } = useParams();
  const { base, self } = useBase();
  const { data, error, isLoading } = useRecord(`${self}/refund-requests/${refundRequestId}`);
  return (
    <>
      <Link className="admin-back" to={`${base}/refund-requests`}>
        ← Hoàn tiền
      </Link>
      <h1 className="page-title">Yêu cầu hoàn tiền</h1>
      {isLoading || error || !data ? (
        <AdminState loading={isLoading} error={error} />
      ) : (
        <section className="card">
          <FieldList
            items={[
              ['Trạng thái', <Status key="s" value={data.status} />],
              ['Hợp đồng', `${text(data.subjectName)} · ${text(data.gradeName)}`],
              ['Lý do', text(data.description)],
              ['Phản hồi của gia sư', text(data.tutorResponse)],
              ['Hạn gia sư phản hồi', moment(data.tutorResponseDeadline)],
              ['Số tiền hoàn', money(data.refundAmount)],
              ['Lý do từ chối', text(data.rejectionReason)],
              ['Gửi lúc', moment(data.createdAt)]
            ]}
          />
        </section>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Học viên: tin tìm gia sư, đơn ứng tuyển

export function StudyingRequestsPage() {
  return (
    <>
      <h1 className="page-title">Tin tìm gia sư</h1>
      <ListCard
        path="/api/v1/students/me/studying-requests"
        empty="Chưa có tin tìm gia sư."
        columns={[
          { header: 'Tiêu đề', render: (row) => text(row.title) },
          { header: 'Môn học', render: (row) => `${text(row.subjectName)} · ${text(row.gradeName)}` },
          { header: 'Học phí mong muốn', render: (row) => `${money(row.minPrice)} – ${money(row.maxPrice)}` },
          { header: 'Hình thức', render: (row) => text(row.learningMode) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

export function ApplicationsPage() {
  return (
    <>
      <h1 className="page-title">Đơn ứng tuyển vào tin của gia sư</h1>
      <ListCard
        path="/api/v1/students/me/student-tutor-requests"
        empty="Chưa có đơn ứng tuyển."
        columns={[
          { header: 'Tin dạy', render: (row) => text(row.teachingRequestTitle) },
          { header: 'Gia sư', render: (row) => text(row.tutorFirstName) },
          { header: 'Học phí đề xuất', render: (row) => money(row.proposedPrice) },
          { header: 'Bước tiếp theo', render: (row) => text(row.nextStep) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

// ------------------------------------------------------------------ Gia sư: đề nghị dạy, chứng chỉ

export function ProposalsPage() {
  return (
    <>
      <h1 className="page-title">Đề nghị dạy đã gửi</h1>
      <ListCard
        path="/api/v1/tutors/me/tutor-student-requests"
        empty="Chưa gửi đề nghị nào."
        columns={[
          { header: 'Tin tìm gia sư', render: (row) => text(row.studyingRequestTitle) },
          { header: 'Môn học', render: (row) => `${text(row.subjectName)} · ${text(row.gradeName)}` },
          { header: 'Học phí đề xuất', render: (row) => money(row.proposedPrice) },
          { header: 'Gửi lúc', render: (row) => moment(row.createdAt) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

export function CertificatesPage() {
  return (
    <>
      <h1 className="page-title">Chứng chỉ</h1>
      <ListCard
        path="/api/v1/tutors/me/certificates"
        empty="Chưa có chứng chỉ."
        columns={[
          { header: 'Tên', render: (row) => text(row.name) },
          { header: 'Đơn vị cấp', render: (row) => text(row.issuingOrganization) },
          { header: 'Ngày cấp', render: (row) => day(row.issueDate) },
          { header: 'Hết hạn', render: (row) => day(row.expiryDate) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

// ------------------------------------------------------------------ Hồ sơ

export function ProfilePage() {
  const { self, isTutor } = useBase();
  const { data, error, isLoading } = useRecord(self);
  const items: [string, string][] = data
    ? isTutor
      ? [
          ['Họ tên', `${text(data.lastName)} ${text(data.firstName)}`],
          ['Email', text(data.email)],
          ['Số năm kinh nghiệm', text(data.experienceYears)],
          ['Học vấn', text(data.education)],
          ['Môn thế mạnh', text(data.strengthSubjects)],
          ['Phong cách dạy', text(data.teachingStyleTags)],
          ['Giới thiệu', text(data.introduction)]
        ]
      : [
          ['Họ tên', `${text(data.lastName)} ${text(data.firstName)}`],
          ['Email', text(data.email)],
          ['Trình độ hiện tại', text(data.currentLevel)],
          ['Mục tiêu', text(data.goalsDescription)],
          ['Điểm yếu', text(data.weakPoints)],
          ['Phong cách học', text(data.learningStyle)],
          ['Giới thiệu', text(data.introduction)]
        ]
    : [];
  return (
    <>
      <h1 className="page-title">Hồ sơ</h1>
      <section className="card">
        {isLoading || error ? <AdminState loading={isLoading} error={error} /> : <FieldList items={items} />}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Thông báo

export function NotificationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, error, isLoading } = useResource(listNotifications, refreshKey);
  const items = data?.content ?? [];

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setRefreshKey((key) => key + 1);
  };
  const markAll = async () => {
    await markAllNotificationsRead();
    setRefreshKey((key) => key + 1);
  };

  return (
    <>
      <div className="admin-button-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Thông báo
        </h1>
        {items.some((item) => !item.isRead) && (
          <button type="button" className="admin-button secondary small" onClick={() => void markAll()}>
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>
      <section className="card">
        {isLoading || error ? (
          <AdminState loading={isLoading} error={error} />
        ) : items.length === 0 ? (
          <p className="muted">Chưa có thông báo.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={item.isRead ? 'notification-item' : 'notification-item unread'}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.content}</p>
              </div>
              <div className="rf-row-side">
                {moment(item.createdAt)}
                {!item.isRead && (
                  <button type="button" className="admin-button secondary small" onClick={() => void markRead(item.id)}>
                    Đã đọc
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Không tìm thấy

export function NotFoundPage() {
  const { base } = useBase();
  return (
    <section className="card">
      <h2>Không tìm thấy trang</h2>
      <p className="muted">Đường dẫn này không tồn tại.</p>
      <Link className="admin-button" to={base}>
        Về trang tổng quan
      </Link>
    </section>
  );
}
