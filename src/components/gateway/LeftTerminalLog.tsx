'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  tag: string;
  text: string;
  status: string;
  statusType: 'success' | 'info' | 'warn';
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '11:35:43 AM',
    tag: '[SYS_INIT]',
    text: 'DE METHODOLOGY ANALYZERS',
    status: 'INITIALIZED',
    statusType: 'success',
  },
  {
    id: '2',
    timestamp: '11:35:43 AM',
    tag: '[SYS_INIT]',
    text: 'MULTI-TIMEFRAME ANALYSIS',
    status: 'COMPLETE // ACTIVE',
    statusType: 'success',
  },
  {
    id: '3',
    timestamp: '11:35:44 AM',
    tag: '[RISK_LAB]',
    text: 'HALF-KELLY PRESERVATION',
    status: 'STABLE (0.50F)',
    statusType: 'success',
  },
  {
    id: '4',
    timestamp: '11:35:44 AM',
    tag: '[WARPING]',
    text: 'TIME MACHINE VOLATILITY',
    status: 'HIGH REGIME',
    statusType: 'warn',
  },
  {
    id: '5',
    timestamp: '11:35:45 AM',
    tag: '[CRYPTO]',
    text: 'COGNITIVE ENCRYPTION',
    status: 'CONNECTED',
    statusType: 'success',
  },
  {
    id: '6',
    timestamp: '11:35:46 AM',
    tag: '[MARKET]',
    text: 'INDODAX 28 PAIR STREAM',
    status: 'SYNCED (12MS)',
    statusType: 'info',
  },
  {
    id: '7',
    timestamp: '11:35:47 AM',
    tag: '[WYCKOFF]',
    text: 'ACCUMULATION PHASE B DETECT',
    status: 'CONFIRMED',
    statusType: 'success',
  },
  {
    id: '8',
    timestamp: '11:35:48 AM',
    tag: '[HARMONIC]',
    text: 'BULLISH CYCLIC BAT PATTERN',
    status: 'VALIDATED',
    statusType: 'success',
  },
];

const STREAMING_POOL = [
  { tag: '[ORDERBOOK]', text: 'BID/ASK PRESSURE RATIO', status: '1.42 (BULLISH)', statusType: 'success' },
  { tag: '[ORACLE]', text: 'M1→MN CONFLUENCE MATRIX', status: 'CALIBRATED', statusType: 'info' },
  { tag: '[KELLY]', text: 'CAPITAL BUFFER THRESHOLD', status: '68.4% OPTIMAL', statusType: 'success' },
  { tag: '[SECURITY]', text: 'QUANTUM TUNNEL INTEGRITY', status: '100% ARMORED', statusType: 'success' },
  { tag: '[FEED]', text: 'XAUUSD/BTC CONGRUENCE', status: 'COUPLED', statusType: 'info' },
  { tag: '[RADAR]', text: 'VOLATILITY CLUSTER SCAN', status: 'MONITORED', statusType: 'success' },
];

export const LeftTerminalLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-stream additional telemetry logs periodically
  useEffect(() => {
    let count = 9;
    const interval = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

      const randomTemplate = STREAMING_POOL[Math.floor(Math.random() * STREAMING_POOL.length)];

      setLogs(prev => {
        const nextList = [
          ...prev,
          {
            id: String(count++),
            timestamp: timeStr,
            tag: randomTemplate.tag,
            text: randomTemplate.text,
            status: randomTemplate.status,
            statusType: randomTemplate.statusType as any,
          },
        ];
        // Keep last 22 lines for memory & clean render
        return nextList.slice(-22);
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Smooth scroll to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full flex flex-col rounded-[10px] bg-[rgba(10,15,22,0.65)] backdrop-blur-xl border border-[rgba(0,240,255,0.22)] shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(0,240,255,0.18)] overflow-hidden transition-all duration-300">
      {/* Console Top Bar */}
      <div className="h-9 px-4 bg-[rgba(5,7,10,0.75)] border-b border-[rgba(0,240,255,0.15)] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-200 uppercase">
            DIAGNOSTIC_LOG // STREAM
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
          <span className="text-[9px] font-mono font-semibold text-[#00FF9D] tracking-wider uppercase">
            LIVE 60FPS
          </span>
        </div>
      </div>

      {/* Quick Server Status Strip */}
      <div className="px-4 py-2 bg-[rgba(0,240,255,0.03)] border-b border-[rgba(0,240,255,0.1)] flex items-center justify-between text-[9px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-[#00F0FF]" />
          <span>ARMOR: <strong className="text-white">ACTIVE</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#00FF9D]" />
          <span>LATENCY: <strong className="text-[#00FF9D]">12ms</strong></span>
        </div>
      </div>

      {/* Streaming Terminal Log Content */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3.5 md:p-4 font-mono text-[9.5px] leading-relaxed overflow-y-auto flex flex-col gap-2 terminal-scroll select-text"
      >
        {logs.map(log => (
          <div
            key={log.id}
            className="flex flex-col gap-0.5 border-b border-[rgba(30,41,59,0.35)] pb-1.5 last:border-0"
          >
            <div className="flex items-center justify-between text-[8.5px] text-slate-400">
              <span>[{log.timestamp}]</span>
              <span className="text-[#00F0FF] font-semibold">{log.tag}</span>
            </div>
            <div className="flex items-start justify-between gap-1 text-[9.5px]">
              <span className="text-slate-300 font-normal truncate">{log.text}</span>
              <span
                className={`shrink-0 font-bold ${
                  log.statusType === 'success'
                    ? 'text-[#00FF9D] drop-shadow-[0_0_6px_rgba(0,255,157,0.4)]'
                    : log.statusType === 'warn'
                    ? 'text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                    : 'text-cyan-300'
                }`}
              >
                {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Footer Status */}
      <div className="h-7 px-4 bg-[rgba(5,7,10,0.8)] border-t border-[rgba(0,240,255,0.12)] flex items-center justify-between text-[8.5px] font-mono text-slate-400 shrink-0 select-none">
        <span>MEM: 512MB // LOSSLESS</span>
        <span className="text-cyan-400">CH-01: READY</span>
      </div>
    </div>
  );
};

export default LeftTerminalLog;
