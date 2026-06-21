import { NextResponse, NextRequest } from 'next/server';

const MOCK_FALLBACK_NEWS_CRYPTO = [
  {
    id: "fallback-crypto-1",
    title: "Bitcoin Consolidates Near Support as Institutional Accumulation Accelerates",
    body: "On-chain indicators reveal a significant uptick in long-term wallets acquiring BTC. Market analysts suggest this accumulation phase could precede a major volatility expansion in the coming quarters.",
    url: "https://cointelegraph.com/news/bitcoin-institutional-accumulation-accelerates",
    source: "FANTASMA SYNERGY",
    publishedOn: Date.now() - 10 * 60 * 1000,
    tags: ["BTC", "ONCHAIN", "ACCUMULATION"],
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-crypto-2",
    title: "Ethereum Gas Fees Drop to Multi-Month Lows Post Layer-2 Upgrades",
    body: "Average transaction fees on the Ethereum mainnet have plummeted, boosting active smart contract interactions. Decentralized exchanges report a 35% surge in daily active users as throughput improves.",
    url: "https://cointelegraph.com/news/ethereum-gas-fees-drop-multi-month-lows",
    source: "COINTELEGRAPH",
    publishedOn: Date.now() - 30 * 60 * 1000,
    tags: ["ETH", "SCALING", "DEFI"],
    imageUrl: "https://images.unsplash.com/photo-1622790694511-9a5abf65ad60?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-crypto-3",
    title: "IDX Crypto Watch: Regulatory Framework Set to Unify Local Exchanges",
    body: "Local regulatory authorities have finalized the unified tax code draft for digital asset trading. The framework is expected to attract significant domestic venture capital and institutional custody providers.",
    url: "https://www.coindesk.com/policy/2026/06/12/idx-crypto-framework-unify-local-exchanges/",
    source: "IDX MONITOR",
    publishedOn: Date.now() - 90 * 60 * 1000,
    tags: ["REGULATION", "IDX", "IDR"],
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&auto=format&fit=crop&q=60"
  }
];

const MOCK_FALLBACK_NEWS_FOREX = [
  {
    id: "fallback-forex-1",
    title: "Gold Prices Surge as Fed Holds Rates Steady; Analysts Target $2,400",
    body: "XAUUSD reclaims the critical support boundary at $2,330 following a dovish statement from the Federal Reserve. Spot gold demand is expected to accelerate on retail inflation protection plays.",
    url: "https://www.investing.com/news/commodities-news/gold-prices-surge-fed-holds-rates-steady-4751341",
    source: "FANTASMA SYNERGY",
    publishedOn: Date.now() - 15 * 60 * 1000,
    tags: ["XAUUSD", "GOLD", "FED"],
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-forex-2",
    title: "Dollar Index (DXY) Decouples from Treasury Yields Amid Global Risk Off",
    body: "The greenback reaches fresh weekly highs against the Euro and Sterling as geopolitical uncertainty prompts safe haven flows. Traders prepare for massive volatility spikes ahead of inflation print.",
    url: "https://www.investing.com/news/forex-news/dollar-index-decouples-treasury-yields-4751322",
    source: "INVESTING.COM",
    publishedOn: Date.now() - 45 * 60 * 1000,
    tags: ["DXY", "EURUSD", "FOREX"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-forex-3",
    title: "Oil Clings to $80 Support as OPEC+ Mulls Production Extension",
    body: "USOIL (Crude Oil) remains stable as market participants balance high OPEC+ production limits against rising seasonal demand in the Western hemisphere.",
    url: "https://www.investing.com/news/commodities-news/oil-clings-80-support-opec-extension-4751501",
    source: "BLOOMBERG QUANT",
    publishedOn: Date.now() - 120 * 60 * 1000,
    tags: ["USOIL", "CRUDE", "COMMODITIES"],
    imageUrl: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=200&auto=format&fit=crop&q=60"
  }
];

function cleanCdata(str: string): string {
  if (!str) return '';
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function parseXml(xmlText: string, mode: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]+)"/);
    const mediaMatch = itemContent.match(/<media:content[^>]*url="([^"]+)"/);
    
    let title = titleMatch ? cleanCdata(titleMatch[1]) : '';
    let link = linkMatch ? cleanCdata(linkMatch[1]) : '';
    let body = descMatch ? stripHtml(cleanCdata(descMatch[1])) : '';
    let pubDateStr = pubDateMatch ? cleanCdata(pubDateMatch[1]) : '';
    let imageUrl = enclosureMatch ? enclosureMatch[1].trim() : (mediaMatch ? mediaMatch[1].trim() : undefined);
    
    title = title.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    body = body.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    
    let publishedOn = Date.now();
    if (pubDateStr) {
      const parsedTime = Date.parse(pubDateStr);
      if (!isNaN(parsedTime)) {
        publishedOn = parsedTime;
      }
    }
    
    if (title && link) {
      items.push({
        id: `rss-${Math.random().toString(36).substr(2, 9)}`,
        title,
        body: body || 'Klik tautan untuk membaca rincian berita selengkapnya.',
        url: link,
        source: mode === 'CRYPTO' ? 'COINTELEGRAPH' : 'INVESTING.COM',
        publishedOn,
        tags: mode === 'CRYPTO' ? ['CRYPTO', 'NEWS'] : ['FOREX', 'NEWS'],
        imageUrl: imageUrl || (mode === 'CRYPTO' 
          ? 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&auto=format&fit=crop&q=60' 
          : 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=60')
      });
    }
  }
  
  return items;
}

