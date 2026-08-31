import {
  Activity,
  RefreshCw,
  Send,
  Ban,
  CheckCircle2,
  XCircle,
  Bell,
  Clock,
} from 'lucide-react';
import type { AuditLogEntry } from '@/types';
import { timeAgo } from '@/lib/format';

interface AuditLogProps {
  entries: AuditLogEntry[];
}

function iconForDecision(decision: string) {
  if (decision.includes('Retry')) return { Icon: RefreshCw, color: 'text-brand-500', wrap: 'bg-brand-100 dark:bg-brand-500/15' };
  if (decision.includes('Nudge')) return { Icon: Send, color: 'text-amber-500', wrap: 'bg-amber-100 dark:bg-amber-500/15' };
  if (decision.includes('Hard Stop') || decision.includes('Stop')) return { Icon: Ban, color: 'text-rose-500', wrap: 'bg-rose-100 dark:bg-rose-500/15' };
  if (decision.includes('Success') || decision.includes('Recovery')) return { Icon: CheckCircle2, color: 'text-emerald-500', wrap: 'bg-emerald-100 dark:bg-emerald-500/15' };
  if (decision.includes('Failure')) return { Icon: XCircle, color: 'text-rose-500', wrap: 'bg-rose-100 dark:bg-rose-500/15' };
  if (decision.includes('Auto')) return { Icon: Clock, color: 'text-brand-500', wrap: 'bg-brand-100 dark:bg-brand-500/15' };
  return { Icon: Bell, color: 'text-slate-500', wrap: 'bg-slate-100 dark:bg-slate-700' };
}

export default function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
        <Activity className="h-4.5 w-4.5 text-brand-500" strokeWidth={2.2} />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit & Activity Log</h3>
        <span className="ml-auto inline-flex h-5 items-center rounded-full bg-slate-100 px-2 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {entries.length}
        </span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {entries.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-slate-400">No recent activity</p>
        )}
        {entries.map((e) => {
          const { Icon, color, wrap } = iconForDecision(e.decision);
          return (
            <div
              key={e.id}
              className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${wrap}`}>
                <Icon className={`h-4 w-4 ${color}`} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {e.decision}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(e.timestamp)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {e.reason}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{e.mandate_id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
