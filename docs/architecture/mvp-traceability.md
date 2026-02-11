# MVP Traceability Map

Bu dosya, analiz ve tasarım beklentilerinin kod tabanındaki izini sürmek için kullanılır.

Durum anahtarları:
- `Done`: Uygulama iskeleti ve temel doğrulama mevcut
- `In Progress`: Kısmi uygulama var, sprint kapsamında tamamlanacak
- `Planned`: Henüz uygulanmadı, checklist sprintinde ele alınacak

| Gereksinim | Kaynak | Kod Lokasyonu | Durum | İlgili Sprint |
|---|---|---|---|---|
| Incident vs Service Request ayrımı | Analiz Bölüm 5, Tasarım Bölüm 2 | `packages/contracts/src/enums.ts`, `apps/api/src/modules/tickets/domain/models/ticket.ts` | Done | Sprint 1 |
| Ticket lifecycle kontrolü | Analiz Bölüm 5.4, Tasarım Bölüm 4 | `apps/api/src/modules/tickets/domain/policies/status-transition.policy.ts` | Done | Sprint 2 |
| Priority matrisi (Urgency x Impact) | Analiz Bölüm 6, Tasarım Bölüm 3 | `apps/api/src/modules/tickets/domain/services/priority-matrix.service.ts` | Done | Sprint 1 |
| Service Request approval kapısı | Tasarım Bölüm 2.4 | `apps/api/src/modules/tickets/application/use-cases/change-status.use-case.ts`, `apps/api/src/modules/tickets/domain/models/service-request-approval.ts` | In Progress | Sprint 7 |
| SLA clock ve escalation eşikleri | Analiz Bölüm 6, Tasarım Bölüm 5 | `apps/api/src/modules/tickets/domain/services/sla-escalation.service.ts` | In Progress | Sprint 4 |
| RBAC (Customer/Agent/Manager) | Analiz Bölüm 8, Tasarım Bölüm 9 | `apps/api/src/modules/auth/application/rbac-policy.ts`, `apps/api/src/modules/tickets/domain/policies/allowed-actions.policy.ts` | In Progress | Sprint 3 |
| Audit + timeline görünürlük kuralları | Analiz Bölüm 7 ve 11, Tasarım Bölüm 6 ve 10 | `apps/api/src/modules/audit`, `apps/api/src/modules/timeline` | Planned | Sprint 5 |
| Attachment kuralları ve görünürlük | Analiz Bölüm 9, Tasarım Bölüm 7 | `apps/api/src/modules/attachments` | In Progress | Sprint 6 |
| allowedActions API kontratı | Tasarım Bölüm 11 | `packages/contracts/src/dto/ticket-response.dto.ts`, `apps/api/src/modules/tickets/presentation/http/tickets.routes.ts` | Done | Sprint 10 |
| Service quality complaint akışı | Analiz Bölüm 7.8 | `apps/api/src/modules/complaints` | In Progress | Sprint 7 |
| Reporting metrik tabanı | Analiz Bölüm 4.4, Tasarım Bölüm 12 | `apps/api/src/modules/reporting`, `infra/db/schema.sql` | Planned | Sprint 8 |

## Güncelleme Kuralı

Bu tablo aşağıdaki değişikliklerde güncellenmelidir:
- Yeni domain kuralı veya endpoint eklendiğinde
- Gereksinim durumu `Planned -> In Progress -> Done` değiştiğinde
- İlgili sprint planı `docs/checklist.md` içinde revize edildiğinde
