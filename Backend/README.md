# L.S.A Backend API

```{=html}
<p align="center">
```
`<img src="./assets/banner.png" alt="LSA Banner" width="100%">`{=html}
```{=html}
</p>
```
```{=html}
<h1 align="center">
```
🏗️ L.S.A Backend API
```{=html}
</h1>
```
```{=html}
<p align="center">
```
`<b>`{=html}Enterprise Management Platform for Industrial Engineering
Services`</b>`{=html}`<br>`{=html} Scalable • Secure • Modular •
Production Ready
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<img src="https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js">`{=html}
`<img src="https://img.shields.io/badge/Express.js-5-black?style=for-the-badge&logo=express">`{=html}
`<img src="https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb">`{=html}
`<img src="https://img.shields.io/badge/Socket.IO-Realtime-white?style=for-the-badge&logo=socket.io">`{=html}
`<img src="https://img.shields.io/badge/Cloudinary-Media-blue?style=for-the-badge&logo=cloudinary">`{=html}
`<img src="https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge">`{=html}
`<img src="https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge">`{=html}
```{=html}
</p>
```

------------------------------------------------------------------------

## ✨ Overview

L.S.A Backend API is an enterprise-grade backend powering the L.S.A
Engineering Services platform.

### Highlights

-   🔐 JWT Authentication
-   👥 Role Based Access Control
-   ☁️ Cloudinary Media Management
-   ⚡ Socket.IO Notifications
-   📦 Equipment Management
-   💼 Careers & Job Applications
-   📨 Contact Messages
-   🔔 Notification Center
-   🛡️ Secure REST API

------------------------------------------------------------------------

## 📚 Table of Contents

1.  Features
2.  Architecture
3.  Tech Stack
4.  Roles
5.  Modules
6.  Collections
7.  Security
8.  Installation
9.  Deployment
10. Roadmap

------------------------------------------------------------------------

# 🚀 Features

  Area             Features
  ---------------- --------------------------------------------------------
  Authentication   Login, Refresh Token, Password Reset, Profile
  CMS              Partners, Services, Projects, Equipment
  Requests         Equipment Requests, Job Applications, Contact Messages
  Uploads          Cloudinary + Multer
  Realtime         Socket.IO Notifications
  Security         Validation, Rate Limiting, RBAC

------------------------------------------------------------------------

# 🏛️ Architecture

``` text
                 Public Website
                        │
                 REST API Requests
                        │
      ┌─────────────────┴─────────────────┐
      │                                   │
 Dashboard SPA                      Public APIs
      │
      ▼
 Express.js Application
      │
 ┌────┼──────────────┐
 │    │              │
MongoDB      Cloudinary
 │
Socket.IO
```

------------------------------------------------------------------------

# 👥 Roles

  Role                Access
  ------------------- ------------------------------------------------
  Super Admin         Full System
  Manager             All operational modules except User Management
  Equipment Manager   Equipment Requests
  HR Manager          Careers & Applications
  Content Manager     Website Content

------------------------------------------------------------------------

# 📦 Modules

-   🔐 Authentication
-   👤 Users
-   🤝 Partners
-   🏗️ Milestones
-   👥 Team Members
-   🛠️ Services
-   🏭 Projects
-   📂 Equipment Categories
-   🚜 Equipment
-   📨 Equipment Requests
-   💼 Jobs
-   📄 Job Applications
-   ☎️ Contact Information
-   ✉️ Contact Messages
-   🔔 Notifications

------------------------------------------------------------------------

# 🗄️ Database Collections

``` text
Users
├── Partners
├── Milestones
├── Team Members
├── Services
├── Projects
├── Equipment Categories
├── Equipment
├── Equipment Requests
├── Jobs
├── Job Applications
├── Contact Information
├── Contact Messages
└── Notifications
```

------------------------------------------------------------------------

# 🔐 Authentication Flow

``` text
Login
 │
 ▼
Access Token
 │
 ▼
Protected APIs
 │
 ▼
Refresh Token
 │
 ▼
New Access Token
```

------------------------------------------------------------------------

# ☁️ Upload Pipeline

``` text
Client
 │
 ▼
Multer
 │
 ▼
Validation
 │
 ▼
Cloudinary
 │
 ▼
MongoDB
```

------------------------------------------------------------------------

# ⚡ Notification Flow

``` text
Public Action
 │
 ▼
Controller
 │
 ▼
Notification
 │
 ▼
Socket.IO
 │
 ▼
Dashboard User
```

------------------------------------------------------------------------

# 🛡️ Security

-   JWT Authentication
-   Refresh Tokens
-   Password Hashing
-   Secure Cookies
-   RBAC
-   Express Validator
-   Global Error Handler
-   Rate Limiting
-   Cloudinary Cleanup

------------------------------------------------------------------------

# 📁 Project Structure

``` text
src
├── config
├── controllers
├── middleware
├── models
├── routes
├── validations
├── services
├── utils
├── sockets
├── emails
└── seeds
```

------------------------------------------------------------------------

# 🚀 Installation

``` bash
git clone <repository>
cd lsa-backend
npm install
npm run dev
```

------------------------------------------------------------------------

# ⚙️ Environment Variables

``` env
PORT=
MONGODB_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=
DASHBOARD_URL=
FRONTEND_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

------------------------------------------------------------------------

# 🌍 Deployment

Recommended:

-   Render
-   Railway
-   Azure App Service
-   VPS
-   AWS EC2

------------------------------------------------------------------------

# 🛣️ Roadmap

-   ✅ Authentication
-   ✅ RBAC
-   ✅ CMS
-   ✅ Realtime Notifications
-   ✅ Cloudinary
-   ⬜ Dashboard Analytics
-   ⬜ API Versioning
-   ⬜ OpenAPI Documentation
-   ⬜ Automated Tests

------------------------------------------------------------------------

# 🤝 Contributing

1.  Fork repository.
2.  Create feature branch.
3.  Commit changes.
4.  Open Pull Request.

------------------------------------------------------------------------

# 📄 License

Copyright © L.S.A Engineering Services.

------------------------------------------------------------------------

```{=html}
<p align="center">
```
Made with ❤️ by `<b>`{=html}Mustafa Rashid`</b>`{=html}`<br>`{=html}
Computer Engineer • MERN Stack Developer • UI/UX Designer
```{=html}
</p>
```
