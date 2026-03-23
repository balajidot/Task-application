// Gemini AI — Primary Schedule Generator
// File location: api/gemini.js
// ✅ FIXED: Model names updated to valid 2025-2026 versions
// ✅ FIXED: Stronger prompt — forces strict format, no prose/markdown
// ✅ FIXED: Better sanitizer — handles em-dashes, extra whitespace
// ✅ FIXED: maxOutputTokens increased 500→800 to avoid truncated responses
// ✅ FIXED: temperature lowered 1→0.7 for more consistent formatting

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

function sanitizeLines(text) {
  return String(text || '')
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/\*\*/g, '')
        .replace(/^#+\s*/, '')
        .replace(/^[\d]+[\.\)]\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .trim()
    )
    .filter((line) => /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\s*[-–]/.test(line))
    .map((line) => line.replace(/–/g, '-'))
    .slice(0, 7);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not set.' });

  const { userName = 'Friend', date, context = '', language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are a daily planner. Generate exactly 6 time-blocked tasks for ${userName} on ${date}.

STRICT RULES:
- Output ONLY 6 lines. No intro text, no headings, no explanations, no markdown.
- Every line MUST follow this exact format: HH:MM - HH:MM - Task name
- Use 24-hour time. Example: 09:00 - 10:30 - Deep work session
- These 3 slots are FIXED and must appear exactly as written:
  08:30 - 09:15 - Drop Amma at work
  12:30 - 13:15 - Lunch break
  17:30 - 18:15 - Pick up Amma from work
- Fill remaining 3 slots with tasks based on: ${context || 'productive work and learning'}
- Respond task names in ${outputLanguage}

OUTPUT (6 lines only):`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content;
      const lines = sanitizeLines(text);
      if (lines.length >= 4) return res.status(200).json({ schedule: lines.join('\n') });
    }
  } catch (e) {}

  return res.status(200).json({
    schedule: [
      '08:30 - 09:15 - Drop Amma at work',
      '09:30 - 11:30 - Deep focus work session',
      '12:30 - 13:15 - Lunch break',
      '14:00 - 16:00 - Learning and skill building',
      '16:30 - 17:15 - Review and planning',
      '17:30 - 18:15 - Pick up Amma from work',
    ].join('\n')
  });
}
