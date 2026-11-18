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
| `api/config.js` | Vercel function: returns `GOOGLE_MAPS_KEY` so Geo Clue works on every device |
| `api/room.js` | Vercel function: Geo Clue live rooms, stored in Upstash Redis |
| `tests/` | Smoke tests that run the games in a fake browser with fake APIs (see Testing) |

## How it's built
- **No build step, no framework.** Each game is a single self-contained HTML file with its own `<style>` and `<script>` (vanilla JS). Keep it that way unless there's a strong reason.
- All three share the same dark theme CSS variables (`--bg`, `--panel`, `--accent` …) and the same layout pattern:
  - `#home` screen (today's status, play buttons, stats) → game → `#endS` end-of-game summary → back to home.
  - Top bar during play: ⌂ Home · Stats · ? · ⚙.
- Daily puzzles are picked with a **seeded shuffle** (`mulberry32`) keyed by the local date, so everyone gets the same answer each day. Changing a song list, film pool, or seed changes which answer each day gets.
- Saved data lives in the browser's `localStorage` (per device). Key prefixes: `rc:` Reel, `tc:` Tune, `gc:` Geo.

## Keys & environment variables (Vercel → clue-games → Settings → Environment Variables)
| Variable | Used by | Notes |
|---|---|---|
| `GOOGLE_MAPS_KEY` | Geo Clue via `/api/config` | Browser key, restricted in Google Cloud to the site's address + Maps JavaScript API only |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | `/api/room` | Free Upstash database (created on upstash.com). `KV_REST_API_URL` / `KV_REST_API_TOKEN` also work |
| (none) | Reel Clue | Each browser pastes its own TMDB key in ⚙ Settings |
| (none) | Tune Clue | iTunes needs no key; called with JSONP so it also works from a local file |

**Never commit API keys.** The repo is public.

## Cost guardrails (keep these)
- Google Street View: 5,000 free loads/month. Each Geo Clue round = 1 load per player. The game counts loads per browser and stops at the ⚙ limit (default 4,000). Finding locations uses Street View *metadata* (free).
- Google Maps is only loaded when a Geo Clue game starts (not on its home screen).
- Upstash free plan: 500K commands/month. Live rooms poll every 2s; a 4-player game uses roughly 2,500 commands.

## Geo Clue multiplayer
- **Challenge links**: `geo-clue.html?c=<base64url JSON>`. Format v1: `{v:1, p:pack, m:move, t:timer, r:[[panoId, heading, region]×5], s:[[name, [pts×5]], …]}`. Locations are re-read from Street View metadata by pano ID.
- **Live rooms**: `geo-clue.html?room=CODE`. `/api/room` actions: `create`, `join`, `get`, `start`, `guess`, `next`, `endround`, `settings`. Host-only: start/next/endround/settings. Rooms expire after 6h, max 10 players. Each browser *tab* is one player (`sessionStorage` id).
- Redis keys: `gc:room:CODE` (room JSON), `gc:room:CODE:p` (players hash), `gc:room:CODE:g` (guesses hash, field `round:playerId`).

## Testing
```
cd tests
npm install           # first time only (installs jsdom)
node smoke-single.js        # home → play → end → home for all three games
node smoke-multiplayer.js   # 2-player live room + challenge link round trip
node smoke-live-timer.js    # live room timer settings + timeouts
```
These print what happened at each step. Read the output and check it makes sense. They fake TMDB/iTunes/Google/Redis, so they test the game logic, not the real services. After changing a game, also run a quick syntax check of its script.

## Local preview
- Reel Clue and Tune Clue: double-click the HTML file.
- Geo Clue and the `/api` functions need the hosted site, or `npx vercel dev` (needs the Vercel CLI and `vercel link`; the Google key must also allow `http://localhost:3000/*`).
