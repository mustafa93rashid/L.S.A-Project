# Role Matrix

Source of truth: `src/constants/permissions.ts` (`MODULE_ROLES`), which is a direct
transcription of the backend's `role([...])` middleware on each router
(`Backend/src/routers/*.js`). Both the sidebar (`src/constants/navigation.ts`, via
`hasModuleAccess`) and every route guard (`src/app/router.tsx`, via `RequireRole`) read from
this exact same map — they cannot disagree, by construction, not by convention.

Five roles exist (`src/constants/roles.ts`), mirroring `Backend/src/models/user.model.js`'s
`role` enum:

| Role               | Label             |
| ------------------ | ----------------- |
| `superadmin`       | Super Admin       |
| `manager`          | Manager           |
| `equipmentManager` | Equipment Manager |
| `hrManager`        | HR Manager        |
| `contentManager`   | Content Manager   |

## Module access

✅ = full dashboard access (list/create/edit/delete, per that module's actual CRUD support).
Every module also lists its base API path for cross-reference.

| Module               | Path                    | superadmin | manager | equipmentManager | hrManager | contentManager |
| -------------------- | ----------------------- | :--------: | :-----: | :--------------: | :-------: | :------------: |
| Dashboard Overview   | `/`                     |     ✅     |   ✅    |        ✅        |    ✅     |       ✅       |
| Users                | `/users`                |     ✅     |         |                  |           |                |
| Equipment Categories | `/equipment-categories` |     ✅     |   ✅    |                  |           |       ✅       |
| Equipment            | `/equipment`            |     ✅     |   ✅    |                  |           |       ✅       |
| Equipment Requests   | `/equipment-requests`   |     ✅     |   ✅    |        ✅        |           |                |
| Contact Messages     | `/contact-messages`     |     ✅     |   ✅    |                  |           |       ✅       |
| Jobs                 | `/jobs`                 |     ✅     |         |                  |    ✅     |                |
| Job Requests         | `/job-requests`         |     ✅     |   ✅    |                  |    ✅     |                |
| Company Journey      | `/journeys`             |     ✅     |   ✅    |                  |           |       ✅       |
| Partners             | `/partners`             |     ✅     |   ✅    |                  |           |       ✅       |
| Team Members         | `/team-members`         |     ✅     |   ✅    |                  |           |       ✅       |
| Contact Information  | `/contact-info`         |     ✅     |   ✅    |                  |           |       ✅       |
| Services             | `/services`             |     ✅     |   ✅    |                  |           |       ✅       |
| Projects             | `/projects`             |     ✅     |   ✅    |                  |           |       ✅       |
| Profile (My Account) | `/profile`              |     ✅     |   ✅    |        ✅        |    ✅     |       ✅       |

Notes:

- **Users** is superadmin-only — no other role can invite, deactivate, or change another
  user's role.
- **Equipment Requests** is the only module `equipmentManager` can see at all; **Jobs** is the
  only module `hrManager` can see besides Job Requests and their own profile. Both roles are
  deliberately narrow, single-purpose accounts.
- **Jobs** itself excludes `manager` (job _postings_ are HR's responsibility), while **Job
  Requests** (applications) includes `manager` alongside `hrManager` — this asymmetry is real,
  taken directly from the backend, not a frontend inconsistency.
- **Profile** and **Dashboard Overview** have no `module` key in `NAV_ITEMS` / no `RequireRole`
  wrapper in the router — every authenticated role reaches them regardless of other permissions.
  The Overview page itself still only renders the stat blocks a given role can see, by checking
  `hasModuleAccess` per section.
- Eight of the thirteen restricted modules (Equipment Categories, Equipment, Company Journey,
  Partners, Team Members, Contact Information, Services, Projects) share the identical
  `[superadmin, manager, contentManager]` role set. This isn't an accident of how the dashboard
  was built — it mirrors the backend's own router-by-router middleware exactly.

## How to verify this hasn't drifted

```ts
// src/constants/permissions.ts
export function hasModuleAccess(role: Role | undefined, moduleKey: ModuleKey): boolean {
  if (!role) return false
  return MODULE_ROLES[moduleKey].includes(role)
}
```

Both consumers call this same function with the same map:

- `src/constants/navigation.ts` filters `NAV_ITEMS` with it before rendering the sidebar.
- `src/app/router.tsx` passes `MODULE_ROLES[MODULES.X]` straight into `<RequireRole roles={...}>`
  for every restricted route.

There is no second copy of this data anywhere in the frontend. If a role's access ever needs to
change, `MODULE_ROLES` is the only place to edit — sidebar and routing update together
automatically.
