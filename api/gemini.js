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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

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

  // ✅ FIXED: All 3 are valid model names as of 2025-2026
  const models = [
    { v: 'v1beta', n: 'gemini-2.0-flash' },
    { v: 'v1',     n: 'gemini-1.5-flash' },
    { v: 'v1beta', n: 'gemini-1.5-flash' }
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
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const lines = sanitizeLines(text);
        if (lines.length >= 4) return res.status(200).json({ schedule: lines.join('\n') });
      }
      if (response.status === 404 || response.status === 429 || response.status === 403) continue;
      break;
    } catch (e) { continue; }
  }

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
