# Deployment with Docker Compose

## Tek Komutla Kalkış

```bash
docker compose up --build
```

## Compose İçeriği

- `postgres`
- `kafka`
- `keycloak`
- `opensearch`
- `otel-collector`
- `backend`
- `frontend`

## Bağımlılık Akışı

- backend -> postgres, kafka, keycloak, opensearch, otel-collector
- frontend -> backend

## Ortam Değişkenleri

Backend container için kritik env:
- `SPRING_DATASOURCE_URL`
- `SPRING_KAFKA_BOOTSTRAP_SERVERS`
- `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`
- `MANAGEMENT_OTLP_TRACING_ENDPOINT`
- `OBSERVABILITY_OPENSEARCH_URL`
