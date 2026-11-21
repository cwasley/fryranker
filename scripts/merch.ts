import { neon } from '@neondatabase/serverless'
import { databaseUrl } from '../lib/database-url'
import { designs } from '../lib/merch'

/** `yarn merch` (test) / `yarn merch:prod`: "Want this?" counts, most wanted first. */
const production = process.argv.includes('--prod')
let url: string
try {
  url = databaseUrl(production)
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}

async function main() {
  const rows = (await neon(url)`SELECT design, count FROM merch_interest`) as {
    design: string
    count: number
  }[]
  const counts = new Map(rows.map((row) => [row.design, row.count]))
  console.log(`${production ? 'Production' : 'Test'} database: merch interest\n`)
  for (const design of [...designs].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
  )) {
    console.log(
      `${String(counts.get(design.id) ?? 0).padStart(5)}  ${design.name} (${design.product})`
    )
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
