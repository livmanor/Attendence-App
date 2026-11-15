import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { initials } from '../lib'

export default function Layout() {
  const { user, logout } = useAuth(), navigate = useNavigate()
  const admin = ['admin', 'super_admin'].includes(user?.role)
  const links = admin ? [['/admin', 'Overview'], ['/admin/attendance', 'Attendance'], ['/admin/employees', 'People'], ['/admin/sites', 'Sites'], ['/admin/shifts', 'Shifts']] : [['/app', 'My day']]
  function signOut() { logout(); navigate('/login') }
  return <><header className="topbar"><NavLink to={admin ? '/admin' : '/app'} className="brand"><span className="brand-mark">f.</span><span>fieldnote</span></NavLink><nav>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin' || to === '/app'}>{label}</NavLink>)}</nav><div className="profile"><span className="avatar">{initials(user?.name)}</span><span className="profile-name">{user?.name}</span><button onClick={signOut} className="logout">Sign out</button></div></header><div className="mobile-nav">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin' || to === '/app'}>{label}</NavLink>)}</div></>
}
