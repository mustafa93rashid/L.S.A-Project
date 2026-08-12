import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Command, Plus, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'


export interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  href: string
}


interface QuickActionsProps {
  actions: QuickAction[]
}


const AUTO_CLOSE_DELAY = 6000


export function QuickActions({ actions }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const timerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)


  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return

    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])


  const closeMenu = useCallback(() => {
    clearTimer()
    setIsOpen(false)
  }, [clearTimer])


  const startAutoClose = useCallback(() => {
    clearTimer()

    if (!isOpen) return

    timerRef.current = window.setTimeout(() => {
      setIsOpen(false)
    }, AUTO_CLOSE_DELAY)
  }, [clearTimer, isOpen])


  const handleToggle = () => {
    clearTimer()
    setIsOpen((current) => !current)
  }


  const handleMouseEnter = () => {
    setIsHovered(true)
    clearTimer()
  }


  const handleMouseLeave = () => {
    setIsHovered(false)
    startAutoClose()
  }


  useEffect(() => {
    startAutoClose()

    return clearTimer
  }, [startAutoClose, clearTimer])


  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeMenu])


  if (actions.length === 0) return null


  const isVisible = isHovered || isOpen


  return (
    <div ref={containerRef} className="pointer-events-none fixed bottom-0 left-1/2 z-[80] -translate-x-1/2">

      <div
        className={cn(
          'pointer-events-auto relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'translate-y-0' : 'translate-y-[38px]',
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

        {/* =====================================================
            Quick Actions Panel
        ===================================================== */}

        <div
          className={cn(
            'absolute bottom-[68px] left-1/2 w-[min(540px,calc(100vw-32px))] -translate-x-1/2 origin-bottom overflow-hidden rounded-[24px] border border-border/70 bg-card/95 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-300 ease-out',
            isOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-3 scale-[0.96] opacity-0',
          )}
        >

          {/* Header */}

          <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">

            <div className="min-w-0">

              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-muted/35 text-muted-foreground">
                  <Command className="size-3.5" strokeWidth={1.8} />
                </span>

                <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Workspace
                </span>
              </div>

              <h3 className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                Quick Actions
              </h3>

              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                Access frequently used workspace actions.
              </p>

            </div>


            <button
              type="button"
              aria-label="Close quick actions"
              onClick={closeMenu}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-all duration-200 hover:border-foreground/15 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <X className="size-3.5" strokeWidth={1.8} />
            </button>

          </div>


          {/* Actions */}

          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">

            {actions.map((action, index) => {
              const Icon = action.icon

              return (
                <Link
                  key={action.key}
                  to={action.href}
                  onClick={closeMenu}
                  className="group relative flex min-h-[108px] flex-col overflow-hidden rounded-[17px] border border-border/70 bg-background p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_8px_25px_rgba(0,0,0,0.055)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                >

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-1.5 -top-3 select-none text-[42px] font-bold leading-none tracking-[-0.08em] text-foreground/[0.025] tabular-nums"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>


                  <div className="relative z-10 flex size-9 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground transition-all duration-200 group-hover:border-foreground/10 group-hover:bg-foreground group-hover:text-background">
                    <Icon className="size-4" strokeWidth={1.8} />
                  </div>


                  <div className="relative z-10 mt-auto pt-4">

                    <p className="truncate text-[11px] font-semibold tracking-[-0.01em] text-foreground">
                      {action.label}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-2">

                      <span className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">
                        Open
                      </span>

                      <ArrowUpRight
                        className="size-3 text-muted-foreground/35 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        strokeWidth={1.8}
                      />

                    </div>

                  </div>


                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-3 h-[2px] w-0 rounded-full bg-foreground/60 transition-all duration-300 group-hover:w-7"
                  />

                </Link>
              )
            })}

          </div>


          {/* Footer */}

          <div className="flex items-center justify-between border-t border-border/50 bg-muted/[0.12] px-5 py-2.5">

            <span className="text-[9px] font-medium text-muted-foreground/55">
              Select an action to continue
            </span>

            <span className="text-[9px] font-semibold text-muted-foreground/50 tabular-nums">
              {actions.length} {actions.length === 1 ? 'action' : 'actions'}
            </span>

          </div>


          {/* Pointer */}

          <span
            aria-hidden="true"
            className="absolute -bottom-[6px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-border/70 bg-card"
          />

        </div>


        {/* =====================================================
            Launcher
        ===================================================== */}

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          onClick={handleToggle}
          className={cn(
            'group relative flex h-[52px] items-center gap-3 rounded-t-[18px] border border-b-0 border-border/75 bg-card/95 pl-2 pr-4 text-foreground shadow-[0_-8px_32px_rgba(0,0,0,0.09)] backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
            isVisible && 'rounded-[22px] border-b border-border/75 shadow-[0_14px_42px_rgba(0,0,0,0.14)]',
            isOpen && 'border-foreground/15',
          )}
        >

          {/* Icon */}

          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">

            <Plus
              className={cn(
                'size-[17px] transition-transform duration-300',
                isOpen ? 'rotate-45' : 'group-hover:rotate-90',
              )}
              strokeWidth={2}
            />

            {!isOpen ? (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-card bg-success" />
            ) : null}

          </span>


          {/* Label */}

          <span className="min-w-0 text-left">

            <span className="block text-[10px] font-semibold leading-none tracking-[-0.005em]">
              Quick Actions
            </span>

            <span className="mt-1.5 block text-[8px] font-medium leading-none text-muted-foreground">
              {isOpen ? 'Select an action' : `${actions.length} available`}
            </span>

          </span>


          {/* Command */}

          <span className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/35 text-muted-foreground/50 transition-colors duration-200 group-hover:bg-muted/60 group-hover:text-muted-foreground">
            <Command className="size-3" strokeWidth={1.8} />
          </span>

        </button>

      </div>

    </div>
  )
}