'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, Zap, Shield, TrendingUp, TrendingDown, Minus, RefreshCw,
  ChevronRight, Activity, BarChart2, Clock, Target, AlertTriangle,
  CheckCircle, XCircle, DollarSign, BookOpen, Layers, Cpu, Search,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import type { ForexSignal, MethodologyConfluence } from '@/lib/forex-oracle-engine';
import { FOREX_MAJORS, FOREX_MINORS, FOREX_EXOTICS } from '@/lib/forex-client';
import { audio } from '@/lib/audio';

const formatForexPrice = (value: number, pair: string): string => {
  const symUpper = (pair || '').toUpperCase();
  const isJpy = symUpper.includes('JPY');
  const isGoldOrOil = symUpper.includes('XAU') || symUpper.includes('USOIL') || symUpper.includes('XAG');
  if (isGoldOrOil) {
    return value.toFixed(symUpper.includes('XAG') ? 3 : 2);
  }
  return value.toFixed(isJpy ? 3 : 5);
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_DISPLAYABLE = [...FOREX_MAJORS, ...FOREX_MINORS.slice(0, 12), ...FOREX_EXOTICS.slice(0, 6)];

const TF_ORDER = ['M5', 'M15', 'H1', 'H4', 'D1'];

const ACADEMY_CARDS = [
  {
    id: 'smc', title: 'Smart Money Concepts (SMC)', icon: Cpu,
    content: `**Order Blocks (OB)**: Lilin terakhir sebelum ekspansi harga institusional. Bullish OB = candle turun sebelum impulse naik yang memicu BOS. Area ini adalah target re-entry tertajam dengan R:R terbaik.\n\n**Fair Value Gaps (FVG)**: Celah imbalance antara High candle ke-1 dan Low candle ke-3. Price cenderung kembali mengisi gap ini sebelum melanjutkan tren. Entry optimal di 50% FVG (Equilibrium).`,
  },
  {
    id: 'htf', title: 'Higher Timeframe (HTF) Bias', icon: Layers,
    content: `Selalu analisis dari **D1 → H4 → H1 → M15**. HTF menentukan bias makro. Hanya ambil entry yang **searah dengan HTF bias**.\n\n**Golden Rule**: If D1 is bearish, only take SELL setups on H1/M15. Melawan HTF bias adalah sumber kerugian terbesar retail trader.`,
  },
  {
    id: 'rr', title: 'Risk:Reward Institutional Standard', icon: Target,
    content: `**Minimum 1:2.5** — Setiap trade harus memiliki potensi profit minimal 2.5x risiko yang diambil.\n\n**Scaling Strategy**: 40% posisi di TP1 (1:2.5) untuk lock profit, 30% di TP2 (1:3.5), sisakan 30% sebagai runner dengan trailing stop. Pindah ke breakeven setelah harga mencapai 1:1.5.`,
  },
  {
    id: 'session', title: 'Session & Liquidity Windows', icon: Clock,
    content: `**London-NY Overlap (20:00-22:00 WIB)**: Volume tertinggi, spread paling ketat, best time untuk EURUSD, GBPUSD, XAUUSD.\n\n**Tokyo Session (07:00-15:00 WIB)**: Optimal untuk JPY pairs & AUD/NZD. Range biasanya terbatas, scalping strategy lebih efektif.\n\n**Avoid**: 22:00-07:00 WIB — likuiditas rendah, spread melebar, false breakout tinggi.`,
  },
  {
    id: 'wyckoff', title: 'Wyckoff Spring & Upthrust', icon: Activity,
    content: `**Spring**: Harga menembus area support sementara (volume tinggi) lalu cepat recover di atas support. Sinyal akumulasi institusi selesai — entry LONG dengan SL di bawah spring.\n\n**Upthrust**: Harga menembus resistance sementara lalu reject tajam. Sinyal distribusi institusi — entry SHORT dengan SL di atas upthrust.`,
  },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SignalBadge({ direction, confidence }: { direction: string; confidence: number }) {
  if (direction === 'NO_CLEAR_SETUP') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#1C1F2E] border border-[#2A2D3E] text-[#8B949E] text-[10px] font-bold font-mono uppercase">
        <Minus className="h-3 w-3" /> NO SETUP
      </span>
    );
  }
  const isBuy = direction === 'BUY' || direction === 'bullish';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-[10px] font-bold font-mono uppercase border ${
      isBuy
        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
        : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
    }`}>
      {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isBuy ? 'BUY' : 'SELL'}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 88 ? '#FFD700' : value >= 80 ? '#00E5FF' : value >= 70 ? '#9D4EDD' : '#8B949E';
  const tier = value >= 88 ? 'ORACLE' : value >= 80 ? 'DIAMOND' : value >= 70 ? 'PROFESSIONAL' : 'ANALYST';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-[#8B949E]">Win Probability</span>
        <span style={{ color }} className="font-bold">{value}% · {tier}</span>
      </div>
      <div className="h-1.5 bg-[#1C1F2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
}

function TimeframeMatrix({ matrix }: { matrix: Record<string, 'BUY' | 'SELL' | 'NEUTRAL'> }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {TF_ORDER.map(tf => {
        const sig = matrix[tf] ?? 'NEUTRAL';
        return (
          <div key={tf} className={`flex flex-col items-center gap-1 py-2 rounded-[3px] border text-center ${
            sig === 'BUY' ? 'bg-emerald-950/40 border-emerald-500/30' :
            sig === 'SELL' ? 'bg-rose-950/40 border-rose-500/30' :
            'bg-[#0C0E18] border-[#1E2333]'
          }`}>
            <span className="text-[8px] text-[#8B949E] font-mono font-bold">{tf}</span>
            {sig === 'BUY' ? <TrendingUp className="h-3 w-3 text-emerald-400" /> :
             sig === 'SELL' ? <TrendingDown className="h-3 w-3 text-rose-400" /> :
             <Minus className="h-3 w-3 text-[#8B949E]" />}
            <span className={`text-[7px] font-bold font-mono ${
              sig === 'BUY' ? 'text-emerald-400' : sig === 'SELL' ? 'text-rose-400' : 'text-[#8B949E]'
            }`}>{sig}</span>
          </div>
        );
      })}
    </div>
  );
}

function ConfluenceList({ confluences }: { confluences: MethodologyConfluence[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {confluences.map((c, i) => (
        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-[3px] border text-[10px] ${
          c.signal === 'BULLISH' ? 'bg-emerald-950/30 border-emerald-500/20' :
          c.signal === 'BEARISH' ? 'bg-rose-950/30 border-rose-500/20' :
          'bg-[#0A0C14] border-[#1E2333]'
        }`}>
          <div className={`shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
            c.signal === 'BULLISH' ? 'bg-emerald-500/20' :
            c.signal === 'BEARISH' ? 'bg-rose-500/20' :
            'bg-[#1C1F2E]'
          }`}>
            {c.signal === 'BULLISH' ? <CheckCircle className="h-2.5 w-2.5 text-emerald-400" /> :
             c.signal === 'BEARISH' ? <XCircle className="h-2.5 w-2.5 text-rose-400" /> :
             <Minus className="h-2.5 w-2.5 text-[#8B949E]" />}
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#E6EDF3] font-bold font-sans truncate">{c.name}</span>
              <span className={`shrink-0 text-[9px] font-mono font-bold ${
                c.signal === 'BULLISH' ? 'text-emerald-400' :
                c.signal === 'BEARISH' ? 'text-rose-400' : 'text-[#8B949E]'
              }`}>{c.strength}%</span>
            </div>
            <span className="text-[#8B949E] leading-relaxed">{c.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RRVisualizer({ signal }: { signal: ForexSignal }) {
  if (!signal.takeProfits.length) return null;
  const isBuy = signal.bias === 'bullish';
  const entry = signal.entry.price;
  const sl = signal.stopLoss;
  const tp1 = signal.takeProfits[0]?.level ?? entry;
  const tp2 = signal.takeProfits[1]?.level ?? entry;
  const tp3 = signal.takeProfits[2]?.level ?? entry;
  const range = Math.abs(tp3 - sl);

  const pct = (price: number) => {
    if (isBuy) return ((price - sl) / (range || 1)) * 100;
    return ((sl - price) / (range || 1)) * 100;
  };

  const levels = [
    { label: 'SL', price: sl, pct: 0, color: '#EF4444' },
    { label: 'Entry', price: entry, pct: pct(entry), color: '#58A6FF' },
    { label: 'TP1', price: tp1, pct: pct(tp1), color: '#34D399' },
    { label: 'TP2', price: tp2, pct: pct(tp2), color: '#10B981' },
    { label: 'TP3', price: tp3, pct: pct(tp3), color: '#059669' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-8 bg-[#0C0E18] rounded-[3px] overflow-hidden border border-[#1E2333]">
        {/* SL zone */}
        <div className="absolute left-0 top-0 bottom-0 bg-rose-950/50" style={{ width: `${pct(entry)}%` }} />
        {/* TP zone */}
        <div className="absolute top-0 bottom-0 bg-emerald-950/40" style={{ left: `${pct(entry)}%`, right: 0 }} />
        {/* Entry line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-[#58A6FF]" style={{ left: `${pct(entry)}%` }} />
        {/* TP1/2/3 lines */}
        {[tp1, tp2, tp3].map((tp, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px" style={{ left: `${pct(tp)}%`, background: `rgba(52,211,153,${0.9 - i * 0.2})` }} />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {levels.map(l => (
          <div key={l.label} className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[8px] font-mono font-bold" style={{ color: l.color }}>{l.label}</span>
            <span className="text-[8px] text-[#8B949E] font-mono">{formatForexPrice(l.price, signal.symbol)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndicatorGrid({ signal, ind }: { signal: ForexSignal; ind: ForexSignal['indicators'] }) {
  const items = [
    { label: 'RSI(14)', value: ind.rsi.toFixed(1), color: ind.rsi > 70 ? '#EF4444' : ind.rsi < 30 ? '#10B981' : '#E6EDF3', note: ind.rsi > 70 ? 'OB' : ind.rsi < 30 ? 'OS' : '' },
    { label: 'ADX', value: ind.adx.toFixed(1), color: ind.adx > 25 ? '#FFD700' : '#8B949E', note: ind.adx > 25 ? 'TREND' : 'WEAK' },
    { label: 'ATR', value: formatForexPrice(ind.atr, signal.symbol), color: '#9D4EDD', note: '' },
    { label: 'BB Width', value: (ind.bbWidth * 100).toFixed(2) + '%', color: ind.bbWidth < 0.005 ? '#FFD700' : '#E6EDF3', note: ind.bbWidth < 0.005 ? 'SQZ' : '' },
    { label: 'Stoch %K', value: ind.stochK.toFixed(1), color: ind.stochK > 80 ? '#EF4444' : ind.stochK < 20 ? '#10B981' : '#E6EDF3', note: '' },
    { label: 'MACD Hist', value: ind.macd.histogram.toFixed(6), color: ind.macd.histogram > 0 ? '#10B981' : '#EF4444', note: '' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <div key={item.label} className="bg-[#0C0E18] border border-[#1E2333] rounded-[3px] p-2 flex flex-col gap-0.5">
          <span className="text-[8px] text-[#8B949E] font-mono">{item.label}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
            {item.note && <span className="text-[7px] text-[#8B949E]">{item.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionBanner({ session }: { session: ForexSignal['session'] }) {
  const sessions = [
    { name: 'Asian', active: session.asian, time: '00:00-09:00 UTC', color: '#FFD700' },
    { name: 'London', active: session.london, time: '08:00-17:00 UTC', color: '#00E5FF' },
    { name: 'New York', active: session.newYork, time: '13:00-22:00 UTC', color: '#9D4EDD' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {sessions.map(s => (
        <div key={s.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-[9px] font-mono font-bold transition-all ${
          s.active
            ? 'border-opacity-60 bg-opacity-20'
            : 'border-[#1E2333] bg-transparent text-[#4A5568]'
        }`}
          style={s.active ? { borderColor: s.color + '60', backgroundColor: s.color + '10', color: s.color } : {}}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${s.active ? 'animate-pulse' : 'bg-[#2A2D3E]'}`}
            style={s.active ? { background: s.color } : {}} />
          {s.name.toUpperCase()}
          <span className={`text-[7px] font-normal ${s.active ? '' : 'text-[#4A5568]'}`}>{s.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ForexOracleDashboard() {
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [signal, setSignal] = useState<ForexSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResults, setScanResults] = useState<ForexSignal[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPct, setRiskPct] = useState(0.75);
  const [pairSearch, setPairSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'signal' | 'scanner' | 'academy'>('signal');
  const [openAcademy, setOpenAcademy] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSignal = useCallback(async (pair: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    audio?.playClick();
    try {
      const res = await fetch('/api/forex-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair, account_size: accountSize, risk_pct: riskPct }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Signal fetch failed');
      const data = await res.json();
      setSignal(data);
      setLastRefresh(new Date());
      if (data.estimatedWinProbability >= 80) audio?.playSuccess?.();
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Signal fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [accountSize, riskPct]);

  const runScanner = useCallback(async () => {
    setScanLoading(true);
    audio?.playClick();
    try {
      const res = await fetch('/api/forex-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_size: accountSize, risk_pct: riskPct }),
      });
      const data = await res.json();
      setScanResults(data.signals ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Scanner error:', e);
    } finally {
      setScanLoading(false);
    }
  }, [accountSize, riskPct]);

  useEffect(() => { fetchSignal(selectedPair); }, [selectedPair, fetchSignal]);

  const filteredPairs = ALL_DISPLAYABLE.filter(p =>
    pairSearch ? p.toLowerCase().includes(pairSearch.toLowerCase()) : true
  );

  const isSetup = signal && signal.estimatedWinProbability >= 80;

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2333] pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#58A6FF] to-[#9D4EDD] flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#00E5FF]" /> FOREX INTELLIGENCE ENGINE
          </h2>
          <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">
            Institutional-Grade · 10 Methodologies · 80%+ Win Probability Gate · Exness / MIFX
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-[#8B949E]">
          {lastRefresh && <span>Updated: {lastRefresh.toLocaleTimeString('id-ID')}</span>}
          <button
            onClick={() => fetchSignal(selectedPair)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] rounded-[3px] hover:bg-[#00E5FF]/20 transition cursor-pointer disabled:opacity-50 text-[9px] font-bold"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-[#1E2333]">
        {[
          { id: 'signal', label: 'Signal Analysis', icon: Zap },
          { id: 'scanner', label: 'Universe Scanner', icon: Search },
          { id: 'academy', label: 'FX Academy', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveSection(tab.id as any); audio?.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase font-mono border-b-2 transition-all cursor-pointer ${
              activeSection === tab.id
                ? 'text-[#00E5FF] border-[#00E5FF]'
                : 'text-[#8B949E] border-transparent hover:text-[#E6EDF3]'
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SIGNAL ANALYSIS TAB */}
      {activeSection === 'signal' && (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
          {/* Pair Selector */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 text-[#8B949E]" />
                <input
                  value={pairSearch}
                  onChange={e => setPairSearch(e.target.value)}
                  placeholder="Search pair..."
                  className="bg-transparent text-[#E6EDF3] text-[10px] font-mono outline-none flex-1 placeholder:text-[#4A5568]"
                />
              </div>
            </div>

            <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1E2333] text-[9px] font-mono text-[#8B949E] font-bold flex justify-between">
                <span>PAIR</span><span>GROUP</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filteredPairs.map(pair => {
                  const group = FOREX_MAJORS.includes(pair) ? 'MAJOR' : FOREX_MINORS.includes(pair) ? 'MINOR' : 'EXOTIC';
                  return (
                    <button
                      key={pair}
                      onClick={() => { setSelectedPair(pair); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold border-b border-[#1E2333]/50 transition-all cursor-pointer text-left ${
                        selectedPair === pair
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                          : 'text-[#8B949E] hover:bg-[#0C0E18] hover:text-[#E6EDF3]'
                      }`}
                    >
                      <span>{pair}</span>
                      <span className={`text-[7px] px-1 py-0.5 rounded ${
                        group === 'MAJOR' ? 'bg-[#58A6FF]/10 text-[#58A6FF]' :
                        group === 'MINOR' ? 'bg-[#9D4EDD]/10 text-[#9D4EDD]' :
                        'bg-[#FFD700]/10 text-[#FFD700]'
                      }`}>{group}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Config */}
            <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-3">
              <div className="text-[9px] font-mono text-[#8B949E] font-bold border-b border-[#1E2333] pb-2">ACCOUNT CONFIG</div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono text-[#8B949E]">Account Size ($)</label>
                <input
                  type="number"
                  value={accountSize}
                  onChange={e => setAccountSize(Number(e.target.value))}
                  className="bg-[#0C0E18] border border-[#1E2333] text-[#E6EDF3] text-[10px] font-mono p-2 rounded-[3px] outline-none focus:border-[#00E5FF]/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono text-[#8B949E]">Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="2"
                  value={riskPct}
                  onChange={e => setRiskPct(Number(e.target.value))}
                  className="bg-[#0C0E18] border border-[#1E2333] text-[#E6EDF3] text-[10px] font-mono p-2 rounded-[3px] outline-none focus:border-[#00E5FF]/50"
                />
              </div>
            </div>
          </div>

          {/* Main Signal Panel */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-10 w-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-mono text-[#8B949E] animate-pulse">Analyzing {selectedPair} across 9 timeframes...</span>
              </div>
            ) : signal ? (
              <>
                {/* Signal Header Card */}
                <div className={`border rounded-[3px] p-4 flex flex-col gap-3 ${
                  isSetup
                    ? signal.bias === 'bullish'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-[#07090F] border-[#1E2333]'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-extrabold text-[#E6EDF3] font-mono">{signal.symbol}</span>
                        <SignalBadge direction={signal.bias === 'bullish' ? 'BUY' : signal.bias === 'bearish' ? 'SELL' : 'NO_CLEAR_SETUP'} confidence={signal.confidence} />
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${
                          signal.marketRegime === 'TRENDING' ? 'text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/10' :
                          signal.marketRegime === 'VOLATILE' ? 'text-[#EF4444] border-rose-500/30 bg-rose-950/20' :
                          signal.marketRegime === 'BREAKOUT' ? 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10' :
                          'text-[#9D4EDD] border-[#9D4EDD]/30 bg-[#9D4EDD]/10'
                        }`}>{signal.marketRegime}</span>
                      </div>
                      <div className="text-[9px] text-[#8B949E] font-mono mt-1">
                        {signal.dataSource} · {signal.timeframe} · {new Date(signal.timestamp).toLocaleTimeString('id-ID')} WIB
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-[#8B949E] font-mono">Entry Price</div>
                      <div className="text-lg font-bold font-mono text-[#E6EDF3]">{formatForexPrice(signal.entry.price, signal.symbol)}</div>
                      <div className="text-[8px] text-[#8B949E] font-mono">Zone: {signal.entry.zone}</div>
                    </div>
                  </div>

                  <ConfidenceMeter value={signal.estimatedWinProbability} />

                  {/* HTF / ITF / LTF Bias Pills */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'D1 HTF', bias: signal.htfBias },
                      { label: 'H4 ITF', bias: signal.itfBias },
                      { label: 'H1 LTF', bias: signal.ltfBias },
                    ].map(b => (
                      <span key={b.label} className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${
                        b.bias === 'BULLISH' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30' :
                        b.bias === 'BEARISH' ? 'text-rose-400 border-rose-500/30 bg-rose-950/30' :
                        'text-[#8B949E] border-[#1E2333] bg-[#0C0E18]'
                      }`}>{b.label}: {b.bias}</span>
                    ))}
                  </div>
                </div>

                {/* Session Banner */}
                <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-2">
                  <span className="text-[9px] font-mono text-[#8B949E] font-bold">ACTIVE SESSIONS</span>
                  <SessionBanner session={signal.session} />
                </div>

                {/* Timeframe Matrix */}
                <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-2">
                  <span className="text-[9px] font-mono text-[#8B949E] font-bold">MULTI-TIMEFRAME CONFLUENCE MATRIX</span>
                  <TimeframeMatrix matrix={signal.timeframeMatrix} />
                </div>

                {/* Setup Details (only if valid setup) */}
                {isSetup ? (
                  <>
                    {/* R:R Visualizer */}
                    <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-[#8B949E] font-bold">RISK:REWARD VISUALIZER</span>
                        <span className="text-[9px] font-mono text-[#00E5FF] font-bold">{signal.rrRatio} R:R</span>
                      </div>
                      <RRVisualizer signal={signal} />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {signal.takeProfits.map((tp, i) => (
                          <div key={i} className="bg-emerald-950/30 border border-emerald-500/20 rounded-[3px] p-2">
                            <div className="text-[8px] text-[#8B949E] font-mono">TP{i + 1} · {tp.portion}% pos</div>
                            <div className="text-[10px] font-bold text-emerald-400 font-mono">{formatForexPrice(tp.level, signal.symbol)}</div>
                            <div className="text-[8px] text-emerald-300/70 font-mono">RR: 1:{tp.rr}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Position Sizing */}
                    <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-2">
                      <span className="text-[9px] font-mono text-[#8B949E] font-bold">POSITION SIZING (ATR-BASED)</span>
                      <div className="bg-[#0C0E18] rounded-[3px] p-3 text-[10px] font-mono text-[#00E5FF]">
                        {signal.positionSize}
                      </div>
                      <div className="text-[9px] text-[#8B949E] font-mono leading-relaxed">{signal.riskManagement}</div>
                    </div>

                    {/* Alternative Scenarios */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-[3px] p-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono">
                          <ArrowUpRight className="h-3 w-3" /> BULL CASE
                        </div>
                        <p className="text-[9px] text-[#8B949E] leading-relaxed">{signal.alternativeScenarios.bullCase}</p>
                      </div>
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded-[3px] p-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-400 font-mono">
                          <ArrowDownRight className="h-3 w-3" /> BEAR CASE
                        </div>
                        <p className="text-[9px] text-[#8B949E] leading-relaxed">{signal.alternativeScenarios.bearCase}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* No Setup Panel */
                  <div className="bg-[#07090F] border border-[#FFD700]/20 rounded-[3px] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#FFD700]" />
                      <span className="text-[10px] font-bold text-[#FFD700] font-mono uppercase">NO CLEAR SETUP — Capital Preservation Mode</span>
                    </div>
                    <p className="text-[10px] text-[#8B949E] leading-relaxed font-mono">{signal.noSetupReason}</p>
                  </div>
                )}

                {/* Technical Indicators */}
                <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-3">
                  <span className="text-[9px] font-mono text-[#8B949E] font-bold">INDICATOR ORCHESTRA</span>
                  <IndicatorGrid signal={signal} ind={signal.indicators} />
                </div>

                {/* Methodology Confluence */}
                <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#8B949E] font-bold">METHODOLOGY CONFLUENCE ({signal.confluences.length} SYSTEMS)</span>
                    <span className="text-[9px] font-mono">
                      <span className="text-emerald-400">{signal.confluences.filter(c => c.signal === 'BULLISH').length}↑</span>
                      <span className="text-[#8B949E] mx-1">/</span>
                      <span className="text-rose-400">{signal.confluences.filter(c => c.signal === 'BEARISH').length}↓</span>
                      <span className="text-[#8B949E] mx-1">/</span>
                      <span className="text-[#8B949E]">{signal.confluences.filter(c => c.signal === 'NEUTRAL').length}—</span>
                    </span>
                  </div>
                  <ConfluenceList confluences={signal.confluences} />
                </div>

                {/* Full Reasoning */}
                <div className="bg-[#07090F] border border-[#1E2333] rounded-[3px] p-3 flex flex-col gap-2">
                  <span className="text-[9px] font-mono text-[#8B949E] font-bold">FULL SIGNAL REASONING</span>
                  <p className="text-[10px] text-[#8B949E] leading-relaxed font-mono">{signal.reasoning}</p>
                </div>

                {/* JSON Export */}
                <details className="bg-[#07090F] border border-[#1E2333] rounded-[3px] overflow-hidden">
                  <summary className="px-3 py-2 text-[9px] font-mono text-[#8B949E] font-bold cursor-pointer hover:text-[#E6EDF3] transition select-none">
                    {'{ }'} RAW JSON SIGNAL OUTPUT
                  </summary>
                  <pre className="px-3 pb-3 text-[8px] text-[#58A6FF] font-mono overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
                    {JSON.stringify(signal, null, 2)}
                  </pre>
                </details>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* UNIVERSE SCANNER TAB */}
      {activeSection === 'scanner' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#07090F] border border-[#1E2333] rounded-[3px] p-4">
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF3]">Full Universe Scanner</h3>
              <p className="text-[9px] text-[#8B949E] font-mono mt-0.5">
                Scans top Major + Minor pairs. Returns only setups with ≥80% estimated win probability.
              </p>
            </div>
            <button
              onClick={runScanner}
              disabled={scanLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00E5FF] to-[#58A6FF] text-[#030407] text-[10px] font-bold font-mono uppercase rounded-[3px] hover:opacity-90 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {scanLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {scanLoading ? 'SCANNING...' : 'RUN SCANNER'}
            </button>
          </div>

          {scanLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-10 w-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-[11px] font-mono text-[#8B949E]">Scanning Forex Universe...</p>
                <p className="text-[9px] font-mono text-[#8B949E]/60 mt-1">Running 10 methodology analyzers × 15 pairs</p>
              </div>
            </div>
          )}

          {!scanLoading && scanResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border border-[#1E2333] rounded-[3px] bg-[#07090F]">
              <Shield className="h-10 w-10 text-[#FFD700]" />
              <div className="text-center">
                <p className="text-sm font-bold text-[#FFD700]">NO CLEAR SETUP</p>
                <p className="text-[10px] text-[#8B949E] font-mono mt-1 max-w-xs">
                  No pair in the scanned universe meets the 80%+ win probability threshold. Capital preservation is the priority.
                </p>
              </div>
            </div>
          )}

          {!scanLoading && scanResults.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-[9px] font-mono text-emerald-400 font-bold">
                {scanResults.length} HIGH-PROBABILITY SETUP{scanResults.length !== 1 ? 'S' : ''} IDENTIFIED
              </div>
              {scanResults.map((s, i) => (
                <div
                  key={s.symbol}
                  className={`border rounded-[3px] p-4 flex flex-col gap-3 cursor-pointer hover:border-opacity-80 transition-all ${
                    s.bias === 'bullish' ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-rose-950/10 border-rose-500/30'
                  }`}
                  onClick={() => { setSelectedPair(s.symbol); setActiveSection('signal'); setSignal(s); }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-[#8B949E] font-bold">#{i + 1}</span>
                      <span className="text-base font-bold font-mono text-[#E6EDF3]">{s.symbol}</span>
                      <SignalBadge direction={s.bias === 'bullish' ? 'BUY' : 'SELL'} confidence={s.confidence} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[9px] text-[#8B949E] font-mono">Win Prob</div>
                        <div className="text-sm font-bold font-mono text-[#00E5FF]">{s.estimatedWinProbability}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#8B949E] font-mono">R:R</div>
                        <div className="text-sm font-bold font-mono text-[#E6EDF3]">{s.rrRatio}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#8B949E]" />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-[#8B949E]">Entry: <span className="text-[#E6EDF3]">{formatForexPrice(s.entry.price, s.symbol)}</span></span>
                    <span className="text-[9px] font-mono text-[#8B949E]">SL: <span className="text-rose-400">{formatForexPrice(s.stopLoss, s.symbol)}</span></span>
                    <span className="text-[9px] font-mono text-[#8B949E]">TP1: <span className="text-emerald-400">{s.takeProfits[0] ? formatForexPrice(s.takeProfits[0].level, s.symbol) : '-'}</span></span>
                    <span className="text-[9px] font-mono text-[#8B949E]">Regime: <span className="text-[#00E5FF]">{s.marketRegime}</span></span>
                  </div>
                  <ConfidenceMeter value={s.estimatedWinProbability} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACADEMY TAB */}
      {activeSection === 'academy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACADEMY_CARDS.map(card => (
            <div key={card.id} className="bg-[#07090F] border border-[#1E2333] rounded-[3px] overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-[#0C0E18] transition"
                onClick={() => { setOpenAcademy(openAcademy === card.id ? null : card.id); audio?.playClick(); }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-[3px] bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
                    <card.icon className="h-3.5 w-3.5 text-[#00E5FF]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#E6EDF3]">{card.title}</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-[#8B949E] transition-transform shrink-0 ${openAcademy === card.id ? 'rotate-90' : ''}`} />
              </button>
              {openAcademy === card.id && (
                <div className="px-4 pb-4 border-t border-[#1E2333]">
                  <div className="pt-3 text-[10px] text-[#8B949E] leading-relaxed font-mono whitespace-pre-line">
                    {card.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
