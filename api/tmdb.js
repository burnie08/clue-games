// Passes Reel Clue's movie lookups to TMDB using the key stored in Vercel
// (Project → Settings → Environment Variables → TMDB_KEY), so players don't need their own key
// and the key never reaches the browser.
// Call: /api/tmdb?path=/movie/550&append_to_response=credits
const ALLOWED = /^\/(configuration|discover\/movie|search\/movie|movie\/\d+)$/;

module.exports = async (req, res) => {
  const key = (process.env.TMDB_KEY || '').trim();
  if (!key) return res.status(503).json({ error: 'no-shared-key' });
  const q = req.query || {};
  const path = String(q.path || '');
  if (!ALLOWED.test(path)) return res.status(400).json({ error: 'path not allowed' });

  const u = new URL('https://api.themoviedb.org/3' + path);
  for (const [k, v] of Object.entries(q)) if (k !== 'path' && k !== 'api_key') u.searchParams.set(k, String(v));
  const headers = { accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key; else u.searchParams.set('api_key', key);

  try {
    const r = await fetch(u, { headers });
    const body = await r.text();
    res.setHeader('Content-Type', 'application/json');
    if (r.ok) res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'TMDB unreachable' });
  }
};
