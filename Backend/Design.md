# LSA Dashboard System Design

> **Version:** Updated Design  
> **Scope:** LSA public website, administration dashboard, authentication, content management, incoming requests, notifications, uploads, and role-based access control.

---

# 1. System Scope

- Authentication is available only for the Dashboard.
- The public website does not provide registration, sign-in, or user accounts.
- Dashboard accounts are created only through User Management.
- Public visitors may:
  - Browse active website content.
  - Submit equipment requests.
  - Submit job applications.
  - Submit contact messages.
- Dashboard users manage content and incoming requests according to their assigned role.
- Every dashboard user has exactly one role.

---

# 2. Actors and Permissions

## 2.1 Super Admin

The `superadmin` role has unrestricted access to all Dashboard modules.

### Authentication

- Sign In.
- Sign Out.
- Refresh Authentication Token.
- Request Password Reset.
- Reset Forgotten Password.

### Profile

- View Own Profile.
- Update Own Profile.
- Change Own Password using email verification.
- Upload Avatar.
- Replace Avatar.
- Remove Avatar.

### User Management

- View Users.
- View User Details.
- Create User Accounts.
- Update User Accounts.
- Activate Users.
- Deactivate Users.
- Change User Roles.
- Reset User Passwords.
- Delete Users when deletion rules allow it.

### Website Content

- Manage Partners.
- Manage Company Journey.
- Manage Team Members.
- Manage Services.
- Manage Projects.
- Manage Equipment Categories.
- Manage Equipment.
- Manage Careers.
- Manage Contact Information.

### Requests Management

- View and manage Equipment Requests.
- View and manage Job Applications.
- View and manage Contact Messages.

### Notifications

- View own notifications.
- Mark notifications as read or unread.
- Delete own notifications.
- View notification statistics.

---

## 2.2 Manager

The `manager` role has access to all current and future operational Dashboard features except User Management.

### Authentication

- Sign In.
- Sign Out.
- Refresh Authentication Token.
- Request Password Reset.
- Reset Forgotten Password.

### Profile

- View Own Profile.
- Update Own Profile.
- Change Own Password using email verification.
- Upload, replace, or remove Avatar.

### Website Content

- Manage all website content modules.
- Manage all future content modules unless explicitly restricted.

### Requests Management

- View and manage Equipment Requests.
- View and manage Job Applications.
- View and manage Contact Messages.
- Manage all future operational request modules unless explicitly restricted.

### Notifications

- View and manage own notifications.

### Explicit Restriction

The `manager` role must not have access to:

- User listing.
- User creation.
- User editing.
- User deletion.
- User activation or deactivation.
- Role assignment.
- Administrative password reset for other users.

---

## 2.3 Equipment Manager

### Authentication

- Sign In.
- Sign Out.
- Refresh Authentication Token.
- Request Password Reset.
- Reset Forgotten Password.

### Profile

- View and update Own Profile.
- Change Own Password.
- Upload, replace, or remove Avatar.

### Equipment Requests

- View Equipment Requests.
- View Equipment Request Details.
- Search and filter Equipment Requests.
- Update Equipment Request Status.
- View Equipment Request Statistics.

### Notifications

- Receive and view Equipment Request notifications.

---

## 2.4 HR Manager

### Authentication

- Sign In.
- Sign Out.
- Refresh Authentication Token.
- Request Password Reset.
- Reset Forgotten Password.

### Profile

- View and update Own Profile.
- Change Own Password.
- Upload, replace, or remove Avatar.

### Careers

- Manage Careers.
- View Job Applications.
- View Job Application Details.
- Search and filter Job Applications.
- Update Job Application Status.
- View Job Application Statistics.

### Notifications

- Receive and view Job Application notifications.

---

## 2.5 Content Manager

### Authentication

- Sign In.
- Sign Out.
- Refresh Authentication Token.
- Request Password Reset.
- Reset Forgotten Password.

### Profile

- View and update Own Profile.
- Change Own Password.
- Upload, replace, or remove Avatar.

### Website Content

- Manage Partners.
- Manage Company Journey.
- Manage Team Members.
- Manage Services.
- Manage Projects.
- Manage Equipment Categories.
- Manage Equipment.
- Manage Contact Information.

### Contact Messages

- View Contact Messages.
- View Contact Message Details.
- Search and filter Contact Messages.
- Update Contact Message Status.
- View Contact Message Statistics.

