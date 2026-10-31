'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LogItem {
  timestamp: string;
  prefix: string;
  message: string;
  status: string;
  type: 'success' | 'info' | 'warn';
}

const INITIAL_LOG_ENTRIES: Omit<LogItem, 'timestamp'>[] = [
  {
    prefix: 'SYSTEM:',
    message: 'DE METHODOLOGY ANALYZERS',
    status: 'INITIALIZED (SAC, WYCKOFF, HARMONIC...)',
    type: 'success',
  },
  {
    prefix: 'SYSTEM:',
    message: 'MULTI-TIMEFRAME ANALYSIS',
    status: 'COMPLETE // ACTIVE',
    type: 'success',
  },
  {
    prefix: 'SYSTEM:',
    message: 'HALF-KELLY CAPITAL PRESERVATION STRATEGY:',
    status: 'STABLE',
    type: 'success',
  },
  {
    prefix: 'SYSTEM:',
    message: 'WARPING: TIME MACHINE VOLATILITY DETECTED:',
    status: 'HIGH',
    type: 'warn',
  },
  {
    prefix: 'SYSTEM:',
    message: 'COGNITIVE ENCRYPTION COMPLETE //',
    status: 'CONNECTED',
    type: 'success',
  },
];

export const TerminalDiagnosticConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial time format matching user screenshot [11:35:43 AM]
    const now = new Date();
    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    };

    const timers: NodeJS.Timeout[] = [];

    // Stream entries sequentially for real-time typewriter / terminal boot feeling
    INITIAL_LOG_ENTRIES.forEach((item, index) => {
      const t = setTimeout(() => {
        const entryTime = new Date(now.getTime() + index * 1000);
        setLogs(prev => [
          ...prev,
          {
            ...item,
            timestamp: formatTime(entryTime),
          },
        ]);
      }, (index + 1) * 350);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-scroll to bottom on new log line
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-[620px] rounded-[8px] bg-[rgba(10,15,22,0.7)] backdrop-blur-[16px] border border-[rgba(0,240,255,0.18)] shadow-[0_8px_32px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(0,240,255,0.15)] overflow-hidden transition-all duration-300">
      {/* Terminal Title Bar */}
      <div className="h-6 px-3 bg-[rgba(5,7,10,0.6)] border-b border-[rgba(0,240,255,0.12)] flex items-center justify-between text-[9px] font-mono tracking-wider text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
          <span className="text-cyan-400 font-semibold">DIAGNOSTIC_LOG // CONSOLE</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>PORT: 8089</span>
          <span>BAUD: 115200</span>
        </div>
      </div>

      {/* Terminal Output Log Content */}
      <div
        ref={scrollContainerRef}
        className="h-[110px] md:h-[125px] overflow-y-auto p-3 font-mono text-[9.5px] md:text-[10px] leading-relaxed select-text terminal-scroll flex flex-col gap-1.5"
      >
        {logs.length === 0 && (
          <div className="flex items-center gap-2 text-cyan-400/60 animate-pulse">
            <span className="inline-block w-2 h-3.5 bg-cyan-400" />
            <span>ESTABLISHING QUANTITATIVE SECURE TUNNEL...</span>
          </div>
        )}

        {logs.map((log, idx) => (
          <div key={`log-row-${idx}`} className="flex items-start gap-1.5 whitespace-nowrap overflow-x-hidden text-left">
            {/* Timestamp */}
            <span className="text-slate-400 shrink-0 font-medium tracking-tight">
              [{log.timestamp}]
            </span>

            {/* Prefix */}
            <span className="text-[#00F0FF] font-bold shrink-0">
              {log.prefix}
            </span>

            {/* Message Body */}
            <span className="text-slate-300 font-normal truncate">
              {log.message}
            </span>

            {/* Status Token */}
            <span
              className={`font-semibold shrink-0 ${
                log.type === 'success'
                  ? 'text-[#00FF9D] drop-shadow-[0_0_6px_rgba(0,255,157,0.4)]'
                  : log.type === 'warn'
                  ? 'text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]'
                  : 'text-cyan-400'
              }`}
            >
              {log.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalDiagnosticConsole;
