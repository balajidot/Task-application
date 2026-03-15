import React, { useState, useEffect, useRef } from 'react';
import { getAssistantResponse } from '../utils/aiAssistant';
import { triggerHaptic } from '../hooks/useMobileFeatures';
import { getApiUrl } from '../utils/apiConfig';

export default function ChatAssistantView({ appLanguage, goals, habits, career, journalEntries, onExecuteAction }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('taskPlanner_chatMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(m => ({ ...m, time: new Date(m.time) }));
      } catch (e) {
        return [{ id: 1, text: appLanguage === 'ta' ? "வணக்கம்! நான் உங்கள் AI ஆலோசகர்..." : "Hello! I'm your AI Coach...", sender: 'ai', time: new Date() }];
      }
    }
    return [{ 
      id: 1, 
      text: appLanguage === 'ta' 
        ? "வணக்கம்! நான் உங்கள் AI ஆலோசகர். உங்கள் புள்ளிவிவரங்களை நான் ஆராய்ந்துவிட்டேன். நான் உங்களுக்கு எப்படி உதவட்டும்?"
        : "Hello! I'm your AI Coach. I've analyzed your data. How can I help you optimize your productivity?", 
      sender: 'ai', 
      time: new Date() 
    }];
  });

  useEffect(() => {
    localStorage.setItem('taskPlanner_chatMessages', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const appData = { goals, habits, career, journalEntries };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Keyboard height handling optimization: 
  // We use absolute positioning but wrap everything in a container that reacts to the keyboard.
  const [keyboardHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const height = window.innerHeight - window.visualViewport.height;
        setKbHeight(Math.max(0, height));
        scrollToBottom();
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    triggerHaptic('light');
    const newMessages = [...messages, { id: Date.now(), text: userMsg, sender: 'user', time: new Date() }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          appData,
          language: appLanguage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server Error ${response.status}`);
      }
      
      if (data.response) {
        // Immediate actions
        if (data.actions && Array.isArray(data.actions)) {
          // If it's a SET_LANGUAGE or SET_THEME, we execute immediately
          // Note: REPLACE_TASKS and ADD_TASKS usually need the user to see the button or it happens via onExecuteAction
          data.actions.forEach(action => {
            if (['SET_LANGUAGE', 'SET_THEME', 'SET_VIEW'].includes(action.type)) {
               onExecuteAction(action);
            }
          });
        }

        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: data.response, 
          sender: 'ai', 
          time: new Date(),
          actions: data.actions 
        }]);
      } else {
        throw new Error(data.error || 'AI Failed');
      }
    } catch (error) {
      console.error('Gemini Error:', error);
      
      const errorMsg = appLanguage === 'ta' 
        ? `⚠️ (பிழை: ${error.message}) ` 
        : `⚠️ (Error: ${error.message}) `;
        
      const aiResponse = getAssistantResponse(userMsg, appData, appLanguage);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: errorMsg + aiResponse, 
        sender: 'ai', 
        time: new Date() 
      }]);
    } finally {
      setIsTyping(false);
      triggerHaptic('medium');
    }
  };

  const handleApplyAction = (action) => {
    if (!action || !onExecuteAction) return;
    triggerHaptic('heavy');
    onExecuteAction(action);
  };

  const quickActions = appLanguage === 'ta' 
    ? [
        { label: "📅 இன்றைய திட்டம் (Today's Plan)", val: "today schedule add pannu" },
        { label: "🛑 முழு ஆய்வு (Full Analysis)", val: "full analyze my progress" },
        { label: "🚀 கேரியர் (Career)", val: "career stats" },
        { label: "🔥 பழக்கங்கள் (Habits)", val: "habit streaks" },
        { label: "🧠 மனநிலை (Mindset)", val: "journal mood analysis" }
      ]
    : [
        { label: "📅 Today's Plan", val: "setup a today's plan for me" },
        { label: "📊 Full Performance Analysis", val: "give me a full performance analysis" },
        { label: "🚀 Career Growth", val: "tell me about my career" },
        { label: "🔥 Habit Streaks", val: "my habit progress" },
        { label: "🧠 Mindset Insight", val: "analyze my mindset and mood" }
      ];

  const clearChat = () => {
    if (window.confirm(appLanguage === 'ta' ? "உரையாடலை அழிக்கவா?" : "Clear history?")) {
      setMessages([{ id: 1, text: appLanguage === 'ta' ? "வணக்கம்! நான் உங்கள் AI உதவியாளர்." : "Hello! I'm your AI Assistant.", sender: 'ai', time: new Date() }]);
    }
  };

  return (
    <div className="chat-view animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      maxWidth: '600px', 
      margin: '0 auto', 
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header - Fixed at top */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--card-border)', 
        background: 'var(--card)', 
        borderRadius: '20px 20px 0 0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{appLanguage === 'ta' ? 'AI உதவியாளர்' : 'AI Assistant'}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>● Online Active</div>
          </div>
        </div>
        <button className="mini-btn" onClick={clearChat} style={{ opacity: 0.7 }}>🧹</button>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '20px'
      }} className="no-scrollbar">
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '12px 16px',
            borderRadius: m.sender === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
            background: m.sender === 'user' ? 'var(--accent)' : 'var(--chip)',
            color: m.sender === 'user' ? '#fff' : 'var(--text)',
            fontSize: '0.92rem',
            fontWeight: 700,
            lineHeight: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            whiteSpace: 'pre-wrap'
          }}>
            {m.text}
            {Array.isArray(m.actions) && m.actions.map((action, idx) => (
              (action.type === 'ADD_TASKS' || action.type === 'REPLACE_TASKS') && (
                <div key={idx} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button 
                    className="new-btn" 
                    onClick={() => handleApplyAction(action)}
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)' }}
                  >
                    ✨ {action.type === 'REPLACE_TASKS' ? (appLanguage === 'ta' ? 'அட்டவணையை மாற்றுக' : 'Replace Schedule') : (appLanguage === 'ta' ? 'பட்டியலில் சேர்' : 'Add to Board')}
                  </button>
                </div>
              )
            ))}
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--chip)', padding: '10px 16px', borderRadius: '18px 18px 18px 0', display: 'flex', gap: '4px' }}>
            <div className="dot-typing" />
            <div className="dot-typing" />
            <div className="dot-typing" />
          </div>
        )}
        <div ref={scrollRef} style={{ height: '1px' }} />
      </div>

      {/* Bottom Area (Quick Actions + Input) */}
      <div style={{ 
        background: 'var(--card)', 
        zIndex: 10,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        // IMPORTANT: We use internal keyboardHeight state which is from visualViewport for most accurate mobile placement
        paddingBottom: `calc(${keyboardHeight}px + env(safe-area-inset-bottom, 10px))`,
        flexShrink: 0,
        transition: 'padding-bottom 0.15s ease-out'
      }}>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 16px', borderBottom: '1px solid var(--card-border)' }} className="no-scrollbar">
          {quickActions.map((q, i) => (
            <button key={i} className="filter-btn" onClick={() => handleSend(q.val)} style={{ whiteSpace: 'nowrap', borderRadius: '999px', padding: '8px 16px' }}>
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="fi" 
            placeholder={appLanguage === 'ta' ? "கேளுங்கள்..." : "Type your question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, borderRadius: '999px', padding: '12px 20px' }}
          />
          <button className="new-btn" onClick={() => handleSend()} style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ➔
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .dot-typing { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: dot-blink 1.4s infinite both; }
        .dot-typing:nth-child(2) { animation-delay: 0.2s; }
        .dot-typing:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      `}} />
    </div>
  );
}