### Notifications

- Receive and view Contact Message and content-related notifications.

---

# 3. Role Access Matrix

| Module | Super Admin | Manager | Equipment Manager | HR Manager | Content Manager |
|---|---:|---:|---:|---:|---:|
| Own Profile | Full | Full | Full | Full | Full |
| User Management | Full | No Access | No Access | No Access | No Access |
| Partners | Full | Full | No Access | No Access | Full |
| Company Journey | Full | Full | No Access | No Access | Full |
| Team Members | Full | Full | No Access | No Access | Full |
| Services | Full | Full | No Access | No Access | Full |
| Projects | Full | Full | No Access | No Access | Full |
| Equipment Categories | Full | Full | No Access | No Access | Full |
| Equipment Content | Full | Full | No Access | No Access | Full |
| Careers Content | Full | Full | No Access | Full | No Access |
| Contact Information | Full | Full | No Access | No Access | Full |
| Equipment Requests | Full | Full | Full | No Access | No Access |
| Job Applications | Full | Full | No Access | Full | No Access |
| Contact Messages | Full | Full | No Access | No Access | Full |
| Notifications | Own | Own | Own | Own | Own |

> `Full` means create, read, update, deactivate, delete, search, filter, paginate, and view statistics when the corresponding operation exists and business rules permit it.

---

# 4. General System Rules

## 4.1 Authentication and Security

- Dashboard access requires a valid authenticated user.
- Access tokens must be short-lived.
- Refresh tokens must be used to issue new access tokens.
- The refresh token must be stored in an `httpOnly` cookie.
- Cookie settings must be configured according to the deployment environment.
- Cross-origin requests that use cookies must enable credentials in both frontend requests and backend CORS configuration.
- Passwords must always be hashed before storage.
- Plain-text passwords, reset tokens, and verification codes must never be stored.
- Password reset responses must not reveal whether an email exists.
- Inactive users cannot sign in, refresh tokens, or connect to Socket.IO.
- Socket.IO authentication must accept a token from:
  - `socket.handshake.auth.token`
  - or an `Authorization: Bearer <token>` header.
- Authenticated sockets must join a private room using the user ID.
- Only allowed dashboard roles may connect to protected Socket.IO channels.

## 4.2 User Management

- Dashboard users are created only by the `superadmin`.
- Every user has exactly one role.
- Dashboard user emails must be unique.
- A user cannot delete or deactivate their own account.
- The last active `superadmin` cannot be deleted, deactivated, or changed to another role.
- Deactivation is preferred over deletion when historical records reference the user.
- The `manager` role is excluded from all User Management capabilities.

## 4.3 Content Management

- All slugs must be unique within their collection.
- Public content should be deactivated instead of permanently deleted whenever possible.
- Only active content is visible on the public website.
- Records referenced by requests, applications, or other records must not be permanently deleted.
- `displayOrder` must be used to control content ordering where applicable.
- `createdBy` and `updatedBy` should be recorded for administrative content changes.

## 4.4 Uploads and Cloudinary

- Uploads must use memory storage before sending data to Cloudinary.
- The database must store both:
  - `url`
  - `publicId`
- Replacing an uploaded file must remove the previous Cloudinary asset after the new upload succeeds.
- Removing an uploaded file must remove it from Cloudinary and clear its database fields.
- If a database operation fails after a new upload, the newly uploaded asset must be removed to prevent orphan files.
- Image uploads must validate MIME type and file size.
- Document uploads must validate MIME type and file size separately.
- Static website assets stored on Cloudinary should use their Cloudinary delivery URLs directly in frontend data or environment-backed configuration.
- Sensitive upload credentials and Cloudinary API secrets must remain on the backend.

## 4.5 Requests and Status Tracking

- Incoming public requests must be created without Dashboard authentication.
- Dashboard users may update request status only when their role grants access.
- Every status update should record `updatedBy`.
- Status fields must use predefined enum values.
- Search, filtering, sorting, and pagination should be supported for Dashboard request lists.
- Creating a new incoming request must create a corresponding Dashboard notification.
- Email notifications may also be sent to configured administrative recipients.

## 4.6 Singleton Collections

- `contact-information` is a singleton collection.
- It must contain only one document.
- The Dashboard must provide read and update operations, not create-many or delete operations.

