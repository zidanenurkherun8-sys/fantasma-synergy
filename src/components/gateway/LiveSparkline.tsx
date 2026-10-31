'use client';

import React, { useEffect, useState, useMemo } from 'react';

export const LiveSparkline: React.FC = () => {
  // Coordinated point array matching the waveform in the screenshot
  const [points, setPoints] = useState<number[]>([
    20, 14, 28, 16, 22, 36, 18, 32, 24, 46, 28, 38, 22, 42, 34, 52, 38, 48
  ]);

  // Dynamic high-frequency tick jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.49) * 12;
        const next = Math.max(12, Math.min(54, last + delta));
        return [...prev.slice(1), next];
      });
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const width = 115;
  const height = 40;

  const polylineStr = useMemo(() => {
    const step = width / (points.length - 1);
    return points
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / 60) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  const lastCoords = useMemo(() => {
    const coords = polylineStr.split(' ');
    const [lx, ly] = coords[coords.length - 1].split(',');
    return { x: parseFloat(lx), y: parseFloat(ly) };
  }, [polylineStr]);

  return (
    <div className="w-[115px] h-[40px] relative overflow-visible flex items-center justify-end">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
          </linearGradient>

          <filter id="neonSparkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Area polygon */}
        <polygon
          points={`0,${height} ${polylineStr} ${width},${height}`}
          fill="url(#sparklineGradient)"
          className="transition-all duration-300 ease-out"
        />

        {/* Electric Cyan Sparkline */}
        <polyline
          fill="none"
          stroke="#00F0FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
          filter="url(#neonSparkGlow)"
          className="transition-all duration-300 ease-out"
        />

        {/* Ticking Active Leading Node */}
        <circle
          cx={lastCoords.x}
          cy={lastCoords.y}
          r="2.6"
          fill="#00FF9D"
          className="animate-glow-pulse"
        />
      </svg>
    </div>
  );
};

export default LiveSparkline;
