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
      id         SERIAL PRIMARY KEY,
      name       TEXT UNIQUE NOT NULL,
      color      TEXT NOT NULL DEFAULT '#e8520a',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM destinations')
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO destinations (name, color) VALUES
        ('Goa', '#2e9e7a'), ('Gokarna', '#e8520a'), ('Chikmagalur', '#2e3da8')
      ON CONFLICT DO NOTHING
    `)
  }
}

export async function getDestinations() {
  const pool = getPool()
  await initDestinationsTable()
  const { rows } = await pool.query('SELECT * FROM destinations ORDER BY created_at ASC')
  return rows
}

export async function createDestination(name, color) {
  const pool = getPool()
  await initDestinationsTable()
  const { rows } = await pool.query(
    'INSERT INTO destinations (name, color) VALUES ($1, $2) RETURNING *',
    [name, color]
  )
  return rows[0]
}

export async function deleteDestination(id) {
  const pool = getPool()
  await pool.query('DELETE FROM destinations WHERE id = $1', [id])
}
