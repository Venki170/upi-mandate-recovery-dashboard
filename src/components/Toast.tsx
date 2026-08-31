import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const STYLES: Record<ToastType, { icon: typeof CheckCircle2; color: string; ring: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-500',
    ring: 'ring-rose-500/20',
  },
  info: {
    icon: Info,
    color: 'text-brand-500',
    ring: 'ring-brand-500/20',
  },
};

export default function Toast({ toast, onClose }: ToastProps) {
  const { icon: Icon, color, ring } = STYLES[toast.type];

  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg ring-1 ${ring} animate-slide-in dark:border-slate-700 dark:bg-slate-900`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} strokeWidth={2.2} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
