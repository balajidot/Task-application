export const STORAGE_KEY = "daily-goals-final";
export const PREFS_KEY = "taskflow-prefs-v1";
export const UI_STATE_KEY = "taskflow-ui-v1";
export const TOOLS_KEY = "taskflow-tools-v1";
export const CAREER_KEY = "taskflow-career-v1";
export const HABITS_KEY = "taskflow-habits-v1";
export const JOURNAL_KEY = "taskflow-journal-v1";
export const GOALS_KEY = "taskflow-goals-v1";
export const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Tamil", value: "ta" },
];

export const REPEAT_OPTIONS = ["None", "Daily", "Weekly", "Monthly"];
export const SESSION_OPTIONS = ["Morning", "Afternoon", "Evening"];
export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export const FONT_OPTIONS = [
  { label: "Söhne/Inter", value: "'Söhne', 'Inter', 'DM Sans', ui-sans-serif, system-ui, sans-serif" },
  { label: "Segoe UI", value: '"Segoe UI Variable","Segoe UI",sans-serif' },
  { label: "Poppins", value: '"Poppins","Segoe UI",sans-serif' },
  { label: "Montserrat", value: '"Montserrat","Segoe UI",sans-serif' },
  { label: "Nunito", value: '"Nunito","Segoe UI",sans-serif' },
  { label: "Times New Roman", value: '"Times New Roman",Times,serif' },
];

export const THEME_OPTIONS = [
  { label: "Dark", value: "dark" },
  { label: "Ocean Dark", value: "ocean-dark" },
  { label: "Midnight", value: "midnight" },
  { label: "Cyber Neon", value: "cyber-neon" },
  { label: "Deep Purple", value: "deep-purple" },
  { label: "Emerald Night", value: "emerald-night" },
  { label: "Eye Comfort", value: "eye-comfort" },
  { label: "Sunset Light", value: "sunset-light" },
  { label: "Forest Mist", value: "forest-mist" },
  { label: "Rose Dawn", value: "rose-dawn" },
  { label: "Lavender Night", value: "lavender-night" },
  { label: "Mocha Espresso", value: "mocha-espresso" },
  { label: "Sakura Bloom", value: "sakura-bloom" },
  { label: "Graphite Lime", value: "graphite-lime" },
  { label: "Arctic Glass", value: "arctic-glass" },
];

export const TIME_FILTER_OPTIONS = ["All Times", "Morning", "Afternoon", "Evening", "Night", "No Time"];
export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const QUOTES = [
  "Small steps every day lead to big results.",
  "Progress, not perfection.",
  "Dream it. Plan it. Do it.",
  "Focus on progress, not pressure.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Action is the foundational key to all success.",
  "You don't have to be great to start, but you have to start to be great.",
  "A year from now you'll wish you had started today.",
  "Discipline is choosing between what you want now and what you want most.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "What you do today can improve all your tomorrows.",
  "It always seems impossible until it's done.",
  "Hard work beats talent when talent doesn't work hard.",
  "Your future is created by what you do today, not tomorrow.",
  "Strive for progress, not perfection.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Believe you can and you're halfway there.",
  "Don't limit your challenges. Challenge your limits.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Work hard in silence. Let success make the noise.",
];

