import React, { useState } from 'react';
import { Sparkles, Brain, Zap, Info, ShieldAlert } from 'lucide-react';
import { OracleSignal } from '@/lib/oracle-engine';

interface OracleGaugeProps {
  signal: OracleSignal | null;
  loading: boolean;
}

export default function OracleGauge({ signal, loading }: OracleGaugeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading) {
    return (
      <div className="quantum-card rounded-xl p-6 border border-[#30363D] bg-[#161B22] flex flex-col items-center justify-center h-48 select-none">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#58A6FF] animate-spin" />
          <div className="absolute inset-2 rounded-full border-b-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse' }} />
        </div>
        <span className="text-[10px] text-[#8B949E] font-mono uppercase tracking-widest mt-4 animate-pulse">Running Ensemble Network...</span>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="quantum-card rounded-xl p-6 border border-[#30363D] bg-[#161B22] flex flex-col items-center justify-center text-center h-48 select-none text-slate-500 font-sans">
        <ShieldAlert className="h-8 w-8 mb-2 opacity-40 text-slate-500" />
        <span className="text-xs uppercase font-extrabold tracking-wider">No Active Oracle Signals</span>
        <span className="text-[10px] text-[#8B949E] mt-1 font-mono">Cash is a Position — Warren Buffett</span>
      </div>
    );
  }

  const conf = signal.confidence;
  const isNeutral = signal.direction === 'NEUTRAL';
  
  // Decide Tier styling
  let glowClass = '';
  let ringColor = 'stroke-[#8B949E]';
  
  if (signal.tier === 'ORACLE') {
    glowClass = 'shadow-[0_0_25px_rgba(255,215,0,0.35)] border-yellow-500 animate-pulse';
    ringColor = 'stroke-[#FFD700]';
  } else if (signal.tier === 'DIAMOND') {
    glowClass = 'shadow-[0_0_25px_rgba(185,242,255,0.35)] border-[#B9F2FF]';
    ringColor = 'stroke-[#B9F2FF]';
  } else if (signal.tier === 'PROFESSIONAL') {
    glowClass = 'shadow-[0_0_15px_rgba(192,192,192,0.2)] border-slate-400';
    ringColor = 'stroke-[#C0C0C0]';
  } else if (signal.tier === 'STANDARD') {
    glowClass = 'shadow-[0_0_10px_rgba(205,127,50,0.15)] border-[#CD7F32]';
    ringColor = 'stroke-[#CD7F32]';
  }

  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference * (1 - conf / 100);

  // Extract model details
  const models = signal.modelConsensus
    ? [
        { key: 'lstm', label: 'LSTM-7T', vote: signal.modelConsensus.lstm.vote },
        { key: 'xgboost', label: 'XGBoost', vote: signal.modelConsensus.xgboost.vote },
        { key: 'transformer', label: 'Transformer', vote: signal.modelConsensus.transformer.vote },
        { key: 'randomForest', label: 'R-Forest', vote: signal.modelConsensus.randomForest.vote },
        { key: 'lightgbm', label: 'LightGBM', vote: signal.modelConsensus.lightgbm.vote },
        { key: 'catboost', label: 'CatBoost', vote: signal.modelConsensus.catboost.vote },
        { key: 'gru', label: 'GRU-Attn', vote: signal.modelConsensus.gru.vote },
        { key: 'cnn', label: 'CNN-1D', vote: signal.modelConsensus.cnn.vote },
        { key: 'prophet', label: 'Prophet', vote: signal.modelConsensus.prophet.vote }
      ]
    : [];

  return (
    <div className={`quantum-card rounded-xl p-5 border border-[#30363D] bg-[#161B22] flex flex-col items-center justify-center text-center relative select-none ${glowClass}`}>
      <span className="text-[10px] text-[#8B949E] uppercase font-bold font-sans mb-3 tracking-wider">Oracle Confidence</span>

      {/* Main interactive Gauge Area */}
      <div 
        className="relative h-28 w-28 flex items-center justify-center cursor-help mb-3 group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* SVG confidence circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="38"
            className="stroke-[#30363D]"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r="38"
            className={`transition-all duration-1000 ease-out ${ringColor}`}
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Outer Ring segmented model indicators (9 dots) */}
        <div className="absolute inset-0 rounded-full pointer-events-none">
          {models.map((m, idx) => {
            const angle = idx * (360 / 9) - 90; // distribute evenly
            const radius = 51; // slightly outside the confidence circle
            const radians = (angle * Math.PI) / 180;
            const x = 56 + radius * Math.cos(radians);
            const y = 56 + radius * Math.sin(radians);
            
            // LED Colors: Green for LONG, Red for SHORT, Orange/Gray for NEUTRAL
            const ledColor = m.vote === 'LONG' 
              ? 'bg-[#3FB950] shadow-[0_0_6px_rgba(63,185,80,0.8)]' 
              : m.vote === 'SHORT' 
                ? 'bg-[#F85149] shadow-[0_0_6px_rgba(248,81,73,0.8)]' 
                : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]';

            return (
              <div 
                key={`led-${m.key}`}
                className={`absolute w-2 h-2 rounded-full border border-[#0D1117] ${ledColor}`}
                style={{ 
                  left: `${x - 4}px`, 
                  top: `${y - 4}px`,
                }}
              />
            );
          })}
        </div>

        {/* Center Text representation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold font-mono text-[#E6EDF3] leading-none">
            {conf}%
          </span>
          <span className="text-[7px] text-[#8B949E] uppercase font-sans mt-0.5 tracking-widest font-bold">Confidence</span>
        </div>

        {/* Interactive Tooltip Card */}
        {showTooltip && models.length > 0 && (
          <div className="absolute top-28 z-50 w-52 bg-[#0D1117] border border-[#30363D] p-3 rounded-lg shadow-2xl text-left pointer-events-none animate-fadeIn">
            <div className="flex items-center gap-1 mb-2 border-b border-[#30363D] pb-1">
              <Info className="h-3.5 w-3.5 text-[#58A6FF]" />
              <span className="text-[10px] font-bold text-[#E6EDF3] font-sans uppercase">Model Consensus Votes</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-[9px]">
              {models.map((m) => {
                const dirColor = m.vote === 'LONG' ? 'text-[#3FB950]' : m.vote === 'SHORT' ? 'text-[#F85149]' : 'text-amber-500';
                return (
                  <div key={`tooltip-${m.key}`} className="flex justify-between">
                    <span className="text-[#8B949E]">{m.label}:</span>
                    <span className={`font-bold ${dirColor}`}>{m.vote}</span>
                  </div>
                );
              })}
              <div className="mt-1.5 pt-1 border-t border-[#30363D] flex justify-between font-sans text-[8px] text-[#8B949E] uppercase font-bold">
                <span>Agreement Score:</span>
                <span className="text-[#E6EDF3] font-mono font-extrabold text-[9px]">
                  {Math.round(signal.modelConsensus.agreement * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <span className="text-[9px] font-mono text-[#8B949E] uppercase flex items-center gap-1 justify-center mt-1">
        <Sparkles className="h-3 w-3 text-yellow-500" /> Hover for Model Details
      </span>
    </div>
  );
}
