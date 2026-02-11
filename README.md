# IT Ticket Management - MVP Skeleton

This repository contains a full project skeleton generated from:

- `docs/reports/ITSM Analiz Dokümanı.pdf`
- `docs/reports/tasarım.md`

The structure follows the documented MVP scope:

- Incident and Service Request separation
- Ticket lifecycle and status transition controls
- RBAC (Customer, Agent, Manager)
- SLA clock and escalation risk levels
- Timeline, audit, attachment, reporting foundations
- Service quality complaint handling (manager-facing)

## Repository Layout

```text
apps/
  api/            # Backend API skeleton (Fastify + DDD style folders)
  web/            # Frontend skeleton (React + Vite feature folders)
packages/
  contracts/      # Shared enums, DTOs, events, action contracts
infra/
  db/             # SQL schema for MVP entities
  openapi/        # API contract draft
  docker-compose.yml

docs/
  reports/        # Provided analysis and design reports
  architecture/   # Traceability and implementation notes
```

## Quick Start (after dependency install)

Prerequisites: Node.js 22+, pnpm 10+.

```bash
pnpm install
pnpm dev
```

Backend default: `http://localhost:3000`.

## MVP Scope Mapping

- Domain rules and policy stubs: `apps/api/src/modules/tickets/domain`
- Use-case skeletons: `apps/api/src/modules/tickets/application`
- HTTP contracts and endpoints: `apps/api/src/modules/**/presentation/http`
- Shared contract package: `packages/contracts/src`
- Traceability notes: `docs/architecture/mvp-traceability.md`

## Notes

- This is an architecture skeleton, not a production-complete implementation.
- Some files intentionally include TODO-level placeholders where detailed behavior belongs in Phase-2.
