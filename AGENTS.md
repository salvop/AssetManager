# AGENTS.md

## Purpose

This repository contains an internal enterprise Asset Manager application.
The objective is to build a maintainable MVP for asset inventory, assignments, event history, documents, and maintenance.

This file defines execution rules for any coding agent working in this repository.
Read this file together with `implementation.md` and follow both. If there is a conflict, prefer the more restrictive instruction.

---

## Product intent

Build a serious internal business application, not a demo and not a generic CRUD scaffold.

The first release must cover only:
- authentication for internal users
- lookup management needed by the MVP
- asset inventory
- asset details
- asset assignment and return workflow
- asset status and location changes
- asset event history
- asset documents
- maintenance tickets
- simple dashboard summaries

Out of scope for this phase:
- multitenancy
- procurement and contracts
- software license management
- custom dynamic fields
- CMDB dependency graphs
- approval workflows
- external discovery agents
- advanced reporting beyond the MVP dashboard

Do not silently expand scope.

---

## Architecture rules

The repository is intentionally layered:
- `database/` for schema, seeds, migrations
- `backend/` for API and business logic
- `frontend/` for React UI
- `docs/` for supporting documentation

Respect these boundaries.

### Database
Use the database for:
- schema design
- referential integrity
- unique constraints
- indexes
- seed data
- migrations

Do not move core business workflow into triggers unless there is a strict technical need.

### ORM / persistence
Use ORM and repositories for:
- mapping tables to classes
- query composition
- transaction boundaries
- persistence abstraction

Do not let ORM models become the public API contract.

### Backend
Use the backend for:
- business rules
- authorization
- validation
- orchestration of workflows
- event logging
- error handling

Do not place business logic directly in route handlers.

### Frontend
Use the frontend for:
- user interaction
- forms
- tables
- filters
- navigation
- API consumption

Do not encode server-side business rules in React.
The frontend must never depend on database table structure directly.

---

## Required stack

Follow this stack unless there is a clear technical blocker:

### Backend
- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic v2
- pytest

### Frontend
- React
- Vite
- TypeScript
- TanStack Query
- React Router
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

### Database
- MariaDB preferred
- keep SQL MySQL-compatible where practical

### Runtime
- Docker
- docker-compose
- `.env` configuration

Prefer fewer dependencies.
Do not introduce large frameworks unless they materially simplify delivery.

---

## Data model boundaries

Current MVP tables in scope:
- `departments`
- `users`
- `roles`
- `user_roles`
- `locations`
- `vendors`
- `asset_categories`
- `asset_models`
- `asset_statuses`
- `assets`
- `asset_assignments`
- `asset_event_log`
- `asset_documents`
- `maintenance_tickets`

Do not redesign the model into a bigger enterprise schema during implementation.
If an extension is needed, keep it incremental and compatible with the simplified MVP.

---

## Core domain rules

These workflow rules are mandatory:
- only one open assignment per asset at a time
- an asset cannot be assigned if status is `RETIRED` or `DISPOSED`
- assigning an asset updates current assignee and status on `assets`
- returning an asset closes the active assignment
- status changes create an event log entry
- location changes create an event log entry
- asset creation creates an event log entry
- event history is append-only

Prefer service-layer orchestration for these rules.

---

## Repository conventions

Expected backend structure:

```text
backend/app/
  api/
    routes/
  core/
  db/
  models/
  schemas/
  repositories/
  services/
  security/
  tests/
```

Expected frontend structure:

```text
frontend/src/
  app/
  api/
  components/
  features/
  hooks/
  lib/
  pages/
  routes/
  types/
```

Keep files focused. Avoid mega-files.

### Backend naming
- models: singular business names where appropriate
- repositories: `<Entity>Repository`
- services: `<Entity>Service` or business-specific names
- schemas: request/response DTO names ending in `Request` / `Response`

### Frontend naming
- pages: page-level route containers
- features: business feature modules
- components: reusable UI components
- api: HTTP client wrappers and query functions

---

## API rules

Expose clean REST endpoints.
Do not return raw ORM entities.
Use dedicated DTOs.

Minimum API areas:
- auth
- users and lookup data
- assets
- assignments
- asset events
- documents
- maintenance tickets
- dashboard summaries

Requirements:
- pagination for list endpoints
- explicit filtering on assets
- consistent error payloads
- role checks on write operations
- stable response shapes

