import { Link, useMatches } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface RouteHandle {
  crumb?: string
}

/**
 * Derived from the route tree itself via React Router's `useMatches`, not
 * a hand-maintained path->label map — every dashboard route already opts
 * in with `handle: { crumb: '...' }` (see router.tsx). Only ever renders
 * one crumb today since none of the current routes are nested more than
 * one level deep; extends automatically if a future route nests further.
 * This is the dashboard's sole route-title surface — the Topbar itself no
 * longer duplicates it (see Topbar.tsx); each page's own PageHeader
 * carries the title alongside this.
 */
export function Breadcrumbs() {
  const matches = useMatches()
  const crumbs = matches
    .filter((match) => Boolean((match.handle as RouteHandle | undefined)?.crumb))
    .map((match) => ({
      path: match.pathname,
      label: (match.handle as RouteHandle).crumb as string,
    }))

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <span key={crumb.path} className="flex items-center gap-1.5">
            <BreadcrumbItem>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < crumbs.length - 1 && <BreadcrumbSeparator />}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
