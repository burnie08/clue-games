# NHL Geo Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new Street View games, Name That Team and Hometown Heroes, each on its own page, with Daily, Unlimited, Challenge links and Live rooms.

**Architecture:** Each game is a self-contained HTML page copied from `geo-clue.html` and adapted. Live rooms reuse `/api/room` with a new `game` setting, an `ans` field per round, and a `pick` field per guess. All Street View loads go through the existing shared `/api/usage` counter.

**Tech Stack:** Vanilla JS in single HTML files, Google Maps JS API (Street View), Vercel functions, Upstash Redis, jsdom smoke tests.

**Spec:** `docs/superpowers/specs/2026-11-17-nhl-geo-games-design.md` (read it before any task).

## Global Constraints
- No build step, no framework. Each page has its own `<style>` and one `<script>`.
- Never commit API keys. No team logos or NHL artwork: team names and cities as text only.
- Every Street View round calls `bump('panos')` (shared counter) and is blocked by `overCap()`, exactly like Geo Clue. Location finding uses `getPanorama` metadata only. Only Google-owned panos (`sources: [StreetViewSource.GOOGLE]`).
- Google Maps loads only when a game starts, never on the home screen.
- localStorage prefixes: `nt:` (Name That Team), `hh:` (Hometown Heroes). Google key and cap are read from `gc:settings` (shared with Geo Clue); per-game settings saved under `nt:settings` / `hh:settings`.
- Daily seeds: `mulberry32(hash('ntt-' + dateKey))` and `mulberry32(hash('hh-' + dateKey))`. 5 rounds.
- Geo Clue must keep working: `node smoke-single.js`, `node smoke-multiplayer.js`, `node smoke-live-timer.js` must still print the same flow after every task.
- Work on branch `claude/geo-clue-nhl-variations-808a14`. Never push to `main`. Merge only after the owner approves the Vercel preview.

## Review Focus
1. **Shared-city spots** (NY, LA/Anaheim): a spot is accepted for team T only if T's arena is the nearest arena. Pinned in Task 2 test `ntt fairness`.
2. **Hard mode shows the arena**: heading must face away (bearing + 180° ± 40°). Pinned in Task 3 test `ntt hard heading`.
3. **Monthly cap reached**: rounds on new pages must stop like Geo Clue. Pinned in Task 2 and Task 6 tests `cap blocks round`.
4. **Wrong-page room code**: a Geo Clue code opened on a new page (or the reverse) redirects; old rooms with no `game` field act as `'geo'`. Pinned in Task 1 and Task 4 tests.
5. **Hometown with no coverage**: player skipped, daily still has 5 rounds and is the same for everyone. Pinned in Task 6 test `hh skip no coverage`.

## Testing helper (used by every new test file)
New smoke tests copy the fake-browser setup from `tests/smoke-multiplayer.js`, add `function check(label, ok){ console.log((ok?'PASS ':'FAIL ')+label); if(!ok) process.exitCode=1; }`, and print each step. "Expected" below means: every line prints `PASS`, exit code 0.

---

### Task 1: Room API game support

**Files:**
- Modify: `api/room.js` (create ~46-55, guess ~83-91, settings ~103-108)
- Modify: `geo-clue.html` (`enterRoom` / `joinRoom`: redirect when `room.settings.game` is set and not `'geo'`)
- Create: `tests/smoke-room-games.js`
- Also commit: the spec and this plan.

**Interfaces:**
- Produces (room JSON): `settings.game: 'geo'|'ntt'|'hh'` (default `'geo'`, any other value → `'geo'`), `settings.hard: boolean` (default false), `rounds[i].ans: string` (≤40 chars, default `''`), guess record `pick: string|null` (≤40 chars).
- Produces (page constant): `GAME_PAGES = { geo: 'geo-clue.html', ntt: 'name-that-team.html', hh: 'hometown-heroes.html' }`; a page that loads a room whose game ≠ its own does `location.replace(GAME_PAGES[game] + '?room=' + code)`.

- [ ] **Step 1: Write failing tests** in `tests/smoke-room-games.js` calling the handler directly:
  - `room create keeps game+ans`: create with `settings:{game:'ntt',hard:true}` and rounds with `ans:'SEA'` → `get` returns `settings.game==='ntt'`, `settings.hard===true`, `rounds[0].ans==='SEA'`.
  - `old room defaults to geo`: create with no `game` → `settings.game==='geo'`, `hard===false`, `ans===''`.
  - `bad game falls back`: `game:'xyz'` → `'geo'`.
  - `guess keeps pick`: guess with `pick:'VAN'` → guesses hash value has `pick==='VAN'`.
  - `settings action toggles hard`: host sends `settings:{hard:false}` → `hard===false`.
  - `geo page redirects ntt room`: load `geo-clue.html?room=CODE` in jsdom for an `ntt` room → `location.replace` called with `name-that-team.html?room=CODE` (stub `location.replace` to record).
