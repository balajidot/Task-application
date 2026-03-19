import React from 'react';
import ProductivityAnalytics from './ProductivityAnalytics';

const Analytics = ({ showAnalytics, setShowAnalytics }) => {
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
