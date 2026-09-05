// src/utils/retryEngine.ts

export interface MandateRecord {
  mandate_id: string;
  failure_reason: string;
  attempt_count: number;
  timestamp: string; // ISO format date string
}

export interface RetryDecision {
  status: "Pending Retry" | "Auto-Scheduled" | "Stopped";
  recommended_retry_time: string | null;
  rule_applied: string;
}

export function processRetryLogic(mandate: MandateRecord): RetryDecision {
  const HARD_STOPS = ["User Revoked", "Mandate Expired", "Account Inactive"];
  
  // 1. Enforce the 4-attempt cap
  if (mandate.attempt_count >= 4) {
    return {
      status: "Stopped",
      recommended_retry_time: null,
      rule_applied: "Hard Stop: Max attempts (4) reached."
    };
  }

  // 2. Enforce hard stops for irreversible failures
  if (HARD_STOPS.includes(mandate.failure_reason)) {
    return {
      status: "Stopped",
      recommended_retry_time: null,
      rule_applied: `Hard Stop: ${mandate.failure_reason}`
    };
  }

  // 3. Calculate the base recovery time based on the specific error
  const nextRetry = new Date(mandate.timestamp);
  let ruleMessage = "";

  if (mandate.failure_reason.includes("Timeout") || mandate.failure_reason.includes("Technical Error")) {
    // Technical faults: retry in 6 hours (immediate recovery)
    nextRetry.setHours(nextRetry.getHours() + 6);
    ruleMessage = "Technical failure (T+6 hrs)";
  } 
  else if (mandate.failure_reason.includes("Limit Exceeded")) {
    // Daily limit hit: retry next day morning at 8:00 AM
    nextRetry.setDate(nextRetry.getDate() + 1);
    nextRetry.setHours(8, 0, 0, 0);
    ruleMessage = "Daily limit exceeded (T+24 hrs)";
  } 
  else if (mandate.failure_reason.includes("Insufficient Funds")) {
    // Insufficient balance: Give the customer 3 days to fund the account
    nextRetry.setDate(nextRetry.getDate() + 3);
    nextRetry.setHours(9, 0, 0, 0);
    ruleMessage = "Insufficient funds (T+3 days)";
  } 
  else {
    // Default generic fallback
    nextRetry.setHours(nextRetry.getHours() + 12);
    ruleMessage = "Standard fallback (T+12 hrs)";
  }

  // 4. Peak-Hour Avoidance Algorithm
  // If the calculated time falls into a peak window, push it to the exact minute the window ends.
  const hour = nextRetry.getHours() + (nextRetry.getMinutes() / 60);

  if (hour >= 10 && hour < 13) {
    // Lands in morning peak (10 AM - 1 PM); shift to 1:00 PM
    nextRetry.setHours(13, 0, 0, 0);
    ruleMessage += " -> Shifted out of morning peak";
  } 
  else if (hour >= 17 && hour < 21.5) {
    // Lands in evening peak (5 PM - 9:30 PM); shift to 9:30 PM
    nextRetry.setHours(21, 30, 0, 0);
    ruleMessage += " -> Shifted out of evening peak";
  }

  return {
    status: "Auto-Scheduled",
    recommended_retry_time: nextRetry.toISOString(),
    rule_applied: ruleMessage
  };
}