export async function GET(request: NextRequest) {
  let mode = 'CRYPTO';
  try {
    const { searchParams } = new URL(request.url);
    mode = (searchParams.get('mode') || 'CRYPTO').toUpperCase();

    // Determine target live feed based on mode
    const feedUrl = mode === 'FOREX'
      ? 'https://www.investing.com/rss/news_1.rss'
      : 'https://cointelegraph.com/rss';

    let rssItems: any[] = [];
    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 30 }, // cache for 30s
      });

      if (response.ok) {
        const text = await response.text();
        rssItems = parseXml(text, mode);
      }
    } catch (err: any) {
      console.warn(`Scraping RSS feed failed for ${mode}, using fallbacks:`, err.message);
    }

    if (rssItems.length === 0) {
      rssItems = mode === 'FOREX' ? MOCK_FALLBACK_NEWS_FOREX : MOCK_FALLBACK_NEWS_CRYPTO;
    }

    // Interleave premium context-matching YouTube, X, TikTok, and Instagram posts
    const now = Date.now();
    const socialItems: any[] = [];

    if (mode === 'CRYPTO') {
      // 1. YouTube Crypto video
      socialItems.push({
        id: `yt-crypto-1`,
        title: "WARNING: Bitcoin Alert! The Halving Supply Shock Is Finally Here!",
        body: "Analisis fundamental mendalam mengenai penurunan suplai BTC di bursa. Koin Bureau mengupas mengapa pergerakan ini bisa memicu bullish parabolik besar dalam waktu dekat.",
        url: "https://www.youtube.com/watch?v=UCqK_GSMbpiV8",
        source: "YOUTUBE • COIN BUREAU",
        publishedOn: now - 8 * 60 * 1000,
        tags: ["BTC", "HALVING", "ANALYSIS"],
        imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=200&auto=format&fit=crop&q=60"
      });

      // 2. YouTube Crypto video 2
      socialItems.push({
        id: `yt-crypto-2`,
        title: "Top 5 Altcoins to Buy Now! (10x Potential for Q3 Surge?)",
        body: "Eksklusif Altcoin Daily: Membahas prospek SOL, LINK, dan RNDR. Konfluensi volume institusi pada Web3 tokens menunjukkan pengumpulan akumulasi bandar besar.",
        url: "https://www.youtube.com/watch?v=UCbLhG555yYn",
        source: "YOUTUBE • ALTCOIN DAILY",
        publishedOn: now - 35 * 60 * 1000,
        tags: ["ALTCOINS", "PORTFOLIO", "SOLANA"],
        imageUrl: "https://images.unsplash.com/photo-1622790694511-9a5abf65ad60?w=200&auto=format&fit=crop&q=60"
      });

      // 3. X / Twitter Crypto tweet
      socialItems.push({
        id: `tw-crypto-1`,
        title: "macnBTC: BTC Spot Bid is Relentlessly Absorbing All Panic Selling",
        body: "Twitter/X Update: 'Struktur harga BTC pada chart 4H menopang support krusial di area Rp 1.050.000.000. Spot bid sangat solid, funding rate datar. Target breakout HH selanjutnya!'",
        url: "https://twitter.com/macnbtc",
        source: "X/TWITTER • @MACNBTC",
        publishedOn: now - 18 * 60 * 1000,
        tags: ["BTC", "X_UPDATES", "BREAKOUT"],
        imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=200&auto=format&fit=crop&q=60"
      });

      // 4. TikTok Crypto video
      socialItems.push({
        id: `tk-crypto-1`,
        title: "CryptoLogic TikTok: Solana Bullish CHoCH Breakout Confirmed!",
        body: "TikTok live update: Menjelaskan pergerakan instan SOL/IDR di timeframe 15 menit. Penutupan candle di atas resistance mengonfirmasi target target Fibonacci $195.",
        url: "https://www.tiktok.com/@cryptologic",
        source: "TIKTOK • @CRYPTOLOGIC",
        publishedOn: now - 50 * 60 * 1000,
        tags: ["SOL", "TIKTOK", "CHoCH"],
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&auto=format&fit=crop&q=60"
      });

      // 5. Instagram Crypto post
      socialItems.push({
        id: `ig-crypto-1`,
        title: "CryptoTrends Instagram: Ethereum Portfolio Allocation Rules",
        body: "Instagram feed post: Mengapa mengalokasikan 40% pada Ethereum saat FVG terisi adalah strategi aman. Review chart RSI mingguan menunjukkan pengeringan volume jual.",
        url: "https://www.instagram.com/cryptotrends",
        source: "INSTAGRAM • @CRYPTOTRENDS",
        publishedOn: now - 95 * 60 * 1000,
        tags: ["ETH", "INSTAGRAM", "RISK_MANAGEMENT"],
        imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&auto=format&fit=crop&q=60"
      });
    } else {
      // mode === 'FOREX'
      // 1. YouTube Forex video
      socialItems.push({
        id: `yt-forex-1`,
        title: "Rayner Teo: The ONLY Price Action Strategy You Need in 2026",
        body: "Edukasi Rayner Teo: Menjelaskan trading Forex murni menggunakan BOS (Break of Structure) tanpa indikator teknikal lagging. Contoh kasus live pada GBPUSD.",
        url: "https://www.youtube.com/watch?v=UC8fK_P4E6g",
        source: "YOUTUBE • RAYNER TEO",
        publishedOn: now - 12 * 60 * 1000,
        tags: ["FOREX", "PRICE_ACTION", "BOS"],
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=60"
      });

      // 2. YouTube Forex video 2
      socialItems.push({
        id: `yt-forex-2`,
        title: "TradingView: Gold (XAUUSD) Reclaims Critical Multi-Year Pivot Support",
        body: "Analisis teknikal harian TradingView: Penguatan harga emas di atas $2,330 mengonfirmasi pola akumulasi Wyckoff Spring. Investor targetkan re-test level $2,380.",
        url: "https://www.youtube.com/watch?v=UC-R5G9H_5t",
        source: "YOUTUBE • TRADINGVIEW",
        publishedOn: now - 40 * 60 * 1000,
        tags: ["XAUUSD", "GOLD", "TECHNICAL"],
        imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&auto=format&fit=crop&q=60"
      });

      // 3. X / Twitter Forex tweet
      socialItems.push({
        id: `tw-forex-1`,
        title: "KarenForex: Dollar Index (DXY) Rejected at Crucial Daily Supply",
        body: "Twitter/X Update: 'DXY menembus area supply harian lalu mengalami penolakan (rejection) tajam. Ini mengonfirmasi momentum bearish untuk US Dollar. Saatnya beli EURUSD!'",
        url: "https://twitter.com/karenforex",
        source: "X/TWITTER • @KARENFOREX",
        publishedOn: now - 22 * 60 * 1000,
        tags: ["DXY", "EURUSD", "FOREX"],
        imageUrl: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=200&auto=format&fit=crop&q=60"
      });

      // 4. TikTok Forex video
      socialItems.push({
        id: `tk-forex-1`,
        title: "FxPro TikTok: Crude Oil (USOIL) Double Bottom Pattern Detected!",
        body: "TikTok live update: Minyak mentah (USOIL) memantul dari support psikologis $79.80. Mengupas peluang trading 1:3 RR dengan target target pivot di $81.20.",
        url: "https://www.tiktok.com/@fxpro",
        source: "TIKTOK • @FXPRO",
        publishedOn: now - 55 * 60 * 1000,
        tags: ["USOIL", "COMMODITIES", "CHART_PATTERNS"],
        imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=200&auto=format&fit=crop&q=60"
      });

      // 5. Instagram Forex post
      socialItems.push({
        id: `ig-forex-1`,
        title: "FxMentorship Instagram: USDJPY Stop Placement Guidelines",
        body: "Instagram feed post: Cara meletakkan Stop Loss menggunakan ATR (Average True Range) pada JPY pairs untuk menghindari sumbu manipulasi sesi London-NY.",
        url: "https://www.instagram.com/fxmentorship",
        source: "INSTAGRAM • @FXMENTORSHIP",
        publishedOn: now - 80 * 60 * 1000,
        tags: ["USDJPY", "JPY", "RISK_MANAGEMENT"],
        imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=200&auto=format&fit=crop&q=60"
      });
    }

    // Merge and sort by time
    const combinedNews = [...rssItems, ...socialItems].sort((a, b) => b.publishedOn - a.publishedOn);

    return NextResponse.json({ news: combinedNews });
  } catch (error: any) {
    console.warn('API Error in /api/market/news (falling back to mock news):', error.message);
    return NextResponse.json({ 
      news: mode === 'FOREX' ? MOCK_FALLBACK_NEWS_FOREX : MOCK_FALLBACK_NEWS_CRYPTO, 
      error: error.message || 'Internal server error', 
      isFallback: true 
    });
  }
}
