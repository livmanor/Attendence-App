const bcrypt = require('bcryptjs'); const db = require('./db');
(async () => {
  await db.query(`INSERT INTO shifts(name,start_time,end_time,grace_minutes) SELECT 'General','09:00','18:00',10 WHERE NOT EXISTS (SELECT 1 FROM shifts)`);
  await db.query(`INSERT INTO users(name,email,password_hash,role) VALUES('Owner',$1,$2,'super_admin') ON CONFLICT (email) DO NOTHING`,
    [process.env.ADMIN_EMAIL.toLowerCase(), await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)]);
  console.log('Seeded super admin + default shift'); process.exit(0);
})();
