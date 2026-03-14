// Gemini AI — Smart Task Parser
// File location: api/parse-task.js

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

  const { text, language = 'en' } = req.body;
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are an AI Task Analyst. Extract task details from the following input: "${text}".
  
INSTRUCTIONS:
1. Identify 'text' (task title), 'startTime' (HH:MM), 'endTime' (HH:MM), 'priority' (High/Medium/Low), and 'date' (YYYY-MM-DD).
2. If the user mentions a time like "tomorrow morning", adjust the 'date' accordingly (Today is ${new Date().toISOString().split('T')[0]}).
3. Use ${outputLanguage} for the 'text' field.
4. Return ONLY valid JSON inside <TASK_JSON> tags.

<TASK_JSON>
{
  "text": "...",
  "startTime": "...",
  "endTime": "...",
  "priority": "...",
  "date": "..."
}
</TASK_JSON>`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 500,
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
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = resultText.match(/<TASK_JSON>([\s\S]*?)<\/TASK_JSON>/);
    const parsedTask = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null;

    if (!parsedTask) {
      throw new Error('Could not parse task details');
    }

    return res.status(200).json({ parsedTask });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
