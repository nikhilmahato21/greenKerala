import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { SEED_PACKAGES } from '@/lib/packages'

neonConfig.webSocketConstructor = ws

let _pool = null

function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return _pool
}

// ─── Packages ────────────────────────────────────────────────────────────────

export async function initDB() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id            TEXT PRIMARY KEY,
      data          JSONB NOT NULL,
      category      TEXT NOT NULL DEFAULT 'group',
      status        TEXT NOT NULL DEFAULT 'approved',
      agency_id     INT,
      featured      BOOLEAN NOT NULL DEFAULT false,
      featured_order INT NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'group'`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS agency_id INT`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured_order INT NOT NULL DEFAULT 0`)
}

function mergePackageRow(r) {
  return {
    ...r.data,
    category: r.category ?? 'group',
    status: r.status ?? 'approved',
    agencyId: r.agency_id ?? null,
    featured: r.featured ?? false,
    featuredOrder: r.featured_order ?? 0,
  }
}

async function ensureSeeded() {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM packages')
  if (rows[0].count === 0) {
    for (const pkg of SEED_PACKAGES) {
      await pool.query(
        `INSERT INTO packages (id, data, category, status) VALUES ($1, $2, $3, 'approved') ON CONFLICT DO NOTHING`,
        [pkg.id, JSON.stringify(pkg), pkg.category || 'group']
      )
    }
  }
}

export async function getAllPackages() {
  const pool = getPool()
  await ensureSeeded()
  const { rows } = await pool.query(
    `SELECT id, data, category, status, agency_id, featured, featured_order
     FROM packages WHERE status = 'approved' ORDER BY created_at ASC`
  )
  return rows.map(mergePackageRow)
}

export async function getAllPackagesAdmin() {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT p.id, p.data, p.category, p.status, p.agency_id, p.featured, p.featured_order,
            a.name AS agency_name
     FROM packages p
     LEFT JOIN agencies a ON p.agency_id = a.id
     ORDER BY p.created_at DESC`
  )
  return rows.map(r => ({ ...mergePackageRow(r), agencyName: r.agency_name ?? null }))
}

export async function getFeaturedPackages() {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT id, data, category, status, agency_id, featured, featured_order
     FROM packages WHERE featured = true AND status = 'approved'
     ORDER BY featured_order ASC, created_at ASC`
  )
  return rows.map(mergePackageRow)
}

export async function getPackageById(id) {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT id, data, category, status, agency_id, featured, featured_order
     FROM packages WHERE id = $1`,
    [id]
  )
  if (!rows[0]) return null
  return mergePackageRow(rows[0])
}

export async function insertPackage(pkg) {
  const pool = getPool()
  await initDB()
  const category = pkg.category || 'group'
  await pool.query(
    `INSERT INTO packages (id, data, category, status, agency_id) VALUES ($1, $2, $3, 'approved', NULL)`,
    [pkg.id, JSON.stringify(pkg), category]
  )
  return pkg
}

export async function insertPackageByAgency(pkg, agencyId) {
  const pool = getPool()
  await initDB()
  const category = pkg.category || 'group'
  await pool.query(
    `INSERT INTO packages (id, data, category, status, agency_id) VALUES ($1, $2, $3, 'pending', $4)`,
    [pkg.id, JSON.stringify(pkg), category, agencyId]
  )
  return { ...pkg, status: 'pending', agencyId }
}

export async function updatePackage(id, data) {
  const pool = getPool()
  await initDB()
  const category = data.category || 'group'
  await pool.query(
    `UPDATE packages SET data = $1, category = $2, updated_at = NOW() WHERE id = $3`,
    [JSON.stringify(data), category, id]
  )
  return data
}

export async function updatePackageStatus(id, status) {
  const pool = getPool()
  await pool.query(`UPDATE packages SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id])
}

export async function togglePackageFeatured(id, featured, order = 0) {
  const pool = getPool()
  await pool.query(
    `UPDATE packages SET featured = $1, featured_order = $2, updated_at = NOW() WHERE id = $3`,
    [featured, order, id]
  )
}

export async function deletePackage(id) {
  const pool = getPool()
  await initDB()
  await pool.query('DELETE FROM packages WHERE id = $1', [id])
}

export async function resetPackages() {
  const pool = getPool()
  await initDB()
  await pool.query('DELETE FROM packages WHERE agency_id IS NULL')
  for (const pkg of SEED_PACKAGES) {
    await pool.query(
      `INSERT INTO packages (id, data, category, status) VALUES ($1, $2, $3, 'approved')`,
      [pkg.id, JSON.stringify(pkg), pkg.category || 'group']
    )
  }
  return SEED_PACKAGES
}

// ─── Users ───────────────────────────────────────────────────────────────────

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
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`)
  await pool.query(`UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL`)
}