export const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export const APP_COPY = {
  en: {
    tabs: {
      insights: "Dashboard",
      tasks: "Tasks",
      planner: "Planner",
      analytics: "Analytics",
      settings: "Settings",
      career: "Career",
      tools: "Tools",
      habits: "Habits",
      journal: "Journal",
      goals: "Goals",
      more: "More",
    },
    common: {
      todayFocus: "Today's Focus",
      tasks: "Tasks",
      cancel: "Cancel",
      save: "Save",
      enable: "Enable",
      refresh: "Refresh",
      run: "Run",
      close: "Close",
      export: "Export",
      search: "Search",
      tamil: "Tamil",
    },
    settings: {
      title: "Settings",
      subtitle: "Personalize, clean up, and keep the app healthy",
      language: "Language",
      languageSubtitle: "Choose app language",
      battery: "Battery Protection",
      batterySubtitle: "Open Android settings and keep notifications alive",
      batteryGuide: "Disable battery optimization for this app so alarms keep firing after close or recent-app clear.",
      openBattery: "Open Battery Settings",
      openApp: "Open App Settings",
      profile: "Profile",
      notifications: "Notifications",
      theme: "Theme",
      display: "Display",
      behavior: "Behavior",
      storage: "Storage",
      preview: "Preview",
      reset: "Reset",
    },
    tools: {
      title: "Working Tools",
      quickNotes: "Quick Notes",
      notesLocker: "Notes Locker",
      noteTitle: "Note title",
      noteBody: "Save proper notes here. These stay in the app until you delete them.",
      saveNote: "Save Note",
      noNotes: "No saved notes yet.",
      pinned: "Pinned",
      searchNotes: "Search saved notes...",
      exportNotes: "Export Notes",
      brainDump: "Brain Dump",
      boxBreathing: "Box Breathing",
      eveningReview: "Evening Daily Review",
    },
    analytics: {
      title: "Productivity Analytics",
      subtitle: "Track your productivity patterns and insights",
      aiWeekly: "AI Weekly Analysis",
      forecast: "Forecast",
      nextWeek: "Next Week Auto Plan",
      quickTools: "Quick Tools",
    },
  },
  ta: {
    tabs: {
      insights: "டாஷ்போர்டு",
      tasks: "பணிகள்",
      planner: "திட்டம்",
      analytics: "பகுப்பாய்வு",
      settings: "அமைப்புகள்",
      career: "கேரியர்",
      tools: "கருவிகள்",
      habits: "பழக்கங்கள்",
      journal: "ஜர்னல்",
      goals: "இலக்குகள்",
      more: "மேலும்",
    },
    common: {
      todayFocus: "இன்றைய கவனம்",
      tasks: "பணிகள்",
      cancel: "ரத்து",
      save: "சேமிக்க",
      enable: "இயக்கு",
      refresh: "புதுப்பிக்க",
      run: "திற",
      close: "மூடு",
      export: "ஏற்றுமதி",
      search: "தேடு",
      tamil: "தமிழ்",
    },
    settings: {
      title: "அமைப்புகள்",
      subtitle: "அப்பை உங்களுக்குப் பொருத்தமாக மாற்றுங்கள்",
      language: "மொழி",
      languageSubtitle: "அப் மொழியை தேர்வு செய்யவும்",
      battery: "பேட்டரி பாதுகாப்பு",
      batterySubtitle: "Android settings திறந்து notifications வேலை செய்ய வையுங்கள்",
      batteryGuide: "இந்த appக்கு battery optimization off செய்தால் close ஆன பிறகும் reminders நன்றாக வரும்.",
      openBattery: "Battery Settings திற",
      openApp: "App Settings திற",
      profile: "சுயவிவரம்",
      notifications: "அறிவிப்புகள்",
      theme: "தீம்",
      display: "திரை",
      behavior: "நடத்தை",
      storage: "சேமிப்பு",
      preview: "முன்னோட்டம்",
      reset: "ரீசெட்",
    },
    tools: {
      title: "வேலை கருவிகள்",
      quickNotes: "விரைவு குறிப்புகள்",
      notesLocker: "குறிப்பு சேமிப்பு",
      noteTitle: "குறிப்பு தலைப்பு",
      noteBody: "இங்கே குறிப்புகளை சேமிக்கலாம். நீங்க delete பண்ணும் வரை இருக்கும்.",
      saveNote: "குறிப்பை சேமிக்க",
      noNotes: "இன்னும் சேமித்த குறிப்புகள் இல்லை.",
      pinned: "பின் செய்யப்பட்டது",
      searchNotes: "சேமித்த குறிப்புகளை தேடுங்கள்...",
      exportNotes: "குறிப்புகளை ஏற்றுமதி செய்",
      brainDump: "மனச்சுமை வெளியேற்று",
      boxBreathing: "சுவாச பயிற்சி",
      eveningReview: "மாலை தினசரி விமர்சனம்",
    },
    analytics: {
      title: "உற்பத்தித்திறன் பகுப்பாய்வு",
      subtitle: "உங்கள் வேலை முன்னேற்றத்தை பாருங்கள்",
      aiWeekly: "AI வாராந்திர பகுப்பாய்வு",
      forecast: "முன்கணிப்பு",
      nextWeek: "அடுத்த வார தானியங்கி திட்டம்",
      quickTools: "விரைவு கருவிகள்",
    },
  },
};
