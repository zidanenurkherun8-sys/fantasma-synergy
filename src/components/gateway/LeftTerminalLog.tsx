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
    text: 'Wyckoff Analytics Engine...',
    status: 'OK',
    statusType: 'success',
  },
  {
    id: '2',
    timestamp: '11:35:43 AM',
    tag: '[SYS_INIT]',
    text: 'Kelly Capital Preservation...',
    status: 'ACTIVE',
    statusType: 'success',
  },
  {
    id: '3',
    timestamp: '11:35:44 AM',
    tag: '[SYS_INIT]',
    text: 'Multi-Timeframe Confluence...',
    status: 'ARMED',
    statusType: 'success',
  },
  {
    id: '4',
    timestamp: '11:35:44 AM',
    tag: '[WARPING]',
    text: 'Time-Machine Volatility Regime...',
    status: 'STABLE',
    statusType: 'info',
  },
  {
    id: '5',
    timestamp: '11:35:45 AM',
    tag: '[CRYPTO]',
    text: 'Cognitive Encryption Layer...',
    status: 'CONNECTED',
    statusType: 'success',
  },
];

const STREAMING_POOL = [
  { tag: '[ORDERBOOK]', text: 'Indodax Liquidity Scan...', status: 'SYNCED', statusType: 'info' },
  { tag: '[ORACLE]', text: 'Harmonic Pattern Detector...', status: 'VALIDATED', statusType: 'success' },
  { tag: '[KELLY]', text: 'Half-Kelly Risk Recalibration...', status: 'STABLE', statusType: 'success' },
  { tag: '[FEED]', text: 'Forex Confluence Matrix...', status: 'ARMED', statusType: 'info' },
  { tag: '[RADAR]', text: 'Micro-Structure Jitter Filter...', status: 'ACTIVE', statusType: 'success' },
];

export const LeftTerminalLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-stream logs periodically with typing/arrival cadence
  useEffect(() => {
    let count = 6;
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
        // Keep last 10 entries for concise institutional look
        return nextList.slice(-10);
      });
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  // Smooth scroll
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-[390px] xl:h-[410px] flex flex-col rounded-[10px] bg-[#0A0F16]/50 backdrop-blur-xl border border-[rgba(0,240,255,0.2)] shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(0,240,255,0.15)] overflow-hidden transition-all duration-300">
      {/* Console Top Bar */}
      <div className="h-9 px-3.5 bg-[rgba(5,7,10,0.7)] border-b border-[rgba(0,240,255,0.15)] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-200 uppercase">
            DIAGNOSTIC_LOG // CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          <span className="text-[9px] font-mono font-semibold text-[#00FF9D] tracking-wider uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Telemetry Status Strip */}
      <div className="px-3.5 py-1.5 bg-[rgba(0,240,255,0.03)] border-b border-[rgba(0,240,255,0.08)] flex items-center justify-between text-[8.5px] font-mono text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-[#00F0FF]" />
          <span>ARMOR: <strong className="text-white">ACTIVE</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-[#00FF9D]" />
          <span>LATENCY: <strong className="text-[#00FF9D]">12ms</strong></span>
        </div>
      </div>

      {/* Streaming Log Content with Bottom Fade-Out Mask */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3.5 font-mono text-[9px] md:text-[9.5px] leading-relaxed overflow-y-auto flex flex-col gap-2.5 terminal-scroll select-text relative"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
        }}
      >
        {logs.map((log, idx) => (
          <div
            key={log.id}
            className="flex flex-col gap-0.5 border-b border-[rgba(30,41,59,0.3)] pb-1.5 last:border-0"
          >
            <div className="flex items-center justify-between text-[8px] text-slate-400">
              <span>[{log.timestamp}]</span>
              <span className="text-[#00F0FF] font-semibold">{log.tag}</span>
            </div>
            <div className="flex items-center justify-between gap-1 text-[9px]">
              <span className="text-slate-300 font-normal truncate">{log.text}</span>
              <span
                className={`shrink-0 font-bold ${
                  log.statusType === 'success'
                    ? 'text-[#00FF9D] drop-shadow-[0_0_6px_rgba(0,255,157,0.4)]'
                    : 'text-cyan-400'
                }`}
              >
                {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Footer */}
      <div className="h-6 px-3.5 bg-[rgba(5,7,10,0.8)] border-t border-[rgba(0,240,255,0.1)] flex items-center justify-between text-[8px] font-mono text-slate-500 shrink-0 select-none">
        <span>MEM: 512MB // OK</span>
        <span className="text-cyan-400">CH-01: READY</span>
      </div>
    </div>
  );
};

export default LeftTerminalLog;
