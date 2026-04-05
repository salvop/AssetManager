# OpsAsset

OpsAsset is an internal web application for managing company assets.
It is designed as a **credible MVP starter** for enterprise use: simple enough to build and maintain, but structured enough to evolve without collapsing into a generic CRUD project.

The repository is organized around a layered architecture:
- **database** → schema, migrations, seeds
- **orm / persistence** → SQLAlchemy models and repositories
- **backend** → FastAPI, business rules, authorization, workflows
- **frontend** → React UI for operational users

This project is intentionally limited to an MVP scope focused on real workflows:
- asset inventory
- asset detail
- assignment and return
- status and location changes
- append-only event history
- documents
- maintenance tickets
- basic dashboard summaries

It does **not** aim to deliver procurement, contracts, software license management, multitenancy, or full CMDB capabilities in the first release.

---

## Repository guidance

This repository should be read with these documents together:
- `AGENTS.md` → rules for Codex and coding-agent execution
- `implementation.md` → product scope, architecture, API, workflow contract
- `docs/UI_RULES.md` → frontend visual consistency and component usage rules
- `README.md` → human-facing project overview and local setup

### Document precedence
If there is any conflict:
1. `AGENTS.md` wins for execution and coding behavior
2. `implementation.md` wins for scope and technical design
3. `README.md` must reflect the real repository state and setup

---

## Product scope

### In scope
- internal authentication
- user and lookup management required by the MVP
- asset inventory and asset detail
- create and update assets
- assignment and return workflows
- status and location changes
- append-only asset event history
- asset documents
- maintenance tickets
- simple dashboard summaries

### Out of scope
- multitenancy
- procurement and contracts
- software license management
- custom dynamic fields
- CMDB dependency graphs
- approval workflows
- external discovery agents
- advanced reporting beyond MVP dashboard

---

## Target architecture

```text
project-root/
  database/
    ddl/
    seeds/
    migrations/
  backend/
    app/
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
    alembic/
    pyproject.toml
  frontend/
    src/
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
    package.json
  docs/
  docker-compose.yml
  README.md
  AGENTS.md
  implementation.md
```

### Core rules
- frontend must consume APIs only
- backend must not expose ORM entities directly
- business workflows belong in backend services
- database is responsible for integrity, not business orchestration
- migrations are required; manual schema drift is not acceptable

---

## MVP data model

Tables in scope:
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

### Core domain rules
- only one open assignment per asset at a time
- assets in `RETIRED` or `DISPOSED` cannot be assigned
- assigning an asset updates current assignee and status
- returning an asset closes the active assignment
- asset creation, status changes, and location changes create event log entries
- event history is append-only

---

## Target stack

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
- MySQL-compatible SQL where practical

### Runtime
- Docker
- docker-compose
- `.env`

---

## Expected main API areas

- `POST /auth/login`
- `GET /auth/me`
- `GET /users`
- `GET /departments`
- `GET /locations`
- `GET /vendors`
- `GET /asset-categories`
- `GET /asset-models`
- `GET /asset-statuses`
- `GET /assets`
- `POST /assets`
- `GET /assets/{id}`
- `PUT /assets/{id}`
- `PATCH /assets/{id}/status`
- `PATCH /assets/{id}/location`
- `POST /assets/{id}/assign`
- `POST /assets/{id}/return`
- `GET /assets/{id}/assignments`
- `GET /assets/{id}/events`
- `GET /assets/{id}/documents`
- `POST /assets/{id}/documents`
- `GET /documents/{id}/download`
- `DELETE /documents/{id}`
- `GET /maintenance-tickets`
- `POST /maintenance-tickets`
- `GET /maintenance-tickets/{id}`
- `PUT /maintenance-tickets/{id}`
- `PATCH /maintenance-tickets/{id}/status`
- `GET /dashboard/summary`

For full implementation detail, use `implementation.md` as the source of truth.

---

## Local development

### 1. Environment
Create a local environment file from the example:

```bash
cp .env.example .env
```

Set at least:
- database connection values
- backend secret key
- document storage path

### 2. Start supporting services

```bash
docker compose up -d db
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:
- `VITE_HELPDESK_EMAIL` → support email used by the login "Problemi di accesso?" link

Example `frontend/.env`:

```env
VITE_HELPDESK_EMAIL=support@fidesspa.eu
```

Note: if `localStorage["opsasset.login.supportEmail"]` is set in the browser, that preference overrides `VITE_HELPDESK_EMAIL`.

---

## Minimum validation checklist

Before treating the repository as usable:
- migrations run cleanly
- seed data loads cleanly
- backend starts and connects to DB
- frontend starts successfully
- login works with a seeded admin user
- asset list works with pagination and filters
- asset detail works
- assignment and return work end-to-end
- status/location changes write event logs
- maintenance ticket MVP works
- document upload/list/download/delete works

---

## Development principles

- prefer explicit code over clever abstractions
- keep layers clean
- avoid scope creep
- do not expose DB structures directly to the frontend
- do not place business logic only in route handlers or React components
- keep the MVP small but solid

The correct version of this project is not the biggest one.
It is the one the team can understand, test, operate, and extend safely.
