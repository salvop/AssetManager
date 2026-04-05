# AGENTS.md

## Purpose

This repository is for **OpsAsset**, an internal enterprise asset management application.
The goal is to build a **maintainable MVP** for:
- asset inventory
- assignments and returns
- asset status and location changes
- append-only event history
- asset documents
- maintenance tickets
- simple operational dashboard

This file is for **Codex execution behavior**.
Read it together with `implementation.md`.

### Document precedence
If the repository contains multiple guidance files, apply them in this order:
1. `AGENTS.md` → execution rules, boundaries, coding behavior, validation behavior
2. `implementation.md` → product scope, architecture, domain rules, API contract, delivery order
3. `README.md` → human-oriented project overview and local setup

If a conflict exists, prefer the **more restrictive** instruction.
Do not widen scope silently.

---

## What Codex should optimize for

Build a serious internal business application.
Do **not** turn the repository into a generic admin scaffold.

Optimize for:
- maintainability
- clean layering
- explicit domain workflows
- predictable migrations
- stable API contracts
- clear validation and authorization
- reproducible local startup

Avoid optimizing for:
- flashy UI demos
- premature framework abstraction
- speculative enterprise modules outside MVP

---

## Scope guardrails

### In scope for this MVP
- internal user authentication
- lookup management required by MVP
- asset inventory and asset detail
- asset create/update
- asset assignment and return workflow
- asset status changes
- asset location changes
- asset event history
- asset documents
- maintenance tickets
- basic dashboard summaries
- admin user and role management

### Out of scope
- multitenancy
- procurement and contracts
- software license management
- custom dynamic fields
- CMDB dependency graphs
- approval workflows
- external discovery agents
- advanced reporting beyond MVP dashboard
- external identity provider integration in first pass

If a requested change expands the product surface, stop and ask before implementing it.

---

## Architecture rules

The repository must remain layered:
- `database/` → schema, migrations, seeds
- `backend/` → API, services, repositories, auth, tests
- `frontend/` → React UI only
- `docs/` → supporting documentation

Respect these boundaries.

### Database
Use the database for:
- schema
- foreign keys
- unique constraints
- indexes
- seed/reference data
- migrations

Do not move core business workflows into triggers unless there is a strict technical need.

### ORM / persistence
Use ORM and repositories for:
- mapping tables to classes
- query composition
- transaction boundaries
- persistence abstraction

Do not let ORM models become the public API contract.
Do not leak persistence concerns into the frontend.

### Backend
Use the backend for:
- business rules
- authorization
- input validation
- workflow orchestration
- event logging
- file handling orchestration
- error handling

Do not place business logic directly in route handlers.
Route handlers must remain thin.

### Frontend
Use the frontend for:
- navigation
- forms
- tables
- filters
- API consumption
- user feedback states

Do not encode server-side business rules in React.
The frontend must never depend on table structure directly.

---

## Required stack

Use this stack unless there is a strong technical blocker.

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

## Source-of-truth data model

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

Do not redesign the model into a larger enterprise schema during implementation.
Any extension must be incremental and compatible with the simplified MVP.

---

## Mandatory domain rules

These workflow rules are not optional:
- only one open assignment per asset at a time
- an asset cannot be assigned if status is `RETIRED` or `DISPOSED`
- assigning an asset updates current assignee and status on `assets`
- returning an asset closes the active assignment
- status changes create an event log entry
- location changes create an event log entry
- asset creation creates an event log entry
- event history is append-only

Implement these rules in the **service layer**.
Do not scatter them across routes or React components.

---

## Repository conventions

### Backend structure
```text
backend/app/
  api/
    routes/
  core/
  db/
  models/
  repositories/
  schemas/
  security/
  services/
  tests/
```

### Frontend structure
Use a **feature-first** structure.

```text
frontend/src/
  app/
    providers/
    router/
  components/
    ui/
    layout/
  features/
    auth/
    assets/
    assignments/
    dashboard/
    documents/
    lookups/
    maintenance/
    users/
  lib/
  routes/
  shared/
  types/
```

