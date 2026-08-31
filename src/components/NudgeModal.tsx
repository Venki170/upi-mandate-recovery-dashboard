import { useState } from 'react';
import { X, Copy, Check, Send, MessageSquare, User, Hash, Sparkles, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { MandateWithRetry } from '@/types';
import { formatINR } from '@/lib/format';
import { generateLiveNudge, type LiveNudgeResult } from '@/utils/aiService';

interface NudgeModalProps {
  mandate: MandateWithRetry;
  onClose: () => void;
  onSend: (mandate: MandateWithRetry) => void;
}

export default function NudgeModal({ mandate, onClose, onSend }: NudgeModalProps) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [liveNudge, setLiveNudge] = useState<LiveNudgeResult | null>(null);

  const displayMessage = liveNudge?.nudgeMessage ?? mandate.draft_nudge_message;
  const displayRetryWindow = liveNudge?.retryWindow ?? mandate.retryTimeDisplay;
  const isLive = liveNudge !== null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked; ignore
    }
  };

  const handleDraftLive = async () => {
    setDrafting(true);
    setDraftError(null);
    try {
      const result = await generateLiveNudge(
        mandate.customer_name,
        Number(mandate.amount),
        mandate.failure_reason,
      );
      setLiveNudge(result);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate nudge.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSend = () => {
    setSent(true);
    onSend(mandate);
    setTimeout(onClose, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <MessageSquare className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Customer Nudge Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLive ? 'Live AI-drafted message' : 'AI-drafted message'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Customer
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {mandate.customer_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <Hash className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Mandate ID
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {mandate.mandate_id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 dark:bg-brand-500/10">
            <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Mandate Amount
            </span>
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
              {formatINR(mandate.amount)}
            </span>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Nudge Message
              </p>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" /> Live
                </span>
              )}
            </div>
            <div className="relative max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              {drafting ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  Drafting with AI…
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {displayMessage}
                </p>
              )}
            </div>
          </div>

          {draftError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{draftError}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">Retry window:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {displayRetryWindow}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button
            onClick={handleDraftLive}
            disabled={drafting}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {drafting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Draft Live with AI
              </>
            )}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={sent || drafting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-70"
            >
              {sent ? (
                <>
                  <Check className="h-4 w-4" />
                  Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Nudge
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
