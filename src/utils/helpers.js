import { STORAGE_KEY, PREFS_KEY, UI_STATE_KEY, PRIORITY_OPTIONS } from "./constants";

export const ipc = (() => {
  try { return window.require?.("electron")?.ipcRenderer ?? null; }
  catch (err) { return null; }
})();

export const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayKey = () => toKey(new Date());

export const timeToMinutes = (t) => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [hh, mm] = String(t).split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
};

export const hasSameStartEnd = (start, end) => {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === Number.MAX_SAFE_INTEGER || e === Number.MAX_SAFE_INTEGER) return false;
  return s === e;
};

export const isTimeLiveNow = (start, end, nowMinutes) => {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === Number.MAX_SAFE_INTEGER || e === Number.MAX_SAFE_INTEGER) return false;
  if (s < e) return nowMinutes >= s && nowMinutes < e;
  return nowMinutes >= s || nowMinutes < e;
};

export const formatTimeRange = (start, end) => {
  if (!start && !end) return "";
  const fmt = (value) => {
    if (!value) return "--:--";
    const [hh, mm] = String(value).split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return value;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  };
  return `(${fmt(start)} - ${fmt(end)})`;
};

export const goalTimeMinutes = (goal) => {
  const byStart = timeToMinutes(goal?.startTime);
  if (byStart < Number.MAX_SAFE_INTEGER) return byStart;
  return timeToMinutes(goal?.reminder);
};

export const matchesTimeFilter = (goal, filter) => {
  if (filter === "All Times") return true;
  const mins = goalTimeMinutes(goal);
  if (filter === "No Time") return mins === Number.MAX_SAFE_INTEGER;
  if (mins === Number.MAX_SAFE_INTEGER) return false;
  if (filter === "Morning") return mins >= 300 && mins < 720;
  if (filter === "Afternoon") return mins >= 720 && mins < 1020;
  if (filter === "Evening") return mins >= 1020 && mins < 1260;
  if (filter === "Night") return mins >= 1260 || mins < 300;
  return true;
};

export const calculateSession = (timeStr) => {
  const mins = timeToMinutes(timeStr);
  if (mins === Number.MAX_SAFE_INTEGER) return "Morning";
  if (mins >= 300 && mins < 720) return "Morning";
  if (mins >= 720 && mins < 1020) return "Afternoon";
  if (mins >= 1020 && mins < 1260) return "Evening";
  return "Night";
};

