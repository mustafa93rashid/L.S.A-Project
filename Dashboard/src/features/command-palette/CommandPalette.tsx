import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSessionStore } from '@/stores/session.store'
import { useLogoutMutation } from '@/features/auth/queries'
import { usePaletteOpenStore } from '@/features/command-palette/stores/paletteOpen.store'
import { useRecentPages } from '@/features/command-palette/useRecentPages'
import { useFavoritePages } from '@/features/command-palette/useFavoritePages'
import { frontendSearchProvider } from '@/features/command-palette/providers/frontendSearchProvider'
import type { CommandItem as PaletteItem } from '@/features/command-palette/types'

const SEARCH_DEBOUNCE_MS = 150

/**
 * The global command palette — an inline dropdown anchored to its own
 * Topbar search field, deliberately not a modal: no backdrop, clicking
 * anywhere else just dismisses it (Radix Popover's default outside-click
 * behavior), same as a browser autocomplete. Rendered directly by Topbar
 * (which is mounted once per authenticated session), so its Ctrl/Cmd+K
 * listener is never duplicated and it's never reachable while signed out.
 *
 * Owns the search pipeline (debounced query → frontendSearchProvider →
 * grouped results), the empty-state (Favorites → Recent), and the
 * keyboard affordances beyond cmdk's built-in arrows/Enter/Escape:
 * Tab/Shift+Tab also move the highlighted row, and Ctrl/Cmd+D toggles a
 * favorite on whichever row is highlighted.
 */
