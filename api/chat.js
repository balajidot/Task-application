// Gemini AI — Conversational Analysis Chat
// File location: api/chat.js

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
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel. Please check Project Settings.' });
  }

  const { message, appData = {}, language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an elite AI Productivity Coach.
  
USER DATA:
- Tasks: ${JSON.stringify(appData.goals || [])}
- Habits: ${JSON.stringify(appData.habits || [])}
- Career: ${JSON.stringify(appData.career || {})}

USER MESSAGE: "${message}"

INSTRUCTIONS:
1. Respond in ${outputLanguage}. Use emojis.
2. For app actions (Language/Theme/View/Tasks), use <ACTIONS_JSON>[...]</ACTIONS_JSON> tags.
3. Current Date: ${new Date().toISOString().split('T')[0]}

RESPONSE:`;

  // Standardized Models based on discovery list (Gemini 2.0 Flash is verified)
  const models = [
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' },
    { version: 'v1beta', name: 'gemini-1.5-flash' }
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
            generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let actions = [];
        const actionsMatch = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
        if (actionsMatch) {
          try {
            const parsed = JSON.parse(actionsMatch[1].trim());
            actions = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}
        }
        const cleanText = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim();
        return res.status(200).json({ response: cleanText, actions });
      } else {
        lastError = data.error?.message || response.status;
        if (response.status === 404) continue;
        return res.status(500).json({ error: 'Gemini API failed', message: lastError });
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  return res.status(500).json({ error: 'All models failed', message: lastError });
}
