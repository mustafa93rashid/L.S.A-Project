# Design System: LSA Dashboard

> **Source of truth note:** `search.py --design-system` was run twice for this file (queries
> "...operations..." and "...b2b saas admin dashboard...") and both times matched a landing-page
> pattern/style (`Real-Time / Operations Landing`, `Exaggerated Minimalism` — oversized
> `clamp(3rem,10vw,12rem)` hero type, scroll-reveal GSAP) that does not fit an internal, dense,
> Operate-mode admin dashboard. Rather than persist a mismatched match, this file documents the
> **actual, already-implemented** design system in `Dashboard/src/index.css` ("LSA Design System
> v2 — Confident Enterprise Minimalism"), cross-checked against the tool's own better-targeted
> lookups (`--domain style "enterprise minimal professional corporate"` →
> **Minimalism & Swiss Style**, "Best For: Enterprise apps, dashboards... professional tools";
> `--domain product "admin dashboard"` → Analytics/Financial Dashboard entries, "Data-Dense" /
> "Drill-Down Analytics"). Treat those as validation, not as the values below — the values below
> are what's actually in the codebase.

### Design Dials

- **Variance:** 3/10 — Centered / Minimal (confirmed by tool)
- **Motion:** 2/10 — Subtle (confirmed by tool; codebase uses 150–220ms transitions only)
- **Density:** 8/10 — Dense / Dashboard (confirmed by tool)

### Pattern

- **Name:** Operate — Persistent App Shell
- **Mode:** Operate (per `ui-ux-pro-max`'s own Mode taxonomy: "the visitor completes a task...
  scanability, consistency, native expectations... outrank expression"). Not a landing/marketing
  pattern — there is no visitor to convert; every screen is an internal task surface.
- **Structure:** Fixed dark-navy Sidebar (collapsible, role-filtered nav) + floating rounded
  Topbar (Welcome Banner + global search + notifications + avatar) + `PageHeader`/Breadcrumbs +
  content (mostly `DataTable`-driven list/detail/form pages).
- **Color strategy:** Light mode only. Two-tone brand identity — dark navy Sidebar (brand,
  static) vs. interactive blue (every button/link/active-state/focus ring) — is the single
  strongest visual signature; blue is never used decoratively where it isn't "this is
  interactive."

### Style

- **Name:** "Confident Enterprise Minimalism" (this project's own identity), built on the
  **Minimalism & Swiss Style** family the tool's `--domain style` search independently
  confirmed as the right fit ("Enterprise apps, dashboards... professional tools", subtle
  200–250ms hover, high contrast, WCAG AAA-capable).
- **Mode Support:** Light ✓ Full · Dark — deliberately removed (there was never a live toggle;
  see the Phase 10.5→v2 redesign changelog).
- **Keywords:** Restrained, precise, data-dense but scannable, semantic-token-driven, layered
  depth over brightness (active states signaled by shape/rail/inset-surface/weight, not a bright
  fill).
- **Avoid:** Glassmorphism, neon/gaming effects, strong/loud gradients, oversized display type,
  raw hex in components (semantic tokens only), dark-mode variants (none exist).

### Colors

All defined as CSS custom properties in `src/index.css`, consumed via Tailwind `@theme inline`
— never hardcode a hex in a component.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (page) | `#F8FAFC` | `--background` |
| Foreground (text) | `#0F172A` | `--foreground` |
| Card / Surface | `#FFFFFF` | `--card` |
| Muted surface | `#F1F5F9` | `--muted` |
| Muted foreground | `#64748B` | `--muted-foreground` |
| Accent (hover wash) | `#EFF4FF` | `--accent` |
| Border / Input | `#E2E8F0` | `--border` / `--input` |
| Primary (interactive) | `#2563EB` | `--primary` |
| Primary hover | `#1D4ED8` | `--primary-hover` |
| Primary active | `#1E40AF` | `--primary-active` |
| Destructive | `#DC2626` | `--destructive` |
| Success | `#16A34A` | `--success` |
| Warning | `#D97706` | `--warning` |
| Info | `#0891B2` | `--info` |
| Sidebar (brand navy) | `#0F1B42` | `--sidebar` |
| Sidebar surface end | `#0C1638` | `--sidebar-surface-end` |
| Sidebar primary (active nav) | `#3B82F6` | `--sidebar-primary` |
| Topbar surface | `#F7FAFF` | `--topbar-surface` |
| Welcome Banner surface (3-stop) | `#EEF4FC → #EAF1F9 → #EDF3FA` | `--banner-surface-start/mid/end` |

*Every status color (destructive/success/warning/info) also has a `-subtle` background-tint
variant for badges/alerts — never reused as a CTA color.* **Tool validation:** the independent
`--design-system` color match landed on `#0F172A` navy primary / `#F8FAFC` background —
confirming the same navy + cool-neutral direction this project had already chosen.

### Typography

- **Font:** System-native stack — `'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system,
  'Inter', sans-serif`. **Deliberate decision, not a gap**: zero added network cost, zero
  flash-of-unstyled-text risk (see `index.css`'s Design System v2 header comment). Do not swap
  in a webfont (the tool's own match, Plus Jakarta Sans, is validated as dashboard-appropriate —
  "Best For: B2B SaaS apps... admin dashboards" — and is the documented fallback choice *if* this
  no-webfont decision is ever revisited, but it has not been).
- **Fixed scale mapping** (don't reach for an arbitrary size):

  | Class | Use |
  |---|---|
  | `text-2xl font-semibold tracking-tight` | Page title (h1) |
  | `text-lg font-semibold tracking-tight` | Section title (h2) |
  | `text-base font-semibold` | Card title |
  | `text-sm` | Body copy (default) |
  | `text-sm text-muted-foreground` | Secondary/supporting text |
  | `text-xs` | Captions, table meta |
  | `text-xs font-semibold uppercase tracking-wide text-muted-foreground` | Eyebrow/overline |

### Spacing

Tailwind's 4px scale under an explicit 8pt rhythm: every component padding/gap snaps to
8/16/24/32/48px (`2`/`4`/`6`/`8`/`12`). 4px (`1`) is reserved for fine text-adjacent gaps only
(icon-to-label, badge dot-to-text) — never page/section/card-level spacing.

### Radius & Elevation

- **Radius:** base `--radius: 0.75rem` (12px), scaled via `--radius-sm` (0.6×) through
  `--radius-4xl` (2.6×).
- **Shadows** (three working levels + two chrome-specific):
  - `shadow-xs` — resting/default
  - `shadow-card` — hover/raised card
  - `shadow-elevated` — modal/drawer/popover (navy-tinted, larger blur)
  - `shadow-float` — the Topbar shell's own floating-header shadow (faint inset top highlight +
    tight near-shadow + wide far-shadow)
  - `shadow-banner` — the Welcome Banner's lighter, primary-tinted elevation, one step up from
    `shadow-float`

### Key Effects

- Two-tone brand contrast (static navy Sidebar vs. active interactive blue) is the load-bearing
  visual signature — not a decorative gradient.
- The Topbar's Welcome Banner is the one place a very soft, layered background is allowed:
  tonal blue/slate/white base + two off-corner brand-color glows (blue + navy) + an extremely
  faint engineering grid/precision-dot texture (`.bg-welcome-banner` in `index.css`) — always at
  trace opacity (4–14%), never affecting text contrast.
- Active nav/table states are signaled by shape + depth + weight (left rail, inset surface,
  heavier label), deliberately not by a single bright fill.

### Motion

150–220ms transitions only (`duration-150` / `duration-200` used throughout); no scroll-triggered
reveals, no GSAP, no continuous/looping animation outside a live connection-status pulse. Every
Dialog/Sheet/dropdown transition routes through `tw-animate-css`'s `animate-in`/`animate-out`
utilities, globally forced to `0.01ms` under `prefers-reduced-motion: reduce` (see `index.css`'s
media query at the bottom of the file) — this override is universal, not opted into per
component.

### Icons

`lucide-react` exclusively, SVG, `strokeWidth={1.75}` is the common weight in refined components
(default `2` elsewhere is acceptable). Never emoji as icons.

### Avoid (Anti-patterns)

- Dark mode variants (none exist — light mode only, by deliberate decision)
- Glassmorphism, neon/gaming effects, strong/loud gradients
- Raw hex colors inside components — semantic tokens (`--color-*`) only
- Oversized display type / massive whitespace (an Operate-mode data console, not a marketing
  page)
- Reusing the interactive blue decoratively where it isn't functionally "this is interactive"

### Pre-Delivery Checklist

- [ ] No emojis as icons (lucide-react SVG only)
- [ ] `cursor-pointer` / native affordance on all clickable elements
- [ ] Hover/focus transitions in the 150–220ms range, nothing slower
- [ ] Light-mode text contrast 4.5:1 minimum (no numeric audit exists yet — see
  `Dashboard/docs/PRODUCTION_CHECKLIST.md`; treat as unverified, not passed)
- [ ] Focus states visible for keyboard nav (`focus-visible:ring-*`, never removed)
- [ ] `prefers-reduced-motion` respected (already global — don't bypass it per-component)
- [ ] Responsive: mobile / `sm` / `md` / `lg` / `xl` breakpoints, no horizontal overflow
- [ ] Colors via CSS variables/Tailwind tokens only, never a raw hex in a component
- [ ] New surfaces reuse an existing shadow/radius/spacing token before inventing a new one
