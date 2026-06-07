-- ============================================================
-- V3 — Service Quality Complaint + Customer Feedback
-- Doc §7.8, §4.4.6
-- ============================================================

-- 1) Audit CHECK'ine yeni iki action eklendi (SERVICE_QUALITY_COMPLAINT, CUSTOMER_FEEDBACK)
ALTER TABLE audit_records DROP CONSTRAINT IF EXISTS audit_records_action_check;
ALTER TABLE audit_records ADD CONSTRAINT audit_records_action_check CHECK (
    action IN (
        'TICKET_CREATED','TICKET_UPDATED','STATUS_CHANGED','PRIORITY_CHANGED',
        'SLA_PAUSED','SLA_RESUMED','SLA_BREACH_RISK','SLA_BREACHED',
        'MANAGER_OVERRIDE','ATTACHMENT_ADDED','COMMENT_ADDED','WORKLOG_ADDED',
        'ASSIGNMENT_CHANGED','APPROVAL_CHANGED',
        'SERVICE_QUALITY_COMPLAINT','CUSTOMER_FEEDBACK'
    )
);

-- 2) Feedback tablosu (Doc §4.4.6) — kapanan ticket için müşteri 1-5 yıldız + yorum verir.
CREATE TABLE IF NOT EXISTS ticket_feedback (
    id              UUID         PRIMARY KEY,
    ticket_id       UUID         NOT NULL UNIQUE REFERENCES tickets(id),
    customer_id     VARCHAR(255) NOT NULL,
    agent_id        VARCHAR(255),
    rating          SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    submitted_at    TIMESTAMPTZ  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticket_feedback_agent ON ticket_feedback(agent_id);
