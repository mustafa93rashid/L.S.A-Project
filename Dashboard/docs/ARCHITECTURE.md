# Architecture

## Tech stack

React 19 + TypeScript 6 + Vite 8, React Router v7 (data router), TanStack Query v5, Zustand,
React Hook Form + Zod, Tailwind CSS v4 + shadcn/ui (Radix UI primitives), TanStack Table,
Axios, Socket.IO client, Sonner (toasts), date-fns, Lucide React icons. `oxlint` for linting,
`prettier` for formatting. No test runner is configured (see Known Limitations).

## Folder structure

```
src/
  app/            Composition root: router, providers, ErrorBoundary, RootLayout, SessionBoundary
  layouts/         AuthLayout, DashboardLayout (Sidebar + Topbar + Breadcrumbs + <Outlet>)
  pages/           One folder per route — thin: data fetching + composition, no business logic
  features/        One folder per domain: api.ts, queries.ts, schema.ts, types.ts, components/
  components/
    ui/            shadcn/ui primitives (generated, not hand-written — see below)
    layout/        PageContainer, PageHeader, SectionHeader, Sidebar, Topbar, Breadcrumbs
    data-table/    DataTable, TableToolbar, Pagination, TableSkeleton
    data-display/  StatCard, StatusBadge, RoleBadge
    overlays/      Drawer, FormDialog, ConfirmDialog — the three modal/panel patterns
    forms/         Cross-feature form building blocks (StringListField, StepsEditor, SearchInput)
    feedback/      PageLoader, EmptyState, ErrorState
    guards/        RequireAuth, RequireGuest, RequireRole
  constants/       roles.ts, permissions.ts (MODULE_ROLES), navigation.ts (NAV_ITEMS)
  stores/          Zustand: session.store.ts (user/auth), ui.store.ts (theme, sidebar collapse)
  lib/             api-client.ts, query-client.ts, cloudinary.ts, file-validation.ts,
                   form-data.ts, form-errors.ts, env.ts, utils.ts
  hooks/           useDebouncedValue
  types/           api.ts (ApiEnvelope/Paginated/CountedList/ApiError), auth.ts
```

### The `features/<name>` shape

Every feature module follows the same five-piece shape (not every module needs every piece —
e.g. Contact Info has no `components/` drawer, Equipment has no page-level statistics):

```
features/<name>/
  types.ts        Interfaces matching the backend's actual response shape (verified live, never assumed)
  api.ts           Thin Axios wrappers — one function per endpoint, typed request/response
  queries.ts       TanStack Query hooks: use<X>Query, useCreate<X>Mutation, useUpdate<X>Mutation, ...
  schema.ts        Zod schema mirroring the backend's express-validator rules field-for-field
  components/      Feature-local UI (drawers, dialogs, editors) not reused elsewhere
```

`pages/<name>/<X>Page.tsx` is the route target: it composes a feature's query hooks, a
`DataTable` or settings form, and whatever drawer/dialog the feature exports — pages hold almost
no logic of their own.

## Routing & guards

`src/app/router.tsx` is a single `createBrowserRouter` tree. Three guard components
(`components/guards/`) compose around routes rather than each page checking auth itself:

- **`RequireAuth`** wraps the entire dashboard-layout subtree once — unauthenticated users never
  reach any dashboard route.
- **`RequireRole roles={MODULE_ROLES[MODULES.X]}`** wraps each individually-restricted route —
  see `docs/ROLE_MATRIX.md` for the full table and why sidebar/route protection can't drift apart.
- **`RequireGuest`** wraps the four auth pages (Login, Forgot/Reset Password, Activate Account) —
  an already-authenticated user is redirected away from them.

Every dashboard page component is `React.lazy`-loaded (route-level code splitting — see the
bundle report in `docs/PRODUCTION_CHECKLIST.md`); a single `SuspendedOutlet` wrapper provides one
consistent `PageLoader` fallback rather than one per route. Auth pages stay eagerly imported
since they're needed on first paint regardless of session state. An unmatched URL falls through
to a `path: '*'` route rendering `NotFoundPage` (standalone, not behind `RequireAuth`, since a
stale bookmark can be hit while signed out).

## State management

- **Server state** — TanStack Query exclusively. Query keys are namespaced arrays
  (`['services', 'list']`, `['services', 'list', filters]`) so `invalidateQueries({queryKey:
['services']})` on a mutation's `onSuccess` correctly invalidates every filtered variant of a
  list at once.
