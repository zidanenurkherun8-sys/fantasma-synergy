'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  Play, 
  Pause, 
  ChevronRight, 
  History, 
  ArrowDownRight, 
  ArrowUpRight, 
  XCircle, 
  Cpu, 
  Layers, 
  BadgeAlert,
  Coins,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { Position, ClosedTrade, BotLog } from '@/app/dashboard/page';
import { MarketPair } from '@/components/MarketScanner';

interface PaperTradingConsoleProps {
  cashBalance: number;
  activePositions: Position[];
  closedTrades: ClosedTrade[];
  botLogs: BotLog[];
  autoTrading: boolean;
  currentPrice: number;
  symbol: string;
  pairId: string;
  onToggleAutoTrading: () => void;
  onOpenPosition: (
    type: 'LONG' | 'SHORT',
    leverage: number,
    marginAmount: number,
    entry: number,
    sl?: number,
    tp?: number,
    customPair?: string,
    customSymbol?: string,
    probability?: number
  ) => void;
  onClosePosition: (id: string) => void;
  onCloseAllPositions?: () => void;
  onClearLogs?: () => void;
  activeScanPair: string;
  scannerStatus: string;
  scannedCoinsData: Record<string, {
    price: number;
    change24h: number;
    score: number;
    signal: 'LONG' | 'SHORT' | 'NEUTRAL';
    status: 'SCANNING' | 'SETUP' | 'POSITION';
  }>;
  pairs: MarketPair[];
  botTradeMargin: number;
  onBotTradeMarginChange: (margin: number) => void;
  botMaxPositions: number;
  onBotMaxPositionsChange: (maxPos: number) => void;
  leverageStrategy: 'FIXED' | 'DYNAMIC';
  onLeverageStrategyChange: (strategy: 'FIXED' | 'DYNAMIC') => void;
  maxLeverageCap: number;
  onMaxLeverageCapChange: (cap: number) => void;
  fixedLeverage: number;
  onFixedLeverageChange: (lev: number) => void;
  onSetCashBalance: (balance: number) => void;
  balanceChangePulse?: 'gain' | 'loss' | null;
}

