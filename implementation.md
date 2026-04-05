# implementation.md

## Objective

Build **OpsAsset**, an enterprise-ready but pragmatic web application for internal asset management based on a **simplified MariaDB/MySQL schema**.

The application must be built as four clean layers:
1. **Database** → schema, indexes, seeds, migrations
2. **ORM / Persistence** → SQLAlchemy models, repositories, transaction handling
3. **Backend** → Python API, business rules, authorization, workflow orchestration
4. **Frontend** → React application for inventory and operational workflows

This is **not** a generic CRUD generator task.
The result must be a maintainable application with explicit business workflows.

---

## Single-source design decisions

These decisions are part of the implementation contract.

### Product scope decision
The first release is an **operational asset manager**, to became a full CMDB or ITAM suite.

### Architecture decision
The system must remain layered and loosely coupled:
- frontend depends on API, not DB
- backend depends on repositories/services, not UI
- ORM is a persistence adapter, not the domain contract
- DB provides persistence and integrity, not workflow orchestration

### Data model decision
Use the **simplified schema** only.
Use it as the baseline and extend incrementally for approved in-scope modules.

---

## Product scope

### In scope

#### Core asset inventory
- create asset
- update asset
- search and filter assets
- view asset details
- track asset status
- track current location
- track current assignment

#### Assignment lifecycle
- assign asset to user
- return asset
- track assignment history
- optionally update department/location during assignment if part of the workflow

#### Employees
- maintain an employee directory
- use employee records as asset assignment targets
- keep application users separate from employees when useful for operations

#### Asset requests
- create asset request
- approve asset request
- reject asset request
- track asset request status and notes

#### Event history
- write lifecycle events in `asset_event_log`
- track create, update, assign, return, status change, and location change

#### Documentation
- upload documents for an asset
- list and download documents
- delete documents with authorization checks
- store metadata in DB and file payloads via a storage abstraction

#### Maintenance
- open maintenance ticket
- update ticket
- change ticket status
- close ticket
- link ticket to asset and optional vendor

#### Access control
Application roles:
- `ADMIN`
- `ASSET_MANAGER`
- `OPERATOR`
- `VIEWER`

#### Preferences and settings
- user preferences for basic personalization
- app settings for basic operational defaults and document rules

#### Dashboard
Simple operational summary only:
- total assets
- assets by status
- assigned assets count
- open maintenance tickets count
- recent assets / recent tickets

#### Extended modules now in scope
- procurement and contracts
- software license management
- custom dynamic fields
- CMDB dependency graphs
- generic approval workflows
- external discovery agents
- advanced reporting beyond MVP dashboard

### Out of scope
- multitenancy
- SSO / IdP integration in first pass

---

## Required stack

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
- shadcn/ui (mandatory: full UI built with shadcn/ui components)
- React Hook Form
- Zod

### Database
- MariaDB preferred
- MySQL-compatible SQL where practical

### Runtime / local dev
- Docker
- docker-compose
- `.env` configuration

Prefer fewer dependencies.

---

## Target repository structure

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
        employees/
        lookups/
        maintenance/
        settings/
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

### Layer responsibilities

#### Database
Responsible for:
- schema
- indexes
- foreign keys
- unique constraints
- seed data
- migrations

#### ORM / persistence
Responsible for:
- mapping DB tables to Python classes
- repositories
- transaction boundaries
- persistence abstractions

#### Backend
Responsible for:
- business rules
- validation
- authorization
- workflows
- audit/event writing
- API contracts
- storage orchestration

#### Frontend
Responsible for:
- UI
- forms
- tables
- filters
- navigation
- API consumption only

The frontend must never depend on the database structure directly.
Do not expose ORM entities directly as API contracts.
Use `shadcn/ui` as the only UI component system for primitives and composed interface blocks.

---

## Database scope to implement

Use only these tables for MVP:
- `departments`
- `users`
- `employees`
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
- `asset_requests`
- `asset_documents`
- `maintenance_tickets`
- `user_preferences`
- `app_settings`

### Mandatory DB rules
- `users.username` unique
- `roles.code` unique
- `departments.code` unique
- `locations.code` unique
- `asset_categories.code` unique
- `asset_statuses.code` unique
- `assets.asset_tag` unique
- `user_roles (user_id, role_id)` unique
- foreign keys on all reference columns
- indexes for common filters and joins

### Business rules enforced in backend
- only one open assignment per asset at a time
- asset cannot be assigned if status is `RETIRED` or `DISPOSED`
- returning an asset closes the current assignment
- assigning an asset updates current assignee employee and status on `assets`
- changing location writes an event log entry
- changing status writes an event log entry
- creating an asset writes a `CREATE` event log entry
- asset requests move through an explicit approval workflow

Use backend services for workflow rules.
Do not rely on DB triggers for MVP business logic.

---

## Domain model expectations

### User
Internal application actor that can log in and operate the system.