export const getWeekDays = (base) => {
  const start = new Date(base);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

export const normalizeGoal = (g) => {
  const startTime = g.startTime ?? "";
  const session = calculateSession(startTime);
  
  return {
    id: g.id ?? Date.now(),
    text: g.text ?? "",
    date: g.date ?? todayKey(),
    reminder: g.reminder ?? "",
    startTime,
    endTime: g.endTime ?? "",
    repeat: g.repeat ?? "None",
    session,
    priority: PRIORITY_OPTIONS.includes(g.priority) ? g.priority : "Medium",
    done: !!g.done,
    doneOn: g.doneOn ?? {},
  };
};

export const goalVisibleOn = (goal, key) => {
  if (goal.repeat === "Daily") return key >= goal.date;
  if (goal.repeat === "Weekly") return key >= goal.date && new Date(`${goal.date}T00:00:00`).getDay() === new Date(`${key}T00:00:00`).getDay();
  if (goal.repeat === "Monthly") return key >= goal.date && new Date(`${goal.date}T00:00:00`).getDate() === new Date(`${key}T00:00:00`).getDate();
  return goal.date === key;
};

export const isDoneOn = (goal, key) => (goal.repeat === "None" ? !!goal.done : !!goal.doneOn?.[key]);

export const readPersist = async (key) => {
  try {
    if (ipc?.invoke) {
      const value = await ipc.invoke("persist-get", key);
      return value == null ? "" : String(value);
    }
  } catch {}
  try {
    if (window.storage?.get) return (await window.storage.get(key))?.value || "";
  } catch {}
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

export const writePersist = async (key, value) => {
  try {
    if (ipc?.invoke) {
      await ipc.invoke("persist-set", key, value);
      return;
    }
  } catch {}
  try {
    if (window.storage?.set) {
      await window.storage.set(key, value);
      return;
    }
  } catch {}
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const readStorage = async () => readPersist(STORAGE_KEY);
export const writeStorage = async (v) => writePersist(STORAGE_KEY, v);

export const readPrefs = async () => {
  try {
    const raw = await readPersist(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("readPrefs failed to parse:", err);
    return null;
  }
};

export const writePrefs = async (prefs) => {
  try {
    await writePersist(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error("writePrefs failed:", err);
  }
};

export const readUiState = async () => {
  try {
    const raw = await readPersist(UI_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("readUiState failed to parse:", err);
    return null;
  }
};

export const writeUiState = async (uiState) => {
  try {
    await writePersist(UI_STATE_KEY, JSON.stringify(uiState));
  } catch {}
};

// 🔥 NEW PREMIUM AUDIO PLAYER 🔥
export const AudioPlayer = {
  audioContext: null,
  getContext() {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.audioContext = new Ctx();
    }
    return this.audioContext;
  },
  playSound(type) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      const n = ctx.currentTime;
      
      const playBell = (freq, time, decay) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        
        const o2 = ctx.createOscillator();
        o2.type = "triangle";
        o2.frequency.value = freq * 2; 
        const g2 = ctx.createGain();
        
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.2, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, time + decay);
        
        g2.gain.setValueAtTime(0, time);
        g2.gain.linearRampToValueAtTime(0.05, time + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, time + (decay * 0.5));

        o.connect(g); o2.connect(g2);
        g.connect(ctx.destination); g2.connect(ctx.destination);
        
        o.start(time); o2.start(time);
        o.stop(time + decay); o2.stop(time + decay);
      };

      if (type === 'complete') {
        playBell(523.25, n, 0.4);       
        playBell(659.25, n + 0.1, 0.4); 
        playBell(783.99, n + 0.2, 0.4); 
        playBell(1046.50, n + 0.3, 0.8);
      } else if (type === 'reminder') {
        playBell(880, n, 0.5);          
        playBell(1108.73, n + 0.15, 0.8); 
      } else if (type === 'taskShift') {
        playBell(587.33, n, 0.3);       
        playBell(880, n + 0.1, 0.5);    
      }
    } catch {}
  },
  playMp3(filename) {
    try {
      const audio = new Audio(`/sounds/${filename}`);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  },
  playComplete() {
    // ✅ FIX: On mobile, skip mp3 fetch (causes lag) — use AudioContext only
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (!isMobile) this.playMp3('complete.mp3');
    if (ipc?.send) ipc.send('play-sound', 'complete');
    setTimeout(() => this.playSound('complete'), 100);
  },
  playReminder() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (!isMobile) this.playMp3('reminder.mp3');
    if (ipc?.send) ipc.send('play-sound', 'reminder');
    setTimeout(() => this.playSound('reminder'), 100);
  },
  playTaskShift() {
    this.playSound('taskShift');
  }
};

export const playSuccessTone = () => AudioPlayer.playTaskShift();
export const playTaskCompleteTone = () => AudioPlayer.playComplete();

export const weeklyStats = (goals) => {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toKey(d);
    const visible = goals.filter((g) => goalVisibleOn(g, key));
    const done = visible.filter((g) => isDoneOn(g, key)).length;
    const total = visible.length;
    days.push({ key, name: d.toLocaleDateString("en-IN", { weekday: "short" }), done, total, pct: total ? Math.round((done / total) * 100) : 0 });
  }
  const weekDone = days.reduce((a, b) => a + b.done, 0);
  const weekTotal = days.reduce((a, b) => a + b.total, 0);
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
  const bestDay = days.reduce((best, d) => (!best || d.pct > best.pct ? d : best), null);
  return { days, weekDone, weekTotal, weekPct, bestDay };
};

export const completionStreak = (goals) => {
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toKey(d);
    const visible = goals.filter((g) => goalVisibleOn(g, key));
    const doneCount = visible.filter((g) => isDoneOn(g, key)).length;
    if (doneCount === 0) break;
    streak += 1;
  }
  return streak;
};

export const generateHeatmapData = (goals, daysCount = 90) => {
  const data = [];
  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toKey(d);
    const visible = goals.filter((g) => goalVisibleOn(g, key));
    const done = visible.filter((g) => isDoneOn(g, key)).length;
    data.push({ date: key, count: done, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) });
  }
  return data;
};

