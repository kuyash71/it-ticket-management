# IT Ticket Management

IT Ticket Management, analiz ve tasarım dokümanlarında tanımlanan ITSM MVP kapsamını temel alan bir monorepo proje iskeletidir.

Referans dokümanlar:
- `docs/reports/ITSM Analiz Dokümanı.pdf`
- `docs/reports/tasarım.md`

## Hedeflenen MVP

- Incident ve Service Request ayrımı
- Kurallı ticket yaşam döngüsü ve status transition kontrolü
- RBAC (Customer, Agent, Manager)
- Urgency/Impact tabanlı önceliklendirme
- SLA clock (start/pause/resume/stop) ve risk seviyeleri
- Audit + Timeline + Attachment görünürlük ayrımı
- Manager override (reason + audit zorunlu)
- Servis kalitesi şikayet akışı

## Kapsam Dışı (MVP)

- Harici sistem entegrasyonları
- Gelişmiş otomasyon ve AI karar mekanizmaları
- Gelişmiş raporlama/projection optimizasyonu (Phase-2)
- CMDB ve finansal süreçler

## Repository Yapısı

```text
apps/
  api/                    # Fastify + DDD katmanlı backend iskeleti
  web/                    # React + Vite feature bazlı frontend iskeleti
packages/
  contracts/              # Ortak enum, DTO, event sözleşmeleri
infra/
  db/schema.sql           # MVP başlangıç şeması
  openapi/openapi.yaml    # API kontrat taslağı
  docker-compose.yml      # Postgres + MinIO

docs/
  README.md               # Dokümantasyon indeksi
  checklist.md            # Sprint bazlı %100 tamamlanma planı
  architecture/           # Mimari izlenebilirlik ve teknik notlar
  reports/                # Kaynak analiz/tasarım dokümanları
```

## Gereksinimler

- Node.js 22+
- pnpm 10+
- Docker (opsiyonel, local servisler için)

## Hızlı Başlangıç

```bash
pnpm install
pnpm dev
```

Varsayılan adresler:
- API: `http://localhost:3000`
- Web: `http://localhost:5173`

## Komutlar

Root komutları:

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

Workspace bazlı örnekler:

```bash
pnpm --filter @itsm/api dev
pnpm --filter @itsm/web dev
pnpm --filter @itsm/contracts build
```

## API Özet Uçları

- `GET /health`
- `GET /tickets`
- `POST /tickets`
- `GET /tickets/:ticketId`
- `POST /tickets/:ticketId/status`
- `POST /tickets/:ticketId/priority`
- `POST /tickets/:ticketId/reassign`
- `POST /tickets/:ticketId/override`
- `GET /tickets/:ticketId/allowed-actions?role=AGENT`
- `GET /reporting/summary`
- `POST /complaints`

Detaylar için: `infra/openapi/openapi.yaml`

## Kalite ve Kısıtlar

- Maksimum sayfa boyutu: 50
- JWT expiry hedefi: 15 dakika
- Attachment boyut limiti: 10 MB
- Audit retention hedefi: minimum 1 yıl

## Dokümantasyon

- Dokümantasyon indeksi: `docs/README.md`
- Sprint checklist: `docs/checklist.md`
- Traceability: `docs/architecture/mvp-traceability.md`

## CI

GitHub Actions pipeline:

1. Install (`pnpm install --frozen-lockfile`)
2. Lint
3. Test
4. Build

Workflow dosyası: `.github/workflows/ci.yml`

## Lisans

Bu repo `LICENSE` dosyasındaki lisans koşullarına tabidir.
