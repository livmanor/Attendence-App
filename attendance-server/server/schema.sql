CREATE TABLE IF NOT EXISTS shifts(id SERIAL PRIMARY KEY, name TEXT NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, grace_minutes INT DEFAULT 10);
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin','admin','employee')),
  employee_type TEXT DEFAULT 'office' CHECK (employee_type IN ('office','site','field')),
  shift_id INT REFERENCES shifts(id), device_id TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS sites(id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'office',
  latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL, radius_m INT NOT NULL DEFAULT 100, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS user_sites(id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
  site_id INT REFERENCES sites(id) ON DELETE CASCADE, valid_from DATE NOT NULL DEFAULT CURRENT_DATE, valid_to DATE);
CREATE TABLE IF NOT EXISTS attendance(id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), date DATE NOT NULL,
  site_id INT REFERENCES sites(id), check_in_time TIMESTAMPTZ, check_in_lat DOUBLE PRECISION, check_in_lng DOUBLE PRECISION, check_in_accuracy REAL,
  check_out_time TIMESTAMPTZ, check_out_lat DOUBLE PRECISION, check_out_lng DOUBLE PRECISION, check_out_accuracy REAL,
  status TEXT, verification TEXT, flag_reason TEXT, hours_worked NUMERIC(5,2), UNIQUE(user_id, date));
-- visits: several stops per day under one attendance record (used by field/multi-site work in Phase 2)
CREATE TABLE IF NOT EXISTS visits(id SERIAL PRIMARY KEY, attendance_id INT REFERENCES attendance(id) ON DELETE CASCADE,
  site_id INT REFERENCES sites(id), visit_type TEXT, client TEXT, note TEXT, photo_url TEXT,
  start_time TIMESTAMPTZ, start_lat DOUBLE PRECISION, start_lng DOUBLE PRECISION, end_time TIMESTAMPTZ, status TEXT DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS audit_logs(id SERIAL PRIMARY KEY, actor_id INT, action TEXT, target_table TEXT, target_id INT,
  old_value JSONB, new_value JSONB, reason TEXT, created_at TIMESTAMPTZ DEFAULT now());
