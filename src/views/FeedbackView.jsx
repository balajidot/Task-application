import React, { useState } from 'react';
import { triggerHaptic } from '../hooks/useMobileFeatures';

const FeedbackView = ({ appLanguage }) => {
  const [type, setType] = useState('Improvement');
  const [message, setMessage] = useState('');
  const isTamil = appLanguage === 'ta';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof triggerHaptic === 'function') triggerHaptic('success');
    
    const subject = `Task Planner Feedback: ${type}`;
    const body = `Type: ${type}\n\nMessage:\n${message}`;
    const mailtoUrl = `mailto:digiturning@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;
  };

  const types = [
    { id: 'Improvement', label: isTamil ? 'மேம்பாடு' : 'Improvement', icon: '🚀' },
    { id: 'Bug', label: isTamil ? 'பிழை' : 'Bug Report', icon: '🐛' },
    { id: 'Appreciation', label: isTamil ? 'பாராட்டு' : 'Appreciation', icon: '❤️' }
  ];

  return (
    <div style={{ padding: '0 20px 100px', color: 'var(--text)' }} className="animate-fade-in">
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {isTamil ? 'கருத்துக்கள்' : 'Feedback'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          {isTamil ? 'உங்கள் ஆலோசனைகளை எங்களுக்கு அனுப்புங்கள்' : 'Tell us how we can make this app better for you.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ 
        background: 'var(--card)', 
        padding: '24px', 
        borderRadius: '28px',
        border: '1px solid var(--card-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
            {isTamil ? 'கருத்து வகை' : 'FEEDBACK TYPE'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {types.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setType(t.id); if (typeof triggerHaptic === 'function') triggerHaptic('light'); }}
                style={{
                  padding: '12px 6px',
                  borderRadius: '16px',
                  border: type === t.id ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                  background: type === t.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: type === t.id ? 'var(--accent)' : 'var(--text)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
            {isTamil ? 'உங்கள் செய்தி' : 'YOUR MESSAGE'}
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isTamil ? 'இங்கே டைப் செய்யவும்...' : 'Type your suggestions or issues here...'}
            style={{
              width: '100%',
              minHeight: '160px',
              padding: '16px',
              borderRadius: '16px',
              border: '2px solid var(--card-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text)',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '1.2rem',
            fontWeight: '900',
            borderRadius: '16px',
            color: '#fff',
            border: 'none',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            background: message.trim() ? 'linear-gradient(135deg, var(--accent), #6366f1)' : '#334155',
            boxShadow: message.trim() ? '0 10px 30px rgba(99, 102, 241, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => { if(message.trim()) e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'; }}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isTamil ? 'சமர்ப்பி ✉️' : 'SUBMIT ✉️'}
        </button>
      </form>

      <div style={{ marginTop: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
        <p>Direct Email: <strong>digiturning@gmail.com</strong></p>
      </div>
    </div>
  );
};

export default FeedbackView;
