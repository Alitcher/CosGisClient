# 🎌 Cosplay Map — Client

Frontend for the **Helsinki / Vantaa Cosplay Map**: an interactive GIS map of
anime conventions **and** cosplay-friendly cafés, restaurants, malls, studios and
photo spots (with pictures + themes). Playful, with a light/dark theme.

The backend lives in a **separate repo** (`cosplay-map-server`). This app is a
read-only consumer of its public HTTP APIs. Until that's wired up, it ships with
sample data and a small in-browser store, so it runs **fully standalone**.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · plain CSS · MapLibre GL (3D
vector map) · OpenFreeMap tiles (no API key).

## Requirements
> **Node.js ≥ 20.9** (Next.js 16). On Node 18, install Node 20 LTS / 22 first
> (e.g. via [nvm-windows](https://github.com/coreybutler/nvm-windows)).

## Run
```bash
pnpm install
pnpm dev          # → http://localhost:3000
pnpm build        # production build
pnpm lint         # ESLint
```
No external services or extra folders are required to run.

## Structure
```
public/
├── map-embed.html    the interactive map (embedded by the app via <iframe>)
└── maplibre/         local copy of MapLibre GL (js + css) — served, not from a CDN
src/
├── app/              App Router pages + layout + globals.css
├── components/       Nav, Footer, ThemeToggle, HeroMap, MapView, calendars, AdminDashboard …
├── lib/
│   ├── data.ts       sample events / venues / places + helpers
│   └── eventsStore.ts in-browser events store (Admin edits flow everywhere)
└── types.ts          client data contract (Event / Place / GeoJSON)
```

## Pages
Home · Map (filter by city, click to fly, zoom for cards) · Calendar (navigable
months) · Events · Cosplay Spots · About · Donate · Admin (add/edit/delete events).

## Going live (later)
Replace `src/lib/data.ts` / the store with `fetch()` calls to the services:
```
NEXT_PUBLIC_EVENTS_API_URL=http://localhost:8787
NEXT_PUBLIC_PLACES_API_URL=http://localhost:8788
NEXT_PUBLIC_GIS_PROXY_URL=http://localhost:8789
```


`src/types.ts` mirrors the server's `@anime-con/shared` contract by hand — keep
them in sync.
