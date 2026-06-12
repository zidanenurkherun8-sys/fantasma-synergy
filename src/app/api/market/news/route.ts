import { NextResponse } from 'next/server';

const MOCK_FALLBACK_NEWS = [
  {
    id: "fallback-1",
    title: "Bitcoin Consolidates Near Support as Institutional Accumulation Accelerates",
    body: "On-chain indicators reveal a significant uptick in long-term wallets acquiring BTC. Market analysts suggest this accumulation phase could precede a major volatility expansion in the coming quarters.",
    url: "https://indodax.com",
    source: "FANTASMA SYNERGY",
    publishedOn: Date.now() - 10 * 60 * 1000,
    tags: ["BTC", "ONCHAIN", "ACCUMULATION"],
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-2",
    title: "Ethereum Gas Fees Drop to Multi-Month Lows Post Layer-2 Upgrades",
    body: "Average transaction fees on the Ethereum mainnet have plummeted, boosting active smart contract interactions. Decentralized exchanges report a 35% surge in daily active users as throughput improves.",
    url: "https://indodax.com",
    source: "COINTELEGRAPH",
    publishedOn: Date.now() - 30 * 60 * 1000,
    tags: ["ETH", "SCALING", "DEFI"],
    imageUrl: "https://images.unsplash.com/photo-1622790694511-9a5abf65ad60?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-3",
    title: "IDX Crypto Watch: Regulatory Framework Set to Unify Local Exchanges",
    body: "Local regulatory authorities have finalized the unified tax code draft for digital asset trading. The framework is expected to attract significant domestic venture capital and institutional custody providers.",
    url: "https://indodax.com",
    source: "IDX MONITOR",
    publishedOn: Date.now() - 90 * 60 * 1000,
    tags: ["REGULATION", "IDX", "IDR"],
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-4",
    title: "Solana Smart Contract Deployments Hit New Record in Q2 Ecosystem Surge",
    body: "Unique active developer wallets on the Solana blockchain expanded by 50% this quarter. The growth is fueled by new automated market maker (AMM) integrations and cross-chain bridge utilities.",
    url: "https://indodax.com",
    source: "SOLANA LABS",
    publishedOn: Date.now() - 180 * 60 * 1000,
    tags: ["SOL", "DEVELOPMENT", "Ecosystem"],
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&auto=format&fit=crop&q=60"
  },
  {
    id: "fallback-5",
    title: "Macro Report: Digital Assets Outperform Commodities Amid Interest Rate Speculation",
    body: "The correlation between cryptocurrency indices and traditional tech stocks has decoupled, as macro funds reallocate capital into yield-bearing decentralized liquidity pools.",
    url: "https://indodax.com",
    source: "BLOOMBERG QUANT",
    publishedOn: Date.now() - 240 * 60 * 1000,
    tags: ["MACRO", "DECOUPLING", "FED"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=60"
  }
];

export async function GET() {
  try {
    const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      headers: {
        'User-Agent': 'Fantasma Synergy Quant Core/1.0',
      },
      next: { revalidate: 30 }, // Cache on edge for 30s
    });

    if (!response.ok) {
      throw new Error(`CryptoCompare News API returned: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    const rawNews = data.Data || [];

    // Map to clean format
    const news = rawNews.map((item: any) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      url: item.url,
      source: item.source,
      publishedOn: item.published_on * 1000, // standard ms timestamp
      tags: item.categories ? item.categories.split('|') : [],
      imageUrl: item.imageurl,
    }));

    // If API returned empty for some reason, use fallback
    if (news.length === 0) {
      return NextResponse.json({ news: MOCK_FALLBACK_NEWS });
    }

    return NextResponse.json({ news });
  } catch (error: any) {
    console.warn('API Error in /api/market/news (falling back to mock news):', error.message);
    // Return high-quality mock news on error instead of breaking the UI
    return NextResponse.json({ news: MOCK_FALLBACK_NEWS, error: error.message || 'Internal server error', isFallback: true });
  }
}
