import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon's certificates are signed by a public CA, so full verification works
  ssl: { rejectUnauthorized: true },
})

export default pool
