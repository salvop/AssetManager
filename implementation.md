# IMPLEMENTATION.md

## Objective

Build an enterprise-ready but pragmatic **Asset Manager** web application based on the simplified data model already defined for MariaDB/MySQL.

The application must be structured in four clear layers:

1. **Database**: MariaDB/MySQL schema, migrations, seed data.
2. **ORM / Persistence**: SQLAlchemy models, repositories, transaction handling.
3. **Backend**: Python API with business logic and role-based authorization.
4. **Frontend**: React application for inventory, assignments, maintenance, and reporting.

This is **not** a generic CRUD generator task. The result must be a maintainable, layered application with explicit domain workflows.

---

## Product Scope

The first release must cover these business capabilities:

### Core asset inventory
- Create and update assets
- Search and filter assets
- View asset details
- Track asset status
- Track current location
- Track current assignment

### Assignment lifecycle
- Assign asset to a user
- Return asset
- Move asset between locations/departments
- Keep assignment history

### Event history
- Track important lifecycle events in `asset_event_log`
- Track create, update, assign, return, status change, and location change

### Documentation
- Upload and list documents for an asset
- Support basic metadata for documents

### Maintenance
- Open maintenance tickets
- Update ticket status
- Close ticket
- Link ticket to vendor and asset

### Access control
- Application roles:
  - `ADMIN`
  - `ASSET_MANAGER`
  - `OPERATOR`
  - `VIEWER`

Do **not** implement advanced procurement, software license management, multitenancy, CMDB dependencies, or custom dynamic fields in this phase.

---

## Target Architecture

Use this structure.

```text
project-root/
  database/
    ddl/
    seeds/
    migrations/
  backend/
    app/
      api/
      core/
      domain/
      services/
      repositories/
      db/
      schemas/
      models/
      security/
      tests/
    alembic/
    pyproject.toml
  frontend/
    src/
      app/
      api/
      components/
      features/
      pages/
      hooks/
      lib/
      types/
      routes/
    package.json
  docs/
  docker-compose.yml
  README.md
```

### Layer responsibilities

#### Database
Responsible for:
- schema
- indexes
- foreign keys
- unique constraints
- seed data
- migrations

#### ORM / Persistence
Responsible for:
- SQLAlchemy models
- mapping DB tables to Python classes
- repository implementations
- unit-of-work / transaction boundaries

#### Backend
Responsible for:
- business rules
- validation
- authorization
- workflows
- audit/event writing
- API contracts

#### Frontend
Responsible for:
- UI
- forms
- tables
- filters
- navigation
- optimistic UX where safe
- consuming the API only

The frontend must never depend on database structure directly.

---

## Required Technology Choices

Use the following stack unless there is a strong technical reason not to:

### Backend
- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic v2
- Uvicorn
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

### Dev / Ops
- Docker and docker-compose
- `.env` based configuration

If a package is optional, prefer fewer dependencies.

---

## Database Scope to Implement

Use the simplified schema already designed. The following tables are in scope:

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

### Mandatory DB rules

Implement and respect these constraints:

- `users.username` unique
- `roles.code` unique
- `departments.code` unique
- `locations.code` unique
- `asset_categories.code` unique
- `asset_statuses.code` unique
- `assets.asset_tag` unique
- `user_roles (user_id, role_id)` unique
- foreign keys on all reference columns
- reasonable indexes for filters and joins

### Business constraints enforced in backend logic

At minimum:
- only one open assignment per asset at a time
- asset cannot be assigned if status is `RETIRED` or `DISPOSED`
- returning an asset closes the current assignment
- assigning an asset updates current status and current assignee on `assets`
- changing location creates an event log entry
- changing status creates an event log entry
- creating an asset creates an event log entry

Use backend logic for workflow rules, not DB triggers, unless strictly needed.

---

## Domain Model Expectations

The system is centered on these concepts:

### User
Represents an internal actor that can log in and/or receive assets.

### Role
Represents application authorization level.

### Department
Represents business ownership or organizational grouping.

### Location
Represents a physical site, area, or nested location. Keep support for parent-child hierarchy.

### Vendor
Represents supplier or maintenance provider.

### AssetCategory
High-level classification: laptop, desktop, monitor, server, phone, etc.

### AssetModel
Catalog record for model definition.

### AssetStatus
Controlled lifecycle state.

### Asset
Primary managed object.

### AssetAssignment
Historical record of assignment lifecycle.

### AssetEventLog
Immutable operational history.

### AssetDocument
Metadata for uploaded files tied to an asset.

### MaintenanceTicket
Operational issue / maintenance workflow.

---

## API Design Requirements

Implement REST API endpoints with clear DTOs. Do not expose ORM entities directly.

### Authentication
You may start with a simple local authentication model suitable for internal business apps:
- username + password
- JWT access token
- hashed password storage

If full auth is not completed in the first pass, scaffold it cleanly and protect the architecture for later completion.

