'use client';

import React, { useState, useEffect } from 'react';
import { Percent, ShieldAlert, Award, Calculator } from 'lucide-react';

interface RiskCalculatorProps {
  balance: number;
  riskPercent: number;
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  symbol: string;
  onBalanceChange: (val: number) => void;
  onRiskChange: (val: number) => void;
}

export default function RiskCalculator({
  balance,
  riskPercent,
  entryPrice: initialEntry,
  slPrice: initialSl,
  tpPrice: initialTp,
  symbol,
  onBalanceChange,
  onRiskChange,
}: RiskCalculatorProps) {
  const [entryPrice, setEntryPrice] = useState(initialEntry);
  const [slPrice, setSlPrice] = useState(initialSl);
  const [tpPrice, setTpPrice] = useState(initialTp);

  // Sync state with parent props if they change externally (e.g. when report widget is clicked!)
  useEffect(() => {
    setEntryPrice(initialEntry);
  }, [initialEntry]);

  useEffect(() => {
    setSlPrice(initialSl);
  }, [initialSl]);

  useEffect(() => {
    setTpPrice(initialTp);
  }, [initialTp]);

  // Calculations
  const riskAmountIdr = balance * (riskPercent / 100);
  const slDistancePercent = entryPrice > 0 ? (Math.abs(entryPrice - slPrice) / entryPrice) * 100 : 0;
  
  // Sizing Formula: PositionSize = RiskAmount / SlDistancePercent
  const positionSizeIdr = slDistancePercent > 0 
    ? (riskAmountIdr / (slDistancePercent / 100))
    : 0;

  const positionSizeCoin = entryPrice > 0 ? positionSizeIdr / entryPrice : 0;

  const tpDistancePercent = entryPrice > 0 ? (Math.abs(tpPrice - entryPrice) / entryPrice) * 100 : 0;
  const rewardAmountIdr = positionSizeCoin * Math.abs(tpPrice - entryPrice);

  const riskRewardRatio = slDistancePercent > 0 ? tpDistancePercent / slDistancePercent : 0;

  return (
    <div className="quantum-card rounded-xl p-4 border border-[#30363D] flex flex-col h-full bg-[#161B22] select-none">
      <div className="flex items-center gap-2 mb-4 border-b border-[#30363D] pb-3 select-none">
        <Calculator className="h-5 w-5 text-[#58A6FF]" />
        <h2 className="font-bold text-base text-[#E6EDF3] tracking-wide font-sans">Kalkulator Sizing & Risiko</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Wallet Balance Input */}
        <div>
          <label className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wide mb-1 block font-sans">
            Saldo Akun Simulasi (IDR)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => onBalanceChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#58A6FF]"
          />
        </div>

        {/* Risk Percentage Input */}
        <div>
          <div className="flex justify-between text-[10px] text-[#8B949E] font-bold uppercase tracking-wide mb-1 font-sans">
            <span>Toleransi Risiko (%)</span>
            <span className="text-[#3FB950] font-mono">{riskPercent}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={riskPercent}
              onChange={(e) => onRiskChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#3FB950] h-1 bg-[#0D1117] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#30363D] my-1" />

        {/* Trade Parameter Inputs */}
        <div className="grid grid-cols-3 gap-2 font-sans">
          <div>
            <label className="text-[9px] text-[#8B949E] font-semibold uppercase mb-1 block">Entry (Rp)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#58A6FF]"
            />
          </div>
          <div>
            <label className="text-[9px] text-[#8B949E] font-semibold uppercase mb-1 block">Stop Loss (Rp)</label>
            <input
              type="number"
              value={slPrice}
              onChange={(e) => setSlPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#F85149]"
            />
          </div>
          <div>
            <label className="text-[9px] text-[#8B949E] font-semibold uppercase mb-1 block">Take Profit (Rp)</label>
            <input
              type="number"
              value={tpPrice}
              onChange={(e) => setTpPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#58A6FF]"
            />
          </div>
        </div>

        {/* Calculator Output Grid */}
        <div className="mt-2 bg-[#0D1117] border border-[#30363D] rounded-xl p-3 flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B949E] flex items-center gap-1.5 font-sans"><ShieldAlert className="h-3.5 w-3.5 text-[#F85149]" /> Risiko Maks (IDR)</span>
            <span className="font-bold text-[#F85149]">Rp {Math.round(riskAmountIdr).toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B949E] flex items-center gap-1.5 font-sans"><Award className="h-3.5 w-3.5 text-[#3FB950]" /> Target Reward</span>
            <span className="font-bold text-[#3FB950]">Rp {Math.round(rewardAmountIdr).toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8B949E] font-sans">Risk-to-Reward Ratio</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${riskRewardRatio >= 2 ? 'bg-[#3FB950]/10 text-[#3FB950]' : 'bg-[#D29922]/10 text-[#D29922]'}`}>
              1 : {riskRewardRatio.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-[#30363D] my-1" />

          {/* SIZING HIGHLIGHT */}
          <div className="flex flex-col gap-1.5 bg-[#161B22] border border-[#30363D]/60 rounded-lg p-2.5">
            <div className="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider font-sans">Ukuran Posisi Disarankan</div>
            <div className="text-sm font-bold text-[#3FB950]">
              Rp {Math.round(positionSizeIdr).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-[#8B949E]">
              ~ {positionSizeCoin.toFixed(5)} {symbol}
            </div>
            <div className="text-[9px] text-[#8B949E] font-sans">
              Alokasi: {balance > 0 ? ((positionSizeIdr / balance) * 100).toFixed(1) : 0}% dari saldo
            </div>
            <div className="text-[9px] text-[#58A6FF] mt-1 border-t border-[#30363D] pt-1 font-sans">
              💡 Tip: Sesuaikan toleransi risiko atau jarak SL Anda berdasarkan probabilitas keberhasilan b dari setup koin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
