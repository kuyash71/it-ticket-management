# IT Ticket Management System

Kurumsal IT servis talebi ve arıza yönetimi için tam yığın uygulama.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | React 18 + Vite + i18next |
| Backend | Spring Boot 3.3 (Java 21) |
| Veritabanı | PostgreSQL 16 + Flyway |
| ORM | Spring Data JPA / Hibernate |
| Kimlik & Yetki | Keycloak 26 (JWT + 2FA/TOTP) |
| İş Akışı | Kogito (jBPM uyumlu BPMN motoru) |
| Log Aktarımı | Log4j2 → Kafka → OpenSearch |
| Gözlemlenebilirlik | OpenTelemetry + Prometheus + Grafana |
| Cache | Caffeine (in-memory, 30 s TTL) |
| Çalışma Ortamı | Docker Compose |

---

## Gereksinimler

- **Docker** 24+ ve **Docker Compose** v2  
- Local geliştirme için: **Java 21**, **Maven 3.9+**, **Node.js 20+**

---

## Hızlı Başlangıç (Docker Compose)

```bash
# Repoyu klonlayın
git clone <repo-url>
cd "IT Ticket Management"

# Tüm servisleri ayağa kaldırın (ilk çalıştırmada image'lar indirilir)
docker compose up --build
```

Tüm servisler ayağa kalktıktan sonra (yaklaşık 1-2 dk):

| Servis | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8080 |
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| **Keycloak** | http://localhost:8081 |
| **Grafana** | http://localhost:3000 |
| **Prometheus** | http://localhost:9090 |
| **OpenSearch** | http://localhost:9200 |
| **PostgreSQL** | localhost:5433 |
| **Kafka** | localhost:9092 |

---

## Varsayılan Kullanıcılar

### Keycloak Admin Konsolu (`http://localhost:8081`)
| Alan | Değer |
|---|---|
| Kullanıcı adı | `admin` |
| Şifre | `admin` |

### Uygulama Test Kullanıcıları (realm: `itsm`)

İlk girişte **TOTP (2FA) kurulumu** yapmanız istenecektir. Google Authenticator veya benzeri bir uygulama kullanın.

| Kullanıcı adı | Şifre | Rol |
|---|---|---|
| `manager1` | `Test1234!` | Manager |
| `agent1` | `Test1234!` | Agent |
| `customer1` | `Test1234!` | Customer |

> Yeni kullanıcı eklemek için: Keycloak Admin → realm `itsm` → Users → Add user → Credentials.

---

## API

Tüm endpointler `/api/v1/` öneki ile başlar. Kimlik doğrulama Bearer JWT gerektirir.

### Temel Endpointler

```
GET    /api/v1/tickets              # Çağıranın görebileceği ticket listesi
POST   /api/v1/tickets              # Yeni ticket oluştur
GET    /api/v1/tickets/{id}         # Ticket detayı
PATCH  /api/v1/tickets/{id}/status  # Durum değiştir
POST   /api/v1/tickets/{id}/resolve # Çözüme al (not zorunlu)
GET    /api/v1/reports/summary      # Özet rapor (agent/manager)
GET    /api/v1/users/agents         # Agent listesi (agent/manager)
```

Tüm endpointler ve istek/yanıt şemaları için: **http://localhost:8080/swagger-ui.html**

### Sağlık ve Metrik (auth gerektirmez)

```
GET /actuator/health
GET /actuator/prometheus
```

---

## Proje Yapısı

```
.
├── backend/                        # Spring Boot API
│   ├── src/main/java/com/itsm/
│   │   ├── config/                 # Security, Cache, CORS, OpenTelemetry
│   │   ├── ticket/
│   │   │   ├── api/                # REST controllers + request/response DTO
│   │   │   ├── domain/             # JPA entity, enums, policy
│   │   │   ├── service/            # İş mantığı
│   │   │   └── exception/          # GlobalExceptionHandler
│   │   ├── reporting/              # Raporlama katmanı
│   │   ├── users/                  # Kullanıcı dizini
│   │   └── logging/                # Kafka log producer + OpenSearch indexer
│   └── src/main/resources/
│       ├── application.yml
│       ├── log4j2-spring.xml       # Log4j2 → Kafka appender
│       └── db/migration/           # Flyway migration dosyaları
│
├── frontend/                       # React + Vite
│   └── src/
│       ├── pages/                  # TicketsPage, TicketDetailPage, DashboardPage, ReportsPage
│       ├── components/             # Paylaşılan UI bileşenleri
│       ├── api/                    # Axios HTTP client
│       └── locales/                # tr / en çeviri dosyaları
│
├── infra/
│   ├── keycloak/realm-itsm.json    # Keycloak realm export (kullanıcılar, roller, 2FA config)
│   ├── otel-collector-config.yml   # OpenTelemetry Collector yapılandırması
│   └── prometheus/prometheus.yml   # Prometheus scrape config
│
└── docker-compose.yml
```

---

## Local Geliştirme

### Backend

```bash
cd backend
mvn spring-boot:run
```

> Önce altyapı servislerinin (PostgreSQL, Kafka, Keycloak, OpenSearch) çalışıyor olması gerekir:
> ```bash
> docker compose up postgres kafka keycloak opensearch -d
> ```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışır, API isteklerini `http://localhost:8080`'e yönlendirir.

---

## Test

```bash
cd backend
mvn test
```

---

## Log Akışı

```
Uygulama (Log4j2)
    └──► Kafka topic: itsm.logs
              └──► OpenSearch index: itsm-logs-*
```

Logları sorgulamak için: `http://localhost:9200/itsm-logs-*/_search`

---

## Gözlemlenebilirlik

- **Prometheus** metrikleri `http://localhost:9090` adresinde
- **Grafana** dashboardları `http://localhost:3000` (varsayılan: admin/admin)
  - JVM dashboard ID: `4701`
- **Trace verileri** OpenTelemetry Collector üzerinden toplanır (`localhost:4317` OTLP/gRPC)
