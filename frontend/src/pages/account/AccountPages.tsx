// Các trang tài khoản của học viên, gia sư: đọc API "của tôi" của backend (cùng API mà trợ lý tra cứu).
import { useCallback, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Icon } from '../../components/icons';
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
import {
  clock,
  day,
  FieldList,
  moment,
  money,
  personName,
  RecordTable,
  Status,
  text,
  type Column
} from './accountFormat';

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

function PageHeader({ title, back, actions }: { title: ReactNode; back?: { to: string; label: string }; actions?: ReactNode }) {
  return (
    <>
      {back && (
        <Link className="back-link" to={back.to}>
          <Icon name="arrow-left" size={16} />
          {back.label}
        </Link>
      )}
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {actions}
      </div>
    </>
  );
}

function ListCard({ title, path, columns, empty }: { title?: string; path: string; columns: Column[]; empty: string }) {
  const { data, error, isLoading } = useRows(path);
  return (
    <section className="card card-flush">
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
      <section className="welcome-card">
        <div>
          <h1>Xin chào, {user?.firstName ?? ''}</h1>
        </div>
        <span className="welcome-icon">
          <Icon name="chat" size={28} />
        </span>
      </section>
      <div className="stat-grid">
        <Link className="stat-card" to={`${base}/contracts`}>
          <span className="stat-icon">
            <Icon name="contract" />
          </span>
          <div>
            <span>{isTutor ? 'Hợp đồng đang dạy' : 'Hợp đồng đang học'}</span>
            <strong>{contracts.isLoading ? '…' : active}</strong>
          </div>
        </Link>
        <Link className="stat-card" to={`${base}/wallet`}>
          <span className="stat-icon green">
            <Icon name="wallet" />
          </span>
          <div>
            <span>Số dư ví</span>
            <strong>{wallet.isLoading ? '…' : money(wallet.data?.balance)}</strong>
          </div>
        </Link>
        <Link className="stat-card" to={`${base}/notifications`}>
          <span className="stat-icon amber">
            <Icon name="bell" />
          </span>
          <div>
            <span>Thông báo chưa đọc</span>
            <strong>{unread.isLoading ? '…' : (unread.data?.unreadCount ?? 0)}</strong>
          </div>
        </Link>
      </div>
      <section className="card card-flush">
        <h2>Hợp đồng</h2>
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
        <Link className="cell-title" to={`${base}/contracts/${String(row.id)}`}>
          {text(row.subjectName)}
          <span className="cell-sub">{text(row.gradeName)}</span>
        </Link>
      )
    },
    { header: isTutor ? 'Học viên' : 'Gia sư', render: (row) => personName(row, isTutor ? 'student' : 'tutor') },
    { header: 'Hình thức', render: (row) => text(row.teachingMode) },
    { header: 'Lịch học', render: (row) => text(row.preferredSchedule) },
    { header: 'Học phí / buổi', render: (row) => money(row.price), align: 'right' },
    { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
  ];
}

export function ContractsPage() {
  const { base, isTutor } = useBase();
  return (
    <>
      <PageHeader title="Hợp đồng" />
      <ListCard path="/api/v1/users/me/contracts" columns={contractColumns(base, isTutor)} empty="Chưa có hợp đồng." />
    </>
  );
}

