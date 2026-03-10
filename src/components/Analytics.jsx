import React from 'react';

const Analytics = ({ showAnalytics, setShowAnalytics, ProductivityAnalytics }) => {
  return (
    <div>
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">
              📊 Analytics
            </div>
            <div className="tip">
              Track your productivity and task completion patterns
            </div>
          </div>
        </div>
      </div>

      <ProductivityAnalytics />
    </div>
  );
};

export default Analytics;
