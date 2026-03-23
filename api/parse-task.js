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

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not set.' });

  const systemPrompt = `Extract task details. Respond in ${outputLanguage}. Return ONLY JSON inside <TASK_JSON> tags. Format: {"text": "...", "startTime": "HH:MM", "priority": "High/Medium/Low", "date": "YYYY-MM-DD"}`;
  const userPrompt   = `Task: "${text}"`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (r.ok) {
      const data = await r.json();
      const aiText = data?.choices?.[0]?.message?.content || '';
      const jsonMatch = aiText.match(/<TASK_JSON>([\s\S]*?)<\/TASK_JSON>/);
      const parsedTask = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;
      if (parsedTask) return res.status(200).json({ parsedTask });
    }
  } catch (e) {}

  return res.status(500).json({ error: 'AI Parsing unavailable. Check Groq API Key.' });
}
