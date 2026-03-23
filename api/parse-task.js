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
    { v: 'v1beta', n: 'gemini-2.0-flash' },
    { v: 'v1',     n: 'gemini-1.5-flash' },
    { v: 'v1beta', n: 'gemini-1.5-flash' },
    { v: 'v1beta', n: 'gemini-1.5-flash-8b' }
  ];

  let lastError = 'All models failed';
  for (const model of models) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[DIAGNOSTIC] ${model.n} (${model.v}) failed with ${response.status}: ${errorBody}`);
        lastError = `Model ${model.n} failed: ${response.status} ${errorBody}`;
        continue;
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = resultText.match(/<TASK_JSON>([\s\S]*?)<\/TASK_JSON>/);
      const parsedTask = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;
      if (parsedTask) return res.status(200).json({ parsedTask });
    } catch (e) {
      console.error(`[DIAGNOSTIC] Fetch error for ${model.n}:`, e.message);
      lastError = `Fetch error: ${e.message}`;
      continue;
    }
  }

  return res.status(500).json({ error: 'AI Error', detail: lastError });
}
