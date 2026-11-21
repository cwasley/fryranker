# FryRanker to-dos

Ranked by RICE score: **Reach × Impact × Confidence ÷ Effort**.

- **Reach**: rough % of monthly visitors it touches (0–100). These are guesses until we look at Vercel Analytics and Search Console, so re-score after two weeks of data.
- **Impact**: 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.
- **Confidence**: how sure we are about reach and impact.
- **Effort**: working sessions (one evening ≈ 1).

| #   | To-do                         | Area       | Reach | Impact | Conf. | Effort | RICE |
| --- | ----------------------------- | ---------- | ----: | -----: | ----: | -----: | ---: |
| 1   | First-visit hint              | Design     |    60 |      1 |   60% |   0.25 |  144 |
| 2   | Real-iPhone preview check     | Sharing    |    40 |      1 |   90% |   0.25 |  144 |
| 3   | Add missing chains            | Content    |    50 |      1 |   70% |    0.5 |   70 |
| 4   | Uptime and vote-spam alerts   | Ops        |   100 |    0.5 |   60% |    0.5 |   60 |
| 5   | Guard the vote endpoint       | Ops        |   100 |      1 |   30% |    0.5 |   60 |
| 6   | Desktop keyboard shortcuts    | Design     |    15 |    0.5 |   80% |    0.1 |   60 |
| 7   | Search copy on the home page  | Growth     |    50 |      1 |   50% |    0.5 |   50 |
| 8   | Daily matchup and streaks     | Engagement |    60 |      2 |   60% |    1.5 |   48 |
| 9   | Share the receipt as an image | Sharing    |    30 |      2 |   60% |      1 |   36 |
| 10  | Rank movement arrows          | Engagement |    50 |      1 |   70% |      1 |   35 |
| 11  | Fry Madness bracket           | Growth     |    70 |      2 |   50% |      2 |   35 |
| 12  | Burgers category              | Content    |    40 |      2 |   60% |    1.5 |   32 |
| 13  | Compare with a friend         | Sharing    |    20 |      3 |   50% |      2 |   15 |
| 14  | Most controversial matchups   | Engagement |    30 |      1 |   50% |      1 |   15 |
| 15  | Two-line strike-through fix   | Design     |     5 |   0.25 |  100% |    0.1 |   13 |
| 16  | "Order it" affiliate links    | Money      |    30 |      1 |   40% |      1 |   12 |
| 17  | Optional sizzle sound         | Design     |    30 |    0.5 |   40% |    0.5 |   12 |
| 18  | Suggest-a-fry form            | Content    |    10 |    0.5 |   80% |    0.5 |    8 |
| 19  | Taste-profile merch           | Money      |     5 |      2 |   30% |      2 |  1.5 |

## Details

