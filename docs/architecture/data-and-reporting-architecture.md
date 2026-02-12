# Data and Reporting Architecture

## MVP Veri Yaklaşımı

Raporlama, full event-sourcing yerine aşağıdaki kaynaklardan üretilir:
- Ticket snapshot alanları
- Audit/Event kayıtları

## Ana Tablolar

- `tickets`
- `timeline_events`
- `audit_records`
- `attachments`
- `service_quality_complaints`

Kaynak: `infra/db/schema.sql`

## Metrik Seti (MVP)

- SLA compliance
- Ortalama çözüm süresi
- Escalation sayısı
- Agent iş yükü

## Reporting Endpoint

- `GET /reporting/summary`

## Phase-2 Yönü

Aşağıdaki eşiklerde projection/read-model önerilir:
- Yoğun raporlama yükü
- Near real-time raporlama ihtiyacı
- Event-temelli trend/funnel analiz gereksinimi
