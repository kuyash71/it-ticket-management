-- ============================================================
-- V1 — Initial schema
-- Tüm tablolar Hibernate JOINED inheritance stratejisi ile
-- oluşturulmuştur. Flyway bu script'i yalnızca temiz kurulumda
-- çalıştırır; mevcut veritabanlarında baseline-on-migrate
-- sayesinde atlanır.
-- ============================================================

-- SLA clock (tickets tablosundan önce oluşturulmalı — FK var)
CREATE TABLE sla_clock (
    id          BIGSERIAL PRIMARY KEY,
    elapsed     BIGINT    NOT NULL DEFAULT 0,
    state       VARCHAR(20) NOT NULL,
    started_at  TIMESTAMPTZ,
    paused_at   TIMESTAMPTZ,
    stopped_at  TIMESTAMPTZ,
    deadline    BIGINT    NOT NULL DEFAULT 0
);

-- Servis talebi onay kaydı (tickets öncesi)
CREATE TABLE service_request_approval (
    id          BIGSERIAL PRIMARY KEY,
    state       VARCHAR(20)  NOT NULL,
    decided_by  VARCHAR(255),
    decided_at  TIMESTAMPTZ,
    reason      VARCHAR(255)
);

-- Temel ticket tablosu (JOINED inheritance — discriminator: TicketType)
CREATE TABLE tickets (
    id                  UUID        PRIMARY KEY,
    "TicketType"        VARCHAR(30) NOT NULL,          -- discriminator
    title               VARCHAR(255) NOT NULL,
    description         TEXT        NOT NULL,
    status              VARCHAR(30) NOT NULL,
    priority            VARCHAR(20) NOT NULL,
    impact              VARCHAR(20) NOT NULL,
    urgency             VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL,
    resolved_at         TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    resolution_note     TEXT,
    resolution_code     VARCHAR(30),
    close_reason        TEXT,
    reporter_id         VARCHAR(255),
    assignee_id         VARCHAR(255),
    sla_level           VARCHAR(20),
    sla_clock_id        BIGINT REFERENCES sla_clock(id),
    version             BIGINT      NOT NULL DEFAULT 0,
    type                VARCHAR(30) NOT NULL,
    process_instance_id VARCHAR(255)
);

-- Incident alt tablosu (ek sütun yok)
CREATE TABLE incident_ticket (
    id UUID PRIMARY KEY REFERENCES tickets(id)
);

-- Servis talebi alt tablosu
CREATE TABLE service_request_ticket (
    id                  UUID    PRIMARY KEY REFERENCES tickets(id),
    request_approval_id BIGINT  REFERENCES service_request_approval(id)
);

-- Ticket olayları (comment, worklog, system_event)
CREATE TABLE ticket_events (
    id          UUID        PRIMARY KEY,
    ticket_id   UUID        NOT NULL REFERENCES tickets(id),
    event_type  VARCHAR(20) NOT NULL,
    visibility  VARCHAR(20) NOT NULL,
    actor_id    VARCHAR(255) NOT NULL,
    body        TEXT,
    payload     TEXT,
    parent_id   UUID,
    occurred_at TIMESTAMPTZ NOT NULL
);

-- Ek dosyalar
CREATE TABLE attachments (
    id          UUID        PRIMARY KEY,
    ticket_id   UUID        NOT NULL REFERENCES tickets(id),
    file_name   VARCHAR(255) NOT NULL,
    mime_type   VARCHAR(127) NOT NULL,
    size_bytes  BIGINT      NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    visibility  VARCHAR(20) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL
);

-- Denetim kayıtları
CREATE TABLE audit_records (
    id          UUID        PRIMARY KEY,
    ticket_id   UUID        NOT NULL REFERENCES tickets(id),
    action      VARCHAR(30) NOT NULL,
    actor_id    VARCHAR(255) NOT NULL,
    reason      VARCHAR(255),
    detail      TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT audit_records_action_check CHECK (
        action IN (
            'TICKET_CREATED','TICKET_UPDATED','STATUS_CHANGED','PRIORITY_CHANGED',
            'SLA_PAUSED','SLA_RESUMED','SLA_BREACH_RISK','SLA_BREACHED',
            'MANAGER_OVERRIDE','ATTACHMENT_ADDED','COMMENT_ADDED','WORKLOG_ADDED',
            'ASSIGNMENT_CHANGED','APPROVAL_CHANGED'
        )
    )
);

-- Giriş yapmış agent/manager önbelleği (Keycloak'tan bağımsız)
CREATE TABLE known_agents (
    username      VARCHAR(255) PRIMARY KEY,
    display_name  VARCHAR(255),
    role          VARCHAR(16)  NOT NULL,
    last_seen_at  TIMESTAMPTZ  NOT NULL
);

-- ── İndeksler ──────────────────────────────────────────────
CREATE INDEX idx_tickets_status        ON tickets(status);
CREATE INDEX idx_tickets_reporter      ON tickets(reporter_id);
CREATE INDEX idx_tickets_assignee      ON tickets(assignee_id);
CREATE INDEX idx_ticket_events_ticket  ON ticket_events(ticket_id);
CREATE INDEX idx_attachments_ticket    ON attachments(ticket_id);
CREATE INDEX idx_audit_records_ticket  ON audit_records(ticket_id);
