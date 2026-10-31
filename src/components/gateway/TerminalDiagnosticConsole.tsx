'use client';

import React from 'react';

interface LogItem {
  timestamp: string;
  prefix: string;
  message: string;
  status: string;
}

const LOG_ENTRIES: LogItem[] = [
  {
    timestamp: '11:35:43 AM',
    prefix: 'SYSTEM:',
    message: 'DE METHODOLOGY ANALYZERS',
    status: 'INITIALIZED (SAC, WYCKOFF, HARMONIC...)',
  },
  {
    timestamp: '11:35:43 AM',
    prefix: 'SYSTEM:',
    message: 'MULTI-TIMEFRAME ANALYSIS',
    status: 'COMPLETE // ACTIVE',
  },
  {
    timestamp: '11:35:44 AM',
    prefix: 'SYSTEM:',
    message: 'HALF-KELLY CAPITAL PRESERVATION STRATEGY:',
    status: 'STABLE',
  },
  {
    timestamp: '11:35:44 AM',
    prefix: 'SYSTEM:',
    message: 'WARPING: TIME MACHINE VOLATILITY DETECTED:',
    status: 'HIGH',
  },
  {
    timestamp: '11:35:45 AM',
    prefix: 'SYSTEM:',
    message: 'COGNITIVE ENCRYPTION COMPLETE //',
    status: 'CONNECTED',
  },
];

export const TerminalDiagnosticConsole: React.FC = () => {
  return (
    <div className="w-full max-w-[640px] rounded-[10px] bg-[rgba(10,15,22,0.72)] backdrop-blur-[18px] border border-[rgba(0,240,255,0.22)] shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(0,240,255,0.18)] p-3.5 px-4 md:px-5 select-text overflow-hidden transition-all duration-300">
      <div className="flex flex-col gap-1.5 font-mono text-[9px] sm:text-[9.5px] md:text-[10px] leading-relaxed text-left whitespace-nowrap overflow-x-auto terminal-scroll">
        {LOG_ENTRIES.map((log, idx) => (
          <div key={`log-row-${idx}`} className="flex items-center gap-1.5">
            {/* Timestamp [11:35:43 AM] */}
            <span className="text-slate-400 font-medium tracking-tight shrink-0">
              [{log.timestamp}]
            </span>

            {/* SYSTEM: */}
            <span className="text-[#00F0FF] font-bold shrink-0">
              {log.prefix}
            </span>

            {/* Message Body */}
            <span className="text-[#CBD5E1] shrink-0 font-normal">
              {log.message}
            </span>

            {/* Status (Matrix Green #00FF9D) */}
            <span className="text-[#00FF9D] font-bold shrink-0 drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">
              {log.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalDiagnosticConsole;
