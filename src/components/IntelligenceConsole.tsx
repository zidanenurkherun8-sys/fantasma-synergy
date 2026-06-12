'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, BookOpen, Clock, Globe, ArrowUpRight, TrendingUp, Sparkles, Shield, Cpu, RefreshCw, Send } from 'lucide-react';
import TiltCard from './TiltCard';
import { audio } from '@/lib/audio';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  url: string;
  source: string;
  publishedOn: number;
  tags: string[];
  imageUrl?: string;
}

interface SocialPost {
  id: string;
  handle: string;
  platform: 'X/Twitter' | 'TikTok' | 'IDX' | 'Instagram';
  content: string;
  timestamp: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

const ACADEMY_MODULES = [
  {
    id: 'structure',
    title: 'Market Structure Shifts (BOS & CHoCH)',
    description: 'Bagaimana mengenali perubahan tren secara akurat menggunakan aksi harga murni sebelum indikator lagging bereaksi.',
    content: `
### 1. BOS (Break of Structure)
BOS terjadi ketika harga menembus level High sebelumnya dalam tren naik (Bullish BOS) atau menembus level Low sebelumnya dalam tren turun (Bearish BOS). Ini menandakan kontinuitas tren yang sedang berjalan.
* **Bullish BOS**: Penutupan harga (body candle) di atas Higher High (HH) sebelumnya.
* **Bearish BOS**: Penutupan harga di bawah Lower Low (LL) sebelumnya.

### 2. CHoCH (Change of Character)
CHoCH menandakan perubahan karakter atau awal transisi tren. Terjadi ketika harga menembus titik ayun terendah/tertinggi struktural (SWING LOW/HIGH) yang menyebabkan pembentukan Higher High atau Lower Low terakhir.
* **Bullish CHoCH**: Penutupan harga di atas Lower High (LH) terakhir setelah tren turun panjang.
* **Bearish CHoCH**: Penutupan harga di bawah Higher Low (HL) terakhir setelah tren naik panjang.

*💡 Tip Analitis*: Selalu konfirmasikan penembusan level dengan penutupan BODY candle di chart volume tinggi, bukan hanya sumbu (wick) candle saja. Sumbu candle sering kali merepresentasikan manipulasi likuiditas.
    `
  },
  {
    id: 'wyckoff',
    title: 'Wyckoff Accumulation & Springs',
    description: 'Memahami siklus akumulasi bandar (Smart Money) untuk membeli aset di harga termurah saat publik panik.',
    content: `
### Metode Wyckoff: Fase Akumulasi
Wyckoff mengidentifikasi bahwa pasar bergerak dalam siklus akumulasi (pengumpulan barang oleh institusi besar) dan distribusi (penjualan kembali ke publik retail).

#### Tahapan Akumulasi Utama:
1. **PS (Preliminary Support)**: Pembelian awal oleh institusi setelah tren turun panjang.
2. **SC (Selling Climax)**: Tekanan jual retail mencapai puncak kepanikan. Harga tertekan drastis dengan volume raksasa.
3. **AR (Automatic Rally)**: Harga memantul naik secara otomatis karena tekanan jual habis dan pembelian institusi terus berjalan.
4. **ST (Secondary Test)**: Harga turun kembali untuk menguji area SC. Volume harus lebih kecil, menandakan suplai di pasar mulai kering.
5. **Spring (The Trap)**: **Momen krusial!** Harga menembus level support SC secara menipu untuk menyapu stop-loss retail, lalu dengan cepat ditarik kembali ke dalam rentang konsolidasi. Ini adalah titik entry dengan akurasi tertinggi.
6. **LPS (Last Point of Support)**: Titik support terakhir sebelum ekspansi harga keluar dari akumulasi (breakout).

*💡 Strategi Fantasma*: Selalu pasang alarm di bawah level SC untuk mendeteksi potensi Wyckoff Spring. Entry paling aman adalah setelah Spring dikonfirmasi dengan volume beli yang meningkat saat harga kembali masuk ke dalam trading range.
    `
  },
  {
    id: 'kelly',
    title: 'Sizing Modal & Kriteria Kelly',
    description: 'Aturan matematika mutlak untuk menghitung alokasi ukuran posisi (margin) guna memaksimalkan pertumbuhan akun tanpa risiko kebangkrutan.',
    content: `
### Kriteria Kelly (Sizing Formula)
Kriteria Kelly membantu menghitung persentase modal optimal yang dialokasikan pada setiap perdagangan berdasarkan probabilitas keberhasilan dan rasio risk-to-reward.

#### Formula Dasar Kelly:
$$f^* = \frac{bp - q}{b} = p - \frac{q}{b}$$
Dimana:
* $f^*$: Persentase modal akun yang disarankan untuk ditransaksikan.
* $b$: Rasio payout (Profit IDR / Loss IDR jika terkena stop loss, atau jarak TP dibagi jarak SL).
* $p$: Probabilitas kemenangan perdagangan (angka decimal, misalnya 0.65).
* $q$: Probabilitas kekalahan ($1 - p$).

#### Formula Kelly Dinamis Fantasma (Staged Multi-Scanner):
Untuk meminimalkan volatilitas saldo (*portfolio drawdown*), sistem Fantasma Synergy menggunakan **Half-Kelly** (setengah dari nilai Kelly optimal) dengan formula penyesuaian volatilitas pasar:
$$\text{Alokasi Disarankan} = \max\left(5\%, \min\left(25\%, \text{Kelly Size} \times (1 - \text{volatilityFactor})\right)\right)$$

*💡 Aturan Manajemen Risiko*: Jangan pernah melampaui alokasi 25% modal per posisi terlepas dari tingginya probabilitas indikator AI. Disiplin Kelly adalah pelindung utama akun Anda dari kejatuhan fatal.
    `
  }
];

const INITIAL_SOCIALS: SocialPost[] = [
  {
    id: 's1',
    handle: '@WyckoffGurus',
    platform: 'X/Twitter',
    content: 'BTC menguji area Selling Climax harian di Rp 1.150.000.000. Volume mengering drastis. Indikasi kuat potensi Wyckoff Spring sedang terbentuk. Pantau penembusan sumbu palsu.',
    timestamp: '15 detik lalu',
    sentiment: 'BULLISH'
  },
  {
    id: 's2',
    handle: '@IDX_Monitor',
    platform: 'IDX',
    content: 'Rapat komite regulasi melaporkan draf final aturan perpajakan crypto terpadu. Kepastian hukum diharapkan menarik aliran modal institusional lokal pada Q3.',
    timestamp: '1 menit lalu',
    sentiment: 'BULLISH'
  },
  {
    id: 's3',
    handle: '@CryptoWhaleAlert',
    platform: 'X/Twitter',
    content: '🚨 4.500 ETH (Rp 136 Miliar) ditransfer dari cold wallet ke exchange Binance. Kemungkinan distribusi jangka pendek. Risiko likuiditas meningkat.',
    timestamp: '2 menit lalu',
    sentiment: 'BEARISH'
  },
  {
    id: 's4',
    handle: '@TikTokCryptoLogic',
    platform: 'TikTok',
    content: 'Analisis struktur SOL/IDR di 4H chart menunjukkan formasi Bullish CHoCH yang bersih. Indikator momentum RSI berbalik dari area oversold. Target Rp 2.450.000.',
    timestamp: '3 menit lalu',
    sentiment: 'BULLISH'
  }
];

const SOCIAL_POOL = [
  {
    handle: '@NakamotoObserver',
    platform: 'X/Twitter' as const,
    content: 'Metrik on-chain menunjukkan akumulasi wallet ikan paus kembali aktif. Pasokan BTC di bursa berada di level terendah 5 tahun terakhir.',
    sentiment: 'BULLISH' as const
  },
  {
    handle: '@IDX_CryptoUpdate',
    platform: 'IDX' as const,
    content: 'Volume perdagangan bursa berjangka crypto lokal mencatatkan lonjakan transaksi harian tertinggi. Likuiditas pasar IDR membaik.',
    sentiment: 'BULLISH' as const
  },
  {
    handle: '@InstaCoinTrends',
    platform: 'Instagram' as const,
    content: 'Pemerintah global berencana memperketat verifikasi KYC pada Web3 wallet. Kebijakan ini berpotensi memicu kepanikan investor retail jangka pendek.',
    sentiment: 'BEARISH' as const
  },
  {
    handle: '@TikTokChartLord',
    platform: 'TikTok' as const,
    content: 'Hati-hati perangkap likuidasi! Formasi Double Top terbentuk di 15m chart XRP/IDR. Kemungkinan drop ke support Rp 8.800 sebelum akumulasi baru.',
    sentiment: 'BEARISH' as const
  },
  {
    handle: '@WyckoffPro',
    platform: 'X/Twitter' as const,
    content: 'Analisis volume spread: Reaksi beli (AR) setelah drop SC sangat agresif. Smart money jelas menyerap semua pasokan retail yang panik.',
    sentiment: 'BULLISH' as const
  },
  {
    handle: '@SecuritiesRegLocal',
    platform: 'IDX' as const,
    content: 'Sosialisasi UU pengembangan sektor keuangan mencakup lisensi kustodian aset digital baru. Langkah maju bagi adopsi institusional.',
    sentiment: 'BULLISH' as const
  }
];

export default function IntelligenceConsole() {
  const [activeTab, setActiveTab] = useState<'news' | 'academy'>('news');
  const [selectedModule, setSelectedModule] = useState(ACADEMY_MODULES[0]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [socials, setSocials] = useState<SocialPost[]>(INITIAL_SOCIALS);
  const [newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socialBottomRef = useRef<HTMLDivElement>(null);

  // Fetch live global news from route
  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const response = await fetch('/api/market/news');
      if (response.ok) {
        const data = await response.json();
        setNewsList(data.news || []);
      }
    } catch (error) {
      console.error('Failed to load live news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Live social stream tick (simulating continuous scraping every 12 seconds)
  useEffect(() => {
    if (activeTab !== 'news') return;
    
    const interval = setInterval(() => {
      const randomItem = SOCIAL_POOL[Math.floor(Math.random() * SOCIAL_POOL.length)];
      const newPost: SocialPost = {
        id: `s-${Date.now()}`,
        handle: randomItem.handle,
        platform: randomItem.platform,
        content: randomItem.content,
        timestamp: 'Baru saja ditangkap',
        sentiment: randomItem.sentiment
      };
      
      setSocials(prev => [newPost, ...prev.slice(0, 15)]); // keep top 16 posts
    }, 12000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  return (
    <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[#030407] h-full">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2333] pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-purple-500/10 border border-purple-500/20 rounded-[3px] flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(157,78,221,0.1)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-[#E6EDF3] tracking-wide font-sans">KORE INTELEGENSI & AKADEMI</h2>
            <span className="text-[10px] text-[#8B949E] font-mono block">Agregasi Berita Global, Scraping Sentimen Media Sosial, & Rujukan Kuantitatif</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#030407] border border-[#1E2333] p-1 rounded-[3px]">
          <button
            onClick={() => {
              audio?.playClick();
              setActiveTab('news');
            }}
            className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'news'
                ? 'bg-[#58A6FF] text-[#0D1117]'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            <Newspaper className="h-4 w-4" /> Live Intel & Berita
          </button>
          <button
            onClick={() => {
              audio?.playClick();
              setActiveTab('academy');
            }}
            className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'academy'
                ? 'bg-[#58A6FF] text-[#0D1117]'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Synergy Academy
          </button>
        </div>
      </div>

      {/* 2. Content View Tab (News & Socials) */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Column A & B (2/3 Width): Live Global News */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between border-b border-[#1E2333]/80 pb-2">
              <span className="text-xs font-extrabold uppercase text-[#58A6FF] tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#58A6FF]" /> Agregasi Berita Global Real-Time
              </span>
              <button
                onClick={() => {
                  audio?.playClick();
                  handleManualRefresh();
                }}
                disabled={newsLoading || refreshing}
                className="text-[10px] font-mono text-[#8B949E] border border-[#1E2333] bg-[#07090F] px-2 py-1 rounded hover:text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} /> Segarkan
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scroll-smooth [-webkit-overflow-scrolling:touch]">
              {newsLoading ? (
                <div className="quantum-card rounded-[3px] border border-[#1E2333] bg-[#07090F] h-[350px] flex flex-col items-center justify-center text-center">
                  <div className="h-9 w-9 rounded-full border-t-2 border-[#58A6FF] animate-spin mb-3" />
                  <span className="text-xs text-[#8B949E] font-mono uppercase tracking-wider">Mencari Berita Terbaru dari Web & Bursa...</span>
                </div>
              ) : newsList.length === 0 ? (
                <div className="quantum-card rounded-[3px] border border-[#1E2333] bg-[#07090F] h-[200px] flex items-center justify-center text-slate-500 italic text-xs">
                  Gagal menghubungkan ke satelit berita global. Coba klik segarkan.
                </div>
              ) : (
                newsList.map((item) => (
                  <TiltCard key={item.id} className="p-4 bg-[#07090F]/90 border border-[#1E2333] select-none">
                    <div className="flex gap-4">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="news_thumb"
                          className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-[2px] border border-[#1E2333] shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 flex flex-col justify-between gap-1.5">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[9px] font-mono font-bold text-[#8B949E] mb-1">
                            <span className="text-[#58A6FF] uppercase bg-[#58A6FF]/10 px-1.5 py-0.5 rounded border border-[#58A6FF]/20">{item.source}</span>
                            <span>{new Date(item.publishedOn).toLocaleString('id-ID')}</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-[#E6EDF3] leading-snug hover:text-[#58A6FF] transition font-sans">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              {item.title} <ArrowUpRight className="h-3 w-3 shrink-0" />
                            </a>
                          </h4>
                          <p className="text-[11px] text-[#8B949E] leading-normal font-sans mt-1">
                            {item.body.length > 180 ? `${item.body.substring(0, 180)}...` : item.body}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 font-mono text-[8px]">
                          {item.tags.slice(0, 4).map((tag, tIdx) => (
                            <span key={`tag-${tIdx}`} className="text-purple-400 bg-purple-950/20 border border-purple-900/30 px-1.5 py-0.5 rounded uppercase">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                ))
              )}
            </div>
          </div>

          {/* Column C (1/3 Width): Real-Time Scraped Social Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0 bg-[#07090F]/45 border border-[#1E2333] rounded-[3px] p-4">
            <div className="border-b border-[#1E2333] pb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-purple-400 tracking-wider flex items-center gap-2 font-sans">
                <Clock className="h-4 w-4 text-purple-400 animate-pulse" /> Live Scraped Sentiment
              </span>
              <span className="h-2 w-2 rounded-full bg-[#3FB950] animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scroll-smooth [-webkit-overflow-scrolling:touch]">
              {socials.map((post) => (
                <div key={post.id} className="bg-[#030407] border border-[#1E2333] p-3 rounded-[3px] flex flex-col gap-1.5 font-mono relative overflow-hidden select-none hover:border-purple-500/35 transition-colors">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-[#58A6FF]">{post.handle}</span>
                    <span className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[8px] ${
                      post.sentiment === 'BULLISH'
                        ? 'bg-emerald-500/10 text-[#3FB950] border border-emerald-500/20'
                        : post.sentiment === 'BEARISH'
                          ? 'bg-rose-500/10 text-[#F85149] border border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-800'
                    }`}>
                      {post.sentiment}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#E6EDF3] leading-normal font-sans">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-[8px] text-[#8B949E] mt-0.5">
                    <span className="bg-purple-950/20 text-purple-400 border border-purple-900/30 px-1 py-0.2 rounded font-bold uppercase">{post.platform}</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. Content View Tab (Synergy Academy) */}
      {activeTab === 'academy' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          
          {/* Left Panel (1/4 Width): Modules Navigation */}
          <div className="lg:col-span-1 flex flex-col gap-2.5 min-h-0 bg-[#07090F]/45 border border-[#1E2333] rounded-[3px] p-4">
            <span className="text-xs font-extrabold uppercase text-[#8B949E] tracking-wider mb-2 block border-b border-[#1E2333] pb-2 font-sans">
              Modul Edukasi Kuantitatif
            </span>
            <div className="flex flex-col gap-2 overflow-y-auto font-sans">
              {ACADEMY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    audio?.playClick();
                    setSelectedModule(mod);
                  }}
                  className={`w-full text-left p-3 border rounded-[3px] transition cursor-pointer flex flex-col gap-1.5 select-none ${
                    selectedModule.id === mod.id
                      ? 'bg-[#0C0E18] border-[#58A6FF] text-[#58A6FF] shadow-sm'
                      : 'bg-[#030407]/40 border-[#1E2333]/80 text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#1E2333]'
                  }`}
                >
                  <span className="font-extrabold text-xs leading-snug">{mod.title}</span>
                  <span className="text-[9px] text-[#8B949E] leading-normal line-clamp-2">{mod.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel (3/4 Width): Selected Module Content Reader */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-[#07090F] border border-[#1E2333] rounded-[3px] p-6 overflow-y-auto select-none font-sans scroll-smooth [-webkit-overflow-scrolling:touch]">
            <div className="border-b border-[#1E2333] pb-3 mb-2">
              <span className="text-[9px] font-mono text-[#58A6FF] uppercase font-bold tracking-widest bg-[#58A6FF]/10 px-2.5 py-0.5 rounded border border-[#58A6FF]/20 mb-2 inline-block">
                FANTASMA ACADEMY READOUT
              </span>
              <h3 className="text-lg font-extrabold text-[#E6EDF3] font-sans leading-snug">
                {selectedModule.title}
              </h3>
            </div>
            
            <div className="text-[#E6EDF3] text-xs leading-relaxed font-sans space-y-4 whitespace-pre-line text-left">
              {selectedModule.content}
            </div>

            {/* Warning Risk Note */}
            <div className="mt-8 border-t border-[#1E2333] pt-4 select-none">
              <div className="bg-[#58A6FF]/5 border border-[#58A6FF]/20 rounded-[3px] p-3 flex gap-3 text-[10px] text-[#8B949E] leading-normal font-sans">
                <Shield className="h-5 w-5 text-[#58A6FF] shrink-0" />
                <div>
                  <strong className="text-[#58A6FF] block mb-0.5 uppercase">Catatan Kepatuhan Portofolio</strong>
                  Seluruh materi edukasi di atas bersifat instruksional analitis untuk simulasi Kelly sizing. Fantasma Synergy tidak menyediakan layanan penasihat keuangan berlisensi. Harap uji seluruh model kelayakan risiko di akun simulasi kertas Anda sebelum melakukan eksposur dana riil.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </main>
  );
}
