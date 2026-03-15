// Gemini AI — Smart Routine Filler
// File location: api/smart-routine.js

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
  }

  const { userName, goals, flexibleBlocks, fixedRoutine } = req.body || {};

  const prompt = `Fill these time slots: ${flexibleBlocks}. User goals: ${goals}. 
  Return ONLY JSON array inside <ROUTINE_JSON> tags.
  Format: [{"time_slot": "...", "task_title": "...", "why_it_matters": "..."}]`;

  const models = [
    { version: 'v1beta', name: 'gemini-2.0-flash' },
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
            generationConfig: { temperature: 0.7 }
          }),
          signal: AbortSignal.timeout(9000)
        }
      );

      const data = await response.json();
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const routineMatch = text.match(/<ROUTINE_JSON>([\s\S]*?)<\/ROUTINE_JSON>/) || { 1: text };
        const suggestions = JSON.parse(routineMatch[1].trim());
        return res.status(200).json({ suggestions });
      }
      if (response.status === 404) continue;
      break;
    } catch (e) {
      continue;
    }
  }

  return res.status(500).json({ error: 'Routine generation failed' });
}