### Authorization
Enforce role-based access in backend route dependencies and service layer.

Suggested access model:
- `ADMIN`: full access
- `ASSET_MANAGER`: full asset operations, assignments, maintenance, documents
- `OPERATOR`: limited create/update operations on assets, assignments, maintenance, documents
- `VIEWER`: read-only

### Minimum endpoints

#### Auth
- `POST /auth/login`
- `GET /auth/me`

#### Users and lookup data
- `GET /users`
- `GET /users/{id}`
- `GET /departments`
- `GET /locations`
- `GET /vendors`
- `GET /asset-categories`
- `GET /asset-models`
- `GET /asset-statuses`

#### Assets
- `GET /assets`
- `POST /assets`
- `GET /assets/{id}`
- `PUT /assets/{id}`
- `PATCH /assets/{id}/status`
- `PATCH /assets/{id}/location`

#### Assignment workflow
- `POST /assets/{id}/assign`
- `POST /assets/{id}/return`
- `GET /assets/{id}/assignments`

#### Event log
- `GET /assets/{id}/events`

#### Documents
- `GET /assets/{id}/documents`
- `POST /assets/{id}/documents`
- `DELETE /documents/{id}`

#### Maintenance
- `GET /maintenance-tickets`
- `POST /maintenance-tickets`
- `GET /maintenance-tickets/{id}`
- `PUT /maintenance-tickets/{id}`
- `PATCH /maintenance-tickets/{id}/status`

### Filtering requirements for `GET /assets`

Support these query parameters where relevant:
- `search`
- `status_id`
- `category_id`
- `model_id`
- `location_id`
- `department_id`
- `assigned_user_id`
- `vendor_id`
- `page`
- `page_size`
- `sort_by`
- `sort_dir`

Return paginated results.

---

## Backend Implementation Rules

### Code organization
Use a service-oriented backend, not route-level business logic.

Expected structure:

```text
backend/app/
  api/
    routes/
  core/
    config.py
    exceptions.py
  db/
    session.py
    base.py
  models/
    *.py
  schemas/
    *.py
  repositories/
    *.py
  services/
    *.py
  security/
    auth.py
    passwords.py
    deps.py
  tests/
```

### Mandatory service classes
Implement at least:
- `AssetService`
- `AssignmentService`
- `MaintenanceTicketService`
- `LookupService`
- `AuthService`

### Repository usage
Use repository classes to isolate persistence details.

At minimum:
- `AssetRepository`
- `AssignmentRepository`
- `UserRepository`
- `LookupRepository`
- `MaintenanceTicketRepository`

### Transaction handling
Complex operations must be atomic.

Examples:
- asset assignment
- asset return
- status change with event log
- asset creation with initial event log

### Event logging
Centralize event creation in a reusable helper or service.
Do not duplicate event-writing logic across endpoints.

Suggested helper:
- `AssetEventService.log_event(...)`

---

## Frontend Implementation Rules

The frontend must be a serious business UI, not a demo.

### Main sections
Implement these pages:
- Login
- Dashboard
- Asset List
- Asset Detail
- Asset Create/Edit
- Assignment History
- Maintenance Ticket List
- Maintenance Ticket Detail
- Lookup Management placeholder pages if needed

### Asset List requirements
- table with pagination
- filters sidebar or toolbar
- search box
- status/category/location filters
- clickable rows to detail page
- visible badge for status

### Asset Detail requirements
Show at least:
- general information
- current status
- current location
- current assignee
- assignment history
- event history
- documents list
- maintenance tickets list
- actions: assign, return, change status, change location

### Forms
Use React Hook Form + Zod.
Provide client validation and meaningful server error display.

### Data access
Use TanStack Query for:
- caching
- mutations
- invalidation
- loading states
- error states

### UI standards
- clean enterprise styling
- responsive but desktop-first
- avoid visual gimmicks
- favor clarity over animation

---

## Important Business Workflows

### 1. Create asset
When creating an asset:
- validate required references
- persist asset
- create `CREATE` event log entry
- return asset detail DTO

### 2. Assign asset
When assigning an asset:
- verify asset exists
- verify target user exists
- verify asset is assignable
- close any invalid previous open assignment if necessary only through explicit controlled logic
- create new assignment row
- update `assets.assigned_user_id`
- update `assets.current_department_id` if supplied
- optionally update location
- set status to `ASSIGNED`
- create `ASSIGN` event log entry

### 3. Return asset
When returning an asset:
- find current open assignment
- set `returned_at`
- clear `assets.assigned_user_id`
- set status to `IN_STOCK` or another agreed operational status
- create `RETURN` event log entry

### 4. Change status
When changing status:
- validate transition
- update asset
- create `STATUS_CHANGE` event with old/new values

### 5. Change location
When changing location:
- update asset
- create `LOCATION_CHANGE` event with old/new values

