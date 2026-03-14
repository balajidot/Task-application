// Gemini AI — Conversational Analysis Chat
// File location: api/chat.js

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

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
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel' });
  }

  const { message, appData, language = 'en' } = req.body;

  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an elite AI Productivity Coach. You have full access to the user's productivity data and app settings.
  
USER DATA ANALYSIS:
- Tasks: ${JSON.stringify(appData.goals || [])}
- Habits: ${JSON.stringify(appData.habits || [])}
- Career Goal: ${JSON.stringify(appData.career || {})}
- Journal/Mindset: ${JSON.stringify(appData.journalEntries || [])}

APP SETTINGS:
- Current Language: ${language}
- (Assume other settings like Theme are available via commands)

USER MESSAGE: "${message}"

INSTRUCTIONS:
1. Analyze the user's message. If they ask to change an app setting (Language, Theme, or Switch View), you must perform the action.
2. If the user asks for a "Schedule" or "Today's plan", suggest tasks.
3. CRITICAL: For any app actions or task additions, you MUST provide a structured JSON block inside <ACTIONS_JSON>[...]</ACTIONS_JSON> tags at the END of your response.
   - For Language: {"type": "SET_LANGUAGE", "value": "ta" | "en"}
   - For Theme: {"type": "SET_THEME", "value": "dark" | "ocean-dark" | "midnight" | "cyber-neon" | "sunset-light" | etc}
   - For View: {"type": "SET_VIEW", "value": "tasks" | "insights" | "planner" | "analytics" | "habits" | "journal" | "career" | "settings"}
   - For Tasks: {"type": "ADD_TASKS", "tasks": [{"text": "...", "startTime": "...", "endTime": "...", "session": "...", "priority": "...", "date": "${new Date().toISOString().split('T')[0]}"}]}
4. Be encouraging but professional.
5. Respond ONLY in ${outputLanguage}.
6. Use emojis to make the chat engaging.

RESPONSE:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(500).json({ error: 'Gemini API failed', details: errData });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    
    // Extract structured actions if present
    let actions = [];
    const actionsMatch = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
    if (actionsMatch) {
      try {
        actions = JSON.parse(actionsMatch[1].trim());
      } catch (e) {
        console.error('Failed to parse suggested actions:', e);
      }
    }

    const cleanText = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim();

    return res.status(200).json({ response: cleanText, actions });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
