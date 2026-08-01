# How to Run — Cosplay Map (client + server)

A step-by-step guide to running the whole project. There are **two ways** to run
it; pick the one you need.

| Mode | What runs | Use when |
|---|---|---|
| **A. Frontend only** | just the website | quickest look; editing data stays in your browser |
| **B. Full stack** | website **+** the backend (api-service + gis-proxy) | data is saved to a real database via REST |

---

## Prerequisites (once)

- **Node.js ≥ 20.9** — check with `node -v`. If lower, install Node 20 LTS / 22
  (e.g. [nvm-windows](https://github.com/coreybutler/nvm-windows)).
- **pnpm** — if you don't have it: `corepack enable` (ships with Node), or
  `npm i -g pnpm`.

Folder layout:
```
cosplay-map-client/   the website (this folder)
cosplay-map-server/   the backend — api-service (events + places) + gis-proxy
```

> **Note (backend was merged):** the events and places services were combined into
> one **api-service** on **:8787** sharing one database. `gis-proxy` stays on
> **:8789**. There is no longer a separate places service on `:8788`.

---

## Mode A — Frontend only (no server)

Good for a quick look or design work. Events/spots you add in `/admin` are saved
in **your browser** (localStorage) and aren't shared.

```bash
cd cosplay-map-client
pnpm install
pnpm dev
```
Open **http://localhost:3000**. Done.

> The app tries to reach the server; if it's not running it quietly falls back to
> built-in sample data, so everything still works.

---

## Mode B — Full stack (website + server + databases)

Use **two terminals**.

### Terminal 1 — the server (api-service + gis-proxy)
```bash
cd cosplay-map-server
pnpm install

# one-time: local admin password + create & seed the local database
cp api-service/.dev.vars.example api-service/.dev.vars
pnpm migrate

# start both services at once (Ctrl+C stops them)
pnpm dev
```
This runs:
- api-service → http://localhost:8787   (events + places + admin)
- gis-proxy   → http://localhost:8789

Quick check (in a browser or another terminal):
```bash
curl http://localhost:8787/v1/events    # 6 seeded events
curl http://localhost:8787/v1/places    # 6 seeded places
```

### Terminal 2 — the website
```bash
cd cosplay-map-client
pnpm install        # if you haven't already
pnpm dev
```
Open **http://localhost:3000**. The site now reads from api-service, and
`/admin` writes save to the real database.

---

## Add events & spots (admin)

1. Go to **http://localhost:3000/admin**.
2. Use the **Events** and **Spots** tabs.
3. **＋ Add** / ✏️ edit / 🗑️ delete. Changes appear on the map, calendar, events
   list, and spots page.

> In Mode B, the admin token is `dev-secret-change-me` (matches
> `api-service/.dev.vars`). Used as the setup key / password fallback; the normal
> path is a passkey (Windows Hello) login. Dev only — production needs a real login.

---

## Use the data elsewhere (public API)

api-service exposes a **public, CORS-open** read API anyone can fetch (one base URL):
```
GET http://localhost:8787/v1/events            # JSON
GET http://localhost:8787/v1/events.geojson    # map-ready GeoJSON
GET http://localhost:8787/v1/places
GET http://localhost:8787/v1/places.geojson
```
> Community submissions are namespaced: `POST /v1/events/submissions` and
> `POST /v1/places/submissions` (they land in a pending queue for admin approval).

---

## Useful commands

| In `cosplay-map-client` | |
|---|---|
| `pnpm dev` | run the website (dev) |
| `pnpm build` | production build |
| `pnpm lint` | check code |

| In `cosplay-map-server` | |
|---|---|
| `pnpm dev` | run api-service + gis-proxy |
| `pnpm migrate` | create/seed the local database |
| `pnpm -r typecheck` | type-check all services |

---

## Troubleshooting

- **Map box is blank** → ad-blockers/Brave can block CDNs; this project serves
  MapLibre locally to avoid that. If still blank, make sure DevTools' "Pause on
  exceptions" is **off** (it freezes the page). See `MAP_BUG_REPORT.md`.
- **`pnpm dev` fails / weird errors** → check `node -v` is ≥ 20.9.
- **Admin says "couldn't save"** → the server isn't running (you're in Mode A).
  Start the server (Mode B) to save to the database.
- **Port already in use** → another process is on 3000/8787/8789; stop it or
  change the port.
- **Stale UI after big changes** → stop `pnpm dev` (Ctrl+C) and start it again;
  hard-refresh the browser (`Ctrl+Shift+R`).

---

## More docs
- `README.md` — overview & structure.
- `DOCUMENTATION.md` (client & server) — file-by-file walkthrough.
- `MAP_BUG_REPORT.md` — why the map once rendered blank.
- `LEARNING.md` — roadmap to own this project independently.
