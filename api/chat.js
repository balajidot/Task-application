// AI Coach — Full App Control + Tamil Persistence
import { enforceRateLimit, getClientKey } from './_rateLimit.js';

function detectLanguage(message, defaultLang) {
  if (/[\u0B80-\u0BFF]/.test(message)) return 'ta';
  const msg = (message || '').toLowerCase();
  const tamilTriggers = ['tamil','tamila','tamil la','pesu','sollu','pesanum','solu','vanakkam','nandri','enna','epdi','panna','pannu','iruku','irukku','venum','vendum','seri','ok da','da ','di ','bro '];
  if (tamilTriggers.some(t => msg.includes(t))) return 'ta';
  if (msg.includes('english') || msg.includes('speak english')) return 'en';
  return defaultLang;
}

function getLocalFallback(message, appData, lang) {
  const msg = (message || '').toLowerCase();
  const { goals = [], habits = [] } = appData || {};
  const done = goals.filter(g => g.done).length;
  const total = goals.length;
  const isTa = lang === 'ta';

  if (msg.includes('progress') || msg.includes('analysis') || msg.includes('munnetram') || msg.includes('பகுப்பாய்வு')) {
    return isTa
      ? `📊 உங்கள் முன்னேற்றம்:\n✅ முடிந்தது: ${done}/${total}\n⏳ நிலுவை: ${total-done}\n🔥 பழக்கங்கள்: ${habits.length}\n\nதொடர்ந்து உழைப்பீர்கள்! 💪`
      : `📊 Progress: ${done}/${total} done, ${total-done} pending, ${habits.length} habits. Keep going! 💪`;
  }
  if (msg.includes('today') || msg.includes('inru') || msg.includes('இன்று')) {
    const today = new Date().toISOString().split('T')[0];
    const list = goals.filter(g => g.date === today && !g.done).slice(0,3);
    const str = list.length ? list.map((t,i) => `${i+1}. ${t.text}`).join('\n') : (isTa ? 'இன்று பணிகள் இல்லை' : 'No tasks today');
    return isTa ? `📅 இன்றைய பணிகள்:\n${str}` : `📅 Today:\n${str}`;
  }
  return isTa
    ? `வணக்கம்! 👋 நான் உங்கள் AI Coach.\n\n• "இன்றைய திட்டம்"\n• "task add pannu: [பணி பெயர்]"\n• "என் முன்னேற்றம்"\n• "habit add pannu"`
    : `👋 Hello! I'm your AI Coach.\n\n• "Today's plan"\n• "Add task: [task name]"\n• "Analyze progress"\n• "Add habit"`;
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

  const { message, appData = {}, language = 'en', conversationLang } = req.body || {};

  // ✅ FIX 1: Language persistence — use conversationLang if set
  const detectedLang = conversationLang || detectLanguage(message, language);
  const isTamil      = detectedLang === 'ta';
  const { goals = [], habits = [] } = appData;
  const today        = new Date().toISOString().split('T')[0];
  const todayTasks   = goals.filter(g => g.date === today && !g.done).slice(0, 5).map(g => `- ${g.text}${g.startTime ? ` (${g.startTime})` : ''}`).join('\n') || (isTamil ? 'இன்று பணிகள் இல்லை' : 'No tasks today');

  // ✅ FIX 2: Full system prompt with ALL actions
  const systemPrompt = isTamil ? `
நீங்கள் ஒரு Tamil AI Life Coach. எல்லா responses-உம் தமிழிலேயே மட்டும் பதில் சொல்லவும். ஒருபோதும் English-ல் மாறாதீர்கள்.

User data:
- Tasks: ${goals.length} total, ${goals.filter(g=>g.done).length} done, ${goals.length - goals.filter(g=>g.done).length} pending
- Habits: ${habits.length} active
- Today's tasks: ${todayTasks}

முக்கியம்: Task add பண்ண, navigate பண்ண, settings மாத்த — எல்லாவற்றிற்கும் ACTIONS_JSON use பண்ணவும்.
Response 100 words-க்கு உள்ளே வை. Emojis use பண்ணவும்.
` : `
You are a helpful English AI Life Coach. Always respond in English only.

User data:
- Tasks: ${goals.length} total, ${goals.filter(g=>g.done).length} done, ${goals.length - goals.filter(g=>g.done).length} pending
- Habits: ${habits.length} active
- Today's tasks: ${todayTasks}

Use ACTIONS_JSON for all app control actions.
Keep responses under 100 words. Use emojis.
`;

  const actionsGuide = `
AVAILABLE ACTIONS (use when needed):

1. Add tasks:
<ACTIONS_JSON>[{"type":"ADD_TASKS","tasks":[{"text":"Task name","startTime":"09:00","endTime":"10:00","priority":"High","session":"Morning","date":"${today}"}]}]</ACTIONS_JSON>

2. Navigate to a view:
<ACTIONS_JSON>[{"type":"SET_VIEW","value":"tasks"}]</ACTIONS_JSON>
Views: tasks, planner, analytics, settings, habits, goals, chat

3. Switch theme:
<ACTIONS_JSON>[{"type":"SET_THEME","value":"dark"}]</ACTIONS_JSON>

4. Switch language:
<ACTIONS_JSON>[{"type":"SET_LANGUAGE","value":"ta"}]</ACTIONS_JSON>
`;

  const userPrompt = isTamil
    ? `பயனர் சொல்கிறார்: "${message}"\n\nதமிழிலேயே பதில் சொல்லவும்.\n${actionsGuide}`
    : `User says: "${message}"\n\nRespond in English.\n${actionsGuide}`;

  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // ─── Groq Primary ────────────────────────────────────────────────────────
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt   },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json();
      if (r.ok) {
        const aiText = data?.choices?.[0]?.message?.content || '';
        let actions = [];
        const m = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
        if (m) {
          try {
            const parsed = JSON.parse(m[1].trim());
            actions = Array.isArray(parsed) ? parsed : [parsed];
          } catch {}
        }
        const clean = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/g, '').trim();
        return res.status(200).json({ response: clean, actions, detectedLang });
      }
    } catch {}
  }

  // ─── Gemini Fallback ──────────────────────────────────────────────────────
  if (geminiKey) {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    for (const model of [
      { v: 'v1beta', n: 'gemini-2.0-flash'      },
      { v: 'v1beta', n: 'gemini-2.0-flash-lite' },
      { v: 'v1',     n: 'gemini-1.5-flash'      },
    ]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/${model.v}/models/${model.n}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
            }),
            signal: AbortSignal.timeout(7000),
          }
        );
        const data = await r.json();
        if (r.ok) {
          const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          let actions = [];
          const m = aiText.match(/<ACTIONS_JSON>([\s\S]*?)<\/ACTIONS_JSON>/);
          if (m) {
            try {
              const parsed = JSON.parse(m[1].trim());
              actions = Array.isArray(parsed) ? parsed : [parsed];
            } catch {}
          }
          const clean = aiText.replace(/<ACTIONS_JSON>[\s\S]*?<\/ACTIONS_JSON>/g, '').trim();
          return res.status(200).json({ response: clean, actions, detectedLang });
        }
        if ([403, 404, 429].includes(r.status)) continue;
        break;
      } catch { continue; }
    }
  }

  // ─── Local Fallback ───────────────────────────────────────────────────────
  return res.status(200).json({
    response: getLocalFallback(message, appData, detectedLang),
    actions: [],
    detectedLang,
  });
}