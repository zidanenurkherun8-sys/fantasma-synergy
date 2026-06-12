'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Shield, Activity, Cpu, Coins, ExternalLink, LayoutDashboard, TrendingUp, Settings, User, Search, BarChart2, Zap, Brain, Sliders, CheckCircle, Database, HelpCircle, Terminal, Globe, Award, Sparkles, Filter, ChevronRight, Lock, Volume2, VolumeX } from 'lucide-react';
import { audio } from '@/lib/audio';
import MarketScanner, { MarketPair } from '@/components/MarketScanner';
import TradingChart from '@/components/TradingChart';
import OrderBookVisualizer from '@/components/OrderBookVisualizer';
import RiskCalculator from '@/components/RiskCalculator';
import FantasmaSynergyReport from '@/components/FantasmaSynergyReport';
import PaperTradingConsole from '@/components/PaperTradingConsole';
import { CandleData, DepthItem, TradeItem } from '@/lib/indodax';
import OracleDashboard from '@/components/OracleDashboard';
import { OracleSignal } from '@/lib/oracle-engine';
import RiskLabConsole from '@/components/RiskLabConsole';
import EliteAuditorsPanel from '@/components/EliteAuditorsPanel';
import IntelligenceConsole from '@/components/IntelligenceConsole';

const getProgressWidthClass = (score: number): string => {
  if (score >= 95) return 'w-full';
  if (score >= 90) return 'w-11/12';
  if (score >= 80) return 'w-10/12';
  if (score >= 75) return 'w-9/12';
  if (score >= 66) return 'w-8/12';
  if (score >= 58) return 'w-7/12';
  if (score >= 50) return 'w-6/12';
  if (score >= 41) return 'w-5/12';
  if (score >= 33) return 'w-4/12';
  if (score >= 25) return 'w-3/12';
  if (score >= 16) return 'w-2/12';
  if (score >= 8) return 'w-1/12';
  return 'w-0';
};


export interface Position {
  id: string;
  symbol: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  amount: number; // coin amount
  margin: number; // IDR margin allocated
  leverage: number;
  sl?: number;
  tp?: number;
  timestamp: number;
  probability?: number; // entry probability b
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  leverage: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  openTime: number;
  closeTime: number;
  exitReason: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION';
  probability?: number; // entry probability b
}

export interface BotLog {
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

const calculateDynamicLeverage = (score: number): number => {
  if (score >= 90) return 10;
  if (score >= 80) return 8;
  if (score >= 70) return 5;
  if (score >= 60) return 3;
  return 2;
};

const HIGH_ACCURACY_SIGNAL_THRESHOLD = 80;
const FAILED_SIGNAL_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const closedPositionsRef = React.useRef<Set<string>>(new Set());

  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [selectedPairId, setSelectedPairId] = useState('btc_idr');
  const [timeframe, setTimeframe] = useState<'1' | '5' | '15' | '30' | '60' | '240' | '720' | '1D' | '1W' | '1M'>('60');

  // Active navigation tab
  const [activeTab, _setActiveTab] = useState<'DASHBOARD' | 'SCANNER' | 'AUDITOR' | 'SETTINGS' | 'RISK_LAB' | 'INTELLIGENCE'>('DASHBOARD');
  const [mutedState, setMutedState] = useState(false);

  useEffect(() => {
    if (audio) {
      setMutedState(audio.isMuted());
    }
  }, []);

  const setActiveTab = (tab: typeof activeTab | ((prev: typeof activeTab) => typeof activeTab)) => {
    audio?.playClick();
    if (typeof tab === 'function') {
      _setActiveTab(tab);
    } else {
      _setActiveTab(tab);
    }
  };

  // Oracle Engine States (3.7)
  const [oracleSignal, setOracleSignal] = useState<OracleSignal | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  
  // Market Scanner filter & sort states
  const [scannerSearch, setScannerSearch] = useState('');
  const [scannerFilter, setScannerFilter] = useState<'ALL' | 'TOP_GAINERS' | 'HIGH_VOLATILITY' | 'AI_SETUPS'>('ALL');
  const [scannerSort, setScannerSort] = useState<'SCORE' | 'CHANGE' | 'VOLUME' | 'SYMBOL'>('SCORE');
  
