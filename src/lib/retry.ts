import { processRetryLogic, type RetryDecision } from '@/utils/retryEngine';
import type { Mandate, MandateStatus } from '@/types';
import { formatDateTime } from '@/lib/format';

const FAILURE_REASON_MAP: { match: string; normalized: string }[] = [
  { match: 'insufficient balance', normalized: 'Insufficient Funds' },
  { match: 'insufficient funds', normalized: 'Insufficient Funds' },
  { match: 'revoked', normalized: 'User Revoked' },
  { match: 'expired', normalized: 'Mandate Expired' },
  { match: 'inactive', normalized: 'Account Inactive' },
  { match: 'timeout', normalized: 'Timeout' },
  { match: 'technical error', normalized: 'Technical Error' },
  { match: 'limit exceeded', normalized: 'Limit Exceeded' },
  { match: 'validation failed', normalized: 'Technical Error' },
];

export function normalizeFailureReason(reason: string): string {
  const lower = reason.toLowerCase();
  for (const { match, normalized } of FAILURE_REASON_MAP) {
    if (lower.includes(match)) return normalized;
  }
  return reason;
}

function getTimestamp(mandate: Mandate): string {
  return mandate.last_retry_at || mandate.due_date || mandate.created_at;
}

export function getRetryDecision(mandate: Mandate): RetryDecision {
  return processRetryLogic({
    mandate_id: mandate.mandate_id,
    failure_reason: normalizeFailureReason(mandate.failure_reason),
    attempt_count: mandate.attempt_count,
    timestamp: getTimestamp(mandate),
  });
}

export function getRetryDecisionForAttempt(
  mandate: Mandate,
  attemptCount: number,
): RetryDecision {
  return processRetryLogic({
    mandate_id: mandate.mandate_id,
    failure_reason: normalizeFailureReason(mandate.failure_reason),
    attempt_count: attemptCount,
    timestamp: new Date().toISOString(),
  });
}

export function getEffectiveStatus(mandate: Mandate): MandateStatus {
  if (mandate.status === 'Recovered' || mandate.status === 'Processing') {
    return mandate.status;
  }
  const decision = getRetryDecision(mandate);
  if (decision.status === 'Stopped') return 'Stopped';
  if (decision.recommended_retry_time) {
    const retryTime = new Date(decision.recommended_retry_time).getTime();
    if (retryTime <= Date.now()) return 'Pending Retry';
  }
  return 'Auto-Scheduled';
}

export function getRetryTimeDisplay(mandate: Mandate): string {
  const decision = getRetryDecision(mandate);
  if (decision.recommended_retry_time) {
    return `${formatDateTime(decision.recommended_retry_time)} IST`;
  }
  return 'Not scheduled';
}

export function getRuleApplied(mandate: Mandate): string {
  return getRetryDecision(mandate).rule_applied;
}
