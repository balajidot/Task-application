// Gemini AI — Task List Optimization
// File location: api/optimize.js

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
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  const { tasks, language = 'en' } = req.body;
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are a productivity expert. Re-sequence these tasks for a person to have a perfect daily flow. 
  Assign optimized StartTime and EndTime for each task if they are missing or suboptimal. 
  Ensure higher priority tasks are addressed earlier or when most effective.
  
TASKS TO OPTIMIZE:
${JSON.stringify(tasks)}

INSTRUCTIONS:
1. Return ONLY a valid JSON array of tasks.
2. Keep the original task IDs.
3. Add or update 'startTime' and 'endTime' (Format: "HH:MM").
4. Response must be ONLY the JSON array inside <OPTIMIZED_JSON> tags.
5. All descriptive fields must remain in ${outputLanguage}.

<OPTIMIZED_JSON>
[ ... ]
</OPTIMIZED_JSON>`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/<OPTIMIZED_JSON>([\s\S]*?)<\/OPTIMIZED_JSON>/);
    const optimizedTasks = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;

    if (!optimizedTasks) {
      throw new Error('Could not parse optimized tasks');
    }

    return res.status(200).json({ optimizedTasks });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
