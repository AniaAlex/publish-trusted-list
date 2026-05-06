# Onboarding (Pocketbase)

A lightweight onboarding app for the LoTE pipeline. Operators register entities through a web UI; on publish, the data is shipped as JSON to the Go publisher (`g119612` pipeline) which returns signed `.json` / `.jws` / `.xml` artefacts.

Pocketbase replaces "Django + DRF + admin" with a single Go binary: built-in admin UI, SQLite, REST API, auth, file uploads, audit log, webhooks. Roughly one day to a working app vs. a week of Django scaffolding.

## Fast launch

```sh
cp .env.example .env        # set super-admin credentials
make run                    # docker compose build + up
```

Two separate UIs, two separate credential pools:

### Operator (end-user) UI
For the people who fill in entity data and click Publish.

- **URL:** http://localhost:8090/login
- **Demo login** (auto-seeded by `pb_migrations/1714600200_seed_demo.js`):
  - **Email:** `operator@wp4trust.local`
  - **Password:** `demo-pass-12345`
- After login you land on `/dashboard` with the seven seeded schemes already owned by this operator (PID, Wallet, PubEAA, WRPAC, WRPRC, Registrars, LoTL).

### Super-admin UI
For schema changes, user management, raw record edits.

- **URL:** http://localhost:8090/_/
- **Credentials:** create on first visit (or `make createsuperuser` to use the values from `.env`).

Collections + the demo seed are applied automatically on first boot via `pb_migrations/`.

## Targets

| Target           | What it does                              |
| ---------------- | ----------------------------------------- |
| `make run`       | Build image, start Pocketbase             |
| `make stop`      | Stop containers                           |
| `make logs`      | Tail Pocketbase logs                      |
| `make shell`     | Shell into the Pocketbase container       |
| `make clean`     | Stop **and wipe the database volume**     |
| `make migrate`   | Re-apply pending migrations               |

## Data model

Three collections, mirroring the YAML files the `g119612` pipeline currently reads:

- **`schemes`** — one row per published list (PID, Wallet, PubEAA, WRPAC, WRPRC, Registrars, LoTL). Holds operator names, scheme type URI, territory, sequence number.
- **`entities`** — one row per trusted entity, FK → `schemes`. Holds names, entityId, address, services, digital identities (cert.pem upload, JWK text, optional DID).
- **`lotl_pointers`** — one row per pointer in the LoTL, FK → `schemes` (where `list_type=lotl`). Holds location URL, scheme territory/type, mimeType.

A `publish_runs` collection (audit) is added in a follow-up migration once the Go publisher endpoint exists.

## Publish flow

1. Operator edits a scheme + its entities in the Pocketbase admin.
2. Clicks **Publish** (or POSTs to `/api/collections/publish_runs/records`).
3. `pb_hooks/publish.pb.js` builds the JSON payload from the related rows and POSTs to `${PUBLISHER_URL}/api/v1/lote`.
4. The Go service runs `pipeline.GenerateLoTE` + `PublishLoTE` in-process, returns signed artefacts, hook stores them on the `publish_runs` record.

The Go publisher service is **not yet built** — it will live alongside the existing `main.go` in this repo. For now the hook is a stub that logs the payload it would have sent.

## Why Pocketbase over Django

| Concern | Django | Pocketbase |
| --- | --- | --- |
| Admin UI | Built-in but dated | Built-in, modern |
| Auth, RBAC, audit log | Built-in (multiple plugins) | Built-in |
| File uploads | Plugin / custom view | Built-in |
| REST API | DRF + serializers | Auto-generated from collections |
| Webhooks on save | Custom signal | Built-in JS hooks |
| DB | SQLite/Postgres + migrations | Embedded SQLite (single file) |
| Time to working app | Days | Hours |
| Custom UX ceiling | High (templates + HTMX) | Medium (admin form per collection) |
| Ops overhead | Postgres + Redis + Celery | One process |
| Lines of code at parity | ~1500 | ~50 (mostly migrations) |

If the editorial UX outgrows Pocketbase's collection forms, the same SQLite/REST contract can be served by a custom frontend — only the admin UI is replaced, not the data model.
