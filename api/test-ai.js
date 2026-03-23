export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API Key' });

  const models = [
    { v: 'v1', n: 'gemini-1.5-flash' },
    { v: 'v1', n: 'gemini-1.5-flash-latest' },
    { v: 'v1', n: 'gemini-1.5-flash-001' },
    { v: 'v1', n: 'gemini-1.5-pro' },
    { v: 'v1', n: 'gemini-1.0-pro' },
    { v: 'v1', n: 'gemini-pro' },
    { v: 'v1beta', n: 'gemini-2.0-flash' },
    { v: 'v1beta', n: 'gemini-2.0-flash-lite' },
    { v: 'v1beta', n: 'gemini-1.5-flash-8b' }
  ];

  const results = [];
  for (const m of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/${m.v}/models/${m.n}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
        signal: AbortSignal.timeout(5000)
      });
      const data = await r.json();
      results.push({ model: m.n, version: m.v, status: r.status, ok: r.ok });
    } catch (e) {
      results.push({ model: m.n, error: e.message });
    }
  }
  return res.status(200).json(results);
}
