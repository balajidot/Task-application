import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../hooks/useMobileFeatures';

export default function SpeechToTask({ onSpeechResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Default to Indian English, can be changed

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onSpeechResult(transcript);
        setIsListening(false);
        triggerHaptic('medium');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onSpeechResult]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      triggerHaptic('light');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      triggerHaptic('medium');
    }
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    return null;
  }

  return (
    <button
      className={`mini-btn ${isListening ? 'listening' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleListening(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: '10px',
        backgroundColor: isListening ? 'rgba(239, 68, 68, 0.1)' : 'var(--chip)',
        color: isListening ? '#ef4444' : 'var(--text)',
        border: `1.5px solid ${isListening ? '#ef4444' : 'var(--card-border)'}`,
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{isListening ? '🛑' : '🎤'}</span>
      <span style={{ fontWeight: 800 }}>{isListening ? 'Listening...' : 'Voice Entry'}</span>
      
      {isListening && (
        <span className="listening-pulse"></span>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes listenPulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .listening-pulse {
          width: 8px; height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: listenPulse 1s infinite;
        }
      `}} />
    </button>
  );
}