### Employee
Internal person record that can receive assets and appear in operational directories and request flows.

### Role
Application authorization level.

### Department
Business ownership or organizational grouping.

### Location
Physical site, area, or nested location with parent-child support.

### Vendor
Supplier or maintenance provider.

### AssetCategory
High-level classification such as laptop, desktop, monitor, phone, printer, server.

### AssetModel
Catalog-level definition for a model.

### AssetStatus
Controlled lifecycle state.

### Asset
Primary managed object.

### AssetAssignment
Historical assignment lifecycle record.

### AssetEventLog
Immutable operational history.

### AssetRequest
Operational request for a new or reassigned asset with explicit approval state.

### AssetDocument
Metadata for uploaded files tied to an asset.

### MaintenanceTicket
Operational issue / maintenance workflow.

### UserPreference
Per-user UI and productivity preferences.

### AppSetting
Global operational defaults and document-related limits.

---

## API design requirements

Implement REST endpoints with explicit DTOs.
Do not expose ORM entities directly.

### Authentication
First-pass local auth is acceptable:
- username + password
- JWT access token
- hashed password storage

### Authorization
Enforce role-based access in backend dependencies **and** service layer where needed.

Suggested access model:
- `ADMIN` → full access
- `ASSET_MANAGER` → full asset operations, assignments, maintenance, documents, lookups
- `OPERATOR` → limited create/update operational actions
- `VIEWER` → read-only

### Minimum endpoints

#### Auth
- `POST /auth/login`
- `GET /auth/me`

#### Users and lookups
- `GET /users`
- `GET /users/{id}`
- `POST /users`
- `PUT /users/{id}`
- `GET /employees`
- `GET /employees/{id}`
- `POST /employees`
- `PUT /employees/{id}`
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

#### Asset requests
- `GET /asset-requests`
- `POST /asset-requests`
- `POST /asset-requests/{id}/approve`
- `POST /asset-requests/{id}/reject`

#### Event log
- `GET /assets/{id}/events`

#### Documents
- `GET /assets/{id}/documents`
- `POST /assets/{id}/documents`
- `GET /documents/{id}/download`
- `DELETE /documents/{id}`

#### Maintenance
- `GET /maintenance-tickets`
- `POST /maintenance-tickets`
- `GET /maintenance-tickets/{id}`
- `PUT /maintenance-tickets/{id}`
- `PATCH /maintenance-tickets/{id}/status`

#### Dashboard
- `GET /dashboard/summary`

#### Preferences and settings
- `GET /preferences/me`
- `PUT /preferences/me`
- `GET /settings/app`
- `PUT /settings/app`

### Asset filtering requirements
`GET /assets` should support:
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

## Backend implementation rules

### Code organization
Use a service-oriented backend.
Do not place business rules inside route handlers.

Expected structure:

```text
backend/app/
  api/
    routes/
  core/
    config.py
    exceptions.py
  db/
    base.py
    session.py
  models/
  repositories/
  schemas/
  security/
    auth.py
    deps.py
    passwords.py
  services/
  tests/
```

### Minimum services
- `AuthService`
- `LookupService`
- `AssetService`
- `AssignmentService`
- `AssetEventService`
- `MaintenanceTicketService`
- `DocumentService`

### Minimum repositories
- `UserRepository`
- `LookupRepository`
- `AssetRepository`
- `AssignmentRepository`
- `MaintenanceTicketRepository`
- `DocumentRepository`

### Transaction handling
These operations must be atomic:
- asset creation + initial event log
- asset assignment + asset update + event log
- asset return + asset update + event log
- asset status change + event log
- asset location change + event log
- document create/delete metadata changes

### Event logging
Centralize event creation in a reusable helper/service.
Do not duplicate event-writing logic across endpoints.

Suggested helper:
- `AssetEventService.log_event(...)`

---

## Frontend implementation rules

The frontend must be a serious business UI, not a demo.
All UI components must be built with `shadcn/ui` (full shadcn UI requirement).

### Main routes/pages
- Login
- Dashboard
- Asset List
- Asset Detail
- Asset Create/Edit
- Maintenance Ticket List
- Maintenance Ticket Detail
- Admin Users
- Lookup management pages

### Asset list requirements
- table with pagination
- search box
- filters for status/category/location and related lookups
- sortable columns where useful
- visible status badge
- row navigation to detail page
- explicit loading, empty, and error states

### Asset detail requirements
Show at least:
- general information
- current status
- current location
- current assignee
- assignment history
- event history
- documents list
- maintenance list
- actions: assign, return, change status, change location

### Forms
Use React Hook Form + Zod.
All forms must show meaningful validation and backend error states.

### Data access
Use TanStack Query for:
- data fetching
- caching
- mutations
- invalidation
- loading states
- error states

### UI standards
- desktop-first
- clear enterprise styling
- avoid visual gimmicks
- clarity over animation
- reusable table and form patterns

