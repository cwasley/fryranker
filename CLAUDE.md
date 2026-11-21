@AGENTS.md

# Working in this repo

`README.md` covers setup and how the site works. This file covers what's easy to get wrong.

## Data

- Item `id`s, with the category, are the primary key in `items`, and `matchups`/`votes` reference them. Add new ids; never renumber.
- The old `fries` and `sauces` tables are no longer read or written. Don't build on them; they're kept only until the switch to `items` has settled.
- Item `slug`s are public URLs (item, matchup and share pages). Never change a shipped slug. If one must change, add a permanent redirect in `next.config.ts`.
- Adding an item: append it to `lib/data/*.ts`. Every Vercel build runs `scripts/setup-db.ts` first against that environment's database (previews: test, production: production), which inserts its row. Locally, `yarn db:setup` does the same for the test database.
- Production uses `DATABASE_URL`; preview deploys and local dev use `TEST_DATABASE_URL` (the Neon `preview` branch). `lib/database-url.ts` picks by `VERCEL_ENV` and must never fall back to `DATABASE_URL` outside production: the Neon integration sets `DATABASE_URL` for every environment, so a fallback would point testing at the real votes. Never script votes against production.
- Head-to-head records (`matchups`) start in November 2026. Older votes only moved Elo scores, so pages must not present records as all-time.
- Never seed fake votes or matchups. Until a pair has `DIRECT_VOTES` real votes, its split comes from the rankings (`lib/reveal.ts`), and the copy says so ("The rankings back you", "Based on all N votes").

## Branches and releases

- Day-to-day work goes on the `preview` git branch, never `main`. Pull first (`git pull --rebase origin preview`), then commit and push. preview.fryranker.com (test database, kept out of search by `robots.ts`) updates about a minute later. Max and Collin both push to `preview`, so never force-push it.
- Only Collin moves `main`, about once a week, by fast-forwarding it to `preview` (`git push origin preview:main`). Don't squash or rebase that release: `preview` must keep sharing history with `main`, or every later release conflicts.
- `preview` is GitHub's default branch, so Dependabot's security PRs target it. Merge them into `preview` like any other change; nothing merges into `main` directly. Vercel's production branch is still `main`.
- Before a release, rehearse its database changes on fresh data: in the Neon console use "Reset from parent" on the `preview` branch, redeploy `preview`, and read the setup lines at the top of its build log. The production build runs the same setup against the real database.
- The Vercel account is on the Hobby plan, so Max can't be a member or open build logs. A failed build shows as a red check on the commit in GitHub; Collin sends the log.

## Rendering

- Pages use ISR (`export const revalidate`), not Cache Components, so a crawler's first visit to an uncached URL gets full HTML instead of a loading fallback.
- Server Components by default. `'use client'` only on `Ranker`, `ShareButton`, `SiteHeader`, `SuggestSpot`, `FryMap`, `DailyMatchup` and `MyFries`.
- The first matchup is picked after hydration: the ranker's HTML is cached and shared, so it can't contain a random pair.
- No `runtime = 'edge'` (it's deprecated). OG cards and icons read the static Archivo TTFs in `assets/fonts/` from disk. Satori can't use the variable woff2 from `next/font`, and never fetch assets from the site itself: it sits behind the Vercel firewall.

## Design

The "Drive-Thru" system, chosen over three review rounds (mockups in `~/Desktop/fryranker_review/round3/`).

- Archivo via `next/font` with the `wdth` axis. `.cond` (width 62, weight 900, uppercase) is the display style.
- Glyphs (`lib/glyphs.ts`) replace emoji: one drawn shape per fry cut, a dipping cup per sauce filled with its `color`. Their colors are inline so the same SVG works in preview cards.
- Don't say "Elo" in the UI. Scores are "points" and splits are "wins X% of the time". Only `/how-it-works` names the system.
- The pick reveal is the ketchup squiggle plus a crossed-out loser. Picks come in rounds of 10 that end in a receipt.

## Conventions

- Yarn. Prettier owns formatting (`yarn format`).
- Mobile-first CSS: base styles target phones, `min-width` queries widen.
- Colors come from the tokens at the top of `app/globals.css`, each redefined under `prefers-color-scheme: dark`. No theme toggle; the system setting wins.
- Before pushing: `yarn lint`, `yarn typecheck`, `yarn build`. `main` auto-deploys to production.
- Keep `vercel.json`. The Vercel project's Framework Preset isn't Next.js, so this file's `"framework": "nextjs"` is what makes the build work; without it the deploy fails looking for a `public` output directory.
