# RBAC and Authorization

## Roller

- `CUSTOMER`
- `AGENT`
- `MANAGER`

## Yetki İlkesi

Yetkiler kişilere değil role atanır.

## Role Bazlı Aksiyonlar (MVP)

- CUSTOMER:
  - `ADD_COMMENT`
  - `ADD_ATTACHMENT`
  - `CONFIRM_CLOSE`
  - `REOPEN_REQUEST`
- AGENT:
  - `TAKE_OWNERSHIP`
  - `REQUEST_INFO`
  - `ADD_WORKLOG`
  - `ADD_ATTACHMENT`
  - `RESOLVE`
- MANAGER:
  - `OVERRIDE_STATUS`
  - `REASSIGN`
  - `CHANGE_PRIORITY`

## API Davranışı

- Yetkisiz işlem: `403 Forbidden`
- UI aksiyonları `allowedActions` üzerinden çizilir.

## Manager Müdahalesi

- İstisna kabul edilir.
- `reason` zorunlu.
- Audit kaydı zorunlu.

## Kod Referansları

- `apps/api/src/modules/auth/application/rbac-policy.ts`
- `apps/api/src/modules/tickets/domain/policies/allowed-actions.policy.ts`
- `apps/api/src/modules/tickets/presentation/http/tickets.routes.ts`
