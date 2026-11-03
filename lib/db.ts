import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let client: NeonQueryFunction<false, false> | undefined

export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) throw new Error('DATABASE_URL is not set. Run `vercel env pull .env.local`.')
    client = neon(url)
  }
  return client
}
