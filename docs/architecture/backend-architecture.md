# Backend Architecture

## Katmanlar

- API Layer: `ticket/api`
- Service Layer: `ticket/service`
- Persistence Layer: `ticket/repository`
- Domain Layer: `ticket/domain`
- Cross-cutting: `config`, `workflow`, `logging`, `i18n`

## Teknoloji Kullanımı

- Spring Web: REST endpointler
- Spring Security + OAuth2 Resource Server: JWT doğrulama
- Spring Data JPA: Repository ve ORM
- PostgreSQL: Ana veri deposu
- Kogito (Apache KIE): BPMN tabanlı iş akışı yürütme
- Spring Kafka: Log event yayınlama
- Log4j2: Uygulama loglama

## Ticket Akışı

- `POST /api/tickets` çağrısı
- Ticket persist edilir
- Kogito process service üzerinden BPMN process başlatılır
- Kafka log event yayınlanır
- OpenSearch'e event indekslenir