- **Client/UI state** — Zustand, two small stores: `session.store.ts` (the authenticated user;
  written by the auth flow, read everywhere `hasModuleAccess`/`RequireRole` need a role) and
  `ui.store.ts` (theme, sidebar collapsed state — both persisted).
- **Form state** — React Hook Form per-form, never centralized; Zod schemas provide both
  compile-time types (`z.infer`) and runtime validation via `@hookform/resolvers/zod`.

## Authentication

Cookie-based JWT, **never** read from JavaScript — the backend sets httpOnly cookies exclusively
(no `localStorage`/`sessionStorage` token storage anywhere in this codebase, confirmed by audit).
`lib/api-client.ts` is a single Axios instance with `withCredentials: true` and a single-flight
401 → refresh-token → retry interceptor (concurrent 401s trigger exactly one
`POST /auth/refresh-token`, matching the backend's rotating-refresh-token model where a duplicate
concurrent refresh would be treated as reuse/revocation). See the root `README.md` for the full
local-dev-proxy vs. production same-origin/cross-origin cookie strategy — this is the single most
important deployment constraint for this project.

## API integration notes

- Every backend response is one of three shapes (`src/types/api.ts`):
  `ApiEnvelope<T>` (`{success, message?, data?}` — single-resource endpoints),
  `Paginated<T>` (`{success, count, pagination, data}` — the request-queue modules:
  Equipment/Job Requests, Contact Messages), or
  `CountedList<T>` (`{success, count, data}` — unpaginated catalogs: Equipment, Partners,
  Journeys, Team Members, Services, Projects).
- One confirmed exception: `GET /users` returns `{success, results, pagination: {currentPage,
limit, totalUsers, totalPages}, data}` — genuinely different from every other paginated
  endpoint (verified directly against the controller), kept as its own `UsersPaginated` type
  rather than forced into `Paginated<T>`.
