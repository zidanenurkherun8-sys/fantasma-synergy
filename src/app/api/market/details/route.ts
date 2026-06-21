import { NextRequest, NextResponse } from 'next/server';
import { getMarketSummaries, getOrderBook, getRecentTrades, getHistoricalCandles } from '@/lib/indodax';
import { getForexTicker, getForexCandles } from '@/lib/forex-client';

const TIMEFRAME_MAP_FOREX: Record<string, string> = {
  '1': '1min',
  '5': '5min',
  '15': '15min',
  '30': '30min',
  '60': '1h',
  '240': '4h',
  '720': '4h',
  '1D': '1day',
  '1W': '1week',
  '1M': '1month',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || 'btc_idr';
    const tfParam = searchParams.get('timeframe') || '60';
    const mode = searchParams.get('mode') || 'CRYPTO';

    if (mode === 'FOREX') {
      const forexTf = TIMEFRAME_MAP_FOREX[tfParam] || '1h';
      const cleanPair = pair.toUpperCase().replace('/', '').replace('-', '');

      const [ticker, candles] = await Promise.all([
        getForexTicker(cleanPair),
        getForexCandles(cleanPair, forexTf as any, 1000),
      ]);

      const isJpy = cleanPair.includes('JPY');
      const isGoldOrOil = cleanPair.includes('XAU') || cleanPair.includes('USOIL') || cleanPair.includes('XAG');
      const step = isJpy ? 0.01 : isGoldOrOil ? 0.1 : 0.00005;
      const decimals = isJpy ? 3 : isGoldOrOil ? (cleanPair.includes('XAG') ? 3 : 2) : 5;

      const bids: any[] = [];
      const asks: any[] = [];

      for (let i = 0; i < 15; i++) {
        const offset = (i + 1) * step;
        const bidPrice = parseFloat((ticker.bid - offset).toFixed(decimals));
        const askPrice = parseFloat((ticker.ask + offset).toFixed(decimals));
        const bidAmount = parseFloat((Math.random() * 4500000 + 500000).toFixed(0));
        const askAmount = parseFloat((Math.random() * 4500000 + 500000).toFixed(0));

        bids.push({ price: bidPrice, amount: bidAmount });
        asks.push({ price: askPrice, amount: askAmount });
      }

      const trades: any[] = [];
      const now = Math.floor(Date.now() / 1000);
      for (let i = 0; i < 20; i++) {
        const tradeTime = now - i * Math.floor(Math.random() * 4 + 1);
        const isBuy = Math.random() > 0.5;
        const offset = (Math.random() - 0.5) * (isJpy ? 0.02 : isGoldOrOil ? 0.5 : 0.0001);
        const tradePrice = parseFloat((ticker.mid + offset).toFixed(decimals));
        const tradeAmount = parseFloat((Math.random() * 2000000 + 100000).toFixed(0));

        trades.push({
          tid: `fx-${tradeTime}-${i}`,
          type: isBuy ? 'buy' : 'sell',
          price: String(tradePrice),
          amount: String(tradeAmount),
          date: String(tradeTime),
        });
      }

      return NextResponse.json({
        pair: cleanPair,
        ticker: {
          buy: ticker.bid,
          sell: ticker.ask,
          high: ticker.high24h,
          low: ticker.low24h,
          last: ticker.mid,
          name: `${cleanPair.slice(0, 3)} / ${cleanPair.slice(3)}`,
          volumeIdr: ticker.spread * 100000,
          volumeCoin: 100000,
          change24h: ticker.changePct24h,
        },
        depth: { bids, asks },
        trades,
        candles,
      });
    }

    // Default: CRYPTO mode
    const allowedTimeframes = ['1', '5', '15', '30', '60', '240', '720', '1D', '1W', '1M'];
    const timeframe = (allowedTimeframes.includes(tfParam) ? tfParam : '60') as '1' | '5' | '15' | '30' | '60' | '240' | '720' | '1D' | '1W' | '1M';
    const cleanPair = pair.toLowerCase();

    // Run fetches in parallel for high performance
    const [summaries, depth, trades, candles] = await Promise.all([
      getMarketSummaries(),
      getOrderBook(cleanPair),
      getRecentTrades(cleanPair),
      getHistoricalCandles(cleanPair, timeframe, 1000),
    ]);

    const tickerInfo = summaries.tickers[cleanPair];
    if (!tickerInfo) {
      return NextResponse.json({ error: `Pair '${pair}' not found on Indodax` }, { status: 404 });
    }

    const price24h = parseFloat(summaries.prices_24h[cleanPair.replace('_', '')]?.toString() || tickerInfo.last);
    const currentPrice = parseFloat(tickerInfo.last);
    const change24h = price24h > 0 ? ((currentPrice - price24h) / price24h) * 100 : 0;

    return NextResponse.json({
      pair: cleanPair.toUpperCase(),
      ticker: {
        buy: parseFloat(tickerInfo.buy),
        sell: parseFloat(tickerInfo.sell),
        high: parseFloat(tickerInfo.high),
        low: parseFloat(tickerInfo.low),
        last: currentPrice,
        name: tickerInfo.name || pair.split('_')[0].toUpperCase(),
        volumeIdr: parseFloat(tickerInfo.vol_idr),
        volumeCoin: parseFloat(tickerInfo.vol_btc),
        change24h,
      },
      depth,
      trades,
      candles,
    });
  } catch (error: any) {
    console.error('API Error in /api/market/details:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

