import {
  Briefcase,
  DatabaseBackup,
  FileText,
  FolderKanban,
  Handshake,
  Home,
  Inbox,
  Layers,
  Mail,
  Milestone,
  Newspaper,
  Phone,
  Truck,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import { MODULES, type ModuleKey } from '@/constants/permissions'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  /** Omitted = visible to every authenticated role (e.g. Overview). */
  module?: ModuleKey
  /** Visual grouping in the sidebar — items with the same group render
   * under one heading, in array order. */
  group?: string
}

/**
 * Filtering is by `hasModuleAccess` (constants/permissions.ts), the same
 * source of truth transcribed from the backend's verified role([...])
 * middleware, so the sidebar and the route guards can never disagree
 * about who sees what. Profile is intentionally not here — it's reached
 * via the Topbar's user menu, not the sidebar.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/', icon: Home },
  {
    label: 'Partners',
    path: '/partners',
    icon: Handshake,
    module: MODULES.PARTNERS,
    group: 'Content',
  },
  {
    label: 'Company Journey',
    path: '/journeys',
    icon: Milestone,
    module: MODULES.JOURNEYS,
    group: 'Content',
  },
  {
    label: 'Company Profile',
    path: '/company-profile',
    icon: FileText,
    module: MODULES.COMPANY_PROFILE,
    group: 'Content',
  },
  {
    label: 'Team Members',
    path: '/team-members',
    icon: UserRound,
    module: MODULES.TEAM_MEMBERS,
    group: 'Content',
  },
  {
    label: 'Services',
    path: '/services',
    icon: Wrench,
    module: MODULES.SERVICES,
    group: 'Content',
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    module: MODULES.PROJECTS,
    group: 'Content',
  },
  {
  label: 'News',
  path: '/news',
  icon: Newspaper,
  module: MODULES.NEWS,
  group: 'Content',
},
  {
    label: 'Contact Information',
    path: '/contact-info',
    icon: Phone,
    module: MODULES.CONTACT_INFO,
    group: 'Content',
  }, 
  {
    label: 'Categories',
    path: '/equipment-categories',
    icon: Layers,
    module: MODULES.EQUIPMENT_CATEGORIES,
    group: 'Equipment',
  },
  {
    label: 'Catalog',
    path: '/equipment',
    icon: Truck,
    module: MODULES.EQUIPMENT,
    group: 'Equipment',
  },
  {
    label: 'Equipment Requests',
    path: '/equipment-requests',
    icon: Inbox,
    module: MODULES.EQUIPMENT_REQUESTS,
    group: 'Requests',
  },
  {
    label: 'Contact Messages',
    path: '/contact-messages',
    icon: Mail,
    module: MODULES.CONTACT_MESSAGES,
    group: 'Requests',
  },
  {
    label: 'Job Postings',
    path: '/jobs',
    icon: Briefcase,
    module: MODULES.JOBS,
    group: 'Careers',
  },
  {
    label: 'Applications',
    path: '/job-requests',
    icon: FileText,
    module: MODULES.JOB_REQUESTS,
    group: 'Careers',
  },
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    module: MODULES.USERS,
    group: 'Administration',
  },
  {
  label: 'Backup & Recovery',
  path: '/backups',
  icon: DatabaseBackup,
  module: MODULES.BACKUPS,
  group: 'Administration',
},
]
