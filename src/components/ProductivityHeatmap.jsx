import React from 'react';
import { generateHeatmapData } from '../utils/helpers';

const ProductivityHeatmap = ({ goals }) => {
  const data = React.useMemo(() => generateHeatmapData(goals, 91), [goals]);
  
  // Group into weeks for the grid
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (count === 0) return 'var(--chip)';
    if (count <= 2) return '#10b98133'; // light
    if (count <= 4) return '#10b98177'; // medium
    if (count <= 6) return '#10b981aa'; // bold
    return '#10b981'; // solid
  };

  return (
    <div className="card" style={{ padding: '20px', overflow: 'visible' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text)' }}>Productivity Heatmap</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>Last 90 Days</span>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }} className="hide-scrollbar">
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.date}: ${day.count} tasks`}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: getColor(day.count),
                  borderRadius: '3px',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800 }}>Less</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0, 2, 4, 6, 8].map(v => (
            <div key={v} style={{ width: '10px', height: '10px', backgroundColor: getColor(v), borderRadius: '2px' }} />
          ))}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800 }}>More</span>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;
