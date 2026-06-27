# 🎌 Cosplay Map — Client

Frontend for the **Helsinki / Vantaa cosplay map**: an interactive GIS map of
anime conventions **and** cosplay-friendly cafés, restaurants, malls and photo
spots (with pictures + themes). Playful, light/dark themed, for high-school to
young-adult anime fans.

The backend lives in a **separate repo** (`cosplay-map-server`). This app is a
read-only consumer of its public HTTP APIs.

## Status
- `mockups/` — static HTML design mockups of all pages (done, no build step)
- `src/types.ts` — client-owned type contract (Event / Place / GeoJSON)
- Next.js app — **not scaffolded yet** (next step)

## Run the mockups (now)
Just open the HTML files in a browser — no server needed.
`mockups/map.html` needs internet (MapLibre CDN + map tiles).
```bash
start mockups/index.html     # Windows
```

## Run the app (after it's scaffolded)
```bash
pnpm install
pnpm dev                     # → http://localhost:3000
```
Service URLs come from env vars, e.g.:
```
NEXT_PUBLIC_EVENTS_API_URL=http://localhost:8787
NEXT_PUBLIC_PLACES_API_URL=http://localhost:8788
NEXT_PUBLIC_GIS_PROXY_URL=http://localhost:8789
```

## Planned stack
Next.js (App Router) · TypeScript · Tailwind CSS · MapLibre GL JS · OpenFreeMap tiles

## Pages (designed in `mockups/`)
Home · Map (+ mini-calendar) · Calendar · Events · **Cosplay Spots** (planned) ·
About · Donate · Admin (login-gated)

## Scaffold the Next.js app (later)
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint
# then port the mockups into components and keep src/types.ts
```
