// Gemini AI — Task List Optimization
// File location: api/optimize.js

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not set.' });

  const { tasks = [], language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Re-sequence these tasks for optimal flow. Return ONLY a valid JSON array inside <OPTIMIZED_JSON> tags. TASKS: ${JSON.stringify(tasks)}. Language: ${outputLanguage}`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (r.ok) {
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const jsonMatch = text.match(/<OPTIMIZED_JSON>([\s\S]*?)<\/OPTIMIZED_JSON>/);
      const optimizedTasks = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;
      if (optimizedTasks) return res.status(200).json({ optimizedTasks });
    }
  } catch (e) {}

  return res.status(500).json({ error: 'Optimization currently unavailable.' });
}
