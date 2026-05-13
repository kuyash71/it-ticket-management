# API Overview

## Base URL

- Local: `http://localhost:8080`

## Authentication

API, Keycloak tarafından üretilen Bearer JWT token bekler.

- Header: `Authorization: Bearer <access_token>`
- Roller JWT içindeki `realm_access.roles` claim'inden çıkarılır.
- Desteklenen roller: `CUSTOMER`, `AGENT`, `MANAGER`

---

## Endpointler

### Tickets

- `GET /api/tickets` — Tüm ticketları döner. (CUSTOMER, AGENT, MANAGER)
- `POST /api/tickets` — Yeni ticket oluşturur. (CUSTOMER, AGENT, MANAGER)

```json
{
  "type": "INCIDENT",
  "title": "VPN erişim problemi",
  "description": "Kullanıcı VPN'e bağlanamıyor"
}
```

**Alan kısıtları:** `title` ≤ 255 karakter, `description` ≤ 5000 karakter.

- `GET /api/tickets/{id}` — Tek ticket getirir. (CUSTOMER, AGENT, MANAGER)

- `PATCH /api/tickets/{id}/status` — Ticket durumunu değiştirir. (AGENT, MANAGER — CUSTOMER erişemez domain policy gereği)

```json
{ "status": "IN_PROGRESS" }
```

**İzin verilen geçişler (domain policy):**

| From                  | To                    | İzin verilen roller |
|-----------------------|-----------------------|---------------------|
| NEW                   | IN_PROGRESS           | AGENT, MANAGER      |
| NEW                   | WAITING_FOR_CUSTOMER  | AGENT, MANAGER      |
| IN_PROGRESS           | WAITING_FOR_CUSTOMER  | AGENT, MANAGER      |
| IN_PROGRESS           | RESOLVED              | AGENT, MANAGER      |
| WAITING_FOR_CUSTOMER  | IN_PROGRESS           | AGENT, MANAGER      |
| RESOLVED              | CLOSED                | AGENT, MANAGER      |

Geçersiz geçişlerde `409 CONFLICT` döner.

---

### Timeline

- `GET /api/tickets/{id}/timeline` — Ticket timeline'ını döner.
  - `CUSTOMER`: yalnızca `EXTERNAL` olaylar görünür (JWT'den otomatik türetilir).
  - `AGENT` / `MANAGER`: `INTERNAL` dahil tüm olaylar görünür.

- `POST /api/tickets/{id}/comments` — Yorum ekler. (CUSTOMER, AGENT, MANAGER)
  - `parentId` ile sınırsız derinlikte thread oluşturulabilir.
  - Yalnızca `COMMENT` tipindeki olaylara reply verilebilir.
  - `CUSTOMER`, `INTERNAL` görünürlüklü yorum ekleyemez.

```json
{
  "body": "VPN client ayarlarını kontrol edin.",
  "visibility": "EXTERNAL",
  "parentId": null
}
```

**Alan kısıtları:** `body` ≤ 10 000 karakter.

- `POST /api/tickets/{id}/worklogs` — Çalışma günlüğü ekler. (AGENT, MANAGER)

```json
{
  "body": "Firewall kuralları incelendi, port 1194 açık.",
  "visibility": "INTERNAL"
}
```

**Alan kısıtları:** `body` ≤ 10 000 karakter.

---

### Attachments

- `GET /api/tickets/{id}/attachments` — Ekli dosyaları listeler.
  - `CUSTOMER`: yalnızca `EXTERNAL` dosyalar görünür.
  - `AGENT` / `MANAGER`: tüm dosyalar görünür.

- `POST /api/tickets/{id}/attachments` — Dosya metadata'sını kaydeder. (CUSTOMER, AGENT, MANAGER)

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

**Alan kısıtları:** `fileName` ≤ 255, `mimeType` ≤ 127, `storageKey` ≤ 512 karakter.

---

### Reports (Sprint 5)

- `GET /api/reports/summary` — Özet rapor döner. **(AGENT, MANAGER — CUSTOMER erişemez)**

```json
{
  "openTickets": 8,
  "totalTickets": 15,
  "byStatus": { "NEW": 3, "IN_PROGRESS": 4, "WAITING_FOR_CUSTOMER": 1, "RESOLVED": 7 },
  "byType":   { "INCIDENT": 9, "SERVICE_REQUEST": 6 },
  "resolvedTotal": 7,
  "slaBreachCount": 2,
  "slaBreachRatePercent": 28.6,
  "avgResolutionHours": 4.2
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
  "type": "INCIDENT",
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

> Görünürlük JWT token'daki rol bilgisinden türetilir; query parameter ile override edilemez.

## Comment Threading

Yorumlar `parentId` alanıyla **sınırsız derinlikte** zincir oluşturabilir (adjacency list modeli).

Kurallar:
- `parentId` yalnızca `COMMENT` tipindeki olaylara set edilebilir.
- `SYSTEM_EVENT` ve `WORKLOG` tipindeki olaylara reply verilemez.
- Reply'ın visibility'si parent'tan bağımsız olabilir.

---

## Notification Kuralları (MVP Backend)

| Event            | Bildirim                                  | Alıcı    |
|------------------|-------------------------------------------|----------|
| SLA_BREACH_RISK  | Her zaman                                 | Manager  |
| SLA_BREACHED     | Her zaman                                 | Manager  |
| STATUS_CHANGED   | RESOLVED / WAITING_FOR_CUSTOMER / CLOSED  | Customer |
| ATTACHMENT_ADDED | EXTERNAL ise                              | Customer |
| TICKET_CREATED   | assignedTo varsa                          | Agent    |

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
