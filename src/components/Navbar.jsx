import React from 'react';

const Navbar = ({ activeView, setActiveView, tabItems }) => {
  return (
    <div className="tab-nav">
      {tabItems.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeView === tab.id ? 'active' : ''}`}
          onClick={() => setActiveView(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Navbar;
