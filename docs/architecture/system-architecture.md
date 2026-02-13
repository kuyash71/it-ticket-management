# System Architecture

## Genel Mimari

Sistem aşağıdaki ana bileşenlerden oluşur:

- React frontend (i18n destekli)
- Spring Boot backend API
- Keycloak kimlik ve erişim kontrolü
- PostgreSQL kalıcı veri katmanı
- jBPM workflow orchestration
- Kafka log event aktarımı
- OpenSearch log indeksleme/sorgulama
- OpenTelemetry trace pipeline

## Veri ve Kontrol Akışı

1. Kullanıcı frontend üzerinden Keycloak ile login olur.
2. Frontend JWT ile backend API çağırır.
3. Backend ticket verisini PostgreSQL'e yazar.
4. Ticket oluşturma sonrası jBPM process tetiklenir.
5. Backend log event'i Kafka topic'ine yazar.
6. Aynı event OpenSearch index'e aktarılır.
7. Uygulama trace verileri OTLP ile collector'a gönderilir.
