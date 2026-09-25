CREATE TABLE IF NOT EXISTS helio_missions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thesis TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL,
  horizon_year INTEGER NOT NULL,
  confidence INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  forecast JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_seal TEXT NOT NULL,
  seal TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS helio_missions_updated_idx ON helio_missions (updated_at DESC);
CREATE INDEX IF NOT EXISTS helio_missions_active_idx ON helio_missions (status, deleted_at);

CREATE TABLE IF NOT EXISTS helio_audit_events (
  sequence BIGSERIAL UNIQUE NOT NULL,
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  action TEXT NOT NULL,
  event_data JSONB NOT NULL,
  prev_seal TEXT NOT NULL,
  seal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS helio_audit_mission_idx ON helio_audit_events (mission_id, sequence ASC);
CREATE INDEX IF NOT EXISTS helio_audit_seal_idx ON helio_audit_events (sequence DESC);
