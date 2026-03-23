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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key not configured.' });

  const { taskText, language = 'en' } = req.body || {};
  if (!taskText) return res.status(400).json({ error: 'Missing taskText' });

  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Break down the following task into exactly 4-6 small, actionable sub-tasks. 
Task: "${taskText}"
Respond ONLY with a JSON array of strings in ${outputLanguage}. 
Example: ["Subtask 1", "Subtask 2"]`;

  const models = [
    { v: 'v1',     n: 'gemini-3.1-flash' },
    { v: 'v1',     n: 'gemini-1.5-flash-latest' },
    { v: 'v1',     n: 'gemini-1.0-pro' }
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
          }),
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Basic JSON extraction from markdown if AI wraps it
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const subtasks = JSON.parse(text);
        if (Array.isArray(subtasks)) return res.status(200).json({ subtasks });
      } catch (e) {
        // If JSON parse fails, try to extract lines
        const lines = text.split('\n').map(l => l.trim().replace(/^[-*]\s*/, '')).filter(l => l.length > 2);
        if (lines.length > 0) return res.status(200).json({ subtasks: lines.slice(0, 6) });
      }
    } catch (e) { continue; }
  }

  // Fallback
  return res.status(200).json({ subtasks: ["Step 1: Start planning", "Step 2: Gather resources", "Step 3: Begin execution", "Step 4: Final checks"] });
}
