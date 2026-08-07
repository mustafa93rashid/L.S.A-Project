import {
  Briefcase,
  Home,
  Layers,
  LogOut,
  Mail,
  Milestone,
  Plus,
  Truck,
  Users,
  User as UserIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_ITEMS } from '@/constants/navigation'
import { hasModuleAccess, MODULES } from '@/constants/permissions'
import type { Role } from '@/constants/roles'
import type { CommandItem } from '@/features/command-palette/types'

/** Genuine synonyms only, keyed by path — e.g. "Profile" reasonably
 * matches "user" because it IS the signed-in user's own account, not a
 * hard-coded shortcut invented to make an unrelated page appear. */
const PAGE_KEYWORDS: Record<string, string[]> = {
  '/': ['home', 'dashboard', 'overview'],
  '/equipment-categories': ['equipment', 'categories', 'types'],
  '/equipment': ['equipment', 'catalog', 'inventory', 'fleet'],
  '/equipment-requests': ['equipment', 'requests', 'rentals'],
  '/contact-messages': ['messages', 'inbox'],
  '/jobs': ['jobs', 'careers', 'postings'],
  '/job-requests': ['applications', 'candidates', 'job requests'],
  '/journeys': ['journey', 'timeline', 'history', 'milestones'],
  '/team-members': ['team', 'staff', 'employees'],
  '/contact-info': ['contact', 'phone', 'address'],
  // "services" is a genuine synonym here, not an arbitrary shortcut —
  // Projects and Services are the two case-study/offering content types
  // and are themselves linked by a many-to-many relationship in the data
  // (see docs/ARCHITECTURE.md), so an admin searching "service" reasonably
  // expects Projects to surface alongside Services.
  '/projects': ['portfolio', 'services', 'case studies'],
  '/users': ['admins', 'roles', 'team'],
  '/profile': ['account', 'user', 'me', 'settings'],
}

/**
 * Every navigable page the current role can actually reach — the exact
 * same NAV_ITEMS + hasModuleAccess filtering Sidebar.tsx uses, so the
 * command palette and the sidebar can never disagree about what's
 * visible. Profile is appended separately since it's reached via the
 * Sidebar/Topbar user menu, not the nav list itself, so it isn't in
 * NAV_ITEMS.
 */
export function getPageItems(role: Role | undefined): CommandItem[] {
  const items: CommandItem[] = NAV_ITEMS.filter(
    (item) => !item.module || hasModuleAccess(role, item.module),
  ).map((item) => ({
    id: `page:${item.path}`,
    title: item.label,
    subtitle: item.group,
    icon: item.icon,
    group: 'Pages',
    keywords: PAGE_KEYWORDS[item.path],
    path: item.path,
    perform: ({ navigate }) => navigate(item.path),
  }))

  items.push({
    id: 'page:/profile',
    title: 'Profile',
    subtitle: 'My Account',
    icon: UserIcon,
    group: 'Pages',
    keywords: PAGE_KEYWORDS['/profile'],
    path: '/profile',
    perform: ({ navigate }) => navigate('/profile'),
  })

  return items
}

interface ActionDefinition {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  path: string
  module?: (typeof MODULES)[keyof typeof MODULES]
  perform: CommandItem['perform']
}

/** "Open X" — same destinations as the Pages results, phrased as
 * commands. Gated by the same module permission the target route's own
 * RequireRole guard checks, so nothing here ever navigates somewhere the
 * guard would immediately bounce the user back out of. */
const OPEN_ACTIONS: ActionDefinition[] = [
  {
    id: 'action:open-dashboard',
    title: 'Open Dashboard',
    subtitle: 'Go to Overview',
    icon: Home,
    path: '/',
    perform: ({ navigate }) => navigate('/'),
  },
  {
    id: 'action:open-equipment',
    title: 'Open Equipment',
    subtitle: 'Go to the equipment catalog',
    icon: Truck,
    path: '/equipment',
    module: MODULES.EQUIPMENT,
    perform: ({ navigate }) => navigate('/equipment'),
  },
  {
    id: 'action:open-jobs',
    title: 'Open Jobs',
    subtitle: 'Go to job postings',
    icon: Briefcase,
    path: '/jobs',
    module: MODULES.JOBS,
    perform: ({ navigate }) => navigate('/jobs'),
  },
  {
    id: 'action:open-contact-messages',
    title: 'Open Contact Messages',
    subtitle: 'Go to contact messages',
    icon: Mail,
    path: '/contact-messages',
    module: MODULES.CONTACT_MESSAGES,
    perform: ({ navigate }) => navigate('/contact-messages'),
  },
  {
    id: 'action:open-profile',
    title: 'Open Profile',
    subtitle: 'Go to My Account',
    icon: UserIcon,
    path: '/profile',
    perform: ({ navigate }) => navigate('/profile'),
  },
]

