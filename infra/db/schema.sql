CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(64) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  urgency VARCHAR(32) NOT NULL,
  impact VARCHAR(32) NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id),
  assignee_id UUID REFERENCES users(id),
  sla_clock_state VARCHAR(32) NOT NULL,
  approval_state VARCHAR(32) NOT NULL DEFAULT 'NOT_REQUIRED',
  sla_elapsed_seconds INT NOT NULL DEFAULT 0,
  sla_started_at TIMESTAMPTZ,
  sla_paused_at TIMESTAMPTZ,
  sla_stopped_at TIMESTAMPTZ,
  last_status_reason TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  event_type VARCHAR(64) NOT NULL,
  visibility VARCHAR(32) NOT NULL,
  actor_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_records (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  actor_id UUID,
  action VARCHAR(128) NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  visibility VARCHAR(32) NOT NULL,
  uploader_id UUID REFERENCES users(id),
  storage_key VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS service_quality_complaints (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  manager_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets (status, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_ticket ON timeline_events (ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ticket ON audit_records (ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments (ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON service_quality_complaints (status);
