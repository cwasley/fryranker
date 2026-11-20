import { neon } from '@neondatabase/serverless'
import { databaseUrl } from '../lib/database-url'

/**
 * Review spots visitors suggested.
 *
 *   yarn spots                      list pending suggestions (test database)
 *   yarn spots:prod                 the same against production
 *   yarn spots:prod --added 12 13   mark suggestions as added (after adding them to lib/data/local/)
 *   yarn spots:prod --rejected 14   mark suggestions as rejected
 */
const args = process.argv.slice(2)
const production = args.includes('--prod')
const mark = args.includes('--added') ? 'added' : args.includes('--rejected') ? 'rejected' : null
const ids = args.filter((arg) => /^\d+$/.test(arg)).map(Number)

let url: string
try {
  url = databaseUrl(production)
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
const sql = neon(url)

async function main() {
  if (mark) {
    if (!ids.length) throw new Error(`Give the suggestion ids to mark ${mark}.`)
    const rows = await sql`
      UPDATE spot_suggestions SET status = ${mark} WHERE id = ANY(${ids}::bigint[]) RETURNING id
    `
    console.log(`Marked ${rows.length} as ${mark}.`)
    return
  }

  const rows = (await sql`
    SELECT city, LOWER(name) AS key, MIN(name) AS name, COUNT(*)::int AS count,
           ARRAY_AGG(id ORDER BY id) AS ids,
           ARRAY_AGG(DISTINCT kind) AS kinds,
           MAX(neighborhood) AS neighborhood, MAX(address) AS address, MAX(place_id) AS place_id,
           ARRAY_REMOVE(ARRAY_AGG(note), NULL) AS notes, MAX(created_at) AS latest
    FROM spot_suggestions
    WHERE status = 'pending'
    GROUP BY city, LOWER(name)
    ORDER BY count DESC, latest DESC
  `) as {
    city: string
    name: string
    count: number
    ids: number[]
    kinds: string[]
    neighborhood: string | null
    address: string | null
    place_id: string | null
    notes: string[]
  }[]

  console.log(`${production ? 'Production' : 'Test'} database: ${rows.length} pending spots.\n`)
  for (const row of rows) {
    console.log(`${row.name} (${row.city}) · suggested ${row.count}x · ids ${row.ids.join(' ')}`)
    console.log(
      `  ${[row.neighborhood, row.address].filter(Boolean).join(' · ') || 'No location given'}`
    )
    console.log(
      `  Styles: ${row.kinds.join(', ')}${row.place_id ? ` · Foursquare ${row.place_id}` : ''}`
    )
    for (const note of row.notes.slice(0, 3)) console.log(`  "${note}"`)
    console.log('')
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
