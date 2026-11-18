# Geo Clue: shared Street View runway meter

## Why
Everyone plays on the owner's one Google key. Google gives 5,000 free Street View loads per month.
Today each browser only counts its own loads, so nobody can see how much of the shared free amount is left.

## Goals
- A meter showing loads used by **all players** this month, out of 5,000, and how many are left.
- Shown on the Geo Clue home screen and in ⚙ Settings.
- A plain "runway" line: at this month's pace, roughly how many days until the free amount runs out (or "lasts the month").

## Non-goals / anti-goals
- Not reading Google's real billing numbers (needs Google Cloud service-account setup; too heavy).
- Must not add noticeable cost: about 1 database command per Street View load plus 1 per home/settings view.
- Must not break the game if the database is down; fall back to this device's count, labelled as such.

## Approaches considered
1. **Shared counter in the existing Upstash database (picked).** Each Street View load adds 1 to a monthly counter. True across all players, cheap, uses what's already set up.
2. Per-device count only, shown as a bar. Quick but ignores other players. Rejected by owner.
3. Read usage from Google Cloud Monitoring. Exact, but needs a service account secret and much more setup.

## Design
- New Vercel function `api/usage.js`:
  - `GET` → `{ month: "YYYY-MM", panos: N, free: 5000 }`.
  - `POST {action:"bump"}` → `INCR gc:usage:YYYY-MM` (expires after ~40 days), returns the new count.
  - Month is UTC (Google resets on Pacific time; a few hours' difference is fine).
- `geo-clue.html`:
  - When a Street View loads, keep the local count and also send a bump (fire and forget).
  - Home screen: replace the text usage line with a bar + "1,240 of 5,000 used · 3,760 left · resets Dec 1" + runway line.
    Bar colour: green, yellow from 60%, red from 80%.
  - ⚙ Settings: same meter above the limit setting, with the device count kept as a small line under it.
  - The stop-limit (`cap`, default 4,000) checks the **shared** count when it is known, otherwise the device count.
- Tests: fake the new endpoint in the smoke tests and check the meter renders and the bump is sent.

## Left to the builder
- Exact wording and layout details, matching existing styles.
