# NHL Geo Games: Name That Team + Hometown Heroes (design)

Date: 2026-11-17 · Owner: burnie08 · Status: draft for approval

## Intent and why
The owner works in the Seattle Kraken front office. They want quick, fun games for the office's daily break, themed on the NHL. Geo Clue (Street View guessing) already works well, with live rooms and challenge links, so both new games are built from it.

Success: a group of coworkers can open a live room on break, play 5 rounds in a few minutes, and laugh at the reveals. Daily puzzles give people a reason to come back.

## Goals
- Two new games, each on **its own page** with **its own card** on the home page:
  1. **Name That Team**: land on a street in an NHL city, pick which of the 32 teams plays there.
  2. **Hometown Heroes**: land in an NHL player's hometown, pin it on the map, then see who the player is.
- Both support the same play types as Geo Clue: Daily, Unlimited (free play), Challenge links, Live rooms.
- Same look, layout pattern (home → game → end summary → home), and top bar as the other games.

## Non-goals
- No changes to how Geo Clue itself plays.
- No team logos or official NHL artwork (repo is public). Team names and cities as text only.
- No build step, no framework (project rule).
- No Russian-hometown players or others where Street View has no coverage.

## Anti-goals (failure even if it "works")
- Rounds that are unfair or confusing, e.g. a New York spot where Rangers vs Islanders vs Devils is a coin flip.
- Hard mode where the arena is visible in the locked view.
- Blowing the free Street View budget: these games must count against the same shared monthly meter and stop at the same limit.
- Wrong hometowns. Coworkers will know Kraken players well; a wrong hometown is embarrassing.

## Constraints
- Google Street View: 5,000 free loads/month shared across ALL games. Every round = 1 load per player and must call the existing shared counter (`/api/usage`). Same cap and fallback rules as Geo Clue (see CLAUDE.md "Cost guardrails").
- Google Maps only loads when a game starts, not on the home screen.
- Finding locations must use Street View *metadata* (free), like Geo Clue's `findLocation`.
- Upstash free plan: 500K commands/month. Live rooms poll like Geo Clue (every 2s).
- Never commit API keys.

## Approaches considered
| Approach | Trade-off | Decision |
|---|---|---|
| A. Add both as "game types" inside `geo-clue.html` | Live rooms, challenges, meter work for free; Geo Clue page gets busier | Not chosen |
| B. Two new standalone pages, each copying what it needs from Geo Clue | Feel like separate games with their own home cards; room/challenge/meter code is duplicated, so later fixes touch 3 pages | **Chosen by owner** |

Owner picked B so each game feels like its own thing on the home page.

## Decided design

### Shared by both pages
- New files: `name-that-team.html`, `hometown-heroes.html`. Two new cards in `index.html`. *(File names: my call.)*
- Each is a self-contained HTML page copied from Geo Clue's structure: same CSS variables, `#home` / game / `#endS` screens, top bar (⌂ Home · Stats · ? · ⚙), settings modal, usage meter, Google key via `/api/config`.
- **localStorage prefixes**: `nt:` for Name That Team, `hh:` for Hometown Heroes. *(My call.)* Google key and Street View limit settings: read Geo Clue's `gc:settings` key/cap so the player doesn't re-enter them; the shared usage counter is already site-wide.
- **Daily**: seeded shuffle (`mulberry32`) keyed by local date, with a seed string unique to each game (e.g. `ntt-YYYY-MM-DD`, `hh-YYYY-MM-DD`). 5 rounds.
- **Live rooms**: reuse `/api/room` (same Redis keys). Small, backward-compatible additions to `api/room.js`:
  - `settings.game`: `'geo' | 'ntt' | 'hh'` (default `'geo'`). A page that opens a room code for a different game redirects to the right page.
  - Each round keeps its fields plus an `ans` string (team code or player id).
  - Each guess can carry a `pick` string (the team a player chose), so the result screen can show everyone's picks.
  - Settings action accepts the hard-mode flag for Name That Team.
  - Geo Clue must keep working unchanged (existing smoke tests must pass).
