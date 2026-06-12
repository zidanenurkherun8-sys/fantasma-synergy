'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Flame, TrendingUp } from 'lucide-react';
import { audio } from '@/lib/audio';

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



export default function MarketScanner({ pairs, selectedPairId, onSelectPair }: MarketScannerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GAINERS' | 'VOLUME'>('ALL');
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Holographic 3D Polar Radar Scanner Loop
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;

    const radarNodes: Array<{
      symbol: string;
      radius: number;
      angle: number;
      glowFactor: number;
      change24h: number;
    }> = [];

    const updateNodes = () => {
      radarNodes.length = 0;
      // Plot the top 5 pairs by volume/volatility on polar space
      const activePairs = pairs.slice(0, 5);
      activePairs.forEach((p, idx) => {
        const maxChange = 10;
        const absChange = Math.abs(p.change24h);
        const radius = Math.min(0.85, 0.2 + (absChange / maxChange) * 0.6);
        
        const baseAngle = (idx * 2 * Math.PI) / 5;
        const angleOffset = (p.change24h / 10) * (Math.PI / 4);
        
        radarNodes.push({
          symbol: p.symbol,
          radius,
          angle: baseAngle + angleOffset,
          glowFactor: 0,
          change24h: p.change24h
        });
      });
    };

    updateNodes();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    });
    // Initial size check
    const initialRect = canvas.getBoundingClientRect();
    if (initialRect.width > 0 && initialRect.height > 0) {
      canvas.width = initialRect.width;
      canvas.height = initialRect.height;
    }
    resizeObserver.observe(canvas.parentElement || canvas);

    const drawRadar = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(drawRadar);
        return;
      }

      const cX = width / 2;
      const cY = height / 2;
      const maxR = Math.min(width, height) * 0.45;
      if (maxR <= 0) {
        animId = requestAnimationFrame(drawRadar);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      sweepAngle = (sweepAngle + 0.015) % (2 * Math.PI);

      // Draw polar concentric background grids
      ctx.strokeStyle = 'rgba(30, 35, 51, 0.35)';
      ctx.lineWidth = 1;
      [0.3, 0.6, 0.9].forEach(rFactor => {
        ctx.beginPath();
        ctx.arc(cX, cY, maxR * rFactor, 0, 2 * Math.PI);
        ctx.stroke();
      });

      // Draw polar crosshairs lines
      ctx.beginPath();
      ctx.moveTo(cX - maxR * 0.95, cY);
      ctx.lineTo(cX + maxR * 0.95, cY);
      ctx.moveTo(cX, cY - maxR * 0.95);
      ctx.lineTo(cX, cY + maxR * 0.95);
      ctx.stroke();

      // Faint intermediate angle divisions
      ctx.strokeStyle = 'rgba(30, 35, 51, 0.15)';
      [Math.PI / 6, Math.PI / 3, 2 * Math.PI / 3, 5 * Math.PI / 6].forEach(ang => {
        ctx.beginPath();
        ctx.moveTo(cX - Math.cos(ang) * maxR * 0.9, cY - Math.sin(ang) * maxR * 0.9);
        ctx.lineTo(cX + Math.cos(ang) * maxR * 0.9, cY + Math.sin(ang) * maxR * 0.9);
        ctx.stroke();
      });

      // Draw sweep gradient wedge
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cX, cY, 0, cX, cY, maxR);
      sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
      sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');
      
      ctx.beginPath();
      ctx.moveTo(cX, cY);
      ctx.arc(cX, cY, maxR * 0.95, sweepAngle, sweepAngle - 0.5, true);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Draw sweeping search line
      ctx.beginPath();
      ctx.moveTo(cX, cY);
      ctx.lineTo(cX + Math.cos(sweepAngle) * maxR * 0.95, cY + Math.sin(sweepAngle) * maxR * 0.95);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Plot the scanned assets as beacons
      radarNodes.forEach(node => {
        let diff = sweepAngle - node.angle;
        while (diff < 0) diff += 2 * Math.PI;
        while (diff > 2 * Math.PI) diff -= 2 * Math.PI;

        if (diff < 0.1) {
          node.glowFactor = 1.0;
        } else {
          node.glowFactor = Math.max(0.0, node.glowFactor - 0.012);
        }

        const nx = cX + Math.cos(node.angle) * node.radius * maxR;
        const ny = cY + Math.sin(node.angle) * node.radius * maxR;

        // Beacon dot
        ctx.beginPath();
        ctx.arc(nx, ny, 2.0 + node.glowFactor * 2.0, 0, 2 * Math.PI);
        const nodeColor = node.change24h >= 0 ? 'rgba(63, 185, 80, ' : 'rgba(248, 81, 73, ';
        ctx.fillStyle = `${nodeColor}${0.45 + node.glowFactor * 0.55})`;
        ctx.fill();

        // Secondary concentric ping ring
        if (node.glowFactor > 0.1) {
          ctx.beginPath();
          ctx.arc(nx, ny, (1 - node.glowFactor) * 12 + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = `${nodeColor}${node.glowFactor * 0.45})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        // Faint neon label
        ctx.fillStyle = `rgba(230, 237, 243, ${0.45 + node.glowFactor * 0.55})`;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.symbol, nx, ny - 5);
      });

      animId = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [pairs]);

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
    <div className="quantum-card p-4 flex flex-col h-full bg-[#07090F] select-none">
      {/* Scanner Title */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#1E2333] pb-3">
        <Flame className="h-5 w-5 text-[#58A6FF]" />
        <h2 className="font-bold text-base text-[#E6EDF3] tracking-wide font-sans">Market Scanner</h2>
      </div>

      {/* 3D Polar Radar Scanner */}
      <div className="mb-4 bg-[#030407] border border-[#1E2333] rounded-[3px] overflow-hidden relative p-1.5 h-[110px] flex items-center justify-center">
        <canvas ref={radarCanvasRef} className="w-full h-full" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="h-1.5 w-1.5 rounded-full bg-[#58A6FF] animate-pulse" />
          <span className="text-[8px] font-mono text-[#58A6FF] uppercase tracking-widest font-bold">Radar Active</span>
        </div>
      </div>

      {/* Recommended Setups (Micro Signals) */}
      <div className="mb-4 bg-[#030407] border border-[#1E2333] rounded-[3px] p-2.5">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider flex items-center gap-1.5 mb-2 font-sans">
          <TrendingUp className="h-3 w-3 text-[#58A6FF]" /> Volatilitas Tinggi (Sinyal)
        </span>
        <div className="flex flex-col gap-1.5">
          {topSetups.map((setup, index) => (
            <div 
              key={`setup-${index}`} 
              onClick={() => {
                audio?.playClick();
                onSelectPair(setup.id);
              }}
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
          className="w-full bg-[#030407] border border-[#1E2333] text-[#E6EDF3] rounded-[3px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#58A6FF] transition-colors font-sans"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 text-[10px] font-bold font-sans">
        <button
          type="button"
          onClick={() => {
            audio?.playClick();
            setFilterType('ALL');
          }}
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
          onClick={() => {
            audio?.playClick();
            setFilterType('GAINERS');
          }}
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
          onClick={() => {
            audio?.playClick();
            setFilterType('VOLUME');
          }}
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
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 select-none scroll-smooth [will-change:transform] [-webkit-overflow-scrolling:touch]">
        {filteredPairs.map((pair) => {
          const isSelected = pair.id === selectedPairId;
          const volIdrB = pair.volumeIdr / 1e9; // Billions
          return (
            <div
              key={pair.id}
              onClick={() => {
                audio?.playClick();
                onSelectPair(pair.id);
              }}
              className={`flex items-center justify-between p-2 rounded-[3px] cursor-pointer transition-all border ${
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
    </div>
  );
}
