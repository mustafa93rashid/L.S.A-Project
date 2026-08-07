# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal L.S.A Engineering Services staff, across five fixed roles, authenticating into the
admin dashboard as part of their day-to-day work:

- **Super Admin** — full system access; the only role that can invite, deactivate, or change
  another user's role.
- **Manager** — all operational modules except Users.
- **Equipment Manager** — Equipment Requests only (plus Profile/Overview).
- **HR Manager** — Jobs and Job Requests only (plus Profile/Overview).
- **Content Manager** — website content modules only: Equipment Categories, Equipment, Company
  Journey, Partners, Team Members, Contact Information, Services, Projects (plus
  Profile/Overview).

Every authenticated role reaches Dashboard Overview and Profile regardless of other permissions;
Overview itself only renders the stat blocks that role can see.

## Product Purpose

An internal admin/operations console for L.S.A Engineering Services staff to run day-to-day
company operations: the equipment catalog and incoming equipment requests, job postings and
applications, contact messages, and the company's content records (services, projects,
partners, team, company journey, contact info), plus internal user/role administration.
Confirmed internal-only today — no live public site currently consumes this content; revisit
this record if that changes.

## Positioning

Not a market-facing product with competitors to differentiate from; its real distinction versus
an ordinary CRUD admin panel is architectural discipline. Role-based access has exactly one
source of truth — the backend's `role([...])` middleware — mirrored verbatim into the frontend's
sidebar filtering and route guards, so they cannot disagree by construction, not by convention.
Authentication is entirely httpOnly-cookie based; access/refresh tokens are never readable from
client JavaScript.

## Operating Context

Staff log in, land on Dashboard Overview, and work through whatever modules their role permits:
reviewing and resolving incoming Equipment Requests, Job Requests, and Contact Messages (each
carries a live "new" count pushed over Socket.IO); managing the Equipment catalog/categories;
maintaining website content records (Services, Projects, Partners, Team Members, Company
Journey, Contact Information); Super Admins additionally manage user accounts and roles. Runs in
development against a local Node/Express/MongoDB backend, proxied through Vite so the
httpOnly-cookie auth flow stays same-origin.

## Capabilities and Constraints

- **Auth**: JWT access + refresh tokens in httpOnly cookies, never exposed to JS. Login, refresh,
  forgot/reset password, account activation.
- **Realtime**: Socket.IO notification center — bell dropdown, unread badge, connection-status
  awareness — driven live; there is no persisted-inbox/history endpoint.
- **Uploads**: Cloudinary media management (avatars, equipment images, team/partner/project
  imagery) via Multer, with generated thumbnail transforms.
- **Validation & security**: Zod-based validation, rate limiting, RBAC enforced identically on
  both sides.
- **Hard constraint (repeatedly stated in project docs): the Dashboard must never modify Backend
  files without the user's explicit approval.** It is built and maintained as an independent
  sibling project to `../Backend` — confirmed by the Dashboard README ("No backend files have
  been modified at any point in this project") and by a currently-pending CORS change that is
  explicitly flagged as needing approval rather than made unilaterally.
- Five fixed roles (`superadmin`, `manager`, `equipmentManager`, `hrManager`, `contentManager`)
  — no custom or dynamic role system.
- Existing stack (not a greenfield decision): React 19, TypeScript, Vite, React Router v7,
  TanStack Query/Table, Zustand, React Hook Form + Zod, Tailwind CSS v4 + shadcn/ui (Radix UI),
  Axios, Sonner, date-fns, Socket.IO client.

## Brand Commitments

Name: **L.S.A Engineering Services** (the company); **LSA Dashboard** (this product), currently
v1.0.

## Evidence on Hand

Real, maintained project documentation — treat as authoritative; don't re-derive or contradict
it without cause:

- `Dashboard/docs/ARCHITECTURE.md` — folder structure, module shape, routing, state management,
  API integration, upload behavior, shared components.
- `Dashboard/docs/ROLE_MATRIX.md` — full role/module access matrix, sourced directly from the
  backend's own middleware.
- `Dashboard/docs/PRODUCTION_CHECKLIST.md` — bundle report, accessibility/security/
  maintainability assessment, known limitations.
- `Dashboard/docs/CHANGELOG.md` — v1.0 changelog.
- `Backend/README.md` — API architecture, modules, roles, security overview.

No testimonials, pricing, case studies, or public-facing marketing claims exist or apply — this
is an internal tool, not a marketed product.

## Product Principles

1. RBAC has exactly one source of truth (backend middleware); the frontend never maintains a
   second, driftable copy — sidebar and route guards read the same map.
2. Auth is entirely httpOnly-cookie based — tokens are never exposed to client JavaScript, by
   design.
3. The Backend is a protected boundary: design and build work happens as an independent sibling
   to it, and backend files are never touched without the user's explicit approval.
4. Real-time operational awareness (new equipment/job/contact requests surfaced live via
   Socket.IO) is core to how staff actually use the tool, not a cosmetic add-on.
5. Each role is deliberately narrow and single-purpose (e.g. Equipment Manager sees only
   Equipment Requests) rather than a small number of broad, overlapping permission tiers.
6. Success is measured by faster, more accurate handling of equipment/job/contact requests and
   safe, zero-drift role-scoped administration — not by engagement or growth metrics, which
   don't apply to an internal tool.

## Accessibility & Inclusion

No formally mandated standard is on record. The existing production checklist
(`Dashboard/docs/PRODUCTION_CHECKLIST.md`) shows WCAG-aware but incomplete coverage: touch
targets meet WCAG 2.2 AA (24×24px) but not AAA; the color palette was hand-picked from LSA's
existing brand colors but never numerically verified for contrast; table semantics are mostly in
place but haven't had a formal `scope="col"` audit. Treat this as the honest current baseline,
not a target that has already been met.
