// Geo Clue shared Street View counter: one number per month for ALL players (they share one Google key).
// GET → {month, panos, free}.  POST {action:"bump"} → adds 1, returns the same shape.
// Key: gc:usage:YYYY-MM (UTC month), expires after 40 days. Uses the same Upstash Redis as api/room.js.

const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FREE = 5000;
const TTL = 40 * 24 * 3600;

async function redis(commands) {
  const r = await fetch(DB_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error('Database error ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!DB_URL || !DB_TOKEN) return res.status(503).json({ error: 'nodb' });
  try {
    const body = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) : {};
    const d = new Date(), month = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
    const K = 'gc:usage:' + month;
    let panos;
    if (req.method === 'POST' && body.action === 'bump') [panos] = await redis([['INCR', K], ['EXPIRE', K, TTL]]);
    else [panos] = await redis([['GET', K]]);
    return res.status(200).json({ month, panos: +panos || 0, free: FREE });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
