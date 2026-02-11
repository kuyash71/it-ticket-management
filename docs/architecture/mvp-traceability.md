# MVP Traceability Map

This file maps report expectations to scaffolded code locations.

| Requirement | Source | Skeleton Location |
|---|---|---|
| Incident vs Service Request separation | Analysis Section 5, Design Section 2 | `packages/contracts/src/enums.ts`, `apps/api/src/modules/tickets/domain/models/ticket.ts` |
| Ticket lifecycle controls | Analysis Section 5.4, Design Section 4 | `apps/api/src/modules/tickets/domain/policies/status-transition.policy.ts` |
| Priority matrix (Urgency x Impact) | Analysis Section 6, Design Section 3 | `apps/api/src/modules/tickets/domain/services/priority-matrix.service.ts` |
| Service Request approval gate | Design Section 2.4 | `apps/api/src/modules/tickets/application/use-cases/change-status.use-case.ts`, `apps/api/src/modules/tickets/domain/models/service-request-approval.ts` |
| SLA clock and escalation thresholds | Analysis Section 6, Design Section 5 | `apps/api/src/modules/tickets/domain/services/sla-escalation.service.ts` |
| RBAC (Customer/Agent/Manager) | Analysis Section 8, Design Section 9 | `apps/api/src/modules/auth/application/rbac-policy.ts`, `apps/api/src/modules/tickets/domain/policies/allowed-actions.policy.ts` |
| Audit and timeline visibility | Analysis Section 7 and 11, Design Sections 6 and 10 | `apps/api/src/modules/audit`, `apps/api/src/modules/timeline` |
| Attachment controls and visibility | Analysis Section 9, Design Section 7 | `apps/api/src/modules/attachments` |
| Allowed actions in API contract | Design Section 11 | `packages/contracts/src/dto/ticket-response.dto.ts` |
| Service quality complaint path | Analysis Section 7.8 | `apps/api/src/modules/complaints` |
| Reporting baseline | Analysis Section 4.4, Design Section 12 | `apps/api/src/modules/reporting`, `infra/db/schema.sql` |
