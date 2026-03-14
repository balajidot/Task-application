/**
 * AI Assistant Logic for Task Planner
 * Analyzes app data (goals, habits, career, journal) to provide personalized coaching.
 */

export const analyzeAppData = (data, lang = 'en') => {
  const { goals = [], habits = [], career = {}, journalEntries = [] } = data;
  
  // Basic Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.done).length;
  const highPriority = goals.filter(g => g.priority === 'High' && !g.done).length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  // Habit Stats
  const totalHabits = habits.length;
  const habitStreaks = habits.map(h => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (h.checked?.[key]) streak++;
      else break;
    }
    return streak;
  });
  const maxStreak = Math.max(0, ...habitStreaks);
  
  // Career Stats
  const careerSkills = career.skills || [];
  const avgSkillProgress = careerSkills.length > 0 
    ? Math.round(careerSkills.reduce((acc, s) => acc + s.progress, 0) / careerSkills.length)
    : 0;

  // Journal (Mood) Stats
  const moods = journalEntries.map(e => e.mood).filter(Boolean);
  const moodCount = moods.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {});
  const topMood = Object.keys(moodCount).sort((a, b) => moodCount[b] - moodCount[a])[0] || "neutral";

  // Detailed Analysis (English)
  const analysisEn = {
    overview: `📊 **Overview**: You have ${totalGoals} tasks (${completedGoals} done). Your completion rate is ${completionRate}%. You have ${highPriority} high-priority items waiting.`,
    habits: totalHabits > 0 
      ? `🔥 **Habits**: Consistency is strong! Your best streak is ${maxStreak} days. Keep maintaining your ${totalHabits} active habits.` 
      : "🌱 **Habits**: No habits tracked yet. Start small to build long-term discipline.",
    career: careerSkills.length > 0 
      ? `🚀 **Career**: Aiming for "${career.goal}". Your skill readiness is ${avgSkillProgress}%. Focusing on ${careerSkills.length} key skills.`
      : "🎯 **Career**: Define your career goal in the Career tab to get tailored help.",
    journal: moods.length > 0
      ? `🧠 **Mindset**: Based on your journal, your recent mood has been mostly **${topMood}**. Reflecting helps clarity.`
      : "📓 **Mindset**: No journal entries yet. Writing down thoughts reduces mental stress.",
    suggestion: completionRate < 50 
      ? "💡 **Coach Tip**: Your consistency is low. Try the 'Eat the Frog' method — finish your hardest High-Priority task first thing in the morning."
      : "💡 **Coach Tip**: Great momentum! You are ready for 'Deep Work'. Set aside 90 minutes for your most complex Career project."
  };

  // Detailed Analysis (Tamil)
  const analysisTa = {
    overview: `📊 **கண்ணோட்டம்**: உங்கள் பிளானரில் ${totalGoals} பணிகள் உள்ளன (${completedGoals} முடிந்துள்ளன). நிறைவு விகிதம் ${completionRate}%. ${highPriority} முக்கிய பணிகள் மீதமுள்ளன.`,
    habits: totalHabits > 0 
      ? `🔥 **பழக்கங்கள்**: மிகச்சிறப்பு! உங்கள் சிறந்த ஸ்ட்ரீக் (Streak) ${maxStreak} நாட்கள். உங்கள் ${totalHabits} பழக்கங்களை தொடர்ந்து கடைப்பிடியுங்கள்.` 
      : "🌱 **பழக்கங்கள்**: இன்னும் பழக்க வழக்கங்கள் சேர்க்கப்படவில்லை. சிறியதாக தொடங்கி பெரிய முன்னேற்றம் அடையுங்கள்.",
    career: careerSkills.length > 0 
      ? `🚀 **கேரியர்**: உங்கள் இலக்கு "${career.goal}". உங்கள் திறன் முன்னேற்றம் ${avgSkillProgress}%. ${careerSkills.length} முக்கிய திறன்களை வளர்த்து வருகிறீர்கள்.`
      : "🎯 **கேரியர்**: Career Tab-ல் உங்கள் இலக்கை நிர்ணயித்தால், நான் இன்னும் சிறப்பாக உதவ முடியும்.",
    journal: moods.length > 0
      ? `🧠 **மனநிலை**: உங்கள் ஜர்னல் படி, சமீபத்தில் உங்கள் மனநிலை பெரும்பாலும் **${topMood}** ஆக உள்ளது. எண்ணங்களை எழுதுவது தெளிவைத் தரும்.`
      : "📓 **மனநிலை**: இன்னும் ஜர்னல் எழுதவில்லை. எண்ணங்களை எழுதுவது மன அழுத்தத்தைக் குறைக்கும்.",
    suggestion: completionRate < 50 
      ? "💡 **ஆலோசனை**: உங்கள் வேகம் குறைவாக உள்ளது. 'Eat the Frog' முறையைப் பின்பற்றுங்கள் — காலையில் எழுந்ததும் மிகக் கடினமான பணியை முதலில் முடியுங்கள்."
      : "💡 **ஆலோசனை**: அட்டகாசமான வேகம்! இன்று உங்கள் மிக முக்கியமான கேரியர் புராஜெக்டிற்கு 90 நிமிடங்கள் ஒதுக்கி ஆழ்ந்து வேலை செய்யுங்கள்."
  };

  return lang === 'ta' ? analysisTa : analysisEn;
};

