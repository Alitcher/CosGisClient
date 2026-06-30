# Cosplay Map — Client Documentation

Frontend for the **Helsinki / Vantaa Cosplay Map**: an interactive GIS web app that
maps (1) anime conventions and (2) cosplay-friendly places (cafés, restaurants,
malls, studios, outdoor spots) with photos and themes. Playful, light/dark theme.

The backend lives in a **separate repo** (`cosplay-map-server`). This app calls its
public HTTP APIs for live data, with the sample arrays in `lib/data.ts` kept only as
an **offline fallback**. It also includes public **submission forms** (suggest an
event/spot), an **admin dashboard** with a moderation queue, and **passkey login**.

> **Env vars** (optional; sensible localhost defaults): `NEXT_PUBLIC_EVENTS_API_URL`
> (`:8787`), `NEXT_PUBLIC_PLACES_API_URL` (`:8788`), `NEXT_PUBLIC_GIS_PROXY_URL` (`:8789`).
> The admin token is **not** an env var — it is entered at the `/admin` login.

---

## 1. Tech stack

| Concern        | Choice                                                |
|----------------|-------------------------------------------------------|
| Framework      | **Next.js 16** (App Router) + **React 19**            |
| Language       | **TypeScript** (strict)                               |
| Styling        | **Plain CSS** (one global stylesheet) — no Tailwind\* |
| Map            | **MapLibre GL** (served locally) via an embedded page |
| Map tiles      | **OpenFreeMap** "liberty" 3D vector style (no API key)|
| Fonts          | Google Fonts — Fredoka (display) + Inter (body)       |

\* Tailwind shipped with the scaffold but its native binary failed to load on
Windows, and we style with hand-written CSS, so it was removed.

---

## 2. How to run

