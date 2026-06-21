import { NextRequest, NextResponse } from 'next/server';
import { getMarketSummaries } from '@/lib/indodax';
import { getForexTicker } from '@/lib/forex-client';

const FOREX_DISPLAY_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CHFJPY', 'CADJPY', 'GBPAUD', 'EURCAD'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'CRYPTO';

    if (mode === 'FOREX') {
      const results = await Promise.allSettled(
        FOREX_DISPLAY_PAIRS.map(pair => getForexTicker(pair))
      );

      const forexPairs = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => {
          const ticker = r.value;
          return {
            id: ticker.pair,
            symbol: ticker.pair,
            name: `${ticker.pair.slice(0, 3)} / ${ticker.pair.slice(3)}`,
            price: ticker.mid,
            high: ticker.high24h,
            low: ticker.low24h,
            buy: ticker.bid,
            sell: ticker.ask,
            change24h: ticker.changePct24h,
            volumeIdr: Math.round(ticker.spread * 1000000), // Map spread as a mock volume indicator
            volumeCoin: 100000,
            timestamp: ticker.timestamp,
          };
        });

      return NextResponse.json({ pairs: forexPairs });
    }

    // Default: CRYPTO mode
    const data = await getMarketSummaries();
    if (!data || !data.tickers) {
      return NextResponse.json({ error: 'Failed to fetch summaries from Indodax' }, { status: 502 });
    }

    const idrPairs = Object.entries(data.tickers)
      .filter(([key]) => key.endsWith('_idr'))
      .map(([key, ticker]) => {
        const symbol = key.replace('_idr', '').toUpperCase();
        const cleanKey = key.replace('_', '');
        const price24h = parseFloat(data.prices_24h[cleanKey]?.toString() || ticker.last);
        const currentPrice = parseFloat(ticker.last);
        const changePercent = price24h > 0 
          ? ((currentPrice - price24h) / price24h) * 100 
          : 0;

        return {
          id: key,
          symbol,
          name: ticker.name || symbol,
          price: currentPrice,
          high: parseFloat(ticker.high),
          low: parseFloat(ticker.low),
          buy: parseFloat(ticker.buy),
          sell: parseFloat(ticker.sell),
          change24h: changePercent,
          volumeIdr: parseFloat(ticker.vol_idr),
          volumeCoin: parseFloat(ticker.vol_btc),
          timestamp: ticker.server_time * 1000,
        };
      })
      .sort((a, b) => b.volumeIdr - a.volumeIdr);

    return NextResponse.json({ pairs: idrPairs });
  } catch (error: any) {
    console.error('API Error in /api/market/pairs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

