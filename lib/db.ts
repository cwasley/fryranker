import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { databaseUrl } from './database-url'

let client: NeonQueryFunction<false, false> | undefined

export function db() {
  if (!client) client = neon(databaseUrl())
  return client
}
