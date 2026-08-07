import { create } from 'zustand'

interface PaletteOpenState {
  open: boolean
  setOpen: (open: boolean) => void
}

/** Purely ephemeral open/closed state for the command palette's popover —
 * never persisted. A dedicated store (rather than local component state)
 * so `usePaletteOpenStore.getState()` can be read from inside the global
 * Ctrl/Cmd+K `window` keydown listener without that listener needing to
 * be a React event handler wired to a specific element. */
export const usePaletteOpenStore = create<PaletteOpenState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
