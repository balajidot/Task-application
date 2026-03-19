// AI Productivity Analysis — "Why do you fail on Mondays?"
// ✅ Phase 3: Deep insight = premium value

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set.' });

  const { userName = 'User', weeklyData = [], language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  // Format weekly data for AI
  const weekStr = weeklyData.map(d => `${d.day}: ${d.done}/${d.total} tasks (${d.pct}%)`).join(', ');

  const prompt = `You are a productivity analyst and personal coach for ${userName}.

Weekly productivity data: ${weekStr}

Analyze this data and provide:
1. Their WEAKEST day and WHY (be specific)
2. Their STRONGEST day and pattern
3. ONE specific actionable tip to improve their weakest area
4. An encouraging closing statement

Respond in ${outputLanguage}. Be direct, personal, specific. Max 4 sentences total. No bullet points, no markdown. Just natural coach-speak.`;

  const models = [
    { version: 'v1beta', name: 'gemini-2.5-flash-preview-05-20' },
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' },
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );
      const data = await response.json();
      if (response.ok) {
        const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (analysis) return res.status(200).json({ analysis });
      }
      if (response.status === 404 || response.status === 429 || response.status === 403) continue;
      break;
    } catch (e) { continue; }
  }

  return res.status(200).json({
    analysis: `${userName}, your data shows some great strengths — keep building on your best days and be gentle with yourself on the harder ones. Consistency over perfection wins every time.`
  });
}
