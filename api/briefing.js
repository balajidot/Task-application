// Gemini AI — Daily Briefing & Insights
// File location: api/briefing.js

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
    return res.status(429).json({ error: 'Too many requests.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel environment variables. Please add it to your project settings.' });
  }

  const { appData = {}, language = 'en', userName = 'User' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an AI Personal Assistant. Create a short (2-3 sentence) energetic daily briefing for ${userName}.
  
USER STATS:
- Tasks Done: ${appData.done}/${appData.total}
- Streak: ${appData.streakDays} days
- High Priority Tasks Pending: ${appData.highPriorityCount}
- Career Skill Progress: ${JSON.stringify(appData.careerProgress || [])}
- Recent Mood: ${appData.recentMood || 'Unknown'}

INSTRUCTIONS:
1. Be very concise (max 50 words).
2. Be encouraging.
3. Mention one specific thing they should focus on (e.g., high priority tasks or career skills).
4. Respond ONLY in ${outputLanguage}.
5. Use 1-2 emojis.

BRIEFING:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(500).json({ 
        error: 'Gemini API failed', 
        status: response.status,
        message: errData?.error?.message || 'Unknown Gemini error' 
      });
    }

    const data = await response.json();
    const briefing = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ briefing });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
