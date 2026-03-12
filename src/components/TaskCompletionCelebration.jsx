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
          border-radius: 2px !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'confetti-wrapper-safe';
    document.body.appendChild(wrapper);

    // 3. Generate ULTRA-FAST Confetti
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const confettiCount = 35; // Kuraintha alavu, aanaal vegamaaga irukkum

    for (let i = 0; i < confettiCount; i++) {
      // Delay illamal udanadiyaga vedikka seigirom (No setTimeout delay)
      const confetti = document.createElement('div');
      confetti.className = 'confetti-dot-safe';
      
      const size = Math.random() * 6 + 5; 
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 1.2}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = '-10px';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      wrapper.appendChild(confetti);
      
      // Fast Animation (0.4 to 0.7 seconds ONLY)
      const animation = confetti.animate([
        { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate3d(${Math.random() * 100 - 50}px, ${window.innerHeight}px, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: 400 + Math.random() * 300, // Max 700ms
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.1, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.1);
        } catch(e) {}
      });
    } catch(e) {}
    
    // 5. Auto-Complete in just 0.5 Seconds! (Minnal vegam ⚡)
    const timer = setTimeout(() => {
      if (wrapper && wrapper.parentNode) {
        wrapper.remove();
      }
      onComplete?.();
    }, 500); // 500ms thaan! Udanadiyaga tick aagividum.

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