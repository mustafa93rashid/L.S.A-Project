# LSA Dashboard System Design

---

# Actors

> Authentication is available only for the Dashboard.
>
> The public website does not support user registration or login.

## Super Admin

### Authentication
- Sign In
- Sign Out
- Refresh Authentication Token

### Profile
- Manage Own Profile
- Change Own Password
- Upload / Remove Avatar

### User Management
- View Users
- Create User Accounts
- Edit User Accounts
- Delete User Accounts
- Activate / Deactivate Users
- Change User Roles
- Reset User Passwords

### Website Content
- Manage Partners
- Manage Company Journey
- Manage Team Members
- Manage Services
- Manage Projects
- Manage Equipment Categories
- Manage Equipment
- Manage Careers
- Manage Contact Information

### Requests Management
- View Equipment Requests
- Manage Equipment Requests
- View Job Applications
- Manage Job Applications
- View Contact Messages
- Manage Contact Messages

---

## Equipment Manager

### Authentication
- Sign In
- Sign Out
- Refresh Authentication Token

### Profile
- Manage Own Profile
- Change Own Password
- Upload / Remove Avatar

### Equipment Requests
- View Equipment Requests
- View Equipment Request Details
- Update Equipment Request Status

---

## HR Manager

### Authentication
- Sign In
- Sign Out
- Refresh Authentication Token

### Profile
- Manage Own Profile
- Change Own Password
- Upload / Remove Avatar

### Careers
- Manage Careers
- View Job Applications
- View Job Application Details
- Update Job Application Status

---

## Content Manager

### Authentication
- Sign In
- Sign Out
- Refresh Authentication Token

### Profile
- Manage Own Profile
- Change Own Password
- Upload / Remove Avatar

### Website Content
- Manage Partners
- Manage Company Journey
- Manage Team Members
- Manage Services
- Manage Projects
- Manage Equipment Categories
- Manage Equipment
- Manage Contact Information

---

# General Rules

- The dashboard is accessible only to authenticated users.
- Dashboard users are created only by the Super Admin.
- Every user has exactly one role.
- Passwords must always be hashed.
- Dashboard user emails must be unique.
- All slugs must be unique.
- Uploaded files must store both `url` and `publicId`.
- Public content should be disabled instead of permanently deleted whenever possible.
- Records that have related requests or applications should not be permanently deleted.
- The last active Super Admin cannot be deleted or deactivated.
- A user cannot delete or deactivate their own account.
- Role and status fields must use predefined enum values.
- `contact-information` is a Singleton collection and must contain only one document.

---

# Collections

## users