/** "Create X" — navigates to the target page and asks it (via router
 * state, see useOpenCreateOnArrival.ts) to open its own existing create
 * dialog/drawer. No new dialogs are introduced; each target page already
 * has one. */
const CREATE_ACTIONS: ActionDefinition[] = [
  {
    id: 'action:create-user',
    title: 'Create User',
    subtitle: 'Invite a new dashboard user',
    icon: Plus,
    path: '/users',
    module: MODULES.USERS,
    perform: ({ navigate }) => navigate('/users', { state: { openCreate: true } }),
  },
  {
    id: 'action:create-equipment',
    title: 'Create Equipment',
    subtitle: 'Add a new equipment listing',
    icon: Truck,
    path: '/equipment/new',
    module: MODULES.EQUIPMENT,
    perform: ({ navigate }) => navigate('/equipment/new'),
  },
  {
    id: 'action:create-equipment-category',
    title: 'Create Equipment Category',
    subtitle: 'Add a new equipment category',
    icon: Layers,
    path: '/equipment-categories/new',
    module: MODULES.EQUIPMENT_CATEGORIES,
    perform: ({ navigate }) => navigate('/equipment-categories/new'),
  },
  {
    id: 'action:create-team-member',
    title: 'Create Team Member',
    subtitle: 'Add a new team member',
    icon: Users,
    path: '/team-members/new',
    module: MODULES.TEAM_MEMBERS,
    perform: ({ navigate }) => navigate('/team-members/new'),
  },
  {
    id: 'action:create-partner',
    title: 'Create Partner',
    subtitle: 'Add a new partner',
    icon: Plus,
    path: '/partners/new',
    module: MODULES.PARTNERS,
    perform: ({ navigate }) => navigate('/partners/new'),
  },
  {
    id: 'action:create-job',
    title: 'Create Job Posting',
    subtitle: 'Add a new careers listing',
    icon: Briefcase,
    path: '/jobs/new',
    module: MODULES.JOBS,
    perform: ({ navigate }) => navigate('/jobs/new'),
  },
  {
    id: 'action:create-journey',
    title: 'Create Journey Milestone',
    subtitle: 'Add a company timeline milestone',
    icon: Milestone,
    path: '/journeys/new',
    module: MODULES.JOURNEYS,
    perform: ({ navigate }) => navigate('/journeys/new'),
  },
  {
    id: 'action:create-service',
    title: 'Create Service',
    subtitle: 'Add a new service',
    icon: Plus,
    path: '/services/new',
    module: MODULES.SERVICES,
    perform: ({ navigate }) => navigate('/services/new'),
  },
  {
    id: 'action:create-project',
    title: 'Create Project',
    subtitle: 'Add a new project',
    icon: Plus,
    path: '/projects/new',
    module: MODULES.PROJECTS,
    perform: ({ navigate }) => navigate('/projects/new'),
  },
]

export function getActionItems(role: Role | undefined): CommandItem[] {
  const items: CommandItem[] = [...OPEN_ACTIONS, ...CREATE_ACTIONS]
    .filter((action) => !action.module || hasModuleAccess(role, action.module))
    .map((action) => ({
      id: action.id,
      title: action.title,
      subtitle: action.subtitle,
      icon: action.icon,
      group: 'Actions',
      path: action.path,
      perform: action.perform,
    }))

  items.push({
    id: 'action:logout',
    title: 'Logout',
    subtitle: 'Sign out of your account',
    icon: LogOut,
    group: 'Actions',
    path: '/login',
    trackRecent: false,
    perform: ({ logout }) => logout(),
  })

  return items
}
