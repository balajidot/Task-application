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
    { v: 'v1',     n: 'gemini-3.1-flash' },
    { v: 'v1',     n: 'gemini-1.5-flash-latest' },
    { v: 'v1',     n: 'gemini-1.0-pro' }
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${apiKey}`,
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

      if (!response.ok) continue;

      const data = await response.json();
      const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const lines = text
        .trim()
        .split(/\r?\n/)
        .map(l => l.trim().replace(/\*\*/g,'').replace(/^[\d]+[\.\)]\s*/,'').replace(/^[-•]\s*/,'').trim())
        .filter(l => /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\s*[-–]/.test(l))
        .map(l => l.replace(/–/g, '-'))
        .slice(0, 7);

      if (lines.length >= 2) {
        const newTasks = lines.map(line => {
          const parts = line.split('-').map(p => p.trim());
          if (parts.length >= 3) {
            return {
              text: parts.slice(2).join(' - '),
              startTime: parts[0],
              endTime: parts[1],
              priority: 'Medium',
              session: (parseInt(parts[0]) < 12) ? 'Morning' : (parseInt(parts[0]) < 17) ? 'Afternoon' : 'Evening'
            };
          }
          return null;
        }).filter(Boolean);

        if (newTasks.length > 0) return res.status(200).json({ newTasks });
      }
    } catch (e) { continue; }
  }

  const fallbackTasks = [
    { text: 'Deep focus work block', startTime: '09:30', endTime: '11:00', priority: 'High', session: 'Morning' },
    { text: 'Skill building session', startTime: '11:15', endTime: '12:30', priority: 'Medium', session: 'Morning' },
    { text: 'Project work sprint', startTime: '14:00', endTime: '15:30', priority: 'High', session: 'Afternoon' },
    { text: 'Review and planning', startTime: '16:00', endTime: '17:00', priority: 'Medium', session: 'Afternoon' },
  ];

  return res.status(200).json({ newTasks: fallbackTasks });
}
