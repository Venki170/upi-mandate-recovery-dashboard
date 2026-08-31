import { useState } from 'react';
import { X, Copy, Check, Send, MessageSquare, User, Hash } from 'lucide-react';
import type { MandateWithRetry } from '@/types';
import { formatINR, formatDate } from '@/lib/format';

interface NudgeModalProps {
  mandate: MandateWithRetry;
  onClose: () => void;
  onSend: (mandate: MandateWithRetry) => void;
}

export default function NudgeModal({ mandate, onClose, onSend }: NudgeModalProps) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mandate.draft_nudge_message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked; ignore
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
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-drafted message</p>
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
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nudge Message
            </p>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {mandate.draft_nudge_message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Retry window:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {mandate.retryTimeDisplay}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
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
            disabled={sent}
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
  );
}
