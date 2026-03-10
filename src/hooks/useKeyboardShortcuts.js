import { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key;
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(shortcut => {
        if (shortcut.key !== key) return false;
        if (shortcut.ctrl !== undefined && shortcut.ctrl !== ctrl) return false;
        if (shortcut.shift !== undefined && shortcut.shift !== shift) return false;
        if (shortcut.alt !== undefined && shortcut.alt !== alt) return false;
        return true;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
