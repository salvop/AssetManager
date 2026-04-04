# Asset Manager

Piattaforma interna per la gestione degli asset aziendali, pensata come base solida per un MVP enterprise credibile, mantenibile e facilmente estendibile.

Il progetto non nasce come generatore CRUD generico: l'obiettivo e modellare workflow reali di inventario, assegnazione, tracciamento storico, documentazione e manutenzione.

## Obiettivo del progetto

L'applicazione deve consentire di:

- censire gli asset aziendali
- sapere dove si trovano
- sapere a chi sono assegnati
- tracciare i cambi di stato e di sede
- conservare storico assegnazioni ed eventi
- allegare documenti agli asset
- gestire ticket manutenzione
- applicare controlli di accesso per ruolo

Questa prima fase e volutamente limitata a un MVP operativo. Non punta ancora a coprire procurement, license management, multitenancy o moduli enterprise avanzati fuori scope.

## Scope MVP

Funzionalita previste in questa fase:

- autenticazione utenti interni
- gestione lookup di supporto
- inventario asset
- dettaglio asset
- creazione e modifica asset
- workflow di assegnazione e rientro
- cambio stato asset
- cambio sede asset
- storico eventi append-only
- documenti asset
- ticket manutenzione
- dashboard operativa
- gestione utenti e ruoli lato admin

Fuori scope in questa fase:

- multitenancy
- procurement e contratti
- software asset management
- campi dinamici custom
- CMDB e dipendenze tra componenti
- approval workflow
- discovery agent esterni
- reportistica avanzata oltre la dashboard MVP

## Stato attuale

Attualmente il repository contiene una base funzionante e gia verificata per:

- runtime locale con Docker, MariaDB, backend FastAPI e frontend React/Vite
- migrazioni Alembic iniziali
- seed di anagrafiche e dati demo realistici
- login con JWT e ruoli applicativi
- lista asset con filtri
- dettaglio asset
- create/edit asset
- assegnazione e rientro asset
- storico assegnazioni
- log eventi asset
- gestione ticket manutenzione
- gestione documenti con upload, download ed eliminazione
- gestione lookup con create, update e delete sicuro
- gestione utenti e ruoli da UI admin
- dashboard con KPI, asset recenti e ticket recenti

Verifiche eseguite di recente:

- `pytest -q`: test backend verdi
- `npm run build`: build frontend verde
- migrazioni e seed eseguiti correttamente

## Funzionalita implementate

### 1. Autenticazione e autorizzazione

Supporto presente:

- login con username e password
- password hashate
- token JWT access
- endpoint `POST /auth/login`
- endpoint `GET /auth/me`
- ruoli applicativi:
  - `ADMIN`
  - `ASSET_MANAGER`
  - `OPERATOR`
  - `VIEWER`

Regole principali:

- i controlli di accesso sono applicati lato backend
- il frontend non decide i permessi reali
- le operazioni di scrittura sono limitate in base al ruolo

### 2. Inventario asset

Funzionalita disponibili:

- lista asset con paginazione
- ricerca testuale
- filtri per stato, categoria, modello, sede, dipartimento, utente assegnato e vendor
- ordinamento
- dettaglio completo asset
- creazione asset
- modifica asset

Informazioni esposte nel dettaglio:

- tag asset
- nome
- seriale
- categoria
- modello
- vendor
- stato
- sede
- dipartimento corrente
- assegnatario corrente
- descrizione
- data acquisto

### 3. Workflow assegnazione

Workflow supportati:

- assegnazione asset a utente
- rientro asset
- storico assegnazioni

Regole di dominio implementate:

- un solo assignment aperto per asset
- impossibile assegnare asset in stato `RETIRED` o `DISPOSED`
- l'assegnazione aggiorna utente assegnato e stato asset
- il rientro chiude l'assegnazione attiva

### 4. Stato e sede asset

Operazioni disponibili:

- cambio stato asset
- cambio sede asset

Effetti automatici:

- scrittura evento `STATUS_CHANGE`
- scrittura evento `LOCATION_CHANGE`

### 5. Storico eventi

L'app mantiene uno storico append-only degli eventi asset.

Eventi attualmente registrati:

- `CREATE`
- `UPDATE`
- `ASSIGN`
- `RETURN`
- `STATUS_CHANGE`
- `LOCATION_CHANGE`
- `MAINTENANCE_OPEN`
- `MAINTENANCE_STATUS_CHANGE`

### 6. Documenti asset

Funzionalita gia presenti:

- upload documento su asset
- lista documenti asset
- metadati documento
- download documento
- eliminazione documento

Vincoli implementati:

