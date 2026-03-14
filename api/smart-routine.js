// Gemini AI — Smart Routine Filler
// File location: api/smart-routine.js

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
    return res.status(429).json({ error: 'Too many AI planning requests. Please try again in a few minutes.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel environment variables. Please add it to your project settings.' });
  }

  // Frontend-ல் இருந்து வரும் தரவுகள்
  const { userName, goals, flexibleBlocks, fixedRoutine } = req.body;
  if (typeof goals !== 'string' && goals != null) {
    return res.status(400).json({ error: 'goals must be a string when provided' });
  }
  if (typeof flexibleBlocks !== 'string' && flexibleBlocks != null) {
    return res.status(400).json({ error: 'flexibleBlocks must be a string when provided' });
  }
  if (typeof fixedRoutine !== 'string' && fixedRoutine != null) {
    return res.status(400).json({ error: 'fixedRoutine must be a string when provided' });
  }

  // AI-ஐக் கட்டுப்படுத்தும் மிகத் துல்லியமான Prompt
  const prompt = `You are an elite productivity engineer. Your job is to fill the user's empty time blocks with highly productive tasks without touching their fixed schedule.

USER PROFILE:
- Name: ${userName || 'The User'}
- Primary Goals: ${goals || 'Coding, Learning, Interview Prep'}

CONSTRAINTS & RULES (READ CAREFULLY):
1. The user has a strict fixed routine: ${fixedRoutine || 'Unknown'}. DO NOT suggest anything during these times.
2. Here are the ONLY available empty time blocks: ${flexibleBlocks || 'None'}.
3. Generate exactly ONE highly specific, deep-work task for EACH flexible block provided.
4. The tasks MUST directly align with the User's Primary Goals.
5. Return ONLY a valid JSON array of objects. Do not use markdown blocks like \`\`\`json. 

EXPECTED JSON FORMAT:
[
  {
    "time_slot": "10:00 - 12:00",
    "task_title": "Build the Authentication API",
    "why_it_matters": "Directly moves your coding project forward."
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }),
        signal: AbortSignal.timeout(20000)
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(500).json({ error: 'API failed', details: errData });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Empty response' });
    }

    // AI அனுப்பிய JSON-ஐப் பாதுகாப்பாகப் பிரித்தெடுத்தல்
    const suggestedTasks = JSON.parse(text);

    return res.status(200).json({ suggestions: suggestedTasks });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
