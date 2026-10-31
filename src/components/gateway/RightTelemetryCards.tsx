'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, BarChart2, Cpu, TrendingUp, ShieldCheck } from 'lucide-react';
import { NeuralClusterIcon } from './NeuralClusterIcon';

export const RightTelemetryCards: React.FC = () => {
  // Sparkline data points for full-width trading chart
  const [sparkPoints, setSparkPoints] = useState<number[]>([
    22, 16, 28, 20, 26, 38, 28, 44, 34, 50, 40, 58, 46, 62, 54, 70, 60, 74, 68, 80
  ]);

  // High-frequency live tick update
  useEffect(() => {
    const timer = setInterval(() => {
      setSparkPoints(prev => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.48) * 10;
        const next = Math.max(15, Math.min(88, last + delta));
        return [...prev.slice(1), next];
      });
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const width = 240;
  const height = 48;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const step = width / (sparkPoints.length - 1);
    const coords = sparkPoints.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / 95) * (height - 8) - 4;
      return { x, y };
    });

    const line = coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `0,${height} ${line} ${width},${height}`;
    const last = coords[coords.length - 1];

    return { linePath: line, areaPath: area, lastPoint: last };
  }, [sparkPoints]);

  return (
    <div className="w-full h-[390px] xl:h-[410px] flex flex-col justify-between gap-2.5">
      {/* ========================================================
          CARD 1: LIVE MARKET TICKER (Full-Width Trading Sparkline)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-3 px-3.5 bg-[#0A0F16]/50 backdrop-blur-xl border border-[rgba(0,240,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.12)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-0.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-slate-200">LIVE MARKET TICKER</span>
            </div>
            <div className="flex items-center gap-1 text-[#00FF9D]">
              <TrendingUp className="w-3 h-3" />
              <span>+3.84%</span>
            </div>
          </div>

          {/* Metric */}
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-mono font-extrabold text-white tracking-tight">
              1s Ticks
            </div>
            <div className="text-[8.5px] font-mono text-cyan-400 font-semibold">
              HIGH-FREQ FEED
            </div>
          </div>
        </div>

        {/* Real Trading Chart with Gradient Fill */}
        <div className="w-full h-[46px] my-1 relative overflow-hidden rounded-[3px] bg-[rgba(5,7,10,0.4)] border border-[rgba(0,240,255,0.08)]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="solidTradingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.38" />
                <stop offset="70%" stopColor="#00F0FF" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
              </linearGradient>

              <filter id="solidSparkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Gradient Fill under Sparkline */}
            <polygon
              points={areaPath}
              fill="url(#solidTradingGrad)"
              className="transition-all duration-300 ease-out"
            />

            {/* Neon Cyan Sparkline */}
            <polyline
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePath}
              filter="url(#solidSparkGlow)"
              className="transition-all duration-300 ease-out"
            />

            {/* Live Point */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="2.8"
              fill="#00FF9D"
              className="animate-glow-pulse"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 select-none">
          <span>VOLATILITY: 0.84%</span>
          <span className="text-[#00FF9D]">SYNC OK</span>
        </div>
      </div>

      {/* ========================================================
          CARD 2: R25K LAYER (Kelly Aware - Solid Rounded Progress Bar)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-3 px-3.5 bg-[#0A0F16]/50 backdrop-blur-xl border border-[rgba(0,240,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.12)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-0.5">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[#00FF9D]" />
              <span className="text-slate-200">R25K LAYER:</span>
            </div>
            <div className="flex items-center gap-1 text-[#00F0FF]">
              <ShieldCheck className="w-3 h-3" />
              <span>STABLE</span>
            </div>
          </div>

          {/* Metric */}
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-mono font-extrabold text-white tracking-tight">
              Kelly Aware
            </div>
            <div className="text-sm font-mono font-bold text-[#00FF9D] drop-shadow-[0_0_6px_rgba(0,255,157,0.6)]">
              68.4%
            </div>
          </div>
        </div>

        {/* Solid Progress Bar with Rounded Ends and Subtle Glow */}
        <div className="my-1">
          <div className="w-full h-3 rounded-full bg-[rgba(5,7,10,0.8)] border border-[rgba(0,240,255,0.25)] p-[2px] relative overflow-hidden shadow-[inset_0_0_6px_rgba(0,0,0,0.8)]">
            {/* Solid Bar */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] via-[#00FFBF] to-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.7)] transition-all duration-500 relative flex items-center justify-end pr-0.5"
              style={{ width: '68.4%' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#FFFFFF] animate-pulse" />
            </div>
          </div>

          <div className="flex justify-between text-[7.5px] font-mono text-slate-400 mt-1 px-0.5">
            <span>0% MIN</span>
            <span>HALF-KELLY (0.50F)</span>
            <span>100% MAX</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 select-none">
          <span>CAPITAL PRESERVATION</span>
          <span className="text-[#00F0FF]">DRAWDOWN &lt; 2.1%</span>
        </div>
      </div>

      {/* ========================================================
          CARD 3: AI CONSENSUS (Multi Model - Neural Brain)
         ======================================================== */}
      <div className="flex-1 rounded-[10px] p-3 px-3.5 bg-[#0A0F16]/50 backdrop-blur-xl border border-[rgba(0,240,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(0,240,255,0.12)] flex flex-col justify-between hover:border-[#00F0FF]/50 transition-all duration-300">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-0.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-slate-200">AI CONSENSUS:</span>
            </div>
            <div className="text-[9px] font-mono text-[#00FF9D] font-bold">
              4/4 CONGRUENT
            </div>
          </div>

          {/* Metric & Brain Cluster Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-mono font-extrabold text-white tracking-tight">
                Multi Model
              </div>
              <div className="flex gap-1 mt-1">
                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[7.5px] font-mono text-[#00F0FF]">
                  SAC-AI
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[7.5px] font-mono text-[#00FF9D]">
                  WYCKOFF
                </span>
              </div>
            </div>

            <div className="scale-95 origin-right">
              <NeuralClusterIcon />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 select-none">
          <span>CONFIDENCE: 94.2%</span>
          <span className="text-[#00FF9D]">WEIGHTING ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default RightTelemetryCards;
