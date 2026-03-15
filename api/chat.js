// Gemini AI — Conversational Analysis Chat (SUPER DEBUGGER MODE)
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
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel. Please check Project Settings > Environment Variables.' });
  }

  const { message, appData = {}, language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an AI Coach. Respond to: "${message}". Data: ${JSON.stringify(appData)}. Respond in ${outputLanguage}. 
  If taking app actions, use <ACTIONS_JSON>[...]</ACTIONS_JSON>. 
  (KEEP IT SHORT FOR DEBUGGING)`;

  // EXHAUSTIVE LIST OF MODELS AND VERSIONS
  const modelsToTry = [
    { v: 'v1beta', m: 'gemini-1.5-flash' },
    { v: 'v1', m: 'gemini-1.5-flash' },
    { v: 'v1beta', m: 'gemini-1.5-pro' },
    { v: 'v1', m: 'gemini-1.5-pro' },
    { v: 'v1beta', m: 'gemini-pro' },
    { v: 'v1', m: 'gemini-pro' },
    { v: 'v1beta', m: 'gemini-1.0-pro' },
    { v: 'v1', m: 'gemini-1.0-pro' }
  ];

  let errors = [];

  for (const {v, m} of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Empty AI Response";
        let actions = [];
        const actionsMatch = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
        if (actionsMatch) {
          try {
            const parsed = JSON.parse(actionsMatch[1].trim());
            actions = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}
        }
        const cleanText = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim();
        return res.status(200).json({ response: cleanText, actions, debug: `Worked with ${m} (${v})` });
      } else {
        errors.push(`${m}(${v}): ${data.error?.message || response.status}`);
      }
    } catch (e) {
      errors.push(`${m}(${v}): EXCEPTION ${e.message}`);
    }
  }

  // DISCOVERY STEP: If all failed, list available models
  let availableModels = "Unknown";
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      availableModels = listData.models?.map(m => m.name.replace('models/', '')).join(', ') || "No models listed";
    } else {
      const listErr = await listResponse.json();
      availableModels = `List Error: ${listErr.error?.message || listResponse.status}`;
    }
  } catch (e) {
    availableModels = `List Exception: ${e.message}`;
  }

  return res.status(500).json({ 
    error: 'All Models Failed', 
    message: `Available Models for this Key: [${availableModels}]. Errors encountered: ${errors.join(' | ')}`
  });
}
