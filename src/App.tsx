import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Clock,
  Ban,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Mandate, AuditEntry, StatusFilter, MandateStatus } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/lib/format';
import Header from '@/components/Header';
import KpiCard from '@/components/KpiCard';
import MandatesTable from '@/components/MandatesTable';
import AuditLog from '@/components/AuditLog';
import NudgeModal from '@/components/NudgeModal';
import Toast, { type ToastData } from '@/components/Toast';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [nudgeTarget, setNudgeTarget] = useState<Mandate | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((t: Omit<ToastData, 'id'>) => {
    setToasts((cur) => [...cur, { ...t, id: crypto.randomUUID() }]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [mRes, aRes] = await Promise.all([
      supabase.from('mandates').select('*').order('due_date', { ascending: false }),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (mRes.data) setMandates(mRes.data as Mandate[]);
    if (aRes.data) setAuditLog(aRes.data as AuditEntry[]);
    if (mRes.error) addToast({ type: 'error', title: 'Failed to load mandates', message: mRes.error.message });
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insertAudit = useCallback(
    async (entry: Omit<AuditEntry, 'id' | 'created_at'>) => {
      const { data } = await supabase
        .from('audit_log')
        .insert(entry)
        .select('*')
        .maybeSingle();
      if (data) {
        setAuditLog((cur) => [data as AuditEntry, ...cur].slice(0, 50));
      }
    },
    [],
  );

  const filteredMandates = useMemo(() => {
    return mandates.filter((m) => {
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !m.customer_name.toLowerCase().includes(q) &&
          !m.mandate_id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [mandates, statusFilter, search]);

  const kpis = useMemo(() => {
    const failed = mandates.filter((m) => !m.recovered);
    const recovered = mandates.filter((m) => m.recovered);
    const pending = mandates.filter(
      (m) => m.status === 'Pending Retry' || m.status === 'Auto-Scheduled',
    );
    const hardStops = mandates.filter((m) => m.status === 'Stopped');
    return {
      failedAmount: failed.reduce((s, m) => s + Number(m.amount), 0),
      recoveredAmount: recovered.reduce((s, m) => s + Number(m.amount), 0),
      pendingCount: pending.length,
      hardStopCount: hardStops.length,
    };
  }, [mandates]);

  const handleSendNudge = useCallback(
    async (mandate: Mandate) => {
      addToast({
        type: 'success',
        title: 'Nudge sent',
        message: `Message sent to ${mandate.customer_name} (${mandate.mandate_id}).`,
      });
      await insertAudit({
        mandate_id: mandate.mandate_id,
        customer_name: mandate.customer_name,
        action: 'Nudge Sent',
        status: mandate.status,
        detail: `AI-drafted nudge sent to ${mandate.customer_name} for ${formatINR(Number(mandate.amount))}.`,
        amount: Number(mandate.amount),
        success: true,
      });
    },
    [addToast, insertAudit],
  );

  const handleTriggerRetry = useCallback(
    async (mandate: Mandate) => {
      setRetryingId(mandate.id);
      // Optimistically set status to Processing
      setMandates((cur) =>
        cur.map((m) =>
          m.id === mandate.id ? { ...m, status: 'Processing' as MandateStatus } : m,
        ),
      );
      await insertAudit({
        mandate_id: mandate.mandate_id,
        customer_name: mandate.customer_name,
        action: 'Manual Retry',
        status: 'Processing',
        detail: `Manual retry triggered for ${mandate.customer_name} (${mandate.mandate_id}). Debit attempt in progress.`,
        amount: Number(mandate.amount),
        success: true,
      });

      // Simulate async processing
      setTimeout(async () => {
        const success = Math.random() > 0.4; // 60% success rate
        const newStatus: MandateStatus = success ? 'Recovered' : 'Pending Retry';
        const newAttempt = mandate.attempt_count + 1;

        const { error } = await supabase
          .from('mandates')
          .update({
            status: newStatus,
            recovered: success,
            attempt_count: newAttempt,
            last_retry_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', mandate.id);

        if (!error) {
          setMandates((cur) =>
            cur.map((m) =>
              m.id === mandate.id
                ? {
                    ...m,
                    status: newStatus,
                    recovered: success,
                    attempt_count: newAttempt,
                    last_retry_at: new Date().toISOString(),
                  }
                : m,
            ),
          );
        }

        await insertAudit({
          mandate_id: mandate.mandate_id,
          customer_name: mandate.customer_name,
          action: success ? 'Recovery Success' : 'Recovery Failure',
          status: newStatus,
          detail: success
            ? `Retry #${newAttempt} succeeded. ${formatINR(Number(mandate.amount))} recovered from ${mandate.customer_name}.`
            : `Retry #${newAttempt} failed for ${mandate.customer_name}. Mandate moved back to Pending Retry.`,
          amount: Number(mandate.amount),
          success,
        });

        addToast({
          type: success ? 'success' : 'error',
          title: success ? 'Recovery successful' : 'Retry failed',
          message: success
            ? `${formatINR(Number(mandate.amount))} recovered from ${mandate.customer_name}.`
            : `Retry for ${mandate.customer_name} failed. Will be retried again.`,
        });
        setRetryingId(null);
      }, 1800);
    },
    [addToast, insertAudit],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Failed Amount"
            value={formatINR(kpis.failedAmount)}
            sublabel={`${mandates.filter((m) => !m.recovered).length} active mandates`}
            icon={Wallet}
            accent="rose"
          />
          <KpiCard
            label="Total Recovered"
            value={formatINR(kpis.recoveredAmount)}
            sublabel={`${mandates.filter((m) => m.recovered).length} recovered`}
            icon={CheckCircle2}
            accent="emerald"
          />
          <KpiCard
            label="Retries Pending"
            value={String(kpis.pendingCount)}
            sublabel="Awaiting auto / manual retry"
            icon={Clock}
            accent="brand"
          />
          <KpiCard
            label="Hard Stops"
            value={String(kpis.hardStopCount)}
            sublabel="Revoked or expired mandates"
            icon={Ban}
            accent="slate"
          />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : (
              <MandatesTable
                mandates={filteredMandates}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                search={search}
                onSearchChange={setSearch}
                onSendNudge={setNudgeTarget}
                onTriggerRetry={handleTriggerRetry}
                retryingId={retryingId}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
              <AuditLog entries={auditLog} />
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p>
            Retry outcomes are simulated for demonstration. Nudge messages are AI-drafted and
            should be reviewed before sending to customers.
          </p>
        </div>
      </main>

      {/* Nudge modal */}
      {nudgeTarget && (
        <NudgeModal
          mandate={nudgeTarget}
          onClose={() => setNudgeTarget(null)}
          onSend={handleSendNudge}
        />
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={closeToast} />
        ))}
      </div>
    </div>
  );
}
