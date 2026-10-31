'use client';

import React from 'react';

export const SegmentedKellyBar: React.FC = () => {
  // Slices inside the angled trapezoid gauge
  // Total 7 bars stepping up, 5 active, 2 inactive
  const bars = [
    { x: 4,  y: 18, h: 10, active: true,  color: '#00E5FF' },
    { x: 14, y: 15, h: 13, active: true,  color: '#00EFF5' },
    { x: 24, y: 12, h: 16, active: true,  color: '#00F8DE' },
    { x: 34, y: 9,  h: 19, active: true,  color: '#00FFBF' },
    { x: 44, y: 6,  h: 22, active: true,  color: '#00FF9D' },
    { x: 54, y: 3,  h: 25, active: false, color: 'rgba(30, 41, 59, 0.4)' },
    { x: 64, y: 0,  h: 28, active: false, color: 'rgba(30, 41, 59, 0.3)' },
  ];

  return (
    <div className="w-[84px] h-[36px] flex items-center justify-end">
      <svg
        viewBox="0 0 80 34"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Angled Trapezoid Border */}
        <polygon
          points="2,22 76,0 76,32 2,32"
          fill="rgba(5, 8, 14, 0.65)"
          stroke="rgba(0, 240, 255, 0.35)"
          strokeWidth="1.2"
        />

        {/* Angled Vertical Bars */}
        {bars.map((bar, idx) => (
          <rect
            key={`kbar-${idx}`}
            x={bar.x}
            y={bar.y + 4}
            width="7"
            height={bar.h}
            fill={bar.color}
            filter={bar.active ? 'url(#gaugeGlow)' : undefined}
            opacity={bar.active ? 0.95 : 0.4}
            rx="1"
          />
        ))}

        {/* Highlight Bloom on Leading Active Bar */}
        <circle
          cx="47.5"
          cy="10"
          r="2.5"
          fill="#FFFFFF"
          className="animate-ping"
          style={{ animationDuration: '2.5s' }}
        />
      </svg>
    </div>
  );
};

export default SegmentedKellyBar;