- Multipart writes (any module with an image) use `lib/form-data.ts`'s `buildFormData(payload,
files)` — plain values are appended as-is, object/array values are `JSON.stringify`'d (matching
  the backend's `customSanitizer`/`parseJsonField` pattern that explicitly expects a JSON string
  per field over multipart), `undefined`/`null` are skipped so partial updates work. Multi-file
  fields (Projects' `gallery`/`certificateImages`) are appended manually after
  `buildFormData` returns, since one FormData key can hold multiple files but the helper only
  takes one File per key.
- Every mutation's error path goes through `lib/form-errors.ts`'s `applyServerErrors` — maps the
  backend's per-field `errors: [{field, message}]` array onto the exact React Hook Form field via
  `form.setError`, with any non-field-mapped message shown as a form-level banner.

## Upload behavior

- Client-side validation (`lib/file-validation.ts`) mirrors
  `Backend/src/middlewares/upload.middleware.js` exactly: 5MB max, `image/{jpeg,png,gif,webp}`
  only (SVG is backend-accepted but never offered as a client option, so intentionally excluded
  from client validation too). Rejection shows an inline error and never reaches the mutation.
- Every existing-image preview goes through `lib/cloudinary.ts`'s `cloudinaryThumbnail(url, size)`
  — inserts a `w_{size},h_{size},c_fill,q_auto,f_auto` transform so list/drawer thumbnails never
  download the full original asset. Applied consistently across all nine image-bearing modules
  (Equipment, Profile, Partners, Journeys, Team Members, Services ×2, Projects ×4).
- Single-image modules (Equipment, Partners, Journeys, Team Members, Profile, Services'
  card/hero, Projects' card/hero) follow the same pattern: a `File | null` state outside React
  Hook Form, required on create, optional on edit ("leave empty to keep current"), replaced
  server-side via the backend's `replaceImage` helper (old Cloudinary asset deleted, new one
  uploaded).
- Multi-image modules (Projects' gallery/certificates) use the feature-local `GalleryManager`
  component: existing images can be marked for removal by `publicId`
  (`removeGalleryPublicIds`/`removeCertificatePublicIds`), new files are staged with per-file alt
  text and appended on submit — matching the backend's index-aligned
  `files[]`/`altValues[]`/`startingOrder` contract exactly (verified live).
- Every `URL.createObjectURL` call (Profile avatar preview, Projects' new-gallery-file previews)
  is paired with `URL.revokeObjectURL` in a `useEffect` cleanup — audited project-wide, no leaks.

## Shared components guide

| Component                                                    | When to use                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `Drawer`                                                     | Large, multi-section forms (Equipment, Jobs, Services, Projects) — wide slide-out sheet                    |
| `FormDialog`                                                 | Small create/edit forms (Partners, Journeys, Team Members, Equipment Categories) — modal                   |
| `ConfirmDialog`                                              | Any destructive or state-changing confirmation (delete, status change, discard)                            |
| `DataTable` + `TableToolbar` + `Pagination`                  | Every list page — search/filter/sort/paginate                                                              |
| `StringListField`                                            | An editable list of plain strings (highlights, capability items, phone numbers)                            |
| `StepsEditor`                                                | An editable list of `{title, description, icon}` objects (Services' delivery steps, Projects' scope items) |
| `EmptyState` / `ErrorState` / `PageLoader` / `TableSkeleton` | The four states every async list must handle                                                               |
| `StatCard` / `StatusBadge` / `RoleBadge`                     | Dashboard Overview and per-module statistics strips                                                        |

Two components (`StringListField`, `StepsEditor`) were explicitly built feature-local first and
promoted to `components/forms/` only once a second, genuinely identical use case appeared —
never speculatively shared ahead of a real second consumer.

## Feature modules guide

Sixteen route-level modules exist; each is documented individually via its own `features/<name>`
folder rather than a separate guide per module (the code itself, with the shape above, is the
documentation). The two structural exceptions:

- **Contact Information** is a singleton (`GET`/`PUT`, no list, no delete) — its page is a
  sectioned settings form (`pages/contact-info/ContactInfoPage.tsx`), not a `DataTable`.
- **Dashboard Overview** has no `features/` folder of its own — it composes statistics and
  recent-activity data from the other modules' existing list/statistics endpoints (no
  dashboard-summary endpoint exists on the backend), gated per-section by `hasModuleAccess` so a
  role only fetches what it can actually see.

## Real-time notifications

`lib/socket.ts` owns a single shared `socket.io-client` instance; `app/SocketSync.tsx` (mounted
in `AppProviders`, same "renders null, pure side-effect" pattern as `ThemeSync`) drives its
entire lifecycle purely off `session.store.ts`'s `status` — connect once authenticated,
disconnect and wipe `stores/notification.store.ts` on logout or any other loss of session.

- **Auth**: the socket handshake authenticates via the same httpOnly `accessToken` cookie the
  REST API uses (the backend's socket middleware was extended — with explicit approval, see
  `docs/CHANGELOG.md` — to also accept it, since it previously only accepted an explicit token
  the browser architecturally can never read). This requires the connection to be same-origin,
  exactly like the REST API: `vite.config.ts` proxies `/socket.io` (with `ws: true`) alongside
  `/api` in dev; production strategy A's reverse proxy needs the same `/socket.io` passthrough
  added. `env.socketUrl` (`VITE_SOCKET_URL`) is optional — unset means same-origin; only set it
  for a genuine cross-origin deployment (strategy B).
- **Transport order matters**: `transports: ['polling', 'websocket']`, not the reverse — verified
  live that starting with `websocket` can fail to carry the auth cookie through a proxy; polling
  first (Socket.IO's own default order) is what reliably works.
- **Events consumed**: `notification:new` only (plus the connection-lifecycle `connect`/
  `disconnect`/`connect_error`/`reconnect_attempt`) — the complete set the backend ever emits to
  a client, confirmed by exhaustive search of `Backend/src/`. No client → server events are used.
- **No history endpoint exists on the backend.** "Recent notifications" means "received since
  this socket connected," not a persisted inbox — the store caps at 50 entries in memory.
- **No mark-as-read endpoint or event exists either.** `markAsRead`/`markAllAsRead` are
  client-state-only (never sent to the server, never persisted across a reload) — implemented
  deliberately as local-only rather than faking backend support that doesn't exist.
- **Role-aware by construction, not by client-side filtering**: the backend only emits a given
  notification type to the roles whose `MODULE_ROLES` entry for the linked module already
  includes them (verified: `EQUIPMENT_NOTIFICATION_ROLES`/`JOB_NOTIFICATION_ROLES`/
  `CONTACT_NOTIFICATION_ROLES` in `notification.service.js` match `MODULE_ROLES` exactly) — a
  connected socket simply never receives a notification type it isn't allowed to act on.
- **Duplicate-event prevention**: `notification.store.ts`'s `addNotification` no-ops (and skips
  the toast) if a notification with the same `_id` is already present — guards against React 19
  StrictMode's intentional double-invoke of effects in dev, and any transport-level redelivery.

## Known deliberate non-goals

- No test runner/test suite (see `docs/PRODUCTION_CHECKLIST.md`, Known Limitations).
- No i18n — English only, matching the backend's own validation messages.
