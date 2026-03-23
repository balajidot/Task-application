// Gemini AI — Task Decomposer
// File location: api/decompose.js

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

  const { taskText, language = 'en' } = req.body || {};
  if (!taskText) return res.status(400).json({ error: 'Missing taskText' });
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Break down the following task into exactly 4-6 small, actionable sub-tasks. 
Task: "${taskText}"
Respond ONLY with a JSON array of strings in ${outputLanguage}. 
Example: ["Subtask 1", "Subtask 2"]`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const data = await r.json();
      let text = data?.choices?.[0]?.message?.content?.trim() || '';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const subtasks = JSON.parse(text);
      if (Array.isArray(subtasks)) return res.status(200).json({ subtasks });
    }
  } catch (e) {}

  // Fallback
  return res.status(200).json({ subtasks: ["Step 1: Start planning", "Step 2: Gather resources", "Step 3: Begin execution", "Step 4: Final checks"] });
}
