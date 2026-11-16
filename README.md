# 📍 Geo-Tagged & Geofenced Attendance Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-ready full-stack attendance tracking system engineered for location-verified employee check-ins. Combining GPS geolocation, haversine geofence boundaries, cryptographic device binding, and real-time WebSocket telemetry, this platform eliminates proxy check-ins and delivers instantaneous attendance monitoring to administrators.

---

## 📑 Table of Contents

1. [Key Features](#-key-features)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Database Schema & ERD](#-database-schema--erd)
5. [Prerequisites](#-prerequisites)
6. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
   - [Database Setup](#1-database-setup)
   - [Backend Configuration (`attendance-server/server`)](#2-backend-configuration)
   - [Frontend Configuration (`client`)](#3-frontend-configuration)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [API Documentation](#-api-documentation)
   - [Authentication Endpoints](#authentication)
   - [Attendance Endpoints](#attendance)
   - [Admin Management Endpoints](#admin-management)
9. [Geofencing & Verification Engine](#-geofencing--verification-engine)
10. [WebSockets & Real-Time Events](#-websockets--real-time-events)
11. [Project Directory Layout](#-project-directory-layout)
12. [Security Best Practices](#-security-best-practices)
13. [Contributing & License](#-contributing--license)

---

## 🌟 Key Features

### 📍 GPS & Geofence Verification
- **Strict Distance Bounds**: Checks employee location against the assigned site’s latitude/longitude using the spherical **Haversine Formula**.
- **Accuracy Enforcing**: Drops or flags locations where GPS accuracy exceeds the configurable threshold (`MAX_ACCURACY_M=100m`) to prevent coarse/IP-based spoofing.
- **Role-Aware Policies**:
  - `office` / `site` workers must be strictly inside the geofence perimeter or check-in is rejected (HTTP 403).
  - `field` workers are permitted to check in from remote sites, automatically flagged with distance variances for managerial review.

### 📱 Device Fingerprint Binding
- **Hardware Binding**: On first successful login/check-in, the browser ties a secure device identifier to the user's account.
- **Anti-Proxy Protection**: Attempting to check in from a different or unrecognized device flags the attendance entry (`Unregistered device`).
- **Device Reset Workflow**: Administrators can safely reset device bindings from the directory when an employee changes their phone or computer.

### ⏱️ Shift Rules & Grace Period Management
- **Automated Late Detection**: Automatically compares server-side timestamps (`TIMESTAMPTZ`) against shift start times. Check-ins past `start_time + grace_minutes` are marked as `late`.
- **Half-Day Calculation**: Records with fewer than 4 total hours between check-in and check-out are classified as `half_day`.

### ⚡ Real-Time Admin Dashboard
- **Instant Socket.IO Push**: The admin dashboard reacts instantly to employee check-ins and check-outs without requiring page refreshes.
- **Analytical Metrics**: Visual attendance breakdowns (Present, Absent, Late, Flagged) rendered with **Recharts**.
- **CSV Data Export**: One-click download of attendance registers filtered by date range, department, site, or status.
- **Audited Manual Corrections**: Admins can correct missing timestamps with mandatory audit reasons logged in `audit_logs`.

### 🗺️ Visual Map Picker
- Embedded **Leaflet** and **OpenStreetMap** interface to drop pins, configure geofences, and adjust detection radii in real time.

---

## 🏗️ System Architecture

```text
[ Browser / Mobile Client ]
   │
   ├── HTTP REST (Axios with Bearer JWT) ─────────┐
   │                                              ▼
   └── WebSockets (Socket.IO with Auth Handshake) ┼──▶ [ Express API Server (:4000) ]
                                                  │         │
                                                  │         ├─▶ JWT & RBAC Middleware
                                                  │         ├─▶ Geofencing & Haversine Engine
                                                  │         ├─▶ Device Binding Verification
                                                  │         └─▶ Timezone & Shift Calculator
                                                  │                   │
                                                  │                   ▼
                                                  └─────────▶ [ PostgreSQL Database (:5432) ]
                                                               (users, sites, shifts,
                                                                attendance, audit_logs)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | High-performance SPA with lazy-loaded route views |
| **Styling** | Tailwind CSS 3.4 | Utility-first, clean responsive design |
| **Map Engine** | Leaflet & React-Leaflet | Visual geofence polygon & pin placement |
| **Visualizations** | Recharts | Team attendance charts and analytical breakdowns |
| **Backend Framework** | Node.js + Express.js | REST API routing and business logic execution |
| **Database** | PostgreSQL 14+ | Relational data persistence with strict foreign keys and UTC timestamps |
| **Real-Time Layer** | Socket.IO | Bidirectional WebSocket channel for live manager updates |
| **Security & Auth** | JWT (`jsonwebtoken`) + `bcryptjs` | Stateless session tokens and salted password hashing |

---

## 🗄️ Database Schema & ERD

The database schema is defined in [`attendance-server/server/schema.sql`](file:///c:/Users/NEELS/Desktop/Attendence%20App/attendance-server/server/schema.sql):

```mermaid
erDiagram
    SHIFTS ||--o{ USERS : "assigned to"
    USERS ||--o{ USER_SITES : "has site permissions"
    SITES ||--o{ USER_SITES : "assigned to users"
    USERS ||--o{ ATTENDANCE : "records"
    SITES ||--o{ ATTENDANCE : "location for"
    ATTENDANCE ||--o{ VISITS : "contains"
    USERS ||--o{ AUDIT_LOGS : "acted by"

    SHIFTS {
        serial id PK
        text name
        time start_time
        time end_time
        int grace_minutes
    }

    USERS {
        serial id PK
        text name
        text email UK
        text phone
        text password_hash
        text role "super_admin | admin | employee"
        text employee_type "office | site | field"
        int shift_id FK
        text device_id
        boolean is_active
        timestamptz created_at
    }

    SITES {
        serial id PK
        text name
        text type
        double_precision latitude
        double_precision longitude
        int radius_m
        boolean is_active
    }

    USER_SITES {
        serial id PK
        int user_id FK
        int site_id FK
        date valid_from
        date valid_to
    }

    ATTENDANCE {
        serial id PK
        int user_id FK
        date date
        int site_id FK
        timestamptz check_in_time
        double_precision check_in_lat
        double_precision check_in_lng
        real check_in_accuracy
        timestamptz check_out_time
        double_precision check_out_lat
        double_precision check_out_lng
        real check_out_accuracy
        text status "present | late | half_day"
        text verification "verified | flagged"
        text flag_reason
        numeric hours_worked
    }

    AUDIT_LOGS {
        serial id PK
        int actor_id FK
        text action
        text target_table
        int target_id
        jsonb old_value
        jsonb new_value
        text reason
        timestamptz created_at
    }
```

---

## 💻 Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js**: `v18.x` or `v20.x` or later ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: `v14` through `v18` ([Download PostgreSQL](https://www.postgresql.org/download/))
- **Package Manager**: `npm` (bundled with Node.js) or `pnpm`
- **Modern Browser**: Chrome, Edge, Firefox, or Safari with Geolocation permissions enabled.

---

## 🚀 Step-by-Step Installation & Setup

### 1. Database Setup

Ensure your local PostgreSQL service is started (`postgresql-x64-18` on Windows or `brew services start postgresql` on macOS).

1. **Create the Database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE attendance;"
   ```

2. **Initialize Schema & Tables:**
   Execute the schema SQL file:
   ```bash
   # Windows (PowerShell)
   psql -U postgres -d attendance -f "attendance-server/server/schema.sql"

   # macOS / Linux
   psql -U postgres -d attendance -f attendance-server/server/schema.sql
   ```

---

### 2. Backend Configuration

1. **Navigate to the server directory:**
   ```bash
   cd "attendance-server/server"
   ```

2. **Install Server Dependencies:**
   ```bash
   npm install
   ```

3. **Configure the Environment:**
   Create `.env` from the provided template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your PostgreSQL credentials and secrets:
   ```env
   PORT=4000
   DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/attendance
   JWT_SECRET=super_secure_random_jwt_secret_key_12345
   TZ_NAME=Asia/Kolkata
   MAX_ACCURACY_M=100
   ADMIN_EMAIL=owner@company.com
   ADMIN_PASSWORD=ChangeMe123
   ```

4. **Seed Default Admin and Shifts:**
   Populates the database with the initial super admin account and a `General` (09:00 - 18:00) shift:
   ```bash
   npm run seed
   ```

5. **Start the API Server:**
   ```bash
   npm start
   ```
   > You should see: `API running on port 4000`

---

### 3. Frontend Configuration

1. **Open a new terminal and navigate to the client folder:**
   ```bash
   cd client
   ```

2. **Install Client Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment:**
   Create `client/.env`:
   ```bash
   cp .env.example .env
   ```
   Verify that `VITE_API_URL` points to your backend:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   > The application will be live at `http://localhost:5173`.

---

## 🔑 Default Login Credentials

Upon running `npm run seed`, you can authenticate immediately:

| Field | Default Value | Description |
|---|---|---|
| **URL** | `http://localhost:5173/login` | Frontend portal |
| **Email** | `owner@company.com` | Configured via `ADMIN_EMAIL` |
| **Password** | `ChangeMe123` | Configured via `ADMIN_PASSWORD` |
| **Role** | `super_admin` | Has complete system privileges |

---

## ⚙️ Environment Variables Reference

### Backend (`attendance-server/server/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `4000` | Port on which Express and Socket.IO listen |
| `DATABASE_URL` | String | *Required* | PostgreSQL connection string (`postgres://user:pass@host:5432/db`) |
| `JWT_SECRET` | String | *Required* | Secret used to sign and verify JWT authentication tokens |
| `TZ_NAME` | String | `Asia/Kolkata` | IANA Timezone used for daily cutoff and late calculations |
| `MAX_ACCURACY_M` | Number | `100` | Maximum acceptable GPS accuracy in meters |
| `ADMIN_EMAIL` | String | `owner@company.com` | Email of initial super-admin generated during seeding |
| `ADMIN_PASSWORD` | String | `ChangeMe123` | Password of initial super-admin generated during seeding |

### Frontend (`client/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | String | `http://localhost:4000` | Base URL of the backend API & Socket.IO server |

---

## 📖 API Documentation

All protected endpoints require an `Authorization` header containing the bearer token:
```text
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

#### `POST /auth/login`
Authenticates an employee or administrator.
- **Body:**
  ```json
  {
    "email": "owner@company.com",
    "password": "ChangeMe123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Owner",
      "role": "super_admin",
      "employee_type": "office"
    }
  }
  ```

#### `POST /auth/change-password`
Updates the authenticated user's password.
- **Auth:** Any authenticated user.
- **Body:** `{ "current_password": "...", "new_password": "..." }`

---

### Attendance

#### `POST /attendance/check-in`
Submits employee geofence check-in.
- **Auth:** Any authenticated user.
- **Body:**
  ```json
  {
    "lat": 12.9716,
    "lng": 77.5946,
    "accuracy": 15.2,
    "device_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```
- **Responses:**
  - `201 Created`: Checked in successfully (`status: "present" | "late"`).
  - `400 Bad Request`: GPS accuracy too low or coordinates invalid.
  - `403 Forbidden`: Outside geofence boundary (for office/site workers) or no site assigned.
  - `409 Conflict`: Already checked in today.

#### `POST /attendance/check-out`
Records check-out and computes work duration.
- **Auth:** Any authenticated user.
- **Body:** `{ "lat": 12.9716, "lng": 77.5946, "accuracy": 12.0 }`
- **Response `200 OK`:** Returns updated attendance object including `hours_worked` and `status`.

#### `GET /attendance/me`
Fetches current employee's recent 60-day attendance history.

#### `GET /attendance/today`
- **Auth:** `admin`, `super_admin`
- **Response:** Summary metrics (`total`, `present`, `absent`, `late`, `flagged`) alongside detailed employee rows for today.

#### `GET /attendance`
Query attendance logs with optional URL filters:
- **Query Params:** `from`, `to`, `user_id`, `site_id`, `status`, `verification`

#### `GET /attendance/export/csv`
Downloads the filtered attendance dataset directly as `attendance.csv`.

#### `PATCH /attendance/:id`
Applies a manual correction to an attendance entry.
- **Auth:** `admin`, `super_admin`
- **Body:**
  ```json
  {
    "status": "present",
    "check_in_time": "2026-11-16T09:05:00Z",
    "check_out_time": "2026-11-16T18:00:00Z",
    "reason": "Employee forgot phone in locker"
  }
  ```
  *(Audit trail entry is automatically generated in `audit_logs`).*

---

### Admin Management

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/admin/sites` | `GET` | Admin | Retrieve all work sites |
| `/admin/sites` | `POST` | Admin | Create a site (`name`, `latitude`, `longitude`, `radius_m`) |
| `/admin/sites/:id` | `PATCH` | Admin | Update site boundary or active status |
| `/admin/shifts` | `GET` | Admin | List shifts |
| `/admin/shifts` | `POST` | Admin | Create shift (`name`, `start_time`, `end_time`, `grace_minutes`) |
| `/admin/employees` | `GET` | Admin | List all team members and assigned shifts |
| `/admin/employees` | `POST` | Admin / Super | Register employee (super admin only for creating admins) |
| `/admin/employees/:id` | `PATCH` | Admin | Modify employee details or deactivate |
| `/admin/employees/:id/sites` | `POST` | Admin | Assign an employee to a site with valid date ranges |
| `/admin/employees/:id/reset-device` | `POST` | Admin | Clear device binding for an employee |

---

## 🧮 Geofencing & Verification Engine

Distance is calculated using the **Haversine formula**, determining the great-circle distance between the user's GPS coordinates and the assigned site's center point:

$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

$$d = R \cdot \Delta\sigma$$

Where $R = 6,371,000 \text{ meters}$.

- If $d \le \text{radius\_m}$: Entry is **Verified**.
- If $d > \text{radius\_m}$ and `employee_type === 'field'`: Entry is marked **Flagged** (`Outside site radius by X meters`).
- If $d > \text{radius\_m}$ and `employee_type !== 'field'`: Entry is **Rejected (HTTP 403)**.

---

## ⚡ WebSockets & Real-Time Events

The server exposes a Socket.IO gateway on the same HTTP port.
Admins connect with their Bearer token during handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: localStorage.getItem('token') }
});

// Listen for instant attendance updates
socket.on('attendance:update', (payload) => {
  console.log('Live Attendance Event:', payload);
  // payload: { type: 'check_in'|'check_out', user: 'Name', site: 'HQ', status: 'present', verification: 'verified' }
});
```

---

## 📂 Project Directory Layout

```text
.
├── .gitignore                      # Top-level git ignore (protects .env and node_modules)
├── README.md                       # Comprehensive documentation
├── client/                         # React 18 + Vite frontend
│   ├── .env.example                # Example client configuration
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend package dependencies
│   ├── tailwind.config.js          # Tailwind CSS theme setup
│   ├── vite.config.js              # Vite bundler & PWA plugin config
│   └── src/
│       ├── api/client.js           # Axios instance with auth interceptors
│       ├── components/
│       │   ├── Layout.jsx          # App shell, responsive nav, and header
│       │   ├── MapPicker.jsx       # Leaflet interactive map picker
│       │   └── States.jsx          # Reusable Loading, Empty & Error states
│       ├── pages/
│       │   ├── AdminHome.jsx       # Real-time dashboard with Recharts & live feed
│       │   ├── Attendance.jsx      # Historical register, filters, CSV export, & corrections
│       │   ├── Directory.jsx       # Employee management, shifts, & device reset
│       │   ├── EmployeeHome.jsx    # Geo-checkin button & personal log
│       │   ├── Login.jsx           # Clean authentication form
│       │   ├── Shifts.jsx          # Shift creator with grace periods
│       │   └── Sites.jsx           # Site location and radius manager
│       ├── auth.jsx                # React Auth context and session persistence
│       ├── lib.js                  # Formatting helpers and error handlers
│       └── styles.css              # Custom styling
│
└── attendance-server/              # Backend Express application
    └── server/
        ├── .env.example            # Example backend environment variables
        ├── package.json            # Node.js dependencies & scripts
        ├── schema.sql              # Database schema definition
        └── src/
            ├── app.js              # Main Express server & Socket.IO config
            ├── db.js               # PostgreSQL connection pool instance
            ├── geo.js              # Haversine distance calculator
            ├── middleware.js       # JWT validation & RBAC authorization
            ├── seed.js             # Seed database script
            └── routes/
                ├── admin.js        # Admin site, shift, and employee APIs
                ├── attendance.js   # Check-in, check-out, reports, and export APIs
                └── auth.js         # Login & password update routes
```

---

## 🔒 Security Best Practices

1. **Environment Secrets**: Never commit `.env` files into version control. Ensure `.env` is listed in `.gitignore`.
2. **Reverse Proxy & TLS**: In production environments, run the application behind **Nginx**, **Caddy**, or **Cloudflare** with HTTPS enabled so GPS coordinates sent from mobile browsers are securely encrypted in transit.
3. **Database Safeguards**: The schema uses parameterized queries (`$1, $2, ...`) across all route files to prevent SQL injection vulnerabilities.
4. **JWT Expiration**: Authentication tokens expire in 12 hours. Ensure `JWT_SECRET` is set to a cryptographically secure 256-bit string in production.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
