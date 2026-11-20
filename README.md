# FryRanker

The definitive fast food fry (and sauce) rankings, decided one head-to-head vote at a time. Live at [fryranker.com](https://fryranker.com).

## Stack

- Next.js 16 App Router, React 19, TypeScript, plain CSS (`app/globals.css`)
- Neon Postgres through `@neondatabase/serverless`
- Vercel hosting, Web Analytics and Speed Insights (both cookieless)

## Getting started

```bash
yarn
vercel env pull .env.local   # DATABASE_URL and friends
yarn dev
```

`.env.local` points at the production database: there is only one. Votes cast from `yarn dev` count.

## Scripts

| Command          | What it does                                                       |
| ---------------- | ------------------------------------------------------------------ |
| `yarn dev`       | Dev server                                                         |
| `yarn build`     | Production build (reads standings from the database)               |
| `yarn lint`      | ESLint                                                             |
| `yarn typecheck` | Route types plus `tsc`                                             |
| `yarn format`    | Prettier                                                           |
| `yarn db:setup`  | Creates any missing tables and adds rows for new items. Idempotent |

`lib/schema.ts` holds the schema. Before `items`, scores lived in separate `fries` and `sauces` tables. `yarn db:setup` copies them into `items` once and adds a trigger that mirrors the old code's updates during the deploy that switches over. The old tables stay until that deploy has settled (see Housekeeping in `TODOS.md`).

## How it works

- **Items** live in `lib/data/fries.ts` and `lib/data/sauces.ts`. `lib/categories.ts` describes each category (table, URLs, copy, taste-profile thresholds).
- **Scores** live in one `items` table keyed by `(category, id)`, with a `source` column (`chain` or `local`) ready for local spots. New categories don't need a table of their own.
- **Votes** go to `POST /api/vote` (fries) or `POST /api/sauces/vote`. One transaction logs the vote, updates both Elo scores in `items`, and bumps the pair's head-to-head record in `matchups`. Each visitor (IP plus browser) is limited to 30 votes a minute, and each IP address to 120 (`RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_IP_PER_MINUTE`).
- **Pages** are statically rendered and refreshed in the background (ISR):
  - `/` and `/sauces`: the ranker and global standings
  - `/fries/<slug>`, `/sauces/<slug>`: one page per item with its rank and head-to-head odds
  - `/fries/<a>/vs/<b>`: matchup pages, rendered on first visit. They stay `noindex` until a pair has 10 direct votes
  - `/top/<category>/<ids>`: the share link for someone's personal top 5 (`noindex`)
  - `/how-it-works`: how points and percentages are worked out
- **Rounds**: picks come 10 at a time. Each pick shows how the crowd sees that matchup (`lib/reveal.ts`: the pair's own split once it has 10 direct votes, the rankings' prediction before that), and each round ends in a receipt with the visitor's top 5 and a share link.
- **Taste profiles** stay in the visitor's `localStorage` and never reach the server.
- **Link previews** are generated per page (`opengraph-image.tsx`) from `lib/og.tsx`.
- **SEO**: `sitemap.ts` and `robots.ts` build from the data. Every page sets a canonical URL on `fryranker.com`, and the pages carry JSON-LD (WebSite, ItemList, BreadcrumbList).
- **Design**: the "Drive-Thru" system in `app/globals.css`, with drawn glyphs from `lib/glyphs.ts` instead of emoji. Follows the system light or dark setting. Archivo is OFL-licensed; the static TTFs the preview cards need are in `assets/fonts/` with the license.
