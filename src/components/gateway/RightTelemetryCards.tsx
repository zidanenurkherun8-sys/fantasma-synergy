'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, BarChart2, Cpu, TrendingUp, ShieldCheck } from 'lucide-react';
import { NeuralClusterIcon } from './NeuralClusterIcon';

export const RightTelemetryCards: React.FC = () => {
  // Sparkline data points for full-width trading chart
  const [sparkPoints, setSparkPoints] = useState<number[]>([
    24, 18, 30, 22, 28, 42, 32, 48, 38, 55, 45, 62, 50, 68, 58, 75, 64, 78, 72, 85
  ]);

  // High-frequency live tick update
  useEffect(() => {
    const timer = setInterval(() => {
      setSparkPoints(prev => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.48) * 12;
        const next = Math.max(15, Math.min(92, last + delta));
        return [...prev.slice(1), next];
      });
    }, 650);

    return () => clearInterval(timer);
  }, []);

  // Compute SVG polyline and area path
  const width = 280;
  const height = 65;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const step = width / (sparkPoints.length - 1);
    const coords = sparkPoints.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / 100) * (height - 12) - 6;
      return { x, y };
    });

    const line = coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `0,${height} ${line} ${width},${height}`;
    const last = coords[coords.length - 1];

    return { linePath: line, areaPath: area, lastPoint: last };
  }, [sparkPoints]);

  return (
    <div className="w-full h-full flex flex-col justify-between gap-3.5">
      {/* ========================================================
          CARD 1: LIVE MARKET TICKER (Full-Width Trading Sparkline)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-4 bg-[rgba(10,15,22,0.65)] backdrop-blur-xl border border-[rgba(0,240,255,0.22)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.15)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9.5px] font-semibold tracking-wider uppercase mb-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-slate-200">LIVE MARKET TICKER</span>
            </div>
            <div className="flex items-center gap-1 text-[#00FF9D]">
              <TrendingUp className="w-3 h-3" />
              <span>+3.84%</span>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
              1s Ticks
            </div>
            <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wide">
              VOLATILITY: <strong>0.84%</strong>
            </div>
          </div>
        </div>

        {/* Full-Width Institutional SVG Trading Sparkline */}
        <div className="w-full h-[65px] mt-2 relative overflow-hidden rounded-[4px] bg-[rgba(5,7,10,0.4)] border border-[rgba(0,240,255,0.1)]">
          {/* Subtle Grid horizontal bars inside chart */}
          <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none opacity-20">
            <div className="border-b border-[#00F0FF]/30 w-full" />
            <div className="border-b border-[#00F0FF]/30 w-full" />
            <div className="border-b border-[#00F0FF]/30 w-full" />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="fullTradingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#00F0FF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
              </linearGradient>

              <filter id="fullSparkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Gradient Area Fill */}
            <polygon
              points={areaPath}
              fill="url(#fullTradingGrad)"
              className="transition-all duration-300 ease-out"
            />

            {/* Neon Cyan Main Sparkline */}
            <polyline
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePath}
              filter="url(#fullSparkGlow)"
              className="transition-all duration-300 ease-out"
            />

            {/* Live Point with Glowing Pulse */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3.5"
              fill="#00FF9D"
              className="animate-glow-pulse"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="6"
              fill="none"
              stroke="#00FF9D"
              strokeWidth="1"
              strokeOpacity="0.8"
              className="animate-ping"
              style={{ animationDuration: '2s' }}
            />
          </svg>
        </div>

        {/* Card Sub-Status */}
        <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mt-1 select-none">
          <span>HIGH-FREQ ALGO FEED</span>
          <span className="text-[#00FF9D]">ORDERBOOK SYNC OK</span>
        </div>
      </div>

      {/* ========================================================
          CARD 2: R25K LAYER (Kelly Aware - Thick Glowing Progress)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-4 bg-[rgba(10,15,22,0.65)] backdrop-blur-xl border border-[rgba(0,240,255,0.22)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.15)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9.5px] font-semibold tracking-wider uppercase mb-1">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[#00FF9D]" />
              <span className="text-slate-200">R25K LAYER:</span>
            </div>
            <div className="flex items-center gap-1 text-[#00F0FF]">
              <ShieldCheck className="w-3 h-3" />
              <span>STABLE</span>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
              Kelly Aware
            </div>
            <div className="text-base font-mono font-bold text-[#00FF9D] drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]">
              68.4%
            </div>
          </div>
        </div>

        {/* Expanded Thick Multi-Segmented Glowing Progress Gauge */}
        <div className="my-2">
          {/* Progress Bar Container */}
          <div className="w-full h-5 rounded-[4px] bg-[rgba(5,7,10,0.8)] border border-[rgba(0,240,255,0.3)] p-0.5 relative overflow-hidden flex items-center shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]">
            {/* Filled Bar with Cyan-to-Green Gradient */}
            <div
              className="h-full rounded-[2px] bg-gradient-to-r from-[#00F0FF] via-[#00FFBF] to-[#00FF9D] shadow-[0_0_16px_rgba(0,255,157,0.7)] transition-all duration-500 relative flex items-center justify-end pr-1"
              style={{ width: '68.4%' }}
            >
              {/* Glowing Leading Head Line */}
              <div className="w-1.5 h-full bg-white shadow-[0_0_8px_#FFFFFF] rounded-r-[1px] animate-pulse" />
            </div>

            {/* Segment Divider Marks (Institutional Grid Ruler) */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-[1px] h-full bg-[#05070A]/80" />
              ))}
            </div>
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1 px-0.5">
            <span>0% (MIN)</span>
            <span>HALF-KELLY (0.50F)</span>
            <span>100% (MAX)</span>
          </div>
        </div>

        {/* Card Sub-Status */}
        <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 select-none">
          <span>CAPITAL PRESERVATION</span>
          <span className="text-[#00F0FF]">DRAWDOWN &lt; 2.1%</span>
        </div>
      </div>

      {/* ========================================================
          CARD 3: AI CONSENSUS (Multi Model - Expanded Neural Brain)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-4 bg-[rgba(10,15,22,0.65)] backdrop-blur-xl border border-[rgba(0,240,255,0.22)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.15)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9.5px] font-semibold tracking-wider uppercase mb-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-slate-200">AI CONSENSUS:</span>
            </div>
            <div className="text-[10px] font-mono text-[#00FF9D] font-bold">
              4/4 CONGRUENT
            </div>
          </div>

          {/* Metric & Brain Cluster Row */}
          <div className="flex items-center justify-between mt-1">
            <div>
              <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
                Multi Model
              </div>
              {/* Badges of Participating Models */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[8px] font-mono text-[#00F0FF]">
                  SAC-AI
                </span>
                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[8px] font-mono text-[#00FF9D]">
                  WYCKOFF
                </span>
                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#A78BFA]/10 border border-[#A78BFA]/30 text-[8px] font-mono text-[#A78BFA]">
                  HARMONIC
                </span>
              </div>
            </div>

            {/* Faceted 3D Neural Cluster Glyph */}
            <div className="scale-110">
              <NeuralClusterIcon />
            </div>
          </div>
        </div>

        {/* Card Sub-Status */}
        <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mt-2 select-none">
          <span>COGNITIVE WEIGHTING: ACTIVE</span>
          <span className="text-[#00FF9D]">CONFIDENCE: 94.2%</span>
        </div>
      </div>
    </div>
  );
};

export default RightTelemetryCards;
