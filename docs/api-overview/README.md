# API Overview

Bu doküman, MVP API yüzeyini ve davranış sözleşmelerini özetler.

Detay kontrat: `infra/openapi/openapi.yaml`

## Base URL

- Local: `http://localhost:3000`

## Endpoint Grupları

### Health

- `GET /health`

### Ticket

- `GET /tickets`
- `POST /tickets`
- `GET /tickets/:ticketId`
- `POST /tickets/:ticketId/status`
- `POST /tickets/:ticketId/priority`
- `POST /tickets/:ticketId/reassign`
- `POST /tickets/:ticketId/override`
- `GET /tickets/:ticketId/allowed-actions?role=...`

### Reporting

- `GET /reporting/summary`

### Complaint

- `POST /complaints`

### Supporting (MVP skeleton)

- `GET /audit`
- `GET /timeline/:ticketId`
- `POST /attachments`
- `GET /notifications/rules`

## Ticket Response Özet Alanları

- `status`
- `priority`
- `urgency`
- `impact`
- `approvalState`
- `slaRiskLevel`
- `allowedActions`
- `version`

## Durum Kodları

- `200 OK`
- `201 Created`
- `400 Bad Request`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `500 Internal Server Error`

## Kritik Kurallar

- Geçersiz transition `409` döner.
- Yetkisiz aksiyon `403` döner.
- Manager override için reason zorunludur.
- Service Request approval `PENDING` ise `RESOLVED` reddedilir.

## Örnek: Status Güncelleme

Request:

```json
{
  "actorId": "agent-1",
  "actorRole": "AGENT",
  "nextStatus": "RESOLVED",
  "reason": "Issue fixed and validated"
}
```

Olası hata:

```json
{
  "errorCode": "APPROVAL_REQUIRED",
  "message": "Service request approval must be completed before RESOLVED"
}
```
