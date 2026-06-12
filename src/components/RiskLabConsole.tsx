import React, { useState, useEffect } from 'react';
import { 
  Clock, Shield, Activity, Cpu, Coins, Search, Sliders, CheckCircle, 
  HelpCircle, Terminal, AlertTriangle, Play, Save, BarChart3, 
  RefreshCw, Calendar, Info, Layers, Zap, TrendingUp, AlertOctagon, TrendingDown 
} from 'lucide-react';
import { CandleData } from '@/lib/indodax';
import { RiskLabEngine, RiskLabSetup, EconomicEvent } from '@/lib/risk-lab-engine';
import TiltCard from './TiltCard';

export interface MarketPair {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  volumeIdr: number;
}

interface RiskLabConsoleProps {
  pairs: MarketPair[];
  selectedPairId: string;
  onSelectPair: (pairId: string) => void;
  candles: CandleData[];
  ticker: any;
  depth: any;
  cashBalance: number;
  activePositions: any[];
  onApplySetup: (setup: {
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    confidence: number;
    leverage: number;
    margin: number;
  }) => void;
  recentSlPairs: Record<string, number>; // Maps pairId to SL timestamp
}

export default function RiskLabConsole({
  pairs,
  selectedPairId,
  onSelectPair,
  candles,
  ticker,
  depth,
  cashBalance,
  activePositions,
  onApplySetup,
  recentSlPairs
}: RiskLabConsoleProps) {
  // Config States
  const [style, setStyle] = useState<'SCALPING' | 'SHORT' | 'MEDIUM' | 'LONG'>('SHORT');
  const [targetTime, setTargetTime] = useState<'BESOK' | 'LUSA' | '3HARI' | 'AKHIR_MINGGU'>('BESOK');
  const [method, setMethod] = useState<'ATR' | 'SR' | 'FIB' | 'STRUCTURE'>('ATR');
  const [rrRatio, setRrRatio] = useState<number>(3.0);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(5.0);

  // Toggle Filters
  const [mtfFilter, setMtfFilter] = useState(true);
  const [newsFilter, setNewsFilter] = useState(true);
  const [trailingStop, setTrailingStop] = useState(true);
  const [forceEntry, setForceEntry] = useState(false);

  // Search & Filter (Left panel)
  const [searchQuery, setSearchQuery] = useState('');
  const [leftFilter, setLeftFilter] = useState<'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_VOL'>('ALL');

  // Simulator ("What-if") States
  const [simEntry, setSimEntry] = useState<string>('');
  const [simTp, setSimTp] = useState<string>('');
  const [simSl, setSimSl] = useState<string>('');
  const [simProbability, setSimProbability] = useState<number | null>(null);

  // System States
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [activePreset, setActivePreset] = useState<string>('Default Dynamic');
  const [savedPresets, setSavedPresets] = useState<string[]>(['Conservative Scalp', 'Daytrade Aggressive', 'Default Dynamic']);
  const [showPresetSaveInput, setShowPresetSaveInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showBacktestModal, setShowBacktestModal] = useState(false);

  // Get active pair metadata
  const activePair = pairs.find(p => p.id === selectedPairId) || {
    id: selectedPairId,
    symbol: selectedPairId.replace('_idr', '').toUpperCase(),
    price: ticker?.last || 1000,
    change24h: ticker?.change24h || 0,
    volumeIdr: ticker?.volumeIdr || 0
  };

  const activeCoinSymbol = activePair.symbol;

  // Run ticking metrics
  useEffect(() => {
    setEconomicEvents(RiskLabEngine.getEconomicEvents(Date.now()));
    setSessions(RiskLabEngine.getActiveSessions(Date.now()));

    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      setSessions(RiskLabEngine.getActiveSessions(now));
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  // Update simulator values if ticker changes
  useEffect(() => {
    if (activePair.price) {
      setSimEntry(Math.round(activePair.price).toString());
      setSimTp(Math.round(activePair.price * 1.06).toString());
      setSimSl(Math.round(activePair.price * 0.97).toString());
      setSimProbability(null);
    }
  }, [selectedPairId, activePair.price]);

  // Determine Signal direction from standard candles list
  const getSignalDirection = (): 'LONG' | 'SHORT' | 'NEUTRAL' => {
    if (candles.length < 22) return 'NEUTRAL';
    const closes = candles.map(c => c.close);
    
    // EMA Cross
    const sum8 = closes.slice(-8).reduce((a, b) => a + b, 0) / 8;
    const sum21 = closes.slice(-21).reduce((a, b) => a + b, 0) / 21;
    const lastPrice = closes[closes.length - 1];

    // Simple RSI
    const lastChanges = closes.slice(-14).map((c, i, arr) => i > 0 ? c - arr[i - 1] : 0);
    const gains = lastChanges.filter(x => x > 0).reduce((a, b) => a + b, 0);
    const losses = lastChanges.filter(x => x < 0).reduce((a, b) => a - b, 0);
    const rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);

    if (sum8 > sum21 && rsi > 48) return 'LONG';
    if (sum8 < sum21 && rsi < 52) return 'SHORT';
    return 'NEUTRAL';
  };

  const activeSignal = getSignalDirection();

  // Generate quantitative setup
  const setup: RiskLabSetup = RiskLabEngine.generateSetup(
    activeCoinSymbol,
    style,
    method,
    activeSignal,
    activePair.price,
    candles,
    rrRatio,
    cashBalance,
    riskPercent
  );

  // Dynamic win rate confidence override
  let finalConfidence = setup.regressionConfidence;
  if (activeSignal === 'NEUTRAL') {
    finalConfidence = 45;
  } else {
    // Add weights for confluence
    const passedMethods = (mtfFilter ? 1 : 0) + (setup.backtestWinRate > 55 ? 1 : 0) + (setup.volatilityRegime !== 'NORMAL' ? 1 : 0);
    finalConfidence = Math.min(98, Math.max(50, setup.regressionConfidence + passedMethods * 4));
  }

  const activeB = setup.riskRewardRatio;

  // Simulated funding rate based on price and 24h change
  const simulatedFundingRateVal = 0.01 + (activePair.change24h > 0 ? 0.05 : -0.02) * (Math.abs(Math.sin(activePair.price)) || 0.5);
  const simulatedFundingRateStr = (simulatedFundingRateVal >= 0 ? '+' : '') + simulatedFundingRateVal.toFixed(3) + '%';

  // Check SL cooldown alert
  const lastSlTime = recentSlPairs[selectedPairId] || 0;
  const cooldownActive = Date.now() - lastSlTime < 60 * 60 * 1000; // 1 hour cooldown
  const cooldownRemainingMin = Math.max(0, Math.round((60 * 60 * 1000 - (Date.now() - lastSlTime)) / 60000));
  const cooldownElapsedMin = Math.max(0, Math.round((Date.now() - lastSlTime) / 60000));

  // Economic event countdown check
  const activeEventNear = economicEvents.some(event => {
    if (event.impact !== 'HIGH' || !newsFilter) return false;
    const diff = Math.abs(currentTime - event.timestamp);
    return diff < 30 * 60 * 1000; // within 30 minutes
  });

  // Multi-Timeframe status confirmation
  const isMtfConfirmed = activeSignal !== 'NEUTRAL' && mtfFilter;

  // Drawdown limit evaluation
  const dailyDrawdownBreached = activePositions.reduce((acc, pos) => {
    const diff = pos.type === 'LONG' ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
    let pnl = diff * pos.amount;
    if (pnl < -pos.margin) pnl = -pos.margin;
    return acc + pnl;
  }, 0) <= -cashBalance * (maxDrawdown / 100);

  // Position lot sizing calculations
  const leverageRec = Math.min(10, Math.max(2, Math.round(10 * (finalConfidence / 100))));

  // Handle Dispatch
  const handleApplyToSystem = () => {
    if (activeSignal === 'NEUTRAL') return;
    if (dailyDrawdownBreached && !forceEntry) return;
    if (cooldownActive && !forceEntry) return;

    onApplySetup({
      entry: setup.entryPrice,
      sl: setup.stopLoss,
      tp1: setup.takeProfit1,
      tp2: setup.takeProfit2,
      tp3: setup.takeProfit3,
      direction: activeSignal,
      confidence: finalConfidence,
      leverage: leverageRec,
      margin: setup.positionMargin
    });
  };

  // Preset management
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    setSavedPresets(prev => [...prev, newPresetName.trim()]);
    setActivePreset(newPresetName.trim());
    setNewPresetName('');
    setShowPresetSaveInput(false);
  };

  // Run What-If simulation
  const handleRunSimulation = () => {
    const entry = parseFloat(simEntry);
    const tp = parseFloat(simTp);
    const sl = parseFloat(simSl);

    if (isNaN(entry) || isNaN(tp) || isNaN(sl) || entry <= 0) return;

    // Simulate probability based on price deviations and lookback range
    const tpDist = Math.abs(tp - entry) / entry;
    const slDist = Math.abs(entry - sl) / entry;
    
    // Higher win probability if target is close and SL is wide
    const ratio = slDist / (tpDist + slDist || 0.1);
    const prob = Math.round(ratio * 90 - (setup.volatilityRegime === 'HIGH' ? 8 : 2));
    setSimProbability(Math.max(20, Math.min(95, prob)));
  };

  // Left panel filtered rows
  const getFilteredPairs = () => {
    return pairs.filter(p => {
      const matchesSearch = p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (leftFilter === 'GAINERS') return p.change24h > 1.5;
      if (leftFilter === 'LOSERS') return p.change24h < -1.5;
      if (leftFilter === 'HIGH_VOL') return p.volumeIdr > 2e9; // > 2 B IDR
      return true;
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:overflow-hidden h-auto lg:h-[calc(100vh-200px)] pb-16 lg:pb-0">
      
      {/* ================= PANEL KIRI: DIKTATOR ASSET ================= */}
      <TiltCard className="w-full lg:w-1/5 flex flex-col h-[350px] lg:h-full shrink-0 bg-[#07090F]">
        <div className="p-3 border-b border-[#1E2333] bg-[#030407]/35">
          <span className="text-xs font-bold text-[#E6EDF3] uppercase tracking-wider block mb-2 font-sans">Asset Directory</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari pair koin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#030407] border border-[#1E2333] rounded-[3px] text-xs text-[#E6EDF3] placeholder-slate-600 focus:outline-none focus:border-[#58A6FF]"
            />
          </div>
        </div>

        {/* Filters tab */}
        <div className="grid grid-cols-4 border-b border-[#1E2333] bg-[#030407]/15 text-[9px] font-bold">
          <button 
            onClick={() => setLeftFilter('ALL')}
            className={`py-2 text-center border-b-2 transition-all ${leftFilter === 'ALL' ? 'border-[#58A6FF] text-[#58A6FF] bg-slate-900/40' : 'border-transparent text-slate-500'}`}
          >
            ALL
          </button>
          <button 
            onClick={() => setLeftFilter('GAINERS')}
            className={`py-2 text-center border-b-2 transition-all ${leftFilter === 'GAINERS' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' : 'border-transparent text-slate-500'}`}
          >
            GAINERS
          </button>
          <button 
            onClick={() => setLeftFilter('LOSERS')}
            className={`py-2 text-center border-b-2 transition-all ${leftFilter === 'LOSERS' ? 'border-rose-500 text-rose-400 bg-rose-950/10' : 'border-transparent text-slate-500'}`}
          >
            LOSERS
          </button>
          <button 
            onClick={() => setLeftFilter('HIGH_VOL')}
            className={`py-2 text-center border-b-2 transition-all ${leftFilter === 'HIGH_VOL' ? 'border-purple-500 text-purple-400 bg-purple-950/10' : 'border-transparent text-slate-500'}`}
          >
            VOL
          </button>
        </div>

        {/* Pair rows list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#30363D]/60 select-none">
          {getFilteredPairs().map(p => {
            const isActive = p.id === selectedPairId;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPair(p.id)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                  isActive ? 'bg-[#58A6FF]/10 text-white font-bold border-l-4 border-[#58A6FF]' : 'hover:bg-[#30363D]/20 text-slate-400'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-[#E6EDF3]">{p.symbol}/IDR</span>
                  <span className="text-[9px] text-slate-500">Vol: Rp {(p.volumeIdr / 1e6).toFixed(0)}M</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Rp {p.price >= 1000 ? Math.round(p.price).toLocaleString('id-ID') : p.price.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-bold ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </TiltCard>

      {/* ================= PANEL TENGAH: CONFIGURATION DECK ================= */}
      <TiltCard className="w-full lg:flex-1 p-4 flex flex-col gap-5 h-auto lg:h-full lg:overflow-y-auto bg-[#07090F]">
        <div className="flex items-center justify-between border-b border-[#1E2333] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-[#58A6FF]" />
            <span className="text-sm font-bold text-[#E6EDF3] uppercase tracking-wide">Risk Lab Config Deck</span>
          </div>
          
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-mono">Preset:</span>
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="bg-[#030407] border border-[#1E2333] px-2 py-1 rounded text-[10px] font-mono text-slate-300 focus:outline-none focus:border-[#58A6FF]"
            >
              {savedPresets.map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowPresetSaveInput(true)}
              className="p-1 bg-[#21262D] border border-[#1E2333] rounded hover:bg-[#30363D] text-slate-400"
              title="Simpan preset"
            >
              <Save className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Preset save popup input */}
        {showPresetSaveInput && (
          <div className="bg-[#030407] border border-[#1E2333] p-3 rounded-[3px] flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-300">Simpan Preset Baru</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Nama preset..."
                className="flex-1 bg-slate-950 border border-[#1E2333] rounded px-2 py-1 text-xs text-slate-200"
              />
              <button onClick={handleSavePreset} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs">Simpan</button>
              <button onClick={() => setShowPresetSaveInput(false)} className="px-3 py-1 bg-[#21262D] text-slate-400 rounded text-xs">Batal</button>
            </div>
          </div>
        )}

        {/* Style selection */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Gaya Trading (Timeframe Target)</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'SCALPING', label: '⚡ SCALPING', desc: '< 15 Menit' },
              { id: 'SHORT', label: '⏱️ INTRADAY', desc: '15m - 4 Jam' },
              { id: 'MEDIUM', label: '📅 SWING', desc: '4 Jam - 1 Hari' },
              { id: 'LONG', label: '🪐 POSITION', desc: '1 Hari - 1 Minggu' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setStyle(item.id as any)}
                className={`py-2 px-1 rounded-[3px] border flex flex-col items-center justify-center transition-all ${
                  style === item.id 
                    ? 'bg-[#58A6FF]/10 border-[#58A6FF] text-[#58A6FF] font-bold shadow-[0_0_8px_rgba(88,166,255,0.15)]' 
                    : 'bg-[#030407] border-[#1E2333] text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] block">{item.label}</span>
                <span className="text-[8px] text-slate-500 block mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Time & Risk/Reward */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Rentang Profit</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'BESOK', label: '🌅 Besok Profit', desc: 'Max 24 Jam' },
                { id: 'LUSA', label: '⛅ Lusa Profit', desc: 'Max 48 Jam' },
                { id: '3HARI', label: '📅 3 Hari', desc: 'Max 72 Jam' },
                { id: 'AKHIR_MINGGU', label: '🪐 Akhir Minggu', desc: '120 Jam+' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTargetTime(item.id as any)}
                  className={`py-1.5 px-2 rounded-[3px] border text-left transition-all ${
                    targetTime === item.id 
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold' 
                      : 'bg-[#030407] border-[#1E2333] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] block">{item.label}</span>
                  <span className="text-[8px] text-slate-500 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Metode Penentuan TP/SL</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ATR', label: '📊 ATR Multiplier', desc: 'Rata-rata True Range' },
                { id: 'SR', label: '📈 Pivot Support/Res', desc: 'Level Pivot Kunci' },
                { id: 'FIB', label: '📐 Fibonacci Level', desc: 'Golden Retracement' },
                { id: 'STRUCTURE', label: '🕯️ Swing High/Low', desc: 'Struktur Market' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setMethod(item.id as any)}
                  className={`py-1.5 px-2 rounded-[3px] border text-left transition-all ${
                    method === item.id 
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold' 
                      : 'bg-[#030407] border-[#1E2333] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] block">{item.label}</span>
                  <span className="text-[8px] text-slate-500 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk/Reward Slider */}
        <div className="bg-[#030407]/35 border border-[#1E2333]/60 rounded-[3px] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Target Risk/Reward Ratio</span>
            <span className="text-xs font-mono font-bold text-[#58A6FF]">1 : {rrRatio.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="5.0"
            step="0.1"
            value={rrRatio}
            onChange={(e) => setRrRatio(parseFloat(e.target.value))}
            className="w-full accent-[#58A6FF] bg-[#030407] h-1.5 rounded-[3px] cursor-pointer"
          />
          <div className="flex gap-2">
            {[2.0, 3.0, 4.0].map(val => (
              <button 
                key={val} 
                onClick={() => setRrRatio(val)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                  rrRatio === val ? 'bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF]/40' : 'bg-slate-900 border-[#1E2333] text-slate-500 hover:text-slate-300'
                }`}
              >
                1:{val.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Risk per Trade & Sizing */}
        <div className="bg-[#030407]/35 border border-[#1E2333]/60 rounded-[3px] p-3 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Position Sizer & Capital Sizing</span>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Risk per Trade:</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold">{riskPercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                className="w-full accent-purple-600 bg-[#030407] h-1 rounded-[3px] cursor-pointer"
              />
            </div>
            <div className="flex flex-col justify-between text-right">
              <span className="text-[9px] text-slate-500 block">Available Capital:</span>
              <span className="text-xs font-mono font-bold text-[#E6EDF3] block">Rp {Math.round(cashBalance).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="border-t border-[#1E2333]/50 pt-2 grid grid-cols-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500">Suggested Capital Margin:</span>
              <span className="font-mono font-bold text-slate-200">Rp {setup.positionMargin.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[9px] text-slate-500">Lot Size:</span>
              <span className="font-mono font-bold text-[#58A6FF]">{setup.lotSize} {activeCoinSymbol}</span>
            </div>
          </div>
        </div>

        {/* Safety toggles & Drawdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Daily Drawdown limit */}
          <div className="bg-[#030407]/15 border border-[#1E2333]/40 rounded-[3px] p-3 flex flex-col gap-1.5 justify-center">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Max Drawdown Limit:</span>
              <span className="font-mono text-rose-400 font-bold">{maxDrawdown}%</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
              className="w-full accent-rose-500 bg-[#030407] h-1 rounded-[3px] cursor-pointer"
            />
            {dailyDrawdownBreached && (
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wide block animate-pulse">
                ⚠️ Batas Drawdown Tercapai! Eksekusi Bot ditahan.
              </span>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex flex-col gap-1.5 justify-center text-[9px] font-bold text-slate-400 select-none">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={mtfFilter} 
                onChange={(e) => setMtfFilter(e.target.checked)}
                className="rounded border-[#1E2333] bg-slate-900 text-[#58A6FF] focus:ring-0 focus:ring-offset-0" 
              />
              <span>Multi-Timeframe Confirmation Filter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={newsFilter} 
                onChange={(e) => setNewsFilter(e.target.checked)}
                className="rounded border-[#1E2333] bg-slate-900 text-purple-500 focus:ring-0 focus:ring-offset-0" 
              />
              <span>Avoid Trading Near High-Impact CPI/FOMC News</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={trailingStop} 
                onChange={(e) => setTrailingStop(e.target.checked)}
                className="rounded border-[#1E2333] bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0" 
              />
              <span>Rekomendasikan Trailing Stop Dinamis</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 text-amber-500">
              <input 
                type="checkbox" 
                checked={forceEntry} 
                onChange={(e) => setForceEntry(e.target.checked)}
                className="rounded border-amber-500 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0" 
              />
              <span>Force Entry Override (Bypass Cooldowns & Drawdown)</span>
            </label>
          </div>
        </div>

      </TiltCard>

      {/* ================= PANEL KANAN: RECOMMENDATIONS & SIMULATORS ================= */}
      <TiltCard className="w-full lg:w-2/5 p-4 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto bg-[#07090F]">
        <div className="flex items-center justify-between border-b border-[#1E2333] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-sm font-bold text-[#E6EDF3] uppercase tracking-wide">Oracle Recommendations</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-sans border ${
            activeSignal === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.25)] animate-pulse' :
            activeSignal === 'SHORT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(248,81,73,0.25)] animate-pulse' :
            'bg-slate-950 text-slate-500 border-slate-800'
          }`}>
            {activeSignal === 'LONG' ? 'Setup LONG Active' : activeSignal === 'SHORT' ? 'Setup SHORT Active' : 'Sinyal Sideways Netral'}
          </span>
        </div>

        {/* Cooldown Alert */}
        {cooldownActive && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-[3px] text-[10px] text-amber-400 flex items-start gap-2 animate-pulse">
            <AlertOctagon className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wide">Peringatan Cooldown Stop Loss</span>
              <span>Anda terkena SL {cooldownElapsedMin} menit lalu. Disarankan cooldown {cooldownRemainingMin} menit lagi sebelum entry baru.</span>
            </div>
          </div>
        )}

        {/* Coordinates Deck */}
        <div className="bg-[#030407] border border-[#1E2333]/80 rounded-[3px] p-3 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <span>R:R 1:{setup.riskRewardRatio}</span>
            <span>|</span>
            <span>Vol Scale: {setup.volatilityScale}x</span>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Execution Coordinates</span>
          
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#07090F] border border-[#1E2333]/40 rounded-[3px] p-2 flex flex-col justify-center">
              <span className="text-[9px] text-slate-500 uppercase font-sans">Rekomendasi Entry:</span>
              <span className="font-bold text-slate-200">Rp {setup.entryPrice.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="bg-[#07090F] border border-rose-950/40 rounded-[3px] p-2 flex flex-col justify-center">
              <span className="text-[9px] text-rose-400 uppercase font-sans">Stop Loss (SL):</span>
              <span className="font-bold text-rose-400">Rp {setup.stopLoss.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-1">
            <div className="bg-[#07090F] border border-[#1E2333]/40 rounded-[3px] p-2 flex flex-col justify-center">
              <span className="text-[8px] text-emerald-500 uppercase font-sans">Take Profit 1 (50%):</span>
              <span className="font-bold text-emerald-400">Rp {setup.takeProfit1.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-[#07090F] border border-[#1E2333]/40 rounded-[3px] p-2 flex flex-col justify-center">
              <span className="text-[8px] text-emerald-500 uppercase font-sans">Take Profit 2 (30%):</span>
              <span className="font-bold text-emerald-400">Rp {setup.takeProfit2.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-[#07090F] border border-[#1E2333]/40 rounded-[3px] p-2 flex flex-col justify-center">
              <span className="text-[8px] text-emerald-500 uppercase font-sans">Take Profit 3 (20%):</span>
              <span className="font-bold text-emerald-400">Rp {setup.takeProfit3.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Partial TP Visualizer (New Feature) */}
          {(() => {
            const entry = setup.entryPrice;
            const tp1Change = entry > 0 ? Math.abs(setup.takeProfit1 - entry) / entry : 0;
            const tp2Change = entry > 0 ? Math.abs(setup.takeProfit2 - entry) / entry : 0;
            const tp3Change = entry > 0 ? Math.abs(setup.takeProfit3 - entry) / entry : 0;
            const slChange = entry > 0 ? Math.abs(entry - setup.stopLoss) / entry : 0;

            const tp1Profit = Math.round(setup.positionMargin * leverageRec * 0.5 * tp1Change);
            const tp2Profit = Math.round(setup.positionMargin * leverageRec * 0.3 * tp2Change);
            const tp3Profit = Math.round(setup.positionMargin * leverageRec * 0.2 * tp3Change);
            const maxLoss = Math.round(setup.positionMargin * leverageRec * slChange);
            
            const tp1Pct = Math.round(leverageRec * tp1Change * 100);
            const tp2Pct = Math.round(leverageRec * tp2Change * 100);
            const tp3Pct = Math.round(leverageRec * tp3Change * 100);
            const slPct = Math.round(leverageRec * slChange * 100);

            const totalEstProfit = tp1Profit + tp2Profit + tp3Profit;

            return (
              <div className="mt-2 border-t border-[#1E2333]/40 pt-2 flex flex-col gap-1.5 text-[9px] font-sans text-slate-400">
                <span className="font-bold text-slate-300 uppercase tracking-wider block">Partial Profit Visualizer:</span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px]">
                  <div className="bg-[#07090F]/60 p-1.5 rounded border border-[#1E2333]/30">
                    <span className="text-slate-500 block text-[8px]">TP1 (50%)</span>
                    <span className="text-emerald-400 font-bold block">+Rp {tp1Profit.toLocaleString('id-ID')}</span>
                    <span className="text-[8px] text-slate-500">+{tp1Pct}% PnL</span>
                  </div>
                  <div className="bg-[#07090F]/60 p-1.5 rounded border border-[#1E2333]/30">
                    <span className="text-slate-500 block text-[8px]">TP2 (30%)</span>
                    <span className="text-emerald-400 font-bold block">+Rp {tp2Profit.toLocaleString('id-ID')}</span>
                    <span className="text-[8px] text-slate-500">+{tp2Pct}% PnL</span>
                  </div>
                  <div className="bg-[#07090F]/60 p-1.5 rounded border border-[#1E2333]/30">
                    <span className="text-slate-500 block text-[8px]">TP3 (20%)</span>
                    <span className="text-emerald-400 font-bold block">+Rp {tp3Profit.toLocaleString('id-ID')}</span>
                    <span className="text-[8px] text-slate-500">+{tp3Pct}% PnL</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px] mt-1 pt-1.5 border-t border-[#1E2333]/20">
                  <span>Target Profit: <strong className="text-emerald-400 font-mono text-[10px]">+Rp {totalEstProfit.toLocaleString('id-ID')}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>Max Loss (SL): <strong className="text-rose-450 font-mono text-rose-400 text-[10px]">-Rp {maxLoss.toLocaleString('id-ID')} (-{slPct}%)</strong></span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Confidence Audit deck */}
        <div className="bg-[#030407]/40 border border-[#1E2333]/50 rounded-[3px] p-3 flex flex-col gap-2 font-sans text-[10px]">
          <div className="flex items-center justify-between border-b border-[#1E2333]/40 pb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle className={`h-4 w-4 ${finalConfidence >= 75 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="font-bold text-slate-300">Confidence Audit: {finalConfidence}% ({finalConfidence >= 80 ? 'HIGH' : finalConfidence >= 65 ? 'MEDIUM' : 'LOW'})</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">b: {activeB.toFixed(2)}</span>
          </div>

          <div className="flex flex-col gap-1.5 text-slate-400">
            {/* dynamic confirmations display */}
            <div className="flex items-start gap-1">
              <span className="text-emerald-400 font-bold mr-0.5">📊</span>
              <div>
                <span className="font-bold text-slate-300">Konfirmasi Level:</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">{setup.confirmations.join(' | ')}</span>
              </div>
            </div>

            <div className="flex items-start gap-1">
              <span className="text-purple-400 font-bold mr-0.5">🎯</span>
              <span>Win Prob ({targetTime}): **{setup.regressionConfidence}%** hit probability based on linear regression.</span>
            </div>

            <div className="flex items-start gap-1">
              <span className="text-indigo-400 font-bold mr-0.5">⏱️</span>
              <span>7D Backtest Win Rate: **{setup.backtestWinRate}%** on {method} mode.</span>
            </div>

            {/* Backtest win rate validator warning */}
            {setup.backtestWarning && (
              <div className="flex items-start gap-1 text-rose-400 animate-pulse font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>{setup.backtestWarning}</span>
              </div>
            )}

            {/* risk warnings / funding check */}
            {ticker?.change24h > 4.5 && (
              <div className="flex items-start gap-1 text-amber-400 font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>⚠️ Risk factor: Koin jenuh beli (+{ticker.change24h.toFixed(1)}%). Bahaya Short Squeeze/Correction.</span>
              </div>
            )}

            {simulatedFundingRateVal > 0.03 && (
              <div className="flex items-start gap-1 text-amber-400 font-bold mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>⚠️ Risk factor: Funding rate tinggi ({simulatedFundingRateStr})</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Trading Sessions */}
        <div className="bg-[#030407]/10 border border-[#1E2333]/40 rounded-[3px] p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5 text-[#58A6FF]" />
            <span>Active Global Sessions</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sessions.map((sess, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded-[3px] border flex flex-col justify-between transition-all ${
                  sess.active ? 'bg-[#58A6FF]/5 border-[#58A6FF]/40 text-slate-200' : 'bg-slate-950/20 border-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${sess.active ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-slate-700'}`} />
                  <span className="text-[9px] font-sans font-bold block">{sess.name}</span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono mt-1 block leading-none">{sess.volatility}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What-If Simulator */}
        <div className="bg-[#030407]/30 border border-[#1E2333]/60 rounded-[3px] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#1E2333]/30 pb-1.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
              <span>What-If Setup Simulator</span>
            </div>
            {simProbability !== null && (
              <span className="text-[10px] font-mono font-bold text-purple-400">Win Prob: {simProbability}%</span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-slate-500 font-mono">Hypothetical Entry:</span>
              <input
                type="number"
                value={simEntry}
                onChange={(e) => setSimEntry(e.target.value)}
                className="w-full bg-[#030407] border border-[#1E2333] px-2 py-1 rounded text-slate-200 font-mono text-[10px]"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-slate-500 font-mono">Take Profit (TP):</span>
              <input
                type="number"
                value={simTp}
                onChange={(e) => setSimTp(e.target.value)}
                className="w-full bg-[#030407] border border-[#1E2333] px-2 py-1 rounded text-slate-200 font-mono text-[10px]"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-slate-500 font-mono">Stop Loss (SL):</span>
              <input
                type="number"
                value={simSl}
                onChange={(e) => setSimSl(e.target.value)}
                className="w-full bg-[#030407] border border-[#1E2333] px-2 py-1 rounded text-slate-200 font-mono text-[10px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={handleRunSimulation}
              className="py-1 px-3 bg-purple-600/20 border border-purple-500/30 rounded-[3px] hover:bg-purple-600/40 text-purple-300 text-[10px] font-bold font-sans flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Simulasikan</span>
            </button>
          </div>
        </div>

        {/* Economic high-impact news */}
        <div className="bg-[#030407]/20 border border-[#1E2333]/50 rounded-[3px] p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-[#1E2333]/30 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-rose-400" />
              <span>Today Economic Calendar</span>
            </div>
            <span className="text-[8px] text-slate-600 font-mono">Daily Scraper Cache</span>
          </div>

          <div className="flex flex-col gap-1 divide-y divide-[#30363D]/30 max-h-[85px] overflow-y-auto pr-1">
            {economicEvents.map((event, idx) => {
              const impactColor = event.impact === 'HIGH' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20';
              return (
                <div key={idx} className="flex justify-between items-center text-[9px] py-1">
                  <div className="flex items-center gap-1.5 max-w-[75%]">
                    <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${impactColor}`}>{event.impact}</span>
                    <span className="text-slate-400 font-bold block truncate">{event.title}</span>
                  </div>
                  <span className="font-mono text-slate-500">{event.timeWib}</span>
                </div>
              );
            })}
          </div>
          
          {activeEventNear && (
            <div className="mt-1 border border-rose-500/30 bg-rose-500/5 p-1 px-2 rounded text-[8px] text-rose-400 font-bold uppercase tracking-wider animate-pulse text-center">
              ⚠️ Warning: CPI/FOMC release is imminent. Expect slippage & spread expansions.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-auto shrink-0 pt-2 border-t border-[#1E2333]/50">
          <button
            onClick={() => setShowBacktestModal(true)}
            className="py-2.5 px-2 bg-slate-900 border border-[#1E2333] hover:bg-[#30363D] rounded-[3px] text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <BarChart3 className="h-4 w-4 text-[#58A6FF]" />
            <span>Lihat Backtest</span>
          </button>
          
          <button
            disabled={activeSignal === 'NEUTRAL' || (dailyDrawdownBreached && !forceEntry) || (cooldownActive && !forceEntry)}
            onClick={handleApplyToSystem}
            className={`col-span-2 py-2.5 px-3 rounded-[3px] font-extrabold text-xs flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
              activeSignal === 'NEUTRAL' || (dailyDrawdownBreached && !forceEntry) || (cooldownActive && !forceEntry)
                ? 'bg-[#30363D]/20 border-[#1E2333]/40 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-purple-500/40 text-white shadow-purple-600/10 hover:shadow-purple-600/20 active:scale-[0.98]'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>TERAPKAN KE SISTEM</span>
          </button>
        </div>

      </TiltCard>

      {/* Backtest Modal Details */}
      {showBacktestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="quantum-card max-w-lg w-full bg-[#07090F] border border-[#1E2333] rounded-[3px] p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[#1E2333] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">Backtest Analytics (7 Days)</span>
              </div>
              <button 
                onClick={() => setShowBacktestModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs text-slate-400">
              <div className="grid grid-cols-2 gap-3 bg-[#030407] p-3 rounded-[3px] border border-[#1E2333]/60 font-mono text-slate-200">
                <div>
                  <span className="text-[9px] text-slate-500 block">Asset / Method:</span>
                  <span>{activeCoinSymbol}/IDR ({method})</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block">Gaya Trading:</span>
                  <span>{style}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Win Rate Kumulatif:</span>
                  <span className="font-mono font-bold text-emerald-400">{setup.backtestWinRate}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${setup.backtestWinRate}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 text-[10px]">
                <div className="bg-[#030407] p-2 rounded-[3px]">
                  <span className="text-slate-500 block">Total Skenario</span>
                  <span className="font-mono font-bold text-slate-200">24 Kali</span>
                </div>
                <div className="bg-[#030407] p-2 rounded-[3px]">
                  <span className="text-slate-500 block">Skenario Profit</span>
                  <span className="font-mono font-bold text-emerald-400">{Math.round(24 * (setup.backtestWinRate/100))}</span>
                </div>
                <div className="bg-[#030407] p-2 rounded-[3px]">
                  <span className="text-slate-500 block">Skenario Loss</span>
                  <span className="font-mono font-bold text-rose-400">{24 - Math.round(24 * (setup.backtestWinRate/100))}</span>
                </div>
              </div>

              <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-[3px] leading-relaxed text-[11px]">
                💡 **Kesimpulan Backtest**: Metode **{method}** pada koin **{activeCoinSymbol}** menghasilkan tingkat stabilitas sebesar **{setup.backtestWinRate}%** di bawah rentang volatilitas sesi aktif. Pastikan filter berita besar diaktifkan untuk menghindari kegagalan eksekusi akibat anomali spread.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowBacktestModal(false)}
                className="py-1.5 px-4 bg-[#21262D] hover:bg-[#30363D] text-slate-300 rounded-[3px] text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
