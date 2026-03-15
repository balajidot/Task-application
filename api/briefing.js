// Gemini AI — Daily Briefing & Insights
// File location: api/briefing.js

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
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

  const { appData = {}, language = 'en', userName = 'User' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Create a short (2 sentence) energetic briefing for ${userName}. Stats: Done ${appData.done}/${appData.total}. Respond in ${outputLanguage}.`;

  const models = [
    { version: 'v1beta', name: 'gemini-flash-latest' },
    { version: 'v1beta', name: 'gemini-pro-latest' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' }
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const briefing = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return res.status(200).json({ briefing });
      } else {
        lastError = data.error?.message || `Status ${response.status}`;
        const errLower = lastError.toLowerCase();
        if (response.status === 404 || response.status === 429 || response.status === 403 || errLower.includes('quota') || errLower.includes('found')) {
          continue;
        }
        break;
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  return res.status(200).json({ briefing: language === 'ta' ? 'AI பளுவாக உள்ளது. சிறிது நேரத்திற்கு பின் முயற்சிக்கவும்.' : 'AI systems are currently busy. Please check back in a moment!' });
}
