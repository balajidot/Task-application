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

  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `Break down the following task into exactly 4-6 small, actionable sub-tasks. 
Task: "${taskText}"
Respond ONLY with a JSON array of strings in ${outputLanguage}. 
Example: ["Subtask 1", "Subtask 2"]`;

  // ─── Groq Primary ────────────────────────────────────────────────────────
  if (groqKey) {
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
  }

  // ─── Gemini Fallback ──────────────────────────────────────────────────────
  if (geminiKey) {
    for (const model of [{ v: 'v1', n: 'gemini-1.5-flash-latest' }, { v: 'v1', n: 'gemini-1.0-pro' }]) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 500 } }),
          signal: AbortSignal.timeout(8000),
        });
        if (response.ok) {
          const data = await response.json();
          let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const subtasks = JSON.parse(text);
            if (Array.isArray(subtasks)) return res.status(200).json({ subtasks });
          } catch (e) {}
        }
      } catch (e) { continue; }
    }
  }

  // Fallback
  return res.status(200).json({ subtasks: ["Step 1: Start planning", "Step 2: Gather resources", "Step 3: Begin execution", "Step 4: Final checks"] });
}