export const analyzeHabits = (goals) => {
  // ✅ FIX 15: Smarter habit detection — tracks frequency, completion rate, and time patterns
  if (!goals || goals.length === 0) return [];

  const habitMap = {};

  goals.forEach(g => {
    if (!g.text || !g.startTime) return;
    const cleanText = g.text.trim().toLowerCase();
    const mins = timeToMinutes(g.startTime);
    if (mins === Number.MAX_SAFE_INTEGER) return;

    if (!habitMap[cleanText]) habitMap[cleanText] = { times: [], done: 0, total: 0 };
    habitMap[cleanText].times.push(mins);
    habitMap[cleanText].total++;
    if (g.done || (g.doneOn && Object.keys(g.doneOn).length > 0)) habitMap[cleanText].done++;
  });

  const suggestions = [];
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // Check if task already added today
  const todayTexts = new Set(goals.filter(g => g.date === today).map(g => g.text.trim().toLowerCase()));

  Object.entries(habitMap).forEach(([text, data]) => {
    if (data.times.length < 2) return;
    if (todayTexts.has(text)) return; // Already added today

    const avgMins = data.times.reduce((a, b) => a + b, 0) / data.times.length;
    const completionRate = data.total > 0 ? data.done / data.total : 0;

    // Suggest if: within 90 mins of usual time AND decent completion rate
    if (Math.abs(nowMins - avgMins) < 90 && completionRate >= 0.5) {
      suggestions.push({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        avgMins,
        completionRate: Math.round(completionRate * 100),
        frequency: data.total,
        timeStr: `${Math.floor(avgMins / 60)}:${String(Math.floor(avgMins % 60)).padStart(2, '0')}`,
      });
    }
  });

  // Sort by frequency (most repeated first), limit to 2
  return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, 2);
};

export const parseTimeToken = (token) => {
  const match = String(token || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return "";
  let hh = Number(match[1]);
  const mm = Number(match[2]);
  const ampm = match[3]?.toUpperCase() || "";
  if (Number.isNaN(hh) || Number.isNaN(mm) || mm < 0 || mm > 59) return "";
  if (ampm) {
    if (hh < 1 || hh > 12) return "";
    if (ampm === "AM") hh = hh % 12;
    if (ampm === "PM") hh = (hh % 12) + 12;
  } else if (hh < 0 || hh > 23) {
    return "";
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export const sessionFromStartTime = (startTime) => {
  const mins = timeToMinutes(startTime);
  if (mins === Number.MAX_SAFE_INTEGER) return "Morning";
  if (mins < 12 * 60) return "Morning";
  if (mins < 19 * 60) return "Afternoon";
  return "Evening";
};

export const parseTaskLine = (line, fallback = {}) => {
  const raw = String(line || "").trim().replace(/^\s*[-*]\s*/, "");
  const rangeMatch = raw.match(/^\[?\s*(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)\s*[–—-]\s*(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)\s*\]?\s*(.+)$/);
  if (!rangeMatch) {
    const text = raw.trim();
    return {
      text,
      startTime: fallback.startTime || "",
      endTime: fallback.endTime || "",
      reminder: fallback.reminder || "",
      session: fallback.session || "Morning",
      matchedRange: false,
    };
  }
  const startTime = parseTimeToken(rangeMatch[1]);
  const endTime = parseTimeToken(rangeMatch[2]);
  const text = (rangeMatch[3] || "").trim();
  const session = sessionFromStartTime(startTime || fallback.startTime || "");
  return {
    text: text || raw,
    startTime: startTime || fallback.startTime || "",
    endTime: endTime || fallback.endTime || "",
    reminder: startTime || fallback.reminder || "",
    session,
    matchedRange: true,
  };
};

export const formatCountdown = (remainingMs) => {
  if (remainingMs <= 0) return "Task ended";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) return `⏱ ${hours} hr ${minutes} min remaining`;
  if (minutes > 0) return `⏱ ${minutes} min ${seconds} sec remaining`;
  return `⏱ ${seconds} sec remaining`;
};

export const getTimeRemainingMs = (endTime) => {
  if (!endTime) return null;
  const [hh, mm] = endTime.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  
  const now = new Date();
  const end = new Date();
  end.setHours(hh, mm, 0, 0);
  
  if (end <= now) end.setDate(end.getDate() + 1);
  return end.getTime() - now.getTime();
};