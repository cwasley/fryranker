import { sql } from '@vercel/postgres';

const initialFries = [
  { id: 0, name: "McDonald's", style: "Shoestring", score: 1500, battles: 0 },
  { id: 1, name: "Five Guys", style: "Boardwalk", score: 1500, battles: 0 },
  { id: 2, name: "Chick-fil-A", style: "Waffle", score: 1500, battles: 0 },
  { id: 3, name: "Shake Shack", style: "Crinkle Cut", score: 1500, battles: 0 },
  { id: 4, name: "Popeyes", style: "Cajun Fries", score: 1500, battles: 0 },
  { id: 5, name: "Arby's", style: "Curly", score: 1500, battles: 0 },
  { id: 6, name: "Wendy's", style: "Natural Cut", score: 1500, battles: 0 },
  { id: 7, name: "Wingstop", style: "Seasoned", score: 1500, battles: 0 },
  { id: 8, name: "In-N-Out", style: "Fresh Cut", score: 1500, battles: 0 },
  { id: 9, name: "Burger King", style: "Thick Cut", score: 1500, battles: 0 },
  { id: 10, name: "KFC", style: "Seasoned Wedge", score: 1500, battles: 0 },
  { id: 11, name: "Checkers/Rally's", style: "Famous Seasoned", score: 1500, battles: 0 },
  { id: 12, name: "Steak 'n Shake", style: "Shoestring", score: 1500, battles: 0 },
  { id: 13, name: "Culver's", style: "Crinkle Cut", score: 1500, battles: 0 },
  { id: 14, name: "Taco Bell", style: "Nacho Fries", score: 1500, battles: 0 },
  { id: 15, name: "Jack in the Box", style: "Classic", score: 1500, battles: 0 },
  { id: 16, name: "Del Taco", style: "Crinkle Cut", score: 1500, battles: 0 },
  { id: 17, name: "Sonic", style: "Tots", score: 1500, battles: 0 },
  { id: 18, name: "White Castle", style: "Crinkle Cut", score: 1500, battles: 0 },
];

async function initDb() {
  console.log('Creating fries table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS fries (
      id INTEGER PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      style VARCHAR(100) NOT NULL,
      score INTEGER DEFAULT 1500,
      battles INTEGER DEFAULT 0
    )
  `;

  console.log('Checking if data exists...');
  const { rows } = await sql`SELECT COUNT(*) as count FROM fries`;
  
  if (parseInt(rows[0].count) === 0) {
    console.log('Inserting initial fry data...');
    
    for (const fry of initialFries) {
      await sql`
        INSERT INTO fries (id, name, style, score, battles)
        VALUES (${fry.id}, ${fry.name}, ${fry.style}, ${fry.score}, ${fry.battles})
      `;
    }
    
    console.log('Inserted', initialFries.length, 'fries');
  } else {
    console.log('Data already exists, skipping insert');
  }

  console.log('Database initialization complete!');
}

initDb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error initializing database:', err);
    process.exit(1);
  });