```ts
{
  _id: ObjectId,

  fullName: String,

  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: String,

  password: String,

  role: {
    type: String,
    enum: [
      "superadmin",
      "equipmentManager",
      "hrManager",
      "contentManager"
    ]
  },

  department: String,

  avatar: {
    url: String,
    publicId: String
  },

  isActive: Boolean,

  lastLoginAt: Date,

  createdBy: {
    type: ObjectId,
    ref: "User"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## partners

```ts
{
  _id: ObjectId,

  name: String,

  logo: {
    url: String,
    publicId: String
  },

  website: String,

  createdAt: Date,
  updatedAt: Date
}
```

---

## milestones

```ts
{
  _id: ObjectId,

  period: String,

  title: String,

  description: String,

  icon: String,

  image: {
    url: String,
    publicId: String
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## team-members

```ts
{
  _id: ObjectId,

  fullName: String,

  position: String,

  experience: String,

  image: {
    url: String,
    publicId: String
  },

  displayOrder: Number,

  isActive: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

## services

```ts
{
  _id: ObjectId,

  title: String,

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  categoryLabel: String,

  shortDescription: String,

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

  displayOrder: Number,

  isFeatured: Boolean,

  isActive: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

---

## projects

```ts
{
  _id: ObjectId,

  title: String,

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  categoryLabel: String,

  shortDescription: String,

  description: String,

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

  displayOrder: Number,

  isFeatured: Boolean,

  isActive: Boolean,

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

> Validation Rules

- `availableUnits <= totalQuantity`
- `totalQuantity >= 0`
- `availableUnits >= 0`

---

## equipment-requests

```ts
{
  _id: ObjectId,

  equipment: {
    type: ObjectId,
    ref: "Equipment"
  },

  fullName: String,

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  phone: String,

  company: String,

  workLocation: String,

  estimatedRequiredDays: Number,

  workDescription: String,

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

  createdAt: Date,
  updatedAt: Date
}
```

---

# Business Rules

- Equipment Categories cannot be deleted while they contain Equipment.
- Equipment with existing requests should be deactivated instead of permanently deleted.
- Equipment availability is determined by the value of `availableUnits`.
- Services may be linked to multiple Projects.
- Projects may belong to multiple Services.
- Gallery images should include descriptive `alt` text.
- All uploaded files must store both `url` and `publicId`.
- Only active Services, Projects, Equipment Categories, and Equipment are visible on the public website.
```

# LSA Dashboard System Design

## Part 3 - Jobs, Job Applications, Contact Information, Contact Messages & Relationships

---

# Collections

## jobs

```ts
{
  _id: ObjectId,

  title: String,

  shortDescription: String,

  description: String,

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

deadline : string,

  publishedAt: Date,

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

## job-applications

```ts
{
  _id: ObjectId,

  job: {
    type: ObjectId,
    ref: "Job"
  },

  firstName: String,

  lastName: String,

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  phone: String,

  resume: {
    url: String,
    publicId: String
  },

  status: {
    type: String,
    enum: [
      "new",
      "reviewed",
      "shortlisted",
      "rejected",
      "accepted"
    ],
    default: "new"
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## contact-information

> Singleton Collection (Contains only one document)

```ts
{
  _id: ObjectId,

  officeName: String,

  address: String,

  phones: [
    String
  ],

  email: String,

  workingHours: String,

  emergencyHours: String,

  socialLinks: {

    facebook: String,

    instagram: String,

    linkedin: String,

    whatsapp: String
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## contact-messages

```ts
{
  _id: ObjectId,

  fullName: String,

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  phone: String,

  service: {
    type: ObjectId,
    ref: "Service",
    default: null
  },

  projectDescription: String,

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

  createdAt: Date,
  updatedAt: Date
}
```

## notifications
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
    ]
  },

  title: String,

  message: String,

  recipientRole: {
    type: String,
    enum: [
      "superadmin",
      "equipmentManager",
      "hrManager",
      "contentManager"
    ]
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
    ]
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

  readAt: Date,

  createdBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}
---

# Relationships

- **users → users** (One-to-Many)
  - `createdBy`

- **projects ↔ services** (Many-to-Many)
  - `projects.services`

- **equipment-categories → equipment** (One-to-Many)
  - `equipment.category`

- **equipment → equipment-requests** (One-to-Many)
  - `equipment-requests.equipment`

- **jobs → job-applications** (One-to-Many)
  - `job-applications.job`

- **services → contact-messages** (One-to-Many, Optional)
  - `contact-messages.service`

---

# Business Rules

## Users

- Dashboard users are created only by the Super Admin.
- Dashboard user emails must be unique.
- Every user has exactly one role.
- Passwords must always be hashed before storage.
- The last active Super Admin cannot be deleted or deactivated.
- Users cannot delete or deactivate their own accounts.

---

## Website Content

- All slugs must be unique.
- Uploaded files must store both `url` and `publicId`.
- Public content should be deactivated instead of permanently deleted whenever possible.
- Only active content is displayed on the public website.

---

## Equipment

- Equipment Categories cannot be deleted while they contain Equipment.
- Equipment with existing requests should not be permanently deleted.
- Equipment availability is determined by `availableUnits`.
- `availableUnits` cannot exceed `totalQuantity`.

---

## Careers

- Jobs with existing applications should not be permanently deleted.
- Closed jobs remain available for historical job applications.

---

## Contact Information

- `contact-information` is a Singleton collection.
- Only one document may exist.
- The dashboard should provide only **Update** functionality for this collection.

---

## Requests & Applications

- Equipment Requests are linked to exactly one Equipment.
- Job Applications are linked to exactly one Job.
- Contact Messages may optionally reference one Service.
- Status values must always follow their predefined enums.

---

# Final Collections

1. users
2. partners
3. milestones
4. team-members
5. services
6. projects
7. equipment-categories
8. equipment
9. equipment-requests
10. jobs
11. job-applications
12. contact-information
13. contact-messages