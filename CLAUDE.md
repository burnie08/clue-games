# Clue Games: project guide

Personal daily guessing games. Live at **https://clue-games.vercel.app**.
GitHub: `burnie08/clue-games` (branch `main`). **Vercel auto-deploys every push to `main`** (~1 minute).

## About the owner
- Beginner coder: understands concepts and how pieces connect, but not syntax. Explain changes in plain words.
- Prefers short, bullet-point answers.
- If an approach isn't working, suggest a completely different one.

## What's here
| File | What it is |
|---|---|
| `index.html` | Home page with a card per game |
| `reel-clue.html` | **Reel Clue**: Spotle-style movie guessing (10 guesses, 8 clue tiles). Data: TMDB API |
| `tune-clue.html` | **Tune Clue**: Heardle-style song guessing (6 tries, growing clips). Data: iTunes Search API (30s previews) |
| `geo-clue.html` | **Geo Clue**: GeoGuessr-style Street View guessing, with challenge links + live rooms. Data: Google Maps JS API |
| `world-clue.html` | **World Clue**: geography puzzles. Puzzles picked with tabs on its home (`P` = `flag` or `country`, settings in `PUZ`). **Flag**: hidden flag under 6 tiles, 6 guesses, distance + arrow + closeness %. **Country**: 8 guesses, 6 clue tiles (region, people, size, languages, coast, distance). **Shape**: country outline, 6 guesses, distance rows like Flag, continent hint after 3 and first letter after 5; answers skip countries under 1,000 km². **Border Hop**: start + end country with 3–5 countries between them over land; name the ones in between in any order; guess limit = fewest + 4; each guess green (on a shortest route), orange (one step off) or red; win when guesses link start to end. Stats store 1 = perfect, 2 = +1… **Map views** (`hopView` in `wc:hop:view`: `classic` = no map, `blank` = map without country borders (harder), `map` = with borders (easy); old `wc:hop:map` true → `map`): picked on home or above the map in game; draws start/end/guesses on a world map (`data/world.js`), zoomed to start, end and helpful guesses. No-borders adds class `nob`, which paints unlit land one colour; borders come back when the game ends. `game.usedMap` keeps the easiest view used (`map` beats `blank`) and adds "🗺️ map" or "🌍 map, no borders" to the share text. Each has daily + unlimited. Land borders in `BORDERS` (from mledoze/countries; Sri Lanka–India removed). Data: built-in `COUNTRIES` (code, name, rough center) + `FACTS` (population from World Bank 2023, area/region/languages/capital/landlocked from mledoze/countries), baked in so nothing to fetch; flag images from flagcdn.com, no key |
| `data/shapes.js` | Country outlines for World Clue Shape (`window.SHAPES`, SVG paths in a 1000×1000 box), built from Natural Earth 1:50m, far-off islands dropped. Loaded only when a Shape game starts |
| `data/lofi.js` | Geo Clue music: 25 real instrument notes (electric piano, double bass, nylon guitar) as base64 MP3s in `window.LOFI`, from the FluidR3 GM SoundFont (MIT) via gleitz/midi-js-soundfonts. Loaded only when a game starts with music on |
| `data/world.js` | World map for Border Hop map mode (`window.WORLD`: per country `b` = box around main land, `d` = SVG path; `_bg` = territories not in the list). x = (lng+180)×20, y = (90−lat)×20. Natural Earth 1:50m. Loaded only when the map is on |
| `name-that-team.html` | **Name That Team**: Street View in an NHL city, pick which of the 32 teams plays there. Normal + hard mode. Daily / Unlimited / Challenge / Live. Same Google key + cap as Geo Clue |
| `hometown-heroes.html` | **Hometown Heroes**: pin where an NHL player grew up (Kraken players badged). Same modes. Player list for review: `docs/hometown-heroes-players.md` |
| `api/config.js` | Vercel function: returns `GOOGLE_MAPS_KEY` so all three Street View games (Geo Clue, Name That Team, Hometown Heroes) work on every device |
| `api/room.js` | Vercel function: live rooms for all three Street View games (`settings.game` = `geo` / `ntt` / `hh` says which page a room belongs to), stored in Upstash Redis |
| `api/usage.js` | Vercel function: shared monthly Street View counter for all players (Redis key `gc:usage:YYYY-MM`, UTC month) |
| `tests/` | Smoke tests that run the games in a fake browser with fake APIs (see Testing) |