1. **First-visit hint.** One dismissible line above the first duel: "Tap the one you'd rather eat. 10 picks a round." New visitors currently have to work out the ticket and the rounds on their own.
2. **Real-iPhone preview check.** Text the home, a fry page, a matchup and a receipt link to ourselves and fix anything iMessage crops. Use `?v=2` on links sent before the redesign, since iMessage caches previews.
3. **Add missing chains.** Whataburger, Bojangles, Freddy's, Zaxby's, Smashburger, Portillo's and Taco John's are in. Still to check and add: A&W and Farmer Boys (USA Today 10Best's #2 in 2026). Each one is a data entry, a slug and `yarn db:setup`, and it brings new pages and search terms with it.
4. **Uptime and vote-spam alerts.** Bot Protection is on Log now. Add an hourly check of the key pages and the preview cards, and an alert when votes per hour spike, along the lines of earnrate's live check.
5. **Guard the vote endpoint.** If spam shows up, add Vercel BotID (invisible, no CAPTCHA) to `/api/vote` alone, rather than challenging the whole site and breaking previews again.
6. **Desktop keyboard shortcuts.** ← and → to pick, space for "Too close to call". The old site had these before the mobile-first pass.
7. **Search copy on the home page.** A short, visible intro ("36,000 votes say McDonald's has the best fast food fries…"), a small FAQ ("Who has the best fast food fries?"), and a refreshed date. The menu board is already in the HTML; this gives search engines a summary to quote.
8. **Daily matchup and streaks.** Built, then parked (Nov 2026): a random chain pair a day crowded the ranker and gave little reason to return without reminders. The code stays (`components/DailyMatchup.tsx`, `lib/daily.ts`, `lib/daily-tallies.ts`) but no page uses it. Bring it back as a curated debate (hand-picked rivalries like In-N-Out vs Five Guys, "best 2 a.m. fry"), with a shareable result image and reminders once there's an email list or accounts.
9. **Share the receipt as an image.** Done on `preview` (Nov 2026): "Share as image" on the receipt shares `/top/<category>/<ids>/story`, a 1080×1920 PNG. Still to check on a real iPhone and Android phone that the share sheet attaches it.
10. **Rank movement arrows.** "▲2 this week" on the menu board, computed from the `votes` log. Needs about two weeks of votes first.
11. **Fry Madness bracket.** A March bracket event with rounds that open each day. It's a seasonal traffic spike, and a natural first thing to sponsor (see Money).
12. **Burgers category.** Most of the system is already generic: add `lib/data/burgers.ts`, a glyph set, a table and a nav tab. Consider moving scores into one `items` table keyed by category first, so new categories don't each need their own table. After burgers: nuggets, chicken sandwiches, shakes.
13. **Compare with a friend.** A link that shows how often two people agree ("You and Max agree 64%"). The highest-impact sharing idea, but it needs a way to carry someone's picks in a link without accounts.
14. **Most controversial matchups.** Pairs whose direct votes sit closest to 50/50. Wait until the head-to-head table has enough votes.
15. **Two-line strike-through fix.** On "Checkers/Rally's" the ketchup line only crosses the first line. Draw one line per line of text.
16. **"Order it" affiliate links.** "Order on DoorDash / Uber Eats" on fry pages. Check which programs accept a small site and pay per order before building it.
17. **Optional sizzle sound.** A short sound on each pick, off by default.
18. **Suggest-a-fry form.** Lets visitors request chains, which also shows us what to add for item 3.
19. **Taste-profile merch.** "Crunch-chaser" and "Hot take" shirts and stickers through print-on-demand. Fun, but only worth it with a real audience.

## Money, beyond the table

- **Sponsorship** (a chain sponsoring Fry Madness or a featured matchup) is likely the best fit for the site. It needs traffic numbers to pitch, so it comes after 7, 8 and 11.
- **Display ads**: not recommended at this size. They'd earn very little and clutter the look we just built.

## Local spots, next steps (not scored yet)

- LA launched on `preview` with 10 hand-checked spots (Nov 2026). Visitors can suggest spots; review weekly with `yarn spots:prod`. Turn on place search by adding `FOURSQUARE_API_KEY` in Vercel (Preview and Production). Then more cities.
- Nearby discovery: first version done on `preview` (Nov 2026). `/me` suggests LA spots that share traits with the visitor's top 5 (`lib/recommend.ts`). Later: "people who pick like you loved" once there are enough votes.
- Re-check the LA list every few months; spots close.
- LA candidates still held (Nov 2026 checks): Louis Burgers III (Long Beach; only a May 2026 Yelp snippet shows it open, fry details from 2014) and Dirt Dog (Gardena; no 2026 source for that branch, call first). Dropped after checking: Happies Hand Made (closed 2025), Love Hour (seasoned fries off the menu), Humble Potato (signature fries unconfirmed), The Ordinarie (menu keeps changing), The Win~Dow (fries not a draw).
- Gaps with nothing that cleared the bar yet: San Gabriel Valley (Alhambra, San Gabriel, Monterey Park) and Inglewood.

## Housekeeping (not scored)

- Once the `items` switch has been live for a week with no rollback: `DROP TRIGGER mirror_to_items ON fries; DROP TRIGGER mirror_to_items ON sauces; DROP FUNCTION mirror_legacy_scores(); DROP TABLE fries, sauces;` and remove the copy step and `LEGACY_KIND_COLUMN` from `lib/schema.ts`.
- Unit tests for `lib/reveal.ts`, `lib/share.ts` and the Elo math, plus a Playwright smoke test of a full round with the vote API stubbed out.