- [ ] **Step 2: Run** `cd tests && node smoke-room-games.js` → FAIL lines.
- [ ] **Step 3: Implement** the fields in `api/room.js` using its existing `clean()` helper; add the redirect in `geo-clue.html`.
- [ ] **Step 4: Run** `node smoke-room-games.js` (all PASS), then the three Geo Clue smoke tests (same flow as before).
- [ ] **Step 5: Commit** `git add api/room.js geo-clue.html tests/smoke-room-games.js docs/superpowers && git commit -m "Rooms: game type, answer and pick fields"`

### Task 2: Name That Team page, normal mode (Daily + Unlimited)

**Files:**
- Create: `name-that-team.html` (copied from `geo-clue.html`, then trimmed/adapted)
- Create: `tests/smoke-ntt.js`

**Interfaces:**
- Produces: `const TEAMS = [{ code:'SEA', city:'Seattle', name:'Kraken', div:'Pacific', arena:'Climate Pledge Arena', lat, lng }, …]` — 32 teams, divisions Atlantic (BOS BUF DET FLA MTL OTT TBL TOR), Metropolitan (CAR CBJ NJD NYI NYR PHI PIT WSH), Central (CHI COL DAL MIN NSH STL UTA WPG), Pacific (ANA CGY EDM LAK SJS SEA VAN VGK). Arena coordinates verified with a web search per arena; put the source list in the commit message body.
- Produces: `nearestTeam({lat,lng}) -> code`; `findTeamSpot(rng, team, hard) -> Promise<round>` where round = `{ pano, lat, lng, heading, ans: team.code, pick: null, pts: null }`; `scoreTeam(round) -> 5000|0`.
- Produces DOM ids reused later: `#teamPicker` (division groups of buttons with `data-team="CODE"`), `#teamFilter` (text box), `#guessBtn`, `#resPanel`, `#nextBtn`.

- [ ] **Step 1: Write failing tests** in `tests/smoke-ntt.js` (fake Street View returns a pano exactly at the requested point):
  - `daily same for two browsers`: two browsers start Daily the same date → identical `ans` list, 5 distinct teams.
  - `ntt fairness`: call `findTeamSpot` for `NJD` with an rng whose first point lands nearer Madison Square Garden than Prudential Center → that point is rejected; returned round satisfies `nearestTeam(round)==='NJD'`.
  - `spot within 10 miles`: 50 calls for random teams → every `distKm(round, arena) <= 16.1`.
  - `pick scores`: choose correct team → 5000 and result panel contains team city + name; wrong → 0 and panel shows the right team and the pick.
  - `filter box`: typing `kra` leaves only the Kraken button visible.
  - `cap blocks round`: set shared usage ≥ cap → message shown, no pano created, `bump` not called.
  - `home → play → end → home`: full 5-round Unlimited game reaches `#endS` and back to `#home`.
