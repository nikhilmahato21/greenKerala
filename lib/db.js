import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { SEED_PACKAGES } from '@/lib/packages'

neonConfig.webSocketConstructor = ws

let _pool = null

function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return _pool
}

export async function initDB() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

async function ensureSeeded() {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM packages')
  if (rows[0].count === 0) {
    for (const pkg of SEED_PACKAGES) {
      await pool.query(
        'INSERT INTO packages (id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [pkg.id, JSON.stringify(pkg)]
      )
    }
  }
}

export async function getAllPackages() {
  const pool = getPool()
  await ensureSeeded()
  const { rows } = await pool.query('SELECT data FROM packages ORDER BY created_at ASC')
  return rows.map(r => r.data)
}

export async function getPackageById(id) {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query('SELECT data FROM packages WHERE id = $1', [id])
  return rows[0]?.data ?? null
}

export async function insertPackage(pkg) {
  const pool = getPool()
  await initDB()
  await pool.query(
    'INSERT INTO packages (id, data) VALUES ($1, $2)',
    [pkg.id, JSON.stringify(pkg)]
  )
  return pkg
}

export async function updatePackage(id, data) {
  const pool = getPool()
  await initDB()
  await pool.query(
    'UPDATE packages SET data = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(data), id]
  )
  return data
}

export async function deletePackage(id) {
  const pool = getPool()
  await initDB()
  await pool.query('DELETE FROM packages WHERE id = $1', [id])
}

export async function resetPackages() {
  const pool = getPool()
  await initDB()
  await pool.query('DELETE FROM packages')
  for (const pkg of SEED_PACKAGES) {
    await pool.query(
      'INSERT INTO packages (id, data) VALUES ($1, $2)',
      [pkg.id, JSON.stringify(pkg)]
    )
  }
  return SEED_PACKAGES
}

export async function initUsersTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function createUser(email, hashedPassword, role = 'admin') {
  const pool = getPool()
  await initUsersTable()
  const { rows } = await pool.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
    [email, hashedPassword, role]
  )
  return rows[0]
}

export async function getUserByEmail(email) {
  const pool = getPool()
  await initUsersTable()
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return rows[0] ?? null
}

export async function initDestinationsTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS destinations (
      id          SERIAL PRIMARY KEY,
      name        TEXT UNIQUE NOT NULL,
      color       TEXT NOT NULL DEFAULT '#e8520a',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await pool.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS image_url TEXT`)
  await pool.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description TEXT`)
  await pool.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📍'`)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM destinations')
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO destinations (name, color, image_url, description, emoji) VALUES
        ('Goa',         '#2e9e7a', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', 'Golden beaches, Portuguese forts & legendary nightlife', '🏖️'),
        ('Gokarna',     '#e8520a', 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&q=80', 'Sacred shores, cliff treks & untouched beaches', '🕉️'),
        ('Chikmagalur', '#2e3da8', 'https://images.pexels.com/photos/11532473/pexels-photo-11532473.jpeg', 'Misty coffee hills, forest treks & estate homestays', '☕')
      ON CONFLICT DO NOTHING
    `)
  } else {
    await pool.query(`UPDATE destinations SET image_url='https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', description='Golden beaches, Portuguese forts & legendary nightlife', emoji='🏖️' WHERE name='Goa' AND image_url IS NULL`)
    await pool.query(`UPDATE destinations SET image_url='https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&q=80', description='Sacred shores, cliff treks & untouched beaches', emoji='🕉️' WHERE name='Gokarna' AND image_url IS NULL`)
    await pool.query(`UPDATE destinations SET image_url='https://images.pexels.com/photos/11532473/pexels-photo-11532473.jpeg', description='Misty coffee hills, forest treks & estate homestays', emoji='☕' WHERE name='Chikmagalur' AND image_url IS NULL`)
  }
}

export async function getDestinations() {
  const pool = getPool()
  await initDestinationsTable()
  const { rows } = await pool.query('SELECT * FROM destinations ORDER BY created_at ASC')
  return rows
}

export async function createDestination(name, color, { image_url, description, emoji } = {}) {
  const pool = getPool()
  await initDestinationsTable()
  const { rows } = await pool.query(
    'INSERT INTO destinations (name, color, image_url, description, emoji) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, color, image_url || null, description || null, emoji || '📍']
  )
  return rows[0]
}

export async function updateDestination(id, { color, image_url, description, emoji }) {
  const pool = getPool()
  await pool.query(
    'UPDATE destinations SET color=$1, image_url=$2, description=$3, emoji=$4 WHERE id=$5',
    [color, image_url || null, description || null, emoji || '📍', id]
  )
}

export async function deleteDestination(id) {
  const pool = getPool()
  await pool.query('DELETE FROM destinations WHERE id = $1', [id])
}

export async function initSettingsTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('phone', '918062179246') ON CONFLICT DO NOTHING`)
}

export async function getSettings() {
  const pool = getPool()
  await initSettingsTable()
  const { rows } = await pool.query('SELECT key, value FROM settings')
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

export async function setSetting(key, value) {
  const pool = getPool()
  await initSettingsTable()
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, value]
  )
}

export async function initEnquiriesTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id            SERIAL PRIMARY KEY,
      package_id    TEXT,
      package_title TEXT,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL,
      email         TEXT,
      message       TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function createEnquiry({ package_id, package_title, name, phone, email, message }) {
  const pool = getPool()
  await initEnquiriesTable()
  const { rows } = await pool.query(
    'INSERT INTO enquiries (package_id, package_title, name, phone, email, message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [package_id || null, package_title || null, name, phone, email || null, message || null]
  )
  return rows[0]
}

export async function getEnquiries() {
  const pool = getPool()
  await initEnquiriesTable()
  const { rows } = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC')
  return rows
}

export async function deleteEnquiry(id) {
  const pool = getPool()
  await pool.query('DELETE FROM enquiries WHERE id = $1', [id])
}
