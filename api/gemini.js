// Gemini AI — Auto Task Generator
// File location: api/gemini.js (in your project ROOT folder)
// Vercel serverless function — called from App.jsx

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  // ✅ 1. CORS Headers - Capacitor (APK) கோரிக்கைகளை அனுமதிக்க
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // எல்லா origin-களையும் அனுமதிக்க
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // ✅ 2. Preflight Request (OPTIONS) வந்தால் உடனடியாக 200 OK அனுப்ப வேண்டும்
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ 3. POST Method-ஐ மட்டும் அனுமதி
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Rate Limiting & Security ---
  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many AI planning requests. Please try again in a few minutes.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' });
  }

  // --- Input Validation ---
  const { userName, existingTasks = [], date, context = '' } = req.body;
  if (!Array.isArray(existingTasks)) {
    return res.status(400).json({ error: 'existingTasks must be an array' });
  }
  if (typeof context !== 'string' || context.length > 2000) {
    return res.status(400).json({ error: 'context must be a string under 2000 characters' });
  }

  // --- Prompt Engineering ---
  const todayDate = date || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const existingText = existingTasks.length > 0
    ? `The user already has these tasks today: ${existingTasks.map(t => t.text).join(', ')}.`
    : 'The user has no tasks planned yet.';

  const prompt = `You are a productivity coach creating a daily schedule for ${userName || 'Balaji'} on ${todayDate}.

${existingText}
${context ? `Additional context: ${context}` : ''}

RULES — READ CAREFULLY:
1. You MUST include these 3 fixed tasks EXACTLY as written, at EXACT times:
   08:30 - 09:15 - 🚗 Drop Amma at work
   12:30 - 13:15 - 🥗 Lunch break
   17:30 - 18:15 - 🚗 Pick up Amma from work

2. Fill the remaining 3 free time slots with tasks from these goals ONLY:
   - 🏦 Banking aptitude and quantitative practice
   - 📖 English grammar and vocabulary study
   - 🎯 Banking interview preparation
   - 💻 Web app coding and React development
   - 🗣️ English communication practice
   - 📰 Current affairs and banking awareness
   - 📝 Mock test and exam practice

3. Free time slots available:
   - 09:15 to 12:30 (use this fully)
   - 13:15 to 17:30 (split into 2 tasks)

4. Output format — STRICTLY follow this, one task per line:
   HH:MM - HH:MM - [emoji] Task description

5. NO numbering (no 1. 2. 3.)
   NO bold text (no **text**)
   NO bullet points (no - or •)
   NO headers
   NO extra lines
   NO spelling mistakes
   ONLY 6 plain lines total

CORRECT example output:
08:30 - 09:15 - 🚗 Drop Amma at work
09:15 - 12:30 - 🏦 Banking aptitude practice: Ratio, Percentage, Number Series
12:30 - 13:15 - 🥗 Lunch break
13:15 - 15:30 - 💻 React web app: Fix UI bugs and deploy to Vercel
15:30 - 17:30 - 📖 English grammar study and current affairs reading
17:30 - 18:15 - 🚗 Pick up Amma from work`;

  try {
    // --- Gemini API Call ---
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        }),
        signal: AbortSignal.timeout(20000)
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', JSON.stringify(errData));
      return res.status(500).json({ error: 'Gemini API request failed', details: errData });
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: 'AI returned empty candidates.' });
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Empty text response from Gemini' });
    }

    // ✅ Strip ALL markdown formatting, then filter valid time lines
    const lines = text
      .trim()
      .split(/\r?\n/)
      .map(l => l
        .trim()
        .replace(/\*\*/g, '')           // remove **bold**
        .replace(/^\d+[\.\)]\s*/, '')   // remove "1. " or "1) "
        .replace(/^[-•*]\s*/, '')       // remove "- " bullets
        .replace(/`/g, '')              // remove backticks
        .trim()
      )
      .filter(l => /^\d{1,2}:\d{2}/.test(l)); // only keep "HH:MM" lines

    console.log('Raw Gemini text:', text);
    console.log('Parsed lines count:', lines.length);
    console.log('Parsed lines:', lines);

    // ✅ Always enforce the 3 fixed tasks, even if AI skipped them
    const fixed = [
      "08:30 - 09:15 - 🚗 Drop Amma at work",
      "12:30 - 13:15 - 🥗 Lunch break",
      "17:30 - 18:15 - 🚗 Pick up Amma from work"
    ];

    // If AI returned 0 valid lines, use full fallback
    if (lines.length === 0) {
      const fallback = [
        "08:30 - 09:15 - 🚗 Drop Amma at work",
        "09:15 - 12:30 - 🏦 Banking aptitude and quantitative practice",
        "12:30 - 13:15 - 🥗 Lunch break",
        "13:15 - 15:30 - 💻 React web app coding and development",
        "15:30 - 17:30 - 📖 English grammar and current affairs study",
        "17:30 - 18:15 - 🚗 Pick up Amma from work"
      ];
      return res.status(200).json({ schedule: fallback.join('\n') });
    }

    // ✅ Merge: remove AI lines that conflict with fixed times, then add fixed
    const fixedTimes = ['08:30', '12:30', '17:30'];
    const aiOnlyLines = lines.filter(l => {
      return !fixedTimes.some(ft => l.startsWith(ft));
    });

    // Build final schedule: fixed + AI tasks, sorted by time
    const allLines = [...fixed, ...aiOnlyLines]
      .slice(0, 6)
      .sort((a, b) => {
        const timeA = a.match(/^(\d{1,2}):(\d{2})/);
        const timeB = b.match(/^(\d{1,2}):(\d{2})/);
        if (!timeA || !timeB) return 0;
        return (parseInt(timeA[1]) * 60 + parseInt(timeA[2])) - (parseInt(timeB[1]) * 60 + parseInt(timeB[2]));
      });

    return res.status(200).json({ schedule: allLines.join('\n') });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}