import React from 'react';

const InstructionsView = ({ appLanguage }) => {
  const isTamil = appLanguage === 'ta';

  const sections = [
    {
      title: isTamil ? '🎯 டாஷ்போர்டு (Dashboard)' : '🎯 Dashboard',
      items: [
        isTamil ? 'அன்றைய முன்னேற்றத்தை Heatmap மூலம் பார்க்கலாம்.' : 'Track your daily progress via the Productivity Heatmap.',
        isTamil ? 'AI வழங்கும் Smart Tips மூலம் உங்கள் பழக்கவழக்கங்களை மேம்படுத்தலாம்.' : 'Improve your habits with AI-powered Smart Tips.'
      ]
    },
    {
      title: isTamil ? '✅ பணிகள் (Tasks)' : '✅ Tasks Management',
      items: [
        isTamil ? 'புதிய வேலைகளைச் சேர்க்க கீழே உள்ள + பட்டனை அழுத்தவும்.' : 'Press the bottom + button to add new tasks.',
        isTamil ? 'வேலையை முடிக்க இடதுபுறம் ஸ்வைப் (Swipe) செய்யவும்.' : 'Swipe right to mark a task as done.',
        isTamil ? 'வேலையை நீக்க வலதுபுறம் ஸ்வைப் செய்யவும்.' : 'Swipe left to delete a task.',
        isTamil ? '✨ AI Breakdown: கடினமான வேலைகளைச் சிறிய பகுதிகளாகப் பிரிக்க டாஸ்க்கை அழுத்தி AI மூலம் பிரிக்கவும்.' : '✨ AI Breakdown: Long-press a task to break it down into smaller sub-tasks using Gemini AI.'
      ]
    },
    {
      title: isTamil ? '🧘 ஃபோகஸ் மோட் (Focus Mode)' : '🧘 Focus Mode',
      items: [
        isTamil ? 'அமைதியான சூழலில் வேலை செய்ய Soundscape வசதியைப் பயன்படுத்தவும்.' : 'Use the Soundscape feature (Rain, Forest, Lo-fi) to work in a peaceful environment.',
        isTamil ? 'டைமர் மூலம் உங்கள் கவனத்தை ஒருமுகப்படுத்தலாம்.' : 'Use the timer to maintain your flow state.'
      ]
    },
    {
      title: isTamil ? '⚙️ அமைப்புகள் (Settings)' : '⚙️ Customization',
      items: [
        isTamil ? 'உங்களுக்குப் பிடித்த Dynamic Background-களை மாற்றிக்கொள்ளலாம்.' : 'Choose from various Animated Background Themes (Mesh, Aurora, Blobs).',
        isTamil ? 'கார்டுகளின் அடர்த்தி (Density) மற்றும் மூலைகளை (Rounding) மாற்றலாம்.' : 'Adjust task card density and corner rounding for a perfect look.'
      ]
    }
  ];

  return (
    <div style={{ padding: '0 20px 100px', color: 'var(--text)' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {isTamil ? 'பயன்பாட்டு வழிமுறைகள்' : 'App Instructions'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {isTamil ? 'Task Planner-ஐ முழுமையாகப் பயன்படுத்துவது எப்படி?' : 'Master your productivity with these tips.'}
        </p>
      </header>

      {sections.map((sec, idx) => (
        <section key={idx} style={{ 
          marginBottom: '24px', 
          background: 'var(--card)', 
          padding: '24px', 
          borderRadius: '24px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sec.title}
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sec.items.map((item, i) => (
              <li key={i} style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'color-mix(in srgb, var(--text) 85%, transparent)' }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        padding: '30px', 
        borderRadius: '24px', 
        background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)',
        color: '#fff'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>🚀 Ready to be Disciplined?</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Consistency is the key to success. Start crossing off those tasks!</p>
      </div>
    </div>
  );
};

export default InstructionsView;
