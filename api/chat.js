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
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
  }

  const { message, appData = {}, language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an AI Personal Assistant. 
Respond to: "${message}". 
Data: ${JSON.stringify(appData)}. 
Respond in ${outputLanguage}. Use emojis. 

If the user wants to change settings or views, use <ACTIONS_JSON>[{"type": "SET_LANGUAGE", "value": "ta/en"}, {"type": "SET_THEME", "value": "dark/light"}, {"type": "SET_VIEW", "value": "view_id"}]</ACTIONS_JSON>.
If the user wants to add tasks, use <ACTIONS_JSON>[{"type": "ADD_TASKS", "tasks": [{"text": "...", "startTime": "HH:MM", "endTime": "HH:MM", "priority": "High/Medium/Low", "session": "Morning/Afternoon/Evening", "date": "YYYY-MM-DD"}]}]</ACTIONS_JSON>.
If the user wants to REPLACE or REWRITE today's schedule entirely, use <ACTIONS_JSON>[{"type": "REPLACE_TASKS", "tasks": [...]}]</ACTIONS_JSON>.

Be extremely precise with JSON.`;

  // Standardized Models with specific focus on stability (Aliases are usually best)
  // ✅ FIXED: Valid model names as of 2025-2026
  const models = [
    { version: 'v1beta', name: 'gemini-2.5-flash-preview-05-20' },
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' },
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
        lastError = data.error?.message || `Status ${response.status}`;
        
        // If Model Not Found (404) OR Quota Exceeded (429/403) or Limit 0, try next model
        const errLower = lastError.toLowerCase();
        if (response.status === 404 || response.status === 429 || response.status === 403 || errLower.includes('quota') || errLower.includes('found')) {
          // model failed, trying next
          continue;
        }
        
        return res.status(500).json({ error: 'Gemini API failed', message: lastError });
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  // If all failed, return a helpful error instead of raw technical one
  return res.status(500).json({ 
    error: 'AI Services Busy', 
    message: 'Google Gemini API list is busy or reaching free tier limits. Please wait 1 minute and try again.' 
  });
}
