import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const EmployeeHome = lazy(() => import('./pages/EmployeeHome'))
const AdminHome = lazy(() => import('./pages/AdminHome'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Directory = lazy(() => import('./pages/Directory'))
const Sites = lazy(() => import('./pages/Sites'))
const Shifts = lazy(() => import('./pages/Shifts'))

function Gate({ children, admin = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (admin && !['admin', 'super_admin'].includes(user.role)) return <Navigate to="/app" replace />
  if (!admin && ['admin', 'super_admin'].includes(user.role)) return <Navigate to="/admin" replace />
  return children
}
function RoutesView() {
  return <Suspense fallback={<div className="state">Loading screen…</div>}><Routes><Route path="/login" element={<Login />} />
    <Route path="/app/*" element={<Gate><Layout /><EmployeeHome /></Gate>} />
    <Route path="/admin/*" element={<Gate admin><Layout /><AdminHome /></Gate>} />
    <Route path="/admin/attendance" element={<Gate admin><Layout /><Attendance /></Gate>} />
    <Route path="/admin/employees" element={<Gate admin><Layout /><Directory /></Gate>} />
    <Route path="/admin/sites" element={<Gate admin><Layout /><Sites /></Gate>} />
    <Route path="/admin/shifts" element={<Gate admin><Layout /><Shifts /></Gate>} />
    <Route path="*" element={<Navigate to={localStorage.getItem('token') ? '/app' : '/login'} replace />} />
  </Routes></Suspense>
}
export default function App() { return <AuthProvider><RoutesView /></AuthProvider> }
