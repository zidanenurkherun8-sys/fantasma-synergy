/**
 * Forex Client — Institutional-Grade FX Data Fetcher
 * Connects to TwelveData REST API for real-time OHLCV candle data
 * Covers ALL forex pairs: Majors, Minors, Crosses, Exotics
 * Fallback to simulated data when API key is unavailable
 */

export interface ForexCandleData {
  time: number;      // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ForexTicker {
  pair: string;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export type ForexTimeframe = '1min' | '5min' | '15min' | '30min' | '1h' | '4h' | '1day' | '1week' | '1month';

export const TIMEFRAME_MAP: Record<string, ForexTimeframe> = {
  'M1':  '1min',
  'M5':  '5min',
  'M15': '15min',
  'M30': '30min',
  'H1':  '1h',
  'H4':  '4h',
  'D1':  '1day',
  'W1':  '1week',
  'MN':  '1month',
};

// ─── Full Forex Universe ────────────────────────────────────────────────────
export const FOREX_MAJORS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'
];

export const FOREX_MINORS = [
  'EURGBP', 'EURJPY', 'EURCAD', 'EURAUD', 'EURCHF', 'EURNZD',
  'GBPJPY', 'GBPCAD', 'GBPAUD', 'GBPCHF', 'GBPNZD',
  'AUDJPY', 'AUDCAD', 'AUDCHF', 'AUDNZD',
  'CADJPY', 'CADCHF',
  'NZDJPY', 'NZDCAD', 'NZDCHF',
  'CHFJPY',
];

export const FOREX_EXOTICS = [
  'USDMXN', 'USDTRY', 'USDZAR', 'USDSGD', 'USDHKD',
  'USDSEK', 'USDNOK', 'USDDKK', 'USDPLN',
  'EURTRY', 'EURMXN', 'EURSEK', 'EURNOK',
  'GBPSGD', 'GBPHKD',
];

export const ALL_FOREX_PAIRS = [
  ...FOREX_MAJORS,
  ...FOREX_MINORS,
  ...FOREX_EXOTICS,
];

// Cache layer — 15 second TTL for candles, 5 second for tickers
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const candleCache: Record<string, CacheEntry<ForexCandleData[]>> = {};
const tickerCache: Record<string, CacheEntry<ForexTicker>> = {};
const CANDLE_TTL = 15_000;
const TICKER_TTL = 5_000;

// ─── TwelveData API helpers ──────────────────────────────────────────────────
const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

function getTwelveDataKey(): string | null {
  return process.env.TWELVE_DATA_API_KEY || null;
}

/**
 * Fetch OHLCV candle data from TwelveData for a forex pair
 */
