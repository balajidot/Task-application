import React, { useEffect } from 'react';

const TaskCompletionCelebration = ({ isActive, onComplete }) => {
  useEffect(() => {
    if (!isActive) return;

    // Create confetti effect
    const createConfetti = () => {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
      const confettiCount = 50;
      
      for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.className = 'confetti-piece';
          confetti.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            opacity: 1;
            transform: rotate(${Math.random() * 360}deg);
            z-index: 9999;
            pointer-events: none;
          `;
          
          document.body.appendChild(confetti);
          
          // Animate confetti falling
          const animation = confetti.animate([
            { 
              transform: `translateY(0) rotate(0deg)`,
              opacity: 1 
            },
            { 
              transform: `translateY(${window.innerHeight + 20}px) rotate(${Math.random() * 720}deg)`,
              opacity: 0 
            }
          ], {
            duration: 2000 + Math.random() * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          });
          
          animation.onfinish = () => {
            confetti.remove();
          };
        }, i * 30);
      }
    };

    // Play success sound
    const playSuccessSound = () => {
      const audio = new Audio('/sounds/complete.mp3');
      audio.play().catch(() => {
        // Fallback to system beep if audio fails
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
      });
    };

    createConfetti();
    playSuccessSound();
    
    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, onComplete]);

  return null;
};

export default TaskCompletionCelebration;