const lessonColumns: Column[] = [
  { header: 'Buổi', render: (row) => <span className="cell-title">{text(row.title)}</span> },
  { header: 'Ngày', render: (row) => day(row.date) },
  { header: 'Giờ', render: (row) => `${clock(row.startTime)} – ${clock(row.endTime)}` },
  { header: 'Hình thức', render: (row) => text(row.teachingMode) },
  { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
];

const installmentColumns: Column[] = [
  { header: 'Kỳ', render: (row) => <span className="cell-title">Kỳ {text(row.sequenceNumber)}</span> },
  { header: 'Hạn thanh toán', render: (row) => day(row.dueDate) },
  { header: 'Số tiền', render: (row) => money(row.amount), align: 'right' },
  { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
];

export function ContractDetailPage() {
  const { contractId = '' } = useParams();
  const { base, self, isTutor } = useBase();
  const { data, error, isLoading } = useRecord(`/api/v1/users/me/contracts/${contractId}`);

  return (
    <>
      <PageHeader
        back={{ to: `${base}/contracts`, label: 'Hợp đồng' }}
        title={data ? `${text(data.subjectName)} · ${text(data.gradeName)}` : 'Chi tiết hợp đồng'}
        actions={data ? <Status value={data.status} /> : undefined}
      />
      {isLoading || error || !data ? (
        <section className="card">
          <AdminState loading={isLoading} error={error ?? (data ? null : 'Không tìm thấy hợp đồng.')} />
        </section>
      ) : (
        <>
          <section className="card">
            <FieldList
              items={[
                [isTutor ? 'Học viên' : 'Gia sư', personName(data, isTutor ? 'student' : 'tutor')],
                ['Hình thức', text(data.teachingMode)],
                ['Học phí / buổi', money(data.price)],
                ['Kỳ thanh toán', text(data.paymentPeriod)],
                ['Tổng số buổi', text(data.totalLessons)],
                ['Lịch học', text(data.preferredSchedule)],
                ['Bắt đầu', day(data.startDate)],
                ['Kết thúc', day(data.endDate)]
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
      <PageHeader title="Ví" />
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon green">
            <Icon name="wallet" />
          </span>
          <div>
            <span>Số dư khả dụng</span>
            <strong>{wallet.isLoading ? '…' : money(wallet.data?.balance)}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon amber">
            <Icon name="refund" />
          </span>
          <div>
            <span>Đang chờ xử lý</span>
            <strong>{wallet.isLoading ? '…' : money(wallet.data?.pendingBalance)}</strong>
          </div>
        </div>
      </div>
      <ListCard
        title="Giao dịch ví"
        path="/api/v1/users/me/wallet/transactions"
        empty="Chưa có giao dịch."
        columns={[
          {
            header: 'Nội dung',
            render: (row) => (
              <span className="cell-title">
                {text(row.description)}
                <span className="cell-sub">{moment(row.createdAt)}</span>
              </span>
            )
          },
          { header: 'Loại', render: (row) => text(row.transactionType) },
          {
            header: 'Số tiền',
            align: 'right',
            render: (row) => (
              <span style={{ color: row.transactionType === 'CREDIT' ? 'var(--green)' : undefined, fontWeight: 600 }}>
                {row.transactionType === 'CREDIT' ? '+' : '−'}
                {money(row.amount)}
              </span>
            )
          },
          { header: 'Số dư sau', render: (row) => money(row.balanceAfter), align: 'right' },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
      <div style={{ height: 18 }} />
      <ListCard
        title="Yêu cầu rút tiền"
        path="/api/v1/users/me/wallet/withdrawals"
        empty="Chưa có yêu cầu rút tiền."
        columns={[
          { header: 'Thời gian', render: (row) => moment(row.createdAt) },
          { header: 'Ghi chú', render: (row) => text(row.note) },
          { header: 'Số tiền', render: (row) => money(row.amount), align: 'right' },
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
      <PageHeader title="Yêu cầu hoàn tiền" />
      <ListCard
        path={`${self}/refund-requests`}
        empty="Chưa có yêu cầu hoàn tiền."
        columns={[
          {
            header: 'Hợp đồng',
            render: (row) => (
              <Link className="cell-title" to={`${base}/refund-requests/${String(row.id)}`}>
                {text(row.subjectName)}
                <span className="cell-sub">{text(row.gradeName)}</span>
              </Link>
            )
          },
          { header: 'Lý do', render: (row) => text(row.description) },
          { header: 'Gửi lúc', render: (row) => moment(row.createdAt) },
          { header: 'Số tiền hoàn', render: (row) => money(row.refundAmount), align: 'right' },
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
      <PageHeader
        back={{ to: `${base}/refund-requests`, label: 'Hoàn tiền' }}
        title="Yêu cầu hoàn tiền"
        actions={data ? <Status value={data.status} /> : undefined}
      />
      <section className="card">
        {isLoading || error || !data ? (
          <AdminState loading={isLoading} error={error} />
        ) : (
          <FieldList
            items={[
              ['Hợp đồng', `${text(data.subjectName)} · ${text(data.gradeName)}`],
              ['Gửi lúc', moment(data.createdAt)],
              ['Lý do', text(data.description)],
              ['Phản hồi của gia sư', text(data.tutorResponse)],
              ['Hạn gia sư phản hồi', moment(data.tutorResponseDeadline)],
              ['Số tiền hoàn', money(data.refundAmount)],
              ['Lý do từ chối', text(data.rejectionReason)]
            ]}
          />
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Học viên: tin tìm gia sư, đơn ứng tuyển

export function StudyingRequestsPage() {
  return (
    <>
      <PageHeader title="Tin tìm gia sư" />
      <ListCard
        path="/api/v1/students/me/studying-requests"
        empty="Chưa có tin tìm gia sư."
        columns={[
          {
            header: 'Tiêu đề',
            render: (row) => (
              <span className="cell-title">
                {text(row.title)}
                <span className="cell-sub">
                  {text(row.subjectName)} · {text(row.gradeName)}
                </span>
              </span>
            )
          },
          { header: 'Hình thức', render: (row) => text(row.learningMode) },
          { header: 'Học phí mong muốn', render: (row) => `${money(row.minPrice)} – ${money(row.maxPrice)}` },
          { header: 'Đăng lúc', render: (row) => day(row.createdAt) },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

export function ApplicationsPage() {
  return (
    <>
      <PageHeader title="Đơn ứng tuyển" />
      <ListCard
        path="/api/v1/students/me/student-tutor-requests"
        empty="Chưa có đơn ứng tuyển."
        columns={[
          {
            header: 'Tin dạy',
            render: (row) => (
              <span className="cell-title">
                {text(row.teachingRequestTitle)}
                <span className="cell-sub">Gia sư {text(row.tutorFirstName)}</span>
              </span>
            )
          },
          { header: 'Học phí đề xuất', render: (row) => money(row.proposedPrice), align: 'right' },
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
      <PageHeader title="Đề nghị dạy" />
      <ListCard
        path="/api/v1/tutors/me/tutor-student-requests"
        empty="Chưa gửi đề nghị nào."
        columns={[
          {
            header: 'Tin tìm gia sư',
            render: (row) => (
              <span className="cell-title">
                {text(row.studyingRequestTitle)}
                <span className="cell-sub">
                  {text(row.subjectName)} · {text(row.gradeName)}
                </span>
              </span>
            )
          },
          { header: 'Gửi lúc', render: (row) => day(row.createdAt) },
          { header: 'Học phí đề xuất', render: (row) => money(row.proposedPrice), align: 'right' },
          { header: 'Trạng thái', render: (row) => <Status value={row.status} /> }
        ]}
      />
    </>
  );
}

export function CertificatesPage() {
  return (
    <>
      <PageHeader title="Chứng chỉ" />
      <ListCard
        path="/api/v1/tutors/me/certificates"
        empty="Chưa có chứng chỉ."
        columns={[
          {
            header: 'Chứng chỉ',
            render: (row) => (
              <span className="cell-title">
                {text(row.name)}
                <span className="cell-sub">{text(row.issuingOrganization)}</span>
              </span>
            )
          },
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
  const name = data ? `${text(data.lastName)} ${text(data.firstName)}` : '';
  const items: [string, string][] = data
    ? isTutor
      ? [
          ['Email', text(data.email)],
          ['Số năm kinh nghiệm', text(data.experienceYears)],
          ['Học vấn', text(data.education)],
          ['Môn thế mạnh', text(data.strengthSubjects)],
          ['Phong cách dạy', text(data.teachingStyleTags)],
          ['Giới thiệu', text(data.introduction)]
        ]
      : [
          ['Email', text(data.email)],
          ['Trình độ hiện tại', text(data.currentLevel)],
          ['Mục tiêu', text(data.goalsDescription)],
          ['Điểm cần cải thiện', text(data.weakPoints)],
          ['Phong cách học', text(data.learningStyle)],
          ['Giới thiệu', text(data.introduction)]
        ]
    : [];
  return (
    <>
      <PageHeader title="Hồ sơ" />
      <section className="card">
        {isLoading || error ? (
          <AdminState loading={isLoading} error={error} />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <span className="app-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                {[data?.lastName, data?.firstName].map((part) => String(part ?? '').charAt(0)).join('')}
              </span>
              <div>
                <strong style={{ fontSize: 18 }}>{name}</strong>
                <div className="muted">{isTutor ? 'Gia sư' : 'Học viên'}</div>
              </div>
            </div>
            <FieldList items={items} />
          </>
        )}
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
      <PageHeader
        title="Thông báo"
        actions={
          items.some((item) => !item.isRead) ? (
            <button type="button" className="admin-button secondary small" onClick={() => void markAll()}>
              Đánh dấu đã đọc tất cả
            </button>
          ) : undefined
        }
      />
      <section className="card card-flush">
        {isLoading || error ? (
          <AdminState loading={isLoading} error={error} />
        ) : items.length === 0 ? (
          <div className="empty-state">Chưa có thông báo.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={item.isRead ? 'notification-item' : 'notification-item unread'}>
              <span className="notification-dot" />
              <div className="notification-body">
                <strong>{item.title}</strong>
                <p>{item.content}</p>
              </div>
              <div className="notification-side">
                {moment(item.createdAt)}
                {!item.isRead && (
                  <button type="button" className="admin-link" onClick={() => void markRead(item.id)}>
                    Đánh dấu đã đọc
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
    <section className="card empty-state">
      <h2>Không tìm thấy trang</h2>
      <Link className="admin-button" to={base}>
        Về trang tổng quan
      </Link>
    </section>
  );
}
