# 📍 Geo-Tagged Attendance System

A full-stack attendance management system with GPS geofencing, device binding, and live WebSocket updates.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Features

- **📍 Geofenced Check-In**: Verifies physical GPS location and radius using the Haversine formula.
- **📱 Anti-Proxy Device Binding**: Pairs accounts to hardware UUIDs to prevent proxy attendance.
- **⏱️ Shift & Late Detection**: Flags late check-ins based on shift start times and grace periods; auto-detects half-days.
- **⚡ Live Admin Dashboard**: Real-time push updates via Socket.IO, attendance metrics, and Recharts graphs.
- **🗺️ Interactive Map Picker**: Set and edit site coordinates and radii visually with Leaflet.
- **📊 Reports & Audits**: Filterable attendance register, CSV exports, and audited manual adjustments.

---

## 🛠️ Tech Stack

- **Client**: React 18, Vite, Tailwind CSS, Leaflet, Recharts, Socket.IO Client
- **Server**: Node.js, Express, PostgreSQL (`pg`), JWT, bcryptjs, Socket.IO

---

## 🚀 Quick Start

### 1. Database Setup
```bash
psql -U postgres -c "CREATE DATABASE attendance;"
psql -U postgres -d attendance -f "attendance-server/server/schema.sql"
```

### 2. Backend Setup
```bash
cd attendance-server/server
cp .env.example .env          # Update your DATABASE_URL & JWT_SECRET
npm install
npm run seed                  # Creates default admin & shift
npm start                     # Runs on http://localhost:4000
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env          # Set VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # Runs on http://localhost:5173
```

---

## 🔑 Default Admin Credentials

- **Email**: `owner@company.com`
- **Password**: `ChangeMe123`
- **Role**: `super_admin`

---

## ⚙️ Environment Variables

### Backend (`attendance-server/server/.env`)
```env
PORT=4000
DATABASE_URL=postgres://postgres:password@localhost:5432/attendance
JWT_SECRET=your_jwt_secret
TZ_NAME=Asia/Kolkata
MAX_ACCURACY_M=100
ADMIN_EMAIL=owner@company.com
ADMIN_PASSWORD=ChangeMe123
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:4000
```

---

## 📁 Repository Structure

```text
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # MapPicker, Layout, UI States
│   │   ├── pages/              # Admin, Employee, Attendance, Shifts, Sites
│   │   └── api/                # Axios instance & interceptors
├── attendance-server/server/   # Node.js + Express backend
│   ├── src/
│   │   ├── routes/             # Auth, Attendance, Admin APIs
│   │   └── geo.js              # Haversine distance logic
│   └── schema.sql              # Database schema
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
