'use client';

import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  IChartApi, 
  ColorType, 
  LineStyle, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries 
} from 'lightweight-charts';
import { CandleData } from '@/lib/indodax';
import { Info } from 'lucide-react';

interface TradingChartProps {
  candles: CandleData[];
  timeframe: string;
  tickerName: string;
  currentPrice?: number;
}

export default function TradingChart({ candles, timeframe, tickerName, currentPrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const ema8SeriesRef = useRef<any>(null);
  const ema21SeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const hasFitContentRef = useRef<string | null>(null);

  // Initialize the chart once on mount or when ticker/timeframe changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up any pre-existing elements inside the ref container to prevent double rendering
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1C2333' },
        textColor: '#8B949E',
        fontSize: 11,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(33, 38, 45, 0.5)', style: LineStyle.Dashed },
        horzLines: { color: 'rgba(33, 38, 45, 0.5)', style: LineStyle.Dashed },
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#8B949E',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#161B22',
        },
        horzLine: {
          color: '#8B949E',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#161B22',
        },
      },
      rightPriceScale: {
        borderColor: '#30363D',
        autoScale: true,
      },
      timeScale: {
        borderColor: '#30363D',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any, tickMarkType: any, locale: string) => {
          const timestamp = typeof time === 'number' ? time : (time as any).timestamp || 0;
          if (!timestamp) return '';
          const date = new Date(timestamp * 1000);
          
          if (tickMarkType >= 3) {
            // Intraday (hour:minute)
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          }
          
          // Daily, weekly or monthly (day/month/year)
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          return `${day}/${month}/${year}`;
        }
      },
      localization: {
        timeFormatter: (time: any) => {
          const timestamp = typeof time === 'number' ? time : (time as any).timestamp || 0;
          if (!timestamp) return '';
          const date = new Date(timestamp * 1000);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${hours}.${minutes}.${seconds} WIB`;
        }
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    chartRef.current = chart;

    // Standard Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#3FB950',
      downColor: '#F85149',
      borderUpColor: '#3FB950',
      borderDownColor: '#F85149',
      wickUpColor: '#3FB950',
      wickDownColor: '#F85149',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // EMA 8 (Short term)
    const ema8Series = chart.addSeries(LineSeries, {
      color: '#58A6FF', // Accent Blue
      lineWidth: 2,
      title: 'EMA 8',
    });
    ema8SeriesRef.current = ema8Series;

    // EMA 21 (Medium term)
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#D29922', // Accent Yellow
      lineWidth: 2,
      title: 'EMA 21',
    });
    ema21SeriesRef.current = ema21Series;

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(63, 185, 80, 0.3)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume', // Set on custom volume scale
    });
    volumeSeriesRef.current = volumeSeries;

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8, // Push volume bars to bottom 20% of the chart height
        bottom: 0,
      },
    });

    // Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      ema8SeriesRef.current = null;
      ema21SeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [timeframe, tickerName]);

  // Feed and update the data dynamically on candles updates
  useEffect(() => {
    if (!candles || candles.length === 0) return;
    if (!candlestickSeriesRef.current || !chartRef.current) return;

    // Format, map and sort candle data, strictly de-duplicating by timestamp
    const formattedData: any[] = [];
    const seenTimes = new Set<number>();
    
    // Sort candles by pure raw UTC seconds without manual localOffset additions
    const sortedCandles = [...candles]
      .map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }))
      .sort((a, b) => a.time - b.time);

    for (const c of sortedCandles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        formattedData.push({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        });
      }
    }

    if (formattedData.length === 0) return;

    // Real-Time Clock-Based Candle Appending Engine!
    const getTimeframeSeconds = (tf: string): number => {
      const map: Record<string, number> = {
        '1': 60,
        '5': 5 * 60,
        '15': 15 * 60,
        '30': 30 * 60,
        '60': 3600,
        '240': 4 * 3600,
        '720': 12 * 3600,
        '1D': 24 * 3600,
        '1W': 7 * 24 * 3600,
        '1M': 30 * 24 * 3600,
      };
      return map[tf] || 3600;
    };

    const tfSeconds = getTimeframeSeconds(timeframe);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const currentCandleTime = Math.floor(nowSeconds / tfSeconds) * tfSeconds;

    let appendedNewCandle = false;

    if (currentPrice && currentPrice > 0) {
      const lastServerCandle = formattedData[formattedData.length - 1];
      const lastServerCandleTime = lastServerCandle.time;

      if (currentCandleTime > lastServerCandleTime) {
        // Appending a brand new ticking candle block!
        formattedData.push({
          time: currentCandleTime,
          open: lastServerCandle.close,
          high: Math.max(lastServerCandle.close, currentPrice),
          low: Math.min(lastServerCandle.close, currentPrice),
          close: currentPrice,
        });
        appendedNewCandle = true;
      } else {
        // Update the last candle in place
        const lastIndex = formattedData.length - 1;
        formattedData[lastIndex] = {
          ...formattedData[lastIndex],
          close: currentPrice,
          high: Math.max(formattedData[lastIndex].high, currentPrice),
          low: Math.min(formattedData[lastIndex].low, currentPrice),
        };
      }
    }

    // Set Candlestick data
    candlestickSeriesRef.current.setData(formattedData);

    // Set EMA 8 data
    if (ema8SeriesRef.current) {
      const ema8Data = calculateEmaForSeries(formattedData, 8);
      ema8SeriesRef.current.setData(ema8Data);
    }

    // Set EMA 21 data
    if (ema21SeriesRef.current) {
      const ema21Data = calculateEmaForSeries(formattedData, 21);
      ema21SeriesRef.current.setData(ema21Data);
    }

    // Set Volume data
    if (volumeSeriesRef.current) {
      const volumeData = sortedCandles
        .filter(c => seenTimes.has(c.time))
        .map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(63, 185, 80, 0.3)' : 'rgba(248, 81, 73, 0.3)',
        }));
      
      const uniqueVolumeData: any[] = [];
      const seenVolTimes = new Set<number>();
      for (const v of volumeData) {
        if (!seenVolTimes.has(v.time)) {
          seenVolTimes.add(v.time);
          uniqueVolumeData.push(v);
        }
      }

      // Keep Volume aligned with the appended candle if a new one was added
      if (appendedNewCandle && currentPrice && currentPrice > 0) {
        const lastServerCandle = sortedCandles[sortedCandles.length - 1];
        uniqueVolumeData.push({
          time: currentCandleTime,
          value: 0,
          color: currentPrice >= lastServerCandle.close ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
        });
      }

      volumeSeriesRef.current.setData(uniqueVolumeData);
    }

    // Initially fit content once when first data is populated for this ticker/timeframe
    const fitKey = `${tickerName}-${timeframe}`;
    if (hasFitContentRef.current !== fitKey) {
      chartRef.current.timeScale().fitContent();
      hasFitContentRef.current = fitKey;
    }

  }, [candles, currentPrice, timeframe, tickerName]);

  // Exponential Moving Average helper on time series
  function calculateEmaForSeries(data: any[], period: number) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray: any[] = [];
    
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    let prevEma = sum / period;
    emaArray.push({ time: data[period - 1].time, value: prevEma });

    for (let i = period; i < data.length; i++) {
      const currentEma = data[i].close * k + prevEma * (1 - k);
      emaArray.push({ time: data[i].time, value: currentEma });
      prevEma = currentEma;
    }
    return emaArray;
  }

  const formatTimeframe = (tf: string) => {
    const map: Record<string, string> = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1H',
      '240': '4H',
      '720': '12H',
      '1D': 'Daily',
      '1W': 'Weekly',
      '1M': 'Monthly',
    };
    return map[tf] || tf;
  };

  return (
    <div className="quantum-card rounded-[3px] p-4 border border-slate-800 bg-[#0d1324]/50">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
          <span className="font-bold text-sm tracking-wide text-slate-100">{tickerName} Historical</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">
            {formatTimeframe(timeframe)} Timeframe
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> EMA 8</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> EMA 21</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500/30" /> Vol</span>
          <div className="group relative flex items-center gap-1 cursor-help text-[10px] text-slate-500 font-mono">
            <Info className="h-3 w-3" /> Indicator Info
            <div className="pointer-events-none absolute right-0 top-6 w-56 rounded-[3px] bg-slate-900 border border-slate-800 p-2.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-40 text-[10px] text-slate-400 font-sans leading-normal">
              <strong className="text-slate-200 block mb-1">EMA Lookback Notice</strong>
              EMA 8 dan EMA 21 membutuhkan waktu lookback (8 & 21 candle pertama) agar dapat mulai di-plot secara matematis di chart.
            </div>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full relative bg-[#070a13] rounded-[3px]" style={{ height: '400px' }} />
    </div>
  );
}
