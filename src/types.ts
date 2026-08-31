export type MandateStatus =
  | 'Pending Retry'
  | 'Auto-Scheduled'
  | 'Processing'
  | 'Recovered'
  | 'Stopped';

export interface Mandate {
  id: string;
  mandate_id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  failure_reason: string;
  attempt_count: number;
  status: MandateStatus;
  recovered: boolean;
  recommended_retry_window: string;
  draft_nudge_message: string;
  last_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MandateWithRetry extends Mandate {
  effectiveStatus: MandateStatus;
  retryTimeDisplay: string;
  ruleApplied: string;
}

export interface AuditEntry {
  id: string;
  mandate_id: string | null;
  customer_name: string | null;
  action: string;
  status: string | null;
  detail: string;
  amount: number | null;
  success: boolean | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  mandate_id: string;
  decision: string;
  reason: string;
  timestamp: string;
}

export type StatusFilter = 'All' | MandateStatus;
