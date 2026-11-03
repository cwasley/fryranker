@AGENTS.md

# Working in this repo

`README.md` covers setup and how the site works. This file covers what's easy to get wrong.

## Data

- Item `id`s are primary keys in `fries`/`sauces`, and `matchups`/`votes` reference them. Add new ids; never renumber.
- Item `slug`s are public URLs (item, matchup and share pages). Never change a shipped slug. If one must change, add a permanent redirect in `next.config.ts`.
- Adding an item: append it to `lib/data/*.ts`, then run `yarn db:setup` to insert its row.
- There is one database. Local dev, preview deploys and production all share it, so a vote cast while testing counts. Don't script votes against it. To test vote SQL, run `voteStatements()` inside a transaction against temp tables (pg_temp shadows the real tables).
- Head-to-head records (`matchups`) start in November 2026. Older votes only moved Elo scores, so pages must not present records as all-time.

## Rendering

- Pages use ISR (`export const revalidate`), not Cache Components, so a crawler's first visit to an uncached URL gets full HTML instead of a loading fallback.
- Server Components by default. `'use client'` only on `Ranker`, `TasteDialog`, `ShareButton` and `CategoryNav`.
- The first matchup is picked after hydration: the ranker's HTML is cached and shared, so it can't contain a random pair.
- No `runtime = 'edge'` (it's deprecated). OG cards read `assets/Heavitas.ttf` from disk. Never fetch assets from the site itself: the site sits behind the Vercel firewall.

## Conventions

- Yarn. Prettier owns formatting (`yarn format`).
- Mobile-first CSS: base styles target phones, `min-width` queries widen.
- Colors come from the tokens at the top of `app/globals.css`, each redefined under `prefers-color-scheme: dark`. No theme toggle; the system setting wins.
- Before pushing: `yarn lint`, `yarn typecheck`, `yarn build`. `main` auto-deploys to production.
