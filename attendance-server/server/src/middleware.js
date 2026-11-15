const jwt = require('jsonwebtoken');
const db = require('./db');
exports.auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id,name,role,employee_type,shift_id,device_id,is_active FROM users WHERE id=$1', [p.id]);
    if (!rows[0] || !rows[0].is_active) return res.status(401).json({ error: 'Account inactive or not found' });
    req.user = rows[0]; next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
exports.role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });
