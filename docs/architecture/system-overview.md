# System Overview

## Amaç

IT Ticket Management sistemi; Incident ve Service Request süreçlerini
kurallı, izlenebilir ve rol bazlı bir ITSM modeli ile yönetmek için tasarlanmıştır.

## Mimari Yaklaşım

- Monorepo:
  - `apps/api` backend
  - `apps/web` frontend
  - `packages/contracts` ortak sözleşmeler
- Katmanlama:
  - Presentation (HTTP/UI)
  - Application (use-case orchestration)
  - Domain (iş kuralları ve invariant)
  - Infrastructure (kalıcılık, storage, entegrasyon adaptörleri)

## Bounded Context (MVP)

- Core:
  - Ticket
  - Priority
  - SLA
- Supporting:
  - Audit
  - Timeline
  - Attachment
  - Notification
  - Reporting
  - Complaint

## Uçtan Uca Akış (MVP)

1. UI/API bir command üretir.
2. Application layer use-case akışını orkestre eder.
3. Domain policy/service doğrulamaları yapılır.
4. Ticket state güncellenir.
5. Audit/Timeline/Notification tetikleri çalışır.
6. API response içinde `allowedActions` ve `slaRiskLevel` döner.

## Phase Boundary

MVP:
- Tek SLA clock
- Transaction içi supporting trigger
- Snapshot + event/audit kaynaklı raporlama

Phase-2:
- Event-driven projection
- Çoklu SLA tipi
- CQRS değerlendirmesi
