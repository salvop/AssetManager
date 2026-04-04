# Roadmap Funzionale

Questo documento raccoglie la visione estesa del progetto `Asset Manager` e la organizza per priorita e fasi di rilascio.

L'obiettivo non e implementare tutto subito, ma dare una direzione chiara al prodotto, distinguendo bene:

- cosa rientra nell'MVP
- cosa ha senso come `Phase 2`
- cosa appartiene a una fase enterprise piu avanzata

## Principi guida

La roadmap segue questi criteri:

- prima i workflow operativi realmente usabili
- poi il consolidamento gestionale
- infine le integrazioni e i moduli enterprise ad alta complessita

Il progetto non deve trasformarsi troppo presto in:

- una CMDB completa
- una suite SAM/ITAM totale
- un sistema ERP
- un motore genericissimo di workflow configurabili

## Fase 1: MVP operativo

Questa fase e il perimetro attuale o immediatamente adiacente al perimetro gia costruito.

### 1. Asset Registry

Obiettivo:

- anagrafica centrale degli asset
- ricerca, filtro e consultazione rapida

Funzionalita:

- nome asset
- tipo / categoria
- marca e modello
- seriale
- stato asset
- sede e collocazione base
- documenti allegati

Stato:

- in gran parte implementato

### 2. Assegnazione e ownership

Obiettivo:

- sapere sempre chi usa un asset e chi ne e responsabile

Funzionalita:

- assegnazione a utente
- collegamento a dipartimento
- storico assegnazioni
- rientro asset

Stato:

- implementato

### 3. Lifecycle operativo base

Obiettivo:

- gestire i passaggi essenziali del ciclo di vita

Funzionalita:

- creazione asset
- modifica asset
- cambio stato
- cambio sede
- log eventi

Stato:

- implementato

### 4. Documenti

Obiettivo:

- conservare file utili direttamente sull'asset

Funzionalita:

- upload documenti
- lista documenti
- download
- eliminazione

Stato:

- implementato

### 5. Manutenzione base

Obiettivo:

- aprire e seguire ticket collegati agli asset

Funzionalita:

- apertura ticket
- update ticket
- cambio stato ticket
- storico ticket per asset

Stato:

- implementato

### 6. Dashboard operativa

Obiettivo:

- dare una home page utile a chi lavora ogni giorno sul sistema

Funzionalita:

- KPI principali
- distribuzione asset per stato
- ticket aperti recenti
- asset recenti

Stato:

- implementato

### 7. Governance base

Obiettivo:

- controllare chi puo fare cosa

Funzionalita:

- ruoli base
- permessi per lettura e scrittura
- gestione utenti lato admin

Stato:

- implementato in forma MVP

## Fase 2: consolidamento gestionale

Questa e la fase consigliata subito dopo l'MVP. Aggiunge molto valore senza far esplodere la complessita architetturale.

### 1. Asset Registry avanzato

Funzionalita:

- classificazione gerarchica piu ricca
- location fisica dettagliata:
  - sede
  - piano
  - stanza
  - rack
  - slot
- foto asset
- documentazione piu strutturata

Valore:

- migliora inventario reale e gestione fisica

### 2. Relazioni e dipendenze leggere

Funzionalita:

- assegnazione a reparto
- assegnazione a cost center
- relazioni semplici tra asset
  - esempio: server collegato a switch o UPS

Valore:

- aggiunge contesto senza arrivare subito a una CMDB completa

### 3. Dati tecnici di configurazione

Funzionalita:

- IP
- hostname
- sistema operativo
- software installati

Valore:

- rende il sistema piu utile per IT operations

Nota:

- questa parte va introdotta in modo incrementale, senza trasformare il modello in una piattaforma configurabile troppo generica

### 4. Lifecycle management esteso

Funzionalita:

- data acquisto
- scadenza garanzia
- fine vita prevista
- data dismissione
- workflow dismissione con audit piu forte

Valore:

- aiuta pianificazione e rinnovi

### 5. Manutenzione evoluta

Funzionalita:

- contratti di manutenzione associati
- SLA base
- storico interventi
- upgrade e riparazioni tracciate
- manutenzione preventiva pianificata

Valore:

- sposta il modulo manutenzione da “ticket base” a “storico tecnico”

### 6. Reporting operativo

Funzionalita:

- asset inutilizzati
- asset non assegnati
- scadenze imminenti
- esportazione Excel/PDF
- report per sede, reparto e categoria

Valore:

- migliora il valore gestionale del sistema

### 7. Notifiche e accountability

Funzionalita:

- notifiche automatiche per scadenze
- alert su manutenzioni e garanzie
- ownership chiara per asset
- audit trail piu leggibile

Valore:

- aumenta la capacita di controllo operativo

## Fase 3: enterprise estesa