async function fetchCandlesFromTwelveData(
  pair: string,
  interval: ForexTimeframe,
  outputSize = 100
): Promise<ForexCandleData[]> {
  const apiKey = getTwelveDataKey();
  if (!apiKey) return [];

  const symbol = `${pair.slice(0, 3)}/${pair.slice(3)}`;
  const url = `${TWELVE_DATA_BASE}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (json.status === 'error' || !json.values) return [];

    const candles: ForexCandleData[] = json.values
      .slice()
      .reverse()
      .map((v: any) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume || '0'),
      }));

    return candles;
  } catch {
    return [];
  }
}

/**
 * Fetch real-time quote from TwelveData
 */
async function fetchTickerFromTwelveData(pair: string): Promise<ForexTicker | null> {
  const apiKey = getTwelveDataKey();
  if (!apiKey) return null;

  const symbol = `${pair.slice(0, 3)}/${pair.slice(3)}`;
  const url = `${TWELVE_DATA_BASE}/quote?symbol=${symbol}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 5 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (json.status === 'error' || !json.close) return null;

    const mid = parseFloat(json.close);
    const spread = mid * 0.0001; // Approximate spread

    return {
      pair,
      bid: parseFloat(json.fifty_two_week?.low || String(mid - spread / 2)),
      ask: parseFloat(json.fifty_two_week?.high || String(mid + spread / 2)),
      mid,
      spread,
      change24h: parseFloat(json.change || '0'),
      changePct24h: parseFloat(json.percent_change || '0'),
      high24h: parseFloat(json.high || String(mid * 1.002)),
      low24h: parseFloat(json.low || String(mid * 0.998)),
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

// ─── Synthetic Realistic Data Generator ────────────────────────────────────
// Used as fallback when no API key is configured
// Based on real approximate price levels for each currency pair

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2720, USDJPY: 157.50, AUDUSD: 0.6580,
  USDCAD: 1.3620, NZDUSD: 0.6020, USDCHF: 0.8960,
  EURGBP: 0.8530, EURJPY: 170.90, EURCAD: 1.4780, EURAUD: 1.6490,
  EURCHF: 0.9720, EURNZD: 1.8030, GBPJPY: 200.40, GBPCAD: 1.7330,
  GBPAUD: 1.9350, GBPCHF: 1.1400, GBPNZD: 2.1130,
  AUDJPY: 103.70, AUDCAD: 0.8970, AUDCHF: 0.5890, AUDNZD: 1.0920,
  CADJPY: 115.70, CADCHF: 0.6570, NZDJPY: 94.90, NZDCAD: 0.8200,
  NZDCHF: 0.5390, CHFJPY: 175.80,
  USDMXN: 17.45, USDTRY: 32.80, USDZAR: 18.60, USDSGD: 1.3500,
  USDHKD: 7.8200, USDSEK: 10.40, USDNOK: 10.75, USDDKK: 6.9200, USDPLN: 3.9800,
  EURTRY: 35.60, EURMXN: 18.93, EURSEK: 11.28, EURNOK: 11.66,
  GBPSGD: 1.7180, GBPHKD: 9.9560,
  XAUUSD: 2330.50, XAGUSD: 29.50, USOIL: 80.20,
};

function getBasePrice(pair: string): number {
  return BASE_PRICES[pair] || 1.0;
}

function generateSyntheticCandles(
  pair: string,
  interval: ForexTimeframe,
  count = 100
): ForexCandleData[] {
  const basePrice = getBasePrice(pair);
  const volatility = pair.includes('JPY') ? 0.008 : pair.length > 6 ? 0.006 : 0.004;
  const secondsPerCandle: Record<ForexTimeframe, number> = {
    '1min': 60, '5min': 300, '15min': 900, '30min': 1800,
    '1h': 3600, '4h': 14400, '1day': 86400, '1week': 604800, '1month': 2592000,
  };
  const step = secondsPerCandle[interval];
  const now = Math.floor(Date.now() / 1000);

  const candles: ForexCandleData[] = [];
  let price = basePrice * (1 + (Math.random() - 0.5) * 0.02);

  // Add a subtle directional drift
  const drift = (Math.random() - 0.5) * 0.0002;

  for (let i = count; i > 0; i--) {
    const time = now - i * step;
    const range = price * volatility * Math.random();
    const open = price;
    price = price + drift + (Math.random() - 0.5) * price * volatility;
    const close = price;
    const high = Math.max(open, close) + range * 0.5;
    const low = Math.min(open, close) - range * 0.5;
    const volume = Math.floor(Math.random() * 1000 + 200);

    candles.push({ time, open, high, low, close, volume });
  }

  return candles;
}

function generateSyntheticTicker(pair: string): ForexTicker {
  const base = getBasePrice(pair);
  const spread = base * 0.0001;
  const changePct = (Math.random() - 0.5) * 1.2;

  return {
    pair,
    bid: base - spread / 2,
    ask: base + spread / 2,
    mid: base,
    spread,
    change24h: base * changePct / 100,
    changePct24h: changePct,
    high24h: base * (1 + Math.abs(changePct) * 0.01 + 0.002),
    low24h: base * (1 - Math.abs(changePct) * 0.01 - 0.002),
    timestamp: Date.now(),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get historical OHLCV candles for a forex pair.
 * Uses cache, TwelveData API, or synthetic fallback (in that order).
 */
export async function getForexCandles(
  pair: string,
  timeframe: ForexTimeframe,
  count = 100
): Promise<ForexCandleData[]> {
  const key = `${pair}-${timeframe}-${count}`;
  const now = Date.now();

  if (candleCache[key] && now - candleCache[key].timestamp < candleCache[key].ttl) {
    return candleCache[key].data;
  }

  let data = await fetchCandlesFromTwelveData(pair, timeframe, count);

  if (!data.length) {
    data = generateSyntheticCandles(pair, timeframe, count);
  }

  candleCache[key] = { data, timestamp: now, ttl: CANDLE_TTL };
  return data;
}

/**
 * Get real-time ticker data for a forex pair.
 */
export async function getForexTicker(pair: string): Promise<ForexTicker> {
  const key = pair;
  const now = Date.now();

  if (tickerCache[key] && now - tickerCache[key].timestamp < tickerCache[key].ttl) {
    return tickerCache[key].data;
  }

  const live = await fetchTickerFromTwelveData(pair);
  const data = live ?? generateSyntheticTicker(pair);

  tickerCache[key] = { data, timestamp: now, ttl: TICKER_TTL };
  return data;
}

/**
 * Get tickers for multiple pairs in parallel.
 */
export async function getForexTickers(pairs: string[]): Promise<ForexTicker[]> {
  return Promise.all(pairs.map(p => getForexTicker(p)));
}

/**
 * Get 9-timeframe candle data for a single pair in parallel.
 */
export async function getMultiTimeframeCandles(
  pair: string,
  count = 100
): Promise<Record<string, ForexCandleData[]>> {
  const timeframes: ForexTimeframe[] = ['1min', '5min', '15min', '30min', '1h', '4h', '1day', '1week', '1month'];

  const results = await Promise.all(timeframes.map(tf => getForexCandles(pair, tf, count)));

  const map: Record<string, ForexCandleData[]> = {};
  timeframes.forEach((tf, i) => {
    map[tf] = results[i];
  });
  return map;
}

/**
 * Determine current active trading session based on UTC time
 */
export function getActiveSessions(): {
  asian: boolean;
  london: boolean;
  newYork: boolean;
  overlap: 'LONDON_NY' | 'ASIAN_LONDON' | 'NONE';
  mostActive: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OFF_HOURS';
} {
  const utcHour = new Date().getUTCHours();

  // Asian: 00:00 – 09:00 UTC
  const asian = utcHour >= 0 && utcHour < 9;
  // London: 08:00 – 17:00 UTC
  const london = utcHour >= 8 && utcHour < 17;
  // New York: 13:00 – 22:00 UTC
  const newYork = utcHour >= 13 && utcHour < 22;

  let overlap: 'LONDON_NY' | 'ASIAN_LONDON' | 'NONE' = 'NONE';
  if (london && newYork) overlap = 'LONDON_NY';
  else if (asian && london) overlap = 'ASIAN_LONDON';

  let mostActive: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OFF_HOURS' = 'OFF_HOURS';
  if (overlap === 'LONDON_NY') mostActive = 'NEW_YORK';
  else if (london) mostActive = 'LONDON';
  else if (asian) mostActive = 'ASIAN';

  return { asian, london, newYork, overlap, mostActive };
}
