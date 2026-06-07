-- ============================================================
-- V4 — Doc §4.2 Abandoned-Case Flow + Mail bilgileri
-- ============================================================

-- 1) Ticket'a reminder ve abandoned bookkeeping kolonları
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reminder_sent_at      TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS abandoned_flagged_at  TIMESTAMPTZ;

-- 2) Customer mail göndermek için known_agents.email
ALTER TABLE known_agents ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 3) Audit CHECK'ine yeni iki action ekle (AUTO_REMINDER_SENT, AUTO_TIMEOUT_FLAGGED)
ALTER TABLE audit_records DROP CONSTRAINT IF EXISTS audit_records_action_check;
ALTER TABLE audit_records ADD CONSTRAINT audit_records_action_check CHECK (
    action IN (
        'TICKET_CREATED','TICKET_UPDATED','STATUS_CHANGED','PRIORITY_CHANGED',
        'SLA_PAUSED','SLA_RESUMED','SLA_BREACH_RISK','SLA_BREACHED',
        'MANAGER_OVERRIDE','ATTACHMENT_ADDED','COMMENT_ADDED','WORKLOG_ADDED',
        'ASSIGNMENT_CHANGED','APPROVAL_CHANGED',
        'SERVICE_QUALITY_COMPLAINT','CUSTOMER_FEEDBACK',
        'AUTO_REMINDER_SENT','AUTO_TIMEOUT_FLAGGED'
    )
);

-- 4) Index: scheduler 'WAITING_FOR_CUSTOMER + abandoned_flagged_at IS NULL' filtresi yapacak.
CREATE INDEX IF NOT EXISTS idx_tickets_abandoned_scan
    ON tickets(status) WHERE status = 'WAITING_FOR_CUSTOMER';