export default function PaperTradingConsole({
  cashBalance,
  activePositions,
  closedTrades,
  botLogs,
  autoTrading,
  currentPrice,
  symbol,
  pairId,
  onToggleAutoTrading,
  onOpenPosition,
  onClosePosition,
  onCloseAllPositions,
  onClearLogs,
  activeScanPair,
  scannerStatus,
  scannedCoinsData,
  pairs,
  botTradeMargin,
  onBotTradeMarginChange,
  botMaxPositions,
  onBotMaxPositionsChange,
  leverageStrategy,
  onLeverageStrategyChange,
  maxLeverageCap,
  onMaxLeverageCapChange,
  fixedLeverage,
  onFixedLeverageChange,
  onSetCashBalance,
  balanceChangePulse
}: PaperTradingConsoleProps) {
  const [activeTab, setActiveTab] = useState<'positions' | 'scanner' | 'order' | 'history' | 'bot'>('positions');
  const [showBotSettings, setShowBotSettings] = useState(false);
  const [showCloseAllModal, setShowCloseAllModal] = useState(false);
  const [orderType, setOrderType] = useState<'LONG' | 'SHORT'>('LONG');
  const [leverage, setLeverage] = useState<number>(10); // Default 10x as per spec
  const [marginInput, setMarginInput] = useState<number>(1000000); // Default 1 Million IDR
  const [useSlTp, setUseSlTp] = useState(false);
  const [slPrice, setSlPrice] = useState<number>(0);
  const [tpPrice, setTpPrice] = useState<number>(0);
  const [validationError, setValidationError] = useState('');

  // Sync SL/TP initial suggestions when currentPrice changes and SL/TP toggle is enabled
  useEffect(() => {
    if (currentPrice > 0 && !useSlTp) {
      if (orderType === 'LONG') {
        setSlPrice(Math.round(currentPrice * 0.95));
        setTpPrice(Math.round(currentPrice * 1.10));
      } else {
        setSlPrice(Math.round(currentPrice * 1.05));
        setTpPrice(Math.round(currentPrice * 0.90));
      }
    }
  }, [currentPrice, orderType, useSlTp]);

  // Handle preset balance allocation
  const handleSetPresetMargin = (percent: number) => {
    const allocated = Math.round(cashBalance * percent);
    setMarginInput(Math.max(50000, allocated)); // Min Rp 50.000
    setValidationError('');
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (marginInput > cashBalance) {
      setValidationError('Saldo kas simulasi tidak mencukupi.');
      return;
    }
    if (marginInput < 50000) {
      setValidationError('Minimal margin simulasi adalah Rp 50.000.');
      return;
    }
    if (useSlTp) {
      if (orderType === 'LONG') {
        if (slPrice >= currentPrice) {
          setValidationError('Stop Loss untuk posisi LONG harus di bawah harga saat ini.');
          return;
        }
        if (tpPrice <= currentPrice) {
          setValidationError('Take Profit untuk posisi LONG harus di atas harga saat ini.');
          return;
        }
      } else {
        if (slPrice <= currentPrice) {
          setValidationError('Stop Loss untuk posisi SHORT harus di atas harga saat ini.');
          return;
        }
        if (tpPrice >= currentPrice) {
          setValidationError('Take Profit untuk posisi SHORT harus di bawah harga saat ini.');
          return;
        }
      }
    }

    onOpenPosition(
      orderType,
      leverage,
      marginInput,
      currentPrice,
      useSlTp ? slPrice : undefined,
      useSlTp ? tpPrice : undefined
    );

    // Reset Form
    setUseSlTp(false);
    setActiveTab('positions');
  };

  // Dynamic AI Leverage Recommendation based on Technical Indicators and Risk (2.5)
  const getAiRecommendedLeverage = () => {
    const scanned = scannedCoinsData[pairId];
    const score = scanned?.score || 72; // default confidence
    const isBtc = pairId.includes('btc');
    
    // Volatility ATR Score
    const volatilityScore = isBtc ? 20 : 65; 
    // Trend Strength Score
    const trendScore = scanned?.signal !== 'NEUTRAL' ? 75 : 25;
    // Liquidity Score
    const liquidityScore = isBtc ? 95 : 45;
    
    const riskScore = Math.round(volatilityScore * 0.4 + trendScore * 0.3 + liquidityScore * 0.2 + 20 * 0.1);
    
    let suggested = 25;
    if (riskScore <= 30) suggested = 500;
    else if (riskScore <= 50) suggested = 100;
    else if (riskScore <= 70) suggested = 25;
    else if (riskScore <= 85) suggested = 10;
    else suggested = 2;

    return { recommended: suggested, confidence: score };
  };

  const aiRecommendation = getAiRecommendedLeverage();

  // Liquidation Price Estimation:
  // Long position: entryPrice * (1 - 1 / leverage)
  // Short position: entryPrice * (1 + 1 / leverage)
  const getEstimatedLiquidationPrice = () => {
    if (currentPrice <= 0 || leverage <= 0) return 0;
    const levVal = Math.max(1, leverage);
    if (orderType === 'LONG') {
      return currentPrice * (1 - 1 / levVal);
    } else {
      return currentPrice * (1 + 1 / levVal);
    }
  };

  const estLiqPrice = getEstimatedLiquidationPrice();

  // Recalculate portfolio metrics
  const totalUnrealizedPnl = activePositions.reduce((acc, pos) => {
    const isLong = pos.type === 'LONG';
    
    // Resolve specific current price for this position to avoid referencing the global active pair price (BTC)
    let specificCurrentPrice = pos.entryPrice;
    if (pos.pair === pairId && currentPrice > 0) {
      specificCurrentPrice = currentPrice;
    } else {
      const matchedPair = pairs?.find(p => p.id === pos.pair);
      if (matchedPair && matchedPair.price > 0) {
        specificCurrentPrice = matchedPair.price;
      } else {
        const scanned = scannedCoinsData[pos.pair];
        if (scanned && scanned.price > 0) {
          specificCurrentPrice = scanned.price;
        }
      }
    }

    const priceDiff = isLong ? (specificCurrentPrice - pos.entryPrice) : (pos.entryPrice - specificCurrentPrice);
    const posPnl = priceDiff * pos.amount;
    return acc + posPnl;
  }, 0);

  const activeMargin = activePositions.reduce((acc, pos) => acc + pos.margin, 0);
  const accountEquity = cashBalance + activeMargin + totalUnrealizedPnl;
  const winRate = closedTrades.length > 0 
    ? (closedTrades.filter(t => t.realizedPnl > 0).length / closedTrades.length) * 100 
    : 0;

  return (
    <div className="quantum-card rounded-xl p-5 border border-slate-800 bg-[#0d1324]/80 backdrop-blur-md relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Glow Effect */}
      <div className="absolute -right-20 -top-20 w-44 h-44 bg-purple-500/10 rounded-full blur-[80px]" />
      <div className="absolute -left-20 -bottom-20 w-44 h-44 bg-blue-500/10 rounded-full blur-[80px]" />

      {/* TOP HEADER: Portfolio Status & Autotrade Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-lg text-purple-400">
            <Wallet className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100 tracking-wide flex items-center gap-2">
              Institutional Paper Trading Arena
            </h2>
            <span className="text-[10px] text-slate-500 font-mono block">Simulation Suite & Automated Quantitative Execution</span>
          </div>
        </div>

        {/* Dynamic Bot Auto-Trading Controls & Close All Positions Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-950/60 border border-[#30363D] px-3 py-2 rounded-xl">
            <div className="flex items-center gap-2">
              <Cpu className={`h-4.5 w-4.5 ${autoTrading ? 'text-[#58A6FF] animate-spin' : 'text-[#8B949E]'}`} style={{ animationDuration: '4s' }} />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#8B949E] leading-none font-sans">Fantasma Synergy AI Bot</span>
                <span className={`text-[10px] font-mono leading-none mt-1 font-bold ${autoTrading ? 'text-[#58A6FF]' : 'text-[#8B949E]'}`}>
                  {autoTrading ? 'AUTO-PILOT ACTIVE' : 'BOT DISCONNECTED'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBotSettings(!showBotSettings)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showBotSettings 
                  ? 'bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF]/30' 
                  : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#E6EDF3]'
              }`}
              title="Pengaturan AI Bot"
            >
              <Sliders className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleAutoTrading}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold font-mono transition uppercase flex items-center gap-1.5 cursor-pointer ${
                autoTrading 
                  ? 'bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/20 hover:bg-[#F85149]/20' 
                  : 'bg-[#58A6FF] text-[#0D1117] hover:bg-[#58A6FF]/90 font-bold'
              }`}
            >
              {autoTrading ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {autoTrading ? 'DISABLE BOT' : 'ACTIVATE BOT'}
            </button>
          </div>

          {activePositions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCloseAllModal(true)}
              className="w-[140px] h-[42px] bg-[#E74C3C]/10 border border-[#E74C3C]/35 hover:bg-[#C0392B] hover:border-transparent text-[#E6EDF3] font-sans text-xs uppercase font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
            >
              <XCircle className="h-4.5 w-4.5" /> CLOSE ALL
            </button>
          )}
        </div>
      </div>

      {/* AI Bot Parameter & Capital Settings Panel */}
      {showBotSettings && (
        <div className="bg-[#070a13]/80 border border-purple-500/30 rounded-xl p-5 mb-5 backdrop-blur-md animate-slideDown shadow-[0_4px_20px_rgba(147,51,234,0.1)]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2 uppercase tracking-wider">
              <Sliders className="h-4.5 w-4.5 text-purple-400" /> AI Bot Parameter & Capital Settings
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Real-time parameters configuration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Simulated Capital Management */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Trading Capital (Wallet Balance)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-sans">Rp</span>
                  <input
                    type="number"
                    value={cashBalance}
                    onChange={(e) => onSetCashBalance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-purple-500 text-xs"
                    placeholder="Total Capital"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSetCashBalance(10000000)}
                  className="flex-1 bg-purple-950/40 hover:bg-purple-900/40 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 rounded-lg py-1.5 text-[10px] font-mono font-bold transition uppercase"
                >
                  Reset Rp 10M
                </button>
                <button
                  type="button"
                  onClick={() => onSetCashBalance(50000000)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 hover:border-slate-700 rounded-lg py-1.5 text-[10px] font-mono font-bold transition uppercase"
                >
                  Rp 50M
                </button>
              </div>
            </div>

            {/* Column 2: Bot Risk & Sizing */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Allocated Margin per Trade</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-sans">Rp</span>
                  <input
                    type="number"
                    value={botTradeMargin}
                    onChange={(e) => onBotTradeMarginChange(Math.max(50000, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Max Concurrent Positions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={botMaxPositions}
                  onChange={(e) => onBotMaxPositionsChange(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
            </div>

            {/* Column 3: Leverage & Strategy Switcher */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Leverage Strategy Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onLeverageStrategyChange('DYNAMIC')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition uppercase font-sans ${
                      leverageStrategy === 'DYNAMIC'
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(147,51,234,0.15)] font-extrabold'
                        : 'bg-slate-900 text-slate-500 border-slate-850 hover:text-slate-400'
                    }`}
                  >
                    DYNAMIC (b)
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeverageStrategyChange('FIXED')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition uppercase font-sans ${
                      leverageStrategy === 'FIXED'
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(147,51,234,0.15)] font-extrabold'
                        : 'bg-slate-900 text-slate-500 border-slate-850 hover:text-slate-400'
                    }`}
                  >
                    FIXED
                  </button>
                </div>
              </div>

              {leverageStrategy === 'DYNAMIC' ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Leverage Cap</label>
                    <span className="text-[10px] font-bold text-purple-400 font-mono">{maxLeverageCap}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={maxLeverageCap}
                    onChange={(e) => onMaxLeverageCapChange(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 bg-slate-800 h-1 rounded-lg cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fixed Leverage</label>
                    <span className="text-[10px] font-bold text-purple-400 font-mono">{fixedLeverage}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={fixedLeverage}
                    onChange={(e) => onFixedLeverageChange(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 bg-slate-800 h-1 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Quantitative Kelly Sizing Math explanation */}
          <div className="mt-5 pt-4 border-t border-slate-800/60 grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0 border border-purple-500/20">
                <Cpu className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wide">Kelly Sizing & Dynamic Leverage Formula</span>
                <span className="text-[9px] text-slate-500 leading-normal block mt-0.5">
                  The AI automatically monitors mathematical confidence b (from 0.0 to 1.0). In DYNAMIC mode, leverage multiplier scales dynamically as: Leverage = max(1, min(Cap, Round(Cap * b))).
                </span>
              </div>
            </div>
            <div className="bg-[#070a13] border border-slate-800/80 rounded-xl p-3 text-right">
              <span className="text-[9px] text-slate-500 font-mono block">Optimal Half-Kelly Sizing Fraction:</span>
              <span className="text-[11px] font-mono font-bold text-slate-300 block mt-1">
                f* = ((b * p) - q) / b * 0.5
              </span>
              <span className="text-[8px] text-slate-600 block mt-0.5">
                *Calculated dynamically with R = 3.0 (b), p = score/100, and q = 1 - p. Capped at 25% portfolio max.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Performance Matrix Grid (1.5 & 3.2) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className={`bg-[#161B22]/60 border border-[#30363D] rounded-xl p-3 flex flex-col justify-center transition-all duration-300 ${
          balanceChangePulse === 'gain' ? 'pulse-gain bg-[#3FB950]/5 border-[#3FB950]/30' :
          balanceChangePulse === 'loss' ? 'pulse-loss bg-[#F85149]/5 border-[#F85149]/30' : ''
        }`}>
          <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-wider block mb-1">Portfolio Equity</span>
          <span className="text-sm font-extrabold text-[#E6EDF3] font-mono">Rp {Math.round(accountEquity).toLocaleString('id-ID')}</span>
        </div>
        <div className={`bg-[#161B22]/60 border border-[#30363D] rounded-xl p-3 flex flex-col justify-center transition-all duration-300 ${
          balanceChangePulse === 'gain' ? 'pulse-gain bg-[#3FB950]/5 border-[#3FB950]/30' :
          balanceChangePulse === 'loss' ? 'pulse-loss bg-[#F85149]/5 border-[#F85149]/30' : ''
        }`}>
          <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-wider block mb-1">Cash Balance</span>
          <span className="text-sm font-extrabold text-[#8B949E] font-mono">Rp {Math.round(cashBalance).toLocaleString('id-ID')}</span>
        </div>
        <div className="bg-[#161B22]/60 border border-[#30363D] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-wider block mb-1">Active Margin</span>
          <span className="text-sm font-extrabold text-[#58A6FF] font-mono">Rp {Math.round(activeMargin).toLocaleString('id-ID')}</span>
        </div>
        <div className="bg-[#161B22]/60 border border-[#30363D] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-wider block mb-1">Unrealized P&L</span>
          <span className={`text-sm font-extrabold font-mono flex items-center gap-1 ${totalUnrealizedPnl >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
            {totalUnrealizedPnl >= 0 ? <ArrowUpRight className="h-4.5 w-4.5 shrink-0" /> : <ArrowDownRight className="h-4.5 w-4.5 shrink-0" />}
            Rp {Math.abs(Math.round(totalUnrealizedPnl)).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="bg-[#161B22]/60 border border-[#30363D] rounded-xl p-3 flex flex-col justify-center col-span-2 md:col-span-1">
          <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-wider block mb-1">Win Rate & Trades</span>
          <span className="text-sm font-extrabold text-[#58A6FF] font-mono flex items-center gap-1.5">
            <History className="h-4 w-4 shrink-0 text-[#58A6FF]" />
            {winRate.toFixed(1)}% <span className="text-[10px] text-[#8B949E] font-normal font-sans">({closedTrades.length} trades)</span>
          </span>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex border-b border-slate-800 mb-5 text-xs font-bold overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('positions')}
          className={`pb-3 px-4 border-b-2 transition uppercase shrink-0 ${
            activeTab === 'positions' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Positions ({activePositions.length})
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 px-4 border-b-2 transition uppercase shrink-0 ${
            activeTab === 'scanner' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Multi-Scanner & Quant Board
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`pb-3 px-4 border-b-2 transition uppercase shrink-0 ${
            activeTab === 'order' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          New Manual Order
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`pb-3 px-4 border-b-2 transition uppercase shrink-0 ${
            activeTab === 'bot' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Bot Execution Logs ({botLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 border-b-2 transition uppercase shrink-0 ${
            activeTab === 'history' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Realized History ({closedTrades.length})
        </button>
      </div>

      {/* TAB CONTENT: ACTIVE POSITIONS */}
      {activeTab === 'positions' && (
        <div className="overflow-x-auto min-h-[180px]">
          {activePositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl my-2">
              <Layers className="h-8 w-8 text-slate-700 mb-2" />
              <h4 className="font-bold text-xs text-slate-400 mb-1">Belum Ada Posisi Aktif</h4>
              <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                Buka posisi baru secara manual di tab "New Manual Order" atau aktifkan AI Bot untuk memicu eksekusi otomatis.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-2">
                  <th className="py-2.5">Pair/Type</th>
                  <th>Leverage & Margin</th>
                  <th>Entry Price</th>
                  <th>Current Price</th>
                  <th>SL / TP Target</th>
                  <th className="text-right">Unrealized P&L</th>
                  <th className="text-right py-2.5 pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {activePositions.map((pos) => {
                  const isLong = pos.type === 'LONG';
                  
                  // Resolve specific current price for this position to avoid referencing the global active pair price (BTC)
                  let specificCurrentPrice = pos.entryPrice;
                  if (pos.pair === pairId && currentPrice > 0) {
                    specificCurrentPrice = currentPrice;
                  } else {
                    const matchedPair = pairs?.find(p => p.id === pos.pair);
                    if (matchedPair && matchedPair.price > 0) {
                      specificCurrentPrice = matchedPair.price;
                    } else {
                      const scanned = scannedCoinsData[pos.pair];
                      if (scanned && scanned.price > 0) {
                        specificCurrentPrice = scanned.price;
                      }
                    }
                  }

                  const priceDiff = isLong ? (specificCurrentPrice - pos.entryPrice) : (pos.entryPrice - specificCurrentPrice);
                  const pnl = priceDiff * pos.amount;
                  const pnlPercent = (pnl / pos.margin) * 100;
                  
                  return (
                    <tr key={pos.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{pos.symbol}/IDR</span>
                          <a 
                            href={`https://indodax.com/market/${pos.symbol}IDR`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-600 hover:text-purple-400 transition-colors"
                            title="Lihat di Indodax"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            isLong ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pos.type}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-600 block mt-0.5">Opened: {new Date(pos.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td>
                        <span className="font-bold text-slate-300 font-mono">
                          {pos.leverage}x{pos.probability !== undefined && <span className="text-[9px] text-slate-500 font-normal"> (b: {pos.probability.toFixed(2)})</span>}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Rp {pos.margin.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="text-slate-300">Rp {Math.round(pos.entryPrice).toLocaleString('id-ID')}</td>
                      <td className="text-slate-300">Rp {Math.round(specificCurrentPrice).toLocaleString('id-ID')}</td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-[10px]">
                          <span className={pos.sl ? 'text-rose-400' : 'text-slate-600 font-sans'}>
                            SL: {pos.sl ? `Rp ${pos.sl.toLocaleString('id-ID')}` : 'None'}
                          </span>
                          <span className={pos.tp ? 'text-emerald-400' : 'text-slate-600 font-sans'}>
                            TP: {pos.tp ? `Rp ${pos.tp.toLocaleString('id-ID')}` : 'None'}
                          </span>
                        </div>
                      </td>
                      <td className={`text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className="block">Rp {pnl >= 0 ? '+' : ''}{Math.round(pnl).toLocaleString('id-ID')}</span>
                        <span className="text-[9px] block mt-0.5">{pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%</span>
                      </td>
                      <td className="text-right py-3 pr-2">
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/20 rounded px-2 py-1 text-[10px] transition shrink-0 active:scale-95 uppercase flex items-center gap-1 ml-auto"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT: AI MULTI-SCANNER */}
      {activeTab === 'scanner' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-purple-400 animate-pulse" /> Live Multi-Asset Quant Signal Board
            </span>
            <span className="text-[9px] font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400 font-bold uppercase animate-pulse">
              {scannerStatus}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-2">
                  <th className="py-2.5 pl-2">Asset Pair</th>
                  <th>Price (IDR)</th>
                  <th>24H Momentum</th>
                  <th className="w-40">Probability (b)</th>
                  <th>Status & Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {(() => {
                  const scannedEntries = Object.entries(scannedCoinsData);
                  const activePairIdsInPositions = new Set(activePositions.map(pos => pos.pair));
                  
                  const curatedEntries = scannedEntries
                    .filter(([pId, coin]) => {
                      const isSelected = pId === pairId;
                      const isActiveScan = pId === activeScanPair;
                      const hasPosition = activePairIdsInPositions.has(pId);
                      const hasSetup = coin.status === 'SETUP';
                      return isSelected || isActiveScan || hasPosition || hasSetup;
                    })
                    .sort((a, b) => {
                      const [pIdA, coinA] = a;
                      const [pIdB, coinB] = b;
                      
                      const getStatusPriority = (c: typeof coinA, pId: string) => {
                        if (activePairIdsInPositions.has(pId)) return 3;
                        if (c.status === 'SETUP') return 2;
                        return 1;
                      };
                      
                      const prioA = getStatusPriority(coinA, pIdA);
                      const prioB = getStatusPriority(coinB, pIdB);
                      
                      if (prioB !== prioA) {
                        return prioB - prioA;
                      }
                      return coinB.score - coinA.score;
                    })
                    .slice(0, 10);

                  return curatedEntries.map(([pId, coin]) => {
                    const symbol = pId.replace('_idr', '').toUpperCase();
                    const isActive = pId === activeScanPair;
                    
                    // Score color
                    const scoreColor = 
                      coin.score >= 70 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                      coin.score >= 50 ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                      'text-slate-400 border-slate-800 bg-slate-900/40';

                    return (
                      <tr 
                        key={pId} 
                        className={`transition-all duration-200 ${
                          isActive 
                            ? 'bg-purple-900/10 border-l-2 border-purple-500 shadow-[inset_4px_0_12px_rgba(147,51,234,0.08)]' 
                            : 'hover:bg-slate-900/20'
                        }`}
                      >
                        <td className="py-3 pl-2 flex items-center gap-2">
                          {isActive ? (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                          )}
                          <span className={`font-bold ${isActive ? 'text-purple-300' : 'text-slate-300'}`}>
                            {symbol}/IDR
                          </span>
                          <a 
                            href={`https://indodax.com/market/${symbol}IDR`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-600 hover:text-purple-400 transition-colors"
                            title="Lihat di Indodax"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {isActive && (
                            <span className="text-[8px] font-sans font-extrabold uppercase bg-purple-500/20 text-purple-400 px-1.5 rounded border border-purple-500/30 animate-pulse">
                              Scanning
                            </span>
                          )}
                        </td>
                        <td className="text-slate-300">
                          Rp {coin.price >= 1000 ? Math.round(coin.price).toLocaleString('id-ID') : coin.price.toFixed(2)}
                        </td>
                        <td className={`font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </td>
                        <td className="py-3">
                          {(() => {
                            const b = coin.score / 100;
                            const R = 3.0;
                            const q = 1 - b;
                            const kelly = ((R * b) - q) / R * 0.5;
                            const kellyPct = Math.max(0, Math.min(25, Math.round(kelly * 100)));

                            return (
                              <div className="flex flex-col gap-1 justify-center">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${scoreColor}`}>
                                    {coin.score}% (b: {b.toFixed(2)})
                                  </span>
                                  <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                                    <div 
                                      className={`h-full rounded-full ${
                                        coin.score >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                                        coin.score >= 50 ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 
                                        'bg-slate-700'
                                      }`}
                                      style={{ width: `${coin.score}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-500 block">
                                  Kelly Size: <span className={kellyPct > 0 ? 'text-purple-400 font-bold' : 'text-slate-600'}>{kellyPct}% Capital</span>
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-sans border ${
                            coin.status === 'POSITION' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.25)]' :
                            coin.status === 'SETUP' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.25)]' :
                            'bg-slate-950/60 text-slate-500 border-slate-800'
                          }`}>
                            {coin.status === 'POSITION' ? 'Position Active' :
                             coin.status === 'SETUP' ? `Setup ${coin.signal}` :
                             'Scanning...'}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NEW MANUAL ORDER */}
      {activeTab === 'order' && (
        <form onSubmit={handleSubmitOrder} className="text-xs space-y-4 max-w-xl">
          {validationError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 flex items-start gap-2 font-mono text-[11px] leading-normal animate-shake">
              <BadgeAlert className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Sizing Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Order Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('LONG')}
                  className={`py-2 rounded-lg font-bold border transition text-center uppercase flex items-center justify-center gap-1.5 ${
                    orderType === 'LONG'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" /> LONG / BUY
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('SHORT')}
                  className={`py-2 rounded-lg font-bold border transition text-center uppercase flex items-center justify-center gap-1.5 ${
                    orderType === 'SHORT'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownRight className="h-4 w-4" /> SHORT / SELL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Position Sizing Margin</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-sans">Rp</span>
                  <input
                    type="number"
                    value={marginInput}
                    onChange={(e) => {
                      setMarginInput(parseInt(e.target.value, 10) || 0);
                      setValidationError('');
                    }}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-purple-500 text-xs"
                    placeholder="Masukkan jumlah margin..."
                  />
                </div>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[0.1, 0.25, 0.5, 1.0].map((pct) => (
                  <button
                    type="button"
                    key={`preset-${pct}`}
                    onClick={() => handleSetPresetMargin(pct)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded py-1 text-[9px] font-mono text-slate-400 font-semibold"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leverage Slider (2.2, 2.3, 2.4) */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-[#E6EDF3] font-bold uppercase tracking-wider flex flex-wrap items-center gap-1.5 font-sans select-none">
                <Layers className="h-3.5 w-3.5 text-[#58A6FF]" /> Leverage
                <span className="bg-gradient-to-r from-[#58A6FF]/20 to-[#9333ea]/20 text-[#58A6FF] border border-[#58A6FF]/20 text-[9px] font-medium font-sans px-2.5 py-0.5 rounded-full">
                  🤖 AI Suggest: {aiRecommendation.recommended}x ({aiRecommendation.confidence}% confidence)
                </span>
              </span>
              <span className="text-xs font-bold font-mono bg-[#58A6FF]/10 border border-[#58A6FF]/20 px-2.5 py-0.5 rounded text-[#58A6FF] select-none">
                {leverage}x
              </span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={leverage}
                onChange={(e) => {
                  setLeverage(parseInt(e.target.value, 10) || 1);
                  setValidationError('');
                }}
                className="w-full bg-gradient-to-r from-[#3498DB] to-[#E74C3C] h-1.5 rounded-lg appearance-none cursor-pointer accent-[#58A6FF]"
              />
            </div>
            
            {/* Quick-Select Leverage Preset Buttons (2.3) */}
            <div className="flex flex-wrap gap-1.5 mt-3 select-none">
              {([1, 5, 10, 25, 50, 100, 500, 1000] as const).map((levPreset) => {
                const isActive = leverage === levPreset;
                let activeBg = 'bg-[#3FB950] text-[#0D1117]'; // Green default for low risk
                if (levPreset >= 500) {
                  activeBg = 'bg-[#C0392B] text-white'; // Deep red/extreme risk
                } else if (levPreset >= 100) {
                  activeBg = 'bg-[#F85149] text-white'; // Red/high risk
                } else if (levPreset >= 25) {
                  activeBg = 'bg-[#D29922] text-[#0D1117]'; // Yellow/moderate risk
                }

                return (
                  <button
                    type="button"
                    key={`lev-preset-${levPreset}`}
                    onClick={() => {
                      setLeverage(levPreset);
                      setValidationError('');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? `${activeBg} border-transparent font-extrabold shadow-sm` 
                        : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-[#E6EDF3]'
                    }`}
                  >
                    {levPreset}x
                  </button>
                );
              })}
            </div>

            {/* Estimated Liquidation & Real-time Warning Tooltip (2.2) */}
            <div className="mt-3.5 bg-[#0D1117]/60 border border-[#30363D] rounded-lg p-3 space-y-1.5 font-sans select-none">
              <div className="flex justify-between text-[10px] text-[#8B949E]">
                <span>Leverage Terpilih:</span>
                <span className="font-mono font-bold text-[#E6EDF3]">{leverage}x</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#8B949E]">
                <span>Estimasi Likuidasi:</span>
                <span className="font-mono font-bold text-[#F85149]">
                  {estLiqPrice > 0 ? `Rp ${Math.round(estLiqPrice).toLocaleString('id-ID')}` : 'Spot (Tanpa Likuidasi)'}
                </span>
              </div>
              {leverage > 100 && (
                <div className="text-[9px] text-[#F85149] font-bold mt-1.5 flex items-center gap-1.5 animate-pulse uppercase tracking-wider">
                  ⚠️ Risiko Sangat Tinggi
                </div>
              )}
            </div>
          </div>

          {/* SL/TP Inputs Toggle */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={useSlTp}
                  onChange={(e) => setUseSlTp(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-600 h-3.5 w-3.5"
                />
                Atur Stop Loss & Take Profit Simulasi
              </label>
              <span className="text-[9px] font-mono text-slate-500">Harga Spot: Rp {Math.round(currentPrice).toLocaleString('id-ID')}</span>
            </div>

            {useSlTp && (
              <div className="grid grid-cols-2 gap-4 animate-slideDown">
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Stop Loss Price (Rp)</label>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-1">Membatasi kerugian maksimal.</span>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Take Profit Price (Rp)</label>
                  <input
                    type="number"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#070a13] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-1">Mengunci profit target secara otomatis.</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-[0_4px_15px_rgba(147,51,234,0.3)] active:scale-[0.98] uppercase flex items-center justify-center gap-1.5"
          >
            Submit Simulated Position Order
          </button>
        </form>
      )}

      {/* TAB CONTENT: AI BOT EXECUTION LOGS */}
      {activeTab === 'bot' && (
        <div className="overflow-hidden flex flex-col h-[200px]">
          <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-purple-400" /> Core AI Bot Signal Auditor Logs
            </span>
            {onClearLogs && botLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-[9px] text-slate-500 hover:text-slate-300 hover:underline uppercase font-bold"
              >
                Clear Logs
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-1 font-mono text-[10px] space-y-1.5 leading-relaxed">
            {botLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Logs kosong. Aktifkan bot dan jalankan Cognitive Run untuk menghasilkan log audit...
              </div>
            ) : (
              botLogs.map((log, index) => {
                const color = 
                  log.type === 'SUCCESS' ? 'text-emerald-400' :
                  log.type === 'WARNING' ? 'text-amber-400' :
                  log.type === 'ERROR' ? 'text-rose-400' :
                  'text-slate-400';
                
                return (
                  <div key={index} className="flex gap-2 items-start py-0.5 border-b border-slate-900/40">
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={color}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLOSED TRADE HISTORY */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto min-h-[180px]">
          {closedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl my-2">
              <History className="h-8 w-8 text-slate-700 mb-2" />
              <h4 className="font-bold text-xs text-slate-400 mb-1">Belum Ada Riwayat Transaksi</h4>
              <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                Detail transaksi penutupan margin posisi, stop-loss, take-profit, atau likuidasi akan tersimpan di sini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-2">
                  <th className="py-2.5">Pair/Type</th>
                  <th>Leverage</th>
                  <th>Entry & Exit Price</th>
                  <th>Closed Trigger</th>
                  <th>Hold Time</th>
                  <th className="text-right py-2.5 pr-2">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {[...closedTrades].reverse().map((trade) => {
                  const durationMs = trade.closeTime - trade.openTime;
                  const durationSec = Math.round(durationMs / 1000);
                  const durationStr = durationSec < 60 ? `${durationSec}s` : `${Math.round(durationSec / 60)}m ${durationSec % 60}s`;
                  
                  return (
                    <tr key={trade.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-300">{trade.symbol}/IDR</span>
                          <a 
                            href={`https://indodax.com/market/${trade.symbol}IDR`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-600 hover:text-purple-400 transition-colors"
                            title="Lihat di Indodax"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            trade.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {trade.type}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-600 block mt-0.5">ID: #{trade.id.substring(0, 8)}</span>
                      </td>
                      <td className="text-slate-400 font-bold font-mono">
                        {trade.leverage}x{trade.probability !== undefined && <span className="text-[9px] text-slate-500 block font-normal">b: {trade.probability.toFixed(2)}</span>}
                      </td>
                      <td>
                        <div className="flex flex-col text-[10px]">
                          <span className="text-slate-400">In: Rp {Math.round(trade.entryPrice).toLocaleString('id-ID')}</span>
                          <span className="text-slate-300">Out: Rp {Math.round(trade.exitPrice).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-sans ${
                          trade.exitReason === 'TAKE_PROFIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          trade.exitReason === 'STOP_LOSS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          trade.exitReason === 'LIQUIDATION' ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold' :
                          'bg-slate-800 text-slate-400 border border-slate-700/80'
                        }`}>
                          {trade.exitReason === 'MANUAL' ? 'MANUAL CLOSE' : trade.exitReason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-slate-400">{durationStr}</td>
                      <td className={`text-right font-bold py-3 pr-2 ${trade.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className="block">{trade.realizedPnl >= 0 ? '+' : ''}{Math.round(trade.realizedPnl).toLocaleString('id-ID')}</span>
                        <span className="text-[9px] block mt-0.5">{trade.realizedPnl >= 0 ? '+' : ''}{trade.realizedPnlPercent.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CLOSE ALL CONFIRMATION MODAL (1.3) */}
      {showCloseAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[8px] transition-all duration-200 p-4">
          <div className="bg-[#1C2333] border border-[#30363D] rounded-xl p-5 max-w-sm w-full shadow-2xl animate-fadeIn select-none">
            <h3 className="font-bold text-sm text-[#E6EDF3] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#30363D] pb-2">
              <BadgeAlert className="h-4.5 w-4.5 text-[#F85149]" /> Konfirmasi Close All Positions
            </h3>
            <p className="text-xs text-[#8B949E] mb-5 leading-relaxed font-sans">
              Anda akan menutup <strong className="text-[#E6EDF3] font-mono">{activePositions.length}</strong> posisi aktif secara serentak di harga pasar saat ini. <br /><br />
              Estimasi Total P/L: <strong className={`font-mono text-xs ${totalUnrealizedPnl >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}Rp {Math.round(totalUnrealizedPnl).toLocaleString('id-ID')}
              </strong>
            </p>
            <div className="flex justify-end gap-3 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={() => setShowCloseAllModal(false)}
                className="px-4 py-2 border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] rounded-lg hover:bg-slate-900 transition uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseAllPositions?.();
                  setShowCloseAllModal(false);
                }}
                className="px-4 py-2 bg-[#F85149] hover:bg-[#C0392B] text-white rounded-lg transition uppercase flex items-center gap-1.5 cursor-pointer"
              >
                Confirm Close All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
