# 🏗️ L.S.A Backend API

> Enterprise-grade RESTful API for **L.S.A Engineering Services**, delivering a secure and scalable backend for content management, equipment operations, careers, contact management, and real-time dashboard notifications with role-based access control.

![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-Framework-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io)
![JWT](https://img.shields.io/badge/JWT-Authentication-0052CC?style=flat-square)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Asset%20Management-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![REST API](https://img.shields.io/badge/API-REST-00C853?style=flat-square)
![License](https://img.shields.io/badge/License-Private-red?style=flat-square)
![Maintained](https://img.shields.io/badge/Maintained-Yes-success?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-blueviolet?style=flat-square)

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

## 👨‍💻 Author

**Mustafa Rashid**

Computer Engineer • MERN Stack Developer • UI/UX Designer