### 6. Open maintenance ticket
When opening a ticket:
- validate asset and optional vendor
- create ticket
- create optional asset event if linked to asset lifecycle history

---

## Suggested DTOs

Implement separate request/response models.

### Examples
- `LoginRequest`
- `LoginResponse`
- `AssetCreateRequest`
- `AssetUpdateRequest`
- `AssetListItemResponse`
- `AssetDetailResponse`
- `AssetAssignRequest`
- `AssetReturnRequest`
- `AssetStatusChangeRequest`
- `AssetLocationChangeRequest`
- `AssetEventResponse`
- `MaintenanceTicketCreateRequest`
- `MaintenanceTicketResponse`

Do not leak internal ORM fields.

---

## Non-Functional Requirements

### Maintainability
- strong typing in backend and frontend
- clear file/module boundaries
- avoid circular dependencies
- keep logic out of controllers/routes

### Security
- hash passwords with a modern algorithm
- validate authorization on write operations
- validate uploaded file metadata
- never trust frontend role claims
- sanitize and validate all inputs
- use parameterized ORM queries only

### Observability
- structured application logs
- error logging in backend
- request correlation ID if practical

### Performance
- paginate large lists
- avoid N+1 query problems
- add indexes for hot filters
- select only required columns for list views where practical

---

## Testing Requirements

### Backend tests
At minimum implement tests for:
- asset creation
- asset assignment
- asset return
- status change
- unauthorized access
- role-based access restrictions
- asset list filtering

### Frontend tests
At minimum implement basic tests for:
- login page rendering
- asset list rendering
- asset detail rendering
- form validation behavior

If full frontend test coverage is not reached, prioritize backend workflow tests first.

---

## Seed Data Requirements

Provide initial seed data for:
- roles
- asset statuses
- common asset categories
- at least one admin user
- a few departments
- a few locations

Suggested statuses:
- `IN_STOCK`
- `ASSIGNED`
- `MAINTENANCE`
- `RETIRED`
- `DISPOSED`

Suggested categories:
- `LAPTOP`
- `DESKTOP`
- `MONITOR`
- `PHONE`
- `PRINTER`
- `SERVER`

---

## Delivery Order

Implement in this order.

### Phase 1: foundation
- project scaffolding
- docker-compose
- environment config
- database connection
- SQLAlchemy base setup
- Alembic setup
- frontend scaffolding

### Phase 2: schema and persistence
- migrations for all core tables
- ORM models
- repository layer
- seed data

### Phase 3: auth and security
- login flow
- password hashing
- JWT
- role dependency checks

### Phase 4: core asset workflows
- asset CRUD
- list filters
- assignment workflow
- event log
- location/status update

### Phase 5: supporting modules
- documents
- maintenance tickets
- dashboard summary endpoints

### Phase 6: polish
- validation hardening
- tests
- DX improvements
- README

---

## Dashboard Expectations

Implement a basic dashboard endpoint and frontend page showing:
- total assets
- assets by status
- assigned assets
- maintenance open tickets
- recently updated assets

Keep this simple but useful.

---

## File Upload Notes

For `asset_documents`, the first implementation can use local disk storage with an abstraction so storage can later be swapped to S3 or another backend.

Requirements:
- store file metadata in DB
- enforce allowed file types if feasible
- enforce size limits
- keep storage abstraction simple

---

## Coding Standards

### General
- prefer explicit code over magic
- keep functions small and named by business intent
- avoid over-engineering
- no premature abstraction without repeated need

### Backend
- use type hints
- use docstrings sparingly where value exists
- handle domain errors with explicit exceptions
- return consistent API error shapes

### Frontend
- feature-based folder grouping is acceptable
- avoid giant page components
- extract forms and table components when reused

---

## Definition of Done

This task is done only when all these are true:

1. project boots locally with docker-compose
2. backend starts successfully and connects to DB
3. frontend starts successfully
4. database migrations run cleanly
5. seed data loads cleanly
6. login works with seeded admin user
7. asset list page works with filters and pagination
8. asset detail page works
9. assignment and return workflows work end-to-end
10. status and location changes produce event logs
11. maintenance ticket CRUD works at MVP level
12. basic tests pass
13. README explains how to run the project

---

## Explicit Do-Not Rules

Do **not**:
- build a generic admin panel and stop there
- expose raw DB tables directly to the frontend
- put business logic only in React
- put all business logic in route handlers
- use a single mega-file backend
- skip migrations
- skip seed data
- collapse assignment history into a single column on `assets`
- implement unnecessary advanced modules outside scope

---

## If Ambiguity Appears

If there is an unclear implementation choice:
1. prefer the simplest maintainable solution
2. keep layering clean
3. preserve future extensibility
4. do not widen scope beyond the MVP described here

---

## Final Expected Output

The final result must be a working repository containing:
- database migrations
- backend API
- frontend app
- seed scripts
- tests
- Docker setup
- documentation

The application must be credible as an internal enterprise asset management starter platform.
