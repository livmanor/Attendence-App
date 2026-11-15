import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import client from '../api/client'
import { useAuth } from '../auth'
import { dateTime, errorText } from '../lib'
import { Empty, ErrorState, Loading } from '../components/States'

export default function EmployeeHome() {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const load = useCallback(async () => { setLoading(true); setError(''); try { const { data } = await client.get('/attendance/me'); setRows(Array.isArray(data) ? data : data.rows || []) } catch (err) { setError(errorText(err)) } finally { setLoading(false) } }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { auth: { token: localStorage.getItem('token') } })
    socket.on('attendance:update', payload => { if (payload.user?.id === user.id) load() })
    return () => socket.disconnect()
  }, [load, user?.id])
  const active = rows.find(row => row.check_in_time && !row.check_out_time)
  async function mark(type) {
    setBusy(true); setActionError('')
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
      let deviceId = localStorage.getItem('device_id')
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('device_id', deviceId) }
      const point = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }
      if (type === 'check-in') await client.post('/attendance/check-in', { ...point, device_id: deviceId })
      else await client.post('/attendance/check-out', point)
      await load()
    } catch (err) { setActionError(err.response?.data?.error || (err.code ? 'Location access is needed to record attendance.' : errorText(err))) } finally { setBusy(false) }
  }
  return <main className="main"><div className="welcome"><div><span className="eyebrow">EMPLOYEE WORKSPACE</span><h1>Your day, <em>{user?.name?.split(' ')[0]}.</em></h1><p className="muted">Your attendance, all in one place.</p></div><span className="date-chip">Today · India</span></div><section className="checkin-card"><div className="checkin-copy"><span className="eyebrow">ATTENDANCE</span><h2>{active ? 'You’re checked in.' : 'Ready to check in?'}</h2><p>{active ? `Checked in at ${dateTime(active.check_in_time)}${active.site_name ? ` · ${active.site_name}` : ''}` : 'Your location will be verified when you check in.'}</p></div><button className="primary" disabled={busy} onClick={() => mark(active ? 'check-out' : 'check-in')}>{busy ? 'Getting location…' : active ? 'Check out' : 'Check in'}<span>↗</span></button></section>{actionError && <div className="alert action-alert">{actionError}</div>}<section className="section"><div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Attendance history</h2></div><span className="small-muted">Latest records</span></div>{loading ? <Loading /> : error ? <ErrorState message={error} retry={load} /> : rows.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Site</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}><td>{dateTime(row.check_in_time)}</td><td>{row.site_name || '—'}</td><td>{dateTime(row.check_in_time)}</td><td>{dateTime(row.check_out_time)}</td><td><span className={`badge ${row.status || 'present'}`}>{row.status || 'Present'}</span></td></tr>)}</tbody></table></div> : <Empty title="No attendance yet" detail="Your check-in history will show up here." />}</section></main>
}
