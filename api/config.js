// Serves the Google Maps key stored in Vercel (Project → Settings → Environment Variables → GOOGLE_MAPS_KEY)
// so Geo Clue works on every device without pasting the key.
// Google Maps browser keys are always visible to visitors; keep the key restricted to your site's address
// and to the Maps JavaScript API in Google Cloud Console.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ googleMapsKey: process.env.GOOGLE_MAPS_KEY || '' });
};
