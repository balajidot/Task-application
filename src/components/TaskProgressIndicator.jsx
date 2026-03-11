import React, { useEffect, useMemo, useState } from 'react';

const TaskProgressIndicator = ({
  startTime,
  endTime,
  currentTime,
  variant,
  taskText,
  timeText,
  upNextText,
  upNextTime,
  dayDone,
  dayTotal,
  dayPct,
}) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    if (!startTime || !endTime) {
      return { progress: 0, remaining: 100, color: '#10b981', blocks: '░░░░░░░░░░' };
    }

    const toBaseDate = (hh, mm, ss = 0) => new Date(2000, 0, 1, hh, mm, ss, 0);
    const parseTime = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
      if (!m) return null;
      let hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = m[3] ? Number(m[3]) : 0;
      const ampm = (m[4] || '').toUpperCase();
      if (Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss)) return null;
      if (mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;
      if (ampm) {
        if (hh < 1 || hh > 12) return null;
        if (ampm === 'AM') hh = hh % 12;
        if (ampm === 'PM') hh = (hh % 12) + 12;
      } else {
        if (hh < 0 || hh > 23) return null;
      }
      return { hh, mm, ss };
    };

    const startParts = parseTime(startTime);
    const endParts = parseTime(endTime);
    const start = startParts ? toBaseDate(startParts.hh, startParts.mm, 0) : null;
    const end = endParts ? toBaseDate(endParts.hh, endParts.mm, 0) : null;
    if (!start || !end) return { progress: 0, remaining: 100, color: '#10b981', blocks: '░░░░░░░░░░' };

    // If end is before start, treat it as crossing midnight.
    if (end <= start) end.setDate(end.getDate() + 1);

    // IMPORTANT: use a real "live now" that updates every second.
    const realNow = new Date();
    const now = toBaseDate(realNow.getHours(), realNow.getMinutes(), 0);

    // If we're past midnight and schedule crosses midnight, align "now" too.
    if (now < start && end > start) now.setDate(now.getDate() + 1);

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const progress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
    const remaining = Math.max(0, Math.round(100 - progress));

    const color = progress < 60 ? '#10b981' : progress < 85 ? '#f59e0b' : '#ef4444';
    const filled = Math.max(0, Math.min(10, Math.round(progress / 10)));
    const blocks = `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;

    const msLeft = Math.max(0, end.getTime() - now.getTime());
    const minutesLeft = Math.max(0, Math.ceil(msLeft / 60000));

    return { progress, remaining, color, blocks, minutesLeft };
  }, [startTime, endTime, currentTime, tick]);

  if (!startTime || !endTime) return null;

  const isPremium = variant === "premium";
  if (!isPremium) {
    return (
      <div className="task-progress-indicator">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${computed.progress}%`,
              background: computed.color,
              transition: 'width 1s linear, background-color 300ms ease',
            }}
          />
        </div>
        <div className="progress-text">
          {Math.round(computed.progress)}% elapsed
        </div>
      </div>
    );
  }

  const match = String(taskText || "").trim().match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
  const emoji = match ? match[1] : "•";
  const title = match ? (match[2] || "").trim() : String(taskText || "").trim();

  const prettyTime = String(timeText || "").replace(/\s*([AaPp][Mm])\b/g, "").replace(/\s+/g, " ").trim();
  const upNextTitleRaw = String(upNextText || "").trim();
  const upMatch = upNextTitleRaw.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
  const upEmoji = upMatch ? upMatch[1] : "▶▶";
  const upTitle = upMatch ? (upMatch[2] || "").trim() : upNextTitleRaw;
  const upTime = String(upNextTime || "").replace(/\s*([AaPp][Mm])\b/g, "").trim();

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
      {/* NOW ACTIVE CARD */}
      <div
        style={{
          borderRadius: 18,
          padding: 16,
          background: "linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e", boxShadow: "0 0 0 4px rgba(34,197,94,0.18)" }} />
            <span style={{ fontSize: 12, letterSpacing: 0.8, fontWeight: 900, color: "rgba(226,232,240,0.95)" }}>
              NOW ACTIVE
            </span>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 900,
              color: "rgba(226,232,240,0.95)",
              whiteSpace: "nowrap",
            }}
          >
            [{computed.minutesLeft}m left]
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 950, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <span>{title || "Current task"}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "rgba(226,232,240,0.75)" }}>
            {prettyTime || `${startTime} - ${endTime}`}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${computed.progress}%`,
                background: "linear-gradient(90deg, #60a5fa 0%, #fb7185 50%, #a78bfa 100%)",
                transition: "width 1s linear",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(226,232,240,0.85)" }}>
              {Math.round(computed.progress)}% completed
            </div>
          </div>
        </div>

        {/* Up next */}
        {upNextTitleRaw && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 950, color: "rgba(226,232,240,0.9)", fontSize: 13 }}>▶▶ Up next:</span>
            <div style={{ display: "grid" }}>
              <div style={{ fontWeight: 950, color: "white", fontSize: 13 }}>
                {upEmoji} {upTitle || upNextTitleRaw}
              </div>
              <div style={{ fontWeight: 800, color: "rgba(226,232,240,0.75)", fontSize: 12 }}>
                {upTime ? `at ${upTime}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DAY PROGRESS CARD */}
      <div
        style={{
          borderRadius: 16,
          padding: 14,
          background: "linear-gradient(135deg, rgba(26,26,62,0.75) 0%, rgba(45,27,105,0.55) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 950, color: "rgba(226,232,240,0.95)" }}>📊 Day Progress</div>
          <div style={{ fontWeight: 900, color: "rgba(226,232,240,0.85)", fontSize: 12, whiteSpace: "nowrap" }}>
            {Number.isFinite(dayDone) && Number.isFinite(dayTotal) ? `${dayDone}/${dayTotal} tasks` : ""}
            {(Number.isFinite(dayDone) && Number.isFinite(dayTotal)) && Number.isFinite(dayPct) ? " • " : ""}
            {Number.isFinite(dayPct) ? `${dayPct}%` : ""}
          </div>
        </div>

        <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, Number(dayPct) || 0))}%`,
              background: "linear-gradient(90deg, #22c55e 0%, #60a5fa 100%)",
              transition: "width 400ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskProgressIndicator;
