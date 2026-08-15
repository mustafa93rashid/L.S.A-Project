import { ROLES, type Role } from '@/constants/roles'

/**
 * One entry per dashboard module. Mirrors the verified `role([...])`
 * middleware calls on every backend router (see the backend analysis) —
 * this is the single source of truth both the sidebar (later) and route
 * guards read from, so the two can never disagree.
 */
export const MODULES = {
  USERS: 'users',
  PARTNERS: 'partners',
  JOURNEYS: 'journeys',
  TEAM_MEMBERS: 'teamMembers',
  SERVICES: 'services',
  PROJECTS: 'projects',
  EQUIPMENT: 'equipment',
  EQUIPMENT_CATEGORIES: 'equipmentCategories',
  CONTACT_INFO: 'contactInfo',
  EQUIPMENT_REQUESTS: 'equipmentRequests',
  JOBS: 'jobs',
  JOB_REQUESTS: 'jobRequests',
  CONTACT_MESSAGES: 'contactMessages',
  COMPANY_PROFILE: 'companyProfile',
} as const

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES]

export const MODULE_ROLES: Record<ModuleKey, Role[]> = {
  [MODULES.USERS]: [ROLES.SUPERADMIN, ROLES.MANAGER ],
  [MODULES.PARTNERS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.JOURNEYS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.TEAM_MEMBERS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.SERVICES]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.PROJECTS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.EQUIPMENT]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.EQUIPMENT_CATEGORIES]: [ROLES.SUPERADMIN,ROLES.MANAGER,ROLES.CONTENT_MANAGER],
  [MODULES.CONTACT_INFO]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.EQUIPMENT_REQUESTS]: [ROLES.SUPERADMIN,ROLES.MANAGER,ROLES.EQUIPMENT_MANAGER],
  [MODULES.JOBS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.HR_MANAGER],
  [MODULES.JOB_REQUESTS]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.HR_MANAGER],
  [MODULES.CONTACT_MESSAGES]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
  [MODULES.COMPANY_PROFILE]: [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.CONTENT_MANAGER],
}

export function hasModuleAccess(role: Role | undefined, moduleKey: ModuleKey): boolean {
  if (!role) return false
  return MODULE_ROLES[moduleKey].includes(role)
}
