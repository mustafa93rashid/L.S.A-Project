# Topbar Redesign ("Structured Control Bar") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Dashboard Topbar's current soft, gradient/glow/texture "Welcome Banner" surface with a flat, structurally-divided "control bar" — a navy→blue accent rule, solid dividers marking out zones, and sharper corners — per the approved spec at `docs/superpowers/specs/2026-08-08-topbar-redesign-design.md`.

**Architecture:** Four small, independently-verifiable edits to existing files — no new files. Two small trigger-styling tweaks (`CommandPalette.tsx`, `ProfileMenu.tsx`) happen first since they're low-risk and self-contained. The `Topbar.tsx` structural rewrite happens next. The `index.css` token cleanup happens last, once nothing references the tokens being removed (verified by grep before deleting).

**Tech Stack:** React 19 + TypeScript, Tailwind CSS v4 (`@theme inline` tokens in `src/index.css`), no test framework in this project — verification is `npm run typecheck && npm run lint && npm run format:check && npm run build`, run from `Dashboard/`.

---

## Before You Start

This repo is currently on `main` with a large pile of pre-existing uncommitted changes (unrelated `Backend/` files, an entirely untracked `Dashboard/` history from this session). Task 1 creates a feature branch so this work doesn't land more commits directly on `main`.

All file paths below are relative to `D:\L.S.A Backend\Dashboard\` unless stated otherwise. All commands run with `Dashboard/` as the working directory unless stated otherwise.

---

### Task 1: Create a feature branch

**Files:** none

- [ ] **Step 1: Create and switch to a feature branch**

Run (from the repo root, `D:\L.S.A Backend`):
```bash
git checkout -b topbar-structured-control-bar
```
Expected: `Switched to a new branch 'topbar-structured-control-bar'`

---

### Task 2: CommandPalette trigger — sharper corners, generic border, monospace placeholder

**Files:**
- Modify: `src/features/command-palette/CommandPalette.tsx`

- [ ] **Step 1: Update the trigger button's className and placeholder**

Find this block (the `<PopoverTrigger asChild><button ...>` element):

```tsx
        <button
          type="button"
          title="Search — Ctrl/Cmd+K"
          className="group flex h-10 items-center gap-2.5 rounded-full border border-topbar-border bg-card px-4 text-muted-foreground shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] outline-none transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/30 hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.08)] focus-visible:border-primary/40 focus-visible:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.12)] active:scale-[0.99] aria-expanded:border-primary/40 aria-expanded:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.12)] md:w-72 lg:w-110 lg:px-5 xl:w-130 2xl:w-140"
        >
          <Search
            className="size-4 shrink-0 text-muted-foreground/70 transition-colors duration-200 ease-out group-hover:text-primary/70"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="flex-1 truncate text-left text-[13.5px] text-muted-foreground/85">
            Search…
          </span>
```

Replace with:

```tsx
        <button
          type="button"
          title="Search — Ctrl/Cmd+K"
          className="group flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-4 text-muted-foreground shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] outline-none transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/30 hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.08)] focus-visible:border-primary/40 focus-visible:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.12)] active:scale-[0.99] aria-expanded:border-primary/40 aria-expanded:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_-16px_rgba(15,23,42,0.16),0_0_0_3px_rgba(37,99,235,0.12)] md:w-72 lg:w-110 lg:px-5 xl:w-130 2xl:w-140"
        >
          <Search
            className="size-4 shrink-0 text-muted-foreground/70 transition-colors duration-200 ease-out group-hover:text-primary/70"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="flex-1 truncate text-left font-mono text-[13px] text-muted-foreground/85">
            Search anything…
          </span>
```

Only three things changed: `rounded-full` → `rounded-lg`, `border-topbar-border` → `border-border`, and the placeholder `<span>` gained `font-mono` (with `text-[13.5px]` → `text-[13px]` to keep the monospace glyphs visually balanced against the sans-serif kbd hints) and its text changed from `Search…` to `Search anything…`. Nothing else in this file changes — search logic, providers, Ctrl/Cmd+K listener, `PopoverContent`, and the results list are untouched.

- [ ] **Step 2: Verify**

Run (from `Dashboard/`):
```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```
Expected: all four succeed with no errors (lint/format may print pre-existing unrelated warnings from other files — confirm nothing new appears for `CommandPalette.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/features/command-palette/CommandPalette.tsx
git commit -m "$(cat <<'EOF'
refactor(topbar): sharpen CommandPalette trigger for Structured Control Bar

