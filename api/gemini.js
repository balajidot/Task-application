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

// 🗓️ Recent schedules cache — repetition avoid பண்ண (per server instance)
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

  // 🔒 Fixed routine text
  const fixedRoutineText = FIXED_ROUTINE
    .map(r => `${r.start} - ${r.end} - ${r.emoji} ${r.task}`)
    .join('\n');

  // 📋 Existing tasks
  const existingText = existingTasks.length > 0
    ? `User already has: ${existingTasks.map(t => t.text).join(', ')}. Do NOT duplicate.`
    : 'No existing tasks yet.';

  // 🔑 Keyword OR goals
  const keywordText = context
    ? `USER FOCUS KEYWORD: "${context}" — ALL flexible tasks must relate to this topic only.`
    : `Fill flexible blocks from these goal areas: ${FLEX_GOALS.join(', ')}`;

  // 🚫 Anti-repetition
  const recentText = recentSchedules.length > 0
    ? `AVOID these recently used tasks: ${recentSchedules.slice(-3).join(' | ')}`
    : 'Make every task fresh and specific.';

  const prompt = `You are a smart daily planner for ${userName || 'Balaji'} on ${todayDate}.

=== FIXED TASKS (include EXACTLY as shown, do not modify) ===
${fixedRoutineText}

=== YOUR JOB: Fill these free time blocks with 3-4 tasks ===
Block 1: 06:00 - 08:30 (morning — 1 task)
Block 2: 09:15 - 12:30 (main block — 2 tasks)
Block 3: 13:15 - 17:30 (afternoon — 1-2 tasks)

=== FOCUS ===
${keywordText}

=== NO REPETITION ===
${recentText}

=== EXISTING TASKS ===
${existingText}

=== OUTPUT FORMAT (STRICT) ===
- Only lines in this format: HH:MM - HH:MM - emoji Task
- 24-hour time only
- No headers, no numbers, no extra text
- Total 6-7 lines (fixed + flexible combined)
- Tasks must NOT overlap in time
- Be SPECIFIC: "Solve 20 SBI PO aptitude questions" not "Study"

Output the schedule:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
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
    console.log('Gemini raw output:', text); // 🔍 debug

    // 🔥 FIX: Gemini sometimes returns numbered/bold lines — extract all time lines
    const lines = text
      .trim()
      .split('\n')
      .map(l => l
        .trim()
        .replace(/^\d+[\.\)]\s*/, '')      // remove "1. " or "1) " prefix
        .replace(/\*\*/g, '')              // remove **bold** markdown
        .replace(/^[-•]\s*/, '')           // remove bullet "- " or "• "
        .trim()
      )
      .filter(l => /\d{1,2}:\d{2}/.test(l))  // any line containing time HH:MM
      .filter(l => l.length > 5)              // skip empty/short lines
      .slice(0, 7);

    // Cache flexible tasks for anti-repetition
    const flexLines = lines
      .filter(l => !FIXED_ROUTINE.some(r => l.includes(r.task)))
      .map(l => l.split(' - ').slice(2).join(' '))
      .join(' | ');
    if (flexLines) {
      recentSchedules.push(flexLines);
      if (recentSchedules.length > 5) recentSchedules.shift();
    }

    return res.status(200).json({ schedule: lines.join('\n') });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
