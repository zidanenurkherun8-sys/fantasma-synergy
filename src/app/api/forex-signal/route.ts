import { NextRequest, NextResponse } from 'next/server';
import { forexOracle } from '@/lib/forex-oracle-engine';
import { ALL_FOREX_PAIRS } from '@/lib/forex-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pair, account_size = 10000, risk_pct = 0.75 } = body as {
      pair: string;
      account_size?: number;
      risk_pct?: number;
    };

    if (!pair) {
      return NextResponse.json({ error: 'Missing pair parameter. Example: { "pair": "EURUSD" }' }, { status: 400 });
    }

    const cleanPair = pair.toUpperCase().replace('/', '').replace('-', '');

    if (!ALL_FOREX_PAIRS.includes(cleanPair)) {
      return NextResponse.json(
        { error: `Unknown pair: ${cleanPair}. Use standard format e.g. EURUSD, GBPJPY, USDMXN.` },
        { status: 400 }
      );
    }

    const signal = await forexOracle.analyzePair(cleanPair, account_size, risk_pct);

    return NextResponse.json(signal);
  } catch (error: any) {
    console.error('Forex Signal API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error in Forex Signal engine' },
      { status: 500 }
    );
  }
}
