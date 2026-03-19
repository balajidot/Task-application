import React from 'react';

const Settings = ({ 
  theme, 
  setTheme, 
  taskFontSize, 
  setTaskFontSize, 
  taskFontFamily, 
  setTaskFontFamily,
  THEME_OPTIONS,
  FONT_OPTIONS 
}) => {
  return (
    <div>
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">
              ⚙️ Settings
            </div>
            <div className="tip">
              Customize your app appearance and preferences
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="settings-section">
          <div className="settings-title">Theme</div>
          <div className="settings-grid">
            {THEME_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`theme-btn ${theme === option.value ? 'active' : ''}`}
                onClick={() => setTheme(option.value)}
              >
                <div className={`theme-preview ${option.value}`}></div>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-title">Font Size</div>
          <div className="font-size-controls">
            <button 
              className="font-btn"
              onClick={() => setTaskFontSize(Math.max(12, taskFontSize - 2))}
            >
              A-
            </button>
            <span className="font-size-value">{taskFontSize}px</span>
            <button 
              className="font-btn"
              onClick={() => setTaskFontSize(Math.min(24, taskFontSize + 2))}
            >
              A+
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-title">Font Family</div>
          <div className="font-controls">
            {FONT_OPTIONS.map(font => (
              <button
                key={font.value}
                className={`font-option ${taskFontFamily === font.value ? 'active' : ''}`}
                onClick={() => setTaskFontFamily(font.value)}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
