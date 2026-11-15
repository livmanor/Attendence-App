import { createContext, useContext, useMemo, useState } from 'react'
const Context = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })
  const value = useMemo(() => ({ user, setSession(session) { localStorage.setItem('token', session.token); localStorage.setItem('user', JSON.stringify(session.user)); setUser(session.user) }, logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null) } }), [user])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useAuth = () => useContext(Context)
