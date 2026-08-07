# Production Checklist — v1.0

## Bundle report (fresh production build, `npm run build`)

| Metric                          | Value                              |
| ------------------------------- | ---------------------------------- |
| Total `dist/` size              | 1.1 MB                             |
| Total JS (raw, all chunks)      | 906.61 KB                          |
| Total CSS (raw)                 | 67.88 KB                           |
| JS chunk count                  | 50                                 |
| Main entry chunk (`index-*.js`) | 497.82 KB raw / **155.64 KB gzip** |
| Main CSS (`index-*.css`)        | 69.51 KB raw / **11.76 KB gzip**   |

Before route-level code splitting was introduced (Phase 8), the entire app shipped as a single
827.5 KB / 245.7 KB gzip bundle. The main entry chunk is now 497.8 KB / 155.6 KB gzip — everything
route-specific moved into its own lazy chunk, fetched only when that route is visited.

### Largest chunks

| Chunk                     | Raw       | Gzip      | What it actually is                                                                                                                                                                                        |
| ------------------------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index-*.js` (main entry) | 497.82 KB | 155.64 KB | App shell: providers, router, guards, layout, all four eagerly-loaded auth pages                                                                                                                           |
| `utils-*.js`              | 115.59 KB | 39.27 KB  | Shared React + React-DOM runtime (Vite's automatic vendor chunk — not app code)                                                                                                                            |
| `ConfirmDialog-*.js`      | 54.52 KB  | 14.61 KB  | Shared chunk Rollup grouped by import-graph proximity (Radix Dialog + a cluster of Lucide icons + TanStack Table sort icons) — misleadingly named after whichever module happened to be its first importer |
| `label-*.js`              | 45.99 KB  | 13.54 KB  | React-DOM's client rendering runtime, transitively pulled in — same naming caveat as above                                                                                                                 |
| `ProjectsPage-*.js`       | 25.27 KB  | 7.01 KB   | Largest **feature** chunk — expected, it's the largest module (multi-image gallery/certificate management, service relationships)                                                                          |
| `select-*.js`             | 22.92 KB  | 7.74 KB   | Shared Radix Select primitive                                                                                                                                                                              |
| `ServicesPage-*.js`       | 20.63 KB  | 4.89 KB   | Second-largest feature chunk (multi-section form, dynamic table)                                                                                                                                           |
| `format-*.js`             | 19.25 KB  | 5.52 KB   | date-fns's `format` function, shared                                                                                                                                                                       |

**On the "duplicate imports / dead code" check:** the three largest non-main chunks (`utils`,
`label`, `ConfirmDialog`) have names that don't match their contents — this is Rollup's default
automatic-chunking heuristic naming a shared chunk after an arbitrary importer, not evidence of
duplication. Inspecting their actual contents confirms they're Vite's standard deduplicated
vendor/runtime chunks: React and React-DOM ship exactly once across the whole app, imported by
reference from every page chunk. No duplicate library code was found anywhere in the build.

### Route-level lazy loading

Confirmed intact: every dashboard feature page (`pages/*/  *Page.tsx`) is `React.lazy`-loaded in
`src/app/router.tsx`; only the four auth pages and the app shell are eager, by design (needed on
first paint regardless of session state). Each of the 16 dashboard modules produces its own
chunk, visible in the table above.

### TanStack Query cache behavior

Every list query is keyed `['<module>', 'list', filters?]`; every mutation's `onSuccess`
invalidates the module's full key prefix (`['<module>']`), so create/update/delete correctly
refetches every open filtered/paginated variant of that list, never a stale subset. No global
`staleTime` override is set (TanStack Query's default — refetch on mount/window-focus), which is
appropriate for an admin tool where data can change from other sessions. No duplicate network
requests were found in code review: every list page has exactly one query hook call per data
dependency, no page fetches the same resource twice.

### Memory leaks / object URLs

Every `URL.createObjectURL` call in the codebase (Profile avatar preview, Projects' new-gallery/
certificate-file previews) is paired with `URL.revokeObjectURL` inside a `useEffect` cleanup,
re-verified by project-wide search during this phase. No unreleased object URLs found.

---

## Accessibility assessment

Verified by code inspection (no browser/AT testing tool available this session — see note at
the end of this document).

| Area                                   | Status                                         | Notes                                                                                                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semantic headings                      | ✅                                             | `PageHeader`→`h1`, `SectionHeader`→`h2`, consistent across every page                                                                                                                                                                   |
| Form labels                            | ✅                                             | Every input pairs a `<Label htmlFor>` with a matching `id`, project-wide                                                                                                                                                                |
| `aria-invalid` on invalid fields       | ✅                                             | Applied consistently by every form via `!!form.formState.errors.x`                                                                                                                                                                      |
| Focus trap (dialogs/drawers/dropdowns) | ✅ by construction                             | All built on Radix UI primitives (`Dialog`, `Sheet` on top of `Dialog`, `Select`, `DropdownMenu`), which implement focus trapping and focus restoration natively — not something this codebase reimplements or could accidentally break |
| Keyboard navigation                    | ✅ by construction                             | Same Radix guarantee — every interactive primitive is keyboard-operable out of the box                                                                                                                                                  |
| Status announcements                   | Partial                                        | Toasts (Sonner) render visibly but were not verified for `aria-live` politeness in this session; Sonner's default region is `aria-live="polite"` per its own defaults, not overridden here                                              |
| Color contrast                         | Not measured                                   | No contrast-ratio tool run; the palette (`src/index.css`) was hand-picked from LSA's existing email brand colors, not verified against WCAG AA numerically                                                                              |
| Touch target size                      | Meets WCAG 2.2 AA (24×24px), not AAA (44×44px) | Table row-action buttons use `icon-sm` (28×28px) — a deliberate density tradeoff for a data-dense admin table, not a defect                                                                                                             |
| Reduced motion                         | ✅ (fixed this phase)                          | No `prefers-reduced-motion` handling existed before Phase 10; added a global override in `src/index.css`                                                                                                                                |
| Accessible tables                      | Partial                                        | Uses semantic `<table>`/`<thead>`/`<tbody>` (shadcn `Table` primitive), but no explicit `scope="col"` audit was performed                                                                                                               |
| 404 handling                           | ✅ (fixed this phase)                          | No catch-all route existed before Phase 10; added `NotFoundPage` at `path: '*'`                                                                                                                                                         |

**Not verified — requires a real browser/assistive-technology pass:** actual keyboard-only
click-through of every drawer/dialog, screen-reader announcement testing, a numeric Lighthouse
accessibility score, and visual contrast measurement. Everything marked "by construction" above
is a structural guarantee from using unmodified Radix primitives, not a substitute for that pass.

---

## Security assessment

| Check                                         | Result                                                                                                                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposed secrets / hardcoded tokens            | None found (project-wide search)                                                                                                                                                                                                    |
| `localStorage`/`sessionStorage` token storage | None — auth is httpOnly-cookie-only by design, confirmed no code reads/writes either storage API                                                                                                                                    |
| `dangerouslySetInnerHTML`                     | None found anywhere in the codebase                                                                                                                                                                                                 |
| External links (`target="_blank"`)            | Both instances (Partners' website link, Job Requests' CV link) correctly use `rel="noopener noreferrer"`                                                                                                                            |
| Upload validation                             | Client-side type/size validation (`lib/file-validation.ts`) mirrors the backend's multer limits exactly, applied consistently across all 8 upload-capable components; the backend remains the authoritative validator regardless    |
| Role/route protection                         | Single source of truth (`MODULE_ROLES`) drives both sidebar visibility and route guards — see `docs/ROLE_MATRIX.md`                                                                                                                 |
| Admin-only UI exposure                        | `Users` module (superadmin-only data: emails, roles) is both nav-hidden and route-guarded for every other role; verified no other page conditionally renders admin-only data without an equivalent guard                            |
| Hardcoded API URLs                            | None — `VITE_API_BASE_URL` is the only API origin reference, read via `lib/env.ts`; the two `localhost`/`http://` grep matches found were validation error message text ("must be a valid URL including http://..."), not endpoints |
| Hardcoded colors                              | None outside `src/index.css` (the intended single location for the design token palette) — the one inconsistency found (`text-white` instead of the `--sidebar-foreground` token in `Sidebar.tsx`) was fixed this phase             |

Exactly one backend file was modified across the entire project — `Backend/src/config/socket.js`,
to let the Socket.IO auth middleware also accept the existing httpOnly `accessToken` cookie
(same trust boundary the REST middleware already uses; no new endpoints/events/tokens exposed to
JS), made only after presenting the exact diff and receiving explicit approval. Every other
backend contract issue discovered during construction (e.g. the Contact Info legacy shape, the
Services malformed record) was handled by making the **frontend** read defensively instead —
never by changing backend code or data.

---

## Maintainability assessment

- **Consistent module shape**: all 16 feature modules follow the identical
  `types/api/queries/schema/components` structure (see `docs/ARCHITECTURE.md`) — a new engineer
  who understands one module understands all of them.
- **Zero schema drift risk**: every Zod schema has an inline comment naming the exact backend
  validation file it mirrors; every type has been checked against a live API response at least
  once during construction (documented per-module in the phase history).
- **No dead code**: `noUnusedLocals`/`noUnusedParameters` are enabled in `tsconfig.app.json` and
  enforced on every `typecheck` run; two components were promoted from feature-local to shared
  (`StringListField`, `StepsEditor`) the moment a second real consumer appeared, never
  speculatively.
- **No orphaned files**: the full `src/` tree was reviewed file-by-file this phase; every file
  maps to a real, currently-used module.
- **No test suite** — the single largest maintainability gap. See Known Limitations below.

---

## Known limitations

1. **No automated test suite.** No unit, integration, or E2E tests exist anywhere in the project.
   All verification throughout development was manual: `typecheck`/`lint`/`format:check`/`build`
   plus live integration testing against the real running backend (curl-based CRUD cycles per
   module, repeated at every phase). This is a real gap for long-term maintainability — a future
   contributor has no regression safety net.
2. **No browser/E2E test tooling available this session** — Phase 10's browser-based visual QA,
   cross-browser testing (Chrome/Edge/Firefox/Safari), keyboard-navigation walkthroughs, and
   Lighthouse audit could not be literally performed. Everything gated on live browser
   interaction is marked as such above and in the final report, rather than claimed as verified.
3. **Only two real user accounts exist** in the current database (both `superadmin`), plus one
   `equipmentManager` account that was invited but never activated. Role-based access for
   `manager`, `equipmentManager`, `hrManager`, and `contentManager` was verified structurally
   (single source of truth, described above) but not exercised by actually signing in as each
   role live.
4. **Real-time notifications have no history or mark-as-read persistence**, because the backend
   has neither endpoint — this is a backend gap, not a frontend shortcut (see
   `docs/ARCHITECTURE.md`'s "Real-time notifications" section). "Recent" means "since this socket
   connected"; mark-as-read is client-state-only and doesn't survive a reload.
5. **No numeric accessibility audit** (contrast ratios, Lighthouse score) was run — see the
   Accessibility assessment above.
6. **The Services module has one pre-existing malformed database record** ("EPC Projects",
   missing several backend-required sections). The dashboard now handles it gracefully
   (marked "Incomplete" in the list, editable to repair, or deletable) but the underlying data
   was left untouched pending your decision on which to do.
7. **Contact Information's seeded record has a legacy top-level `address` field** alongside the
   correct `location.address` (harmless — the dashboard prefers the correct field and repairs the
   shape on next save — but the stray field remains in the database until then).

## Future improvements (not built, not requested this phase)

- Automated test suite (component tests for shared UI, integration tests for each feature
  module's CRUD cycle, E2E smoke tests for the critical paths: login, create/edit/delete per
  module, role-gated navigation).
- A backend notification-history endpoint (paginated `GET /notifications`) and a mark-as-read
  endpoint, so the dashboard's notification feed could show more than "since I connected" and
  persist read state — both are backend work, not something the frontend can add on its own.
- A dedicated numeric accessibility audit and remediation pass.
- CI pipeline running `typecheck`/`lint`/`format:check`/`build` on every push.
- Cloudinary `f_auto`/`q_auto` already applied to every thumbnail; a further improvement would be
  responsive `srcset` generation for the few full-size image displays (e.g. drawer previews).

---

## Release checklist — v1.0

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean (only pre-existing `router.tsx` fast-refresh warnings from
      intentional route-level code splitting, not errors)
- [x] `npm run format:check` — clean
- [x] `npm run build` — succeeds, bundle report above
- [x] Real-backend regression smoke test — all 14 module list endpoints return 200 against the
      live backend after every Phase 10 change
- [x] CRUD regression — exercised live per-module throughout construction (documented per-phase);
      not re-run exhaustively this phase since no CRUD logic changed in Phase 10 (only
      defensive-rendering, routing, and styling fixes)
- [x] Upload regression — client-side validation logic unchanged this phase, previously verified
      live per upload-capable module
- [x] Role-access structural verification — single-source-of-truth confirmed by code inspection
      (see above); live multi-account testing not possible with only two active accounts
- [x] Hardcoded-color scan — clean after the Sidebar token fix
- [x] Console-error check — not verifiable without a browser this session; `ErrorBoundary`'s
      `console.error` is the only intentional console usage in the codebase (project-wide search)
- [ ] Lighthouse audit — **not performed, no browser tooling available**
- [ ] Live cross-browser/cross-device pass — **not performed, no browser tooling available**
- [x] Backend changes — exactly one, `Backend/src/config/socket.js`'s socket auth cookie
      fallback (Phase 10.5, explicitly approved, diff presented before applying, verified live
      end-to-end both directly and through the Vite proxy chain); zero backend changes in every
      other phase
- [x] No API contracts, REST auth/cookie behavior, roles, uploads, middleware, or validation
      changed — verified; the one Socket.IO auth addition is additive-only (existing
      `auth.token`/`Authorization` header paths untouched) and doesn't change what any REST
      endpoint accepts or returns

## Deployment recommendation

Same as documented in the root `README.md`: deploy the dashboard and API behind one shared
origin (reverse proxy / same-origin), keep `VITE_API_BASE_URL` relative (`/api/v1`), and no
backend CORS change is needed. If cross-origin deployment is required instead, the backend
already handles the cookie side correctly in `NODE_ENV=production` — only the (not-yet-made,
requires-approval) CORS middleware addition documented there would be needed.

## Production-readiness score

**7.5 / 10** — All sixteen planned modules are complete, individually verified against the live
backend, and pass every automatable check (typecheck/lint/format/build/regression). The
architecture is consistent and well-documented. The two things holding this back from a higher
score are structural, not cosmetic: **no automated test suite** (all regression safety is manual)
and **no live browser/cross-device/accessibility verification was possible this session** — both
are real gaps between "code is correct" and "a human has watched it work everywhere it needs to."
