import { neon } from '@neondatabase/serverless'
import { setupDatabase } from '../lib/schema'

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.')
  process.exit(1)
}

setupDatabase(neon(url)).catch((error) => {
  console.error('Database setup failed:', error)
  process.exit(1)
})