  // AI Auditor interactive chat console states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'USER' | 'AI'; text: string; timestamp: string }[]>([
    {
      role: 'AI',
      text: 'Salam! Saya adalah Fantasma Synergy AI Auditor Core. Saya membaca data live dari sistem: Market Scanner, Oracle Engine, orderbook, candle, portfolio, cooldown, dan risk engine. Anda bisa bertanya bebas tentang entry, koin terbaik, SL/TP, trend, portfolio, atau validasi sinyal.',
      timestamp: new Date().toLocaleTimeString('id-ID')
    }
  ]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dashboard state
  const [riskPercent, setRiskPercent] = useState(1); // Default 1%
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [balanceChangePulse, setBalanceChangePulse] = useState<'gain' | 'loss' | null>(null);
  const [aiPrediction, setAiPrediction] = useState<any>(null);

  // Paper Trading Account States
  const [cashBalance, setCashBalance] = useState(10000000); // Default Rp 10 Million
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [autoTrading, setAutoTrading] = useState(false);
  const [pendingPairs, setPendingPairs] = useState<Set<string>>(new Set());
  const [failedSignalCooldowns, setFailedSignalCooldowns] = useState<Record<string, number>>({});
  const [recentSlPairs, setRecentSlPairs] = useState<Record<string, number>>({});

  // AI Multi-Scanner Background Bot Configuration States
  const [botTradeMargin, setBotTradeMargin] = useState<number>(1000000); // Default Rp 1.000.000 per trade
  const [botMaxPositions, setBotMaxPositions] = useState<number>(10); // Default max 10 concurrent trades

  // Leverage Strategy States
  const [leverageStrategy, setLeverageStrategy] = useState<'FIXED' | 'DYNAMIC'>('DYNAMIC');
  const [maxLeverageCap, setMaxLeverageCap] = useState<number>(10);
  const [fixedLeverage, setFixedLeverage] = useState<number>(5);

  // Load settings and states from LocalStorage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const savedBalance = localStorage.getItem('ag_cashBalance');
        if (savedBalance) setCashBalance(parseFloat(savedBalance));

        const savedRisk = localStorage.getItem('ag_riskPercent');
        if (savedRisk) setRiskPercent(parseFloat(savedRisk));

        const savedBotMargin = localStorage.getItem('ag_botTradeMargin');
        if (savedBotMargin) setBotTradeMargin(parseFloat(savedBotMargin));

        const savedBotMax = localStorage.getItem('ag_botMaxPositions');
        if (savedBotMax) setBotMaxPositions(parseInt(savedBotMax, 10));

        const savedActive = localStorage.getItem('ag_activePositions');
        if (savedActive) setActivePositions(JSON.parse(savedActive));

        const savedClosed = localStorage.getItem('ag_closedTrades');
        if (savedClosed) setClosedTrades(JSON.parse(savedClosed));

        const savedLogs = localStorage.getItem('ag_botLogs');
        if (savedLogs) setBotLogs(JSON.parse(savedLogs));

        const savedCooldowns = localStorage.getItem('ag_failedSignalCooldowns');
        if (savedCooldowns) setFailedSignalCooldowns(JSON.parse(savedCooldowns));

        const savedRecentSl = localStorage.getItem('ag_recentSlPairs');
        if (savedRecentSl) setRecentSlPairs(JSON.parse(savedRecentSl));

        const savedStrategy = localStorage.getItem('ag_leverageStrategy');
        if (savedStrategy) setLeverageStrategy(savedStrategy as 'FIXED' | 'DYNAMIC');

        const savedCap = localStorage.getItem('ag_maxLeverageCap');
        if (savedCap) setMaxLeverageCap(parseInt(savedCap, 10));

        const savedFixedLev = localStorage.getItem('ag_fixedLeverage');
        if (savedFixedLev) setFixedLeverage(parseInt(savedFixedLev, 10));
      } catch (e) {
        console.error('Error loading state from localStorage:', e);
      }
    }
  }, []);

  // Save states to LocalStorage on changes
  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_cashBalance', cashBalance.toString());
  }, [cashBalance, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_riskPercent', riskPercent.toString());
  }, [riskPercent, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_botTradeMargin', botTradeMargin.toString());
  }, [botTradeMargin, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_botMaxPositions', botMaxPositions.toString());
  }, [botMaxPositions, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_activePositions', JSON.stringify(activePositions));
  }, [activePositions, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_closedTrades', JSON.stringify(closedTrades));
  }, [closedTrades, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_botLogs', JSON.stringify(botLogs));
  }, [botLogs, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_failedSignalCooldowns', JSON.stringify(failedSignalCooldowns));
  }, [failedSignalCooldowns, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_recentSlPairs', JSON.stringify(recentSlPairs));
  }, [recentSlPairs, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_leverageStrategy', leverageStrategy);
  }, [leverageStrategy, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_maxLeverageCap', maxLeverageCap.toString());
  }, [maxLeverageCap, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('ag_fixedLeverage', fixedLeverage.toString());
  }, [fixedLeverage, isMounted]);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatHistory]);

  // Probability-based leverage calculation
  const getLeverageForSetup = (score: number): number => {
    if (leverageStrategy === 'FIXED') {
      return fixedLeverage;
    }
    const b = score / 100; // Success probability b
    const rawLeverage = maxLeverageCap * b;
    return Math.max(1, Math.min(maxLeverageCap, Math.round(rawLeverage)));
  };

  // AI Multi-Scanner Background Bot States
  const [activeScanPair, setActiveScanPair] = useState<string>('btc_idr');
  const [scannerStatus, setScannerStatus] = useState<string>('Initializing Scanner...');
  const [scannedCoinsData, setScannedCoinsData] = useState<Record<string, {
    price: number;
    change24h: number;
    score: number;
    signal: 'LONG' | 'SHORT' | 'NEUTRAL';
    status: 'SCANNING' | 'SETUP' | 'POSITION';
    pattern?: string;
  }>>({});

  // Live pair details
  const [ticker, setTicker] = useState<any>(null);
  const [depth, setDepth] = useState<{ bids: DepthItem[]; asks: DepthItem[] }>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);

  // Targets linked to calculator
  const [entryPrice, setEntryPrice] = useState(0);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);

  // Status flags
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState('');
  const [systemTime, setSystemTime] = useState('');

  // Add a bot audit log helper
  const addBotLog = (message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setBotLogs(prev => [...prev.slice(-99), { timestamp, message, type }]); // Keep last 100 logs
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch summaries once on mount and every 10 seconds for scanning efficiency
  useEffect(() => {
    async function fetchPairs() {
      try {
        const response = await fetch('/api/market/pairs');
        if (response.ok) {
          const data = await response.json();
          setPairs(data.pairs || []);
        }
      } catch (err) {
        console.error('Error fetching pairs summaries:', err);
      }
    }
    fetchPairs();
    const interval = setInterval(fetchPairs, 10000); // Poll summaries every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch details every 1 second for live pricing, depth, trades, and charts (real-time per detiknya)
  useEffect(() => {
    let active = true;
    async function fetchDetails() {
      try {
        const response = await fetch(`/api/market/details?pair=${selectedPairId}&timeframe=${timeframe}`);
        if (response.ok && active) {
          const data = await response.json();
          setTicker({
            ...data.ticker,
            pairId: selectedPairId
          });
          setDepth(data.depth);
          setTrades(data.trades);
          setCandles(data.candles || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching pair details:', err);
      }
    }
    fetchDetails();
    const interval = setInterval(fetchDetails, 1000); // Per-second polling
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedPairId, timeframe]);

  // Position Monitoring: Stops, Profits, Liquidations evaluated globally across ALL active positions on ticker or pairs update
  useEffect(() => {
    if (activePositions.length === 0) return;

    activePositions.forEach((pos) => {
      // Resolve the price for this position's pair
      let currentPrice = 0;
      if (pos.pair === ticker?.pairId && ticker) {
        currentPrice = ticker.last;
      } else {
        const matchedPair = pairs.find(p => p.id === pos.pair);
        if (matchedPair && matchedPair.price > 0) {
          currentPrice = matchedPair.price;
        } else {
          const scanned = scannedCoinsData[pos.pair];
          if (scanned && scanned.price > 0) {
            currentPrice = scanned.price;
          } else {
            currentPrice = pos.entryPrice;
          }
        }
      }

      if (currentPrice <= 0) return;

      const isLong = pos.type === 'LONG';
      const priceDiff = isLong ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
      const unrealizedPnl = priceDiff * pos.amount;

      // 1. Margin Liquidation Trigger
      if (unrealizedPnl <= -pos.margin) {
        handleClosePosition(pos.id, currentPrice, 'LIQUIDATION');
        return;
      }

      // 2. Stop Loss (SL) Trigger
      if (pos.sl) {
        const slBreached = isLong ? (currentPrice <= pos.sl) : (currentPrice >= pos.sl);
        if (slBreached) {
          handleClosePosition(pos.id, pos.sl, 'STOP_LOSS');
          return;
        }
      }

      // 3. Take Profit (TP) Trigger
      if (pos.tp) {
        const tpBreached = isLong ? (currentPrice >= pos.tp) : (currentPrice <= pos.tp);
        if (tpBreached) {
          handleClosePosition(pos.id, pos.tp, 'TAKE_PROFIT');
          return;
        }
      }
    });
  }, [ticker, pairs, activePositions, selectedPairId, scannedCoinsData]);

  // Sync initial calculator values when selected ticker changes
  useEffect(() => {
    if (ticker) {
      setEntryPrice(ticker.last);
      // Set reasonable technical target offsets by default
      setSlPrice(ticker.last * 0.97);
      setTpPrice(ticker.last * 1.06);
    }
  }, [selectedPairId, ticker === null]);

  // Position Open Simulator
  const handleOpenPosition = (
    type: 'LONG' | 'SHORT',
    leverage: number,
    marginAmount: number,
    entry: number,
    sl?: number,
    tp?: number,
    customPair?: string,
    customSymbol?: string,
    probability?: number
  ) => {
    if (marginAmount > cashBalance) {
      audio?.playWarning();
      if (customPair) {
        setPendingPairs(prev => {
          const next = new Set(prev);
          next.delete(customPair);
          return next;
        });
      }
      return;
    }
    
    const id = Math.random().toString(36).substring(2, 15);
    const totalExposure = marginAmount * leverage;
    const amount = totalExposure / entry;

    const targetPair = customPair || selectedPairId;
    const targetSymbol = customSymbol || activePairSymbol;

    const newPosition: Position = {
      id,
      symbol: targetSymbol,
      pair: targetPair,
      type,
      entryPrice: entry,
      currentPrice: entry,
      amount,
      margin: marginAmount,
      leverage,
      sl,
      tp,
      timestamp: Date.now(),
      probability
    };

    audio?.playSuccess();
    setCashBalance(prev => prev - marginAmount);
    setActivePositions(prev => [...prev, newPosition]);
    
    const probText = probability ? ` | Prob: ${(probability * 100).toFixed(0)}%` : '';
    addBotLog(`[Eksekusi] Membuka ${leverage}x ${type} pada ${targetSymbol}/IDR @ Rp ${Math.round(entry).toLocaleString('id-ID')} (Margin: Rp ${marginAmount.toLocaleString('id-ID')}${probText}).`, 'SUCCESS');

    if (customPair) {
      setPendingPairs(prev => {
        const next = new Set(prev);
        next.delete(customPair);
        return next;
      });
    }
  };

  // Trigger Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    // Auto clear toast after 4s
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Position Close Simulator
  const handleClosePosition = (id: string, exitPrice?: number, reason: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' = 'MANUAL') => {
    if (closedPositionsRef.current.has(id)) {
      return; // Already closing or closed
    }
    closedPositionsRef.current.add(id);

    const pos = activePositions.find(p => p.id === id);
    if (!pos) {
      closedPositionsRef.current.delete(id); // Clean up if state mismatch
      return;
    }

    // Resolve the close price for this position's pair
    let price = exitPrice || 0;
    if (price === 0) {
      if (pos.pair === ticker?.pairId && ticker) {
        price = ticker.last;
      } else {
        const matchedPair = pairs.find(p => p.id === pos.pair);
        if (matchedPair && matchedPair.price > 0) {
          price = matchedPair.price;
        } else {
          const scanned = scannedCoinsData[pos.pair];
          if (scanned && scanned.price > 0) {
            price = scanned.price;
          } else {
            price = pos.entryPrice;
          }
        }
      }
    }

    const isLong = pos.type === 'LONG';
    const priceDiff = isLong ? (price - pos.entryPrice) : (pos.entryPrice - price);
    let realizedPnl = priceDiff * pos.amount;
    
    // Capping loss at isolated margin
    if (realizedPnl < -pos.margin) {
      realizedPnl = -pos.margin;
    }
    const realizedPnlPercent = (realizedPnl / pos.margin) * 100;

    const closed: ClosedTrade = {
      id: pos.id,
      symbol: pos.symbol,
      pair: pos.pair,
      type: pos.type,
      entryPrice: pos.entryPrice,
      exitPrice: price,
      amount: pos.amount,
      leverage: pos.leverage,
      realizedPnl,
      realizedPnlPercent,
      openTime: pos.timestamp,
      closeTime: Date.now(),
      exitReason: reason,
      probability: pos.probability
    };

    setCashBalance(c => c + pos.margin + realizedPnl);
    setClosedTrades(c => [...c, closed]);
    setActivePositions(prev => prev.filter(p => p.id !== id));

    if (reason === 'STOP_LOSS' || reason === 'LIQUIDATION') {
      const cooldownUntil = Date.now() + FAILED_SIGNAL_COOLDOWN_MS;
      setFailedSignalCooldowns(prev => ({ ...prev, [pos.pair]: cooldownUntil }));
      if (reason === 'STOP_LOSS') {
        setRecentSlPairs(prev => ({ ...prev, [pos.pair]: Date.now() }));
      }
      addBotLog(`[Accuracy Layer] Cooldown 4 jam aktif untuk ${pos.symbol}/IDR setelah sinyal gagal. Pair ditahan sampai ${new Date(cooldownUntil).toLocaleTimeString('id-ID')}.`, 'WARNING');
    }

    // Trigger visual pulse animation on balance change (1.5)
    setBalanceChangePulse(realizedPnl >= 0 ? 'gain' : 'loss');
    if (realizedPnl >= 0) {
      audio?.playSuccess();
    } else {
      audio?.playWarning();
    }
    setTimeout(() => {
      setBalanceChangePulse(null);
    }, 1000);

    // Trigger toast notification feedback (1.5)
    const pnlSign = realizedPnl >= 0 ? '+' : '';
    showToast(`✅ Posisi ${pos.symbol}/IDR ditutup (${reason === 'MANUAL' ? 'MANUAL' : reason}). P/L: ${pnlSign}Rp ${Math.round(realizedPnl).toLocaleString('id-ID')} (${realizedPnlPercent.toFixed(1)}%)`, realizedPnl >= 0 ? 'success' : 'error');

    let logType: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS';
    if (realizedPnl < 0) logType = 'ERROR';
    if (reason === 'LIQUIDATION') logType = 'ERROR';

    const probText = pos.probability ? ` | Prob: ${(pos.probability * 100).toFixed(0)}%` : '';
    addBotLog(`[Penutupan] Keluar ${pos.leverage}x ${pos.type} di ${pos.symbol} @ Rp ${Math.round(price).toLocaleString('id-ID')} (${reason === 'MANUAL' ? 'MANUAL CLOSE' : reason}). Pnl: Rp ${Math.round(realizedPnl).toLocaleString('id-ID')} (${realizedPnlPercent.toFixed(1)}%)${probText}`, logType);
  };

  // Close All Positions Simulator (1.4 & 1.5)
  const handleCloseAllPositions = () => {
    if (activePositions.length === 0) return;
    
    // De-duplicate locks
    const idsToClose = activePositions.map(p => p.id);
    idsToClose.forEach(id => closedPositionsRef.current.add(id));

    let totalPnl = 0;
    const closedList: ClosedTrade[] = [];
    let marginRefund = 0;

    activePositions.forEach((pos) => {
      // Resolve close price
      let price = 0;
      if (pos.pair === ticker?.pairId && ticker) {
        price = ticker.last;
      } else {
        const matchedPair = pairs.find(p => p.id === pos.pair);
        if (matchedPair && matchedPair.price > 0) {
          price = matchedPair.price;
        } else {
          const scanned = scannedCoinsData[pos.pair];
          if (scanned && scanned.price > 0) {
            price = scanned.price;
          } else {
            price = pos.entryPrice;
          }
        }
      }

      const isLong = pos.type === 'LONG';
      const priceDiff = isLong ? (price - pos.entryPrice) : (pos.entryPrice - price);
      let realizedPnl = priceDiff * pos.amount;
      
      // Cap loss at isolated margin
      if (realizedPnl < -pos.margin) {
        realizedPnl = -pos.margin;
      }

      totalPnl += realizedPnl;
      marginRefund += pos.margin;

      const closed: ClosedTrade = {
        id: pos.id,
        symbol: pos.symbol,
        pair: pos.pair,
        type: pos.type,
        entryPrice: pos.entryPrice,
        exitPrice: price,
        amount: pos.amount,
        leverage: pos.leverage,
        realizedPnl,
        realizedPnlPercent: (realizedPnl / pos.margin) * 100,
        openTime: pos.timestamp,
        closeTime: Date.now(),
        exitReason: 'MANUAL',
        probability: pos.probability
      };

      closedList.push(closed);
      
      const probText = pos.probability ? ` | Prob: ${(pos.probability * 100).toFixed(0)}%` : '';
      addBotLog(`[Penutupan] Keluar ${pos.leverage}x ${pos.type} di ${pos.symbol} @ Rp ${Math.round(price).toLocaleString('id-ID')} (MANUAL CLOSE ALL). Pnl: Rp ${Math.round(realizedPnl).toLocaleString('id-ID')} (${closed.realizedPnlPercent.toFixed(1)}%)${probText}`, realizedPnl >= 0 ? 'SUCCESS' : 'ERROR');
    });

    // Combined sequentially flat state updates
    const balanceDiff = marginRefund + totalPnl;
    setCashBalance(c => c + balanceDiff);
    setClosedTrades(c => [...c, ...closedList]);
    setActivePositions([]);

    // Trigger visual pulse animation on balance change
    setBalanceChangePulse(totalPnl >= 0 ? 'gain' : 'loss');
    if (totalPnl >= 0) {
      audio?.playSuccess();
    } else {
      audio?.playWarning();
    }
    setTimeout(() => {
      setBalanceChangePulse(null);
    }, 1000);

    // Trigger Success Toast
    const pnlSign = totalPnl >= 0 ? '+' : '';
    showToast(`✅ Semua posisi (${idsToClose.length}) berhasil ditutup. Total P/L: ${pnlSign}Rp ${Math.round(totalPnl).toLocaleString('id-ID')}`, 'success');
  };

  // 1. Ticking Dynamic Market-Wide Quant Scanner loop: rotates through all liquid market pairs
  useEffect(() => {
    if (pairs.length === 0) return;
    
    let index = 0;
    const interval = setInterval(() => {
      const allPairs = pairs.map(p => p.id);
      if (allPairs.length === 0) return;
      const nextPair = allPairs[index % allPairs.length];
      setActiveScanPair(nextPair);
      index = (index + 1) % allPairs.length;
    }, 2500); // Pulse rapidly to cover the full market list smoothly
    return () => clearInterval(interval);
  }, [pairs.length]);

  // 2. Multi-Factor Quantitative Technical Scoring (High-Accuracy Engine)
  useEffect(() => {
    if (pairs.length === 0) return;

    const newScannedData: typeof scannedCoinsData = {};
    
    // Scan all pairs dynamically fetched from the market summaries
    pairs.forEach((pairData) => {
      const pId = pairData.id;
      const hasPos = activePositions.some(pos => pos.pair === pId);
      
      // Multi-Factor Quantitative Scoring Logic
      // Factor A: Momentum Acceleration (25% weight) - based on 24h change magnitude
      const change24h = pairData.change24h;
      const absChange = Math.abs(change24h);
      const momScore = Math.min(25, absChange * 7); // Max score for setups with >3.5% movement
      
      // Factor B: Daily Range Position / Mean Reversion (25% weight)
      const dailyHigh = (pairData as any).high || pairData.price * 1.025;
      const dailyLow = (pairData as any).low || pairData.price * 0.975;
      const rangeSpan = dailyHigh - dailyLow;
      const rangePct = rangeSpan > 0 ? (pairData.price - dailyLow) / rangeSpan : 0.5;
      
      let rangeScore = 0;
      let rangeSignal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
      
      if (rangePct < 0.15) {
        // High oversold daily support bounce opportunity (potential LONG)
        rangeScore = 25;
        rangeSignal = 'LONG';
      } else if (rangePct > 0.85) {
        // Strong breakout daily high expansion (potential LONG or SHORT depending on breakout direction)
        rangeScore = 25;
        rangeSignal = 'LONG';
      } else {
        // Mean reversion pricing center
        rangeScore = 15;
      }
      
      // Factor C: Volume Spike & Institutional Interest (25% weight)
      const volumeBillions = pairData.volumeIdr / 1e9;
      // Institutional interest favors solid trading volume (>1 Billion IDR) to prevent wash trading
      const volScore = Math.min(25, volumeBillions * 3.5); 
      
      // Factor D: Volatility Squeeze & Liquidity Friction (25% weight)
      // Tight daily ranges (low volatility) with huge volume represent huge coil setups ready to break out!
      const isSqueezed = rangeSpan / pairData.price < 0.03; // Daily range less than 3% (squeeze)
      const squeezeScore = isSqueezed ? 25 : 15;
      
      // Pattern Classification for High-Accuracy overrides
      let patternName = 'None';
      let scoreBonus = 0;
      let patternSignal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
      
      const isNearLow = rangePct <= 0.15;
      const isNearHigh = rangePct >= 0.85;
      const isHighVolume = volumeBillions > 1.2;

      if (isNearLow && change24h > -1.0 && change24h < 1.0) {
        patternName = 'BULLISH SUPPORT BOUNCE';
        patternSignal = 'LONG';
        scoreBonus = 25;
      } else if (isNearHigh && change24h >= 2.0 && isHighVolume) {
        patternName = 'BULLISH BREAKOUT EXPANSION';
        patternSignal = 'LONG';
        scoreBonus = 25;
      } else if (isNearHigh && change24h <= -1.5) {
        patternName = 'BEARISH RESISTANCE REJECTION';
        patternSignal = 'SHORT';
        scoreBonus = 25;
      } else if (isNearLow && change24h <= -3.0 && isHighVolume) {
        patternName = 'BEARISH BREAKDOWN PANIC';
        patternSignal = 'SHORT';
        scoreBonus = 20;
      } else if (isSqueezed && isHighVolume && change24h > 1.0) {
        patternName = 'COGNITIVE LIQUIDITY SQUEEZE';
        patternSignal = 'LONG';
        scoreBonus = 25;
      }

      // Base score + Multi-factor aggregates
      let score = Math.round(15 + momScore + rangeScore + volScore + squeezeScore + scoreBonus);
      if (score > 100) score = 100;
      const cooldownUntil = failedSignalCooldowns[pId] || 0;
      const isCooldownActive = cooldownUntil > Date.now();

      // Refined High-Accuracy Signal Determination
      let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
      if (score > HIGH_ACCURACY_SIGNAL_THRESHOLD && !isCooldownActive) {
        if (patternSignal !== 'NEUTRAL') {
          signal = patternSignal;
        } else if (change24h > 0.5 && rangeSignal === 'LONG') {
          signal = 'LONG';
        } else if (change24h < -0.5 && rangePct < 0.2) {
          signal = 'LONG'; // Buy oversold high-conviction support bounces
        } else if (change24h < -1.0) {
          signal = 'SHORT'; // Ride strong short breakdown momentum
        } else {
          signal = change24h >= 0 ? 'LONG' : 'SHORT';
        }
      }

      let status: 'SCANNING' | 'SETUP' | 'POSITION' = 'SCANNING';
      if (hasPos) {
        status = 'POSITION';
      } else if (score > HIGH_ACCURACY_SIGNAL_THRESHOLD && signal !== 'NEUTRAL' && !isCooldownActive) {
        status = 'SETUP';
      }

      newScannedData[pId] = {
        price: pairData.price,
        change24h: pairData.change24h,
        score,
        signal,
        status,
        pattern: isCooldownActive ? 'COOLDOWN 4H AFTER FAILED SIGNAL' : patternName !== 'None' ? patternName : undefined
      };
    });

    setScannedCoinsData(newScannedData);

    // Update the live status banner message for the currently active scanned pair
    const activeData = newScannedData[activeScanPair];
    if (activeData) {
      const symbol = activeScanPair.replace('_idr', '').toUpperCase();
      const statusLabel = activeData.status === 'POSITION' 
        ? 'POSISI TERKUNCI' 
        : activeData.status === 'SETUP' 
          ? `SETUP ${activeData.signal} DETECTED: ${activeData.pattern || 'QUANT CORE'} (b: ${(activeData.score / 100).toFixed(2)})`
          : 'MENCARI OPPORTUNITY...';
      setScannerStatus(`Memindai ${symbol}/IDR: Rp ${Math.round(activeData.price).toLocaleString('id-ID')} | ${statusLabel}`);
    }
  }, [pairs, activeScanPair, activePositions, failedSignalCooldowns]);

  // 3. Autonomous Bot Execution Loop with 60-second background AI verify cooldown
  const [lastAiRunTime, setLastAiRunTime] = useState<number>(0);

  useEffect(() => {
    if (!autoTrading || pairs.length === 0) return;

    let tempCashBalance = cashBalance;
    let activePositionsCount = activePositions.length;
    const openedInBatch = new Set<string>();

    Object.entries(scannedCoinsData).forEach(([pairId, coinData]) => {
      if (coinData.status !== 'SETUP' || coinData.signal === 'NEUTRAL') return;
      if (coinData.score <= HIGH_ACCURACY_SIGNAL_THRESHOLD) return;
      if ((failedSignalCooldowns[pairId] || 0) > Date.now()) return;

      // 1. Safety limit: max positions defined by user configuration
      if (activePositionsCount >= botMaxPositions) return;

      // 2. Skip if position already exists, opened in this batch, or pending audit
      const hasPosition = activePositions.some(pos => pos.pair === pairId) || openedInBatch.has(pairId) || pendingPairs.has(pairId);
      if (hasPosition) return;

      // 3. Calculate dynamic Kelly sizing (Rule 4)
      const volatilityFactor = Math.min(0.5, Math.abs(coinData.change24h) / 20);
      const f = (coinData.score / 100) * 0.25 * (1 - volatilityFactor);
      const kellyPercent = Math.max(5, Math.min(25, Math.round(f * 100)));

      // If Kelly says avoid (0% or negative fraction), skip this trade
      if (kellyPercent <= 0) return;

      const portfolioCapital = tempCashBalance + activePositions.reduce((acc, pos) => acc + pos.margin, 0);
      let marginAllocation = Math.round(portfolioCapital * (kellyPercent / 100));

      if (marginAllocation < 50000) {
        marginAllocation = 50000;
      }

      if (marginAllocation > tempCashBalance) {
        if (tempCashBalance >= 50000) {
          marginAllocation = tempCashBalance;
        } else {
          return;
        }
      }

      const symbol = pairId.replace('_idr', '').toUpperCase();
      const now = Date.now();
      const isAiCooldownActive = now - lastAiRunTime < 15000;

      // Deduct from tracked local states
      tempCashBalance -= marginAllocation;
      activePositionsCount += 1;
      openedInBatch.add(pairId);

      // Determine dynamic leverage based on setup confidence/probability score
      const dynamicLev = getLeverageForSetup(coinData.score);
      const b = coinData.score / 100; // Probability (b)
      const kellyText = `, Kelly Size: ${kellyPercent}%`;

      if (isAiCooldownActive) {
        // Execute instantly using Client-Side Quant validation to avoid API limits
        addBotLog(`[AI Quant Engine] Setup ${coinData.signal} (${coinData.pattern || 'QUANT CORE'}) terdeteksi pada ${symbol}/IDR (b: ${b.toFixed(2)}${kellyText}). Mengeksekusi order leverage dinamis ${dynamicLev}x dengan modal Rp ${marginAllocation.toLocaleString('id-ID')}...`, 'INFO');
        
        const entry = coinData.price;
        const levels = buildTradeLevels(entry, coinData.signal as any);
        const sl = levels.sl;
        const tp = levels.tp2;

        setPendingPairs(prev => {
          const next = new Set(prev);
          next.add(pairId);
          return next;
        });

        handleOpenPosition(coinData.signal as 'LONG' | 'SHORT', dynamicLev, marginAllocation, entry, sl, tp, pairId, symbol, b);
      } else {
        // Dispatch background Cognitive AI verification query
        addBotLog(`[AI Bot] Pola ${coinData.pattern || 'QUANT SETUPS'} terdeteksi pada ${symbol}/IDR (b: ${b.toFixed(2)}${kellyText}). Memulai Audit Cognitive AI mendalam...`, 'INFO');
        setLastAiRunTime(now);

        setPendingPairs(prev => {
          const next = new Set(prev);
          next.add(pairId);
          return next;
        });

        const triggerAiAudit = async () => {
          try {
            const response = await fetch('/api/fantasma-synergy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pair: pairId,
                balance: cashBalance,
                riskPercent,
                timeframe: 'Scalping',
              }),
            });

            if (response.ok) {
              addBotLog(`[AI Auditor] Audit Cognitive AI selesai untuk ${symbol}. Sinyal TERVERIFIKASI.`, 'SUCCESS');
              const entry = coinData.price;
              const levels = buildTradeLevels(entry, coinData.signal as any);
              const sl = levels.sl;
              const tp = levels.tp2;
              handleOpenPosition(coinData.signal as 'LONG' | 'SHORT', dynamicLev, marginAllocation, entry, sl, tp, pairId, symbol, b);
            } else {
              addBotLog(`[AI Auditor] Jaringan sibuk. Menggunakan Quant Core Engine untuk eksekusi ${symbol}.`, 'WARNING');
              const entry = coinData.price;
              const levels = buildTradeLevels(entry, coinData.signal as any);
              const sl = levels.sl;
              const tp = levels.tp2;
              handleOpenPosition(coinData.signal as 'LONG' | 'SHORT', dynamicLev, marginAllocation, entry, sl, tp, pairId, symbol, b);
            }
          } catch (err) {
            addBotLog(`[AI Auditor] Jaringan sibuk. Menggunakan Quant Core Engine fallback untuk eksekusi ${symbol}.`, 'WARNING');
            const entry = coinData.price;
            const isLong = coinData.signal === 'LONG';
            const sl = isLong ? entry * 0.97 : entry * 1.03;
            const tp = isLong ? entry * 1.06 : entry * 0.94;
            handleOpenPosition(coinData.signal as 'LONG' | 'SHORT', dynamicLev, marginAllocation, entry, sl, tp, pairId, symbol, b);
          }
        };

        triggerAiAudit();
      }
    });
  }, [autoTrading, pairs, scannedCoinsData, activePositions, cashBalance, riskPercent, lastAiRunTime, pendingPairs, botTradeMargin, botMaxPositions, failedSignalCooldowns]);

  // Handler to import targets from parsed AI report
  const handleImportTargets = (entry: number, sl: number, tp: number) => {
    setEntryPrice(entry);
    setSlPrice(sl);
    setTpPrice(tp);
  };

  const formatIdr = (value: number): string => `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`;

  const calculateAtrFromCandles = (sourceCandles: CandleData[], fallbackPrice: number): number => {
    if (sourceCandles.length < 2) return fallbackPrice * 0.025;
    const recent = sourceCandles.slice(-30);
    const totalTr = recent.slice(1).reduce((acc, candle, index) => {
      const prevClose = recent[index].close;
      const tr = Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - prevClose),
        Math.abs(candle.low - prevClose)
      );
      return acc + tr;
    }, 0);
    return totalTr / Math.max(1, recent.length - 1);
  };

  const getOrderbookBidPct = (): number => {
    const bidValue = depth.bids.reduce((acc, item) => acc + item.amount * item.price, 0);
    const askValue = depth.asks.reduce((acc, item) => acc + item.amount * item.price, 0);
    return Math.round((bidValue / (bidValue + askValue || 1)) * 100);
  };

  const getScannerRows = () => pairs.map(pair => {
    const scan = scannedCoinsData[pair.id] || {
      price: pair.price,
      change24h: pair.change24h,
      score: 50,
      signal: 'NEUTRAL' as const,
      status: 'SCANNING' as const,
      pattern: undefined,
    };
    const cooldownUntil = failedSignalCooldowns[pair.id] || 0;
    return {
      ...pair,
      score: scan.score,
      signal: scan.signal,
      status: scan.status,
      pattern: scan.pattern,
      cooldownActive: cooldownUntil > Date.now(),
      cooldownUntil,
    };
  });

  const buildTradeLevels = (
    price: number,
    signal: 'LONG' | 'SHORT' | 'NEUTRAL',
    sourceCandles: CandleData[] = candles
  ) => {
    // Multiplier default: 1.5 untuk scalping, 2.0 untuk jangka pendek, 2.5 untuk jangka menengah
    let atrMultiplier = 2.0;
    if (timeframe === '1' || timeframe === '5') {
      atrMultiplier = 1.5;
    } else if (timeframe === '15' || timeframe === '30' || timeframe === '60') {
      atrMultiplier = 2.0;
    } else {
      atrMultiplier = 2.5;
    }

    // Safety check: if candles are from another asset (price difference > 30%), fallback to 2% ATR
    let atr = price * 0.02;
    if (sourceCandles && sourceCandles.length > 0) {
      const lastClose = sourceCandles[sourceCandles.length - 1].close;
      const pctDiff = Math.abs(lastClose - price) / (price || 1);
      if (pctDiff < 0.3) {
        atr = calculateAtrFromCandles(sourceCandles, price);
      }
    }

    // Convert SL/TP to percentage of entry price (Rule 1)
    let stopLossPercent = (atr * atrMultiplier) / (price || 1) * 100;
    
    // Ensure stopLossPercent is capped at 50% and has a minimum of 0.5%
    stopLossPercent = Math.max(0.5, Math.min(50, stopLossPercent));

    const isLong = signal === 'LONG' || signal === 'NEUTRAL';
    let sl = 0;
    let tp1 = 0;
    let tp2 = 0;
    let tp3 = 0;

    if (signal === 'SHORT') {
      sl = price * (1 + stopLossPercent / 100);
      const slDist = sl - price;
      tp1 = price - slDist * 1.5;
      tp2 = price - slDist * 3.0;
      tp3 = price - slDist * 4.5;
    } else {
      sl = price * (1 - stopLossPercent / 100);
      const slDist = price - sl;
      tp1 = price + slDist * 1.5;
      tp2 = price + slDist * 3.0;
      tp3 = price + slDist * 4.5;
    }

    return {
      atr,
      sl,
      tp1,
      tp2,
      tp3,
      stopLossPercent,
      tp2Percent: stopLossPercent * 3.0
    };
  };

  const buildAiContextualAnswer = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    // 1. Identify if a specific coin key is mentioned in the query, else fallback to active pair
    let targetPairId = selectedPairId;
    let targetCoinSymbol = activePairSymbol;
    
    const cleanPairs = pairs.map(p => ({
      id: p.id,
      symbol: p.id.replace('_idr', '').toUpperCase(),
      base: p.id.replace('_idr', '').toLowerCase()
    }));

    for (const p of cleanPairs) {
      if (lowerText.includes(p.base) || lowerText.includes(p.symbol.toLowerCase())) {
        targetPairId = p.id;
        targetCoinSymbol = p.symbol;
        break;
      }
    }

    const coinData = scannedCoinsData[targetPairId];
    const activePrice = ticker?.last || coinData?.price || 0;
    const activeScore = coinData?.score || 50;
    const activeSignal = coinData?.signal || 'NEUTRAL';
    const activePattern = coinData?.pattern || 'Belum ada pola mayor tervalidasi';
    const activeB = activeScore / 100;
    const activeQ = 1 - activeB;
    
    // Kelly Size calculation: Kelly = (skor/100) * 0.25 * (1 - volatilityFactor) (Rule 4)
    const activeVolatilityFactor = Math.min(0.5, Math.abs(ticker?.change24h || 0) / 20);
    const activeKellyFraction = activeB * 0.25 * (1 - activeVolatilityFactor);
    const activeKelly = Math.max(5, Math.min(25, Math.round(activeKellyFraction * 100)));
    
    const activeLevels = buildTradeLevels(activePrice, activeSignal);
    const scannerRows = getScannerRows();

    // Ranked setups with strict threshold > 80
    const rankedSetups = scannerRows
      .filter(item => item.score > HIGH_ACCURACY_SIGNAL_THRESHOLD && item.signal !== 'NEUTRAL' && !item.cooldownActive)
      .sort((a, b) => b.score - a.score || b.volumeIdr - a.volumeIdr)
      .slice(0, 5);

    // Alternative setups (score 60-80) if no strict setups exist
    const alternativeSetups = scannerRows
      .filter(item => item.score >= 60 && item.score <= HIGH_ACCURACY_SIGNAL_THRESHOLD && item.signal !== 'NEUTRAL' && !item.cooldownActive)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Fallback top scores if nothing else
    const topScores = scannerRows
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const topLiquid = [...pairs].sort((a, b) => b.volumeIdr - a.volumeIdr).slice(0, 5);
    const openRisk = activePositions.reduce((acc, pos) => acc + pos.margin, 0);
    const portfolioEquity = cashBalance + openRisk;
    const winRate = closedTrades.length > 0
      ? Math.round((closedTrades.filter(trade => trade.realizedPnl > 0).length / closedTrades.length) * 100)
      : 0;

    const marketSummary = topLiquid
      .map(pair => `${pair.symbol}: ${pair.change24h >= 0 ? '+' : ''}${pair.change24h.toFixed(2)}%, Vol ${formatIdr(pair.volumeIdr)}`)
      .join('\n');

    let setupSummary = '';
    if (rankedSetups.length > 0) {
      setupSummary = `**Setup Konfirmasi Tinggi (>80)**:\n` + rankedSetups.map((item, index) => {
        const levels = buildTradeLevels(item.price, item.signal);
        
        // Validation check for SL > 50% (Rule 5)
        if (levels.stopLossPercent > 50.0) {
          return `${index + 1}. **${item.symbol}/IDR** | Sinyal: **${item.signal}** | ⚠️ *Rekomendasi Ditahan: Stop Loss > 50% dari entry*`;
        }

        const isLongTerm = ['720', '1D', '1W', '1M'].includes(timeframe);
        const warningText = (isLongTerm && levels.tp2Percent < 2.0) ? ' ⚠️ *Terlalu kecil, sesuaikan timeframe*' : '';

        const itemVolatilityFactor = Math.min(0.5, Math.abs(item.change24h) / 20);
        const kVal = Math.max(5, Math.min(25, Math.round((item.score / 100) * 0.25 * (1 - itemVolatilityFactor) * 100)));
        const bVal = item.score / 100;

        return `${index + 1}. **${item.symbol}/IDR** | Sinyal: **${item.signal}** | Skor: **${item.score}%** (b: ${bVal.toFixed(2)}) | Kelly Size: **${kVal}%** | Harga: Rp ${Math.round(item.price).toLocaleString('id-ID')} | SL: Rp ${Math.round(levels.sl).toLocaleString('id-ID')} | TP2: Rp ${Math.round(levels.tp2).toLocaleString('id-ID')}${warningText} | Pola: *${item.pattern || 'Quant Core'}*`;
      }).join('\n');
    } else if (alternativeSetups.length > 0) {
      setupSummary = `**Setup Potensial (Skor 60-80 - Agak Berisiko)**:\n` + alternativeSetups.map((item, index) => {
        const levels = buildTradeLevels(item.price, item.signal);
        
        // Validation check for SL > 50% (Rule 5)
        if (levels.stopLossPercent > 50.0) {
          return `${index + 1}. **${item.symbol}/IDR** | Sinyal: **${item.signal}** | ⚠️ *Rekomendasi Ditahan: Stop Loss > 50% dari entry*`;
        }

        const isLongTerm = ['720', '1D', '1W', '1M'].includes(timeframe);
        const warningText = (isLongTerm && levels.tp2Percent < 2.0) ? ' ⚠️ *Terlalu kecil, sesuaikan timeframe*' : '';

        const itemVolatilityFactor = Math.min(0.5, Math.abs(item.change24h) / 20);
        const kVal = Math.max(5, Math.min(25, Math.round((item.score / 100) * 0.25 * (1 - itemVolatilityFactor) * 100)));
        const bVal = item.score / 100;

        return `${index + 1}. **${item.symbol}/IDR** | Sinyal: **${item.signal}** | Skor: **${item.score}%** (b: ${bVal.toFixed(2)}) | Kelly Size: **${kVal}%** | Harga: Rp ${Math.round(item.price).toLocaleString('id-ID')} | SL: Rp ${Math.round(levels.sl).toLocaleString('id-ID')} | TP2: Rp ${Math.round(levels.tp2).toLocaleString('id-ID')}${warningText} | Pola: *${item.pattern || 'Quant Core'}*`;
      }).join('\n') + `\n\n*Catatan*: Tidak ada koin yang melampaui threshold eksekusi ketat (>80) saat ini. Sinyal di atas adalah alternatif momentum jangka pendek.`;
    } else {
      setupSummary = `**Koin dengan Skor Teknis Tertinggi (Sideways)**:\n` + topScores.map((item, index) => {
        const bVal = item.score / 100;
        return `${index + 1}. **${item.symbol}/IDR** | Sinyal: **${item.signal}** | Skor: **${item.score}%** (b: ${bVal.toFixed(2)}) | Harga: Rp ${Math.round(item.price).toLocaleString('id-ID')} | Pola: *${item.pattern || 'Quant Core'}*`;
      }).join('\n') + `\n\n*Rekomendasi*: Kondisi market sangat sideways netral. AI sangat merekomendasikan **wait-and-see** demi melindungi modal Anda.`;
    }

    if (lowerText.includes('halo') || lowerText.includes('hi') || lowerText.includes('helo')) {
      return `Halo! Saya adalah **Fantasma Synergy AI Auditor Core v3.0**. Saya memantau seluruh pergerakan harga Indodax per detiknya secara multi-dimensional.\n\nKonteks Aktif:\n- Koin Terpilih: **${targetCoinSymbol}/IDR** di Rp ${Math.round(activePrice).toLocaleString('id-ID')}\n- Skor AI: **${activeScore}/100** | Sinyal: **${activeSignal}**\n- Pola: *${activePattern}*\n\nAnda bisa menanyakan kepada saya tentang:\n1. Cari koin bagus untuk entry (*"carikan koin entry"*)\n2. Deep audit koin (*"tren btc"* atau *"audit eth"*)\n3. Status modal & portofolio (*"posisi aktif"*)\n4. Manajemen risiko Kelly (*"rumus kelly"*)\n5. Detail sistem (*"cara kerja bot"*)`;
    }

    if (
      lowerText.includes('carikan') ||
      lowerText.includes('rekomendasi') ||
      lowerText.includes('entry') ||
      lowerText.includes('besok') ||
      lowerText.includes('profit') ||
      lowerText.includes('coin') ||
      lowerText.includes('koin') ||
      lowerText.includes('setup terbaik')
    ) {
      return `### 🚀 Hasil Pemindaian Setup Koin & Rekomendasi Entry\n\n` +
        `Berdasarkan data real-time scanner dari **Oracle Investment Engine v3.0**, berikut adalah hasil analisis untuk setup trading:\n\n` +
        `${setupSummary}\n\n` +
        `**Snapshot Koin Teraktif (Likuiditas)**:\n` +
        `${marketSummary}\n\n` +
        `**Panduan Eksekusi Kelly Sizing**:\n` +
        `- Hitung alokasi margin Anda berdasarkan kolom **Kelly Size** (contoh: 15% dari portfolio Anda).\n` +
        `- Wajib pasang Stop Loss di area yang ditentukan untuk mencegah liquidate berantai.\n` +
        `- Jika Anda ingin mengaudit koin tertentu secara mendalam, silakan tanyakan seperti: *"tren ${targetCoinSymbol.toLowerCase()}"* atau *"audit btc"*.`;
    }

    if (
      lowerText.includes('trend') ||
      lowerText.includes('tren') ||
      lowerText.includes('analisa') ||
      lowerText.includes('sinyal') ||
      lowerText.includes('beli') ||
      lowerText.includes('jual') ||
      lowerText.includes('long') ||
      lowerText.includes('short') ||
      lowerText.includes('pola') ||
      lowerText.includes('audit')
    ) {
      const oracleText = oracleSignal && oracleSignal.symbol === targetCoinSymbol
        ? `\n\n**Metrik Oracle Engine v3.0 (7 Timeframes)**:\n` +
          `- Konsensus Arah: **${oracleSignal.direction}** (Confidence: **${oracleSignal.confidence}%**)\n` +
          `- Tingkat Kepercayaan: **${oracleSignal.tierLabel}**\n` +
          `- Akurasi Layer Score: **${oracleSignal.accuracyLayer?.score ?? '-'}/100** (Status: *${oracleSignal.accuracyLayer?.executable ? 'Executable' : 'On Hold'}*)\n` +
          `- Struktur Pasar: *${oracleSignal.accuracyLayer?.marketRegime ?? 'Sideways'}*\n` +
          `- Whale Score / CVD: **${oracleSignal.smartMoney?.whaleScore}/100** / *${oracleSignal.microstructure?.cvdStatus}*`
        : '';

      return `### 🔮 Deep Audit AI Kuantitatif: **${targetCoinSymbol}/IDR**\n\n` +
        `*   **Harga Saat Ini**: Rp ${Math.round(activePrice).toLocaleString('id-ID')} (${ticker?.change24h >= 0 ? '+' : ''}${(ticker?.change24h || 0).toFixed(2)}%)\n` +
        `*   **AI Technical Score**: **${activeScore}/100**\n` +
        `*   **Sinyal & Pola**: **${activeSignal}** (*${activePattern}*)\n` +
        `*   **Success Probability (b)**: **${(activeB * 100).toFixed(0)}%**\n` +
        `*   **Orderbook Imbalance**: Bids volume menyumbang **${getOrderbookBidPct()}%** dari kedalaman visual.${oracleText}\n\n` +
        `**Koordinat Level Kerja**:\n` +
        `*   **Rekomendasi Entry**: Rp ${Math.round(activePrice).toLocaleString('id-ID')}\n` +
        `*   **Stop Loss (SL)**: Rp ${Math.round(activeLevels.sl).toLocaleString('id-ID')} (Toleransi risiko maksimal)\n` +
        `*   **Target Take Profit**:\n` +
        `    - TP1 (RR 1:1.5): Rp ${Math.round(activeLevels.tp1).toLocaleString('id-ID')}\n` +
        `    - TP2 (RR 1:3.0): Rp ${Math.round(activeLevels.tp2).toLocaleString('id-ID')}\n` +
        `    - TP3 (RR 1:4.5): Rp ${Math.round(activeLevels.tp3).toLocaleString('id-ID')}\n\n` +
        `**Kesimpulan AI**: ${activeScore > HIGH_ACCURACY_SIGNAL_THRESHOLD && activeSignal !== 'NEUTRAL' 
          ? `Sinyal ${activeSignal} untuk ${targetCoinSymbol} tervalidasi dengan tingkat keyakinan tinggi. Gunakan leverage **${getLeverageForSetup(activeScore)}x** dan margin Kelly **${activeKelly}%**.` 
          : `Koin ${targetCoinSymbol} saat ini belum memenuhi threshold eksekusi skor >80. Disarankan untuk menunggu konfirmasi breakout yang lebih kuat sebelum mengambil posisi.`}`;
    }

    if (
      lowerText.includes('leverage') || 
      lowerText.includes('risk') || 
      lowerText.includes('kelly') || 
      lowerText.includes('risiko') || 
      lowerText.includes('sl') || 
      lowerText.includes('tp') ||
      lowerText.includes('rumus') ||
      lowerText.includes('matematika')
    ) {
      return `### 📐 Manajemen Risiko & Model Kelly Sizing\n\n` +
        `Sistem simulator ini menerapkan formula matematika **Modified Half-Kelly Criterion** untuk menghitung alokasi margin per trade:\n\n` +
        `$$\\mathbf{f^* = \\frac{b \\cdot p - q}{b} \\cdot 0.5}$$\n\n` +
        `**Keterangan Parameter**:\n` +
        `- $\\mathbf{b}$ = Rasio Risk-to-Reward (standar = **3.0**)\n` +
        `- $\\mathbf{p}$ = Probabilitas kemenangan (Technical Score koin / 100)\n` +
        `- $\\mathbf{q}$ = Probabilitas kekalahan ($1 - p$)\n` +
        `- $\\mathbf{0.5}$ = Pengali Half-Kelly untuk proteksi modal yang lebih aman\n` +
        `- **Batas Alokasi Maksimum**: Maksimal **25%** dari total modal.\n\n` +
        `**Perhitungan untuk ${targetCoinSymbol}/IDR saat ini**:\n` +
        `- Probabilitas keberhasilan ($p$): **${(activeB * 100).toFixed(0)}%**\n` +
        `- Probabilitas kegagalan ($q$): **${(activeQ * 100).toFixed(0)}%**\n` +
        `- Alokasi Margin Kelly: **${activeKelly}%** dari total modal Anda.\n` +
        `- Rekomendasi Leverage: **${getLeverageForSetup(activeScore)}x** (leverage disesuaikan secara dinamis berdasarkan probabilitas $b$)\n\n` +
        `*Aturan Stop Loss (SL)*: Selalu pasang Stop Loss di area ATR Stop Rp ${Math.round(activeLevels.sl).toLocaleString('id-ID')}.`;
    }

    if (
      lowerText.includes('posisi') || 
      lowerText.includes('portofolio') || 
      lowerText.includes('modal') || 
      lowerText.includes('saldo') || 
      lowerText.includes('uang') || 
      lowerText.includes('drawdown')
    ) {
      const totalPnl = activePositions.reduce((acc, pos) => {
        const priceDiff = pos.type === 'LONG' ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
        let pnlVal = priceDiff * pos.amount;
        if (pnlVal < -pos.margin) pnlVal = -pos.margin;
        return acc + pnlVal;
      }, 0);
      const currentEquity = cashBalance + openRisk + totalPnl;

      const positionsList = activePositions.length > 0
        ? activePositions.map((pos, idx) => {
            const priceDiff = pos.type === 'LONG' ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
            let pnlVal = priceDiff * pos.amount;
            if (pnlVal < -pos.margin) pnlVal = -pos.margin;
            const pnlPercentVal = (pnlVal / pos.margin) * 100;
            const pnlColor = pnlVal >= 0 ? '🟢 +' : '🔴 ';
            return `${idx + 1}. **${pos.symbol}/IDR** | Tipe: **${pos.type}** | Margin: Rp ${pos.margin.toLocaleString('id-ID')} | Leverage: **${pos.leverage}x** | Entry: Rp ${Math.round(pos.entryPrice).toLocaleString('id-ID')} | Sekarang: Rp ${Math.round(pos.currentPrice).toLocaleString('id-ID')} | P&L: ${pnlColor}Rp ${Math.round(pnlVal).toLocaleString('id-ID')} (${pnlPercentVal.toFixed(2)}%)`;
          }).join('\n')
        : 'Tidak ada posisi trading yang aktif saat ini.';
      
      return `### 📊 Laporan Audit Portofolio Simulasi\n\n` +
        `*   **Saldo Kas Tersedia**: Rp ${cashBalance.toLocaleString('id-ID')}\n` +
        `*   **Margin Posisi Aktif**: Rp ${openRisk.toLocaleString('id-ID')}\n` +
        `*   **Total Ekuitas Portofolio**: Rp ${Math.round(currentEquity).toLocaleString('id-ID')}\n` +
        `*   **Jumlah Posisi Terbuka**: ${activePositions.length} posisi\n` +
        `*   **Total Riwayat Transaksi**: ${closedTrades.length} selesai${closedTrades.length ? ` (Win Rate: ${winRate}%)` : ''}\n\n` +
        `**Detail Posisi Aktif saat ini**:\n` +
        `${positionsList}\n\n` +
        `**Saran Manajemen Portofolio**: Hindari membuka lebih dari 5 posisi secara bersamaan. Jaga agar margin aktif tidak melebihi 50% dari kas untuk menghindari margin call berantai.`;
    }

    if (
      lowerText.includes('sistem') ||
      lowerText.includes('cara kerja') ||
      lowerText.includes('bot') ||
      lowerText.includes('oracle') ||
      lowerText.includes('fantasma-synergy') ||
      lowerText.includes('fantasma synergy') ||
      lowerText.includes('model') ||
      lowerText.includes('ensemble')
    ) {
      return `### ⚙️ Cara Kerja & Arsitektur Oracle Investment Engine v3.0\n\n` +
        `Sistem ini bekerja dengan menganalisis pasar melalui 6 lapisan kuantitatif:\n\n` +
        `1.  **Multi-Timeframe Confluence (7 Layers)**: Menggabungkan sinyal dari 7 timeframe sekaligus (\`1m\` hingga \`1D\`) secara real-time dengan parallel request.\n` +
        `2.  **Smart Money & Orderbook Depth**: Menghitung ketimpangan volume bids/asks di orderbook secara riil untuk membaca akumulasi/distribusi whale.\n` +
        `3.  **Fundamental On-chain Proxy**: Menyederhanakan data NVT Ratio dan MVRV Z-Score untuk mendeteksi status akumulasi vs market peak.\n` +
        `4.  **Elliott Wave & Fibonacci Auto-Scanner**: Memetakan struktur gelombang koreksi dan target Fibonacci extension secara mekanikal.\n` +
        `5.  **9-Model Ensemble AI Engine**: Menggunakan konsensus dari 9 model pembelajaran mesin (LSTM, XGBoost, Transformer, Random Forest, LightGBM, CatBoost, GRU, CNN, Prophet) untuk menyimpulkan arah utama.\n` +
        `6.  **Accuracy Layer validation**: Memfilter sinyal agar hanya mengeksekusi setup dengan tingkat akurasi internal di atas **80/100** dan minimal 3 layer konfirmasi terpenuhi.\n\n` +
        `*Catatan Kecepatan*: Semua data diambil dari live cache terminal berkecepatan tinggi (15s cooldown) sehingga respons AI sangat cepat dan tidak melanggar rate limit Indodax.`;
    }

    // Default conversational fallback
    return `### 🤖 AI Auditor Core v3.0\n\n` +
      `Saya mendengarkan pesan Anda: "${userText}".\n\n` +
      `Berikut adalah status pasar live untuk **${targetCoinSymbol}/IDR** saat ini:\n` +
      `-   **Harga Saat Ini**: Rp ${Math.round(activePrice).toLocaleString('id-ID')}\n` +
      `-   **Skor Teknis AI**: **${activeScore}/100** (Sinyal: **${activeSignal}**)\n` +
      `-   **Pola Grafik**: *${activePattern}*\n\n` +
      `**Setups Menarik di Pasar saat ini**:\n` +
      `${rankedSetups.length > 0 ? `Terdapat koin dengan setup skor >80: ${rankedSetups.map(c => c.symbol).join(', ')}.` : 'Semua koin terdeteksi sideways netral saat ini.'}\n\n` +
      `Jika Anda butuh bantuan lebih lanjut, ketik *"bantuan"* untuk melihat daftar hal yang bisa Anda tanyakan kepada saya!`;
  };

  // Handler to submit interactive prompt queries to the AI Auditor Core (3.6)
  const handleAiChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt;
    setAiPrompt('');
    setAiChatLoading(true);

    const userMsg = {
      role: 'USER' as const,
      text: userText,
      timestamp: new Date().toLocaleTimeString('id-ID')
    };
    setAiChatHistory(prev => [...prev, userMsg]);

    try {
      const responseText = buildAiContextualAnswer(userText);
      setAiChatHistory(prev => [...prev, {
        role: 'AI',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('id-ID')
      }]);
    } catch (error) {
      setAiChatHistory(prev => [...prev, {
        role: 'AI',
        text: 'AI Auditor gagal membaca konteks live untuk pertanyaan ini. Data market mungkin sedang diperbarui; coba kirim ulang beberapa detik lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID')
      }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  // Auto-Trading Bot Trigger Receiver: Intercepts parsed targets from the AI Analyst
  const handleParsedTargets = (targets: {
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    targetsScore?: number; // fallback field for score
    confidence: number;
  }) => {
    if (!autoTrading) return;

    if (targets.direction === 'NEUTRAL') {
      addBotLog(`[AI Auditor] Sinyal NETRAL terdeteksi untuk ${activePairSymbol}. Order diabaikan.`, 'INFO');
      return;
    }

    // Check if we already have an active position for this pair
    const hasPosition = activePositions.some(p => p.pair === selectedPairId);
    if (hasPosition) {
      addBotLog(`[AI Auditor] Sinyal ${targets.direction} terdeteksi, namun posisi untuk ${activePairSymbol} sudah aktif. Melewati order.`, 'WARNING');
      return;
    }

    if (targets.confidence < 70) {
      addBotLog(`[AI Auditor] Sinyal ${targets.direction} dilewati karena tingkat kepercayaan (${targets.confidence}%) di bawah batas threshold (70%).`, 'WARNING');
      return;
    }

    // Allocate 15% of current cash balance or Rp 1,000,000 as simulated margin
    const marginAllocation = Math.max(1000000, Math.round(cashBalance * 0.15));
    if (marginAllocation > cashBalance) {
      addBotLog(`[AI Auditor] Melewati eksekusi otomatis. Saldo kas simulasi tidak mencukupi.`, 'ERROR');
      return;
    }

    const dynamicLev = getLeverageForSetup(targets.confidence);
    const b = targets.confidence / 100;
    addBotLog(`[AI Bot] Otomatis memicu order ${targets.direction} (Kepercayaan/b: ${b.toFixed(2)}). Menggunakan Leverage: ${dynamicLev}x`, 'INFO');

    // Execute order
    handleOpenPosition(
      targets.direction,
      dynamicLev,
      marginAllocation,
      targets.entry,
      targets.sl,
      targets.tp2,
      undefined,
      undefined,
      b
    );
  };

  // Trigger serverless AI and Oracle analysis posts in parallel (3.8)
  const handleTriggerAnalysis = async () => {
    setReportLoading(true);
    setOracleLoading(true);
    setReport('');
    setAiPrediction(null);
    setOracleSignal(null);
    try {
      const [aiRes, oracleRes] = await Promise.all([
        fetch('/api/fantasma-synergy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pair: selectedPairId,
            balance: cashBalance,
            riskPercent,
            timeframe: ['1', '5', '15', '30'].includes(timeframe) ? 'Scalping' : ['60', '240'].includes(timeframe) ? 'Intraday' : ['720', '1D'].includes(timeframe) ? 'Swing' : 'Position',
          }),
        }),
        fetch('/api/oracle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pair: selectedPairId,
          }),
        })
      ]);

      if (aiRes.ok) {
        const data = await aiRes.json();
        setReport(data.report || '');
        setAiPrediction(data.prediction || null);
      } else {
        setReport('Gagal melakukan analisis AI. Indodax API mungkin mengalami keterlambatan respons.');
      }

      if (oracleRes.ok) {
        const data = await oracleRes.json();
        setOracleSignal(data);
      }
    } catch (err) {
      setReport('Kesalahan jaringan saat memproses analisis.');
    } finally {
      setReportLoading(false);
      setOracleLoading(false);
    }
  };

  // Handler to quickly execute transaction from Oracle Dashboard (3.9)
  const handleQuickOraclePosition = (
    type: 'LONG' | 'SHORT',
    leverage: number,
    marginAmount: number,
    entry: number,
    sl: number,
    tp: number,
    probability: number
  ) => {
    handleOpenPosition(
      type,
      leverage,
      marginAmount,
      entry,
      sl,
      tp,
      selectedPairId,
      activePairSymbol,
      probability
    );
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#030407] text-[#E6EDF3] flex flex-col items-center justify-center text-center select-none font-sans">
        <div className="h-10 w-10 rounded-full border-t-2 border-[#58A6FF] animate-spin mb-4" />
        <span className="text-xs text-[#8B949E] font-mono uppercase tracking-wider">Memuat Sistem Fantasma Synergy...</span>
      </div>
    );
  }

  // Get current active pair name
  const activePairSymbol = selectedPairId.replace('_idr', '').toUpperCase();

  return (
    <div className="min-h-screen bg-[#030407] text-[#E6EDF3] flex font-sans antialiased overflow-hidden select-none relative">
      {/* Left Sidebar Navigation (3.6) */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 z-40 bg-[#07090F] border-r border-[#1E2333] hidden md:flex flex-col justify-between transition-all duration-200 ease-in-out select-none ${
          sidebarExpanded ? 'w-[220px]' : 'w-[60px]'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="flex flex-col gap-6 py-5">
          {/* Logo Brand / Icon */}
          <div className="flex items-center gap-3 px-3.5">
            <div className="h-9 w-9 rounded-[3px] bg-gradient-to-tr from-[#58A6FF] to-indigo-650 flex items-center justify-center font-bold text-[#0D1117] shadow-[0_0_12px_rgba(88,166,255,0.2)] shrink-0">
              Ω
            </div>
            {sidebarExpanded && (
              <span className="font-extrabold text-sm tracking-wide text-[#E6EDF3] uppercase animate-fadeIn font-sans">
                Fantasma Synergy
              </span>
            )}
          </div>

          {/* Navigation Links (3.6) */}
          <nav className="flex flex-col gap-1 px-1.5 select-none">
            <button 
              type="button"
              onClick={() => setActiveTab('DASHBOARD')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'DASHBOARD'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">Dashboard</span>}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('SCANNER')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'SCANNER'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">Market Scanner</span>}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('INTELLIGENCE')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'INTELLIGENCE'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <Globe className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">Live Intel</span>}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('AUDITOR')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'AUDITOR'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <Cpu className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">AI Auditor</span>}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('RISK_LAB')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'RISK_LAB'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <Sliders className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">Risk Lab</span>}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer font-sans w-full text-left border-l-2 ${
                activeTab === 'SETTINGS'
                  ? 'text-[#58A6FF] bg-[#0C0E18] border-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0C0E18]/50 border-transparent'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              {sidebarExpanded && <span className="animate-fadeIn">Settings</span>}
            </button>
          </nav>
        </div>

        {/* User Profile Avatar at bottom (3.6) */}
        <div className="flex items-center gap-3 p-3 border-t border-[#1E2333] bg-[#030407]/30 select-none">
          <div className="h-9 w-9 rounded-full bg-[#0C0E18] border border-[#1E2333] flex items-center justify-center text-[#58A6FF] font-bold text-xs uppercase shrink-0 shadow-sm relative overflow-hidden">
            <User className="h-4.5 w-4.5" />
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col overflow-hidden animate-fadeIn font-sans">
              <span className="text-[11px] font-bold text-[#E6EDF3] leading-none truncate uppercase">Elite User</span>
              <span className="text-[9px] text-[#8B949E] mt-1 font-mono tracking-wider truncate">Pro Account</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Workspace Layout */}
      <div 
        className={`flex-1 flex flex-col min-h-screen overflow-y-auto transition-all duration-200 ease-in-out pb-[60px] md:pb-0 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        {/* 1. Header Terminals */}
        <header className="border-b border-[#1E2333] bg-[#07090F] px-6 py-3.5 flex items-center justify-between sticky top-0 z-35 select-none">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[3px] bg-gradient-to-tr from-[#58A6FF] to-indigo-650 flex items-center justify-center font-bold text-[#0D1117] shadow-[0_0_12px_rgba(88,166,255,0.2)]">
              Ω
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-[#58A6FF] to-indigo-300 bg-clip-text text-transparent uppercase flex items-center gap-1.5 font-sans">
                Fantasma Synergy <span className="text-[10px] text-[#58A6FF] font-mono tracking-widest bg-[#58A6FF]/10 border border-[#58A6FF]/20 px-2 py-0.5 rounded">Core v1.0</span>
              </h1>
              <span className="text-[10px] text-[#8B949E] font-mono block">Sistem Kuantitatif Cryptocurrency - Indodax IDR</span>
            </div>
          </div>

          {/* Global Live Tickers Marquee */}
          <div className="hidden lg:flex flex-1 max-w-[40%] mx-8 overflow-hidden relative h-7 bg-[#030407] rounded-[2px] border border-[#1E2333] items-center ticker-wrap">
            <div className="ticker-content text-[11px] font-mono flex gap-6 text-[#8B949E]">
              {pairs.slice(0, 10).map((pair) => (
                <span key={`ticker-${pair.id}`} className="flex items-center gap-1.5 cursor-pointer hover:text-[#58A6FF] transition-colors">
                  <span className="font-bold text-[#E6EDF3]">{pair.symbol}</span>
                  <span>{pair.price >= 1000 ? Math.round(pair.price).toLocaleString('id-ID') : pair.price.toFixed(2)}</span>
                  <span className={`font-bold text-[10px] ${pair.change24h >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                    {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Diagnostics & Time */}
          <div className="flex items-center gap-4 text-xs font-mono text-[#8B949E]">
            <button
              onClick={() => {
                if (audio) {
                  const isMuted = audio.toggleMute();
                  setMutedState(isMuted);
                  if (!isMuted) {
                    audio.playClick();
                  }
                }
              }}
              className="text-[#8B949E] hover:text-[#58A6FF] transition p-1.5 border border-[#1E2333] bg-[#030407] rounded-[3px] cursor-pointer flex items-center justify-center h-[30px] w-[30px]"
              title={mutedState ? "Unmute Audio" : "Mute Audio"}
            >
              {mutedState ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-[#58A6FF]" />}
            </button>
            <div className="flex items-center gap-1.5 bg-[#030407] border border-[#1E2333] px-3 py-1.5 rounded-[3px]">
              <Clock className="h-3.5 w-3.5 text-[#58A6FF]" />
              <span className="text-[#E6EDF3] text-[11px]">{systemTime || '09:00:00'} WIB</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-[#030407] border border-[#1E2333] px-3 py-1.5 rounded-[3px]">
              <Activity className="h-3.5 w-3.5 text-[#3FB950] pulse-dot" />
              <span className="text-[#3FB950] font-bold text-[10px] uppercase">Online</span>
            </div>
          </div>
        </header>

        {/* 2. Main Dashboard Layout Grid (3.6) */}
        {activeTab === 'DASHBOARD' && (
          <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-y-auto xl:overflow-hidden bg-[#030407]">
            {/* SIDEBAR: Scanner (1 Column) */}
            <div className="xl:col-span-1 h-[500px] xl:h-full flex flex-col">
              <MarketScanner
                pairs={pairs}
                selectedPairId={selectedPairId}
                onSelectPair={(id) => {
                  setSelectedPairId(id);
                  setLoading(true);
                }}
              />
            </div>

            {/* WORKSPACE AREA: Charts, Depth, AI & Calculator (3 Columns) */}
            <div className="xl:col-span-3 flex flex-col gap-6 overflow-y-auto">
              {/* Top Overview Bar */}
              {ticker && (
                <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] flex flex-wrap items-center justify-between gap-4 bg-[#07090F]">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="font-extrabold text-lg text-[#E6EDF3] flex items-center gap-2 font-sans">
                        <Coins className="h-5 w-5 text-yellow-500 animate-[spin_6s_linear_infinite]" /> {ticker.name} <span className="text-xs text-[#8B949E] font-mono">({activePairSymbol}/IDR)</span>
                        <a 
                          href={`https://indodax.com/market/${activePairSymbol}IDR`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#8B949E] hover:text-[#58A6FF] transition-colors flex items-center gap-1 text-[10px] font-mono border border-[#1E2333] bg-[#030407] px-2 py-0.5 rounded ml-2"
                          title="Buka Market Live di Indodax"
                        >
                          Indodax <ExternalLink className="h-3 w-3" />
                        </a>
                        <a 
                          href={`https://www.tradingview.com/chart/?symbol=INDODAX%3A${activePairSymbol}IDR`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#8B949E] hover:text-[#58A6FF] transition-colors flex items-center gap-1 text-[10px] font-mono border border-[#1E2333] bg-[#030407] px-2 py-0.5 rounded"
                          title="Buka Chart di TradingView"
                        >
                          TradingView <ExternalLink className="h-3 w-3" />
                        </a>
                      </h2>
                    </div>
                    <div className="flex flex-col font-mono select-none">
                      <span className="text-[9px] text-[#8B949E] uppercase font-bold font-sans">Harga Terakhir</span>
                      <span className="text-base font-bold text-[#E6EDF3]">
                        Rp {ticker.last >= 1000 ? Math.round(ticker.last).toLocaleString('id-ID') : ticker.last.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col font-mono select-none">
                      <span className="text-[9px] text-[#8B949E] uppercase font-bold font-sans">Perubahan 24J</span>
                      <span className={`text-xs font-bold ${ticker.change24h >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                        {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Resolution Controls - Tabs Style (3.5) */}
                  <div className="flex flex-wrap items-center bg-[#030407] border border-[#1E2333] p-1 rounded-[3px] backdrop-blur-sm max-w-full select-none">
                    <div className="flex items-center border-r border-[#1E2333] mr-2 pr-1 overflow-x-auto">
                      {(
                        [
                          { id: '1', label: '1m' },
                          { id: '5', label: '5m' },
                          { id: '15', label: '15m' },
                          { id: '30', label: '30m' },
                          { id: '60', label: '1H' },
                          { id: '240', label: '4H' },
                          { id: '720', label: '12H' },
                          { id: '1D', label: '1D' },
                          { id: '1W', label: '1W' },
                          { id: '1M', label: '1M' },
                        ] as const
                      ).map((tfObj) => (
                        <button
                          type="button"
                          key={tfObj.id}
                          onClick={() => setTimeframe(tfObj.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase transition duration-150 relative cursor-pointer font-sans ${
                            timeframe === tfObj.id 
                              ? 'text-[#58A6FF] font-extrabold border-b-2 border-[#58A6FF]' 
                              : 'text-[#8B949E] hover:text-[#E6EDF3]'
                          }`}
                        >
                          {tfObj.label}
                        </button>
                      ))}
                    </div>

                    {/* Cognitive run action trigger */}
                    <button
                      type="button"
                      onClick={handleTriggerAnalysis}
                      disabled={reportLoading}
                      className="bg-[#58A6FF] hover:bg-[#58A6FF]/90 text-[#0D1117] font-extrabold text-[11px] px-4 py-1.5 rounded-[3px] flex items-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer font-sans"
                    >
                      <Cpu className="h-4.5 w-4.5 text-[#0D1117]" /> COGNITIVE RUN
                    </button>
                  </div>
                </div>
              )}

              {/* Central Chart & Depth Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {loading ? (
                    <div className="quantum-card rounded-[3px] h-[468px] border border-[#1E2333] flex flex-col items-center justify-center text-center bg-[#0C0E18]">
                      <div className="h-10 w-10 rounded-full border-t-2 border-[#58A6FF] animate-spin mb-4" />
                      <span className="text-xs text-[#8B949E] font-mono uppercase tracking-wider">Mencocokkan lilin historis...</span>
                    </div>
                  ) : (
                    <TradingChart
                      candles={candles}
                      timeframe={timeframe}
                      tickerName={`${activePairSymbol}/IDR`}
                      currentPrice={ticker?.last}
                    />
                  )}
                </div>

                <div className="lg:col-span-1">
                  <OrderBookVisualizer
                    bids={depth.bids}
                    asks={depth.asks}
                    trades={trades}
                    currentPrice={ticker?.last || 0}
                  />
                </div>
              </div>

              {/* Bottom AI Panel & Sizing Calculator */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Cognitive Report Output Display (3/5 width) */}
                <div className="lg:col-span-3">
                  <FantasmaSynergyReport
                    report={report}
                    prediction={aiPrediction}
                    loading={reportLoading}
                    onImportTargets={handleImportTargets}
                    onParsedTargets={handleParsedTargets}
                  />
                </div>

                {/* Interactive Calculator Sizer (2/5 width) */}
                <div className="lg:col-span-2">
                  <RiskCalculator
                    balance={cashBalance}
                    riskPercent={riskPercent}
                    entryPrice={entryPrice}
                    slPrice={slPrice}
                    tpPrice={tpPrice}
                    symbol={activePairSymbol}
                    onBalanceChange={setCashBalance}
                    onRiskChange={setRiskPercent}
                  />
                </div>
              </div>

              {/* Paper Trading Arena (Simulation Console) */}
              <PaperTradingConsole
                cashBalance={cashBalance}
                activePositions={activePositions}
                closedTrades={closedTrades}
                botLogs={botLogs}
                autoTrading={autoTrading}
                currentPrice={ticker?.pairId === selectedPairId ? ticker.last : 0}
                symbol={activePairSymbol}
                pairId={selectedPairId}
                onToggleAutoTrading={() => setAutoTrading(!autoTrading)}
                onOpenPosition={handleOpenPosition}
                onClosePosition={(id) => handleClosePosition(id, undefined, 'MANUAL')}
                onCloseAllPositions={handleCloseAllPositions}
                onClearLogs={() => setBotLogs([])}
                activeScanPair={activeScanPair}
                scannerStatus={scannerStatus}
                scannedCoinsData={scannedCoinsData}
                pairs={pairs}
                botTradeMargin={botTradeMargin}
                onBotTradeMarginChange={setBotTradeMargin}
                botMaxPositions={botMaxPositions}
                onBotMaxPositionsChange={setBotMaxPositions}
                leverageStrategy={leverageStrategy}
                onLeverageStrategyChange={setLeverageStrategy}
                maxLeverageCap={maxLeverageCap}
                onMaxLeverageCapChange={setMaxLeverageCap}
                fixedLeverage={fixedLeverage}
                onFixedLeverageChange={setFixedLeverage}
                onSetCashBalance={setCashBalance}
                balanceChangePulse={balanceChangePulse}
              />
            </div>
          </main>
        )}

        {/* SCANNER VIEW TAB (3.6) */}
        {activeTab === 'SCANNER' && (
          <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[#030407]">
            {/* Header Cards with summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] bg-[#07090F] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8B949E] uppercase font-bold font-sans">Total Aset Dipantau</span>
                  <h3 className="text-xl font-extrabold text-[#E6EDF3] mt-1 font-mono">{pairs.length} Koin</h3>
                </div>
                <Database className="h-8 w-8 text-[#58A6FF] opacity-35" />
              </div>
              <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] bg-[#07090F] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8B949E] uppercase font-bold font-sans">Sinyal Aktif Bot</span>
                  <h3 className="text-xl font-extrabold text-[#3FB950] mt-1 font-mono">
                    {Object.values(scannedCoinsData).filter(c => c.status === 'SETUP').length} Setup
                  </h3>
                </div>
                <Zap className="h-8 w-8 text-[#3FB950] opacity-35" />
              </div>
              <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] bg-[#07090F] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8B949E] uppercase font-bold font-sans">Akurasi AI Backtest</span>
                  <h3 className="text-xl font-extrabold text-[#D29922] mt-1 font-mono">78.4% Win Rate</h3>
                </div>
                <Award className="h-8 w-8 text-[#D29922] opacity-35" />
              </div>
              <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] bg-[#07090F] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8B949E] uppercase font-bold font-sans">Volume 24J Terbesar</span>
                  <h3 className="text-xl font-extrabold text-[#58A6FF] mt-1 font-mono">
                    {pairs.length > 0 ? [...pairs].sort((a,b) => b.volumeIdr - a.volumeIdr)[0]?.symbol : 'BTC'}
                  </h3>
                </div>
                <Globe className="h-8 w-8 text-[#58A6FF] opacity-35" />
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="quantum-card rounded-[3px] p-4 border border-[#1E2333] bg-[#07090F] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-[#030407] border border-[#1E2333] px-3 py-1.5 rounded-[3px] w-full max-w-sm">
                <Search className="h-4 w-4 text-[#8B949E]" />
                <input
                  id="scanner-search-input"
                  type="text"
                  placeholder="Cari simbol koin... (misal: btc, eth)"
                  title="Cari simbol koin"
                  aria-label="Cari simbol koin"
                  value={scannerSearch}
                  onChange={(e) => setScannerSearch(e.target.value)}
                  className="bg-transparent border-none text-[#E6EDF3] text-xs focus:outline-none w-full font-mono placeholder-[#8B949E]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-[#030407] border border-[#1E2333] p-1 rounded-[3px]">
                  {(['ALL', 'TOP_GAINERS', 'HIGH_VOLATILITY', 'AI_SETUPS'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setScannerFilter(filterOpt)}
                      className={`px-3 py-1 rounded-[2px] text-[10px] font-bold uppercase transition ${
                        scannerFilter === filterOpt 
                          ? 'bg-[#0C0E18] text-[#58A6FF] border border-[#1E2333]' 
                          : 'text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      {filterOpt.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex bg-[#030407] border border-[#1E2333] p-1 rounded-[3px]">
                  {(['SCORE', 'CHANGE', 'VOLUME', 'SYMBOL'] as const).map((sortOpt) => (
                    <button
                      key={sortOpt}
                      onClick={() => setScannerSort(sortOpt)}
                      className={`px-3 py-1 rounded-[2px] text-[10px] font-bold uppercase transition ${
                        scannerSort === sortOpt 
                          ? 'bg-[#0C0E18] text-[#58A6FF] border border-[#1E2333]' 
                          : 'text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      SORT: {sortOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Table of Aset */}
            <div className="quantum-card rounded-[3px] border border-[#1E2333] bg-[#07090F] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-[#1E2333] text-[10px] text-[#8B949E] uppercase font-bold bg-[#030407]/35 select-none">
                      <th className="py-3.5 px-4">Simbol</th>
                      <th className="py-3.5 px-4 text-right">Harga (IDR)</th>
                      <th className="py-3.5 px-4 text-right">Perubahan 24J</th>
                      <th className="py-3.5 px-4 text-right">Volume (24J)</th>
                      <th className="py-3.5 px-4 text-center">Quant Score</th>
                      <th className="py-3.5 px-4 text-center">Sinyal Bot</th>
                      <th className="py-3.5 px-4 text-center">Deteksi Pola</th>
                      <th className="py-3.5 px-4 text-center">Aksi Kunci</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D] font-mono text-xs text-[#E6EDF3]">
                    {(() => {
                      let list = pairs.map(p => {
                        const scanInfo = scannedCoinsData[p.id] || { score: 50, signal: 'NEUTRAL' as const, status: 'SCANNING' as const, pattern: 'None' };
                        return {
                          ...p,
                          score: scanInfo.score,
                          signal: scanInfo.signal,
                          status: scanInfo.status,
                          pattern: scanInfo.pattern,
                        };
                      });

                      if (scannerSearch.trim()) {
                        list = list.filter(item => item.symbol.toLowerCase().includes(scannerSearch.toLowerCase()));
                      }

                      if (scannerFilter === 'TOP_GAINERS') {
                        list = list.filter(item => item.change24h > 1.5);
                      } else if (scannerFilter === 'HIGH_VOLATILITY') {
                        list = list.filter(item => Math.abs(item.change24h) > 2.5);
                      } else if (scannerFilter === 'AI_SETUPS') {
                        list = list.filter(item => item.score > HIGH_ACCURACY_SIGNAL_THRESHOLD && item.signal !== 'NEUTRAL');
                      }

                      list.sort((a, b) => {
                        if (scannerSort === 'SCORE') return b.score - a.score;
                        if (scannerSort === 'CHANGE') return b.change24h - a.change24h;
                        if (scannerSort === 'VOLUME') return b.volumeIdr - a.volumeIdr;
                        return a.symbol.localeCompare(b.symbol);
                      });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-[#8B949E] font-sans">
                              Tidak ada koin yang cocok dengan filter atau pencarian Anda.
                            </td>
                          </tr>
                        );
                      }

                      return list.map((coin) => {
                        return (
                          <tr key={`scan-grid-${coin.id}`} className="hover:bg-[#0C0E18]/30 transition duration-150 select-none">
                            <td className="py-3 px-4 font-bold text-[#58A6FF] font-sans">
                              {coin.symbol} <span className="text-[10px] text-[#8B949E] font-mono">/IDR</span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold font-mono">
                              Rp {coin.price >= 1000 ? Math.round(coin.price).toLocaleString('id-ID') : coin.price.toFixed(2)}
                            </td>
                            <td className={`py-3 px-4 text-right font-bold font-mono ${coin.change24h >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                              {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#8B949E]">
                              Rp {(coin.volumeIdr / 1e6).toFixed(1)} Juta
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  coin.score >= 80 ? 'bg-[#3FB950]/15 text-[#3FB950]' : coin.score >= 70 ? 'bg-[#D29922]/15 text-[#D29922]' : 'bg-[#8B949E]/15 text-[#8B949E]'
                                }`}>
                                  {coin.score}
                                </span>
                                <div className="hidden sm:block w-12 bg-[#030407] h-1.5 rounded-full overflow-hidden border border-[#1E2333]">
                                  <div 
                                    className={`h-full rounded-full ${coin.score >= 80 ? 'bg-[#3FB950]' : coin.score >= 70 ? 'bg-[#D29922]' : 'bg-[#8B949E]'} ${getProgressWidthClass(coin.score)}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                coin.signal === 'LONG' 
                                  ? 'bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30' 
                                  : coin.signal === 'SHORT' 
                                    ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30' 
                                    : 'bg-[#8B949E]/10 text-[#8B949E]'
                              }`}>
                                {coin.signal}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-[10px] font-sans text-slate-300 italic font-bold">
                              {coin.pattern && coin.pattern !== 'None' ? coin.pattern : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPairId(coin.id);
                                    setLoading(true);
                                    setActiveTab('DASHBOARD');
                                  }}
                                  className="bg-[#0C0E18] hover:bg-[#30363D] text-[#58A6FF] font-bold text-[10px] px-2.5 py-1.5 rounded border border-[#1E2333] active:scale-[0.98] transition cursor-pointer font-sans"
                                >
                                  TERMINAL
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setSelectedPairId(coin.id);
                                    setLoading(true);
                                    setActiveTab('AUDITOR');
                                    setTimeout(() => {
                                      handleTriggerAnalysis();
                                    }, 500);
                                  }}
                                  className="bg-[#58A6FF] hover:bg-[#58A6FF]/95 text-[#0D1117] font-extrabold text-[10px] px-2.5 py-1.5 rounded active:scale-[0.98] transition cursor-pointer font-sans"
                                >
                                  AUDIT AI
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* AI AUDITOR VIEW TAB (3.6 & 3.7 & 3.10) */}
        {activeTab === 'AUDITOR' && (
          <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[#030407]">
            {/* Top Section: Full Oracle Cockpit Ratios, Coordinates, and Consensus */}
            <OracleDashboard 
              signal={oracleSignal}
              loading={oracleLoading}
              onImportTargets={handleImportTargets}
              onExecutePosition={handleQuickOraclePosition}
              walletBalance={cashBalance}
            />

            <EliteAuditorsPanel 
              signal={oracleSignal}
              loading={oracleLoading}
            />

            {/* Split layout: Prompt Chat Console and System Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Chat console (2/3 width) */}
              <div className="lg:col-span-2 quantum-card rounded-[3px] border border-[#1E2333] bg-[#07090F] flex flex-col h-[500px]">
                <div className="p-3 border-b border-[#1E2333] flex items-center justify-between bg-[#030407]/35 select-none">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#58A6FF]" />
                    <span className="text-xs font-bold text-[#E6EDF3] font-sans">COGNITIVE AI AUDITOR INTERACTIVE CONSOLE</span>
                  </div>
                  <span className="text-[9px] bg-[#58A6FF]/10 border border-[#58A6FF]/20 px-2 py-0.5 rounded font-mono text-[#58A6FF] uppercase">
                    Model: Live Context + Quant Core
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 font-sans text-xs">
                  {aiChatHistory.map((msg, index) => (
                    <div 
                      key={`chat-${index}`} 
                      className={`flex flex-col max-w-[85%] ${msg.role === 'USER' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8B949E] font-mono">
                        <span className="font-bold text-[#E6EDF3]">{msg.role === 'USER' ? 'ELITE USER' : '🤖 FANTASMA SYNERGY AI'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-[3px] border font-normal leading-relaxed whitespace-pre-line ${
                        msg.role === 'USER' 
                          ? 'bg-[#0C0E18] border-[#1E2333] text-[#E6EDF3] rounded-tr-none' 
                          : 'bg-[#030407] border-[#1E2333] text-slate-100 rounded-tl-none font-sans'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiChatLoading && (
                    <div className="flex flex-col items-start self-start max-w-[85%]">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8B949E] font-mono">
                        <span className="font-bold text-[#E6EDF3]">🤖 FANTASMA SYNERGY AI</span>
                      </div>
                      <div className="bg-[#030407] border border-[#1E2333] p-3 rounded-[3px] rounded-tl-none text-[#8B949E] flex items-center gap-2 font-mono">
                        <span className="h-2 w-2 rounded-full bg-[#58A6FF] animate-pulse" />
                        AI Auditor sedang membaca live scanner, Oracle, orderbook, candle, dan risk context...
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleAiChatSubmit} className="p-3 border-t border-[#1E2333] bg-[#030407]/35 flex gap-2">
                  <input
                    id="chat-audit-input"
                    type="text"
                    disabled={aiChatLoading}
                    placeholder={`Tanyakan audit untuk ${activePairSymbol}/IDR... (misal: 'tren', 'leverage', 'kelly')`}
                    title="Pertanyaan Audit AI"
                    aria-label="Pertanyaan Audit AI"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-[#030407] border border-[#1E2333] rounded-[3px] px-3 py-2 text-xs font-sans text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF]"
                  />
                  <button
                    type="submit"
                    disabled={aiChatLoading || !aiPrompt.trim()}
                    className="bg-[#58A6FF] hover:bg-[#58A6FF]/95 text-[#0D1117] font-extrabold text-xs px-5 py-2 rounded-[3px] cursor-pointer transition active:scale-[0.98]"
                  >
                    KIRIM
                  </button>
                </form>
              </div>

              {/* Bot Logs Terminal (1/3 width) */}
              <div className="lg:col-span-1 quantum-card rounded-[3px] border border-[#1E2333] bg-[#07090F] flex flex-col h-[500px] overflow-hidden">
                <div className="p-3 border-b border-[#1E2333] bg-[#030407]/35 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-[#3FB950]" />
                    <span className="text-xs font-bold text-[#E6EDF3] font-sans">LIVE AUDIT BOT SYSTEM FEED</span>
                  </div>
                  <button
                    onClick={() => setBotLogs([])}
                    className="text-[9px] border border-[#1E2333] bg-[#030407] px-2 py-0.5 rounded text-[#8B949E] hover:text-[#E6EDF3] transition cursor-pointer"
                  >
                    HAPUS
                  </button>
                </div>
                <div className="flex-1 p-3.5 overflow-y-auto bg-[#070a13] font-mono text-[10px] leading-relaxed flex flex-col gap-2">
                  {botLogs.length === 0 ? (
                    <span className="text-[#8B949E] text-center mt-4">Belum ada aktivitas bot kuantitatif. Aktifkan auto-trading atau picu Cognitive Run.</span>
                  ) : (
                    [...botLogs].reverse().map((log, index) => {
                      const logColors = {
                        INFO: 'text-[#8B949E]',
                        SUCCESS: 'text-[#3FB950]',
                        WARNING: 'text-[#D29922]',
                        ERROR: 'text-[#F85149]',
                      };
                      return (
                        <div key={`log-${index}`} className="flex items-start gap-1">
                          <span className="text-[#8B949E] shrink-0 font-bold">[{log.timestamp}]</span>
                          <span className={`${logColors[log.type] || 'text-[#E6EDF3]'} break-all`}>
                            {log.message}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* RISK LAB VIEW TAB (v3.1) */}
        {activeTab === 'RISK_LAB' && (
          <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto lg:overflow-hidden bg-[#030407]">
            {/* Header Title */}
            <div className="border-b border-[#1E2333] pb-3 select-none">
              <h2 className="text-lg font-extrabold text-[#E6EDF3] flex items-center gap-2 font-sans">
                <Sliders className="h-5 w-5 text-purple-400" /> ORACLE COGNITIVE TP/SL & RISK LAB
              </h2>
              <p className="text-xs text-[#8B949E] mt-1 font-mono">Simulasikan gaya trading, kelayakan rentang waktu profit, dan alokasikan porsi lot size matematis menggunakan dynamic volatility scaling.</p>
            </div>

            <RiskLabConsole
              pairs={pairs}
              selectedPairId={selectedPairId}
              onSelectPair={setSelectedPairId}
              candles={candles}
              ticker={ticker}
              depth={depth}
              cashBalance={cashBalance}
              activePositions={activePositions}
              onApplySetup={({ entry, sl, tp1, tp2, tp3, direction, confidence, leverage, margin }) => {
                setEntryPrice(entry);
                setSlPrice(sl);
                setTpPrice(tp2); // TP2 as default target
                
                // Switch to main dashboard tab to review filled inputs
                setActiveTab('DASHBOARD');
                showToast(`🚀 Setup Risk Lab berhasil diterapkan untuk ${activePairSymbol}/IDR! Sinyal: ${direction}, SL: Rp ${sl.toLocaleString('id-ID')}, TP2: Rp ${tp2.toLocaleString('id-ID')}.`, 'success');
              }}
              recentSlPairs={recentSlPairs}
            />
          </main>
        )}

        {/* LIVE INTELLIGENCE VIEW TAB */}
        {activeTab === 'INTELLIGENCE' && (
          <IntelligenceConsole />
        )}

        {/* SETTINGS VIEW TAB (3.6) */}
        {activeTab === 'SETTINGS' && (
          <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[#030407]">
            {/* Header Title */}
            <div className="border-b border-[#1E2333] pb-3 select-none">
              <h2 className="text-lg font-extrabold text-[#E6EDF3] flex items-center gap-2 font-sans">
                <Sliders className="h-5 w-5 text-[#58A6FF]" /> KONFIGURASI PARAMETER TERMINAL KUANTITATIF
              </h2>
              <p className="text-xs text-[#8B949E] mt-1 font-mono">Sesuaikan modal awal virtual, concurrent trades limit, model alokasi risk sizing, dan setup leverage.</p>
            </div>

            {/* Grid options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start font-sans select-none">
              {/* Column 1: Capital Control & Limits */}
              <div className="flex flex-col gap-6">
                {/* simulated capital card */}
                <div className="quantum-card rounded-[3px] p-5 border border-[#1E2333] bg-[#07090F] flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2">
                    <Coins className="h-4.5 w-4.5 text-yellow-500" />
                    <span className="text-xs font-bold text-[#E6EDF3] uppercase">Alokasi Modal Virtual (Simulasi)</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="wallet-trading-capital" className="text-[10px] font-bold text-[#8B949E] uppercase font-mono cursor-pointer">Wallet Trading Capital (Saldo Kas)</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#030407] border border-[#1E2333] rounded-[3px] px-3.5 py-2 font-mono text-sm font-extrabold text-[#E6EDF3] flex items-center justify-between">
                        <span>Rp</span>
                        <input
                          id="wallet-trading-capital"
                          type="number"
                          title="Wallet Trading Capital (Saldo Kas)"
                          placeholder="Masukkan saldo kas"
                          value={cashBalance}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCashBalance(val);
                          }}
                          className="bg-transparent border-none text-right focus:outline-none w-full font-mono text-[#E6EDF3] ml-2 font-extrabold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCashBalance(10000000);
                        setBalanceChangePulse('gain');
                        setTimeout(() => setBalanceChangePulse(null), 1000);
                        showToast('✅ Saldo kas di-reset menjadi Rp 10.000.000', 'success');
                      }}
                      className="bg-[#030407] hover:bg-[#0C0E18] border border-[#1E2333] hover:border-[#58A6FF] rounded-[3px] py-2 text-[10px] font-bold font-mono text-[#E6EDF3] transition cursor-pointer"
                    >
                      RESET 10 JT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCashBalance(50000000);
                        setBalanceChangePulse('gain');
                        setTimeout(() => setBalanceChangePulse(null), 1000);
                        showToast('✅ Saldo kas ditambahkan menjadi Rp 50.000.000', 'success');
                      }}
                      className="bg-[#030407] hover:bg-[#0C0E18] border border-[#1E2333] hover:border-[#58A6FF] rounded-[3px] py-2 text-[10px] font-bold font-mono text-[#E6EDF3] transition cursor-pointer"
                    >
                      SET 50 JT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCashBalance(100000000);
                        setBalanceChangePulse('gain');
                        setTimeout(() => setBalanceChangePulse(null), 1000);
                        showToast('✅ Saldo kas ditambahkan menjadi Rp 100.000.000', 'success');
                      }}
                      className="bg-[#030407] hover:bg-[#0C0E18] border border-[#1E2333] hover:border-[#58A6FF] rounded-[3px] py-2 text-[10px] font-bold font-mono text-[#E6EDF3] transition cursor-pointer"
                    >
                      SET 100 JT
                    </button>
                  </div>
                </div>

                {/* bot limits card */}
                <div className="quantum-card rounded-[3px] p-5 border border-[#1E2333] bg-[#07090F] flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2">
                    <Activity className="h-4.5 w-4.5 text-[#58A6FF]" />
                    <span className="text-xs font-bold text-[#E6EDF3] uppercase">Batas Operasional Bot Scanner</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bot-trade-margin" className="flex justify-between items-center text-[10px] font-bold uppercase font-mono cursor-pointer">
                      <span className="text-[#8B949E]">Modal per Transaksi Bot</span>
                      <span className="text-[#E6EDF3]">Rp {botTradeMargin.toLocaleString('id-ID')}</span>
                    </label>
                    <input
                      id="bot-trade-margin"
                      type="range"
                      min={100000}
                      max={5000000}
                      step={50000}
                      value={botTradeMargin}
                      onChange={(e) => setBotTradeMargin(parseInt(e.target.value, 10))}
                      title="Modal per Transaksi Bot"
                      aria-label="Modal per Transaksi Bot"
                      className="w-full h-1 bg-[#030407] rounded-[3px] appearance-none cursor-pointer accent-[#58A6FF] border border-[#1E2333]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label htmlFor="bot-max-positions" className="flex justify-between items-center text-[10px] font-bold uppercase font-mono cursor-pointer">
                      <span className="text-[#8B949E]">Kapasitas Maksimal Posisi Terbuka</span>
                      <span className="text-[#E6EDF3]">{botMaxPositions} Posisi Concurrent</span>
                    </label>
                    <input
                      id="bot-max-positions"
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={botMaxPositions}
                      onChange={(e) => setBotMaxPositions(parseInt(e.target.value, 10))}
                      title="Kapasitas Maksimal Posisi Terbuka"
                      aria-label="Kapasitas Maksimal Posisi Terbuka"
                      className="w-full h-1 bg-[#030407] rounded-[3px] appearance-none cursor-pointer accent-[#58A6FF] border border-[#1E2333]"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Leverage and Strategy */}
              <div className="flex flex-col gap-6">
                {/* leverage options card */}
                <div className="quantum-card rounded-[3px] p-5 border border-[#1E2333] bg-[#07090F] flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2">
                    <Cpu className="h-4.5 w-4.5 text-[#3FB950]" />
                    <span className="text-xs font-bold text-[#E6EDF3] uppercase">Algoritma Manajemen Risiko Leverage</span>
                  </div>

                  {/* strategy toggle buttons */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#030407] border border-[#1E2333] rounded-[3px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLeverageStrategy('DYNAMIC');
                        showToast('🤖 AI Dynamic Probability Leverage diaktifkan!', 'info');
                      }}
                      className={`py-2 text-[10px] font-bold uppercase rounded-[2px] transition cursor-pointer ${
                        leverageStrategy === 'DYNAMIC' 
                          ? 'bg-[#0C0E18] text-[#58A6FF] border border-[#1E2333]' 
                          : 'text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      🤖 AI Dynamic Strategy (b)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLeverageStrategy('FIXED');
                        showToast('⚙️ Fixed Leverage Strategy diaktifkan!', 'info');
                      }}
                      className={`py-2 text-[10px] font-bold uppercase rounded-[2px] transition cursor-pointer ${
                        leverageStrategy === 'FIXED' 
                          ? 'bg-[#0C0E18] text-[#58A6FF] border border-[#1E2333]' 
                          : 'text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      ⚙️ Fixed Leverage Mode
                    </button>
                  </div>

                  {leverageStrategy === 'DYNAMIC' ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-[3px] bg-[#030407] border border-[#1E2333] mt-1">
                      <label htmlFor="max-leverage-cap" className="flex justify-between items-center text-[10px] font-bold uppercase font-mono cursor-pointer">
                        <span className="text-[#8B949E]">AI Dynamic Leverage Cap</span>
                        <span className="text-[#E6EDF3] font-bold">{maxLeverageCap}x</span>
                      </label>
                      <input
                        id="max-leverage-cap"
                        type="range"
                        min={2}
                        max={100}
                        step={1}
                        value={maxLeverageCap}
                        onChange={(e) => setMaxLeverageCap(parseInt(e.target.value, 10))}
                        title="AI Dynamic Leverage Cap"
                        aria-label="AI Dynamic Leverage Cap"
                        className="w-full h-1 bg-[#07090F] rounded-[3px] appearance-none cursor-pointer accent-[#58A6FF] border border-[#1E2333]"
                      />
                      <span className="text-[9px] text-[#8B949E] leading-normal font-sans italic mt-1.5">
                        *AI secara otomatis mengalikan probabilitas b coin setup dengan Max Cap ini untuk menghasilkan leverage optimal per detiknya: leverage = Round(Cap * b).
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 p-3 rounded-[3px] bg-[#030407] border border-[#1E2333] mt-1">
                      <label htmlFor="fixed-leverage-multiplier" className="flex justify-between items-center text-[10px] font-bold uppercase font-mono cursor-pointer">
                        <span className="text-[#8B949E]">Fixed Leverage Multiplier</span>
                        <span className="text-[#E6EDF3] font-bold">{fixedLeverage}x</span>
                      </label>
                      <input
                        id="fixed-leverage-multiplier"
                        type="range"
                        min={1}
                        max={50}
                        step={1}
                        value={fixedLeverage}
                        onChange={(e) => setFixedLeverage(parseInt(e.target.value, 10))}
                        title="Fixed Leverage Multiplier"
                        aria-label="Fixed Leverage Multiplier"
                        className="w-full h-1 bg-[#07090F] rounded-[3px] appearance-none cursor-pointer accent-[#58A6FF] border border-[#1E2333]"
                      />
                      <span className="text-[9px] text-[#8B949E] leading-normal font-sans italic mt-1.5">
                        *Seluruh setup bot dan manual order simulator akan dieksekusi menggunakan leverage multiplier tetap ini tanpa mempertimbangkan probabilitas b.
                      </span>
                    </div>
                  )}
                </div>

                {/* API / UI LATENCY CARD */}
                <div className="quantum-card rounded-[3px] p-5 border border-[#1E2333] bg-[#07090F] flex flex-col gap-3 text-xs">
                  <div className="flex items-center gap-2 border-b border-[#1E2333] pb-2 text-yellow-500">
                    <Globe className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold text-[#E6EDF3] uppercase">Status Konektivitas & Reset</span>
                  </div>

                  <div className="flex items-center justify-between font-mono mt-1 text-[10px] text-[#8B949E] uppercase font-bold">
                    <span>Indodax REST API Polling</span>
                    <span className="text-[#3FB950]">Active (1s Ticks)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#8B949E] uppercase font-bold">
                    <span>Database Simulator</span>
                    <span className="text-[#58A6FF]">Sync (LocalStorage)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat trade dan logs simulasi? Tindakan ini tidak dapat dibatalkan.')) {
                        localStorage.removeItem('ag_closedTrades');
                        localStorage.removeItem('ag_botLogs');
                        localStorage.removeItem('ag_activePositions');
                        localStorage.removeItem('ag_failedSignalCooldowns');
                        setClosedTrades([]);
                        setBotLogs([]);
                        setActivePositions([]);
                        setFailedSignalCooldowns({});
                        showToast('🔥 Seluruh riwayat simulasi berhasil dibersihkan!', 'error');
                      }
                    }}
                    className="w-full mt-2 bg-[#F85149]/10 hover:bg-[#F85149]/20 border border-[#F85149]/35 hover:border-[#F85149] text-[#F85149] font-bold text-xs py-2.5 rounded-[3px] transition active:scale-[0.98] cursor-pointer"
                  >
                    BERSIHKAN SELURUH DATA RIWAYAT
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* 3. Footer Banner Disclaimer */}
        <footer className="border-t border-[#1E2333] bg-[#07090F] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-[#8B949E] gap-3 select-none">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#58A6FF]" />
            <span>Terminal Perdagangan Kuantitatif Fantasma Synergy. Didukung oleh Next.js 15 & Data Pasar Indodax.</span>
          </div>
          <span className="text-center md:text-right italic">
            Disclaimer: Ini bukan saran keuangan. Perdagangan aset kripto memiliki risiko sangat tinggi. Keputusan akhir sepenuhnya di tangan pengguna.
          </span>
        </footer>
      </div>

      {/* TOAST UI NOTIFICATIONS (1.5) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0C0E18] border border-[#1E2333] text-[#E6EDF3] px-4 py-3.5 rounded-[3px] shadow-2xl flex items-center gap-2.5 animate-fadeIn select-none font-sans font-bold text-xs max-w-sm">
          <div className="shrink-0 text-base">{toast.type === 'success' ? '✅' : '⚠️'}</div>
          <span className="leading-normal">{toast.message}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet only) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07090F] border-t border-[#1E2333] justify-around py-1.5 px-2 select-none shadow-2xl backdrop-blur-md bg-opacity-90">
        <button 
          type="button"
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'DASHBOARD' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('SCANNER')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'SCANNER' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          <span>Scanner</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('INTELLIGENCE')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'INTELLIGENCE' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <Globe className="h-5 w-5" />
          <span>Live Intel</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('AUDITOR')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'AUDITOR' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <Cpu className="h-5 w-5" />
          <span>Auditor</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('RISK_LAB')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'RISK_LAB' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <Sliders className="h-5 w-5" />
          <span>Risk Lab</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-[3px] text-[10px] font-bold uppercase transition-all cursor-pointer font-sans ${
            activeTab === 'SETTINGS' ? 'text-[#58A6FF]' : 'text-[#8B949E]'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