When in doubt, prefer explicit endpoints by use case instead of generic mutation endpoints.

Good:
- `POST /assets/{id}/assign`
- `POST /assets/{id}/return`
- `PATCH /assets/{id}/status`

Avoid over-generic designs that leak persistence concepts.

---

## Security rules

These are mandatory:
- hash passwords with a modern password hasher
- never store plain-text passwords
- validate authorization in backend, never trust frontend claims
- validate and sanitize inputs
- use ORM parameterization, never build SQL by string concatenation
- restrict file upload types and size if documents are implemented
- never expose secrets in source code
- load configuration from environment variables

For the first pass, a simple internal auth model is acceptable:
- username + password
- JWT access token
- role-based authorization

Design authentication in a way that can be replaced or extended later.

---

## Coding standards

### General
- prefer explicit code over magic
- prefer readable code over clever abstractions
- keep functions small and intention-revealing
- only abstract after repeated need
- do not create unnecessary generic frameworks inside the project

### Python backend
- use type hints
- keep route handlers thin
- move orchestration to services
- raise explicit domain or application exceptions
- keep transactions atomic for multi-step workflows
- use SQLAlchemy 2 style APIs

### React frontend
- use TypeScript strictly
- keep components small
- prefer feature-oriented composition
- use TanStack Query for server state
- use React Hook Form + Zod for forms
- avoid local state duplication of server state unless necessary

### SQL / migrations
- migrations must be deterministic and repeatable
- do not edit applied migrations; create new migrations
- seed required reference data explicitly
- add indexes for frequent filters and joins

---

## Logging and observability

Implement practical observability, not noise.

Backend should include:
- structured logs where practical
- error logging
- request correlation ID if simple to add

Do not add heavy observability stacks unless requested.

---

## Testing rules

Minimum backend test coverage must include:
- asset creation
- asset assignment
- asset return
- status change
- unauthorized access
- role-based restrictions
- asset filtering

Minimum frontend test coverage should include:
- login page render
- asset list render
- asset detail render
- form validation behavior

If time is limited, prioritize backend workflow tests before broader frontend coverage.

---

## UX and UI rules

The application is desktop-first and enterprise-focused.

UI principles:
- prioritize clarity over decoration
- use simple navigation
- tables must be readable
- forms must show validation clearly
- status should be visible via badges or labels
- loading and error states must be explicit

Do not produce a flashy dashboard-first demo with weak workflows.
The operational pages matter more than cosmetic effects.

---

## Delivery rules

Preferred implementation order:
1. repository scaffolding and local runtime
2. database migrations and seed data
3. ORM models and repositories
4. auth and role checks
5. asset workflows
6. event log and history
7. maintenance and documents
8. dashboard summaries
9. tests and polish
10. README and docs

Do not jump straight into frontend polish before backend workflows are stable.

---

## Definition of done for agent work

A task is not complete just because code compiles.
For meaningful feature completion, verify:
- migrations run cleanly
- API starts and connects to DB
- frontend builds and runs
- seed data works
- auth works with seeded admin
- major workflow works end-to-end
- tests relevant to the feature pass
- no obvious layering violations were introduced

---

## Explicit do-not rules

Do not:
- convert the project into a generic admin panel generator
- expose DB schema directly to the frontend
- put business logic only in React components
- put all business logic in API route files
- implement unnecessary enterprise modules outside scope
- bypass migrations with manual schema drift
- mix unrelated refactors into feature work
- invent new architectural layers without necessity
- replace practical code with over-engineered patterns

---

## Change management rules

When implementing a feature:
1. understand the existing layer boundaries
2. make the smallest coherent change that solves the problem
3. keep names aligned with business language
4. preserve backward compatibility where reasonable
5. update tests and docs when behavior changes

When there is ambiguity:
- choose the simplest maintainable solution
- preserve extensibility
- do not widen scope

---

## Authoring and comments

Code comments should be professional, concise, and useful.
Do not add decorative comments.
When author attribution is explicitly requested in code comments or headers, use:
- `Author: Salvatore Privitera`

Do not spam author headers in every file unless there is a project convention requiring it.

---

## Expected end state

The final repository should be credible as an internal enterprise asset management starter platform, with:
- clean schema and migrations
- a maintainable FastAPI backend
- a structured React frontend
- role-based access
- working asset workflows
- event history
- maintenance and document handling
- reproducible local startup
- useful documentation

