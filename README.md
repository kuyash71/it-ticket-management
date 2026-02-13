# IT Ticket Management

Bu proje, kurumsal IT ticket yönetimi için aşağıdaki teknoloji seti ile sıfırdan kurulmuştur:

- Backend: Spring Boot 3 (Java 21)
- AuthN/AuthZ: Keycloak (OIDC/JWT)
- Frontend: React + Vite + i18next
- Database: PostgreSQL
- Workflow Engine: jBPM
- Log Transfer: Kafka
- Log Index/Search: OpenSearch
- Telemetry: OpenTelemetry (OTLP)
- Runtime: Docker Compose

## Monorepo Yapısı

```text
backend/                  # Spring Boot API
frontend/                 # React uygulaması
infra/                    # Docker Compose + Keycloak realm + OTel config
docs/                     # Mimari ve proje dokümantasyonu
```

## Hızlı Başlangıç (Docker Compose)

```bash
docker compose up --build
```

Servisler:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Keycloak: `http://localhost:8081`
- PostgreSQL: `localhost:5433`
- Kafka: `localhost:9092`
- OpenSearch: `http://localhost:9200`
- OpenTelemetry Collector: `localhost:4317`, `localhost:4318`

## Local Geliştirme

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## i18n

Frontend çoklu dil desteği i18next ile uygulanmıştır.

- Türkçe: `frontend/src/locales/tr/common.json`
- İngilizce: `frontend/src/locales/en/common.json`

## API Kısa Özeti

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /actuator/health`

Detaylar için: `docs/api-overview.md`

## Workflow, Logging ve Observability

- Ticket oluşturma sonrası jBPM process başlatılır.
- Domain log olayları Kafka topic'ine aktarılır (`itsm.logs`).
- Aynı olaylar OpenSearch index'ine yazılır (`itsm-logs`).
- Uygulama trace verisi OTLP ile OpenTelemetry Collector'a gönderilir.

## Lisans

Lisans metni: `LICENSE`
