const r = require('express').Router();
const db = require('../db'); const { auth, role } = require('../middleware'); const { distanceM } = require('../geo');
const TZ = () => process.env.TZ_NAME || 'Asia/Kolkata';
const MAX_ACC = () => Number(process.env.MAX_ACCURACY_M || 100);
const validLoc = b => [b.lat, b.lng, b.accuracy].every(Number.isFinite) && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180;
const today = `(now() AT TIME ZONE $1)::date`;

// ---------- Employee: check-in (all checks happen on the server, server time only)
r.post('/check-in', auth, async (req, res) => {
  const b = req.body || {}, u = req.user;
  if (!validLoc(b)) return res.status(400).json({ error: 'Location (lat, lng, accuracy) required' });
  if (b.accuracy > MAX_ACC())
    return res.status(400).json({ error: `GPS accuracy too low (${Math.round(b.accuracy)} m). Move outdoors or near a window and retry.` });

  const done = await db.query(`SELECT id FROM attendance WHERE user_id=$2 AND date=${today}`, [TZ(), u.id]);
  if (done.rows[0]) return res.status(409).json({ error: 'You have already checked in today' });

  const sites = (await db.query(
    `SELECT s.* FROM sites s JOIN user_sites us ON us.site_id=s.id
     WHERE us.user_id=$2 AND s.is_active AND us.valid_from<=${today} AND (us.valid_to IS NULL OR us.valid_to>=${today})`,
    [TZ(), u.id])).rows;
  if (!sites.length) return res.status(403).json({ error: 'No site assigned to you today. Contact your admin.' });

  const nearest = sites.map(s => ({ ...s, dist: distanceM(b.lat, b.lng, s.latitude, s.longitude) }))
    .sort((a, c) => a.dist - c.dist)[0];
  const inside = nearest.dist <= nearest.radius_m;
  let verification = 'verified', flag = null;
  if (!inside) {
    if (u.employee_type !== 'field')
      return res.status(403).json({ error: `You are ${Math.round(nearest.dist)} m away from ${nearest.name} (allowed ${nearest.radius_m} m)` });
    verification = 'flagged'; flag = `Outside site radius by ${Math.round(nearest.dist - nearest.radius_m)} m`;
  }
  // Device binding: first device is remembered, a different device is flagged
  if (b.device_id) {
    if (!u.device_id) await db.query('UPDATE users SET device_id=$1 WHERE id=$2', [b.device_id, u.id]);
    else if (u.device_id !== b.device_id) { verification = 'flagged'; flag = [flag, 'Unregistered device'].filter(Boolean).join('; '); }
  }
  const late = u.shift_id ? (await db.query(
    `SELECT (now() AT TIME ZONE $1)::time > start_time + make_interval(mins => grace_minutes) AS late FROM shifts WHERE id=$2`,
    [TZ(), u.shift_id])).rows[0].late : false;

  const row = (await db.query(
    `INSERT INTO attendance(user_id,date,site_id,check_in_time,check_in_lat,check_in_lng,check_in_accuracy,status,verification,flag_reason)
     VALUES($2,${today},$3,now(),$4,$5,$6,$7,$8,$9) RETURNING *`,
    [TZ(), u.id, nearest.id, b.lat, b.lng, b.accuracy, late ? 'late' : 'present', verification, flag])).rows[0];
  req.app.get('io').emit('attendance:update', { type: 'check_in', user: u.name, site: nearest.name, status: row.status, verification });
  res.status(201).json({ ...row, site_name: nearest.name, distance_m: Math.round(nearest.dist) });
});

// ---------- Employee: check-out
r.post('/check-out', auth, async (req, res) => {
  const b = req.body || {}, u = req.user;
  if (!validLoc(b)) return res.status(400).json({ error: 'Location (lat, lng, accuracy) required' });
  const rec = (await db.query(
    `SELECT a.*, s.latitude, s.longitude, s.radius_m, s.name AS site_name FROM attendance a JOIN sites s ON s.id=a.site_id
     WHERE a.user_id=$2 AND a.date=${today} AND a.check_out_time IS NULL`, [TZ(), u.id])).rows[0];
  if (!rec) return res.status(409).json({ error: 'No open check-in found for today' });
  const dist = distanceM(b.lat, b.lng, rec.latitude, rec.longitude);
  let verification = rec.verification, flag = rec.flag_reason;
  if (dist > rec.radius_m || b.accuracy > MAX_ACC()) {
    verification = 'flagged'; flag = [flag, `Check-out ${Math.round(dist)} m from site (accuracy ${Math.round(b.accuracy)} m)`].filter(Boolean).join('; ');
  }
  const out = (await db.query(
    `UPDATE attendance SET check_out_time=now(), check_out_lat=$1, check_out_lng=$2, check_out_accuracy=$3,
     hours_worked=ROUND((EXTRACT(EPOCH FROM now()-check_in_time)/3600)::numeric,2),
     status=CASE WHEN EXTRACT(EPOCH FROM now()-check_in_time)/3600 < 4 THEN 'half_day' ELSE status END,
     verification=$4, flag_reason=$5 WHERE id=$6 RETURNING *`,
    [b.lat, b.lng, b.accuracy, verification, flag, rec.id])).rows[0];
  req.app.get('io').emit('attendance:update', { type: 'check_out', user: u.name, site: rec.site_name });
  res.json(out);
});

