'use client';

import React, { useEffect, useState, useMemo } from 'react';

export const LiveSparkline: React.FC = () => {
  // Baseline sparkline points
  const [points, setPoints] = useState<number[]>([
    22, 18, 25, 14, 20, 29, 23, 34, 26, 38, 28, 42, 35, 48, 40, 52, 45, 39, 46, 55
  ]);

  // High-frequency tick updates (dynamic market volatility simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1];
        // Dynamic random delta with mean reversion
        const delta = (Math.random() - 0.48) * 14;
        const next = Math.max(10, Math.min(58, last + delta));
        return [...prev.slice(1), next];
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const width = 110;
  const height = 44;

  const polylinePoints = useMemo(() => {
    const step = width / (points.length - 1);
    return points
      .map((val, idx) => {
        const x = idx * step;
        // Invert Y so higher value is up
        const y = height - (val / 65) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  const lastPoint = useMemo(() => {
    const parts = polylinePoints.split(' ');
    const lastCoord = parts[parts.length - 1].split(',');
    return {
      x: parseFloat(lastCoord[0]),
      y: parseFloat(lastCoord[1]),
    };
  }, [polylinePoints]);

  const areaPoints = useMemo(() => {
    return `0,${height} ${polylinePoints} ${width},${height}`;
  }, [polylinePoints]);

  return (
    <div className="w-[110px] h-[44px] relative overflow-visible flex items-center justify-end">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
          </linearGradient>

          <filter id="sparkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gradient Fill under sparkline */}
        <polygon
          points={areaPoints}
          fill="url(#sparklineGrad)"
          className="transition-all duration-300 ease-linear"
        />

        {/* Polyline line with cyan neon glow */}
        <polyline
          fill="none"
          stroke="#00F0FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
          filter="url(#sparkGlow)"
          className="transition-all duration-300 ease-linear"
        />

        {/* Leading Tick Dot */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.8"
          fill="#00FF9D"
          className="animate-glow-pulse"
        />
      </svg>
    </div>
  );
};

export default LiveSparkline;
