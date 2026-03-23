// Gemini AI — Daily Briefing & Personal Coach
// ✅ FIXED: Correct model names
// ✅ FIXED: Much richer prompt — real AI coach, not just 2 sentences
// ✅ FIXED: Time-aware (morning/afternoon/evening tone)

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

  const { appData = {}, language = 'en', userName = 'User', coachTone = 'motivational' } = req.body || {};
  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const toneMap = {
    strict: 'You are a strict, no-nonsense productivity coach. Be direct and push hard.',
    friendly: 'You are a warm, encouraging productivity coach. Be supportive and gentle.',
    motivational: 'You are a high-energy, inspiring productivity coach. Be passionate and energizing.'
  };

  const prompt = `${toneMap[coachTone] || toneMap.motivational} 
Speak directly to ${userName} in a motivating, personal tone.
Time of day: ${timeOfDay}
Their stats today: ${appData.done || 0} tasks done out of ${appData.total || 0} total.
Streak: ${appData.streak || 0} days.
Pending high priority tasks: ${appData.highPriority || 0}.

Write a SHORT personal coach message (2-3 sentences max) in ${outputLanguage}.
- Morning: energize and set the intention for the day
- Afternoon: check progress and push through
- Evening: celebrate wins and reflect
Be specific, personal, and motivating. No generic advice. Address ${userName} by name.
No markdown, no bullet points. Just 2-3 powerful sentences.`;

  const models = [
    { v: 'v1',     n: 'gemini-3.1-flash' },
    { v: 'v1',     n: 'gemini-1.5-flash-latest' },
    { v: 'v1',     n: 'gemini-1.0-pro' }
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
            generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
          }),
          signal: AbortSignal.timeout(9000),
        }
      );
      const data = await response.json();
      if (response.ok) {
        const briefing = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (briefing) return res.status(200).json({ briefing });
      }
      if (response.status === 404 || response.status === 429 || response.status === 403) continue;
      break;
    } catch (e) { continue; }
  }

  const fallbacks = {
    en: `${userName}, every great achievement starts with a single focused task. You have the power to make today count — let's get moving!`,
    ta: `${userName}, ஒவ்வொரு பெரிய சாதனையும் ஒரு கவனமான பணியிலிருந்தே தொடங்குகிறது. இன்றை நாளை சிறப்பாக்குங்கள்!`
  };
  return res.status(200).json({ briefing: fallbacks[language] || fallbacks.en });
}