export async function createUser(username, hashedPassword, role = 'admin') {
  const pool = getPool()
  await initUsersTable()
  const { rows } = await pool.query(
    'INSERT INTO users (email, username, password, role) VALUES ($1, $1, $2, $3) RETURNING id, username, role',
    [username, hashedPassword, role]
  )
  return rows[0]
}

export async function getUserByUsername(username) {
  const pool = getPool()
  await initUsersTable()
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  return rows[0] ?? null
}

export async function getUserByEmail(email) {
  const pool = getPool()
  await initUsersTable()
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return rows[0] ?? null
}

// ─── Agencies ────────────────────────────────────────────────────────────────

export async function initAgenciesTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agencies (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      phone       TEXT NOT NULL,
      description TEXT,
      website     TEXT,
      password    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function createAgency({ name, email, phone, description, website, hashedPassword }) {
  const pool = getPool()
  await initAgenciesTable()
  const { rows } = await pool.query(
    `INSERT INTO agencies (name, email, phone, description, website, password, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id, name, email, phone, description, website, status, created_at`,
    [name, email, phone, description || null, website || null, hashedPassword]
  )
  return rows[0]
}

export async function getAllAgencies() {
  const pool = getPool()
  await initAgenciesTable()
  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.email, a.phone, a.description, a.website, a.status, a.created_at,
            COUNT(p.id)::int AS package_count
     FROM agencies a
     LEFT JOIN packages p ON p.agency_id = a.id
     GROUP BY a.id ORDER BY a.created_at DESC`
  )
  return rows
}

export async function getAgencyById(id) {
  const pool = getPool()
  await initAgenciesTable()
  const { rows } = await pool.query('SELECT * FROM agencies WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function getAgencyByEmail(email) {
  const pool = getPool()
  await initAgenciesTable()
  const { rows } = await pool.query('SELECT * FROM agencies WHERE email = $1', [email])
  return rows[0] ?? null
}

export async function updateAgencyStatus(id, status) {
  const pool = getPool()
  await pool.query(`UPDATE agencies SET status = $1 WHERE id = $2`, [status, id])
}

export async function deleteAgency(id) {
  const pool = getPool()
  await pool.query('DELETE FROM agencies WHERE id = $1', [id])
}

export async function getAgencyPackages(agencyId) {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT id, data, category, status, agency_id, featured, featured_order
     FROM packages WHERE agency_id = $1 ORDER BY created_at DESC`,
    [agencyId]
  )
  return rows.map(mergePackageRow)
}

// ─── Destinations ─────────────────────────────────────────────────────────────

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
        ('Munnar',      '#2e9e7a', 'https://images.unsplash.com/photo-1585394365777-e81a5f5bf68a?w=800&q=80', 'Misty tea gardens, waterfalls & cool hill breezes', '🍃'),
        ('Alleppey',    '#e8520a', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80', 'Tranquil backwaters, houseboats & village life', '🛶'),
        ('Wayanad',     '#2e3da8', 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80', 'Dense forests, tribal culture & misty mornings', '🌿')
      ON CONFLICT DO NOTHING
    `)
  } else {
    await pool.query(`UPDATE destinations SET image_url='https://images.unsplash.com/photo-1585394365777-e81a5f5bf68a?w=800&q=80', description='Misty tea gardens, waterfalls & cool hill breezes', emoji='🍃' WHERE name='Munnar' AND image_url IS NULL`)
    await pool.query(`UPDATE destinations SET image_url='https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80', description='Tranquil backwaters, houseboats & village life', emoji='🛶' WHERE name='Alleppey' AND image_url IS NULL`)
    await pool.query(`UPDATE destinations SET image_url='https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80', description='Dense forests, tribal culture & misty mornings', emoji='🌿' WHERE name='Wayanad' AND image_url IS NULL`)
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

// ─── Settings ────────────────────────────────────────────────────────────────

export async function initSettingsTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('phone', '919846034558') ON CONFLICT DO NOTHING`)
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

// ─── Enquiries ────────────────────────────────────────────────────────────────

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