- rounded-full -> rounded-lg
- border-topbar-border -> border-border (topbar-border token is being retired)
- placeholder copy in a monospace flavor: "Search anything..."

Part of the Topbar redesign, see docs/superpowers/specs/2026-08-08-topbar-redesign-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: ProfileMenu — correct the focus-ring offset color

**Files:**
- Modify: `src/components/layout/ProfileMenu.tsx`

- [ ] **Step 1: Update the ring-offset token**

Find this line inside the trigger `<button>`'s className:

```
focus-visible:ring-offset-2 focus-visible:ring-offset-topbar-surface
```

Replace with:

```
focus-visible:ring-offset-2 focus-visible:ring-offset-card
```

Reason: the Topbar's actual background is becoming `--card` (flat white) in Task 4, not the old `--topbar-surface` tint — the focus ring's offset color should match what it's actually sitting on.

- [ ] **Step 2: Verify**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```
Expected: all four succeed.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ProfileMenu.tsx
git commit -m "$(cat <<'EOF'
fix(topbar): correct ProfileMenu focus-ring offset color

ring-offset-topbar-surface -> ring-offset-card, matching the Topbar's
new bg-card background (Task 4 of the Structured Control Bar redesign).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Topbar.tsx — the Structured Control Bar rewrite

**Files:**
- Modify: `src/components/layout/Topbar.tsx`

- [ ] **Step 1: Replace `WelcomeBanner`'s doc comment and body**

Find (the whole `WelcomeBanner` function, doc comment included):

```tsx
/**
 * The Welcome Banner — the Topbar's signature visual identity now that
 * the route title is gone: a dynamic greeting, a quiet secondary message,
 * and a subtle date/time caption. Its background/border/shadow now live
 * on the Topbar's own `<header>` (following manual refinement — a single
 * merged surface rather than a separately-styled nested panel); this
 * component owns the content and the one decorative accent left inside
 * it, a soft blurred glow kept behind the text via `-z-10`.
 */
