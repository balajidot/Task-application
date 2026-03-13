// 🤖 Gemini AI — Smart Task Generator
// File location: api/gemini.js (project ROOT folder)
// Updated: No repetition + Keyword-based + Fixed Routine Protection

// 🔒 BALAJI'S FIXED DAILY ROUTINE — AI இதை NEVER மாத்தாது!
const FIXED_ROUTINE = [
  { start: '08:30', end: '09:15', emoji: '🚗', task: 'Drop Amma at work' },
  { start: '12:30', end: '13:15', emoji: '🥗', task: 'Lunch break' },
  { start: '17:30', end: '18:15', emoji: '🚗', task: 'Pick up Amma from work' },
];

// 🎯 BALAJI'S FLEXIBLE GOAL BLOCKS — AI இந்த areas-ல suggest பண்ணும்
const FLEX_GOALS = [
  'Banking aptitude & quantitative practice',
  'English grammar & vocabulary study',
  'Banking interview preparation',
  'Web app coding & development',
  'English communication practice',
  'Current affairs & banking awareness',
  'Mock test & exam practice',
  'React & JavaScript skill building',
];

// 🗓️ Recent schedules cache — repetition avoid பண்ண
const recentSchedules = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' });
  }

  const { userName, existingTasks = [], date, context = '' } = req.body;

  const todayDate = date || new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  // 🔒 Build fixed routine text for prompt
  const fixedRoutineText = FIXED_ROUTINE
    .map(r => `${r.start} - ${r.end} - ${r.emoji} ${r.task}`)
    .join('\n');

  // 🎯 Build flexible goals text
  const flexGoalsText = FLEX_GOALS.join(', ');

  // 📋 Existing tasks context
  const existingText = existingTasks.length > 0
    ? `User already has these tasks: ${existingTasks.map(t => t.text).join(', ')}. Do NOT duplicate these.`
    : 'No existing tasks yet.';

  // 🔑 Keyword context — user typed something specific
  const keywordText = context
    ? `IMPORTANT: User wants to focus on "${context}" today. Generate ALL flexible tasks related to this keyword/topic.`
    : `Fill flexible time blocks with tasks from these goal areas: ${flexGoalsText}`;

  // 🚫 Recent schedules — avoid repeating
  const recentText = recentSchedules.length > 0
    ? `AVOID repeating these recently suggested tasks: ${recentSchedules.slice(-3).join(' | ')}`
    : '';

  // 🧠 MASTER PROMPT — all 3 requirements included
  const prompt = `You are a smart productivity coach for ${userName || 'Balaji'} on ${todayDate}.

STRICT RULES — Follow exactly:

1. FIXED ROUTINE (DO NOT CHANGE THESE — always include exactly as shown):
${fixedRoutineText}

2. FLEXIBLE BLOCKS — Fill the free time between fixed tasks with 3-4 new tasks:
- Before 08:30 (morning slot available: 06:00 - 08:30)
- Between 09:15 - 12:30 (main productive block)
- Between 13:15 - 17:30 (afternoon block)

3. KEYWORD FOCUS:
${keywordText}

4. NO REPETITION:
${recentText}
Every task must be UNIQUE and SPECIFIC — not generic like "deep work".

5. OUTPUT FORMAT (strict — no headers, no numbers, nothing extra):
HH:MM - HH:MM - [emoji] Specific task description

6. RULES:
- Use 24-hour time (09:00 not 9:00 AM)
- Total 6-7 tasks including fixed routine
- Tasks must NOT overlap
- Be specific: "Solve 20 banking aptitude questions" not just "Study"
- ${existingText}

Generate the schedule now:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,      // 🔥 High creativity — no repetition!
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', JSON.stringify(errData));
      return res.status(500).json({ error: 'Gemini API request failed', details: errData });
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: 'AI returned empty response.' });
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Empty text from Gemini' });
    }

    // Clean output — only valid HH:MM lines
    const lines = text
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^\d{2}:\d{2}/.test(l))
      .slice(0, 7);

    // 🚫 Save to recent cache — avoid repeating next time
    const flexLines = lines
      .filter(l => !FIXED_ROUTINE.some(r => l.includes(r.task)))
      .map(l => l.split(' - ').slice(2).join(' - '))
      .join(' | ');
    if (flexLines) recentSchedules.push(flexLines);
    if (recentSchedules.length > 5) recentSchedules.shift(); // keep last 5 only

    return res.status(200).json({ schedule: lines.join('\n') });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
