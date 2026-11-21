import type { NeonQueryFunction } from '@neondatabase/serverless'
import { categoryList, type Category } from './categories'
import { START_SCORE } from './elo'

type Sql = NeonQueryFunction<false, false>

/**
 * Before `items`, each category kept scores in its own table. Those tables are no longer read or
 * written; `setupDatabase` copies them into `items` once and leaves them in place for a rollback.
 */
const LEGACY_KIND_COLUMN: Record<Category['key'], string> = { fries: 'style', sauces: 'restaurant' }

/** Creates any missing tables and adds rows for new items. Safe to run any number of times. */
export async function setupDatabase(sql: Sql, log: (line: string) => void = console.log) {
  await sql.transaction([
    sql`
      CREATE TABLE IF NOT EXISTS items (
        category TEXT NOT NULL,
        id INTEGER NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'chain' CHECK (source IN ('chain', 'local')),
        score INTEGER NOT NULL DEFAULT ${sql.unsafe(String(START_SCORE))},
        battles INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (category, id)
      )
    `,
    // Local spots (`source = 'local'`) belong to a city board; chains leave it null.
    sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS city TEXT`,
    // While a deploy switches from the old per-category tables to `items`, the old code is still
    // live for a minute or two. This trigger copies its score updates across so no vote is lost.
    sql`
      CREATE OR REPLACE FUNCTION mirror_legacy_scores() RETURNS trigger AS $$
      BEGIN
        UPDATE items SET score = NEW.score, battles = NEW.battles
        WHERE category = TG_TABLE_NAME AND id = NEW.id;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
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
    // Points the winner gained (and the loser gave up). Null on votes from before it was recorded.
    sql`ALTER TABLE votes ADD COLUMN IF NOT EXISTS delta INTEGER`,
    // "Want this?" taps on merch designs, one row per design. Anonymous: no visitor data stored.
    sql`
      CREATE TABLE IF NOT EXISTS merch_interest (
        design TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      )
    `,
    // Spots visitors suggest for a city board. Nothing here is public until someone adds the spot
    // to `lib/data/local/` by hand; `yarn spots` lists what's waiting.
    sql`
      CREATE TABLE IF NOT EXISTS spot_suggestions (
        id BIGSERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        name TEXT NOT NULL,
        neighborhood TEXT,
        address TEXT,
        place_id TEXT,
        kind TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'added', 'rejected')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  ])
  log('Tables ready.')

  for (const category of categoryList) {
    // Carry scores over first, so new rows below never shadow a real score with the default.
    const [{ found }] = (await sql`SELECT to_regclass(${category.key}) IS NOT NULL AS found`) as {
      found: boolean
    }[]
    if (found) {
      const table = sql.unsafe(category.key)
      const kind = sql.unsafe(LEGACY_KIND_COLUMN[category.key])
      const [, copied] = await sql.transaction([
        // Holds off votes from the old code for the few milliseconds between the copy and the
        // trigger, so none can land in the gap.
        sql`LOCK TABLE ${table} IN SHARE ROW EXCLUSIVE MODE`,
        sql`
          INSERT INTO items (category, id, name, kind, score, battles)
          SELECT ${category.key}, id, name, ${kind}, score, battles FROM ${table}
          ON CONFLICT (category, id) DO NOTHING
          RETURNING id
        `,
        sql`
          CREATE OR REPLACE TRIGGER mirror_to_items
          AFTER UPDATE OF score, battles ON ${table}
          FOR EACH ROW EXECUTE FUNCTION mirror_legacy_scores()
        `,
      ])
      log(
        `${category.navLabel}: copied ${copied.length} scores from the old ${category.key} table.`
      )
    }

    const added = (await sql.transaction(
      category.items.map(
        (item) => sql`
          INSERT INTO items (category, id, name, kind, source, city)
          VALUES (
            ${category.key}, ${item.id}, ${item.name}, ${item.kind},
            ${item.city ? 'local' : 'chain'}, ${item.city ?? null}
          )
          ON CONFLICT (category, id) DO NOTHING
          RETURNING name
        `
      )
    )) as { name: string }[][]
    for (const [row] of added.filter((rows) => rows.length))
      log(`  Added ${category.one}: ${row.name}`)
    log(`${category.navLabel}: ${category.items.length} items, ${added.flat().length} added.`)
  }
}
