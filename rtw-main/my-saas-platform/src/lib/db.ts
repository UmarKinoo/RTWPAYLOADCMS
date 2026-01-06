/**
 * Server-side database client for raw SQL queries
 * 
 * This module provides direct PostgreSQL access for operations that
 * cannot be performed through Payload CMS (e.g., pgvector similarity search).
 * 
 * IMPORTANT: This is server-only code. Never import this in client components.
 */

import { Pool } from 'pg'

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('db.ts cannot be imported in client-side code')
}

let pool: Pool | null = null

/**
 * Get or create a database connection pool
 * Uses DATABASE_URI from environment variables
 */
function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URI || process.env.DATABASE_URL
    
    if (!connectionString) {
      throw new Error(
        'DATABASE_URI or DATABASE_URL environment variable is required for database operations'
      )
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err)
    })
  }

  return pool
}

/**
 * Execute a SQL query and return results
 * 
 * @param query - SQL query string
 * @param params - Query parameters (for parameterized queries)
 * @returns Query result
 */
export async function query<T = any>(
  queryText: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = getPool()
  const result = await client.query(queryText, params)
  return {
    rows: result.rows,
    rowCount: result.rowCount || 0,
  }
}

/**
 * Close the database connection pool
 * Useful for cleanup in scripts or tests
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

