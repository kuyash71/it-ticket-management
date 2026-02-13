# Observability Architecture

## Hedefler

- Uygulama loglarının merkezi olarak toplanması ve aranabilir hale getirilmesi
- Dağıtık izleme (trace) ile request zincirinin uçtan uca takip edilmesi
- Operasyonel sorunlarda kök neden analizini hızlandırmak

## Loglama (Log4j2)

- Backend log framework: Log4j2 (`backend/src/main/resources/log4j2-spring.xml`)
- Log pattern içinde `traceId` bulunur; trace ve log korelasyonu sağlanır

## Log Event Akışı

1. Domain olayları `KafkaLogProducer` ile `itsm.logs` topic'ine yazılır.
2. Aynı olay `OpenSearchLogIndexer` ile OpenSearch index'ine kaydedilir.
3. Varsayılan index: `itsm-logs`

## OpenSearch

- Servis: `infra/docker-compose.yml` içindeki `opensearch`
- Endpoint: `http://localhost:9200`
- Kullanım: Operasyonel log arama, filtreleme ve olay analizi

## OpenTelemetry

- Spring Boot tracing exporter: OTLP
- Backend endpoint ayarı: `management.otlp.tracing.endpoint`
- Varsayılan local endpoint: `http://localhost:4317`
- Collector config: `infra/otel/collector-config.yaml`
- Collector pipeline: `otlp receiver -> batch processor -> debug exporter`

## Ortam Değişkenleri

- `OBSERVABILITY_OPENSEARCH_URL`
- `OBSERVABILITY_OPENSEARCH_INDEX`
- `MANAGEMENT_OTLP_TRACING_ENDPOINT`
