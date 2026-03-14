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
  ]
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many AI planning requests.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
  }

  const { userName = 'Friend', existingTasks = [], recentTasks = [], date, context = '', language = 'en' } = req.body || {};
  const todayDate = date || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const seed = seedFromString(`${todayDate}:${userName}:${context}`);
  const suggestedThemes = shuffleWithSeed(TASK_BANK, seed).slice(0, 7);
  const existingTaskText = existingTasks.map((task) => task?.text).filter(Boolean).join(', ');
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an assistant that creates a neat daily plan.
User: ${userName}
Date: ${todayDate}
Already on the board: ${existingTaskText || 'No tasks yet'}
Output language: ${outputLanguage}

Use this pool for variety:
${suggestedThemes.map((item) => `- ${item}`).join('\n')}

Rules:
1. Produce exactly 6 lines in format: HH:MM - HH:MM - Task description
2. Output ONLY the 6 schedule lines.
3. Task descriptions must be in ${outputLanguage}.`;

  const models = [
    { version: 'v1beta', name: 'gemini-1.5-flash' },
    { version: 'v1beta', name: 'gemini-pro' }
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
            generationConfig: { temperature: 1, maxOutputTokens: 320 }
          }),
          signal: AbortSignal.timeout(9000),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) continue;
        break;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const lines = sanitizeLines(text, existingTasks);
      if (lines.length >= 4) return res.status(200).json({ schedule: lines.join('\n') });

    } catch (e) {
      continue;
    }
  }

  // Final Fallback if all AI fail
  const fallback = pickFallback(todayDate, userName).map((line) => language === 'ta' ? translateFallbackLine(line) : line);
  return res.status(200).json({ schedule: fallback.join('\n') });
}

function translateFallbackLine(line) {
  return line
    .replace('Plan the day and warm up', 'நாளை திட்டமிட்டு லேசாக தொடங்கு')
    .replace('Deep work on your top priority', 'முக்கிய பணியில் ஆழ்ந்த கவன அமர்வு')
    .replace('Admin cleanup and follow-ups', 'admin சீரமைப்பு மற்றும் follow-up')
    .replace('Focus block for learning', 'கற்றலுக்கான கவன block')
    .replace('Project execution sprint', 'project செயல்பாட்டு sprint')
    .replace('Wrap-up and tomorrow plan', 'நாள் முடிப்பு மற்றும் நாளைய திட்டம்')
    .replace('Light review and setup', 'லேசான review மற்றும் setup')
    .replace('Coding or project build block', 'coding அல்லது project build block')
    .replace('Revision and practice set', 'revision மற்றும் practice அமர்வு')
    .replace('Meetings or collaboration', 'கூட்டங்கள் அல்லது ஒத்துழைப்பு')
    .replace('High-focus execution sprint', 'உயர் கவன செயல்பாட்டு sprint')
    .replace('Reflection and buffer time', 'reflection மற்றும் buffer நேரம்');
}
