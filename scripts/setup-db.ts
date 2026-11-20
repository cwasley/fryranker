import { neon } from '@neondatabase/serverless'
import { databaseUrl } from '../lib/database-url'
import { setupDatabase } from '../lib/schema'

// Lets a local `yarn build` find .env.local. Vercel builds have no such file and use their own
// variables.
try {
  process.loadEnvFile('.env.local')
} catch {
  // No .env.local.
}

// `--prod` targets production from a laptop. Otherwise the database follows VERCEL_ENV, the same
// way the app picks it: production builds set up production; previews and local runs, the test
// database.
const production = process.argv.includes('--prod') || process.env.VERCEL_ENV === 'production'
let url: string
try {
  url = databaseUrl(production)
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
console.log(`Setting up the ${production ? 'production' : 'test'} database.`)

setupDatabase(neon(url)).catch((error) => {
  console.error('Database setup failed:', error)
  process.exit(1)
})
