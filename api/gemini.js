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

const FALLBACK_SCHEDULES = [
  [
    '08:30 - 09:15 - Plan the day and warm up',
    '09:15 - 10:45 - Deep work on your top priority',
    '11:00 - 12:00 - Admin cleanup and follow-ups',
    '13:00 - 14:30 - Focus block for learning',
    '15:00 - 16:30 - Project execution sprint',
    '17:00 - 17:30 - Wrap-up and tomorrow plan',
  ],
  [
    '08:30 - 09:00 - Light review and setup',
    '09:00 - 10:30 - Coding or project build block',
    '11:00 - 12:00 - Revision and practice set',
    '13:00 - 14:00 - Meetings or collaboration',
    '14:30 - 16:00 - High-focus execution sprint',
    '16:30 - 17:15 - Reflection and buffer time',
  ],
  [
    '08:00 - 08:45 - Morning reset and planning',
    '09:00 - 10:30 - Important task deep work',
    '11:00 - 12:15 - Research and study block',
    '13:15 - 14:00 - Inbox and checklist reset',
    '14:15 - 15:45 - Build or practice session',
    '16:00 - 17:00 - Review, tidy up, and prep next steps',
  ],
];

function seedFromString(value) {
  let hash = 0;
  const raw = String(value || 'seed');
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) || 1;
}

function pickFallback(date, userName) {
  const seed = seedFromString(`${date}:${userName}`);
  return FALLBACK_SCHEDULES[seed % FALLBACK_SCHEDULES.length];
}

function shuffleWithSeed(items, seed) {
  const clone = [...items];
  let workingSeed = seed;
  for (let index = clone.length - 1; index > 0; index -= 1) {
    workingSeed = (workingSeed * 9301 + 49297) % 233280;
    const swapIndex = workingSeed % (index + 1);
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function sanitizeLines(text, existingTasks = []) {
  const existingSet = new Set(existingTasks.map((task) => String(task?.text || '').trim().toLowerCase()).filter(Boolean));
  const seenDescriptions = new Set();

  return String(text || '')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\*\*/g, '').replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').replace(/`/g, '').trim())
    .filter((line) => /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*-/.test(line))
    .filter((line) => {
      const description = line.split(/\s*-\s*/).slice(2).join(' - ').trim().toLowerCase();
      if (!description || existingSet.has(description) || seenDescriptions.has(description)) return false;
      seenDescriptions.add(description);
      return true;
    })
    .slice(0, 6);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many AI planning requests. Please try again in a few minutes.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' });
  }

  const { userName = 'Friend', existingTasks = [], recentTasks = [], date, context = '' } = req.body || {};

  if (!Array.isArray(existingTasks) || !Array.isArray(recentTasks)) {
    return res.status(400).json({ error: 'existingTasks and recentTasks must be arrays' });
  }

  if (typeof context !== 'string' || context.length > 2000) {
    return res.status(400).json({ error: 'context must be a string under 2000 characters' });
  }

  const todayDate = date || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const seed = seedFromString(`${todayDate}:${userName}:${context}`);
  const suggestedThemes = shuffleWithSeed(TASK_BANK, seed).slice(0, 7);
  const recentTaskText = recentTasks.map((task) => task?.text).filter(Boolean).join(', ');
  const existingTaskText = existingTasks.map((task) => task?.text).filter(Boolean).join(', ');

  const prompt = `You are an assistant that creates a neat, realistic, non-repetitive daily plan.

User: ${userName}
Date: ${todayDate}
Already on the board: ${existingTaskText || 'No tasks yet'}
Recently suggested before: ${recentTaskText || 'No recent suggestions'}
Extra context from the user: ${context || 'None'}

Use this idea pool for variety, but do not repeat the exact same wording:
${suggestedThemes.map((item) => `- ${item}`).join('\n')}

Rules:
1. Produce exactly 6 lines.
2. Each line must be in this format only: HH:MM - HH:MM - Task description
3. No bullets, no numbering, no markdown, no headings.
4. Keep each task description short and natural.
5. Do not repeat the same task wording across lines.
6. Avoid copying the exact text from "Already on the board" or "Recently suggested before".
7. Make the blocks practical and well-spaced between 08:00 and 18:30.
8. Include at least one lighter block or break.
9. Output only the 6 schedule lines.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            maxOutputTokens: 320,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', JSON.stringify(errData));
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const lines = sanitizeLines(text, existingTasks);

    if (lines.length >= 4) {
      return res.status(200).json({ schedule: lines.join('\n') });
    }

    const fallback = pickFallback(todayDate, userName)
      .filter((line) => !existingTasks.some((task) => line.toLowerCase().includes(String(task?.text || '').trim().toLowerCase())))
      .slice(0, 6);

    return res.status(200).json({ schedule: fallback.join('\n') });
  } catch (error) {
    console.error('Handler error:', error);
    const fallback = pickFallback(todayDate, userName);
    return res.status(200).json({ schedule: fallback.join('\n') });
  }
}
