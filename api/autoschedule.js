// Auto-Scheduler — AI plans your day around existing commitments
// ✅ Phase 3: "I have a meeting at 3pm, plan my day around it"

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
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set.' });

  const {
    userName    = 'User',
    date,
    existingTasks = [],  // Already scheduled tasks
    freeSlots     = [],  // User's free time slots
    goals         = [],  // User's life goals
    energy        = 'medium',
    language      = 'en',
  } = req.body || {};

  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  // Format existing tasks for context
  const existingStr = existingTasks.length > 0
    ? existingTasks.map(t => `${t.startTime}-${t.endTime}: ${t.text}`).join(', ')
    : 'None yet';

  const prompt = `You are a smart daily scheduler for ${userName}.
Date: ${date}
Energy level today: ${energy}
User goals: ${goals.join(', ') || 'productivity and learning'}
Already scheduled: ${existingStr}

TASK: Fill the remaining gaps in the day with productive tasks.
STRICT RULES:
- Output ONLY time-blocked tasks. No intro, no markdown.
- Format: HH:MM - HH:MM - Task name
- These slots are FIXED (never change): 08:30-09:15 Drop Amma, 12:30-13:15 Lunch, 17:30-18:15 Pick Amma
- Schedule around existing tasks — no overlaps!
- Match task intensity to energy level: high=deep work, low=easy tasks
- Respond in ${outputLanguage}
- Output 4-6 lines only

OUTPUT:`;

  const models = [
    { version: 'v1beta', name: 'gemini-2.5-flash-preview-05-20' },
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' },
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const lines = text
          .trim()
          .split(/\r?\n/)
          .map(l => l.trim().replace(/\*\*/g,'').replace(/^[\d]+[\.\)]\s*/,'').replace(/^[-•]\s*/,'').trim())
          .filter(l => /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\s*[-–]/.test(l))
          .map(l => l.replace(/–/g, '-'))
          .slice(0, 7);

        if (lines.length >= 2) return res.status(200).json({ schedule: lines.join('\n'), count: lines.length });
      }
      if (response.status === 404 || response.status === 429 || response.status === 403) continue;
      break;
    } catch (e) { continue; }
  }

  return res.status(200).json({
    schedule: [
      '09:30 - 11:00 - Deep focus work block',
      '11:15 - 12:30 - Skill building session',
      '14:00 - 15:30 - Project work sprint',
      '16:00 - 17:00 - Review and planning',
    ].join('\n'),
    count: 4,
  });
}
