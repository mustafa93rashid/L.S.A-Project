import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { RootLayout } from '@/app/RootLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { RequireGuest } from '@/components/guards/RequireGuest'
import { RequireRole } from '@/components/guards/RequireRole'
import { PageLoader } from '@/components/feedback/PageLoader'
import { MODULE_ROLES, MODULES } from '@/constants/permissions'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ActivateAccountPage from '@/pages/auth/ActivateAccountPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Dashboard feature pages are lazy-loaded — each becomes its own chunk,
// fetched only when its route is visited. Auth pages, guards, and
// DashboardLayout stay eager: they're needed on first paint for every
// session, so splitting them would only add a round trip with no benefit.
const DashboardOverviewPage = lazy(
  () => import('@/pages/dashboard/DashboardOverviewPage'),
)
const EquipmentCategoriesPage = lazy(
  () => import('@/pages/equipment-categories/EquipmentCategoriesPage'),
)
const EquipmentCategoryCreatePage = lazy(
  () => import('@/pages/equipment-categories/EquipmentCategoryCreatePage'),
)
const EquipmentCategoryEditPage = lazy(
  () => import('@/pages/equipment-categories/EquipmentCategoryEditPage'),
)
const EquipmentPage = lazy(() => import('@/pages/equipment/EquipmentPage'))
const EquipmentCreatePage = lazy(() => import('@/pages/equipment/EquipmentCreatePage'))
const EquipmentEditPage = lazy(() => import('@/pages/equipment/EquipmentEditPage'))
const EquipmentRequestsPage = lazy(
  () => import('@/pages/equipment-requests/EquipmentRequestsPage'),
)
const ContactMessagesPage = lazy(
  () => import('@/pages/contact-messages/ContactMessagesPage'),
)
const JobsPage = lazy(() => import('@/pages/jobs/JobsPage'))
const JobCreatePage = lazy(() => import('@/pages/jobs/JobCreatePage'))
const JobEditPage = lazy(() => import('@/pages/jobs/JobEditPage'))
const JobRequestsPage = lazy(() => import('@/pages/job-requests/JobRequestsPage'))
const JobRequestDetailsPage = lazy(
  () => import('@/pages/job-requests/JobRequestDetailsPage'),
)
const UsersPage = lazy(() => import('@/pages/users/UsersPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const PartnersPage = lazy(() => import('@/pages/partners/PartnersPage'))
const PartnerCreatePage = lazy(() => import('@/pages/partners/PartnerCreatePage'))
const PartnerEditPage = lazy(() => import('@/pages/partners/PartnerEditPage'))
const JourneysPage = lazy(() => import('@/pages/journeys/JourneysPage'))
const JourneyCreatePage = lazy(() => import('@/pages/journeys/JourneyCreatePage'))
const JourneyEditPage = lazy(() => import('@/pages/journeys/JourneyEditPage'))
const TeamMembersPage = lazy(() => import('@/pages/team-members/TeamMembersPage'))
const TeamMemberCreatePage = lazy(
  () => import('@/pages/team-members/TeamMemberCreatePage'),
)
const TeamMemberEditPage = lazy(() => import('@/pages/team-members/TeamMemberEditPage'))
const ContactInfoPage = lazy(() => import('@/pages/contact-info/ContactInfoPage'))
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'))
const ServiceCreatePage = lazy(() => import('@/pages/services/ServiceCreatePage'))
const ServiceEditPage = lazy(() => import('@/pages/services/ServiceEditPage'))
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'))
const ProjectCreatePage = lazy(() => import('@/pages/projects/ProjectCreatePage'))
const ProjectEditPage = lazy(() => import('@/pages/projects/ProjectEditPage'))

/** One Suspense boundary around the whole dashboard child outlet, rather
 * than one per route — a single, consistent loading state instead of N
 * near-identical wrappers. ErrorBoundary already wraps everything higher
 * up in AppProviders, so it still catches errors from these chunks too. */
function SuspendedOutlet({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        // Layout route: RequireAuth + DashboardLayout wrap every dashboard
        // page exactly once here, instead of each page wrapping itself.
        // Individual pages then add RequireRole — route access is
        // protected independently of the sidebar hiding a link. Guards
        // and layout are evaluated before the lazy chunk is even
        // requested, so an unauthorized user never downloads a page they
        // can't see.
        element: (
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: (
              <SuspendedOutlet>
                <DashboardOverviewPage />
              </SuspendedOutlet>
            ),
            handle: { crumb: 'Overview' },
          },
          {
            // Layout route: one RequireRole/MODULE_ROLES lookup shared by
            // the list, create, and edit pages beneath it, instead of
            // repeating the role array per child route.
            path: 'equipment-categories',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.EQUIPMENT_CATEGORIES]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <EquipmentCategoriesPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Equipment Categories' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <EquipmentCategoryCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Category' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <EquipmentCategoryEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Category' },
              },
            ],
          },
          {
            path: 'equipment',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.EQUIPMENT]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <EquipmentPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Equipment' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <EquipmentCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Equipment' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <EquipmentEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Equipment' },
              },
            ],
          },
          {
            path: 'equipment-requests',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.EQUIPMENT_REQUESTS]}>
                <SuspendedOutlet>
                  <EquipmentRequestsPage />
                </SuspendedOutlet>
              </RequireRole>
            ),
            handle: { crumb: 'Equipment Requests' },
          },
          {
            path: 'contact-messages',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.CONTACT_MESSAGES]}>
                <SuspendedOutlet>
                  <ContactMessagesPage />
                </SuspendedOutlet>
              </RequireRole>
            ),
            handle: { crumb: 'Contact Messages' },
          },
          {
            path: 'jobs',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.JOBS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <JobsPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Job Postings' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <JobCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Job Posting' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <JobEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Job Posting' },
              },
            ],
          },
          {
            path: 'job-requests',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.JOB_REQUESTS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <JobRequestsPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Job Applications' },
              },
              {
                path: ':id',
                element: (
                  <SuspendedOutlet>
                    <JobRequestDetailsPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Applicant Details' },
              },
            ],
          },
          {
            path: 'journeys',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.JOURNEYS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <JourneysPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Company Journey' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <JourneyCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Milestone' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <JourneyEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Milestone' },
              },
            ],
          },
          {
            path: 'partners',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.PARTNERS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <PartnersPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Partners' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <PartnerCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Partner' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <PartnerEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Partner' },
              },
            ],
          },
          {
            path: 'team-members',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.TEAM_MEMBERS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <TeamMembersPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Team Members' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <TeamMemberCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Team Member' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <TeamMemberEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Team Member' },
              },
            ],
          },
          {
            path: 'contact-info',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.CONTACT_INFO]}>
                <SuspendedOutlet>
                  <ContactInfoPage />
                </SuspendedOutlet>
              </RequireRole>
            ),
            handle: { crumb: 'Contact Information' },
          },
          {
            path: 'services',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.SERVICES]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <ServicesPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Services' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <ServiceCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Service' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <ServiceEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Service' },
              },
            ],
          },
          {
            path: 'projects',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.PROJECTS]}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspendedOutlet>
                    <ProjectsPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Projects' },
              },
              {
                path: 'new',
                element: (
                  <SuspendedOutlet>
                    <ProjectCreatePage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Add Project' },
              },
              {
                path: ':id/edit',
                element: (
                  <SuspendedOutlet>
                    <ProjectEditPage />
                  </SuspendedOutlet>
                ),
                handle: { crumb: 'Edit Project' },
              },
            ],
          },
          {
            path: 'users',
            element: (
              <RequireRole roles={MODULE_ROLES[MODULES.USERS]}>
                <SuspendedOutlet>
                  <UsersPage />
                </SuspendedOutlet>
              </RequireRole>
            ),
            handle: { crumb: 'Users' },
          },
          {
            path: 'profile',
            element: (
              <SuspendedOutlet>
                <ProfilePage />
              </SuspendedOutlet>
            ),
            handle: { crumb: 'My Account' },
          },
        ],
      },
      {
        path: 'login',
        element: (
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <RequireGuest>
            <ForgotPasswordPage />
          </RequireGuest>
        ),
      },
      {
        path: 'reset-password/:token',
        element: (
          <RequireGuest>
            <ResetPasswordPage />
          </RequireGuest>
        ),
      },
      {
        path: 'activate-account/:token',
        element: (
          <RequireGuest>
            <ActivateAccountPage />
          </RequireGuest>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