- tipi file consentiti limitati
- limite dimensione file
- metadata persistiti a database
- storage locale su file system con path configurabile

### 7. Ticket manutenzione

Funzionalita disponibili:

- lista ticket manutenzione
- dettaglio ticket
- apertura ticket
- update ticket
- cambio stato ticket
- vista ticket collegati a un asset
- apertura ticket direttamente dalla scheda asset

Stati manutenzione gestiti:

- `OPEN`
- `IN_PROGRESS`
- `CLOSED`

### 7.b Notifiche email

Funzionalita disponibili:

- notifiche email SMTP opzionali
- invio best-effort, senza bloccare i workflow se il server mail non risponde
- supporto destinatari di default configurabili

Eventi attualmente notificati:

- assegnazione asset
- rientro asset
- apertura ticket manutenzione
- cambio stato ticket manutenzione

### 8. Lookup management

Lookup gestiti:

- dipartimenti
- sedi
- fornitori
- categorie asset
- modelli asset

Funzionalita disponibili:

- create
- update
- delete

Regole di sicurezza dati:

- eliminazione bloccata se il lookup e gia in uso
- messaggi di conflitto espliciti invece di errori DB generici

### 9. Gestione utenti

Funzionalita admin disponibili:

- lista utenti interni
- creazione utente
- modifica utente
- attivazione/disattivazione
- assegnazione ruoli
- associazione dipartimento

La sezione e visibile in UI solo agli utenti `ADMIN`.

### 10. Dashboard operativa

La dashboard attuale mostra:

- numero totale asset
- numero asset assegnati
- numero asset in manutenzione
- numero ticket manutenzione aperti
- distribuzione asset per stato
- asset recenti
- ticket aperti recenti
- collegamenti rapidi ai flussi principali

## Architettura

Il sistema e organizzato in quattro layer principali.

### Database

Responsabile di:

- schema MariaDB/MySQL
- foreign key
- vincoli univoci
- indici
- seed data
- migrazioni

### ORM / Persistence

Responsabile di:

- modelli SQLAlchemy
- repository
- query composition
- gestione transazioni

### Backend

Responsabile di:

- business rules
- validazione
- autorizzazione
- orchestrazione workflow
- scrittura event log
- API REST

### Frontend

Responsabile di:

- UI
- form
- tabelle
- filtri
- navigazione
- consumo API

Regola fondamentale:

- il frontend non dipende direttamente dalla struttura del database
- il backend non espone entity ORM raw come contratto pubblico

## Struttura repository

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
      api/
      components/
      features/
      hooks/
      lib/
      pages/
      routes/
      types/
    package.json
  docs/
  docker-compose.yml
  implementation.md
  AGENTS.md
```

## Stack tecnologico

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
- React Hook Form
- Zod

### Database

- MariaDB
- SQL MySQL-compatible dove possibile

### Runtime

- Docker
- Docker Compose
- `.env`

## Data model MVP

Tabelle attualmente in scope:

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

## Regole di dominio

Regole gia implementate o previste come vincolo fisso del progetto:

- un solo assignment aperto per asset
- impossibile assegnare asset `RETIRED` o `DISPOSED`
- assegnazione aggiorna assignee e stato corrente su `assets`
- rientro chiude l'assegnazione aperta
- creazione asset genera un evento
- cambio stato genera un evento
- cambio sede genera un evento
- storico eventi append-only

## API principali

### Auth

- `POST /auth/login`
- `GET /auth/me`

### Utenti

- `GET /users`
- `GET /users/{id}`
- `GET /users/roles`
- `POST /users`
- `PUT /users/{id}`

### Lookup

- `GET /departments`
- `POST /departments`
- `PUT /departments/{id}`
- `DELETE /departments/{id}`
- `GET /locations`
- `POST /locations`
- `PUT /locations/{id}`
- `DELETE /locations/{id}`
- `GET /vendors`
- `POST /vendors`
- `PUT /vendors/{id}`
- `DELETE /vendors/{id}`
- `GET /asset-categories`
- `POST /asset-categories`
- `PUT /asset-categories/{id}`
- `DELETE /asset-categories/{id}`
- `GET /asset-models`
- `POST /asset-models`
- `PUT /asset-models/{id}`
- `DELETE /asset-models/{id}`
- `GET /asset-statuses`

### Asset

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

### Documenti

- `GET /documents/{id}/download`
- `DELETE /documents/{id}`

### Manutenzione

- `GET /maintenance-tickets`
- `POST /maintenance-tickets`
- `GET /maintenance-tickets/{id}`
- `GET /maintenance-tickets/by-asset/{asset_id}`
- `PUT /maintenance-tickets/{id}`
- `PATCH /maintenance-tickets/{id}/status`

### Dashboard

- `GET /dashboard/summary`

## Interfaccia utente

Pagine attualmente presenti:

- login
- dashboard operativa
- lista asset
- dettaglio asset
- create/edit asset
- storico assegnazioni
- lista ticket manutenzione
- dettaglio ticket manutenzione
- gestione tabelle lookup
- gestione utenti e ruoli

## Dati demo / seed

Lo script seed carica:

- ruoli base
- stati asset
- categorie asset
- dipartimenti
- sedi
- vendor
- modelli asset
- utenti interni
- asset demo
- assegnazioni demo
- ticket manutenzione demo
- eventi demo
- documenti demo

Utenti seedati utili:

- `admin` / `admin123`
- `asset.manager` / `manager123`
- `operator` / `operator123`
- `viewer` / `viewer123`

## Avvio locale

### 1. Configurazione ambiente

Dal root del progetto:

```powershell
Copy-Item .env.example .env
```

Imposta una `SECRET_KEY` lunga nel file `.env`.

Se vuoi attivare le email, configura anche:

```env
NOTIFICATION_EMAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=asset-manager@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=asset-manager@example.com
SMTP_FROM_NAME=Asset Manager
SMTP_USE_STARTTLS=true
SMTP_USE_SSL=false
NOTIFICATION_DEFAULT_RECIPIENTS=it-ops@example.com,asset-team@example.com
```

### 2. Avvio database con Docker

```powershell
docker compose up -d db
```

Se esegui il backend dal tuo host Windows, usa in `.env`:

```env
DATABASE_URL=mysql+pymysql://asset_user:asset_password@127.0.0.1:3306/asset_manager
```

### 3. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload
```

