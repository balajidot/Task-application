import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getAssistantResponse } from '../utils/aiAssistant';
import { triggerHaptic } from '../hooks/useMobileFeatures';
import { getApiUrl } from '../utils/apiConfig';

export default function ChatAssistantView() {
  const {
    appLanguage, goals, habits, career, journalEntries,
    handleChatAction: onExecuteAction,
    showConfirm
  } = useApp();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('taskPlanner_chatMessages');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(m => ({ ...m, time: new Date(m.time) }));
      }
    } catch {}
    return [{
      id: 1,
      text: appLanguage === 'ta'
        ? 'வணக்கம்! நான் உங்கள் AI Coach. எப்படி உதவட்டும்?'
        : "Hello! I'm your AI Coach. How can I help you today?",
      sender: 'ai',
      time: new Date()
    }];
  });

  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef  = useRef(null);
  const inputRef   = useRef(null);
  const messagesRef = useRef(null);

  // ✅ BUG #8 FIX: Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('taskPlanner_chatMessages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // ✅ BUG #8 FIX: Scroll to bottom without jump
  const scrollToBottom = useCallback((instant = false) => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({
        behavior: instant ? 'auto' : 'smooth',
        block: 'end'
      });
    }, instant ? 0 : 150);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ✅ BUG #8 FIX: Keyboard handling — no jump
  // Use CSS + capacitor keyboard plugin instead of visualViewport hack
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to let keyboard fully open
      setTimeout(() => scrollToBottom(false), 400);
    };
    inputRef.current?.addEventListener('focus', handleFocus);
    return () => inputRef.current?.removeEventListener('focus', handleFocus);
  }, [scrollToBottom]);

  const appData = { goals, habits, career, journalEntries };

  const handleSend = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg) return;

    triggerHaptic('light');
    const newMessages = [
      ...messages,
      { id: Date.now(), text: userMsg, sender: 'user', time: new Date() }
    ];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, appData, language: appLanguage }),
        signal: AbortSignal.timeout(12000),
      });

      const data = await response.json();

      // ✅ API Key missing — friendly message
      if (response.status === 500 && data.error === 'GEMINI_API_KEY is not set.') {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: appLanguage === 'ta'
            ? '⚙️ AI இப்போது configure ஆகவில்லை. Admin-ஐ தொடர்பு கொள்ளவும்.'
            : '⚙️ AI is not configured yet. Please set up the API key in Vercel.',
          sender: 'ai', time: new Date()
        }]);
        return;
      }

      if (!response.ok) throw new Error(data.message || `Error ${response.status}`);

      if (data.response) {
        if (data.actions?.length) {
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
        throw new Error('No response from AI');
      }
    } catch (error) {
      // ✅ Timeout or network error — use local fallback
      const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      const fallback  = getAssistantResponse(userMsg, appData, appLanguage);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: isTimeout
          ? (appLanguage === 'ta'
              ? '⏳ AI response தாமதமாகிறது. மீண்டும் try பண்ணவும்.\n\n' + fallback
              : '⏳ AI is taking too long. Try again.\n\n' + fallback)
          : fallback,
        sender: 'ai', time: new Date()
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

  // ✅ BUG #8 FIX: Use showConfirm instead of window.confirm
  const clearChat = () => {
    showConfirm(
      appLanguage === 'ta' ? 'உரையாடலை அழிக்கவா?' : 'Clear chat history?',
      () => {
        setMessages([{
          id: 1,
          text: appLanguage === 'ta'
            ? 'வணக்கம்! மீண்டும் தொடங்கலாம்.'
            : 'Hello! Let\'s start fresh.',
          sender: 'ai',
          time: new Date()
        }]);
        try { localStorage.removeItem('taskPlanner_chatMessages'); } catch {}
      }
    );
  };

  const quickActions = appLanguage === 'ta'
    ? [
        { label: '📅 Today\'s Plan',         val: 'today schedule add pannu' },
        { label: '📊 Full Analysis',          val: 'full analyze my progress' },
        { label: '🔥 Habit Streaks',          val: 'habit streaks' },
        { label: '🧠 Mindset',               val: 'journal mood analysis' },
      ]
    : [
        { label: '📅 Today\'s Plan',          val: 'setup a today\'s plan for me' },
        { label: '📊 Full Analysis',          val: 'give me a full performance analysis' },
        { label: '🔥 Habit Streaks',          val: 'my habit progress' },
        { label: '🧠 Mindset',               val: 'analyze my mindset and mood' },
      ];

  return (
    <div className="chat-view-wrapper">

      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">🤖</div>
          <div>
            <div className="chat-title">
              {appLanguage === 'ta' ? 'AI Coach' : 'AI Coach'}
            </div>
            <div className="chat-status">● Online</div>
          </div>
        </div>
        <button className="mini-btn" onClick={clearChat}>🧹</button>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages no-scrollbar" ref={messagesRef}>
        {messages.map(m => (
          <div
            key={m.id}
            className={`chat-bubble ${m.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
          >
            {m.text}
            {Array.isArray(m.actions) && m.actions.map((action, idx) => (
              (action.type === 'ADD_TASKS' || action.type === 'REPLACE_TASKS') && (
                <div key={idx} className="chat-action-btn-wrap">
                  <button
                    className="new-btn chat-action-btn"
                    onClick={() => handleApplyAction(action)}
                  >
                    ✨ {action.type === 'REPLACE_TASKS'
                      ? (appLanguage === 'ta' ? 'அட்டவணையை மாற்று' : 'Replace Schedule')
                      : (appLanguage === 'ta' ? 'பட்டியலில் சேர்' : 'Add to Board')}
                  </button>
                </div>
              )
            ))}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble chat-bubble-ai chat-typing">
            <div className="dot-typing" />
            <div className="dot-typing" />
            <div className="dot-typing" />
          </div>
        )}

        <div ref={scrollRef} className="chat-scroll-anchor" />
      </div>

      {/* ── Bottom Bar ── */}
      <div className="chat-bottom">
        {/* Quick Actions */}
        <div className="chat-quick-actions no-scrollbar">
          {quickActions.map((q, i) => (
            <button
              key={i}
              className="filter-btn chat-quick-btn"
              onClick={() => handleSend(q.val)}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            className="fi chat-input"
            placeholder={appLanguage === 'ta' ? 'கேளுங்கள்...' : 'Type your question...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            className="new-btn chat-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            ➔
          </button>
        </div>
      </div>

    </div>
  );
}