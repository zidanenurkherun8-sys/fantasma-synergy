'use client';

import React from 'react';

interface SegmentedKellyBarProps {
  percentage?: number; // 0 to 100
}

export const SegmentedKellyBar: React.FC<SegmentedKellyBarProps> = ({
  percentage = 68,
}) => {
  const totalBars = 8;
  const activeCount = Math.round((percentage / 100) * totalBars);

  // Height progression for stepped telemetry aesthetic (from 14px to 28px)
  const barHeights = [12, 14, 16, 19, 22, 25, 28, 30];

  return (
    <div className="flex items-end gap-1.5 h-[34px] px-2 py-1 bg-[#05080E]/70 border border-[#00F0FF]/20 rounded-[4px] relative overflow-hidden">
      {/* Background Subtle Cyber Scan */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF]/5 to-transparent pointer-events-none" />

      {barHeights.map((h, idx) => {
        const isActive = idx < activeCount;
        const isLeading = idx === activeCount - 1;

        // Color interpolation between Cyan (#00F0FF) and Matrix Green (#00FF9D)
        const ratio = idx / (totalBars - 1);
        const activeColor = ratio < 0.5 ? '#00F0FF' : '#00FF9D';

        return (
          <div
            key={`bar-${idx}`}
            className="w-2 rounded-t-[1px] transition-all duration-300 relative"
            style={{
              height: `${h}px`,
              backgroundColor: isActive ? activeColor : 'rgba(30, 41, 59, 0.45)',
              transform: 'skewX(-14deg)',
              boxShadow: isLeading
                ? `0 0 10px ${activeColor}, 0 0 4px ${activeColor}`
                : isActive
                ? `0 0 4px ${activeColor}55`
                : 'none',
              border: isActive ? `1px solid ${activeColor}` : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {isLeading && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#00FF9D] animate-ping" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SegmentedKellyBar;
