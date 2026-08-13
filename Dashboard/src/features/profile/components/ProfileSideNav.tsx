import { CircleUserRound, IdCard, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'


const PROFILE_SECTIONS = [
  { id: 'profile-overview', label: 'Overview', description: 'Profile identity', icon: CircleUserRound },
  { id: 'personal-information', label: 'Personal', description: 'Contact information', icon: UserRound },
  { id: 'account-information', label: 'Account', description: 'Account metadata', icon: IdCard },
  { id: 'email-settings', label: 'Email', description: 'Sign-in email', icon: Mail },
  { id: 'security-settings', label: 'Security', description: 'Password & access', icon: ShieldCheck },
] as const


interface ProfileSideNavProps {
  activeSection: string
  onNavigate: (sectionId: string) => void
}


export function ProfileSideNav({ activeSection, onNavigate }: ProfileSideNavProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

        <div className="border-b border-border/60 px-5 py-4">
          <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Account
          </span>

          <h2 className="mt-1 text-sm font-semibold tracking-[-0.015em] text-foreground">
            Settings Navigation
          </h2>

          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            Manage your profile and account preferences.
          </p>
        </div>


        <nav className="relative p-2">
          <span aria-hidden="true" className="absolute bottom-6 left-[29px] top-6 w-px bg-border/70" />

          <div className="space-y-1">
            {PROFILE_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
                    isActive ? 'bg-muted/60' : 'hover:bg-muted/30',
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                      isActive
                        ? 'border-foreground/10 bg-foreground text-background shadow-sm'
                        : 'border-border/70 bg-card text-muted-foreground group-hover:border-foreground/10 group-hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.8} />
                  </span>


                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[11px] font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
                      {section.label}
                    </span>

                    <span className="mt-0.5 block truncate text-[9px] text-muted-foreground/60">
                      {section.description}
                    </span>
                  </span>


                  {isActive ? (
                    <span aria-hidden="true" className="absolute right-2 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-foreground/70" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

      </div>
    </aside>
  )
}