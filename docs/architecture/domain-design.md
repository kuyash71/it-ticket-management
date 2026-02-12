# Domain Design

## Aggregate Root

### Ticket

Sorumluluklar:
- Status geçişlerinin geçerliliği
- Priority state tutarlılığı
- SLA clock state tutarlılığı
- Approval kapısı (Service Request için)
- Assignment ve role-kuralı uyumu

## Child Entity Sınırı

`SLAClock` ve `ServiceRequestApproval`, `Ticket` aggregate içinde child entity olarak konumlandırılmıştır.

Kural:
- Child entity'ler aggregate dışından doğrudan kullanılmaz.
- Dış katmanlar child entity state'ine yalnız aggregate getter/metodları üzerinden erişir.
- State değişimleri sadece `Ticket` aggregate davranışları ile yapılır.

## Alt Türler

- `INCIDENT`
  - SLA zorunlu
  - escalation takibi öncelikli
- `SERVICE_REQUEST`
  - SLA opsiyonel
  - approval adımı opsiyonel

## Invariant Seti

- Geçersiz status transition reddedilir.
- Service Request approval `PENDING` ise `RESOLVED` geçişi reddedilir.
- Manager override için reason zorunludur.
- Priority değişimi audit kaydı üretmelidir.

## Domain Service Ayrımı

### Priority Matrix Service

`Priority = f(Urgency, Impact)`

| Impact \ Urgency | Low | Medium | High |
|---|---|---|---|
| Low | LOW | LOW | MEDIUM |
| Medium | LOW | MEDIUM | HIGH |
| High | MEDIUM | HIGH | CRITICAL |

### SLA Escalation Service

- `<70%`: NORMAL
- `>=70%`: WARNING
- `>=85%`: RISK
- `>=100%`: BREACH

## Kod Referansları

- `apps/api/src/modules/tickets/domain/models/ticket.ts`
- `apps/api/src/modules/tickets/domain/policies/status-transition.policy.ts`
- `apps/api/src/modules/tickets/domain/policies/allowed-actions.policy.ts`
- `apps/api/src/modules/tickets/domain/services/priority-matrix.service.ts`
- `apps/api/src/modules/tickets/domain/services/sla-escalation.service.ts`
