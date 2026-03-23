// AI Productivity Analysis — "Why do you fail on Mondays?"
// ✅ Phase 3: Deep insight = premium value

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
  if (!groqKey) {
    return res.status(500).json({ 
      error: 'AI Configuration Error', 
      details: 'GROQ_API_KEY is not set in Vercel Settings.' 
    });
  }

  const { userName = 'User', weeklyData = [], language = 'en' } = req.body || {};
  const weekStr = weeklyData.map(d => `${d.day}: ${d.done}/${d.total} tasks (${d.pct}%)`).join(', ');
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are a productivity analyst and personal coach for ${userName}.
Weekly productivity data: ${weekStr}
Analyze this data and provide:
1. Their WEAKEST day and WHY (be specific)
2. Their STRONGEST day and pattern
3. ONE specific actionable tip to improve their weakest area
4. An encouraging closing statement
Respond in ${outputLanguage}. Be direct, personal, specific. Max 4 sentences total. No bullet points, no markdown. Just natural coach-speak.`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const data = await r.json();
      const analysis = data?.choices?.[0]?.message?.content?.trim() || '';
      if (analysis) return res.status(200).json({ analysis });
    }
  } catch (e) {}

  return res.status(200).json({
    analysis: `${userName}, your data shows some great strengths — keep building on your best days and be gentle with yourself on the harder ones. Consistency over perfection wins every time.`
  });
}
