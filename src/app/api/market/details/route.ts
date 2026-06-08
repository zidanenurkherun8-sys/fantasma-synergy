import { NextRequest, NextResponse } from 'next/server';
import { getMarketSummaries, getOrderBook, getRecentTrades, getHistoricalCandles } from '@/lib/indodax';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || 'btc_idr';
    const tfParam = searchParams.get('timeframe') || '60';
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