- [ ] **Step 2: Run** `node smoke-ntt.js` → FAIL.
- [ ] **Step 3: Implement.** Copy `geo-clue.html`; drop the map-pack picker; replace map-pin guessing with `#teamPicker` (the round's small map is only for the reveal). Normal spot: random point in a 16 km disk around the arena (`r = 16 * sqrt(rng())`, random bearing), `getPanorama({location, radius: 2000, preference:'nearest', sources:[GOOGLE]})`, keep if `nearestTeam === team.code`, up to 30 tries. Daily uses normal mode. Movement + timer settings same as Geo Clue. Title "Name That Team", keys `nt:`.
- [ ] **Step 4: Run** `node smoke-ntt.js` → all PASS; syntax check with `node --check` on the extracted script.
- [ ] **Step 5: Commit** `git commit -m "Name That Team: normal mode"`

### Task 3: Name That Team hard mode

**Files:** Modify `name-that-team.html`; extend `tests/smoke-ntt.js`.

**Interfaces:**
- Consumes: `findTeamSpot(rng, team, hard)`.
- Produces: `bearing(from, to) -> degrees 0-360`; `game.hard: boolean`; setting `nt:settings.hard`.

- [ ] **Step 1: Write failing tests:**
  - `ntt hard heading`: for 20 hard spots, `angleDiff(round.heading, bearing(round, arena))` is between 140° and 180°.
  - `hard spot near arena`: every hard round `distKm(round, arena) <= 0.3`; spots retried if farther.
  - `hard varies`: 10 hard spots for SEA give at least 5 distinct panos or headings.
  - `hard locks view`: hard round uses NMPZ options (`#block` on, no links/clickToGo) and timer shows `⏱ 25s`; timing out scores 0.
  - `daily ignores hard`: with `hard` setting on, Daily rounds are normal mode.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Hard spot: random point within 250 m of arena, `getPanorama` radius 150, nearest, Google only; accept if ≤ 0.3 km. `heading = (bearing(pano, arena) + 180 + (rng()*80 - 40) + 360) % 360`. Hard forces move `'nmpz'` and timer 25, and hides those two settings while on. Hard toggle on the home screen and in ⚙.
- [ ] **Step 4: Run** → all PASS.
- [ ] **Step 5: Commit** `git commit -m "Name That Team: hard mode"`

### Task 4: Name That Team challenges and live rooms

**Files:** Modify `name-that-team.html`; create `tests/smoke-ntt-multi.js`.

**Interfaces:**
- Consumes: Task 1 room fields, `GAME_PAGES`.
- Produces: challenge link `name-that-team.html?c=<b64url>` with `{v:1, g:'ntt', h:0|1, m:move, t:timer, r:[[pano, heading, ans]×5], s:[[name,[pts×5]],…]}`.

- [ ] **Step 1: Write failing tests:**
  - `challenge round trip`: player A finishes Unlimited, shares link; B opens it → same panos/answers, B's result board shows A's score.
  - `hard challenge stays hard`: link made in hard mode → B's game has `hard===true`, 25s timer.
  - `live 2 players`: host creates room (settings `game:'ntt'`), guest joins, both pick, result shows both picks and points per round, final standings correct.
  - `lobby hard toggle`: host turns hard on in lobby → guest sees hard label; rounds created at start are hard spots.
  - `geo code redirects`: opening a `'geo'` room code on this page → redirect to `geo-clue.html?room=CODE`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** by adapting Geo Clue's challenge and live code; send `pick` with guesses, show picks on the live result.
- [ ] **Step 4: Run** this test plus `smoke-ntt.js` and the Geo Clue tests → PASS / same flow.
- [ ] **Step 5: Commit** `git commit -m "Name That Team: challenges and live rooms"`

### Task 5: Hometown Heroes player list

**Files:** Create `docs/hometown-heroes-players.md` (review table: name, team, Kraken?, hometown, lat/lng, source link).

**Interfaces:**
- Produces: the data that Task 6 pastes in as `const PLAYERS = [{ id:'mccann', name:'Jared McCann', team:'Seattle Kraken', town:'Stratford, ON', lat, lng, kraken:true }, …]`. `id` = lowercase surname, plus first initial on clashes.

- [ ] **Step 1:** List every Seattle Kraken player with ≥20 games for the club, 2021-22 to today (about 40), from a public stats site via web search.
- [ ] **Step 2:** Add about 40 star players from other teams (mix of countries; at least 1 per other team where possible).
- [ ] **Step 3:** For each player, find the town they **grew up in** (team bio, junior/college bio, or news profile), not just the birthplace. Record the source link. If unsure, mark `??` and leave it out of `PLAYERS`.
- [ ] **Step 4:** Drop players whose hometown is in a country with little Street View (Russia, Belarus, Kazakhstan, etc.).
- [ ] **Step 5: Commit** `git commit -m "Hometown Heroes: player list for review"`

### Task 6: Hometown Heroes page

**Files:** Create `hometown-heroes.html` (copied from `geo-clue.html`); create `tests/smoke-hh.js`.

**Interfaces:**
- Consumes: Task 5 list, Task 1 room fields, `GAME_PAGES`.
- Produces: `findHometownSpot(player) -> Promise<round|null>` (round = `{pano, lat, lng, heading, ans: player.id, pts:null}`); `pickDaily(dateKey) -> 5 player ids` (2–3 with `kraken:true`); `HH_SIZE = 3000` for `scoreFor(km, HH_SIZE)`; map start `{lat:50, lng:-40}`, zoom 2.

- [ ] **Step 1: Write failing tests:**
  - `daily same and mixed`: two browsers same date → identical 5 ids; 2 or 3 are Kraken.
  - `hh skip no coverage`: fake Street View returns nothing for one player's town → that player skipped, still 5 rounds, both browsers still match.
  - `reveal`: after guessing, panel shows player name, team, hometown, distance, points; Kraken player shows the badge.
  - `cap blocks round`: same as Task 2.
  - `challenge + live`: challenge link round trip and 2-player live room work (copy the Geo Clue multiplayer flow, with `game:'hh'`).
  - `home → play → end → home` for Unlimited.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Spot: `getPanorama({location: town, radius: 5000, preference:'nearest', sources:[GOOGLE]})`, random heading. Daily walks the seeded-shuffled list until 5 spots are found. Movement + timer settings same as Geo Clue. Keys `hh:`.
- [ ] **Step 4: Run** `node smoke-hh.js` → PASS; plus all earlier tests.
- [ ] **Step 5: Commit** `git commit -m "Hometown Heroes page"`

### Task 7: Home cards, docs, PR

**Files:** Modify `index.html` (two new cards), `CLAUDE.md` (file table, key prefixes, new tests).

- [ ] **Step 1:** Add cards: 🏒 "Name That Team" ("Dropped in an NHL city. Which team plays there?") and 🏠 "Hometown Heroes" ("Find where an NHL player grew up."), same markup as the existing cards.
- [ ] **Step 2:** Update `CLAUDE.md` tables and the Testing section.
- [ ] **Step 3: Run every test** in `tests/` → all PASS / same Geo Clue flow.
- [ ] **Step 4: Commit and push the branch**, open a PR to `main` with the arena table and the player table from `docs/hometown-heroes-players.md` in the description and the Vercel preview link. Do not merge: the owner plays both games on the preview and approves first.
