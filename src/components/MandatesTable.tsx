import { useState } from 'react';
import {
  Search,
  RefreshCw,
  Send,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import type { MandateWithRetry, StatusFilter } from '@/types';
import { formatINR, formatDate } from '@/lib/format';
import StatusBadge from './StatusBadge';

interface MandatesTableProps {
  mandates: MandateWithRetry[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  onSendNudge: (m: MandateWithRetry) => void;
  onTriggerRetry: (m: MandateWithRetry) => void;
  retryingId: string | null;
}

const FILTERS: StatusFilter[] = ['All', 'Pending Retry', 'Auto-Scheduled', 'Stopped'];

export default function MandatesTable({
  mandates,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onSendNudge,
  onTriggerRetry,
  retryingId,
}: MandatesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer or mandate ID…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onStatusFilterChange(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3 font-semibold">Mandate</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">Attempts</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {mandates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  No mandates match your filters.
                </td>
              </tr>
            )}
            {mandates.map((m) => {
              const isExpanded = expandedId === m.id;
              const isRetrying = retryingId === m.id;
              const isStopped = m.effectiveStatus === 'Stopped';
              const isProcessing = m.effectiveStatus === 'Processing';
              return (
                <>
                  <tr
                    key={m.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => toggle(m.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {m.mandate_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {m.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {formatINR(m.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(m.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {m.attempt_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.effectiveStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendNudge(m);
                          }}
                          disabled={isStopped || isProcessing}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                          title={isStopped ? 'Cannot nudge a stopped mandate' : 'Send customer nudge'}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Nudge
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerRetry(m);
                          }}
                          disabled={isStopped || isProcessing || isRetrying}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            isStopped
                              ? 'Cannot retry a stopped mandate'
                              : isProcessing
                                ? 'Retry already in progress'
                                : 'Trigger manual retry'
                          }
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${m.id}-detail`} className="bg-slate-50/60 dark:bg-slate-800/30">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Failure Reason
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  {m.failure_reason}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Recommended Retry Time
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  {m.retryTimeDisplay}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                              </span>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Rule Applied
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  {m.ruleApplied}
                                </p>
                              </div>
                            </div>
                            {m.last_retry_at && (
                              <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Last Retry
                                  </p>
                                  <p className="text-sm text-slate-700 dark:text-slate-200">
                                    {formatDate(m.last_retry_at)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              AI-Drafted Nudge Message
                            </p>
                            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                {m.draft_nudge_message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