> Requires **Node.js ≥ 20.9** (Next.js 16).

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
```

---

## 3. Project structure

```
cosplay-map-client/
├── package.json          deps + scripts
├── next.config.ts        Next config (root pin, strict-mode off)
├── tsconfig.json         TypeScript config (path alias @/* → src/*)
├── eslint.config.mjs     ESLint (next config)
├── public/
│   ├── map-embed.html    standalone map page embedded by the app (see §6)
│   ├── maplibre/         local copy of MapLibre GL (js + css)
│   └── *.svg             scaffold icons (unused)
└── src/
    ├── types.ts          shared data types (Event, Place, GeoJSON)
    ├── lib/
    │   └── data.ts       placeholder data (events, venues, places) + helpers
    ├── components/       reusable UI (nav, footer, maps, calendars, admin)
    └── app/              App Router pages + layout + global CSS
```

---

## 4. Configuration files

### `package.json`
Dependencies and scripts. Key deps: `next`, `react`, `react-dom`. No map library
is bundled — MapLibre is served as a static file from `public/maplibre/` (see the
bug report for why). Scripts: `dev`, `build`, `start`, `lint`.

### `next.config.ts`
- `reactStrictMode: false` — dev StrictMode double-mounts components; that broke the
  in-React map init, so it's off.
- `turbopack.root: __dirname` — pins the project root so Next doesn't pick up a
  stray lockfile elsewhere on the machine.

### `tsconfig.json`
Standard Next.js TypeScript config. The important bit is the path alias
`"@/*": ["./src/*"]`, so imports read `@/components/Nav`, `@/lib/data`, etc.

### `eslint.config.mjs`
Flat ESLint config extending `eslint-config-next`.

---

## 5. Data layer

### `src/types.ts`
The **client-owned type contract**. The client is a read-only consumer, so it
keeps its own lightweight TypeScript interfaces here instead of importing from the
server. Mirror these by hand with the server's `@anime-con/shared` schemas.

- `City` = `'Helsinki' | 'Vantaa' | 'Espoo'`
- `Status` = `'live' | 'draft' | 'pending'`
- `PlaceType` = `'cafe' | 'restaurant' | 'mall' | 'studio' | 'outdoor'`
- `Event` — a dated convention (name, venue, city, date, lng/lat, status).
- `Place` — a cosplay-friendly location (type, themes, photos, lng/lat, …).
- `Photo` — `{ url, caption? }`.
- `Feature<P>` / `FeatureCollection<P>` — GeoJSON shapes the map APIs return.

### `src/lib/data.ts`
**Fallback sample data + display helpers.** The stores seed from these arrays so the
UI renders instantly and still works if the server is offline:
- `events` / `venues` / `places` — sample content.
- `splitDate(iso)` — turns `"2026-07-11"` into `{ day, mon, year }`.
- `placeTypeLabel` — maps `cafe` → `Café`, etc.

### `src/lib/api.ts` — REST clients
Typed `fetch` wrappers for the events/places services: public reads
(`apiListEvents`/`apiListPlaces`), public submissions (`apiSubmitEvent`/`apiSubmitPlace`),
admin writes (create/update/delete), and moderation (`apiListPendingEvents`,
`apiApproveEvent`, and place equivalents). Admin calls attach
`Authorization: Bearer <token>` via `adminHeaders()`, reading the token from
`adminAuth` at call time (never hardcoded, never in the bundle).

### `src/lib/eventsStore.ts` / `src/lib/placesStore.ts`
Tiny `useSyncExternalStore` stores. Seed from `data.ts`, fetch live data on mount,
and expose admin actions (`add`/`update`/`delete`) that call the API then refetch.

### `src/lib/adminAuth.ts`
Admin token storage in **sessionStorage** (`getAdminToken`/`setAdminToken`/`clearAdminToken`).
The token is entered at the `/admin` login and never embedded in the JS bundle.

### `src/lib/geocode.ts`
Address/place/postcode autocomplete via **Photon** (free OpenStreetMap geocoder, no
key). `geocode(query)` returns Finland-only suggestions with coordinates, biased to
the Helsinki region. Used by the submit forms so visitors don't type raw lng/lat.

---

## 6. The map (important — read with the bug report)

The map is **not** a React MapLibre component. After extensive debugging (see
`MAP_BUG_REPORT.md`), the reliable solution was to **embed a standalone HTML page**.

### `public/map-embed.html`
A plain HTML page that:
1. Loads MapLibre GL from the **local** `/maplibre/maplibre-gl.js` (not a CDN).
2. Creates a MapLibre map with the OpenFreeMap **liberty** 3D vector style.
3. Adds the venue markers with popups.

It renders the interactive 3D Helsinki map on its own, reliably.

### `public/maplibre/`
A local copy of `maplibre-gl.js` + `maplibre-gl.css` (v4.7.1). Served from the same
origin so nothing (ad-blockers, Brave shields) can block it like a CDN can.

### `src/components/HeroMap.tsx` and `VenueMap.tsx`
Both are now **one-line wrappers** that render
`<iframe src="/map-embed.html" />` to fill their container. `HeroMap` fills the
homepage hero box; `VenueMap` fills the `/map` page's map area.

---

## 7. Components (`src/components/`)

### `Nav.tsx` (client component)
Top navigation. Uses `usePathname()` to highlight the active link. Renders the
brand, the links (Home, Map, Calendar, Events, Spots, About, Donate), and the
`ThemeToggle`.

### `Footer.tsx`
Simple footer (copyright + tagline). No personal data.

### `ThemeToggle.tsx` (client component)
The 🌙/☀️ button. On click, flips `data-theme` on `<html>` between `light`/`dark`
and saves the choice to `localStorage` (`cosplaymap-theme`). The initial theme is
set by an inline script in `layout.tsx` before paint, so there's no flash.

### `HeroMap.tsx` / `VenueMap.tsx`
Iframe wrappers around `/map-embed.html` (see §6).

### `MiniCalendar.tsx`
The compact calendar docked inside the `/map` page (bottom-right overlay). Renders
a static July 2026 month grid with event-day dots and a "Full calendar →" link.

### `MonthCalendar.tsx`
The full month grid for the `/calendar` page. Computes the leading/trailing days
and places event chips (color-coded by city) into day cells, with a "+N more"
overflow.

### `AdminDashboard.tsx` (client component)
The admin UI (`/admin`, wrapped by `AdminGate`). Three tabs:
- **Events** / **Spots** — stat cards + a table with edit/delete, and a slide-in
  **drawer** (add/edit form) closeable with Escape.
- **Pending** — moderation queue for both events *and* places (community submissions
  + Linked Events imports). Approve/reject per row, multi-select with checkboxes, or
  approve-all/reject-all. Approve calls `/v1/submissions/:id/approve`; reject deletes.

### `AdminGate.tsx` (client component)
Login gate in front of the dashboard. **Passkey (Windows Hello / PIN)** login via
`@simplewebauthn/browser`: first-time **register** (authorized by the admin key),
then **unlock** with the device PIN/biometric. Stores the returned session token in
`adminAuth`. Includes a **password fallback** so you can't get locked out. The
`/admin` page is also `robots: noindex`.

### `SubmitEventDialog.tsx` / `SubmitSpotDialog.tsx` (client components)
Public "Submit" button + slide-in form (used on Home, Events, Spots). Posts to the
public `/v1/submissions` endpoints → lands in the admin **Pending** tab. Uses
`AddressAutocomplete` for the location so visitors pick a place instead of typing
coordinates.

### `AddressAutocomplete.tsx` (client component)
Google-Maps-style type-ahead over `lib/geocode.ts`: debounced search, a clickable
suggestion dropdown (keyboard-navigable, themed for light/dark), and `onSelect` that
fills in coordinates (and city/address).

---

## 8. Pages (`src/app/`)

### `layout.tsx` (root layout)
Wraps every page. Sets `<html>`/`<body>`, loads the Google Fonts, imports
`globals.css`, and runs a tiny inline script that sets `data-theme` before paint
(reads `localStorage`, falls back to system preference). `suppressHydrationWarning`
silences the harmless warning from browser extensions (e.g. Grammarly) that edit
the DOM. `reactStrictMode` is off (see §4).

### `globals.css`
The **entire design system** in one stylesheet:
- Theme tokens for dark and light (`:root[data-theme="…"]`) — colors, surfaces,
  borders, the "hard" shadow color.
- Brand accents (pink/purple/cyan/gold), radii, fonts.
- Component classes: nav, buttons, cards, chips, footer, and **per-page sections**
  (home, map, calendar, events, spots, about, donate, admin), each grouped under a
  comment banner.
- Responsive `@media` rules at the bottom.

### `page.tsx` — Home (`/`)
Hero (heading, lead, stats, and the embedded `HeroMap` with the **"Explore the
map"** button overlaid inside it linking to `/map`), a features section, and an
"Upcoming conventions" strip built from `data.ts`.

### `map/page.tsx` — Map (`/map`)
Full-height layout: a left sidebar (event list + city filters), the embedded
`VenueMap`, a legend overlay, and the `MiniCalendar` overlay.

### `calendar/page.tsx` — Calendar (`/calendar`)
Toolbar (month nav + view switch) and the `MonthCalendar` grid, with a legend.

### `events/page.tsx` — Events (`/events`)
Searchable, filterable list of conventions rendered from `data.ts`, each row with
date, venue, time, city chip, and map/calendar action buttons.

### `spots/page.tsx` — Cosplay Spots (`/spots`)
Grid of cosplay-friendly places from `data.ts`: photo, name, type chip, address,
description, and theme tags.

### `about/page.tsx` — About (`/about`)
Project intro, tech-stack cards, a "how it works" section, and a CTA band.

### `donate/page.tsx` — Donate (`/donate`)
Buy Me a Coffee button (placeholder URL), support tiers, and a "where your coffee
goes" section.

### `admin/page.tsx` — Admin (`/admin`)
Renders `<AdminGate><AdminDashboard/></AdminGate>` — passkey/password login in front
of the dashboard. Marked `robots: noindex` so search engines don't list it.

> **Submit buttons:** Home, `/events`, and `/spots` render `SubmitEventDialog` /
> `SubmitSpotDialog` so the public can suggest events/spots (→ admin Pending tab).

---

## 9. Theming, in one line

`<html data-theme="light|dark">` flips a set of CSS variables in `globals.css`.
The toggle writes the choice to `localStorage`; the inline script in `layout.tsx`
applies it before first paint.

---

## 10. Next steps

Done since the first draft: live API wiring (`api.ts` + stores), public submission
forms, admin moderation queue, address autocomplete, and passkey login for `/admin`.

Remaining:
- Pass the selected event/place into `map-embed.html` (e.g. via query params) so
  clicking a list item recenters the map.
- Set production env vars (`NEXT_PUBLIC_*_API_URL`) and deploy to Vercel.
- Optional: a click-on-map pin picker as an alternative to the address search.
