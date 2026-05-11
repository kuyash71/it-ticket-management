# API Overview

## Base URL

- Local: `http://localhost:8080`

## Authentication

API, Keycloak tarafından üretilen Bearer JWT token bekler.

- Header: `Authorization: Bearer <access_token>`

---

## Endpointler

### Tickets

- `GET /api/tickets` — Tüm ticketları döner.
- `POST /api/tickets` — Yeni ticket oluşturur.

```json
{
  "type": "INCIDENT",
  "title": "VPN erişim problemi",
  "description": "Kullanıcı VPN'e bağlanamıyor"
}
```

---

### Timeline (Sprint 3)

- `GET /api/tickets/{id}/timeline?role=AGENT`
  - Ticket timeline'ını döner.
  - `role=CUSTOMER`: yalnızca EXTERNAL olaylar görünür.
  - `role=AGENT` / `MANAGER`: INTERNAL dahil tüm olaylar görünür.

- `POST /api/tickets/{id}/comments` — Yorum ekler.
  - `parentId` ile sınırsız derinlikte thread oluşturulabilir.
  - Yalnızca `COMMENT` tipindeki olaylara reply verilebilir.

```json
{
  "body": "VPN client ayarlarını kontrol edin.",
  "visibility": "EXTERNAL",
  "parentId": null
}
```

- `POST /api/tickets/{id}/worklogs` — Çalışma günlüğü ekler (agent/manager).

```json
{
  "body": "Firewall kuralları incelendi, port 1194 açık.",
  "visibility": "INTERNAL"
}
```

---

### Attachments (Sprint 3)

- `GET /api/tickets/{id}/attachments?role=AGENT` — Ekli dosyaları listeler.
- `POST /api/tickets/{id}/attachments` — Dosya metadata'sını kaydeder.

**Policy:**
- Max boyut: 10 MB
- İzin verilen tipler: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

```json
{
  "fileName": "screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 204800,
  "storageKey": "uploads/2026/ticket-uuid/screenshot.png",
  "visibility": "EXTERNAL"
}
```

---

### Health / OpenAPI

- `GET /actuator/health`
- `GET /v3/api-docs`
- `GET /swagger-ui.html`

---

## Response Örnekleri

### Ticket

```json
{
  "id": "f284e8f8-7f23-4f20-9f06-94416fbf4d58",
  "type": "IncidentTicket",
  "title": "VPN erişim problemi",
  "description": "Kullanıcı VPN'e bağlanamıyor",
  "status": "NEW",
  "priority": "LOW",
  "createdAt": "2026-05-11T10:00:00Z",
  "updatedAt": "2026-05-11T10:00:00Z"
}
```

### Timeline Event

```json
{
  "id": "a1b2c3d4-...",
  "eventType": "COMMENT",
  "visibility": "EXTERNAL",
  "actorId": "keycloak-user-uuid",
  "body": "Sorunu araştırıyorum.",
  "payload": null,
  "parentId": null,
  "occurredAt": "2026-05-11T10:05:00Z"
}
```

### Attachment

```json
{
  "id": "e5f6a7b8-...",
  "fileName": "screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 204800,
  "visibility": "EXTERNAL",
  "uploadedBy": "keycloak-user-uuid",
  "uploadedAt": "2026-05-11T10:10:00Z"
}
```

---

## Timeline Görünürlük Kuralları

| İçerik Türü      | Customer | Agent | Manager |
|------------------|----------|-------|---------|
| External Comment | ✓        | ✓     | ✓       |
| Internal Comment | ✗        | ✓     | ✓       |
| External Worklog | ✓        | ✓     | ✓       |
| Internal Worklog | ✗        | ✓     | ✓       |
| System Event     | ✓        | ✓     | ✓       |

## Comment Threading

Yorumlar `parentId` alanıyla **sınırsız derinlikte** zincir oluşturabilir (adjacency list modeli).

Kurallar:
- `parentId` yalnızca `COMMENT` tipindeki olaylara set edilebilir.
- `SYSTEM_EVENT` ve `WORKLOG` tipindeki olaylara reply verilemez.
- Reply'ın visibility'si parent'tan bağımsız olabilir.

---

## Notification Kuralları (MVP Backend)

| Event           | Bildirim        | Alıcı    |
|-----------------|-----------------|----------|
| SLA_BREACH_RISK | Her zaman       | Manager  |
| SLA_BREACHED    | Her zaman       | Manager  |
| STATUS_CHANGED  | RESOLVED / WAITING_FOR_CUSTOMER / CLOSED | Customer |
| ATTACHMENT_ADDED| EXTERNAL ise    | Customer |
| TICKET_CREATED  | assignedTo varsa| Agent    |

---

## Hata Kodları

| HTTP | errorCode                   | Açıklama                   |
|------|-----------------------------|----------------------------|
| 400  | VALIDATION_ERROR            | Payload doğrulama hatası   |
| 400  | ATTACHMENT_POLICY_VIOLATION | Dosya boyutu/tipi ihlali   |
| 400  | BAD_REQUEST                 | Geçersiz parametre         |
| 401  | —                           | Token eksik/geçersiz       |
| 403  | UNAUTHORIZED_ACTION         | RBAC ihlali                |
| 404  | NOT_FOUND                   | Ticket bulunamadı          |
| 409  | CONFLICT                    | Geçersiz durum geçişi      |
