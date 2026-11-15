// Sites, employees, shifts: admin / super_admin only
const r = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db'); const { auth, role } = require('../middleware');
r.use(auth, role('super_admin', 'admin'));
const bad = (res, m) => res.status(400).json({ error: m });

// ---- Sites
r.get('/sites', async (_q, res) => res.json((await db.query('SELECT * FROM sites ORDER BY id')).rows));
r.post('/sites', async (req, res) => {
  const { name, type = 'office', latitude, longitude, radius_m = 100 } = req.body;
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return bad(res, 'name, latitude, longitude required');
  res.status(201).json((await db.query(
    'INSERT INTO sites(name,type,latitude,longitude,radius_m) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [name, type, latitude, longitude, radius_m])).rows[0]);
});
r.patch('/sites/:id', async (req, res) => {
  const { name, latitude, longitude, radius_m, is_active } = req.body;
  res.json((await db.query(
    `UPDATE sites SET name=COALESCE($1,name), latitude=COALESCE($2,latitude), longitude=COALESCE($3,longitude),
     radius_m=COALESCE($4,radius_m), is_active=COALESCE($5,is_active) WHERE id=$6 RETURNING *`,
    [name, latitude, longitude, radius_m, is_active, req.params.id])).rows[0]);
});

// ---- Shifts
r.get('/shifts', async (_q, res) => res.json((await db.query('SELECT * FROM shifts ORDER BY id')).rows));
r.post('/shifts', async (req, res) => {
  const { name, start_time, end_time, grace_minutes = 10 } = req.body;
  if (!name || !start_time || !end_time) return bad(res, 'name, start_time, end_time required');
  res.status(201).json((await db.query(
    'INSERT INTO shifts(name,start_time,end_time,grace_minutes) VALUES($1,$2,$3,$4) RETURNING *',
    [name, start_time, end_time, grace_minutes])).rows[0]);
});

// ---- Employees
r.get('/employees', async (_q, res) => res.json((await db.query(
  `SELECT id,name,email,phone,role,employee_type,shift_id,is_active FROM users ORDER BY id`)).rows));
r.post('/employees', async (req, res) => {
  const { name, email, phone, password, employee_type = 'office', shift_id, role: rl = 'employee' } = req.body;
  if (!name || !email || !password || password.length < 8) return bad(res, 'name, email, password (8+ chars) required');
  if (rl !== 'employee' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Only super admin can create admins' });
  try {
    res.status(201).json((await db.query(
      `INSERT INTO users(name,email,phone,password_hash,role,employee_type,shift_id) VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,name,email,role,employee_type,shift_id`,
      [name, email.toLowerCase(), phone, await bcrypt.hash(password, 10), rl, employee_type, shift_id])).rows[0]);
  } catch (e) { return bad(res, e.code === '23505' ? 'Email already exists' : 'Could not create employee'); }
});
r.patch('/employees/:id', async (req, res) => {
  const { name, phone, employee_type, shift_id, is_active } = req.body;
  res.json((await db.query(
    `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), employee_type=COALESCE($3,employee_type),
     shift_id=COALESCE($4,shift_id), is_active=COALESCE($5,is_active) WHERE id=$6
     RETURNING id,name,email,employee_type,shift_id,is_active`,
    [name, phone, employee_type, shift_id, is_active, req.params.id])).rows[0]);
});
r.post('/employees/:id/sites', async (req, res) => {
  const { site_id, valid_from, valid_to } = req.body;
  if (!site_id) return bad(res, 'site_id required');
  res.status(201).json((await db.query(
    'INSERT INTO user_sites(user_id,site_id,valid_from,valid_to) VALUES($1,$2,COALESCE($3,CURRENT_DATE),$4) RETURNING *',
    [req.params.id, site_id, valid_from, valid_to])).rows[0]);
});
r.post('/employees/:id/reset-device', async (req, res) => {
  await db.query('UPDATE users SET device_id=NULL WHERE id=$1', [req.params.id]); res.json({ ok: true });
});
module.exports = r;
