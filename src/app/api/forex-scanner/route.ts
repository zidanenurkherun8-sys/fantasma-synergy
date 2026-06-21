import { NextRequest, NextResponse } from 'next/server';
import { forexOracle } from '@/lib/forex-oracle-engine';
import { FOREX_MAJORS, FOREX_MINORS } from '@/lib/forex-client';

// Scan top pairs for high-probability setups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      pairs = [...FOREX_MAJORS, ...FOREX_MINORS.slice(0, 8)],
      account_size = 10000,
      risk_pct = 0.75,
    } = body as { pairs?: string[]; account_size?: number; risk_pct?: number };

    // Limit scan to 15 pairs to avoid timeout
    const scanPairs = pairs.slice(0, 15);

    const signals = await forexOracle.scanUniverse(scanPairs, account_size, risk_pct);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      scanned: scanPairs.length,
      qualified: signals.length,
      signals,
      message: signals.length === 0
        ? 'NO_CLEAR_SETUP — No pair in the scanned universe meets the 80%+ win probability threshold. Capital preservation recommended.'
        : `${signals.length} high-probability setup(s) identified.`,
    });
  } catch (error: any) {
    console.error('Forex Scanner API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error in Forex Scanner' },
      { status: 500 }
    );
  }
}

// GET: Quick universe status (all majors)
export async function GET() {
  try {
    const pairs = FOREX_MAJORS;
    const results = await Promise.allSettled(
      pairs.map(p => forexOracle.analyzePair(p, 10000, 0.75))
    );
    const signals = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => ({
        symbol: r.value.symbol,
        bias: r.value.bias,
        confidence: r.value.confidence,
        estimatedWinProbability: r.value.estimatedWinProbability,
        marketRegime: r.value.marketRegime,
        htfBias: r.value.htfBias,
        noSetup: r.value.estimatedWinProbability < 80,
      }));

    return NextResponse.json({ timestamp: new Date().toISOString(), pairs: signals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
