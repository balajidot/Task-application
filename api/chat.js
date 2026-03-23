// Gemini AI — Conversational AI Coach
import { enforceRateLimit, getClientKey } from './_rateLimit.js';

// ✅ Local smart fallback responses
function getLocalFallback(message, appData, language) {
  const msg  = (message || '').toLowerCase();
  const lang = language === 'ta';
  const { goals = [], habits = [] } = appData || {};
  const done    = goals.filter(g => g.done).length;
  const total   = goals.length;
  const pending = total - done;

  // Analysis
  if (msg.includes('analysis') || msg.includes('analyze') || msg.includes('performance') || msg.includes('பகுப்பாய்வு')) {
    return lang
      ? `📊 உங்கள் இன்றைய முன்னேற்றம்:\n\n✅ முடிந்தது: ${done}/${total} பணிகள்\n⏳ நிலுவை: ${pending} பணிகள்\n🔥 பழக்கங்கள்: ${habits.length} தினசரி பழக்கங்கள்\n\nதொடர்ந்து உழைப்பீர்கள்! 💪`
      : `📊 Here's your productivity snapshot:\n\n✅ Completed: ${done}/${total} tasks\n⏳ Pending: ${pending} tasks\n🔥 Active habits: ${habits.length}\n\nKeep pushing forward! 💪`;
  }

  // Today's plan
  if (msg.includes('today') || msg.includes('plan') || msg.includes('schedule') || msg.includes('இன்று') || msg.includes('திட்டம்')) {
    const todayTasks = goals.filter(g => {
      const today = new Date().toISOString().split('T')[0];
      return g.date === today && !g.done;
    }).slice(0, 3);
    const taskList = todayTasks.length > 0
      ? todayTasks.map((t, i) => `${i + 1}. ${t.text}${t.startTime ? ` (${t.startTime})` : ''}`).join('\n')
      : (lang ? 'இன்று பணிகள் இல்லை' : 'No tasks for today');
    return lang
      ? `📅 இன்றைய பணிகள்:\n\n${taskList}\n\nகவனம் செலுத்துங்கள்! 🎯`
      : `📅 Your tasks for today:\n\n${taskList}\n\nStay focused! 🎯`;
  }

  // Habits
  if (msg.includes('habit') || msg.includes('streak') || msg.includes('பழக்கம்')) {
    return lang
      ? `🔥 உங்களிடம் ${habits.length} பழக்கங்கள் உள்ளன. தினமும் தொடர்ந்து செய்யுங்கள்!`
      : `🔥 You have ${habits.length} active habits. Consistency is key — keep your streak alive!`;
  }

  // Focus / productivity tips
  if (msg.includes('focus') || msg.includes('productiv') || msg.includes('கவனம்')) {
    return lang
      ? `🧠 கவனம் அதிகரிக்க:\n\n1. Pomodoro முறை use பண்ணுங்கள் (25 min work + 5 min break)\n2. Phone notifications off பண்ணுங்கள்\n3. ஒரு நேரத்தில் ஒரு பணி மட்டும்\n4. குறிக்கோள் தெளிவாக வை`
      : `🧠 Tips to boost your focus:\n\n1. Use the Pomodoro technique (25 min work + 5 min break)\n2. Turn off notifications\n3. One task at a time\n4. Keep your goal visible`;
  }

  // Motivation
  if (msg.includes('motivat') || msg.includes('help') || msg.includes('hello') || msg.includes('hi') || msg.includes('வணக்கம்')) {
    return lang
      ? `வணக்கம்! 👋 நான் உங்கள் AI Coach.\n\nநான் உங்களுக்கு:\n📊 செயல்திறன் பகுப்பாய்வு\n📅 இன்றைய திட்டம்\n🔥 பழக்க கண்காணிப்பு\n💡 உற்பத்தித்திறன் குறிப்புகள்\n\nவழங்கலாம். என்ன help வேண்டும்?`
      : `Hello! 👋 I'm your AI Coach.\n\nI can help you with:\n📊 Performance analysis\n📅 Daily planning\n🔥 Habit tracking\n💡 Productivity tips\n\nWhat would you like help with today?`;
  }

  // Default
  return lang
    ? `🤖 புரியவில்லை. இதை try பண்ணுங்கள்:\n• "இன்றைய திட்டம்"\n• "என் முன்னேற்றம் என்ன?"\n• "கவனம் tips"`
    : `🤖 Try asking me:\n• "Today's plan"\n• "Analyze my progress"\n• "Give me focus tips"\n• "How are my habits?"`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const { message, appData = {}, language = 'en' } = req.body || {};

  // ✅ No API key → use smart local fallback immediately
  if (!apiKey) {
    return res.status(200).json({
      response: getLocalFallback(message, appData, language),
      actions: []
    });
  }

  const outputLanguage = language === 'ta' ? 'Tamil' : 'English';
  const { goals = [], habits = [] } = appData;

  const prompt = `You are an AI Personal Productivity Coach.
User message: "${message}"
User data: ${goals.length} tasks (${goals.filter(g => g.done).length} done), ${habits.length} habits.
Respond helpfully in ${outputLanguage}. Use emojis. Keep response under 150 words.

If user wants to change settings, use: <ACTIONS_JSON>[{"type": "SET_LANGUAGE", "value": "ta/en"}, {"type": "SET_VIEW", "value": "view_id"}]</ACTIONS_JSON>
If user wants to add tasks, use: <ACTIONS_JSON>[{"type": "ADD_TASKS", "tasks": [{"text": "...", "startTime": "HH:MM", "endTime": "HH:MM", "priority": "High/Medium/Low", "session": "Morning/Afternoon/Evening", "date": "YYYY-MM-DD"}]}]</ACTIONS_JSON>`;

  // ✅ Stable models only — no preview models
  const models = [
    { version: 'v1beta', name: 'gemini-2.0-flash' },
    { version: 'v1beta', name: 'gemini-2.0-flash-lite' },
    { version: 'v1',     name: 'gemini-1.5-flash' },
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
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let actions = [];
        const match = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
        if (match) {
          try { actions = JSON.parse(match[1].trim()); } catch {}
        }
        const clean = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim();
        return res.status(200).json({ response: clean, actions });
      }

      // Rate limit or quota — try next model
      if ([403, 404, 429].includes(response.status)) continue;

      // Other error — use fallback
      break;

    } catch {
      continue;
    }
  }

  // ✅ All models failed → smart local fallback (200, not 500!)
  return res.status(200).json({
    response: getLocalFallback(message, appData, language),
    actions: []
  });
}