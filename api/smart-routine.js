// Gemini AI — Smart Routine Filler
// File location: api/smart-routine.js

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

  const { userName, goals, flexibleBlocks, fixedRoutine } = req.body || {};

  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `Fill these time slots: ${flexibleBlocks}. User goals: ${goals}. Return ONLY JSON array inside <ROUTINE_JSON> tags. Format: [{"time_slot": "...", "task_title": "...", "why_it_matters": "..."}]`;

  // ─── Groq Primary ────────────────────────────────────────────────────────
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content || '';
        const routineMatch = text.match(/<ROUTINE_JSON>([\s\S]*?)<\/ROUTINE_JSON>/) || { 1: text };
        const suggestions = JSON.parse(routineMatch[1].trim());
        return res.status(200).json({ suggestions });
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
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } }),
          signal: AbortSignal.timeout(9000)
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const routineMatch = text.match(/<ROUTINE_JSON>([\s\S]*?)<\/ROUTINE_JSON>/) || { 1: text };
          const suggestions = JSON.parse(routineMatch[1].trim());
          return res.status(200).json({ suggestions });
        }
      } catch (e) { continue; }
    }
  }

  return res.status(200).json({ suggestions: [] });
}