function WelcomeBanner() {
  const user = useSessionStore((state) => state.user)
  const now = useCurrentTime()
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div className=" relative flex min-w-0 flex-1 items-center gap-3 self-stretch overflow-hidden   px-4  sm:gap-4 sm:px-5 lg:px-6">
      {/* Decorative only — a single soft blurred glow, never a literal
          shape, kept behind all content via -z-10. Visible at every
          Topbar width; sized down on narrower screens so it stays
          proportional and never crowds the greeting text. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-6 -z-10 size-32 rounded-full  blur-2xl sm:-top-10 sm:-right-8 sm:size-40 sm:blur-3xl lg:-top-12 lg:-right-10 lg:size-48"
      />

      <span
        aria-hidden="true"
        className="hidden h-9 w-px shrink-0 self-center bg-gradient-to-b from-transparent via-primary/25 to-transparent sm:block"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate text-[21px] leading-tight font-semibold tracking-tight sm:text-2xl">
          <span className="text-foreground">{getGreeting(now)}</span>
          {firstName ? (
            <span className="font-bold text-primary">{`, ${firstName}`}</span>
          ) : null}
        </p>

        <p className="hidden truncate text-[13px] text-muted-foreground sm:block sm:text-sm">
          Welcome back
          <span className="hidden lg:inline">
            {' '}
            — here&rsquo;s your workspace for today.
          </span>
        </p>

        <time
          dateTime={format(now, "yyyy-MM-dd'T'HH:mm")}
          className="hidden items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase tabular-nums md:flex"
        >
          {format(now, 'EEE, MMM d')}
          <span className="text-muted-foreground/35" aria-hidden="true">
            •
          </span>
          {format(now, 'h:mm a')}
        </time>
      </div>
    </div>
  )
}
```

Replace with:

```tsx
/**
 * The greeting content living inside the Topbar's "Structured Control
 * Bar" shell (see Topbar.tsx below): a small "WORKSPACE" eyebrow, the
 * dynamic greeting with the first name in the interactive blue, a quiet
 * secondary message, and a subtle date/time caption. No background,
 * border, or shadow of its own — those live on the Topbar's own
 * <header> now, not on a per-zone surface.
 */
function WelcomeBanner() {
  const user = useSessionStore((state) => state.user)
  const now = useCurrentTime()
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 lg:gap-6">
      <span
        aria-hidden="true"
        className="hidden h-9 w-px shrink-0 self-center bg-border sm:block"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="text-[10px] font-semibold tracking-wide text-sidebar uppercase">
          Workspace
        </span>

        <p className="truncate text-[21px] leading-tight font-semibold tracking-tight sm:text-2xl">
          <span className="text-foreground">{getGreeting(now)}</span>
          {firstName ? (
            <span className="font-bold text-primary">{`, ${firstName}`}</span>
          ) : null}
        </p>

        <p className="hidden truncate text-[13px] text-muted-foreground sm:block sm:text-sm">
          Welcome back
          <span className="hidden lg:inline">
            {' '}
            — here&rsquo;s your workspace for today.
          </span>
        </p>

        <time
          dateTime={format(now, "yyyy-MM-dd'T'HH:mm")}
          className="hidden items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase tabular-nums md:flex"
        >
          {format(now, 'EEE, MMM d')}
          <span className="text-muted-foreground/35" aria-hidden="true">
            •
          </span>
          {format(now, 'h:mm a')}
        </time>
      </div>
    </div>
  )
}
```

What changed: the decorative blurred-glow `<span>` is gone entirely; the leading divider is now solid (`bg-border`) instead of a gradient; a `WORKSPACE` eyebrow line was added above the greeting; the wrapper no longer carries `self-stretch`/`overflow-hidden`/background/border classes (the outer `<header>` owns the surface now — see Step 2). Greeting logic, first-name emphasis, secondary message, and date/time content/behavior are byte-for-byte unchanged.

- [ ] **Step 2: Replace the `Topbar` function's doc comment and body**

Find (the whole exported `Topbar` function, doc comment included):

```tsx
/**
 * The authenticated shell's floating chrome — and, following manual
 * refinement, the Welcome Banner's surface as well: one premium panel
 * (fully rounded, `bg-welcome-banner`, `border-banner-border`,
 * `shadow-float`, margin on every side so it detaches from the page)
 * rather than a separate nested banner layer.
 *
 * A three-column CSS Grid (`minmax(0,1fr) auto minmax(0,1fr)`) — not
 * flex — is what keeps CommandPalette genuinely centered on the Topbar's
 * full width: both side tracks are forced to the same width regardless
 * of how much the greeting or the notification/avatar cluster actually
 * use, so the center track (and CommandPalette inside it) never drifts
 * off-center the way it would sitting in ordinary flex remaining-space.
 *
 * No route title lives here — each page's own PageHeader/Breadcrumbs
 * already carries that; duplicating it was the old design's mistake. No
 * profile/logout controls live in the Sidebar either; the sole account
 * entry point is the avatar in the right-hand cluster, beside
 * NotificationBell (see ProfileMenu.tsx) — right side stays down to
 * exactly those two controls, nothing else.
 */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="relative z-10 m-2 grid h-24 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 rounded-2xl border border-banner-border bg-welcome-banner p-2 shadow-float sm:m-3 sm:gap-4 sm:p-2.5 lg:m-4 lg:gap-5 lg:p-3">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 transition-transform duration-200 ease-out active:scale-95 lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>

        <WelcomeBanner />
      </div>

      <div className="hidden items-center justify-center md:flex">
        <CommandPalette />
      </div>

      <div className="flex items-center justify-self-end gap-3 pr-1 sm:gap-4 sm:pr-1.5">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  )
}
```

Replace with:

```tsx
/**
 * The authenticated shell's floating chrome, redesigned as a
 * "Structured Control Bar" (see
 * docs/superpowers/specs/2026-08-08-topbar-redesign-design.md): a
 * full-width navy->blue accent rule across the very top (the app's own
 * two-tone brand identity, `--sidebar` -> `--primary`, expressed as a
 * rule rather than a soft gradient wash) sitting on a flat `bg-card`
 * surface, with solid `border-border` dividers marking greeting / search
 * / notification+avatar as visibly distinct zones. Structure and rules
 * carry the "engineering precision" identity here, not blur or texture.
 *
 * A three-column CSS Grid (`minmax(0,1fr) auto minmax(0,1fr)`) — not
 * flex — is what keeps CommandPalette genuinely centered on the Topbar's
 * full width: both side tracks are forced to the same width regardless
 * of how much the greeting or the notification/avatar cluster actually
 * use, so the center track (and CommandPalette inside it) never drifts
 * off-center the way it would sitting in ordinary flex remaining-space.
 * The zone dividers are plain conditional borders on the center/right
 * grid items (`self-stretch` so the border spans the bar's full height),
 * not separate grid columns — simpler, and immune to the "empty column
 * still eats a gap" class of bugs.
 *
 * No route title lives here — each page's own PageHeader/Breadcrumbs
 * already carries that. No profile/logout controls live in the Sidebar
 * either; the sole account entry point is the avatar in the right-hand
 * cluster, beside NotificationBell (see ProfileMenu.tsx) — right side
 * stays down to exactly those two controls, nothing else.
 */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="relative z-10 m-2 flex h-24 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-float sm:m-3 lg:m-4">
      <div
        className="h-1 shrink-0 bg-gradient-to-r from-sidebar to-primary"
        aria-hidden="true"
      />

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 p-2 sm:gap-4 sm:p-2.5 lg:gap-5 lg:p-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 transition-transform duration-200 ease-out active:scale-95 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>

          <WelcomeBanner />
        </div>

        <div className="hidden items-center justify-center self-stretch border-l border-border pl-3 sm:pl-4 lg:pl-5 md:flex">
          <CommandPalette />
        </div>

        <div className="flex items-center justify-self-end gap-3 self-stretch pr-1 sm:gap-4 sm:border-l sm:border-border sm:pl-3 sm:pr-1.5 lg:pl-4">
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
```

Key mechanics to understand (so you can verify the result visually, not just that it compiles):

- The header is now `flex flex-col`: a fixed `h-1` (4px) rule strip, then a `flex-1` grid row that fills the remaining `h-24 - 4px` automatically. `overflow-hidden` on the header clips the rule's square corners to the header's `rounded-xl`.
- The grid itself is unchanged from before (3 columns, `items-center`), so Command Palette centering is not affected by this change.
- The two dividers are **not** new grid columns — they're `border-l border-border` on the center and right grid-item wrappers directly, each paired with `self-stretch` so the item (and therefore its border) spans the full row height instead of shrink-wrapping to its content's height. This is why `self-stretch` matters here: without it, the divider would render as a short centered tick mark, not a full-height rule.
- The center wrapper's divider only exists when the wrapper itself renders (`hidden ... md:flex` — Tailwind classes on a `display:none` element simply have no visual effect, so no extra breakpoint prefix is needed on `border-l` itself). The right wrapper's divider is explicitly `sm:border-l` since that cluster is always rendered (unlike the center one) — the divider needs its own breakpoint gate.

- [ ] **Step 3: Verify**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```
Expected: all four succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Topbar.tsx
git commit -m "$(cat <<'EOF'
refactor(topbar): rebuild as a Structured Control Bar