export const getAssistantResponse = (message, data, lang = 'en') => {
  const msg = message.toLowerCase();
  const analysis = analyzeAppData(data, lang);

  const isFullReportRequest = msg.includes('analyze') || msg.includes('full') || msg.includes('ஆராய்') || msg.includes('முழு') || msg.includes('எப்படி');

  if (lang === 'ta') {
    if (isFullReportRequest) {
      return `🛑 **முழு விபர அறிக்கை (Full Analysis)** 🛑\n\n${analysis.overview}\n\n${analysis.habits}\n\n${analysis.career}\n\n${analysis.journal}\n\n${analysis.suggestion}`;
    }
    if (msg.includes('career') || msg.includes('வேலை') || msg.includes('இலக்கு')) return analysis.career;
    if (msg.includes('habit') || msg.includes('பழக்கம்') || msg.includes('ஸ்ட்ரீக்')) return analysis.habits;
    if (msg.includes('mood') || msg.includes('மனநிலை') || msg.includes('ஜர்னல்')) return analysis.journal;
    if (msg.includes('வணக்கம்') || msg.includes('hi') || msg.includes('hello')) return "வணக்கம்! நான் உங்கள் பிளானர் AI. 'முழுமையாக ஆராய்' என்று கேட்டால் உங்கள் முன்னேற்றத்தைப் பற்றி சொல்வேன்.";
    return "மன்னிக்கவும், எனக்குப் புரியவில்லை. 'முழுமையாக ஆராய்' அல்லது 'எனது கேரியர் பற்றி சொல்' என்று கேட்டுப்பாருங்கள்.";
  } else {
    if (isFullReportRequest) {
      return `📝 **FULL PERFORMANCE ANALYSIS** 📝\n\n${analysis.overview}\n\n${analysis.habits}\n\n${analysis.career}\n\n${analysis.journal}\n\n${analysis.suggestion}`;
    }
    if (msg.includes('career') || msg.includes('skill') || msg.includes('goal')) return analysis.career;
    if (msg.includes('habit') || msg.includes('streak')) return analysis.habits;
    if (msg.includes('mood') || msg.includes('journal') || msg.includes('mindset')) return analysis.journal;
    if (msg.includes('hi') || msg.includes('hello')) return "Hello! I'm your AI Coach. I can analyze your tasks, habits, and mindset. Try asking for a 'Full Analysis'!";
    return "I'm not sure about that. Try: 'Give me a full analysis' or 'How are my habits doing?'.";
  }
};
