// Live rooms for all three Street View games (Geo Clue, Name That Team, Hometown Heroes; settings.game says which).
// Stores rooms in Upstash Redis (connect it in Vercel → Storage → Upstash for Redis;
// the integration adds KV_REST_API_URL / KV_REST_API_TOKEN automatically). Rooms expire after 6 hours.
//
// Keys:  gc:room:CODE    → room JSON {code, hostId, settings, rounds, state, round, startedAt, forceEnd}
//        gc:room:CODE:p  → hash  playerId → {"name": "..."}
//        gc:room:CODE:g  → hash  "round:playerId" → {"lat","lng","km","pts","pick"}
//        gc:room:CODE:c  → hash  "time:playerId" → {"id","n","t","ts"}  (chat, max MAX_CHAT messages per room)

const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 6 * 3600;
const MAX_PLAYERS = 10;
const ROUNDS = 5;
const MAX_CHAT = 200;
const GAMES = ['geo', 'ntt', 'hh'];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function redis(commands) {
  const r = await fetch(DB_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error('Database error ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const hashToObj = arr => { const o = {}; for (let i = 0; i + 1 < (arr || []).length; i += 2) o[arr[i]] = JSON.parse(arr[i + 1]); return o; };
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

async function load(code) {
  const K = 'gc:room:' + code;
  const [room, players, guesses, chat] = await redis([['GET', K], ['HGETALL', K + ':p'], ['HGETALL', K + ':g'], ['HGETALL', K + ':c']]);
  return { room: room ? JSON.parse(room) : null, players: hashToObj(players), guesses: hashToObj(guesses),
    chat: Object.values(hashToObj(chat)).sort((a, b) => a.ts - b.ts) };
}
const saveRoom = room => redis([['SET', 'gc:room:' + room.code, JSON.stringify(room), 'EX', TTL]]);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!DB_URL || !DB_TOKEN) return res.status(503).json({ error: 'nodb' });
  try {
    const body = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) : {};
    const q = req.query || {};
    const action = body.action || q.action || 'get';
    const code = String(body.code || q.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const id = clean(body.id, 40);
    const K = 'gc:room:' + code;
    const fail = (status, msg) => res.status(status).json({ error: msg });

    if (action === 'create') {
      const s = body.settings || {}, rounds = Array.isArray(body.rounds) ? body.rounds.slice(0, ROUNDS) : [];
      if (!id || rounds.length !== ROUNDS) return fail(400, 'Bad request');
      const room = {
        hostId: id, state: 'lobby', round: 0, startedAt: 0, forceEnd: -1, createdAt: Date.now(),
        settings: { pack: clean(s.pack, 20) || 'world', move: clean(s.move, 10) || 'move', timer: Math.max(0, Math.min(600, +s.timer || 0)),
          game: GAMES.includes(s.game) ? s.game : 'geo', hard: s.hard === true },
        rounds: rounds.map(r => ({ pano: clean(r.pano, 200), heading: +r.heading || 0, lat: +r.lat, lng: +r.lng, desc: clean(r.desc, 200), region: clean(r.region, 60), ans: clean(r.ans, 40) }))
      };
      for (let tries = 0; tries < 8; tries++) {
        room.code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
        const RK = 'gc:room:' + room.code;
        const [ok] = await redis([['SET', RK, JSON.stringify(room), 'NX', 'EX', TTL]]);
        if (ok === 'OK') {
          await redis([['HSET', RK + ':p', id, JSON.stringify({ name: clean(body.name, 24) || 'Host' })], ['EXPIRE', RK + ':p', TTL]]);
          return res.status(200).json({ code: room.code });
        }
      }
      return fail(500, 'Could not create a room, try again');
    }

    if (!code) return fail(400, 'Missing room code');
    const data = await load(code);
    const room = data.room;
    if (!room) return fail(404, 'Room not found. It may have expired.');

    if (action === 'get') return res.status(200).json({ ...data, now: Date.now() });

    if (action === 'join') {
      if (!id) return fail(400, 'Bad request');
      // the page says which game it is: a room for another game isn't joined here, so the page can hand
      // over to the right one without leaving a "ghost" player behind (older pages send no game and just join)
      const game = room.settings.game || 'geo';
      if (body.game != null && body.game !== game) return res.status(200).json({ ok: false, game });
      if (!data.players[id]) {
        if (room.state !== 'lobby') return fail(409, 'That game has already started.');
        if (Object.keys(data.players).length >= MAX_PLAYERS) return fail(409, `Room is full (max ${MAX_PLAYERS}).`);
      }
      await redis([['HSET', K + ':p', id, JSON.stringify({ name: clean(body.name, 24) || 'Player' })], ['EXPIRE', K + ':p', TTL]]);
      return res.status(200).json({ ok: true, game });
    }

    if (action === 'guess') {
      const round = +body.round;
      if (room.state !== 'play' || room.round !== round) return fail(409, 'Round is over');
      if (!data.players[id]) return fail(403, 'Not in this room');
      const g = { pts: Math.max(0, Math.min(5000, Math.round(+body.pts || 0))), km: body.km == null ? null : +body.km,
        lat: body.lat == null ? null : +body.lat, lng: body.lng == null ? null : +body.lng,
        pick: body.pick == null ? null : clean(body.pick, 40) };
      await redis([['HSETNX', K + ':g', round + ':' + id, JSON.stringify(g)], ['EXPIRE', K + ':g', TTL]]);
      return res.status(200).json({ ok: true });
    }

    if (action === 'chat') {
      if (!data.players[id]) return fail(403, 'Not in this room');
      const text = String(body.text || '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 200);   // the page escapes it when showing
      if (!text) return fail(400, 'Empty message');
      if (data.chat.length >= MAX_CHAT) return fail(409, 'Chat is full for this room');
      const now = Date.now(), mine = data.chat.filter(m => m.id === id);
      if (mine.length && now - mine[mine.length - 1].ts < 1000) return fail(429, 'Slow down a little');
      const msg = { id, n: data.players[id].name, t: text, ts: now };
      await redis([['HSET', K + ':c', now.toString(36) + ':' + id, JSON.stringify(msg)], ['EXPIRE', K + ':c', TTL]]);
      return res.status(200).json({ ok: true });
    }

    // host-only actions
    if (id !== room.hostId) return fail(403, 'Only the host can do that');
    if (action === 'start') {
      if (room.state !== 'lobby') return res.status(200).json({ ok: true });
      Object.assign(room, { state: 'play', round: 0, startedAt: Date.now() });
    } else if (action === 'next') {
      if (room.round >= ROUNDS - 1) room.state = 'final';
      else Object.assign(room, { round: room.round + 1, startedAt: Date.now() });
    } else if (action === 'endround') {
      room.forceEnd = room.round;
    } else if (action === 'settings') {
      if (room.state !== 'lobby') return fail(409, 'The game has already started');
      const s = body.settings || {};
      if (s.timer != null) room.settings.timer = Math.max(0, Math.min(600, +s.timer || 0));
      if (['move', 'nomove', 'nmpz'].includes(s.move)) room.settings.move = s.move;
      if (typeof s.hard === 'boolean') room.settings.hard = s.hard;
    } else return fail(400, 'Unknown action');
    await saveRoom(room);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
