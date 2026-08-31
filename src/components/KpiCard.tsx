import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  accent: 'rose' | 'emerald' | 'brand' | 'slate';
}

const ACCENT_STYLES = {
  rose: {
    iconWrap: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  emerald: {
    iconWrap: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  brand: {
    iconWrap: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    bar: 'bg-brand-500',
  },
  slate: {
    iconWrap: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    bar: 'bg-slate-500',
  },
};

export default function KpiCard({ label, value, sublabel, icon: Icon, accent }: KpiCardProps) {
  const s = ACCENT_STYLES[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute left-0 top-0 h-1 w-full ${s.bar} opacity-80`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconWrap}`}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
