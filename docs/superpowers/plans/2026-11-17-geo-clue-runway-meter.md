# Geo Clue Runway Meter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a shared, all-players Street View usage meter (out of 5,000 free/month) on Geo Clue's home screen and in ⚙ Settings.

**Architecture:** New Vercel function `api/usage.js` keeps one Redis counter per UTC month. The page bumps it on every Street View load and reads it for the meter; the stop-limit uses the shared count when known.

**Tech Stack:** Vanilla JS in `geo-clue.html`, Vercel Node function, Upstash Redis REST, jsdom smoke tests.

**Spec:** `docs/superpowers/specs/2026-11-17-geo-clue-runway-meter-design.md`

## Global Constraints
- No build step, no framework; keep `geo-clue.html` self-contained.
- Redis env vars: `KV_REST_API_URL || UPSTASH_REDIS_REST_URL`, `KV_REST_API_TOKEN || UPSTASH_REDIS_REST_TOKEN` (same as `api/room.js`).
- Redis key `gc:usage:YYYY-MM` (UTC), expiry 40 days. Free amount constant `5000`.
- Bar colours: green < 60%, yellow 60–79%, red ≥ 80% of 5,000.
- Never commit API keys.

## Review Focus
- Database missing/down (`/api/usage` 503 or network error): home and settings still render, meter falls back to device count labelled "this device".
- Opened from a local file (no `/api`): same fallback, no console-breaking errors.
- Early in the month (day 1, few loads): runway line must not divide by zero; say "lasts the month".
- Shared count above 5,000: bar caps at 100%, "0 left".
- Bump failing must never block or delay loading the Street View.

---

### Task 1: Shared counter endpoint

**Files:**
- Create: `api/usage.js`
- Modify: `CLAUDE.md` (file table, Redis keys, Upstash cost note)

**Interfaces:**
- Produces: `GET api/usage` → `{ month: "YYYY-MM", panos: number, free: 5000 }`; `POST api/usage {action:"bump"}` → same shape with new count. `503 {error:"nodb"}` without env vars.

- [ ] Implement with the same `redis(pipeline)` helper pattern as `api/room.js`; bump = `[['INCR',K],['EXPIRE',K,3456000]]`; get = `[['GET',K]]` (null → 0). `Cache-Control: no-store`.
- [ ] Syntax check: `node -e "require('./api/usage.js')"` → no output.
- [ ] Commit `Geo Clue: shared monthly Street View counter endpoint`.

### Task 2: Meter on home + settings, shared stop-limit

**Files:**
- Modify: `geo-clue.html` (usage section ~L244–246, `bump('panos')` ~L380, settings ~L505–507, home `#hUsage` ~L159 & ~L590, styles)

**Interfaces:**
- Consumes: Task 1 endpoint.
- Produces: `let shared = null` (`{month, panos}` or null); `async function loadShared()`; `function bumpShared()`; `function meterHTML()` → bar + text; `overCap()` uses `shared.panos` when `shared` is for the current month, else device count.

- [ ] `bump('panos')` also calls `bumpShared()` (fire and forget, updates `shared` from response; errors ignored).
- [ ] `meterHTML()`: "X of 5,000 free used · Y left · resets <Mon 1>" + runway line: pace = panos / days elapsed; if pace·daysInMonth ≤ 5000 → "At this pace it lasts the month", else "At this pace it runs out around <Mon D>". Fallback label "(this device only)" when `shared` is null.
- [ ] Home: `#hUsage` becomes the meter (only when a key is set); `renderHome` calls `loadShared()` then re-renders the meter.
- [ ] Settings: meter above the limit input; keep existing device line under it.
- [ ] Syntax check of the page script.

### Task 3: Smoke tests

**Files:**
- Modify: `tests/smoke-single.js`, `tests/smoke-multiplayer.js`, `tests/smoke-live-timer.js` (their fake `fetch`)

- [ ] Fake `api/usage` (GET returns `{month, panos:1234, free:5000}`, POST bump increments) in each fake fetch.
- [ ] In `smoke-single.js` Geo run: print the home meter text (expect "1,234 of 5,000"), and the count after playing a game (expect bumps = rounds played).
- [ ] One run with `api/usage` returning 503: home still renders with "this device only".
- [ ] Run all three smoke tests; output makes sense.
- [ ] Commit `Geo Clue: runway meter on home and settings`.
