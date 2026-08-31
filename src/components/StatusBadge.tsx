import type { MandateStatus } from '@/types';

const STATUS_STYLES: Record<MandateStatus, string> = {
  'Pending Retry':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  'Auto-Scheduled':
    'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 ring-brand-600/20',
  Processing:
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 ring-cyan-600/20',
  Recovered:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  Stopped:
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 ring-rose-600/20',
};

const DOT_STYLES: Record<MandateStatus, string> = {
  'Pending Retry': 'bg-amber-500',
  'Auto-Scheduled': 'bg-brand-500',
  Processing: 'bg-cyan-500',
  Recovered: 'bg-emerald-500',
  Stopped: 'bg-rose-500',
};

export default function StatusBadge({ status }: { status: MandateStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status]}`} />
      {status}
    </span>
  );
}
