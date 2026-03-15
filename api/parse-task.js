// Gemini AI — Smart Task Parser
// File location: api/parse-task.js

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

  const { text = '', language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Extract task details from: "${text}". Return ONLY JSON inside <TASK_JSON> tags. Format: {"text": "...", "startTime": "HH:MM", "priority": "High/Medium/Low", "date": "YYYY-MM-DD"}`;

  const models = [
    { version: 'v1beta', name: 'gemini-flash-latest' },
    { version: 'v1beta', name: 'gemini-pro-latest' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' }
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = resultText.match(/<TASK_JSON>([\s\S]*?)<\/TASK_JSON>/);
        const parsedTask = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;
        if (parsedTask) return res.status(200).json({ parsedTask });
      }
      if (response.status === 404 || response.status === 429 || response.status === 403) continue;
      break;
    } catch (e) {
      continue;
    }
  }

  return res.status(500).json({ error: 'Parsing currently unavailable.' });
}
