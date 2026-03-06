'use client';

import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  variant?: Variant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<Variant, { icon: React.ElementType; iconBg: string; iconColor: string; btnBg: string }> = {
  danger: { icon: Trash2, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600', btnBg: 'bg-red-600 hover:bg-red-700' },
  warning: { icon: AlertTriangle, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600', btnBg: 'bg-amber-600 hover:bg-amber-700' },
  info: { icon: Info, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600', btnBg: 'bg-primary hover:opacity-90' },
};

export default function ConfirmModal({
  open,
  title,
  message,
  variant = 'danger',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useApp();

  if (!open) return null;

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div
        className="bg-[var(--card)] rounded-xl p-6 max-w-sm w-full shadow-xl border border-[var(--border)] animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={style.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-1">
              {title || t('areYouSure')}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">{message}</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-accent transition flex-shrink-0">
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium"
          >
            {cancelLabel || t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm text-white font-medium transition ${style.btnBg}`}
          >
            {confirmLabel || t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