Keep files focused.
Avoid mega-files and cross-layer shortcuts.

### Naming rules
Backend:
- repositories: `<Entity>Repository`
- services: `<Entity>Service` or specific workflow service names
- schemas: DTO names ending in `Request` / `Response`

Frontend:
- feature modules own their local API calls, schemas, hooks, and components
- shared `api/` is allowed only for low-level HTTP transport if needed
- use the `@/` alias for `frontend/src`

---

## API rules

Expose clean REST endpoints.
Do not return raw ORM entities.
Use explicit DTOs.

Minimum areas:
- auth
- users
- lookup data
- assets
- assignments
- asset events
- documents
- maintenance tickets
- dashboard summaries

Requirements:
- pagination for list endpoints
- explicit filtering for assets
- stable response shapes
- consistent error payloads
- role checks on write operations

Prefer explicit endpoints by use case.

Good:
- `POST /assets/{id}/assign`
- `POST /assets/{id}/return`
- `PATCH /assets/{id}/status`
- `PATCH /assets/{id}/location`

Avoid over-generic mutation endpoints that leak persistence details.

---

## Security rules

These are mandatory:
- hash passwords with a modern password hasher
- never store plain-text passwords
- validate authorization in backend, never trust frontend role claims
- validate and sanitize inputs
- use ORM parameterization, never build SQL by string concatenation
- restrict upload types and size for documents
- never expose secrets in source code
- load configuration from environment variables

Acceptable first-pass auth model:
- username + password
- JWT access token
- role-based authorization

Design auth so it can be replaced later without rewriting the domain.

---

## Coding standards

### General
- prefer explicit code over magic
- prefer readable code over clever abstractions
- keep functions small and intention-revealing
- abstract only after repeated need
- avoid internal frameworks inside the project

### Python backend
- use type hints
- keep route handlers thin
- use service layer for orchestration
- use repository layer for data access
- raise explicit domain/application exceptions
- keep multi-step workflows transactional
- use SQLAlchemy 2 style APIs

### React frontend
- use strict TypeScript
- keep components small
- organize by feature
- use TanStack Query for server state
- use React Hook Form + Zod for forms
- do not duplicate server state locally without need

### SQL / migrations
- migrations must be deterministic and repeatable
- never edit applied migrations; create new migrations
- seed reference data explicitly
- add indexes for frequent filters and joins

---

## Validation and delivery behavior for Codex

When implementing a feature:
1. understand the existing boundaries
2. make the smallest coherent change that solves the problem
3. preserve naming aligned with business language
4. keep compatibility where reasonable
5. update tests and docs when behavior changes

Before claiming a feature is complete, verify:
- migrations run cleanly
- API starts and connects to DB
- frontend builds and runs
- seed data works
- auth works with seeded admin
- the target workflow works end-to-end
- relevant tests pass

If time is limited, prioritize:
1. backend domain correctness
2. API stability
3. tests for workflows
4. frontend usability
5. polish

---

## Explicit do-not rules

Do not:
- convert the repo into a generic admin panel generator
- expose DB schema directly to the frontend
- put business logic only in React
- put all business logic in API route files
- bypass migrations with manual schema drift
- mix unrelated refactors into feature work
- invent new architectural layers without necessity
- widen scope without explicit approval

---

## Comments and authorship

Code comments must be professional, concise, and useful.
Do not add decorative comments.

When author attribution is explicitly requested in code headers or comments, use:
- `Author: Salvatore Privitera`

Do not spam headers in every file unless the repository adopts that convention explicitly.

---

## Expected end state

The repository must become a credible internal enterprise asset management starter platform with:
- clean schema and migrations
- maintainable FastAPI backend
- structured React frontend
- role-based access
- working asset workflows
- append-only event history
- maintenance and document handling
- reproducible local startup
- useful documentation
