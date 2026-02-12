# Failure Modes and API Contract

## Hata Modları

- Illegal status transition -> `409 Conflict`
- Unauthorized action -> `403 Forbidden`
- Ticket not found -> `404 Not Found`
- Invalid payload -> `400 Bad Request`
- Concurrency conflict -> `409 Conflict`

## Standart Hata Cevabı

```json
{
  "errorCode": "INVALID_STATUS_TRANSITION",
  "message": "Ticket cannot transition from CLOSED to IN_PROGRESS"
}
```

## API Davranış İlkeleri

- Doğrulama hataları normalize edilir.
- Endpointler OpenAPI ile hizalı olmalıdır.
- Role bazlı aksiyonlar `allowedActions` ile döndürülür.

## Referans

- `infra/openapi/openapi.yaml`
- `apps/api/src/modules/tickets/presentation/http/tickets.routes.ts`