Questa fase va affrontata solo dopo che l'MVP e la `Phase 2` sono stabili.

### 1. Relazioni complesse e topologia

Funzionalita:

- relazioni tra asset complesse
- topologia visuale
- dipendenze infrastrutturali

Esempi:

- server -> switch -> UPS
- host -> VM -> storage

Rischio:

- alto impatto su modello dati, UX e manutenzione del codice

### 2. Procurement e workflow approvativi

Funzionalita:

- richiesta acquisto
- approvazione
- ordine
- consegna
- presa in carico

Rischio:

- aumenta molto la complessita di processo

### 3. SAM / License & Software Management

Funzionalita:

- licenze software
- tipo licenza
- quantita
- scadenza
- riconciliazione tra licenze e installazioni
- compliance trail

Rischio:

- richiede regole e integrazioni molto piu complesse

### 4. Financial Management

Funzionalita:

- costo di acquisto
- valore attuale
- TCO
- budget per categoria o reparto
- costi ricorrenti
- report spesa

Rischio:

- tocca logiche contabili e di reporting piu profonde

### 5. Sicurezza e compliance

Funzionalita:

- classificazione criticita e riservatezza
- patch status
- vulnerability tracking
- integrazione SIEM / endpoint protection
- log accessi fisici e logici
- conformita ISO 27001, GDPR, NIS2

Rischio:

- richiede integrazioni e requisiti molto piu rigidi

### 6. Integrazioni enterprise

Funzionalita:

- discovery automatico
- AD / LDAP
- ERP / contabilita
- HR system
- cloud provider
- API REST custom per integrazioni

Rischio:

- richiede progettazione dedicata di integrazione e sincronizzazione dati

### 7. Governance avanzata

Funzionalita:

- RBAC granulare
- workflow approvativi configurabili
- SLA e accountability per asset
- audit completo di ogni modifica

Rischio:

- forte incremento di complessita applicativa

## Mappa sintetica per macro-area

### 1. Asset Registry

MVP:

- anagrafica completa base
- stato asset
- location base
- documenti

Phase 2:

- gerarchia piu ricca
- foto
- location fisica dettagliata

Enterprise:

- classificazioni estese e modello piu evoluto

### 2. Relazioni e Dipendenze

MVP:

- assegnazione utente e dipartimento

Phase 2:

- cost center
- relazioni leggere tra asset

Enterprise:

- topologia visuale e dipendenze complesse

### 3. Lifecycle Management

MVP:

- create/update
- stato
- location
- storico eventi

Phase 2:

- garanzia
- fine vita
- dismissione estesa

Enterprise:

- procurement e workflow approvativi completi

### 4. Manutenzione e Supporto

MVP:

- ticket base

Phase 2:

- contratti
- SLA
- manutenzione preventiva
- storico interventi

Enterprise:

- integrazione GLPI, Jira, ServiceNow

### 5. License & Software Management

MVP:

- fuori scope

Phase 2:

- software installati come dato tecnico base

Enterprise:

- SAM completo e riconciliazione licenze

### 6. Financial Management

MVP:

- fuori scope

Phase 2:

- cost center e qualche dato economico base

Enterprise:

- TCO, budget, ammortamento, costi ricorrenti

### 7. Sicurezza e Compliance

MVP:

- RBAC base
- audit operativo base

Phase 2:

- criticita asset
- audit piu forte

Enterprise:

- SIEM, patching, vulnerabilita, compliance estesa

### 8. Reporting e Dashboard

MVP:

- KPI base
- asset recenti
- ticket recenti

Phase 2:

- scadenze
- esportazione
- report operativi

Enterprise:

- report schedulati e analytics avanzate

### 9. Integrazioni

MVP:

- API REST interne

Phase 2:

- preparazione modello per future integrazioni

Enterprise:

- AD/LDAP, ERP, HR, cloud, discovery

### 10. Governance e Workflow

MVP:

- ruoli base
- permessi principali

Phase 2:

- notifiche e alert
- accountability piu forte

Enterprise:

- RBAC granulare
- approval workflow configurabili

## Prossimi passi consigliati

Ordine consigliato per massimizzare valore e controllo:

1. lifecycle esteso:
   - garanzia
   - fine vita
   - dismissione con audit migliore
2. dati tecnici base:
   - IP
   - hostname
   - OS
3. reporting operativo:
   - scadenze
   - asset inutilizzati
   - esportazione
4. manutenzione evoluta:
   - storico interventi
   - SLA
   - preventiva
5. relazioni leggere tra asset

## Regola di governo del backlog

Ogni nuova feature dovrebbe essere valutata con questa domanda:

“Serve davvero a rafforzare l'MVP o appartiene gia alla fase enterprise?”

Se la risposta e “fase enterprise”, non va infilata nel backlog immediato senza una decisione esplicita.
