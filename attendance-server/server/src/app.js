require('dotenv').config();
const express = require('express'), cors = require('cors'), http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = express(), server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
// Only logged-in admins receive live updates
io.use((s, next) => { try { const p = jwt.verify(s.handshake.auth.token, process.env.JWT_SECRET);
  return ['super_admin', 'admin'].includes(p.role) ? next() : next(new Error('forbidden')); } catch { next(new Error('unauthorized')); } });
app.set('io', io);
app.use(cors(), express.json());
app.use('/auth', require('./routes/auth'));
app.use('/attendance', require('./routes/attendance'));
app.use('/', require('./routes/admin'));
app.use((err, _q, res, _n) => { console.error(err); res.status(500).json({ error: 'Server error' }); });
server.listen(process.env.PORT || 4000, () => console.log('API running on port', process.env.PORT || 4000));
