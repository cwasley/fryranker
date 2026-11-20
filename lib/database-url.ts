export function databaseUrl(production = process.env.VERCEL_ENV === 'production') {
  // Never fall back to DATABASE_URL outside production: preview deploys and
  // local dev also have it, and their votes must not reach the real database.
  const name = production ? 'DATABASE_URL' : 'TEST_DATABASE_URL'
  const url = process.env[name]
  if (!url) throw new Error(`${name} is not set. Run \`vercel env pull .env.local\`.`)
  return url
}