r.get('/me', auth, async (req, res) => res.json((await db.query(
  `SELECT a.*, s.name AS site_name FROM attendance a LEFT JOIN sites s ON s.id=a.site_id
   WHERE a.user_id=$1 ORDER BY a.date DESC LIMIT 60`, [req.user.id])).rows));

// ---------- Admin
const adm = [auth, role('super_admin', 'admin')];
r.get('/today', ...adm, async (_q, res) => {
  const rows = (await db.query(
    `SELECT u.id user_id, u.name, u.employee_type, a.id, a.status, a.verification, a.flag_reason, a.check_in_time, a.check_out_time,
            a.check_in_lat, a.check_in_lng, s.name site_name
     FROM users u LEFT JOIN attendance a ON a.user_id=u.id AND a.date=${today}
     LEFT JOIN sites s ON s.id=a.site_id WHERE u.is_active AND u.role='employee' ORDER BY u.name`, [TZ()])).rows;
  const present = rows.filter(x => x.id);
  res.json({ summary: { total: rows.length, present: present.length, absent: rows.length - present.length,
    late: present.filter(x => x.status === 'late').length, flagged: present.filter(x => x.verification === 'flagged').length }, rows });
});

const filtered = async q => {
  const w = [], p = [];
  const add = (sql, v) => { p.push(v); w.push(sql.replace('?', '$' + p.length)); };
  if (q.from) add('a.date >= ?', q.from); if (q.to) add('a.date <= ?', q.to);
  if (q.user_id) add('a.user_id = ?', q.user_id); if (q.site_id) add('a.site_id = ?', q.site_id);
  if (q.status) add('a.status = ?', q.status); if (q.verification) add('a.verification = ?', q.verification);
  return (await db.query(
    `SELECT a.*, u.name employee, s.name site_name FROM attendance a JOIN users u ON u.id=a.user_id
     LEFT JOIN sites s ON s.id=a.site_id ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY a.date DESC, u.name LIMIT 1000`, p)).rows;
};
r.get('/', ...adm, async (req, res) => res.json(await filtered(req.query)));

r.get('/export/csv', ...adm, async (req, res) => {
  const rows = await filtered(req.query);
  const cols = ['date', 'employee', 'site_name', 'check_in_time', 'check_out_time', 'hours_worked', 'status', 'verification', 'flag_reason'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.type('text/csv').attachment('attendance.csv')
    .send([cols.join(','), ...rows.map(x => cols.map(c => esc(x[c])).join(','))].join('\n'));
});

// Manual correction: reason is mandatory and every change is audited
r.patch('/:id', ...adm, async (req, res) => {
  const { status, check_in_time, check_out_time, reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'A reason is required for corrections' });
  const old = (await db.query('SELECT * FROM attendance WHERE id=$1', [req.params.id])).rows[0];
  if (!old) return res.status(404).json({ error: 'Record not found' });
  const upd = (await db.query(
    `UPDATE attendance SET status=COALESCE($1,status), check_in_time=COALESCE($2,check_in_time),
     check_out_time=COALESCE($3,check_out_time), verification='verified',
     hours_worked=CASE WHEN COALESCE($3,check_out_time) IS NOT NULL
       THEN ROUND((EXTRACT(EPOCH FROM COALESCE($3,check_out_time)-COALESCE($2,check_in_time))/3600)::numeric,2) ELSE hours_worked END
     WHERE id=$4 RETURNING *`, [status, check_in_time, check_out_time, req.params.id])).rows[0];
  await db.query(`INSERT INTO audit_logs(actor_id,action,target_table,target_id,old_value,new_value,reason) VALUES($1,'correction','attendance',$2,$3,$4,$5)`,
    [req.user.id, old.id, old, upd, reason]);
  res.json(upd);
});
module.exports = r;