- **Challenge links**: same idea as Geo Clue's `?c=` v1 format, with a game field and the answer per round, e.g. `{v:1, g:'ntt', h:hard, t:timer, r:[[panoId, heading, ans]×5], s:[…]}`. Exact shape is the builder's call.

### Name That Team
- **Data**: the 32 current NHL teams (including Utah) with city, team name, division, and arena coordinates. *(Arena coordinates verified against a public source at build time.)*
- **Normal round**:
  - Pick a team, then a random point within ~10 miles (16 km) of its arena; find the nearest Street View pano with metadata.
  - **Fairness rule**: keep the pano only if it is closer to this team's arena than to any other team's arena (handles NY Rangers / Islanders / Devils and LA Kings / Anaheim Ducks). Otherwise retry.
  - Player can move and look around (Geo Clue "Moving").
  - Guess: instead of a map pin, a picker of the 32 teams, grouped by division with a type-to-filter box. *(Layout: my call.)*
  - Scoring: correct team = 5,000, wrong = 0.
  - Reveal: correct team, city, the player's pick, and a small map showing where the spot was.
- **Hard mode** (toggle on home screen, in ⚙, and in live room lobby):
  - Spot is right by the arena: any Google-owned outdoor pano within ~300 m of the arena, found with metadata only (no Geocoding/Places API, no key change, no cost). User-uploaded panos are excluded, since those are often inside the arena. *(My call: "on the arena's street" means close by, not an exact street match.)*
  - Start spot varies each time (random pano among those near the arena), so the same arena looks different on repeat.
  - View is locked: no moving, no panning, no zoom (Geo Clue's NMPZ).
  - Camera faces **away** from the arena: heading = compass bearing from the pano to the arena + 180°, plus a random wiggle of about ±40°, so the arena is out of frame.
  - Fixed 25-second timer. Time out = 0 points.
- **Daily**: normal mode. Hard mode is for Unlimited, challenges and live rooms. *(My call.)*
- Normal mode timer options: same as Geo Clue (off, 30s, 60s …).

### Hometown Heroes
- **Data**: hand-built list of players with name, current or last team, hometown name, hometown coordinates, and a `kraken` flag.
  - About half Seattle Kraken players, current and past (club started 2021-22, so roughly 40 players).
  - About half big stars from around the league.
  - **Hometown = the town the player grew up in** (owner's decision), not necessarily the birthplace on stats sites. Use team bios, junior/college bios, or news profiles where they differ; note the source per player.
  - Each hometown checked against a public source at build time. Players whose hometown has no Street View coverage are left out.
  - Owner reviews the list before launch.
- **Round**:
  - Find the nearest Street View pano within ~5 km of the hometown centre (metadata). If none, skip that player.
  - Movement and timer settings same as Geo Clue (Moving / No move / NMPZ; timer options).
  - Guess with a map pin, scored with Geo Clue's distance formula (`scoreFor`). Map starts on a North America + Europe view. *(Scoring scale: builder's call; being in the right region should score well, the right town scores near 5,000.)*
  - Reveal: player name, team, hometown, distance, points. Kraken players get a small badge.
- **Daily** picks 5 players with the seeded shuffle; a mix of Kraken and league players each day. *(Exact mix: builder's call, roughly 2–3 Kraken per day.)*

## Review before launch *(my call)*
- All work happens on a branch, never straight on `main` (pushes to `main` go live in ~1 minute).
- Open a pull request; Vercel builds a preview link for it. The owner plays both games there and reviews the player list and arena list (also shown as a readable table in the PR description).
- Merge to `main` only after the owner approves.

## Left to the builder
- Exact pixel layout of the team picker and reveal panels (match the dark theme).
- How much code is copied vs. lightly adapted from `geo-clue.html`.
- Challenge link exact shape.
- Hometown scoring scale and starting map view.
- Extending the smoke tests in `tests/` to cover both new pages (home → play → end → home, live room round trip) and re-running the Geo Clue tests.
