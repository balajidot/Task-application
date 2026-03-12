// 🤖 Gemini AI — Auto Task Generator
// File location: api/gemini.js (in your project ROOT folder)
// Vercel serverless function — called from App.jsx

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from Vercel environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' });
  }

  const { userName, existingTasks = [], date, context = '' } = req.body;

  // Build smart prompt
  const todayDate = date || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const existingText = existingTasks.length > 0
    ? `The user already has these tasks today: ${existingTasks.map(t => t.text).join(', ')}.`
    : 'The user has no tasks planned yet.';

  const prompt = `You are a world-class productivity coach. Create a realistic, motivating daily schedule for ${userName || 'the user'} for ${todayDate}.

${existingText}
${context ? `Additional context: ${context}` : ''}

Generate exactly 6 tasks with specific time slots. Follow this EXACT format (one task per line, nothing else):
HH:MM - HH:MM - [emoji] Task description

Rules:
- Use 24-hour time format (e.g. 09:00 - 10:30)
- Start from 08:00 or 09:00
- Include 1 short break and 1 lunch
- Make tasks specific and actionable
- Use relevant emojis
- End by 18:00
- NO numbering, NO headers, NO extra text — ONLY the 6 lines

Example output format:
09:00 - 10:30 - 🧠 Deep work: focus on most important project
10:30 - 10:45 - ☕ Short break and stretch
10:45 - 12:00 - 📧 Clear emails and reply to messages
12:00 - 13:00 - 🥗 Lunch break
13:00 - 15:00 - 🤝 Team meetings and collaboration
15:00 - 17:00 - ✅ Complete pending tasks and review progress`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 400,
            topP: 0.9,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return res.status(500).json({ error: 'Gemini API request failed', details: errData });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    // Clean the output — remove any extra lines that don't match HH:MM format
    const lines = text
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^\d{2}:\d{2}/.test(l));  // only lines starting with time

    return res.status(200).json({ schedule: lines.join('\n') });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}