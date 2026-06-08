'use client';

import React, { useState } from 'react';
import { Search, Flame, TrendingUp } from 'lucide-react';

export interface MarketPair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volumeIdr: number;
}

interface MarketScannerProps {
  pairs: MarketPair[];
  selectedPairId: string;
  onSelectPair: (pairId: string) => void;
}

import TiltCard from './TiltCard';

export default function MarketScanner({ pairs, selectedPairId, onSelectPair }: MarketScannerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GAINERS' | 'VOLUME'>('ALL');

  // Filter pairs based on search and selected filter type
  const filteredPairs = pairs
    .filter(pair => {
      const matchSearch = 
        pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    })
    .filter(pair => {
      if (filterType === 'GAINERS') return pair.change24h > 0;
      if (filterType === 'VOLUME') return pair.volumeIdr > 1000000000; // Over 1 Billion IDR volume
      return true;
    });

  // Calculate top 3 opportunities based on volume, RSI thresholds, and 24h changes
  const topSetups = pairs
    .slice()
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 3);

  return (
    <TiltCard className="p-4 flex flex-col h-full bg-[#07090F] select-none">
      {/* Scanner Title */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#1E2333] pb-3">
        <Flame className="h-5 w-5 text-[#58A6FF]" />
        <h2 className="font-bold text-base text-[#E6EDF3] tracking-wide font-sans">Market Scanner</h2>
      </div>

      {/* Recommended Setups (Micro Signals) */}
      <div className="mb-4 bg-[#030407] border border-[#1E2333] rounded-lg p-2.5">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider flex items-center gap-1.5 mb-2 font-sans">
          <TrendingUp className="h-3 w-3 text-[#58A6FF]" /> Volatilitas Tinggi (Sinyal)
        </span>
        <div className="flex flex-col gap-1.5">
          {topSetups.map((setup, index) => (
            <div 
              key={`setup-${index}`} 
              onClick={() => onSelectPair(setup.id)}
              className="flex items-center justify-between text-xs cursor-pointer hover:bg-[#0C0E18] p-1 rounded transition select-none font-mono"
            >
              <span className="text-[#8B949E] font-medium font-sans">#{index + 1} {setup.symbol}/IDR</span>
              <span className={`font-semibold ${setup.change24h >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                {setup.change24h >= 0 ? '+' : ''}{setup.change24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#8B949E]" />
        <input
          type="text"
          placeholder="Cari koin (misal BTC, ETH)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#030407] border border-[#1E2333] text-[#E6EDF3] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#58A6FF] transition-colors font-sans"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 text-[10px] font-bold font-sans">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`flex-1 py-1 rounded transition-all cursor-pointer ${
            filterType === 'ALL' 
              ? 'bg-[#58A6FF] text-[#0D1117] font-bold' 
              : 'bg-[#030407] text-[#8B949E] border border-[#1E2333] hover:text-[#E6EDF3]'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setFilterType('GAINERS')}
          className={`flex-1 py-1 rounded transition-all cursor-pointer ${
            filterType === 'GAINERS' 
              ? 'bg-[#3FB950] text-[#0D1117] font-bold' 
              : 'bg-[#030407] text-[#8B949E] border border-[#1E2333] hover:text-[#E6EDF3]'
          }`}
        >
          Gainer
        </button>
        <button
          type="button"
          onClick={() => setFilterType('VOLUME')}
          className={`flex-1 py-1 rounded transition-all cursor-pointer ${
            filterType === 'VOLUME' 
              ? 'bg-[#58A6FF] text-[#0D1117] font-bold' 
              : 'bg-[#030407] text-[#8B949E] border border-[#1E2333] hover:text-[#E6EDF3]'
          }`}
        >
          Likuid
        </button>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 select-none">
        {filteredPairs.map((pair) => {
          const isSelected = pair.id === selectedPairId;
          const volIdrB = pair.volumeIdr / 1e9; // Billions
          return (
            <div
              key={pair.id}
              onClick={() => onSelectPair(pair.id)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                isSelected 
                  ? 'bg-[#0C0E18] border-[#58A6FF] shadow-sm' 
                  : 'bg-[#030407]/40 border-[#1E2333]/60 hover:bg-[#0C0E18]/30 hover:border-[#1E2333]'
              }`}
            >
              <div className="flex flex-col gap-0.5 font-sans">
                <span className="font-bold text-xs text-[#E6EDF3]">{pair.symbol}</span>
                <span className="text-[9px] text-[#8B949E] truncate max-w-[120px]">{pair.name}</span>
              </div>
              <div className="text-right flex flex-col gap-0.5 font-mono select-none">
                <span className="text-xs font-semibold text-[#E6EDF3]">
                  {pair.price >= 1000 
                    ? Math.round(pair.price).toLocaleString('id-ID') 
                    : pair.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-1.5 justify-end text-[9px]">
                  <span className="text-[#8B949E]">Vol: {volIdrB >= 1 ? `${volIdrB.toFixed(1)}M` : `${(pair.volumeIdr / 1e6).toFixed(0)}Jt`}</span>
                  <span className={`font-bold ${pair.change24h >= 0 ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                    {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredPairs.length === 0 && (
          <div className="text-[#8B949E] text-center py-12 text-xs italic font-sans">Coin tidak ditemukan</div>
        )}
      </div>
    </TiltCard>
  );
}