---

## Important business workflows

### 1. Create asset
When creating an asset:
- validate required references
- persist asset
- create `CREATE` event log entry
- return asset detail DTO

### 2. Assign asset
When assigning an asset:
- verify asset exists
- verify target employee exists
- verify asset is assignable
- verify there is no other open assignment
- create new assignment row
- update `assets.assigned_employee_id`
- update `assets.current_department_id` if part of request
- optionally update location if part of request
- set status to `ASSIGNED`
- create `ASSIGN` event log entry

### 3. Return asset
When returning an asset:
- find current open assignment
- close it by setting `returned_at`
- clear `assets.assigned_user_id`
- set status to `IN_STOCK` or other approved operational default
- create `RETURN` event log entry

### 4. Change status
When changing status:
- validate transition if transition rules exist
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
- optionally create asset lifecycle event if the workflow needs it

### 7. Asset request approval workflow
When handling an asset request:
- validate requester and optional target employee
- create request in `PENDING_APPROVAL`
- allow only authorized roles to approve or reject
- persist approval actor, notes, and timestamps
- prevent duplicate terminal actions

### 8. Upload document
When uploading a document:
- validate asset exists
- validate content type and size
- persist file via storage abstraction
- write metadata to DB
- return document DTO

---

## Suggested DTOs

Implement separate request/response models.
Examples:
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
- `DocumentResponse`
- `MaintenanceTicketCreateRequest`
- `MaintenanceTicketResponse`
- `DashboardSummaryResponse`

Do not leak internal ORM fields.

---

## File upload notes

For MVP, `asset_documents` can use **local disk storage** with an abstraction layer so storage can later be swapped to S3 or equivalent.

Requirements:
- store file metadata in DB
- enforce allowed file types if feasible
- enforce size limits
- isolate storage logic behind a small service boundary

---

## Seed data requirements

Provide initial seed data for:
- roles
- asset statuses
- common asset categories
- at least one admin user
- a base employee directory
- a few departments
- a few locations
- optionally a small set of vendors and models for demo/dev use

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

## Non-functional requirements

### Maintainability
- strong typing in backend and frontend
- clear module boundaries
- avoid circular dependencies
- keep logic out of controllers/routes

### Security
- modern password hashing
- backend authorization on all write operations
- validate uploaded file metadata
- never trust frontend role claims
- parameterized ORM queries only
- configuration from environment variables

### Observability
- practical structured logs
- backend error logging
- request correlation ID if simple to add

### Performance
- paginate lists
- avoid N+1 query problems
- add indexes for hot filters
- fetch only required fields for list views where practical

---

## Testing requirements

### Backend tests
At minimum implement tests for:
- asset creation
- asset assignment
- asset return
- status change
- asset request approval flow
- unauthorized access
- role-based restrictions
- asset filtering

### Frontend tests
At minimum implement tests for:
- login page render
- asset list render
- asset detail render
- form validation behavior

If time is limited, prioritize backend workflow tests first.

---

## Delivery order

### Phase 1: foundation
- project scaffolding
- docker-compose
- environment config
- database connection
- SQLAlchemy base setup
- Alembic setup
- frontend scaffolding

### Phase 2: schema and persistence
- migrations for core tables
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
- asset list filters
- assignment workflow
- event log
- status/location changes

### Phase 5: supporting modules
- documents
- maintenance tickets
- dashboard summary endpoint
- admin users / lookup management as needed for MVP usability

### Phase 6: polish
- validation hardening
- tests
- DX improvements
- docs

---

## Definition of done

A feature is complete only when:
1. migrations run cleanly
2. backend starts and connects to DB
3. frontend starts successfully
4. seed data loads successfully
5. login works with seeded admin
6. target workflow works end-to-end
7. relevant tests pass
8. docs are updated when behavior changes

The project milestone is complete only when:
1. `docker-compose` boots required services
2. DB migrations and seeds work from a clean environment
3. asset list page works with filters and pagination
4. asset detail page works
5. assignment and return workflows work end-to-end
6. status and location changes produce event logs
7. employee directory works
8. asset request approval workflow works
9. maintenance ticket MVP works
10. document upload/list/download/delete works
11. preferences and app settings work
12. basic tests pass
13. README explains how to run the repository

---

## Explicit do-not rules

Do not:
- build a generic admin panel and stop there
- expose raw DB tables directly to the frontend
- put business logic only in React
- put all business logic in route handlers
- use a single mega-file backend
- skip migrations
- skip seed data
- collapse assignment history into a single column on `assets`
- implement out-of-scope enterprise modules

---

## Ambiguity rule

If an implementation detail is unclear:
1. prefer the simplest maintainable solution
2. keep layering clean
3. preserve future extensibility
4. do not widen scope beyond this MVP
5. if ambiguity affects business behavior or data contracts materially, ask before proceeding
