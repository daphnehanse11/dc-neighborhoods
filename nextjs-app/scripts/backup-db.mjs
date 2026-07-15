import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')

let databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  try {
    const env = readFileSync(join(appDir, '.env.local'), 'utf8')
    databaseUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]
  } catch {
    // fall through to the check below
  }
}
if (!databaseUrl) {
  console.error('DATABASE_URL not set and no .env.local found')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: true } })

const result = await pool.query(`
  SELECT id, session_id, address_text, neighborhood_name, neighborhood_name_normalized,
    submitted_at, ip_hash, is_flagged, flag_reason,
    ST_AsGeoJSON(address_point)::json AS address_point,
    ST_AsGeoJSON(boundary)::json AS boundary
  FROM submissions ORDER BY id`)

const backupDir = join(appDir, '..', 'data', 'backups')
mkdirSync(backupDir, { recursive: true })
const stamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19)
const file = join(backupDir, `submissions-${stamp}.json`)
writeFileSync(file, JSON.stringify({ backedUpAt: new Date().toISOString(), count: result.rows.length, submissions: result.rows }, null, 2))
console.log(`Backed up ${result.rows.length} submissions to ${file}`)
await pool.end()
