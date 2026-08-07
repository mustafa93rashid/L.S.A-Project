# LSA Dashboard

Admin dashboard for L.S.A Engineering Services — **v1.0**. React + TypeScript + Vite, built as an
independent sibling project to `../Backend` (see the root-level architecture notes for why). No
backend files have been modified at any point in this project.

Sixteen modules: Dashboard Overview, Equipment (+ Categories), Equipment Requests, Contact
Messages, Jobs, Job Requests, Users, Profile, Partners, Company Journey, Team Members, Contact
Information, Services, Projects, plus authentication (login/forgot-password/reset-password/
account activation).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — folder structure, module shape, routing,
  state management, API integration notes, upload behavior, shared components guide
- [`docs/ROLE_MATRIX.md`](docs/ROLE_MATRIX.md) — which of the five roles can access which module
- [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) — bundle report, accessibility/
  security/maintainability assessment, known limitations, release checklist
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — v1.0 changelog

## Getting started

```bash
npm install
cp .env.example .env.local   # already present locally; adjust if your backend runs elsewhere
npm run dev
```

Requires the backend running locally (`cd ../Backend && npm run watch`) on the port configured
in `vite.config.ts`'s dev proxy (default `http://localhost:3000`).

## Scripts

| Command                | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server (with the API proxy — see below)        |
| `npm run build`        | Type-check (`tsc -b`), then produce a production build in `dist/` |
| `npm run preview`      | Serve the production build locally                                |
| `npm run typecheck`    | `tsc -b --noEmit` — type-check without emitting/building          |
| `npm run lint`         | `oxlint`                                                          |
| `npm run format`       | `prettier --write .`                                              |
| `npm run format:check` | `prettier --check .` — used in CI/verification, never auto-fixes  |

## Tech stack

React 19, TypeScript 6, Vite 8, React Router v7, TanStack Query v5, TanStack Table, Zustand,
React Hook Form + Zod, Tailwind CSS v4 + shadcn/ui (Radix UI), Axios, Sonner, date-fns, Lucide
React. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how these fit together.

## Environment & Deployment Strategy

This dashboard authenticates against the backend entirely via **httpOnly cookies** — the access
and refresh tokens are never readable from JavaScript, by design (see the backend's
`cookiesService.js`). That constraint is what drives everything below.

### Local development — same-origin via a dev proxy (required, not optional)

`vite.config.ts` proxies `/api/*` to the backend (`http://localhost:3000`), and
`VITE_API_BASE_URL` is set to the **relative** path `/api/v1`, not an absolute URL. This is not
a convenience — it's required for login to work at all in dev:

- The backend's cookies are `SameSite=Lax` when `NODE_ENV=development` (the backend's own
  `cookiesService.js` branches on `NODE_ENV`, not something this project can or should change).
  `SameSite=Lax` cookies are **not sent on cross-site `fetch`/XHR requests** — only on top-level
  navigations. A request from the Vite dev server (`localhost:5173`) straight to the API
  (`localhost:3000`) is cross-site by browser rules (different port = different origin), so the
  cookies would silently never be sent or received, regardless of whether CORS is configured.
- Routing everything through the Vite proxy means the browser sees a single origin
  (`localhost:5173`) for both the app and the API — cookies work exactly as they would in a real
  same-origin production deployment, and the dev environment now genuinely exercises the same
  cookie path production will use.

**This proxy is strictly a local development convenience.** It has no effect on a production
build — `vite build` produces static assets with no dev server, so `server.proxy` never runs
outside `npm run dev`. Production must choose one of the two strategies below.

### Production strategy A — same-origin / reverse proxy (recommended)

Deploy the built dashboard and the API behind **one shared origin** — e.g. an Nginx/cloud
load-balancer/CDN rule that serves the static dashboard build at `/` and proxies `/api/*` to the
Node API, both under `https://dashboard.lsa-example.com`. This is the direct production
equivalent of the dev proxy above, and is the recommended default:

- `VITE_API_BASE_URL` stays **relative** (`/api/v1`) — no per-environment absolute URL to manage.
- No CORS configuration needed on the backend at all, because the browser never makes a
  cross-origin request in the first place.
- Cookies work with the backend's existing `SameSite=Lax` production behavior — no `SameSite=None`
  is required for a same-site deployment.
- Zero backend changes required.

### Production strategy B — true cross-origin (separate domains)

If the dashboard and API must live on genuinely different domains (e.g.
`https://dashboard.lsa-example.com` calling `https://api.lsa-example.com`):

- The backend already does the right thing for cookies in this case **without any change**: its
  `cookiesService.js` sets `secure: true; sameSite: 'none'` automatically whenever
  `NODE_ENV=production` — which is exactly what cross-site cookies require in modern browsers.
  Both origins must be served over HTTPS for this to work (`Secure` cookies are rejected over
  plain HTTP, and browsers reject `SameSite=None` without `Secure`).
- **One backend change is still required and has not been made:** `app.use(cors(...))` is
  currently never called in `app.js` (`cors` is imported but unused — see the backend analysis,
  Issue #1). Without it, the browser will block every cross-origin request outright, independent
  of cookies. This needs `app.use(cors({ origin: DASHBOARD_URL, credentials: true }))` (or
  equivalent) added on the backend, which requires your explicit approval before it's made.
- `VITE_API_BASE_URL` must be set to the full absolute API URL in this case (e.g.
  `https://api.lsa-example.com/api/v1`), not a relative path.

### Summary

|                                        | Local dev            | Prod — same-origin (A)  | Prod — cross-origin (B)    |
| -------------------------------------- | -------------------- | ----------------------- | -------------------------- |
| `VITE_API_BASE_URL`                    | `/api/v1` (proxied)  | `/api/v1` (proxied)     | Absolute URL               |
| Backend `NODE_ENV`                     | `development`        | `production`            | `production`               |
| Cookie `SameSite` (backend-controlled) | `Lax`                | `Lax`                   | `None` (auto, needs HTTPS) |
| Backend CORS change needed?            | No (proxy avoids it) | No (never cross-origin) | **Yes — not yet done**     |
