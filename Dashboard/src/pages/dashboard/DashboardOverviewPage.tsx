import { useMemo } from 'react'
import {
  Briefcase,
  FolderKanban,
  Handshake,
  Inbox,
  Layers,
  Mail,
  Truck,
  UserRound,
  Users as UsersIcon,
  Wrench,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/data-display/StatCard'

import { useSessionStore } from '@/stores/session.store'
import { hasModuleAccess, MODULES } from '@/constants/permissions'

import {
  useEquipmentRequestStatisticsQuery,
  useEquipmentRequestsQuery,
} from '@/features/equipment-requests/queries'

import {
  useJobRequestStatisticsQuery,
  useJobRequestsQuery,
} from '@/features/job-requests/queries'

import {
  useContactMessageStatisticsQuery,
  useContactMessagesQuery,
} from '@/features/contact-messages/queries'

import { useEquipmentListQuery } from '@/features/equipment/queries'
import { useJobsQuery } from '@/features/jobs/queries'
import { useUsersQuery } from '@/features/users/queries'

import { PriorityKpiCard } from '@/pages/dashboard/PriorityKpiCard'

import {
  OperationsCenter,
  type OperationsQueue,
} from '@/pages/dashboard/OperationsCenter'

import {
  ActivityTimeline,
  type TimelineEntry,
} from '@/pages/dashboard/ActivityTimeline'

import {
  QuickActions,
  type QuickAction,
} from '@/pages/dashboard/QuickActions'

import { LatestUsersCard } from '@/pages/dashboard/LatestUsersCard'

const RECENT_LIMIT = 5
const RECENT_USERS_LIMIT = 5

export default function DashboardOverviewPage() {
  const user = useSessionStore((state) => state.user)
  const role = user?.role

  /* =========================================================
      Permissions
  ========================================================= */

  const canViewEquipmentRequests = hasModuleAccess(
    role,
    MODULES.EQUIPMENT_REQUESTS,
  )

  const canViewJobRequests = hasModuleAccess(
    role,
    MODULES.JOB_REQUESTS,
  )

  const canViewContactMessages = hasModuleAccess(
    role,
    MODULES.CONTACT_MESSAGES,
  )

  const canViewEquipment = hasModuleAccess(
    role,
    MODULES.EQUIPMENT,
  )

  const canViewEquipmentCategories = hasModuleAccess(
    role,
    MODULES.EQUIPMENT_CATEGORIES,
  )

  const canViewJobs = hasModuleAccess(
    role,
    MODULES.JOBS,
  )

  const canViewUsers = hasModuleAccess(
    role,
    MODULES.USERS,
  )

  const canViewServices = hasModuleAccess(
    role,
    MODULES.SERVICES,
  )

  const canViewProjects = hasModuleAccess(
    role,
    MODULES.PROJECTS,
  )

  const canViewTeamMembers = hasModuleAccess(
    role,
    MODULES.TEAM_MEMBERS,
  )

  const canViewPartners = hasModuleAccess(
    role,
    MODULES.PARTNERS,
  )

  /* =========================================================
      Equipment Requests
  ========================================================= */

  const {
    data: equipmentRequestStats,
    isLoading: equipmentRequestStatsLoading,
  } = useEquipmentRequestStatisticsQuery(
    canViewEquipmentRequests,
  )

  const {
    data: recentEquipmentRequests,
  } = useEquipmentRequestsQuery(
    {
      page: 1,
      limit: RECENT_LIMIT,
    },
    canViewEquipmentRequests,
  )

  /* =========================================================
      Job Requests
  ========================================================= */

  const {
    data: jobRequestStats,
    isLoading: jobRequestStatsLoading,
  } = useJobRequestStatisticsQuery(
    canViewJobRequests,
  )

  const {
    data: recentJobRequests,
  } = useJobRequestsQuery(
    {
      page: 1,
      limit: RECENT_LIMIT,
    },
    canViewJobRequests,
  )

  /* =========================================================
      Contact Messages
  ========================================================= */

  const {
    data: contactMessageStats,
    isLoading: contactMessageStatsLoading,
  } = useContactMessageStatisticsQuery(
    canViewContactMessages,
  )

  const {
    data: recentContactMessages,
  } = useContactMessagesQuery(
    {
      page: 1,
      limit: RECENT_LIMIT,
    },
    canViewContactMessages,
  )

  /* =========================================================
      Equipment
  ========================================================= */

  const {
    data: equipmentList,
  } = useEquipmentListQuery(
    {},
    canViewEquipment,
  )

  /* =========================================================
      Jobs
  ========================================================= */

  const {
    data: publishedJobs,
  } = useJobsQuery(
    {
      status: 'published',
      page: 1,
      limit: 1,
    },
    canViewJobs,
  )

  /* =========================================================
      Users
  ========================================================= */

  const {
    data: usersData,
    isLoading: usersLoading,
  } = useUsersQuery(
    {
      page: 1,
      limit: RECENT_USERS_LIMIT,
    },
    canViewUsers,
  )

  /* =========================================================
      Loading States
  ========================================================= */

  const queuesLoading =
    equipmentRequestStatsLoading ||
    jobRequestStatsLoading ||
    contactMessageStatsLoading

  /* =========================================================
      Availability
  ========================================================= */

  const hasAnyStat =
    canViewEquipmentRequests ||
    canViewJobRequests ||
    canViewContactMessages ||
    canViewEquipment ||
    canViewUsers

  const hasAnyRequestQueue =
    canViewEquipmentRequests ||
    canViewJobRequests ||
    canViewContactMessages

  /* =========================================================
      Priority KPI
  ========================================================= */

  const priorityTotal =
    (equipmentRequestStats?.new ?? 0) +
    (jobRequestStats?.new ?? 0) +
    (contactMessageStats?.new ?? 0)
const priorityBreakdown = [
  {
    label: 'Equipment Requests',
    count: equipmentRequestStats?.new ?? 0,
    icon: Inbox,
  },
  {
    label: 'Job Applications',
    count: jobRequestStats?.new ?? 0,
    icon: FolderKanban,
  },
  {
    label: 'Contact Messages',
    count: contactMessageStats?.new ?? 0,
    icon: Mail,
  },
]

  /* =========================================================
      Operations Center
  ========================================================= */

  const operationsQueues = useMemo<OperationsQueue[]>(() => {
    const queues: OperationsQueue[] = []

    if (canViewEquipmentRequests) {
      queues.push({
        key: 'equipment-requests',
        label: 'Equipment Requests',
        icon: Inbox,
        href: '/equipment-requests',
        total: equipmentRequestStats?.total ?? 0,
        newCount: equipmentRequestStats?.new ?? 0,
        inProgress:
          (equipmentRequestStats?.contacted ?? 0) +
          (equipmentRequestStats?.quoted ?? 0),
        resolved:
          (equipmentRequestStats?.approved ?? 0) +
          (equipmentRequestStats?.completed ?? 0) +
          (equipmentRequestStats?.rejected ?? 0),
      })
    }

    if (canViewJobRequests) {
      queues.push({
        key: 'job-requests',
        label: 'Job Applications',
        icon: FolderKanban,
        href: '/job-requests',
        total: jobRequestStats?.total ?? 0,
        newCount: jobRequestStats?.new ?? 0,
        inProgress:
          (jobRequestStats?.reviewed ?? 0) +
          (jobRequestStats?.shortlisted ?? 0),
        resolved:
          (jobRequestStats?.accepted ?? 0) +
          (jobRequestStats?.rejected ?? 0) +
          (jobRequestStats?.ignored ?? 0),
      })
    }

    if (canViewContactMessages) {
      queues.push({
        key: 'contact-messages',
        label: 'Contact Messages',
        icon: Mail,
        href: '/contact-messages',
        total: contactMessageStats?.total ?? 0,
        newCount: contactMessageStats?.new ?? 0,
        inProgress:
          contactMessageStats?.read ?? 0,
        resolved:
          (contactMessageStats?.replied ?? 0) +
          (contactMessageStats?.archived ?? 0),
      })
    }

    return queues
  }, [
    canViewEquipmentRequests,
    canViewJobRequests,
    canViewContactMessages,
    equipmentRequestStats,
    jobRequestStats,
    contactMessageStats,
  ])

  /* =========================================================
      Recent Activity
  ========================================================= */

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = []

    recentEquipmentRequests?.data.forEach((request) => {
      entries.push({
        id: `equipment-request-${request._id}`,
        icon: Inbox,
        tone: 'info',
        title: request.fullName,
        subtitle: `Requested ${
          request.equipment?.title ?? 'equipment'
        }`,
        date: request.createdAt,
        href: '/equipment-requests',
      })
    })

    recentJobRequests?.data.forEach((request) => {
      entries.push({
        id: `job-request-${request._id}`,
        icon: FolderKanban,
        tone: 'success',
        title: `${request.firstName} ${request.lastName}`,
        subtitle: `Applied for ${
          request.job?.title ?? 'a job posting'
        }`,
        date: request.createdAt,
        href: `/job-requests/${request._id}`,
      })
    })

    recentContactMessages?.data.forEach((message) => {
      entries.push({
        id: `contact-message-${message._id}`,
        icon: Mail,
        tone: 'warning',
        title: message.fullName,
        subtitle: `Sent a message about ${message.service}`,
        date: message.createdAt,
        href: '/contact-messages',
      })
    })

    return entries
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 8)
  }, [
    recentEquipmentRequests,
    recentJobRequests,
    recentContactMessages,
  ])

  /* =========================================================
      Quick Actions
  ========================================================= */

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = []

    if (canViewServices) {
      actions.push({
        key: 'service',
        label: 'Create Service',
        icon: Wrench,
        href: '/services/new',
      })
    }

    if (canViewProjects) {
      actions.push({
        key: 'project',
        label: 'Create Project',
        icon: FolderKanban,
        href: '/projects/new',
      })
    }

    if (canViewTeamMembers) {
      actions.push({
        key: 'team-member',
        label: 'Add Team Member',
        icon: UserRound,
        href: '/team-members/new',
      })
    }

    if (canViewPartners) {
      actions.push({
        key: 'partner',
        label: 'Add Partner',
        icon: Handshake,
        href: '/partners/new',
      })
    }

    if (canViewJobs) {
      actions.push({
        key: 'job',
        label: 'Create Job',
        icon: Briefcase,
        href: '/jobs/new',
      })
    }

    if (canViewEquipment) {
      actions.push({
        key: 'equipment',
        label: 'Manage Equipment',
        icon: Truck,
        href: '/equipment',
      })
    }

    if (canViewEquipmentCategories) {
      actions.push({
        key: 'category',
        label: 'Add Category',
        icon: Layers,
        href: '/equipment-categories/new',
      })
    }

    if (canViewUsers) {
      actions.push({
        key: 'users',
        label: 'Open Users',
        icon: UsersIcon,
        href: '/users',
      })
    }

    return actions
  }, [
    canViewServices,
    canViewProjects,
    canViewTeamMembers,
    canViewPartners,
    canViewJobs,
    canViewEquipment,
    canViewEquipmentCategories,
    canViewUsers,
  ])

  /* =========================================================
      Latest Users
  ========================================================= */

  const latestUsers = usersData?.data.map((user) => ({
    id: user._id,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  }))

  /* =========================================================
      Render
  ========================================================= */

  return (
    <PageContainer className="max-w-7xl">
      <div className="space-y-7 lg:space-y-8">
        {/* =====================================================
            Page Header
        ===================================================== */}

        <PageHeader
          title="Overview"
          description={
            hasAnyRequestQueue
              ? `Welcome back, ${user?.fullName ?? ''}. ${
                  priorityTotal > 0
                    ? `${priorityTotal} item${
                        priorityTotal === 1 ? '' : 's'
                      } across your queues need a look.`
                    : 'Everything across your queues is caught up.'
                }`
              : `Welcome back, ${user?.fullName ?? ''}.`
          }
        />

        {/* =====================================================
            Empty State
        ===================================================== */}

        {!hasAnyStat ? (
          <section
            className="
              rounded-2xl
              border
              border-dashed
              border-border
              bg-muted/15
              px-6
              py-12
              text-center
            "
          >
            <p className="text-sm text-muted-foreground">
              There&apos;s nothing to summarize for your role yet —
              use the sidebar to get started.
            </p>
          </section>
        ) : null}

        {/* =====================================================
            Priority KPI
        ===================================================== */}

        {hasAnyRequestQueue ? (
          <PriorityKpiCard
            total={priorityTotal}
            breakdown={priorityBreakdown}
            isLoading={queuesLoading}
          />
        ) : null}

        {/* =====================================================
            Core Metrics
        ===================================================== */}

        {canViewEquipment || canViewJobs || canViewUsers ? (
          <section>
            <div className="mb-4">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Business Snapshot
              </p>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Core Metrics
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Key resources currently available across the platform.
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {canViewEquipment ? (
                <StatCard
                  label="Equipment items"
                  value={equipmentList?.length ?? '—'}
                  icon={Truck}
                />
              ) : null}

              {canViewJobs ? (
                <StatCard
                  label="Active job postings"
                  value={
                    publishedJobs?.pagination.total ?? '—'
                  }
                  icon={Briefcase}
                />
              ) : null}

              {canViewUsers ? (
                <StatCard
                  label="Dashboard users"
                  value={
                    usersData?.pagination.totalUsers ?? '—'
                  }
                  icon={UsersIcon}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* =====================================================
            Main Executive Workspace
        ===================================================== */}

        {hasAnyStat ? (
          <section
            className="
              grid
              grid-cols-1
              gap-6
              xl:grid-cols-12
              xl:items-start
              2xl:gap-7
            "
          >
            {/* =================================================
                Main Column
            ================================================= */}

            <main
              className="
                space-y-6
                xl:col-span-8
                2xl:col-span-8
              "
            >
              {operationsQueues.length > 0 ? (
                <OperationsCenter
                  queues={operationsQueues}
                  isLoading={queuesLoading}
                />
              ) : null}

              <ActivityTimeline
                entries={timelineEntries}
                isLoading={queuesLoading}
                emptyMessage="Activity from your queues will show up here as it happens."
              />
            </main>

            {/* =================================================
                Supporting Rail
            ================================================= */}

            <aside
              className="
                space-y-6
                xl:col-span-4
                2xl:col-span-4
              "
            >
              {canViewUsers ? (
                <LatestUsersCard
                  users={latestUsers}
                  isLoading={usersLoading}
                />
              ) : null}

              <QuickActions actions={quickActions} />
            </aside>
          </section>
        ) : (
          <QuickActions actions={quickActions} />
        )}
      </div>
    </PageContainer>
  )
}