- Flat bg-card surface, rounded-xl (was the multi-layer gradient/glow/
  grid-texture bg-welcome-banner, rounded-2xl)
- New 4px navy->blue accent rule across the top (from-sidebar to-primary)
- Solid border-border zone dividers (greeting | search | notifications+
  avatar) replacing the single soft gradient divider
- WORKSPACE eyebrow added above the greeting
- Decorative blurred-glow element removed

Command Palette centering mechanism (3-col CSS grid), greeting content/
logic, NotificationBell, and ProfileMenu are all unchanged. See
docs/superpowers/specs/2026-08-08-topbar-redesign-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: index.css — retire the dead Welcome Banner / Topbar-surface tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Confirm nothing still references the tokens being removed**

Run (from `Dashboard/`):
```bash
grep -rn "topbar-surface\|topbar-border\|banner-surface\|banner-glow\|banner-grid\|banner-highlight\|banner-border\|banner-emblem\|bg-welcome-banner\|bg-banner-emblem\|shadow-banner" src
```
Expected: **no output** (Tasks 2–4 already removed every usage). If anything prints, stop and find/fix that reference before continuing — deleting a token that's still referenced will silently break the utility class that depended on it (Tailwind just won't generate it) rather than raising a build error.

- [ ] **Step 2: Remove the three dead `@theme inline` color registrations**

Find:

```css
  /* Topbar's own floating-header surface — distinct from both
     --background (the page) and --card (standard content cards). */
  --color-topbar-surface: var(--topbar-surface);
  --color-topbar-border: var(--topbar-border);
  --color-banner-border: var(--banner-border);

  --color-accent-foreground: var(--accent-foreground);
```

Replace with:

```css
  --color-accent-foreground: var(--accent-foreground);
```

- [ ] **Step 3: Remove the dead `--shadow-banner` token**