export function CommandPalette() {
  const open = usePaletteOpenStore((state) => state.open)
  const setOpen = usePaletteOpenStore((state) => state.setOpen)

  const user = useSessionStore((state) => state.user)
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()

  const { items: favoriteItems, isFavorite, toggleFavorite } = useFavoritePages()
  const { items: recentItems, recordVisit } = useRecentPages()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const [pageResults, setPageResults] = useState<PaletteItem[]>([])
  const [actionResults, setActionResults] = useState<PaletteItem[]>([])
  const [highlightedId, setHighlightedId] = useState('')
  const latestRequestId = useRef(0)

  // Global open/close shortcut. Topbar (this component's only mount
  // point) is rendered exactly once, so this is the single listener for
  // the app.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!usePaletteOpenStore.getState().open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  // Never let a reopened palette flash the previous session's query.
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  // Debounced search against the frontend registry. A request-id guard
  // discards a stale response if a newer query resolves first.
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setPageResults([])
      setActionResults([])
      return
    }

    const requestId = ++latestRequestId.current
    frontendSearchProvider.search(trimmed, { role: user?.role }).then((results) => {
      if (latestRequestId.current !== requestId) return
      setPageResults(results.filter((item) => item.group === 'Pages'))
      setActionResults(results.filter((item) => item.group === 'Actions'))
    })
  }, [debouncedQuery, user?.role])

  const isSearching = query.trim().length > 0
  const visibleItems = useMemo(
    () =>
      isSearching
        ? [...pageResults, ...actionResults]
        : [...favoriteItems, ...recentItems],
    [isSearching, pageResults, actionResults, favoriteItems, recentItems],
  )

  // Keep a row highlighted at all times (mirrors cmdk's own uncontrolled
  // default-to-first-result behavior, which controlling `value` opts out
  // of) — the top result is always ready for an immediate Enter.
  useEffect(() => {
    if (visibleItems.length === 0) {
      setHighlightedId('')
      return
    }
    if (!visibleItems.some((item) => item.id === highlightedId)) {
      setHighlightedId(visibleItems[0].id)
    }
  }, [visibleItems, highlightedId])

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      item.perform({ navigate, logout: () => logoutMutation.mutate() })
      if (item.trackRecent !== false) recordVisit(item.path)
      setOpen(false)
    },
    [navigate, logoutMutation, recordVisit, setOpen],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        const target = visibleItems.find((item) => item.id === highlightedId)
        if (target?.group === 'Pages') {
          event.preventDefault()
          toggleFavorite(target.path)
        }
        return
      }

      if (event.key === 'Tab' && visibleItems.length > 0) {
        event.preventDefault()
        const currentIndex = visibleItems.findIndex((item) => item.id === highlightedId)
        const delta = event.shiftKey ? -1 : 1
        const nextIndex =
          (currentIndex + delta + visibleItems.length) % visibleItems.length
        setHighlightedId(visibleItems[nextIndex].id)
      }
    },
    [visibleItems, highlightedId, toggleFavorite],
  )

  const renderRow = (item: PaletteItem) => {
    const Icon = item.icon
    const pinnable = item.group === 'Pages'
    const pinned = pinnable && isFavorite(item.path)

    return (
      <CommandItem key={item.id} value={item.id} onSelect={() => handleSelect(item)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-muted-foreground transition-colors duration-150 group-data-selected/command-item:border-primary/25 group-data-selected/command-item:bg-primary/10 group-data-selected/command-item:text-primary">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{item.title}</span>
          {item.subtitle ? (
            <span className="truncate text-xs text-muted-foreground">
              {item.subtitle}
            </span>
          ) : null}
        </span>

        {pinnable ? (
          <button
            type="button"
            aria-label={
              pinned
                ? `Remove ${item.title} from favorites`
                : `Add ${item.title} to favorites`
            }
            aria-pressed={pinned}
            onClick={(event) => {
              event.stopPropagation()
              toggleFavorite(item.path)
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 opacity-0 transition-all duration-150 hover:bg-card hover:text-primary group-hover/command-item:opacity-100 group-data-selected/command-item:opacity-100',
              pinned && 'opacity-100 text-primary',
            )}
          >
            <Star
              className={cn('size-3.5', pinned && 'fill-current')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </CommandItem>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          {!open ? (
            <span className="flex shrink-0 items-center gap-1">
              <kbd className="flex h-5 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl
              </kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-muted font-mono text-[10px] font-medium text-muted-foreground">
                K
              </kbd>
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      {/* No custom onOpenAutoFocus needed — Radix's default "focus the
          first focusable descendant" behavior lands on CommandInput
          below, exactly like the search input's previous auto-focus
          inside the old modal Dialog. */}
      <PopoverContent
        align="center"
        sideOffset={10}
        aria-label="Search results"
        className="w-[380px] p-0 sm:w-[440px]"
      >
        <Command
          value={highlightedId}
          onValueChange={setHighlightedId}
          shouldFilter={false}
          onKeyDown={handleKeyDown}
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages, actions…"
            aria-label="Search pages and actions"
          />

          <CommandList>
            {isSearching ? (
              <>
                {pageResults.length === 0 && actionResults.length === 0 ? (
                  <CommandEmpty>No results for “{query.trim()}”.</CommandEmpty>
                ) : null}
                {pageResults.length > 0 ? (
                  <CommandGroup heading="Pages">
                    {pageResults.map(renderRow)}
                  </CommandGroup>
                ) : null}
                {actionResults.length > 0 ? (
                  <CommandGroup heading="Actions">
                    {actionResults.map(renderRow)}
                  </CommandGroup>
                ) : null}
              </>
            ) : (
              <>
                {favoriteItems.length === 0 && recentItems.length === 0 ? (
                  <CommandEmpty>Start typing to search pages and actions.</CommandEmpty>
                ) : null}
                {favoriteItems.length > 0 ? (
                  <CommandGroup heading="Favorites">
                    {favoriteItems.map(renderRow)}
                  </CommandGroup>
                ) : null}
                {recentItems.length > 0 ? (
                  <CommandGroup heading="Recent">
                    {recentItems.map(renderRow)}
                  </CommandGroup>
                ) : null}
              </>
            )}
          </CommandList>

          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
            <KeyHint keys={['↑', '↓']} label="Navigate" />
            <KeyHint keys={['↵']} label="Select" />
            <KeyHint keys={['⌘', 'D']} label="Favorite" />
            <KeyHint keys={['Esc']} label="Close" />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function KeyHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="flex h-4.5 min-w-4.5 items-center justify-center rounded border border-border bg-card px-1 font-mono text-[10px] font-medium text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </span>
      {label}
    </span>
  )
}
