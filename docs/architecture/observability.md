# Observability Architecture

## Hedefler

- Uygulama loglarının merkezi olarak toplanması ve aranabilir hale getirilmesi
- Dağıtık izleme (trace) ile request zincirinin uçtan uca takip edilmesi
- Operasyonel sorunlarda kök neden analizini hızlandırmak

---

## Loglama (Log4j2)

- Backend log framework: Log4j2 (`backend/src/main/resources/log4j2-spring.xml`)
- Log pattern, her satırda şu MDC alanlarını içerir:

```
%d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [traceId=%X{traceId}] [ticketId=%X{ticketId}] [actor=%X{actor}] [%t] %c{1} - %msg%n
```

| MDC Alanı  | Kaynak                     | Açıklama                          |
|------------|----------------------------|-----------------------------------|
| `traceId`  | OTel Java agent (otomatik) | Dağıtık trace korelasyonu         |
| `ticketId` | `TicketService.withMdc()`  | Hangi tickete ait olduğunu göster |
| `actor`    | `TicketService.withMdc()`  | İşlemi yapan Keycloak kullanıcısı |

---

## Log Event Akışı

Her mutating operasyon (create, changeStatus, addComment, addWorklog, addAttachment) aşağıdaki zinciri tetikler:

```
TicketService.withMdc()
    └─► KafkaLogProducer.publish(LogEvent)
            ├─► kafkaTemplate.send("itsm.logs", ticketId, envelope)   ← async, non-blocking
            └─► OpenSearchLogIndexer.indexAsync(...)                   ← async, dedicated thread pool
```

### LogEvent Şeması

```json
{
  "eventType": "TICKET_CREATED",
  "timestamp": "2026-05-12T11:30:00Z",
  "traceId": "4bf92f3577b34da6",
  "ticketId": "f284e8f8-7f23-4f20-9f06-94416fbf4d58",
  "actor": "john.doe",
  "payload": {
    "title": "VPN erişim problemi",
    "type": "INCIDENT"
  }
}
```

### Desteklenen eventType Değerleri

`TICKET_CREATED` · `STATUS_CHANGED` · `COMMENT_ADDED` · `WORKLOG_ADDED` · `ATTACHMENT_ADDED`

---

## OpenSearch

- Servis: `docker-compose.yml` → `opensearch` container
- Endpoint: `http://localhost:9200`
- Varsayılan index: `itsm-logs`
- Index template tanımı: `infra/opensearch/index-template.json`

### Index Field Mapping

| Alan        | Tip     | Açıklama             |
|-------------|---------|----------------------|
| `eventType` | keyword | Filtreleme için      |
| `timestamp` | date    | Zaman bazlı sorgular |
| `traceId`   | keyword | Trace korelasyonu    |
| `ticketId`  | keyword | Ticket bazlı arama   |
| `actor`     | keyword | Kullanıcı bazlı log  |
| `payload`   | object  | Dinamik detaylar     |

---

## OpenTelemetry

- Spring Boot tracing exporter: OTLP (gRPC)
- Backend endpoint: `management.otlp.tracing.endpoint` property
- Collector config: `infra/otel/collector-config.yaml`
- Collector pipeline: `otlp receiver → batch processor → debug exporter`

---

## Ortam Değişkenleri

| Değişken                        | Varsayılan                                    | Açıklama                  |
|---------------------------------|-----------------------------------------------|---------------------------|
| `OPENSEARCH_URL`                | `http://localhost:9200`                       | OpenSearch endpoint       |
| `OPENSEARCH_INDEX`              | `itsm-logs`                                   | Index adı                 |
| `KAFKA_BOOTSTRAP_SERVERS`       | `localhost:9092`                              | Kafka broker adresi       |
| `MANAGEMENT_OTLP_TRACING_ENDPOINT` | `http://localhost:4317`                   | OTel Collector gRPC       |

> Not: Tüm değişkenler `application.yml` içinde `${VAR:default}` formatıyla tanımlanmıştır. Production ortamında gerçek değerleri container env olarak sağlanmalıdır.

---

## Raporlama (Sprint 5)

- `GET /api/reports/summary` endpoint'i doğrudan PostgreSQL'e JPQL sorgusuyla bağlanır.
- OpenSearch üzerinden raporlama yapılmaz (OpenSearch operasyonel log arama içindir).
- Rapor metrikleri: açık ticket sayısı, durum/tip dağılımı, SLA ihlal oranı, ortalama çözüm süresi.
