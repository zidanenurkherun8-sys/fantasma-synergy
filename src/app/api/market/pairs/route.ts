import { NextResponse } from 'next/server';
import { getMarketSummaries } from '@/lib/indodax';

export async function GET() {
  try {
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
          volumeCoin: parseFloat(ticker.vol_btc), // vol_btc is used generically for coin volume in the API response
          timestamp: ticker.server_time * 1000,
        };
      })
      // Sort by volume descending to surface top liquid pairs
      .sort((a, b) => b.volumeIdr - a.volumeIdr);

    return NextResponse.json({ pairs: idrPairs });
  } catch (error: any) {
    console.error('API Error in /api/market/pairs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