---

# 5. Collections

## 5.1 users

```ts
{
  _id: ObjectId,

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  role: {
    type: String,
    enum: [
      "superadmin",
      "manager",
      "equipmentManager",
      "hrManager",
      "contentManager"
    ],
    required: true
  },

  department: {
    type: String,
    trim: true
  },

  avatar: {
    url: String,
    publicId: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLoginAt: {
    type: Date,
    default: null
  },

  passwordResetToken: {
    type: String,
    default: null,
    select: false
  },

  passwordResetExpires: {
    type: Date,
    default: null,
    select: false
  },

  passwordChangeCode: {
    type: String,
    default: null,
    select: false
  },

  passwordChangeCodeExpires: {
    type: Date,
    default: null,
    select: false
  },

  createdBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- `email` must be unique and normalized before storage.
- `password` must be hashed and excluded from normal query responses.
- Reset tokens and password-change codes must be stored only as hashes.
- Expired reset or verification values must not be accepted.
- `createdBy` is `null` only for the seeded initial Super Admin.
- The seeded Super Admin must be created only when no Super Admin exists.

---

## 5.2 partners

```ts
{
  _id: ObjectId,

  name: {
    type: String,
    required: true,
    trim: true
  },

  logo: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },

  website: {
    type: String,
    trim: true
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.3 milestones

```ts
{
  _id: ObjectId,

  period: {
    type: String,
    required: true,
    trim: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  icon: {
    type: String,
    trim: true
  },

  image: {
    url: String,
    publicId: String
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.4 team-members

```ts
{
  _id: ObjectId,

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  position: {
    type: String,
    required: true,
    trim: true
  },

  experience: {
    type: String,
    trim: true
  },

  image: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## 5.5 services

```ts
{
  _id: ObjectId,

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  categoryLabel: {
    type: String,
    trim: true
  },

  shortDescription: {
    type: String,
    required: true,
    trim: true
  },

  hero: {
    title: String,
    description: String,

    image: {
      url: String,
      publicId: String
    }
  },

  cardImage: {
    url: String,
    publicId: String
  },

  highlights: [
    String
  ],

  capabilitiesSection: {
    title: String,
    description: String,

    items: [
      String
    ],

    table: {
      headers: [
        String
      ],

      rows: [
        {
          cells: [
            String
          ]
        }
      ]
    }
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- `slug` must be unique.
- Hero and card images must store both `url` and `publicId`.
- A Service referenced by Projects should be deactivated rather than permanently deleted.
- Only active Services are publicly visible.
- Services may be related to multiple Projects.

---

## 5.6 projects

```ts
{
  _id: ObjectId,

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  categoryLabel: String,

  shortDescription: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  services: [
    {
      type: ObjectId,
      ref: "Service"
    }
  ],

  hero: {
    title: String,
    description: String,

    image: {
      url: String,
      publicId: String
    }
  },

  cardImage: {
    url: String,
    publicId: String
  },

  projectDetails: {
    client: String,
    location: String,
    completionDate: Date,
    duration: String,
    status: String
  },

  detailedScope: {
    title: String,
    description: String,

    items: [
      {
        title: String,
        description: String,
        icon: String
      }
    ]
  },

  gallery: [
    {
      url: String,
      publicId: String,
      alt: String,
      displayOrder: Number
    }
  ],

  certificates: [
    {
      title: String,
      description: String,

      image: {
        url: String,
        publicId: String
      },

      file: {
        url: String,
        publicId: String
      }
    }
  ],

  displayOrder: {
    type: Number,
    default: 0
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- `slug` must be unique.
- A Project may belong to multiple Services.
- Every gallery image should contain descriptive `alt` text.
- Projects referenced by other records should be deactivated instead of deleted.
- Only active Projects are publicly visible.

---

## 5.7 equipment-categories

```ts
{
  _id: ObjectId,

  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  image: {
    url: String,
    publicId: String
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- Category `name` and `slug` must be unique.
- A category containing Equipment cannot be permanently deleted.
- Deactivating a category should hide its Equipment from public category listings.
- Only active categories are publicly visible.

---

## 5.8 equipment

```ts
{
  _id: ObjectId,

  name: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  category: {
    type: ObjectId,
    ref: "EquipmentCategory",
    required: true
  },

  shortDescription: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  specifications: [
    {
      label: String,
      value: String
    }
  ],

  images: [
    {
      url: String,
      publicId: String,
      alt: String,
      displayOrder: Number
    }
  ],

  totalQuantity: {
    type: Number,
    min: 0,
    default: 0
  },

  availableUnits: {
    type: Number,
    min: 0,
    default: 0
  },

  safetyCertificate: {
    isAvailable: {
      type: Boolean,
      default: false
    },

    message: {
      type: String,
      trim: true
    }
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- `availableUnits` must be less than or equal to `totalQuantity`.
- `totalQuantity` and `availableUnits` cannot be negative.
- Equipment availability is determined by `availableUnits`.
- The Safety Certificate is text-based metadata only and must not store an uploaded image or document.
- Equipment with existing Requests must be deactivated instead of permanently deleted.
- Only active Equipment in active categories is publicly visible.

---

## 5.9 equipment-requests

```ts
{
  _id: ObjectId,

  equipment: {
    type: ObjectId,
    ref: "Equipment",
    required: true
  },

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  company: {
    type: String,
    trim: true
  },

  workLocation: {
    type: String,
    required: true,
    trim: true
  },

  estimatedRequiredDays: {
    type: Number,
    min: 1
  },

  workDescription: {
    type: String,
    required: true,
    trim: true
  },

  status: {
    type: String,
    enum: [
      "new",
      "contacted",
      "quoted",
      "approved",
      "rejected",
      "completed"
    ],
    default: "new"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- An Equipment Request must reference exactly one existing Equipment record.
- Requests can still be viewed if the referenced Equipment later becomes inactive.
- Public users may create Requests but cannot view or update them.
- Every status update must record the acting Dashboard user in `updatedBy`.
- Creating a Request must create an Equipment Request notification.

---

## 5.10 jobs

```ts
{
  _id: ObjectId,

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  shortDescription: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  location: String,

  employmentType: String,

  department: String,

  status: {
    type: String,
    enum: [
      "draft",
      "published",
      "closed"
    ],
    default: "draft"
  },

  responsibilities: [
    String
  ],

  requirements: [
    String
  ],

  deadline: Date,

  publishedAt: {
    type: Date,
    default: null
  },

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- Only `published` Jobs are publicly visible.
- `publishedAt` should be set when a Job is first published.
- A Job with existing Applications cannot be permanently deleted.
- Closed Jobs remain available for historical Application records.
- Applications must not be accepted after the deadline or when the Job is closed.

---

## 5.11 job-applications

```ts
{
  _id: ObjectId,

  job: {
    type: ObjectId,
    ref: "Job",
    required: true
  },

  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  resume: {
    url: {
      type: String,
      required: true
    },

    publicId: {
      type: String,
      required: true
    }
  },

  status: {
    type: String,
    enum: [
      "new",
      "reviewed",
      "shortlisted",
      "rejected",
      "accepted",
      "ignored"
    ],
    default: "new"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- A Job Application must reference exactly one Job.
- A Resume must store both `url` and `publicId`.
- Applications may be submitted only for published and open Jobs.
- Every status update must record `updatedBy`.
- Creating an Application must create a Job Application notification.

---

## 5.12 contact-information

```ts
{
  _id: ObjectId,

  address: {
    type: String,
    trim: true
  },

  phones: [
    String
  ],

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  workingHours: String,

  emergencyHours: String,

  socialLinks: {
    facebook: String,
    instagram: String,
    linkedin: String,
    whatsapp: String
  },

  updatedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- The collection must contain only one document.
- The Dashboard exposes only read and update operations.
- Updating the record must not create a second document.
- `updatedBy` records the last Dashboard user who modified it.

---

## 5.13 contact-messages

```ts
{
  _id: ObjectId,

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  service: {
    type: String,
    enum: [
      "General Inquiry",
      "EPC Projects",
      "Pipeline Services",
      "Process Piping",
      "Hot Tapping",
      "Pipeline Integrity",
      "Storage Tanks",
      "Mechanical Works",
      "Cathodic Protection",
      "Civil Works",
      "Electrical and Instrumentation",
      "Auger Boring & HDD"
    ],
    default: "General Inquiry"
  },

  projectDescription: {
    type: String,
    required: true,
    trim: true
  },

  status: {
    type: String,
    enum: [
      "new",
      "read",
      "replied",
      "archived"
    ],
    default: "new"
  },

  updatedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- Public visitors may create Contact Messages without authentication.
- `service` is a controlled text value and is not an ObjectId relationship.
- `General Inquiry` is the default when no specialized Service is selected.
- Every status update must record `updatedBy`.
- Creating a Contact Message must:
  - Create a Dashboard notification.
  - Send a confirmation or receipt email when email delivery is enabled.
- Contact Message lists must support search, filtering, sorting, and pagination.
- Contact Message statistics should include counts grouped by status.

---

## 5.14 notifications

```ts
{
  _id: ObjectId,

  type: {
    type: String,
    enum: [
      "equipment-request",
      "job-application",
      "contact-message",
      "content-update",
      "system"
    ],
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  message: {
    type: String,
    required: true,
    trim: true
  },

  recipientRole: {
    type: String,
    enum: [
      "superadmin",
      "manager",
      "equipmentManager",
      "hrManager",
      "contentManager"
    ],
    default: null
  },

  recipientUser: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  entityType: {
    type: String,
    enum: [
      "equipment-request",
      "job-application",
      "contact-message",
      "service",
      "project",
      "equipment",
      "job",
      "partner",
      "milestone",
      "team-member",
      "system"
    ],
    required: true
  },

  entityId: {
    type: ObjectId,
    default: null
  },

  icon: String,

  color: String,

  priority: {
    type: String,
    enum: [
      "low",
      "normal",
      "high",
      "urgent"
    ],
    default: "normal"
  },

  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date,
    default: null
  },

  createdBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Business Rules

- A notification must target either `recipientRole`, `recipientUser`, or both.
- Incoming public requests use `createdBy: null`.
- `readAt` must be set when `isRead` changes to `true`.
- `readAt` should be cleared when a Notification is marked unread.
- Role-based notifications must include `manager` when the Manager should receive the corresponding operational event.
- Socket.IO should emit notifications to private user rooms or authorized role rooms.
- Users may access only notifications addressed to them or their authorized role.

---

# 6. Relationships

- **users → users** — One-to-Many
  - `users.createdBy`

- **users → managed records** — One-to-Many
  - `createdBy`
  - `updatedBy`

- **projects ↔ services** — Many-to-Many
  - `projects.services`

- **equipment-categories → equipment** — One-to-Many
  - `equipment.category`

- **equipment → equipment-requests** — One-to-Many
  - `equipment-requests.equipment`

- **jobs → job-applications** — One-to-Many
  - `job-applications.job`

- **users → notifications** — One-to-Many
  - `notifications.recipientUser`

- **incoming entities → notifications** — Logical polymorphic relationship
  - `notifications.entityType`
  - `notifications.entityId`

> `contact-messages.service` is not a database relationship because it stores a controlled string value rather than a Service ObjectId.

---

# 7. Notification Routing Rules

## Equipment Request

Recipients:

- `superadmin`
- `manager`
- `equipmentManager`

## Job Application

Recipients:

- `superadmin`
- `manager`
- `hrManager`

## Contact Message

Recipients:

- `superadmin`
- `manager`
- `contentManager`

## Content Update

Recipients depend on the operation, but may include:

- `superadmin`
- `manager`
- `contentManager`

## System Notification

Recipients are selected explicitly by user or role.

---

# 8. Final Collections

1. `users`
2. `partners`
3. `milestones`
4. `team-members`
5. `services`
6. `projects`
7. `equipment-categories`
8. `equipment`
9. `equipment-requests`
10. `jobs`
11. `job-applications`
12. `contact-information`
13. `contact-messages`
14. `notifications`

---

# 9. Implementation Notes

- Controllers should contain business operations but should not duplicate request validation rules.
- Input validation should be implemented in dedicated Express Validator files.
- Route middleware order should generally be:

```ts
router.method(
  "path",
  auth,
  role([...allowedRoles]),
  ...validationRules,
  asyncHandler(controllerMethod)
);
```

- Public creation routes must omit `auth` and `role` middleware.
- All protected controllers must rely on the authenticated user attached by `auth`.
- Errors from Multer, validation, Cloudinary, authentication, and authorization should be normalized by the global error handler.
- Notification creation should not leave the main entity in an inconsistent state.
- Email failure handling should follow the selected business policy without silently losing the main request.
