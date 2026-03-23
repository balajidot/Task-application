// AI Coach — Groq (Primary) + Gemini (Fallback)
import { enforceRateLimit, getClientKey } from './_rateLimit.js';

function getLocalFallback(message, appData, language) {
  const msg  = (message || '').toLowerCase();
  const lang = language === 'ta';
  const { goals = [], habits = [] } = appData || {};
  const done    = goals.filter(g => g.done).length;
  const total   = goals.length;
  const pending = total - done;

  if (msg.includes('analysis') || msg.includes('analyze') || msg.includes('performance') || msg.includes('progress') || msg.includes('பகுப்பாய்வு')) {
    return lang
      ? `📊 உங்கள் முன்னேற்றம்:\n\n✅ முடிந்தது: ${done}/${total} பணிகள்\n⏳ நிலுவை: ${pending} பணிகள்\n🔥 பழக்கங்கள்: ${habits.length}\n\nதொடர்ந்து உழைப்பீர்கள்! 💪`
      : `📊 Your progress:\n\n✅ Done: ${done}/${total} tasks\n⏳ Pending: ${pending} tasks\n🔥 Active habits: ${habits.length}\n\nKeep pushing! 💪`;
  }
  if (msg.includes('today') || msg.includes('plan') || msg.includes('schedule') || msg.includes('இன்று') || msg.includes('திட்டம்')) {
    const today     = new Date().toISOString().split('T')[0];
    const todayList = goals.filter(g => g.date === today && !g.done).slice(0, 3);
    const taskStr   = todayList.length > 0
      ? todayList.map((t, i) => `${i+1}. ${t.text}${t.startTime ? ` (${t.startTime})` : ''}`).join('\n')
      : (lang ? 'இன்று பணிகள் இல்லை' : 'No tasks for today');
    return lang
      ? `📅 இன்றைய பணிகள்:\n\n${taskStr}\n\nகவனம் செலுத்துங்கள்! 🎯`
      : `📅 Today's tasks:\n\n${taskStr}\n\nStay focused! 🎯`;
  }
  if (msg.includes('habit') || msg.includes('streak') || msg.includes('பழக்கம்')) {
    return lang
      ? `🔥 உங்களிடம் ${habits.length} பழக்கங்கள் உள்ளன. தினமும் தொடர்ந்து செய்யுங்கள்!`
      : `🔥 You have ${habits.length} active habits. Consistency is the key!`;
  }
  if (msg.includes('focus') || msg.includes('productiv') || msg.includes('கவனம்')) {
    return lang
      ? `🧠 கவனம் tips:\n\n1. Pomodoro: 25 min work + 5 min break\n2. Phone notifications off\n3. ஒரு நேரத்தில் ஒரு பணி\n4. குறிக்கோள் தெளிவாக வை`
      : `🧠 Focus tips:\n\n1. Pomodoro: 25 min work + 5 min break\n2. Turn off notifications\n3. One task at a time\n4. Keep your goal visible`;
  }
  return lang
    ? `👋 வணக்கம்! இதை try பண்ணுங்கள்:\n• "இன்றைய திட்டம்"\n• "என் முன்னேற்றம்"\n• "கவனம் tips"`
    : `👋 Hello! Try asking:\n• "Today's plan"\n• "Analyze my progress"\n• "Focus tips"\n• "How are my habits?"`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { message, appData = {}, language = 'en' } = req.body || {};
  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const { goals = [], habits = [] } = appData;
  const outputLang = language === 'ta' ? 'Tamil' : 'English';

  const prompt = `You are a friendly AI Productivity Coach.
User message: "${message}"
Stats: ${goals.length} tasks (${goals.filter(g=>g.done).length} done), ${habits.length} habits.
Respond in ${outputLang}. Be helpful, concise (under 120 words), use emojis.
For adding tasks: <ACTIONS_JSON>[{"type":"ADD_TASKS","tasks":[{"text":"...","startTime":"HH:MM","endTime":"HH:MM","priority":"High/Medium/Low","session":"Morning","date":"YYYY-MM-DD"}]}]</ACTIONS_JSON>`;

  // ─── Groq Primary ────────────────────────────────────────────────────────
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300, temperature: 0.7,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok) {
        const aiText = data?.choices?.[0]?.message?.content || '';
        let actions = [];
        const m = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
        if (m) { try { actions = JSON.parse(m[1].trim()); } catch {} }
        return res.status(200).json({ response: aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim(), actions });
      }
    } catch {}
  }

  // ─── Gemini Fallback ──────────────────────────────────────────────────────
  if (geminiKey) {
    for (const model of [
      { v: 'v1beta', n: 'gemini-2.0-flash' },
      { v: 'v1beta', n: 'gemini-2.0-flash-lite' },
      { v: 'v1',     n: 'gemini-1.5-flash' },
    ]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 400 } }),
            signal: AbortSignal.timeout(7000),
          }
        );
        const data = await r.json();
        if (r.ok) {
          const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          let actions = [];
          const m = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
          if (m) { try { actions = JSON.parse(m[1].trim()); } catch {} }
          return res.status(200).json({ response: aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/, '').trim(), actions });
        }
        if ([403, 404, 429].includes(r.status)) continue;
        break;
      } catch { continue; }
    }
  }

  // ─── Local Fallback ───────────────────────────────────────────────────────
  return res.status(200).json({ response: getLocalFallback(message, appData, language), actions: [] });
}