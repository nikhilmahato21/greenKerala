import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { SEED_PACKAGES } from '@/lib/packages'

neonConfig.webSocketConstructor = ws
neonConfig.poolQueryViaFetch = true

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
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS featured_days INT NOT NULL DEFAULT 30`)
  await pool.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`)
}

function mergePackageRow(r) {
  return {
    ...r.data,
    id: r.id,
    category: r.category ?? 'group',
    status: r.status ?? 'approved',
    agencyId: r.agency_id ?? null,
    featured: r.featured ?? false,
    featuredOrder: r.featured_order ?? 0,
    featuredAt: r.featured_at ?? null,
    featuredDays: r.featured_days ?? 30,
    hidden: r.hidden ?? false,
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
    `SELECT id, data, category, status, agency_id, featured, featured_order, hidden
     FROM packages WHERE status = 'approved' AND hidden = false ORDER BY created_at ASC`
  )
  return rows.map(mergePackageRow)
}

export async function getAllPackagesAdmin() {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT p.id, p.data, p.category, p.status, p.agency_id, p.featured, p.featured_order, p.featured_at, p.featured_days, p.hidden,
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
    `SELECT id, data, category, status, agency_id, featured, featured_order, featured_at, featured_days, hidden
     FROM packages
     WHERE featured = true AND status = 'approved' AND hidden = false
       AND (featured_at IS NULL OR featured_at + (featured_days * INTERVAL '1 day') > NOW())
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

export async function togglePackageFeatured(id, featured, order = 0, days = 30) {
  const pool = getPool()
  await pool.query(
    `UPDATE packages SET featured = $1, featured_order = $2,
       featured_at   = CASE WHEN $1 THEN NOW() ELSE NULL END,
       featured_days = CASE WHEN $1 THEN $4 ELSE 30 END,
       updated_at    = NOW()
     WHERE id = $3`,
    [featured, order, id, days]
  )
}

export async function deletePackage(id) {
  const pool = getPool()
  await initDB()
  await pool.query('DELETE FROM packages WHERE id = $1', [id])
}

export async function setPackageHidden(id, hidden) {
  const pool = getPool()
  await initDB()
  await pool.query('UPDATE packages SET hidden = $1, updated_at = NOW() WHERE id = $2', [hidden, id])
}

export async function setPackageHiddenByAgency(id, hidden, agencyId) {
  const pool = getPool()
  await initDB()
  const { rowCount } = await pool.query(
    'UPDATE packages SET hidden = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3',
    [hidden, id, agencyId]
  )
  return rowCount > 0
}

export async function renamePackageId(oldId, newId, updatedData) {
  const pool = getPool()
  await initDB()
  const category = updatedData.category || 'group'
  await pool.query(
    `INSERT INTO packages (id, data, category, status, agency_id, featured, featured_order, created_at)
     SELECT $1, $2, category, status, agency_id, featured, featured_order, created_at
     FROM packages WHERE id = $3`,
    [newId, JSON.stringify(updatedData), oldId]
  )
  await pool.query(`UPDATE enquiries SET package_id = $1 WHERE package_id = $2`, [newId, oldId])
  await pool.query('DELETE FROM packages WHERE id = $1', [oldId])
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

export async function updateAdminUsername(oldUsername, newUsername) {
  const pool = getPool()
  await initUsersTable()
  const { rowCount } = await pool.query(
    'UPDATE users SET username = $1, email = $1 WHERE username = $2',
    [newUsername.trim(), oldUsername]
  )
  return rowCount > 0
}

export async function updateAdminPassword(username, hashedPassword) {
  const pool = getPool()
  await initUsersTable()
  const { rowCount } = await pool.query(
    'UPDATE users SET password = $1 WHERE username = $2',
    [hashedPassword, username]
  )
  return rowCount > 0
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

export async function updateAgencyPhone(id, phone) {
  const pool = getPool()
  await pool.query('UPDATE agencies SET phone = $1 WHERE id = $2', [phone, id])
}

export async function updateAgencyPassword(email, hashedPassword) {
  const pool = getPool()
  await initAgenciesTable()
  const { rowCount } = await pool.query(
    'UPDATE agencies SET password = $1 WHERE email = $2',
    [hashedPassword, email.toLowerCase().trim()]
  )
  return rowCount > 0
}

export async function getAgencyPackages(agencyId) {
  const pool = getPool()
  await initDB()
  const { rows } = await pool.query(
    `SELECT id, data, category, status, agency_id, featured, featured_order, hidden
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
  await pool.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT true`)

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

export async function updateDestinationFeatured(id, featured) {
  const pool = getPool()
  await pool.query('UPDATE destinations SET featured = $1 WHERE id = $2', [featured, id])
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
  await pool.query(`INSERT INTO settings (key, value) VALUES ('whatsapp', '919846034558') ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('email', '') ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('email2', '') ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('banner_days', '30') ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('admin_recovery_email', '') ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO settings (key, value) VALUES ('min_dest_packages', '1') ON CONFLICT DO NOTHING`)
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

// ─── Package Options ─────────────────────────────────────────────────────────

export async function initPackageOptionsTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS package_options (
      id         SERIAL PRIMARY KEY,
      type       TEXT NOT NULL,
      value      TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(type, value)
    )
  `)
  const seeds = {
    inclusion: [
      'Accommodation', 'Daily breakfast', 'Daily dinner',
      'All meals (breakfast, lunch & dinner)', 'Breakfast & dinner',
      'Airport / railway transfers', 'Private AC vehicle', 'AC cab for all sightseeing',
      'Experienced local guide', 'Entry tickets (as mentioned)', 'Houseboat stay',
      'Backwater cruise', 'Welcome drink on arrival', 'Bonfire arrangement',
      'Toll & parking charges', 'Driver allowance & fuel', 'Boat ride', 'Jeep safari',
      'Complimentary mineral water', 'First-aid kit', 'Travel coordinator support',
    ],
    exclusion: [
      'Flights / trains', 'Lunch on any day', 'Personal expenses & tips',
      'Travel insurance', 'Alcoholic beverages', 'Camera / video entry fees',
      'Anything not mentioned in inclusions', 'Optional adventure activity fees',
      'Room service charges', 'Laundry', 'Medical expenses', 'Visa fees',
      'Any extra meals ordered', 'Charges due to natural calamity or political unrest',
    ],
    highlight: [
      'Backwater houseboat stay', 'Tea estate guided walk & tasting',
      'Wildlife jeep safari', 'Waterfall trek', 'Spice garden tour',
      'Kathakali cultural show', 'Sunrise trek', 'Sunset boat cruise',
      'Village homestay experience', 'Elephant interaction (ethical)',
      'Bamboo rafting', 'Mountain biking', 'Ayurvedic spa session',
      'Fishing with local fishermen', 'Kerala cooking class',
      'Munnar hill panoramic views', 'Thekkady wildlife sighting',
      'Varkala sea cliffs & beach', 'Kumarakom bird sanctuary visit',
      'Periyar Tiger Reserve entry', 'Snake boat race viewpoint',
    ],
  }
  for (const [type, values] of Object.entries(seeds)) {
    for (const value of values) {
      await pool.query(
        `INSERT INTO package_options (type, value) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [type, value]
      )
    }
  }
}

export async function getAllPackageOptions() {
  const pool = getPool()
  await initPackageOptionsTable()
  const { rows } = await pool.query(
    `SELECT type, value FROM package_options ORDER BY type ASC, created_at ASC`
  )
  return rows
}

export async function addPackageOption(type, value) {
  const pool = getPool()
  await initPackageOptionsTable()
  await pool.query(
    `INSERT INTO package_options (type, value) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [type, value.trim()]
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
