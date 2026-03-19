import React, { useEffect } from 'react';

const TaskCompletionCelebration = ({ isActive, onComplete }) => {
  useEffect(() => {
    if (!isActive) return;

    // 1. Inject Safe CSS
    if (!document.getElementById('confetti-safe-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-safe-style';
      style.textContent = `
        .confetti-wrapper-safe {
          position: fixed !important;
          top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          pointer-events: none !important;
          z-index: 999999 !important;
          overflow: hidden !important;
          background: transparent !important;
        }
        .confetti-dot-safe {
          position: absolute !important; 
          pointer-events: none !important;
          will-change: transform, opacity !important;
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'confetti-wrapper-safe';
    document.body.appendChild(wrapper);

    // 3. Generate PREMIUM BURST Confetti
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const confettiCount = 80; // ✅ FIX 4: More confetti

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-dot-safe';
      
      const size = Math.random() * 8 + 6; 
      const isCircle = Math.random() > 0.5;
      
      confetti.style.width = `${size}px`;
      confetti.style.height = `${isCircle ? size : size * 1.5}px`;
      confetti.style.borderRadius = isCircle ? '50%' : '2px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // ✅ FIX 4: Burst from center of screen for better mobile visibility
      confetti.style.left = '50vw';
      confetti.style.top = '60vh';
      
      wrapper.appendChild(confetti);
      
      const angle = (Math.random() * 120 + 210) * (Math.PI / 180); // Upward cone
      const velocity = Math.random() * 800 + 400;
      const xDist = Math.cos(angle) * velocity;
      const yDist = Math.sin(angle) * velocity;
      
      const animation = confetti.animate([
        { transform: `translate3d(calc(-50% + 0px), 0px, 0) rotate(0deg)`, opacity: 1 },
        { 
          transform: `translate3d(calc(-50% + ${xDist}px), ${yDist}px, 0) rotate(${Math.random() * 1440}deg)`, 
          opacity: 0 
        }
      ], {
        duration: 800 + Math.random() * 600,
        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        fill: 'forwards'
      });
      
      animation.onfinish = () => confetti.remove();
    }

    // 4. Play Sound Safely (Very quick beep)
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          // Premium "Ding"
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
          oscillator.frequency.exponentialRampToValueAtTime(1046.5, context.currentTime + 0.1); // C6
          
          gainNode.gain.setValueAtTime(0.15, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
          
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.4);
        } catch(e) {}
      });
    } catch(e) {}
    
    // 5. Cleanup after animation
    const timer = setTimeout(() => {
      if (wrapper && wrapper.parentNode) {
        wrapper.remove();
      }
      onComplete?.();
    }, 2500); // ✅ FIX 4: Match 2.5s duration

    return () => {
      clearTimeout(timer);
      if (wrapper && wrapper.parentNode) {
        wrapper.remove();
      }
    };
  }, [isActive, onComplete]);

  return null;
};

export default TaskCompletionCelebration;