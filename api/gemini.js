// Gemini AI — Primary Schedule Generator
// File location: api/gemini.js

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

const TASK_BANK = [
  'Deep work on your most important goal',
  'Review pending tasks and set priorities',
  'Follow-up messages and admin cleanup',
  'Learning block for skill growth',
  'Project execution sprint',
  'Planning and reflection session',
  'Exercise or recharge break',
  'Documentation or note organization',
  'Interview or communication practice',
  'Coding and debugging sprint',
  'Revision and recall practice',
  'Creative thinking and problem solving',
];

function sanitizeLines(text, existingTasks = []) {
  const existingSet = new Set(existingTasks.map((task) => String(task?.text || '').trim().toLowerCase()));
  return String(text || '')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\*\*/g, '').replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').trim())
    .filter((line) => /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*-/.test(line))
    .slice(0, 6);
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
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

  const { userName = 'Friend', existingTasks = [], date, context = '', language = 'en' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `Create a daily plan for ${userName} on ${date}. 
  Context: ${context}. Respond in ${outputLanguage}.
  Format: HH:MM - HH:MM - Task description (Exactly 6 lines).`;

  const models = [
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-1.5-flash' }
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
            generationConfig: { temperature: 1, maxOutputTokens: 500 }
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const lines = sanitizeLines(text, existingTasks);
        if (lines.length >= 4) return res.status(200).json({ schedule: lines.join('\n') });
      }
      if (response.status === 404) continue;
      break;
    } catch (e) { continue; }
  }

  return res.status(200).json({ schedule: "08:30 - 09:30 - Update your goals\n09:30 - 11:00 - High focus work session\n11:30 - 13:00 - Learning and study block\n14:00 - 15:30 - Project execution sprint" });
}
