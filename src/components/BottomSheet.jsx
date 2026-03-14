import React from 'react';
import { triggerHaptic } from '../hooks/useMobileFeatures';

export default function BottomSheet({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <div className="bottom-sheet-overlay" onClick={handleClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-handle"></div>
          {title && <h3 style={{ margin: '8px 0', fontSize: '18px', fontWeight: 800 }}>{title}</h3>}
        </div>
        <div className="bottom-sheet-body" style={{ padding: '0 20px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
