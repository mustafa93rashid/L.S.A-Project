# Changelog

## v1.0.0 — Initial release

The LSA Dashboard's first production-ready release. Built end-to-end against the existing
L.S.A Backend with exactly one small, explicitly-approved backend change across the entire
project (see "Real-time notifications" below) — every other module and fix is frontend-only.

### Modules

**Request queues:** Equipment Requests, Job Requests, Contact Messages — status workflows,
statistics strips, search/filter/paginate, detail drawers.

**Catalog & careers:** Equipment (+ Equipment Categories), Jobs — full CRUD, image uploads,
active/inactive status.

**Content management:** Partners, Company Journey, Team Members, Contact Information, Services,
Projects — full CRUD across every backend-supported CMS resource. Services and Projects are
multi-section forms (nested objects, dynamic arrays, a comparison table, multi-file
gallery/certificate management with per-item removal, a many-to-many Services↔Projects
relationship).

**Administration:** Users (invite, role change, activate/deactivate — superadmin-only), Profile
(self-service account + avatar management).

**Shell:** Dashboard Overview (role-aware statistics + recent activity composed from existing
endpoints), authentication (login, forgot/reset password, account activation), responsive
sidebar/topbar/breadcrumbs, light/dark theme, real-time notifications (bell + unread count +
recent-activity dropdown, live toasts).

### Real-time notifications

The backend's Socket.IO layer existed but couldn't authenticate a browser client: its auth
middleware only accepted an explicit token via `handshake.auth.token` or an `Authorization`
header, and this dashboard's access token is httpOnly-cookie-only by design (confirmed no code
path anywhere exposes it to JavaScript). **One backend change was made, with explicit approval**:
`Backend/src/config/socket.js`'s `extractSocketToken` now also falls back to reading the same
`accessToken` cookie the REST middleware already reads, parsed server-side from the raw `Cookie`
header — same trust boundary, no new endpoints or events, nothing ever exposed to JS. Verified
live end-to-end (cookie-only auth, and a real notification delivered in real time) both directly
against the backend and through the full Vite dev-proxy chain before shipping.

The frontend side: a centralized `socket.io-client` singleton, a Zustand notification store, a
Topbar bell with an unread badge and recent-activity dropdown, live toasts on arrival, automatic
reconnection, duplicate-event guarding, and full teardown on logout. See
`docs/ARCHITECTURE.md`'s "Real-time notifications" section for the complete design — including
what the backend does _not_ support (no notification history endpoint, no mark-as-read endpoint)
and how the frontend handles both honestly rather than faking persistence that isn't there.

### Architecture highlights

- Cookie-based JWT auth, httpOnly, single-flight refresh-token rotation.
- Role-based access control with one source of truth (`MODULE_ROLES`) driving both sidebar
  visibility and route guards — see `docs/ROLE_MATRIX.md`.
- Route-level code splitting (`React.lazy` per dashboard page) — ~65% smaller initial JS payload
  than the pre-split baseline (827.5 KB → ~498 KB raw main chunk; see the bundle report in
  `docs/PRODUCTION_CHECKLIST.md`).
- TanStack Query throughout for server state, with a consistent invalidation strategy per
  feature module.
- A single Zod schema per feature mirrors the backend's express-validator rules field-for-field —
  no client/server validation drift.
- Consistent upload pipeline across nine image-bearing modules: client-side size/type validation,
  Cloudinary thumbnail transforms for every preview, proper `URL.createObjectURL` cleanup.

### Fixed during hardening (Phase 8–10)

- Pagination-safety: deleting the last item on a non-first page now steps back a page instead of
  showing an empty page.
- Unsaved-changes confirmation on the app's larger multi-field drawers (Equipment, Jobs,
  Services, Projects).
- A malformed pre-existing Services record (missing several backend-required sections) was
  crashing the Services page entirely — every section is now read defensively, and an
  "Incomplete" badge surfaces the affected row instead of a blank screen.
- A stale top-level `address` field on the seeded Contact Information record (predating the
  `location` sub-object) is now read defensively; saving through the dashboard repairs the shape
  going forward.
- Sidebar hardcoded `text-white` replaced with the `--sidebar-foreground` design token.
- Added a `prefers-reduced-motion` override (previously no animation-reduction handling existed
  anywhere in the stylesheet).
- Added a catch-all `NotFoundPage` for unmatched routes (previously no 404 handling existed —
  React Router would render nothing for an unmatched URL).
- Profile avatar now uses the same `cloudinaryThumbnail` optimization every other module's image
  preview already had.

### Known limitations

See `docs/PRODUCTION_CHECKLIST.md`.
