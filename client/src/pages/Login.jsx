import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../auth'
import { errorText } from '../lib'

export default function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const { setSession } = useAuth(), navigate = useNavigate()
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    try { const { data } = await client.post('/auth/login', { email, password }); setSession(data); navigate(['admin', 'super_admin'].includes(data.user.role) ? '/admin' : '/app') }
    catch (err) { setError(errorText(err)) } finally { setLoading(false) }
  }
  return <main className="login-page"><div className="login-aside"><div className="brand brand-light"><span className="brand-mark">f.</span><span>fieldnote</span></div><div className="login-copy"><span className="eyebrow">WORK, IN ITS RIGHT PLACE</span><h1>Good work<br />starts with<br /><em>being there.</em></h1><p>Attendance that keeps your team connected to the places they work.</p></div><div className="aside-foot">People first. Place aware.</div></div><section className="login-main"><form className="login-form" onSubmit={submit}><div className="mobile-brand brand"><span className="brand-mark">f.</span><span>fieldnote</span></div><span className="eyebrow">WELCOME BACK</span><h2>Sign in to continue</h2><p className="muted">Use your work account to access attendance.</p>{error && <div className="alert">{error}</div>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label><button className="primary full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}<span>↗</span></button><div className="login-note">Your location is only used when you check in or out.</div></form></section></main>
}