Find:

```css
  --shadow-float: /* Topbar shell's own floating-header shadow: a faint
    inset top highlight (a "catching light" edge) plus a tight near-shadow
    and a wide soft far-shadow — two shadow distances read as more
    physically grounded than one flat blur, for a convincing "detached
    from the page" lift without a hard edge. */
    inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 32px -8px rgba(15, 23, 42, 0.09);
  --shadow-banner: /* The Welcome Banner's own, lighter elevation — sits
    one layer up from --shadow-float (page -> shell -> banner), so it
    needs less shadow, not more: a bright top highlight plus a tight,
    faintly primary-tinted ambient shadow. */
    inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 24px -14px rgba(37, 99, 235, 0.28);
}
```

Replace with:

```css
  --shadow-float: /* The Topbar's own floating-header shadow: a faint
    inset top highlight (a "catching light" edge) plus a tight near-shadow
    and a wide soft far-shadow — two shadow distances read as more
    physically grounded than one flat blur, for a convincing "detached
    from the page" lift without a hard edge. */
    inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 32px -8px rgba(15, 23, 42, 0.09);
}
```

(Only the doc comment's first line changed too — "Topbar shell's own" → "The Topbar's own" — since there's no separate shell-vs-banner distinction left to explain.)

- [ ] **Step 4: Remove the dead Topbar-surface `:root` block**

Find:

```css
  /* ==================== Topbar (misc references) ====================
     The Topbar's header element itself now renders `.bg-welcome-banner`
     directly (see Topbar.tsx) — these two tokens just back a couple of
     smaller surface-matching details elsewhere (ProfileMenu's focus-ring
     offset, CommandPalette's trigger border) that don't need the full
     multi-layer treatment. */
  --topbar-surface: #f7faff;
  --topbar-border: rgba(148, 163, 184, 0.18);

  /* ==================== Welcome Banner ====================
     The Topbar's signature surface (following manual refinement, this is
     also the Topbar's only surface — see Topbar.tsx) — a tonal blue/slate
     base with more presence than a flat near-white, two off-corner
     brand-color glows (blue + navy, echoing the app's two-tone identity),
     an extremely faint engineering grid + precision-dot pattern for a
     restrained technical texture, and a soft top highlight for a
     "catching light" edge. Every layer is built from these tokens by the
     `.bg-welcome-banner` utility below — deliberately not a flat
     `background: #f7faff`. Tuned one notch cooler/deeper than the initial
     pass so the surface reads clearly against --background (#f8fafc)
     while staying unmistakably light-mode. */
  --banner-surface-start: #eef4fc; /* light, faint blue */
  --banner-surface-mid: #eaf1f9; /* the gradient's deepest point — cool slate-blue */
  --banner-surface-end: #edf3fa; /* settles back slightly lighter */
  --banner-highlight: rgba(255, 255, 255, 0.55); /* top-left "catching light" —
                                                      dialed back from the
                                                      original 0.7 so it
                                                      doesn't wash the
                                                      deeper base back out */
  --banner-glow-primary: rgba(37, 99, 235, 0.11); /* interactive blue, top-left */
  --banner-glow-navy: rgba(15, 27, 66, 0.1); /* brand navy, bottom-right */
  --banner-grid-line: rgba(15, 27, 66, 0.055); /* blueprint hairlines */
  --banner-grid-dot: rgba(37, 99, 235, 0.14); /* precision dots at grid nodes */
  --banner-border: rgba(37, 99, 235, 0.14); /* faint interactive-blue edge */
  --banner-emblem-start: var(--primary);
  --banner-emblem-end: var(
    --sidebar
  ); /* the accent icon tile borrows both
                                           halves of the two-tone identity */

  /* ==================== Charts ==================== */
```

Replace with:

```css
  /* ==================== Charts ==================== */
```

(This deletes both the Topbar-surface block and the entire Welcome Banner block — the Topbar now uses only pre-existing generic tokens: `--card`, `--border`, `--sidebar`, `--primary`.)

- [ ] **Step 5: Remove the dead `.bg-welcome-banner` / `.bg-banner-emblem` utility layer**

Find:

```css
@layer components {
  /* The Welcome Banner's signature surface — seven layers, front to back:
       1. a soft white highlight, top-left, simulating a caught light
       2. a precision-dot grid (tiled radial-gradient dots)
       3-4. hairline vertical + horizontal grid rules (blueprint texture)
       5-6. two off-corner brand-color glows (interactive blue, brand navy)
       7. a tonal linear base blending blue / slate / white
     Every layer stays at trace opacity by design — remove the text and
     icons and this should still read as an intentionally designed
     surface, not a flat rectangle, while never affecting text contrast. */
  .bg-welcome-banner {
    background-color: var(--banner-surface-end);
    background-repeat:
      no-repeat, repeat, no-repeat, no-repeat, no-repeat, no-repeat,
      no-repeat;
    background-size:
      auto,
      26px 26px,
      auto,
      auto,
      auto,
      auto,
      auto;
    background-image:
      radial-gradient(38% 65% at 8% -8%, var(--banner-highlight), transparent 62%),
      radial-gradient(var(--banner-grid-dot) 1px, transparent 1.6px),
      repeating-linear-gradient(
        90deg,
        var(--banner-grid-line) 0,
        var(--banner-grid-line) 1px,
        transparent 1px,
        transparent 26px
      ),
      repeating-linear-gradient(
        0deg,
        var(--banner-grid-line) 0,
        var(--banner-grid-line) 1px,
        transparent 1px,
        transparent 26px
      ),
      radial-gradient(58% 130% at 102% 130%, var(--banner-glow-navy), transparent 62%),
      radial-gradient(50% 110% at -4% 8%, var(--banner-glow-primary), transparent 58%),
      linear-gradient(
        120deg,
        var(--banner-surface-start) 0%,
        var(--banner-surface-mid) 55%,
        var(--banner-surface-end) 100%
      );
  }

  /* The greeting's accent emblem — a small tile carrying both halves of
     the two-tone brand identity (interactive blue -> brand navy) in one
     diagonal sweep, rather than a flat icon fill. */
  .bg-banner-emblem {
    background-image: linear-gradient(
      135deg,
      var(--banner-emblem-start) 0%,
      var(--banner-emblem-end) 100%
    );
  }
}

/* Every Dialog/Sheet/dropdown transition goes through tw-animate-css's
```

Replace with:

```css
/* Every Dialog/Sheet/dropdown transition goes through tw-animate-css's
```

(This deletes the entire `@layer components { ... }` block — it contained only these two now-unused classes — while leaving the following `@media (prefers-reduced-motion: reduce)` block untouched.)

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```
Expected: all four succeed. This is the final gate for the whole redesign — also re-run the Step 1 grep once more as a sanity check that the deletions didn't miss anything:

```bash
grep -rn "topbar-surface\|topbar-border\|banner-surface\|banner-glow\|banner-grid\|banner-highlight\|banner-border\|banner-emblem\|bg-welcome-banner\|bg-banner-emblem\|shadow-banner" src
```
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/index.css
git commit -m "$(cat <<'EOF'
chore(topbar): retire dead Welcome Banner / topbar-surface tokens

--topbar-surface, --topbar-border, --banner-surface-*, --banner-glow-*,
--banner-grid-*, --banner-highlight, --banner-border, --banner-emblem-*,
--shadow-banner, and the .bg-welcome-banner / .bg-banner-emblem utility
classes are all dead now that Topbar.tsx, CommandPalette.tsx, and
ProfileMenu.tsx have moved onto generic tokens (--card, --border,
--sidebar, --primary, --shadow-float). Verified via grep before deleting.

Completes the Structured Control Bar redesign, see
docs/superpowers/specs/2026-08-08-topbar-redesign-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual Verification (after all tasks)

Not automatable in this project (no browser/visual test harness) — run `npm run dev` from `Dashboard/` and check in the browser:

1. The accent rule spans the full header width, flush with the rounded top corners, at every breakpoint (mobile through desktop).
2. Dividers appear/disappear at the right breakpoints with no stray gap on either side: no divider + no Command Palette below `md`; both appear together at `md:`; the right-side divider appears at `sm:` regardless of Command Palette visibility.
3. The avatar is still fully circular (unchanged — `ProfileMenu.tsx`'s avatar markup was never touched).
4. Ctrl/Cmd+K still opens Command Palette; typing still searches; existing shortcut hints still show.
5. Notification bell dropdown, unread badge, and Socket.IO connection behavior are all unchanged (file was never touched).
6. No horizontal overflow at 375px / 768px / 1024px / 1440px widths.
7. No page title/route name is shown anywhere in the Topbar; Sidebar still has no profile block (neither file was touched by this plan, but worth a glance to confirm nothing regressed).
