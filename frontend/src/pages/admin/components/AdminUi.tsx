import { useEffect, type ReactNode } from 'react';
import type { StatusMeta } from '../adminFormat';

export function StatusBadge({ meta }: { meta: StatusMeta }) {
  return <span className={`admin-badge admin-badge-${meta.tone}`}>{meta.label}</span>;
}

export function AdminState({ loading, error, empty }: { loading?: boolean; error?: string | null; empty?: string }) {
  if (loading) return <div className="admin-state">Đang tải…</div>;
  if (error) return <div className="admin-state admin-text-danger">{error}</div>;
  if (empty) return <div className="admin-state">{empty}</div>;
  return null;
}

interface ModalProps {
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function AdminModal({ title, subtitle, size = 'md', onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`admin-modal admin-modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="admin-modal-body">{children}</div>
        {footer && <footer className="admin-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function FilterChips<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="admin-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={option.value === value ? 'admin-chip active' : 'admin-chip'}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
