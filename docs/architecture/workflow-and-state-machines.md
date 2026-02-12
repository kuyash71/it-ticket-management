# Workflow and State Machines

## Ticket Lifecycle

Temel akış:

`NEW -> IN_PROGRESS -> WAITING_FOR_CUSTOMER -> IN_PROGRESS -> RESOLVED -> CLOSED`

## Geçiş Kuralları

- Agent:
  - `NEW -> IN_PROGRESS`
  - `NEW -> WAITING_FOR_CUSTOMER`
  - `IN_PROGRESS -> WAITING_FOR_CUSTOMER`
  - `IN_PROGRESS -> RESOLVED`
  - `WAITING_FOR_CUSTOMER -> IN_PROGRESS`
  - `RESOLVED -> CLOSED`
- Customer:
  - `RESOLVED -> IN_PROGRESS` (reopen request)
- Manager:
  - Override ile istisnai geçiş (reason zorunlu)

## Reopen Senaryosu

- Sadece `RESOLVED` durumunda tetiklenir.
- Ticket `IN_PROGRESS` durumuna döner.
- SLA clock `STOPPED` ise yeniden `RUNNING` olur.

## Service Request Approval Kapısı

- `requiresApproval=true` ise başlangıç state: `PENDING`
- `approvalState=PENDING` iken `RESOLVED` yasak
- `APPROVED` sonrası çözüm tamamlanabilir

## SLA Clock State Machine

- TicketCreated: `START`
- WAITING_FOR_CUSTOMER: `PAUSED`
- IN_PROGRESS: `RUNNING`
- RESOLVED: `STOPPED`

## Kod Referansları

- `apps/api/src/modules/tickets/application/use-cases/create-ticket.use-case.ts`
- `apps/api/src/modules/tickets/application/use-cases/change-status.use-case.ts`
- `apps/api/src/modules/tickets/application/use-cases/reopen-ticket.use-case.ts`
- `apps/api/src/modules/tickets/application/use-cases/manager-override.use-case.ts`