Backend disponibile su:

- [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend disponibile su:

- [http://localhost:5173](http://localhost:5173)

## Test e verifica

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

Copertura minima gia presente per:

- accesso non autenticato
- restrizioni ruolo
- creazione asset
- assegnazione asset
- rientro asset
- cambio stato
- filtri asset
- lookup create/update/delete
- create user
- dashboard summary
- download documenti

### Frontend

```powershell
cd frontend
npm run build
```

Al momento e verificata la build di produzione. La suite di test frontend automatica puo essere estesa in una fase successiva.

## Documenti e storage

I documenti asset sono salvati su file system locale tramite `DOCUMENT_STORAGE_PATH`.

Attualmente:

- i metadata restano nel DB
- i file sono salvati su disco
- il download avviene via endpoint backend

Questa scelta e intenzionale per il MVP e lascia spazio a un futuro passaggio verso S3 o storage equivalente.

## Sicurezza

Scelte gia presenti:

- password hashate
- JWT lato backend
- permessi verificati server-side
- input validati
- query ORM parameterizzate
- upload file limitato per tipo e dimensione
- configurazione via environment variables

Nota:

- conviene sostituire in `.env` il valore di `SECRET_KEY` con una chiave lunga, per evitare warning JWT e avere una configurazione locale piu realistica

## Roadmap prevista

Feature utili previste come prossimi step:

- timeline asset piu leggibile e adatta ad audit operativo
- filtri inventario ancora piu avanzati
- migliore UX documenti e gestione file
- dashboard con viste su scadenze, rientri attesi e ticket critici
- test frontend automatici
- miglioramento logging e correlazione richieste
- maggiore rifinitura dei permessi applicativi

Estensioni fuori MVP ma plausibili in fasi successive:

- warranty tracking
- procurement e contratti
- inventari fisici e riconciliazione
- software/license management
- integrazioni ERP, identity provider, ticketing
- reporting avanzato

Per una vista piu completa e ordinata della roadmap funzionale, vedi anche:

- [docs/roadmap.md](C:/Users/salvo/Desktop/asset/docs/roadmap.md)

## Regole di progetto

Il repository va interpretato insieme a:

- [implementation.md](C:/Users/salvo/Desktop/asset/implementation.md)
- [AGENTS.md](C:/Users/salvo/Desktop/asset/AGENTS.md)

In caso di dubbio:

- preferire la soluzione piu semplice e mantenibile
- mantenere netti i confini tra i layer
- non allargare lo scope oltre il MVP senza decisione esplicita

## Stato finale atteso

L'obiettivo del repository e diventare una base credibile per un vero starter interno di Asset Management, con:

- schema pulito e versionato
- backend FastAPI mantenibile
- frontend React strutturato
- workflow reali e non simulati
- accesso per ruolo
- setup riproducibile in locale
- documentazione chiara

La versione giusta non e la piu grande: e quella che il team riesce a capire, testare, usare e far crescere senza perdere controllo.
