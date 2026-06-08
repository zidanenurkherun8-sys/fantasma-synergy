import { NextRequest, NextResponse } from 'next/server';
import { OracleEngine } from '@/lib/oracle-engine';

const oracle = new OracleEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pair } = body;

    if (!pair) {
      return NextResponse.json({ error: 'Missing pair symbol parameter' }, { status: 400 });
    }

    const cleanPair = pair.toLowerCase();

    // Trigger full multi-timeframe quantitative Oracle analysis
    const signal = await oracle.analyzeFull(cleanPair);

    return NextResponse.json(signal);

  } catch (error: any) {
    console.error('API Error in /api/oracle endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during Oracle calculation' },
      { status: 500 }
    );
  }
}
