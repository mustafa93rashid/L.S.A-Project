import { useMemo } from 'react'
import { Briefcase, FolderKanban, Handshake, Layers, Newspaper, Truck, UserRound, Users as UsersIcon, Wrench } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { hasModuleAccess, MODULES } from '@/constants/permissions'
import { QuickActions, type QuickAction } from '../navigation/QuickActions'


export function GlobalQuickActions() {
  const role = useSessionStore((state) => state.user?.role)

  const canViewServices = hasModuleAccess(role, MODULES.SERVICES)
  const canViewProjects = hasModuleAccess(role, MODULES.PROJECTS)
  const canViewTeamMembers = hasModuleAccess(role, MODULES.TEAM_MEMBERS)
  const canViewPartners = hasModuleAccess(role, MODULES.PARTNERS)
  const canViewJobs = hasModuleAccess(role, MODULES.JOBS)
  const canViewEquipment = hasModuleAccess(role, MODULES.EQUIPMENT)
  const canViewEquipmentCategories = hasModuleAccess(role, MODULES.EQUIPMENT_CATEGORIES)
  const canViewUsers = hasModuleAccess(role, MODULES.USERS)
  const canViewNews = hasModuleAccess(role, MODULES.NEWS)

  const actions = useMemo<QuickAction[]>(() => {
    const items: QuickAction[] = []

    if (canViewServices) items.push({ key: 'service', label: 'Create Service', icon: Wrench, href: '/services/new' })
    if (canViewProjects) items.push({ key: 'project', label: 'Create Project', icon: FolderKanban, href: '/projects/new' })
    if (canViewTeamMembers) items.push({ key: 'team-member', label: 'Add Team Member', icon: UserRound, href: '/team-members/new' })
    if (canViewPartners) items.push({ key: 'partner', label: 'Add Partner', icon: Handshake, href: '/partners/new' })
    if (canViewJobs) items.push({ key: 'job', label: 'Create Job', icon: Briefcase, href: '/jobs/new' })
    if (canViewEquipment) items.push({ key: 'equipment', label: 'Manage Equipment', icon: Truck, href: '/equipment' })
    if (canViewEquipmentCategories) items.push({ key: 'category', label: 'Add Category', icon: Layers, href: '/equipment-categories/new' })
    if (canViewUsers) items.push({ key: 'users', label: 'Open Users', icon: UsersIcon, href: '/users' })
    if (canViewNews) items.push({ key: 'news', label: 'Create News', icon: Newspaper, href: '/news/new' })

    return items
  }, [canViewServices, canViewProjects, canViewTeamMembers, canViewPartners, canViewJobs, canViewEquipment, canViewEquipmentCategories, canViewUsers, canViewNews])


  return <QuickActions actions={actions} />
}