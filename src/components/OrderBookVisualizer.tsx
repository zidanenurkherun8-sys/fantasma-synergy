'use client';

import React, { useState } from 'react';
import { DepthItem, TradeItem } from '@/lib/indodax';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Radio } from 'lucide-react';

interface OrderBookVisualizerProps {
  bids: DepthItem[];
  asks: DepthItem[];
  trades: TradeItem[];
  currentPrice: number;
}

export default function OrderBookVisualizer({ bids, asks, trades, currentPrice }: OrderBookVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'depth' | 'trades'>('depth');

  // Take top 15 depth layers for clean visual display
  const displayBids = bids.slice(0, 15);
  const displayAsks = asks.slice(0, 15);

  const highestBid = displayBids[0]?.price || 0;
  const lowestAsk = displayAsks[0]?.price || 0;
  
  const spread = lowestAsk > 0 && highestBid > 0 ? lowestAsk - highestBid : 0;
  const spreadPercent = lowestAsk > 0 ? (spread / lowestAsk) * 100 : 0;

  // Imbalance calculations
  const totalBidVolume = bids.reduce((acc, curr) => acc + (curr.amount * curr.price), 0);
  const totalAskVolume = asks.reduce((acc, curr) => acc + (curr.amount * curr.price), 0);
  const totalVolume = totalBidVolume + totalAskVolume;
  
  const bidsPercent = totalVolume > 0 ? (totalBidVolume / totalVolume) * 100 : 50;
  const asksPercent = totalVolume > 0 ? (totalAskVolume / totalVolume) * 100 : 50;

  // Maximum amounts in the display layer to normalize the bars
  const maxBidAmount = Math.max(...displayBids.map(b => b.amount), 1);
  const maxAskAmount = Math.max(...displayAsks.map(a => a.amount), 1);

  return (
    <div className="quantum-card rounded-xl p-4 border border-slate-800 flex flex-col h-[400px] bg-[#0d1324]/50">
      {/* TABS HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('depth')}
            className={`text-xs font-extrabold uppercase pb-1.5 transition border-b-2 ${
              activeTab === 'depth' 
                ? 'border-purple-500 text-purple-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`text-xs font-extrabold uppercase pb-1.5 transition border-b-2 flex items-center gap-1 ${
              activeTab === 'trades' 
                ? 'border-purple-500 text-purple-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Trades <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
          </button>
        </div>
        
        {activeTab === 'depth' && (
          <div className="text-right text-[10px] text-slate-500 font-mono">
            Spread: <span className="text-slate-300 font-bold">Rp {Math.round(spread).toLocaleString('id-ID')}</span> ({spreadPercent.toFixed(3)}%)
          </div>
        )}
      </div>

      {/* VIEW: ORDER BOOK DEPTH */}
      {activeTab === 'depth' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Buy vs Sell Volume Bar Indicator */}
          <div className="mb-3.5">
            <div className="flex justify-between text-[10px] mb-1 font-mono font-bold">
              <span className="text-emerald-400">BIDS: {bidsPercent.toFixed(1)}%</span>
              <span className="text-slate-500 uppercase tracking-widest font-sans text-[9px]">Depth Imbalance</span>
              <span className="text-rose-400">ASKS: {asksPercent.toFixed(1)}%</span>
            </div>
            <svg className="h-1.5 w-full rounded-full bg-slate-950 border border-slate-800/40" preserveAspectRatio="none" viewBox="0 0 100 100">
              <rect x="0" y="0" width={bidsPercent} height="100" className="fill-emerald-500 transition-all duration-500" />
              <rect x={bidsPercent} y="0" width={asksPercent} height="100" className="fill-rose-500 transition-all duration-500" />
            </svg>
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-2 gap-4 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">
            <div className="grid grid-cols-2">
              <span>Amount</span>
              <span className="text-right">Bid (IDR)</span>
            </div>
            <div className="grid grid-cols-2">
              <span>Ask (IDR)</span>
              <span className="text-right">Amount</span>
            </div>
          </div>

          {/* Main Depth Rows */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-4 text-[11px] font-mono scrollbar-thin">
            {/* BIDS SIDE (Buy Orders) */}
            <div className="flex flex-col gap-0.5 select-none">
              {displayBids.map((bid, i) => {
                const width = (bid.amount / maxBidAmount) * 100;
                return (
                  <div key={`bid-${i}`} className="grid grid-cols-2 relative py-0.5 group">
                    {/* Visual volume depth bar */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <rect 
                        x={100 - width} 
                        y="0" 
                        width={width} 
                        height="100" 
                        className="fill-emerald-500/5 transition-all duration-200" 
                      />
                    </svg>
                    <span className="text-slate-400 truncate">{bid.amount.toFixed(4)}</span>
                    <span className="text-right text-emerald-400 font-bold">
                      {Math.round(bid.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
              {displayBids.length === 0 && (
                <div className="text-slate-500 text-center py-8 text-xs italic">Loading bids...</div>
              )}
            </div>

            {/* ASKS SIDE (Sell Orders) */}
            <div className="flex flex-col gap-0.5 select-none">
              {displayAsks.map((ask, i) => {
                const width = (ask.amount / maxAskAmount) * 100;
                return (
                  <div key={`ask-${i}`} className="grid grid-cols-2 relative py-0.5 group">
                    {/* Visual volume depth bar */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <rect 
                        x="0" 
                        y="0" 
                        width={width} 
                        height="100" 
                        className="fill-rose-500/5 transition-all duration-200" 
                      />
                    </svg>
                    <span className="text-rose-400 font-bold">
                      {Math.round(ask.price).toLocaleString('id-ID')}
                    </span>
                    <span className="text-right text-slate-400 truncate">{ask.amount.toFixed(4)}</span>
                  </div>
                );
              })}
              {displayAsks.length === 0 && (
                <div className="text-slate-500 text-center py-8 text-xs italic">Loading asks...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LIVE TRADE TAPE */}
      {activeTab === 'trades' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2 pb-1 border-b border-slate-800/40">
            <span>Time</span>
            <span>Price (IDR)</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 font-mono text-[11px] space-y-1.5 scrollbar-thin">
            {trades.length === 0 ? (
              <div className="text-slate-500 text-center py-16 text-xs italic">Awaiting live market prints...</div>
            ) : (
              trades.slice(0, 35).map((t) => {
                const isBuy = t.type === 'buy';
                let timeStr = '00:00:00';
                try {
                  const date = new Date(parseInt(t.date) * 1000);
                  timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                } catch(e){}

                return (
                  <div key={t.tid} className="grid grid-cols-3 py-0.5 hover:bg-slate-900/30 transition-colors">
                    <span className="text-slate-500">{timeStr}</span>
                    <span className={`font-bold flex items-center gap-0.5 ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isBuy ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
                      {Math.round(parseFloat(t.price)).toLocaleString('id-ID')}
                    </span>
                    <span className="text-right text-slate-300">{parseFloat(t.amount).toFixed(4)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
