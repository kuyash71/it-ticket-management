# API Overview

## Base URL

- Local: `http://localhost:8080`

## Authentication

API, Keycloak tarafından üretilen Bearer JWT token bekler.

- Header: `Authorization: Bearer <access_token>`

## Endpointler

### Tickets

- `GET /api/tickets`
  - Tüm ticketları döner.
- `POST /api/tickets`
  - Yeni ticket oluşturur.

Örnek request:

```json
{
  "type": "INCIDENT",
  "title": "VPN erişim problemi",
  "description": "Kullanıcı VPN'e bağlanamıyor"
}
```

### Health

- `GET /actuator/health`

### OpenAPI

- `GET /v3/api-docs`
- `GET /swagger-ui.html`

## Response Örneği

```json
{
  "id": "f284e8f8-7f23-4f20-9f06-94416fbf4d58",
  "type": "INCIDENT",
  "title": "VPN erişim problemi",
  "description": "Kullanıcı VPN'e bağlanamıyor",
  "status": "NEW",
  "priority": "MEDIUM",
  "createdAt": "2026-02-13T02:00:00Z",
  "updatedAt": "2026-02-13T02:00:00Z"
}
```

## Hata Kodları

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `500 Internal Server Error`
