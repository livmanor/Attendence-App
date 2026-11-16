# 📍 Geo-Tagged Attendance System

A modern full-stack web application designed for real-time, geofence-verified employee attendance tracking. The system enforces location boundaries using GPS coordinates, supports multiple user roles and shift management, and delivers live attendance updates to administrators via WebSockets.

---

## 🌟 Key Features

- **📍 Geofenced Check-In & Check-Out**: Verifies GPS coordinates, accuracy, and proximity to assigned sites using the Haversine formula before marking attendance.
- **🛡️ Role-Based Access Control (RBAC)**:
  - `super_admin`: Full system control and administration.
  - `admin`: Live dashboard monitoring, employee approvals, shifts, and site management.
  - `employee`: Self-service check-in, check-out, visit logs, and attendance history.
- **⚡ Real-Time Admin Dashboard**: Powered by Socket.IO for live alerts whenever employees check in or out.
- **🏢 Multi-Site & Shift Management**: Assign employees to specific geofenced locations (`office`, `site`, `field`) with configurable grace periods.
- **🗺️ Interactive Map Picker**: Integrated Leaflet maps allowing admins to visually configure site locations and geofence radii.
- **📊 Analytics & Reports**: Visualized attendance trends, work hour calculations, and flag logs for out-of-bounds or late entries.
- **📝 Audit Trails**: Comprehensive audit logs capturing key administrative modifications.

---

## 🛠️ Tech Stack

### **Frontend (`/client`)**
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Real-Time**: [Socket.IO Client](https://socket.io/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### **Backend (`/attendance-server/server`)**
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (native `pg` driver)
- **Authentication**: JWT (JSON Web Tokens) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Real-Time**: [Socket.IO](https://socket.io/)
- **Geospatial Calculations**: Custom Haversine distance validation

---

## 📁 Project Structure

```text
Attendence App/
├── client/                      # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── api/client.js        # Axios instance & interceptors
│   │   ├── components/          # Reusable UI components (MapPicker, Layout, etc.)
│   │   ├── pages/               # Pages (AdminHome, EmployeeHome, Attendance, etc.)
│   │   ├── auth.jsx             # Auth context & guards
│   │   └── App.jsx              # Main routing & layout structure
│   ├── .env.example             # Client environment template
│   └── package.json
│
├── attendance-server/
│   └── server/                  # Backend Application (Node + Express)
│       ├── src/
│       │   ├── routes/          # API Routes (auth, attendance, admin)
│       │   ├── app.js           # Server entry point & Socket.IO initialization
│       │   ├── db.js            # PostgreSQL pool connection
│       │   ├── geo.js           # Haversine distance calculations
│       │   ├── middleware.js    # JWT auth & role validation middlewares
│       │   └── seed.js          # Database seeding script
│       ├── schema.sql           # Database schema & tables
│       ├── .env.example         # Server environment template
│       └── package.json
│
├── .gitignore                   # Root Git ignore rules
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: v14 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))
- **Git**

---

### 1. Database Setup

1. Start your PostgreSQL service.
2. Create the `attendance` database:
   ```bash
   psql -U postgres -c "CREATE DATABASE attendance;"
   ```
3. Initialize the schema:
   ```bash
   psql -U postgres -d attendance -f "attendance-server/server/schema.sql"
   ```

---

### 2. Backend Setup (`attendance-server/server`)

1. Open your terminal and navigate to the server directory:
   ```bash
   cd "attendance-server/server"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the variables inside `.env`:
     ```env
     PORT=4000
     DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/attendance
     JWT_SECRET=your_super_secret_jwt_key
     TZ_NAME=Asia/Kolkata
     MAX_ACCURACY_M=100
     ADMIN_EMAIL=owner@company.com
     ADMIN_PASSWORD=ChangeMe123
     ```
4. Seed the initial database (creates default admin & shifts):
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   *The server will run on `http://localhost:4000`.*

---

### 3. Frontend Setup (`client`)

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Make sure `VITE_API_BASE_URL` points to your backend:
     ```env
     VITE_API_BASE_URL=http://localhost:4000
     ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173`.*

---

## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user & return JWT token | No |
| `POST` | `/auth/register` | Register new employee | Admin only |
| `POST` | `/attendance/check-in` | Geo-tagged check-in | Employee / Admin |
| `POST` | `/attendance/check-out` | Geo-tagged check-out | Employee / Admin |
| `GET` | `/attendance/today` | Fetch user's current day attendance status | Yes |
| `GET` | `/attendance/history` | View personal attendance log | Yes |
| `GET` | `/admin/live` | Real-time overview of active employees | Admin only |
| `GET` | `/admin/employees` | List all registered employees | Admin only |
| `POST` | `/admin/sites` | Create or update geofenced locations | Admin only |
| `GET` | `/admin/reports` | Export or inspect attendance summary | Admin only |

---

## 🔒 Security Best Practices

- Always keep `.env` in `.gitignore` to prevent credentials and secrets from leaking into version control.
- Never commit `node_modules` directories.
- In production, set strong values for `JWT_SECRET` and enable HTTPS to securely transmit device location data.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
