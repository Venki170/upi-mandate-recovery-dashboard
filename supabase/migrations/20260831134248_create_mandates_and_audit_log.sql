/*
# Create UPI Mandate Recovery tables (single-tenant, no auth)

1. New Tables
- `mandates`: stores failed UPI mandates with recovery metadata.
  - `id` (uuid, primary key)
  - `mandate_id` (text, unique business identifier, e.g. UPI mandate ref)
  - `customer_name` (text)
  - `amount` (numeric, the mandate amount in INR)
  - `due_date` (date, when the mandate is due)
  - `failure_reason` (text, why the mandate failed)
  - `attempt_count` (int, number of retry attempts so far)
  - `status` (text, one of: 'Pending Retry', 'Auto-Scheduled', 'Processing', 'Recovered', 'Stopped')
  - `recovered` (boolean, whether this mandate has been recovered)
  - `recommended_retry_window` (text, AI-suggested retry window)
  - `draft_nudge_message` (text, AI-drafted customer nudge message)
  - `last_retry_at` (timestamptz, nullable, timestamp of last retry attempt)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- `audit_log`: append-only log of retry attempts and system notifications.
  - `id` (uuid, primary key)
  - `mandate_id` (text, the mandate reference this entry relates to; nullable for system-wide events)
  - `customer_name` (text, denormalized for display)
  - `action` (text, e.g. 'Manual Retry', 'Nudge Sent', 'Auto-Scheduled', 'Recovery Success', 'Recovery Failure', 'Hard Stop')
  - `status` (text, the resulting mandate status)
  - `detail` (text, human-readable detail message)
  - `amount` (numeric, nullable, the amount involved)
  - `success` (boolean, nullable, whether the action succeeded)
  - `created_at` (timestamptz)

2. Indexes
- `mandates_status_idx` on `mandates(status)` for status filtering.
- `mandates_mandate_id_idx` on `mandates(mandate_id)` for search.
- `audit_log_created_at_idx` on `audit_log(created_at DESC)` for recent-activity queries.

3. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD because this is a single-tenant shared dashboard (no sign-in).

4. Notes
- `recovered` is a denormalized flag derived from status = 'Recovered' to make KPI math simple.
- `updated_at` is maintained by the application on every change; a trigger is intentionally omitted to keep it simple.
*/

CREATE TABLE IF NOT EXISTS mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  failure_reason text NOT NULL DEFAULT '',
  attempt_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending Retry',
  recovered boolean NOT NULL DEFAULT false,
  recommended_retry_window text NOT NULL DEFAULT '',
  draft_nudge_message text NOT NULL DEFAULT '',
  last_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mandates" ON mandates;
CREATE POLICY "anon_select_mandates" ON mandates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_mandates" ON mandates;
CREATE POLICY "anon_insert_mandates" ON mandates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_mandates" ON mandates;
CREATE POLICY "anon_update_mandates" ON mandates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_mandates" ON mandates;
CREATE POLICY "anon_delete_mandates" ON mandates FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS mandates_status_idx ON mandates(status);
CREATE INDEX IF NOT EXISTS mandates_mandate_id_idx ON mandates(mandate_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id text,
  customer_name text,
  action text NOT NULL,
  status text,
  detail text NOT NULL DEFAULT '',
  amount numeric(12,2),
  success boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_log" ON audit_log;
CREATE POLICY "anon_select_audit_log" ON audit_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_log" ON audit_log;
CREATE POLICY "anon_insert_audit_log" ON audit_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audit_log" ON audit_log;
CREATE POLICY "anon_update_audit_log" ON audit_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit_log" ON audit_log;
CREATE POLICY "anon_delete_audit_log" ON audit_log FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);
