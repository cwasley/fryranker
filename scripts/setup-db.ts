import { neon } from '@neondatabase/serverless'
import { categoryList } from '../lib/categories'
import { databaseUrl } from '../lib/database-url'
import { START_SCORE } from '../lib/elo'

const production = process.argv.includes('--prod')
let url: string
try {
  url = databaseUrl(production)
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
console.log(`Setting up the ${production ? 'production' : 'test'} database.`)
const sql = neon(url)

async function setup() {
  await sql.transaction([
    sql`
      CREATE TABLE IF NOT EXISTS fries (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        style VARCHAR(100) NOT NULL,
        score INTEGER DEFAULT 1500,
        battles INTEGER DEFAULT 0
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS sauces (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        restaurant VARCHAR(100) NOT NULL,
        score INTEGER DEFAULT 1500,
        battles INTEGER DEFAULT 0
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS vote_events (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        scope TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    sql`CREATE INDEX IF NOT EXISTS vote_events_key_created_at_idx ON vote_events (key, created_at DESC)`,
    sql`
      CREATE TABLE IF NOT EXISTS matchups (
        category TEXT NOT NULL,
        a INTEGER NOT NULL,
        b INTEGER NOT NULL,
        a_wins INTEGER NOT NULL DEFAULT 0,
        b_wins INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (category, a, b),
        CHECK (a < b)
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS votes (
        id BIGSERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        winner INTEGER NOT NULL,
        loser INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    sql`CREATE INDEX IF NOT EXISTS votes_category_created_at_idx ON votes (category, created_at DESC)`,
  ])
  console.log('Tables ready.')

  for (const category of categoryList) {
    const table = sql.unsafe(category.table)
    const kindColumn = sql.unsafe(category.key === 'fries' ? 'style' : 'restaurant')
    const existing = (await sql`SELECT id FROM ${table}`) as { id: number }[]
    const have = new Set(existing.map((row) => row.id))
    const missing = category.items.filter((item) => !have.has(item.id))
    for (const item of missing) {
      await sql`
        INSERT INTO ${table} (id, name, ${kindColumn}, score, battles)
        VALUES (${item.id}, ${item.name}, ${item.kind}, ${START_SCORE}, 0)
      `
      console.log(`  Added ${category.one}: ${item.name}`)
    }
    console.log(`${category.navLabel}: ${category.items.length} items, ${missing.length} added.`)
  }
}

setup().catch((error) => {
  console.error('Database setup failed:', error)
  process.exit(1)
})
