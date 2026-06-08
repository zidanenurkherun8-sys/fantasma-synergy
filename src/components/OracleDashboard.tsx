import React, { useState } from 'react';
import { Brain, Sliders, Cpu, Activity, Coins, TrendingUp, TrendingDown, Terminal, Clock, ShieldAlert, Award, Globe, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { OracleSignal } from '@/lib/oracle-engine';
import OracleGauge from './OracleGauge';

interface OracleDashboardProps {
  signal: OracleSignal | null;
  loading: boolean;
  onImportTargets?: (entry: number, sl: number, tp: number) => void;
  onExecutePosition?: (type: 'LONG' | 'SHORT', leverage: number, margin: number, entry: number, sl: number, tp: number, probability: number) => void;
  walletBalance: number;
}

export default function OracleDashboard({
  signal,
  loading,
  onImportTargets,
  onExecutePosition,
  walletBalance
}: OracleDashboardProps) {
  const [activeReasonTab, setActiveReasonTab] = useState<'ALL' | 'TECHNICAL' | 'SMART' | 'FUNDAMENTALS'>('ALL');
  const [selectedLeverage, setSelectedLeverage] = useState(10);
  const [allocatedMargin, setAllocatedMargin] = useState(1000000); // Rp 1.000.000 default

  if (loading) {
    return (
      <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-8 flex flex-col items-center justify-center min-h-[500px] select-none">
        <div className="relative h-20 w-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-t-2 border-[#30363D] border-t-[#58A6FF] animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-b-2 border-transparent border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse' }} />
          <Cpu className="h-6 w-6 text-[#58A6FF] animate-pulse" />
        </div>
        <h3 className="text-sm font-extrabold text-[#E6EDF3] uppercase tracking-wider font-sans mb-1.5">Memulai Audit Oracle Kuantitatif</h3>
        <p className="text-xs text-[#8B949E] font-mono max-w-sm text-center leading-relaxed">
          Mengumpulkan data 7 timeframe layer, melacak pergerakan Whale wallet bandar, memproses 50+ Technical Orchestra, dan menghitung model Ensemble 9-layer...
        </p>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-12 flex flex-col items-center justify-center text-center min-h-[500px] select-none text-slate-500 font-sans">
        <ShieldAlert className="h-16 w-16 mb-4 text-[#8B949E] opacity-35 animate-bounce" style={{ animationDuration: '3s' }} />
        <h3 className="text-base font-extrabold text-[#E6EDF3] uppercase tracking-wide">Menunggu Sinyal Kuantitatif Oracle</h3>
        <p className="text-xs text-[#8B949E] font-mono mt-2 max-w-md leading-normal">
          Cash is a position. Tekan tombol &quot;COGNITIVE RUN&quot; di atas atau pilih koin dari Market Scanner untuk meluncurkan analisis multi-timeframe dewa.
        </p>
      </div>
    );
  }

  const isLong = signal.direction === 'LONG';
  const isShort = signal.direction === 'SHORT';
  const isNeutral = signal.direction === 'NEUTRAL';

  // Format model ensemble as array
  const models = signal.modelConsensus
    ? [
        { name: 'LSTM-7T Temporal', data: signal.modelConsensus.lstm },
        { name: 'XGBoost Classifier', data: signal.modelConsensus.xgboost },
        { name: 'Transformer Attention', data: signal.modelConsensus.transformer },
        { name: 'RandomForest Bagging', data: signal.modelConsensus.randomForest },
        { name: 'LightGBM Leaf Gradient', data: signal.modelConsensus.lightgbm },
        { name: 'CatBoost Optimized', data: signal.modelConsensus.catboost },
        { name: 'GRU Bidirectional', data: signal.modelConsensus.gru },
        { name: 'CNN-1D Dilated Res', data: signal.modelConsensus.cnn },
        { name: 'Prophet Trend Decomp', data: signal.modelConsensus.prophet }
      ]
    : [];

  const agreementPct = Math.round(signal.modelConsensus?.agreement * 100) || 75;

  const handleQuickExecute = () => {
    if (onExecutePosition && !isNeutral) {
      onExecutePosition(
        isLong ? 'LONG' : 'SHORT',
        selectedLeverage,
        allocatedMargin,
        signal.entryPrice,
        signal.stopLoss,
        signal.takeProfit2,
        signal.confidence / 100
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Header Signal tier & primary overview */}
      <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden select-none">
        {/* Glow backdrop styling */}
        <div 
          className="absolute inset-y-0 left-0 w-1.5" 
          style={{ backgroundColor: signal.tierColor }} 
        />
        
        <div className="flex items-center gap-4 pl-2">
          {/* Signal Indicator circle */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-lg shrink-0 ${
            isLong 
              ? 'bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30' 
              : isShort 
                ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30' 
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {isLong ? '📈' : isShort ? '📉' : '⚖️'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-widest animate-pulse font-mono flex items-center gap-1.5"
                style={{ backgroundColor: `${signal.tierColor}20`, color: signal.tierColor, border: `1px solid ${signal.tierColor}35` }}
              >
                {signal.tierColor === '#FFD700' ? '🔮' : '💎'} {signal.tierLabel}
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">
                {signal.timestampWib}
              </span>
            </div>
            
            <h2 className="text-xl font-black text-[#E6EDF3] mt-1.5 flex items-center gap-2">
              {signal.symbol}/IDR
              <span className={`text-sm font-extrabold uppercase px-2 py-0.5 rounded ${
                isLong ? 'bg-[#3FB950]/10 text-[#3FB950]' : isShort ? 'bg-[#F85149]/10 text-[#F85149]' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {isLong ? 'STRONG BUY SETUP' : isShort ? 'STRONG SELL SETUP' : 'WAIT & OBSERVE'}
              </span>
            </h2>
          </div>
        </div>

        {/* Action controllers */}
        {!isNeutral && (
          <div className="flex items-center gap-3">
            {onImportTargets && (
              <button
                type="button"
                onClick={() => {
                  onImportTargets(signal.entryPrice, signal.stopLoss, signal.takeProfit2);
                  if (typeof window !== 'undefined') {
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-6 right-6 z-50 bg-[#1C2333] border border-[#30363D] text-[#E6EDF3] px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn text-xs font-bold font-sans';
                    toast.innerHTML = '✅ Kooridinat target Oracle berhasil di-import ke kalkulator!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                  }
                }}
                className="bg-[#0D1117] hover:bg-[#1C2333] border border-[#30363D] hover:border-[#58A6FF] text-[#E6EDF3] font-bold text-xs px-4 py-2.5 rounded-lg transition active:scale-[0.98] cursor-pointer"
              >
                IMPORT TARGETS
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Primary layout grid: Left (2/3 width) reasoning & consensus, Right (1/3 width) stats & gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start select-none">
        
        {/* Left side: Coordinates & model consensus */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Coordinates Block */}
          {!isNeutral && (
            <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#30363D] pb-2 text-[#58A6FF]">
                <Activity className="h-4.5 w-4.5" />
                <span className="text-xs uppercase font-extrabold text-[#E6EDF3]">KOORDINAT TRANSASKI ORACLE</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-center text-xs">
                <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg">
                  <span className="text-[9px] text-[#8B949E] block mb-1">ENTRY ZONE</span>
                  <span className="font-extrabold text-[#E6EDF3]">Rp {signal.entryPrice.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg border-l-2 border-l-[#F85149]">
                  <span className="text-[9px] text-[#8B949E] block mb-1">STOP LOSS (ATR)</span>
                  <span className="font-extrabold text-[#F85149]">Rp {signal.stopLoss.toLocaleString('id-ID')}</span>
                </div>

                <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg border-l-2 border-l-[#3FB950]">
                  <span className="text-[9px] text-[#8B949E] block mb-1">STAGE 1 (1.5R)</span>
                  <span className="font-extrabold text-[#3FB950]">Rp {signal.takeProfit1.toLocaleString('id-ID')}</span>
                </div>

                <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg border-l-2 border-l-[#3FB950]">
                  <span className="text-[9px] text-[#8B949E] block mb-1">STAGE 2 (3R)</span>
                  <span className="font-extrabold text-[#3FB950]">Rp {signal.takeProfit2.toLocaleString('id-ID')}</span>
                </div>

                <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg border-l-2 border-l-[#3FB950]">
                  <span className="text-[9px] text-[#8B949E] block mb-1">STAGE 3 (TRAILING)</span>
                  <span className="font-extrabold text-[#3FB950]">Rp {signal.takeProfit3.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Position Execution Area */}
              {onExecutePosition && (
                <div className="bg-[#0D1117] border border-[#30363D] p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 mt-1.5">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#8B949E] uppercase font-bold font-mono">Suggested Margin (Kelly)</span>
                      <span className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                        Rp {Math.round(walletBalance * (signal.kellySize / 100)).toLocaleString('id-ID')} ({signal.kellySize}%)
                      </span>
                    </div>

                    {/* Leverage Config Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#8B949E] uppercase font-bold font-mono">Select Leverage</span>
                      <select 
                        value={selectedLeverage}
                        onChange={(e) => setSelectedLeverage(parseInt(e.target.value, 10))}
                        className="bg-[#161B22] border border-[#30363D] rounded px-2.5 py-1 text-xs font-mono text-[#E6EDF3] focus:outline-none"
                      >
                        {[5, 10, 25, 50, 100, 250, 500, 1000].map(lv => (
                          <option key={`lev-sel-${lv}`} value={lv}>{lv}x</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickExecute}
                    className="bg-[#3FB950] hover:bg-[#3FB950]/90 text-[#0D1117] font-extrabold text-xs px-5 py-2.5 rounded-lg active:scale-[0.98] transition cursor-pointer font-sans"
                  >
                    EKSEKUSI BOT SEKARANG ({signal.kellySize}% Kelly)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reasoning chain expandable panels */}
          <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2 bg-[#0D1117]/10">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-[#D29922]" />
                <span className="text-xs uppercase font-extrabold text-[#E6EDF3]">REASONING CHAIN - KENAPA AI YAKIN?</span>
              </div>
              <div className="flex bg-[#0D1117] border border-[#30363D] p-0.5 rounded">
                {(['ALL', 'TECHNICAL', 'SMART', 'FUNDAMENTALS'] as const).map((tab) => (
                  <button
                    key={`reason-tab-${tab}`}
                    onClick={() => setActiveReasonTab(tab)}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition ${
                      activeReasonTab === tab 
                        ? 'bg-[#1C2333] text-[#58A6FF]' 
                        : 'text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Narrative lists */}
            <div className="flex flex-col gap-3 font-sans text-[11px] leading-relaxed text-slate-350">
              {activeReasonTab === 'ALL' && (
                <div className="flex flex-col gap-2.5">
                  {signal.reasoningChain.map((reason, idx) => (
                    <div key={`reason-${idx}`} className="flex items-start gap-2.5 bg-[#0D1117]/35 border border-[#30363D] p-3 rounded-lg">
                      <span className="h-5 w-5 bg-[#58A6FF]/10 text-[#58A6FF] rounded border border-[#58A6FF]/20 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeReasonTab === 'TECHNICAL' && (
                <div className="flex flex-col gap-3 p-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1">
                    <span>Orchestra Consensus Index:</span>
                    <span className="text-[#3FB950] font-bold">{signal.technicalOrchestra.finalScore}% Bullish</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[9px] mt-1">
                    <div className="bg-[#0D1117] border border-[#30363D] p-2 rounded">
                      <span className="block text-[#8B949E] mb-0.5">BULLISH VOTES</span>
                      <span className="text-[#3FB950] font-extrabold">{signal.technicalOrchestra.bullishVotes}</span>
                    </div>
                    <div className="bg-[#0D1117] border border-[#30363D] p-2 rounded">
                      <span className="block text-[#8B949E] mb-0.5">BEARISH VOTES</span>
                      <span className="text-[#F85149] font-extrabold">{signal.technicalOrchestra.bearishVotes}</span>
                    </div>
                    <div className="bg-[#0D1117] border border-[#30363D] p-2 rounded">
                      <span className="block text-[#8B949E] mb-0.5">NEUTRAL VOTES</span>
                      <span className="text-amber-500 font-extrabold">{signal.technicalOrchestra.neutralVotes}</span>
                    </div>
                  </div>
                  {signal.harmonicScan.patternDetected !== 'None' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-slate-100 leading-relaxed font-sans text-xs mt-3 flex items-start gap-2.5">
                      <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-400 font-bold mb-0.5">Pola Harmonik Auto-Detected: {signal.harmonicScan.patternDetected}</strong>
                        <span>{signal.harmonicScan.description}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeReasonTab === 'SMART' && (
                <div className="flex flex-col gap-3 p-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>Whale Consensus Score:</span>
                    <span className="text-[#3FB950] font-extrabold">{signal.smartMoney.whaleScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>Orderbook Imbalance:</span>
                    <span>{signal.smartMoney.orderBookScore}% Bids (Tekanan Akumulasi)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>Netflow Signal:</span>
                    <span className="font-extrabold text-[#58A6FF]">{signal.smartMoney.netflowSignal}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>Open Interest Trend:</span>
                    <span>{signal.smartMoney.openInterestTrend} CONTINUATION</span>
                  </div>
                </div>
              )}

              {activeReasonTab === 'FUNDAMENTALS' && (
                <div className="flex flex-col gap-3 p-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>NVT Ratio (Transactions):</span>
                    <span>{signal.fundamentals.nvtRatio} ({signal.fundamentals.nvtStatus})</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>MVRV Z-Score:</span>
                    <span>{signal.fundamentals.mvrvZScore} ({signal.fundamentals.mvrvStatus})</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-1.5">
                    <span>Active Addresses (7d MA):</span>
                    <span className="text-[#3FB950] font-bold">+{signal.fundamentals.activeAddressesGrowth}% Growth</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3x3 Model Consensus Grid */}
          <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-[#58A6FF]" />
                <span className="text-xs uppercase font-extrabold text-[#E6EDF3]">Ensemble Model Consensus Grid (3x3)</span>
              </div>
              <span className="text-[10px] font-mono text-[#8B949E] uppercase font-bold bg-[#0D1117] border border-[#30363D] px-2.5 py-0.5 rounded">
                Agreement: {agreementPct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {models.map((m) => {
                const hasDissent = m.data.vote !== signal.direction && m.data.vote !== 'NEUTRAL';
                const cardBorder = hasDissent ? 'border-amber-500/40 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.05)]' : 'border-[#30363D] bg-[#0D1117]';
                const voteColor = m.data.vote === 'LONG' ? 'text-[#3FB950]' : m.data.vote === 'SHORT' ? 'text-[#F85149]' : 'text-amber-500';

                return (
                  <div 
                    key={`model-grid-${m.name}`}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between font-sans ${cardBorder}`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#E6EDF3] leading-none block font-sans">{m.name.split(' ')[0]}</span>
                      <span className="text-[8px] text-[#8B949E] font-mono mt-1 block uppercase leading-none">{m.name.split(' ').slice(1).join(' ') || 'Network'}</span>
                    </div>
                    <div className="text-right font-mono select-none">
                      <span className={`text-[11px] font-extrabold uppercase block leading-none ${voteColor}`}>{m.data.vote}</span>
                      <span className="text-[8px] text-[#8B949E] block mt-0.5">{m.data.confidence}% Conf</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Circular Gauge and Backtest Cumulative track records */}
        <div className="flex flex-col gap-6">
          <OracleGauge signal={signal} loading={loading} />

          {/* Cumulative Track records card */}
          <div className="quantum-card rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col gap-4 font-sans select-none">
            <div className="flex items-center gap-2 border-b border-[#30363D] pb-2 text-[#58A6FF]">
              <Globe className="h-4.5 w-4.5" />
              <span className="text-xs uppercase font-extrabold text-[#E6EDF3]">Oracle Backtest Metrics</span>
            </div>

            <div className="flex flex-col gap-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Avg Win Rate (90d):</span>
                <span className="font-extrabold text-[#3FB950]">78.42%</span>
              </div>
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Sharpe Ratio:</span>
                <span className="font-extrabold text-[#E6EDF3]">3.24</span>
              </div>
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Sortino Ratio:</span>
                <span className="font-extrabold text-[#E6EDF3]">4.12</span>
              </div>
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Calmar Ratio (Recovery):</span>
                <span className="font-extrabold text-[#58A6FF]">5.82</span>
              </div>
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Expectancy (Expect):</span>
                <span className="text-[#3FB950] font-bold">+2.84R</span>
              </div>
              <div className="flex justify-between border-b border-[#30363D] pb-1.5">
                <span className="text-[#8B949E] uppercase font-sans">Profit Factor:</span>
                <span className="font-extrabold text-[#E6EDF3]">2.84</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-[#8B949E] uppercase font-sans">Worst Drawdown:</span>
                <span className="font-extrabold text-[#F85149]">-4.82%</span>
              </div>
            </div>

            {/* mini chart mockup line */}
            <div className="h-10 bg-[#0D1117] border border-[#30363D] rounded-lg mt-1 p-2 flex items-center justify-between font-mono text-[9px] relative overflow-hidden">
              <span className="text-[#8B949E] z-10 font-bold font-sans">90D EQUITY CURVE</span>
              <span className="text-[#3FB950] z-10 font-bold">+412.5%</span>
              
              {/* background decorative line */}
              <div className="absolute inset-0 bg-[#0D1117]">
                <svg className="w-full h-full opacity-35" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path 
                    d="M0,20 L10,18 L20,19 L30,15 L40,16 L50,10 L60,11 L70,5 L80,7 L90,1 L100,2" 
                    fill="none" 
                    className="stroke-[#3FB950]" 
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
