import { sql } from '@vercel/postgres'

// Load env vars locally (Vercel loads them automatically in production)
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = require('dotenv')
    dotenv.config({ path: '.env.local' })
  } catch (e) {
    // dotenv not available, that's ok in production
  }
}

const initialSauces = [
  { id: 0, name: 'Chick-fil-A Sauce', restaurant: 'Chick-fil-A', score: 1500, battles: 0 },
  { id: 1, name: "Cane's Sauce", restaurant: "Raising Cane's", score: 1500, battles: 0 },
  { id: 2, name: 'Polynesian', restaurant: 'Chick-fil-A', score: 1500, battles: 0 },
  { id: 3, name: 'Honey Mustard', restaurant: "McDonald's", score: 1500, battles: 0 },
  { id: 4, name: 'Sweet & Sour', restaurant: "McDonald's", score: 1500, battles: 0 },
  { id: 5, name: 'Ranch', restaurant: 'Multiple', score: 1500, battles: 0 },
  { id: 6, name: 'BBQ', restaurant: "McDonald's", score: 1500, battles: 0 },
  { id: 7, name: 'Sriracha Mayo', restaurant: 'Multiple', score: 1500, battles: 0 },
  { id: 8, name: 'Buffalo', restaurant: 'Multiple', score: 1500, battles: 0 },
  { id: 9, name: 'Ketchup', restaurant: 'Heinz', score: 1500, battles: 0 },
  { id: 10, name: 'Zax Sauce', restaurant: "Zaxby's", score: 1500, battles: 0 },
  { id: 11, name: 'Signature Sauce', restaurant: 'Shake Shack', score: 1500, battles: 0 },
  { id: 12, name: 'Fire Sauce', restaurant: 'Taco Bell', score: 1500, battles: 0 },
  { id: 13, name: 'Diablo Sauce', restaurant: 'Taco Bell', score: 1500, battles: 0 },
  { id: 14, name: 'Honey Roasted BBQ', restaurant: "McDonald's", score: 1500, battles: 0 },
  { id: 15, name: 'Chili Sauce', restaurant: 'Multiple', score: 1500, battles: 0 },
]

async function initSaucesDb() {
  console.log('Creating sauces table...')

  await sql`
    CREATE TABLE IF NOT EXISTS sauces (
      id INTEGER PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      restaurant VARCHAR(100) NOT NULL,
      score INTEGER DEFAULT 1500,
      battles INTEGER DEFAULT 0
    )
  `

  console.log('Checking existing sauces...')
  const { rows: existingRows } = await sql`SELECT id FROM sauces`
  const existingIds = new Set(existingRows.map((r) => r.id))

  const newSauces = initialSauces.filter((s) => !existingIds.has(s.id))

  if (newSauces.length > 0) {
    console.log(`Adding ${newSauces.length} new sauces...`)

    for (const sauce of newSauces) {
      await sql`
        INSERT INTO sauces (id, name, restaurant, score, battles)
        VALUES (${sauce.id}, ${sauce.name}, ${sauce.restaurant}, ${sauce.score}, ${sauce.battles})
      `
      console.log(`  Added: ${sauce.name}`)
    }
  } else {
    console.log('All sauces already exist in database')
  }

  console.log('Database initialization complete!')

  // Show current count
  const { rows } = await sql`SELECT COUNT(*) as count FROM sauces`
  console.log(`Total sauces in database: ${rows[0].count}`)
}

initSaucesDb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
