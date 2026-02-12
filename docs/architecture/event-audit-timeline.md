# Event, Audit, Timeline, Notification

## Event Catalog (MVP)

- TicketCreated
- TicketUpdated
- StatusChanged
- PriorityChanged
- SLAPaused
- SLAResumed
- SLABreachRisk
- SLABreached
- ManagerOverride
- AttachmentAdded

## Event Tüketim İlkesi

Her kritik event aşağıdakilerle ilişkilidir:
- Audit record
- Timeline event
- (Koşullu) notification

## Timeline Görünürlük

- CUSTOMER: sadece external içerik
- AGENT/MANAGER: internal + external

## Security Olayları

Yetki ihlali veya security olayları customer timeline'a yansıtılmaz,
yalnız audit katmanında tutulur.

## Notification Stratejisi

- Her zaman:
  - SLABreachRisk
  - SLABreached
- Koşullu:
  - TicketCreated
  - StatusChanged
  - AttachmentAdded

## Kod Referansları

- `packages/contracts/src/events.ts`
- `apps/api/src/modules/audit`
- `apps/api/src/modules/timeline`
- `apps/api/src/modules/notifications`