## How it's built
- **No build step, no framework.** Each game is a single self-contained HTML file with its own `<style>` and `<script>` (vanilla JS). Keep it that way unless there's a strong reason.
- All three share the same dark theme CSS variables (`--bg`, `--panel`, `--accent` …) and the same layout pattern:
  - `#home` screen (today's status, play buttons, stats) → game → `#endS` end-of-game summary → back to home.
  - Top bar during play: ⌂ Home · Stats · ? · ⚙.
- Daily puzzles are picked with a **seeded shuffle** (`mulberry32`) keyed by the local date, so everyone gets the same answer each day. Changing a song list, film pool, or seed changes which answer each day gets.
- Saved data lives in the browser's `localStorage` (per device). Key prefixes: `rc:` Reel, `tc:` Tune, `gc:` Geo, `wc:` World (`wc:<puzzle>:g:DATE`, `:stats`, `:unl`, `:ustats`, plus `wc:puz` = last tab), `nt:` Name That Team, `hh:` Hometown Heroes (both read the Google key and cap from `gc:settings`).

## Keys & environment variables (Vercel → clue-games → Settings → Environment Variables)
| Variable | Used by | Notes |
|---|---|---|
| `GOOGLE_MAPS_KEY` | Geo Clue via `/api/config` | Browser key, restricted in Google Cloud to the site's address + Maps JavaScript API only |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | `/api/room` | Free Upstash database (created on upstash.com). `KV_REST_API_URL` / `KV_REST_API_TOKEN` also work |
| (none) | Reel Clue | Each browser pastes its own TMDB key in ⚙ Settings |
| (none) | Tune Clue | iTunes needs no key; called with JSONP so it also works from a local file |

**Never commit API keys.** The repo is public.

## Cost guardrails (keep these)
- Google Street View: 5,000 free loads/month. Each Geo Clue round = 1 load per player. Every load bumps a shared counter (`/api/usage`), shown as a meter on the Geo Clue home screen and in ⚙. The game stops when the shared count reaches the ⚙ limit (default 4,000); if the counter is unreachable it falls back to this browser's own count. Finding locations uses Street View *metadata* (free).
- Google Maps is only loaded when a Geo Clue game starts (not on its home screen).
- Geo Clue skips short isolated roads: `notIsolated()` looks for coverage 5 km away in 12 directions (metadata, free) and needs 2+ hits. If every try fails, it keeps the first spot found.
- Upstash free plan: 500K commands/month. The usage counter adds ~1 command per Street View load and per home/settings view. Live rooms poll every 2s; a 4-player game uses roughly 2,500 commands.

## Geo Clue sound
- `Snd` in `geo-clue.html`: a lo-fi loop (real notes from `data/lofi.js`, drums made in code) plays during a game and stops at home. Six effects made in code: pin drop, guess locked in, answer reveal, great guess (4,000+ pts), way off (under 1,000 or no guess), ticks in the last 5 seconds of a timer.
- Switches: ⚙ Music / Sound effects (`settings.music`, `settings.sfx`), plus the 🔊 mute button in the top bar (`settings.mute`).
- Every sound must fade in and out. Instant starts/stops, and very short sharp noise bursts, made speakers pop in testing.
- Browsers only allow sound after a tap, so the sound wakes up on the first tap or key press.

## Geo Clue multiplayer
- **Challenge links**: `geo-clue.html?c=<base64url JSON>`. Format v1: `{v:1, p:pack, m:move, t:timer, r:[[panoId, heading, region]×5], s:[[name, [pts×5]], …]}`. Locations are re-read from Street View metadata by pano ID.
- **Live rooms**: `geo-clue.html?room=CODE`. `/api/room` actions: `create`, `join`, `get`, `start`, `guess`, `next`, `endround`, `settings`. Host-only: start/next/endround/settings. `join` takes the page's `game`; if the room is for another game it answers `{ok:false, game}` without adding the player, and the page redirects there (no ghost players). Rooms expire after 6h, max 10 players. Each browser *tab* is one player (`sessionStorage` id).
- Redis keys: `gc:room:CODE` (room JSON), `gc:room:CODE:p` (players hash), `gc:room:CODE:g` (guesses hash, field `round:playerId`).

## Name That Team / Hometown Heroes multiplayer
- Same live-room API as Geo Clue. New room fields: `settings.game` (`'geo'|'ntt'|'hh'`), `settings.hard`, `rounds[i].ans` (the right answer), and guess `pick` (the chosen team). A page redirects a room or challenge that belongs to another game.
- Challenge link, Name That Team: `{v:1, g:'ntt', h:0|1, m, t, r:[[pano, heading, ans(team code)]×5], s:[[name,[pts×5]],…]}`
- Challenge link, Hometown Heroes: `{v:1, g:'hh', m, t, r:[[pano, heading, ans(player id)]×5], s}`

## Testing
```
cd tests
npm install           # first time only (installs jsdom)
node smoke-single.js        # home → play → end → home for all three games
node smoke-multiplayer.js   # 2-player live room + challenge link round trip
node smoke-live-timer.js    # live room timer settings + timeouts
node smoke-room-games.js    # room API with game/hard/ans/pick, Geo Clue redirects + hostile challenge links
node smoke-ntt.js           # Name That Team solo
node smoke-ntt-multi.js     # Name That Team challenge + live room
node smoke-hh.js            # Hometown Heroes
```
These print what happened at each step. Read the output and check it makes sense. They fake TMDB/iTunes/Google/Redis, so they test the game logic, not the real services. After changing a game, also run a quick syntax check of its script.

## Local preview
- Reel Clue and Tune Clue: double-click the HTML file.
- Geo Clue and the `/api` functions need the hosted site, or `npx vercel dev` (needs the Vercel CLI and `vercel link`; the Google key must also allow `http://localhost:3000/*`).
