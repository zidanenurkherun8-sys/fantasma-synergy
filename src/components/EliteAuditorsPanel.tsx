import React, { useState } from 'react';
import { UserCheck, Quote, TrendingUp, TrendingDown, HelpCircle, User, Sparkles, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OracleSignal } from '@/lib/oracle-engine';
import TiltCard from './TiltCard';

interface EliteAuditorsPanelProps {
  signal: OracleSignal | null;
  loading: boolean;
}

interface AuditorOpinion {
  name: string;
  title: string;
  avatarInitials: string;
  avatarBg: string;
  methodology: string;
  vote: 'LONG' | 'SHORT' | 'NEUTRAL';
  outlook: string;
  comment: string;
  icon: string;
}

export default function EliteAuditorsPanel({ signal, loading }: EliteAuditorsPanelProps) {
  const [expandedAuditor, setExpandedAuditor] = useState<string | null>(null);

  if (loading || !signal) {
    return null; // Don't render if loading or no signal is available
  }

  const {
    direction,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit2,
    symbol,
    smartMoney: { whaleScore },
    fundamentals: { mvrvZScore },
    harmonicScan: { patternDetected }
  } = signal;

  const fmtPrice = (price: number) => Math.round(price).toLocaleString('id-ID');

  // Generate 12 dynamic opinions based on the live signal
  const auditors: AuditorOpinion[] = [
    {
      name: 'Warren Buffett',
      title: 'Chairman of Berkshire Hathaway',
      avatarInitials: 'WB',
      avatarBg: 'from-amber-600 to-yellow-600',
      methodology: 'Margin of Safety & Intrinsic Value',
      icon: '👴',
      vote: direction === 'LONG' && confidence >= 80 ? 'LONG' : direction === 'SHORT' ? 'NEUTRAL' : 'NEUTRAL',
      outlook: direction === 'LONG' && confidence >= 80 
        ? `Margin pengaman memadai di Rp ${fmtPrice(entryPrice)}.` 
        : 'Spekulasi jangka pendek terlalu tinggi, pegang kas.',
      comment: direction === 'LONG' && confidence >= 80
        ? `Kami melihat adanya margin pengaman (margin of safety) yang cukup luas pada harga Rp ${fmtPrice(entryPrice)}. Selama aset ini memiliki likuiditas dan utilitas jaringan yang kuat, membelinya di harga diskon ini adalah keputusan nilai investasi yang logis.`
        : direction === 'SHORT'
          ? `Kami tidak pernah melakukan shorting pada instrumen spekulatif. Lebih aman menunggu di pinggir lapangan dengan kas yang likuid. Ingat, memegang kas adalah posisi defensif yang sangat tangguh saat gelembung pasar pecah.`
          : `Pasar saat ini tidak menawarkan margin pengaman yang logis. Sebagai investor defensif, tidak bertransaksi adalah opsi terbaik. Lindungi modal utama Anda terlebih dahulu.`
    },
    {
      name: 'George Soros',
      title: 'Founder of Soros Fund Management',
      avatarInitials: 'GS',
      avatarBg: 'from-blue-600 to-indigo-700',
      methodology: 'Reflexivity Theory & Momentum Arbitrage',
      icon: '🧠',
      vote: direction,
      outlook: direction === 'LONG'
        ? 'Bias kognitif berbalik naik. Tren menguat.'
        : direction === 'SHORT'
          ? 'Kepanikan menyebar. Risiko penurunan tajam.'
          : 'Keseimbangan semu, hindari fluktuasi liar.',
      comment: direction === 'LONG'
        ? `Tren naik didukung oleh bias refleksif pelaku pasar yang mulai berbalik optimistis. Ketimpangan orderbook di Rp ${fmtPrice(entryPrice)} akan memicu feedback loop positif yang mempercepat dorongan harga menuju target TP.`
        : direction === 'SHORT'
          ? `Kepanikan pasar selalu menyebar lebih cepat daripada optimisme. Tekanan likuiditas bids yang tipis memvalidasi bahwa posisi SHORT di Rp ${fmtPrice(entryPrice)} memiliki asimetri profitabilitas yang sangat eksplosif.`
          : `Pasar sedang berada dalam fase ekuilibrium semu. Tidak ada bias bias kognitif pelaku pasar yang cukup ekstrem untuk kita eksploitasi saat ini.`
    },
    {
      name: 'Ray Dalio',
      title: 'Founder of Bridgewater Associates',
      avatarInitials: 'RD',
      avatarBg: 'from-cyan-600 to-blue-700',
      methodology: 'Debt Cycles & Systematic Confluence',
      icon: '📊',
      vote: confidence >= 72 ? direction : 'NEUTRAL',
      outlook: confidence >= 72 && direction !== 'NEUTRAL'
        ? `Sinyal konfluensi makro tervalidasi (${confidence}%).`
        : 'Fragmentasi data tinggi, pertahankan alokasi All-Weather.',
      comment: direction === 'LONG' && confidence >= 72
        ? `Siklus utang jangka pendek dan parameter likuiditas pasar mendukung akumulasi aset ini. Sistem kami mendeteksi kekuatan konfluensi multi-timeframe dengan tingkat kepercayaan makro sebesar ${confidence}%.`
        : direction === 'SHORT' && confidence >= 72
          ? `Tekanan penyusutan modal (deleveraging) dan likuidasi terdeteksi di orderbook. Ini mengonfirmasi arus modal keluar (capital outflow) sistematik dari pasangan ${symbol}/IDR.`
          : `Konsensus indikator kami sangat terfragmentasi. Dalam portofolio Segala Musim (All Weather), kami mempertahankan alokasi netral demi meredam gejolak volatilitas tak terduga.`
    },
    {
      name: 'Jesse Livermore',
      title: 'Legendary Boy Plunger',
      avatarInitials: 'JL',
      avatarBg: 'from-red-650 from-red-600 to-rose-700',
      methodology: 'Pivotal Points & Volume Breakout',
      icon: '🎩',
      vote: direction,
      outlook: direction === 'LONG'
        ? `Harga menembus Pivot Rp ${fmtPrice(entryPrice)} ke atas.`
        : direction === 'SHORT'
          ? `Konfirmasi breakdown Pivot Rp ${fmtPrice(entryPrice)}.`
          : 'Pasar malas bergerak, tunggu konfirmasi breakout.',
      comment: direction === 'LONG'
        ? `Harga telah melampaui titik pivot kunci di Rp ${fmtPrice(entryPrice)}. Volume akumulasi bandar mengonfirmasi bahwa garis perlawanan terkecil (line of least resistance) saat ini secara mutlak mengarah ke atas.`
        : direction === 'SHORT'
          ? `Breakout ke bawah titik pivot telah terkonfirmasi dengan volume distribusi. Menentang perosotan harga ini adalah tindakan bodoh. Ikuti tren SHORT dengan disiplin batas stop loss ketat.`
          : `Harga terjebak dalam rentang sempit tanpa arah volume yang jelas. Seorang trader spekulatif profesional hanya bertransaksi saat pasar mulai menunjukkan pergerakan tren yang aktif.`
    },
    {
      name: 'Richard Wyckoff',
      title: 'Pioneer of Volume Spread Analysis',
      avatarInitials: 'RW',
      avatarBg: 'from-emerald-600 to-teal-700',
      methodology: 'Composite Man & Accumulation Cycles',
      icon: '📈',
      vote: whaleScore >= 70 && direction === 'LONG' ? 'LONG' : (whaleScore <= 45 || direction === 'SHORT' ? 'SHORT' : 'NEUTRAL'),
      outlook: whaleScore >= 70 && direction === 'LONG'
        ? `Fase Akumulasi (Spring) terdeteksi (Whale: ${whaleScore}).`
        : direction === 'SHORT'
          ? `Fase Distribusi (Upthrust) terkonfirmasi.`
          : `Trading Range (Sideways), bandar sedang re-akumulasi.`,
      comment: whaleScore >= 70 && direction === 'LONG'
        ? `Aktivitas 'Composite Operator' menunjukkan fase akumulasi yang bersih di area Rp ${fmtPrice(entryPrice)}. Pola 'Spring' terkonfirmasi, bersiaplah untuk fase markup harga berikutnya.`
        : direction === 'SHORT'
          ? `Ini adalah fase distribusi klasik. Para pemegang saham besar (smart money) sedang melepas muatan mereka ke retail. Tahap penurunan harga (markdown) akan segera terjadi.`
          : `Pasar berada dalam area trading range (sideways). Smart money sedang melakukan re-akumulasi diam-diam. Tunggu hingga harga melompat keluar dari rentang resistensi terdekat.`
    },
    {
      name: 'Paul Tudor Jones',
      title: 'Founder of Tudor Investment Corp',
      avatarInitials: 'PJ',
      avatarBg: 'from-purple-600 to-violet-700',
      methodology: 'Moving Average Crossovers & Trend Rules',
      icon: '🦅',
      vote: direction,
      outlook: direction === 'LONG'
        ? `Di atas support EMA krusial. Momentum LONG.`
        : direction === 'SHORT'
          ? `Di bawah EMA utama. Momentum SHORT.`
          : 'Menyilang di garis rata-rata, bahaya Whipsaw.',
      comment: direction === 'LONG'
        ? `Aset ini diperdagangkan di atas support Moving Average yang krusial. Aturan disiplin saya sederhana: selalu beli kekuatan, dan setup di Rp ${fmtPrice(entryPrice)} memiliki konfluensi momentum yang sangat sehat.`
        : direction === 'SHORT'
          ? `Ketika harga gagal bertahan di atas MA utama, tren turun akan mendominasi. Saya lebih memilih mengambil posisi SHORT untuk memanfaatkan percepatan momentum ke bawah.`
          : `Harga sedang meliuk-liuk di sekitar garis Moving Average rata-rata. Tidak ada momentum bersih, sangat berisiko terkena whipsaw (false signal).`
    },
    {
      name: 'Jim Simons',
      title: 'Founder of Renaissance Technologies',
      avatarInitials: 'JS',
      avatarBg: 'from-slate-700 to-slate-800',
      methodology: 'Quantitative Systems & Mean Reversion',
      icon: '💻',
      vote: confidence >= 70 ? direction : 'NEUTRAL',
      outlook: confidence >= 70
        ? `Anomali statistik terdeteksi dengan keakuratan tinggi.`
        : 'Derau pasar (noise) terlalu tinggi untuk model kami.',
      comment: direction === 'LONG' && confidence >= 70
        ? `Algoritma regresi kuantitatif kami mendeteksi anomali jangka pendek yang menyimpang dari rata-rata historis harga. Probabilitas statistik mendukung kelanjutan tren naik dengan win rate yang andal.`
        : direction === 'SHORT' && confidence >= 70
          ? `Model prediktif kami mendeteksi sinyal jenuh beli (overbought) ekstrem dengan probabilitas pembalikan arah rata-rata (mean reversion) yang sangat signifikan di rentang harga saat ini.`
          : `Koefisien korelasi data market berada di bawah batas signifikansi matematika kami. Derau pasar (market noise) terlalu acak untuk mengeksekusi perdagangan saat ini.`
    },
    {
      name: 'Nassim Nicholas Taleb',
      title: 'Author of The Black Swan',
      avatarInitials: 'NT',
      avatarBg: 'from-zinc-700 to-neutral-800',
      methodology: 'Fat-Tails & Asymmetry Risk Mitigation',
      icon: '🦉',
      vote: direction !== 'NEUTRAL' ? direction : 'NEUTRAL',
      outlook: direction !== 'NEUTRAL'
        ? `Batasan risiko SL Rp ${fmtPrice(stopLoss)} memberi asimetri positif.`
        : 'Model peramalan mengabaikan risiko ekor hitam (Black Swan).',
      comment: direction === 'LONG'
        ? `Secara asimetris, risiko kerugian dibatasi dengan sangat ketat oleh Stop Loss di Rp ${fmtPrice(stopLoss)}, sementara potensi keuntungan (TP3) terbuka lebar. Ini adalah taruhan antifragile yang rasional.`
        : direction === 'SHORT'
          ? `Meskipun bias mengarah ke bawah, shorting crypto sering kali menghadapi risiko 'fat tail' (lonjakan ekstrem tiba-tiba). Jaga leverage Anda sekecil mungkin atau batalkan niat SHORT.`
          : `Sistem kuantitatif ini sering kali mengabaikan ketidakpastian ekstrem. Menggunakan leverage tinggi di kondisi sideways tanpa arah adalah bentuk bunuh diri portofolio.`
    },
    {
      name: 'Steve Nison',
      title: 'Father of Candlestick Charting',
      avatarInitials: 'SN',
      avatarBg: 'from-amber-700 to-orange-800',
      methodology: 'Japanese Candlestick Price Action',
      icon: '🕯️',
      vote: patternDetected !== 'None' ? direction : 'NEUTRAL',
      outlook: patternDetected !== 'None'
        ? `Pola grafik ${patternDetected} tervalidasi.`
        : 'Candle tidak beraturan, tunggu formasi sumbu konfirmasi.',
      comment: direction === 'LONG' && patternDetected !== 'None'
        ? `Formasi candlestick di area support Rp ${fmtPrice(entryPrice)} membentuk pola pembalikan arah bullish yang kuat (seperti pola ${patternDetected}). Penolakan harga bawah terbukti dengan sumbu bawah yang panjang.`
        : direction === 'SHORT' && patternDetected !== 'None'
          ? `Candle distribusi merah panjang mengonfirmasi dominasi bear. Sinyal pembalikan arah tren naik ke tren turun sangat jelas terlihat pada struktur penutupan candle terakhir.`
          : `Candle Doji berturut-turut mencerminkan keraguan ekstrem antara pembeli dan penjual. Tunggu pola candlestick konfirmasi (seperti Engulfing atau Hammer) di sesi berikutnya.`
    },
    {
      name: 'Benjamin Graham',
      title: 'Father of Value Investing',
      avatarInitials: 'BG',
      avatarBg: 'from-yellow-700 to-amber-800',
      methodology: 'Intrinsic Value Calculations',
      icon: '📚',
      vote: mvrvZScore < 1.0 && direction === 'LONG' ? 'LONG' : 'NEUTRAL',
      outlook: mvrvZScore < 1.0 && direction === 'LONG'
        ? `Valuasi MVRV (${mvrvZScore.toFixed(2)}) murah. Beli nilai.`
        : `Harga pasar terlalu jauh dari nilai intrinsik wajarnya.`,
      comment: mvrvZScore < 1.0 && direction === 'LONG'
        ? `Aset ini memiliki rasio valuasi fundamental yang menarik. Berdasarkan data MVRV Z-Score di tingkat ${mvrvZScore.toFixed(2)}, investor memiliki pengaman investasi yang tebal untuk jangka panjang.`
        : `Harga saat ini tidak menawarkan diskon wajar. Membeli tanpa margin pengaman fundamental adalah tindakan spekulatif murni yang bertentangan dengan prinsip investasi defensif.`
    },
    {
      name: 'W.D. Gann',
      title: 'Pioneer of Financial Geometry',
      avatarInitials: 'WG',
      avatarBg: 'from-emerald-700 to-green-800',
      methodology: 'Gann Angles & Time Cycles',
      icon: '📐',
      vote: direction,
      outlook: direction === 'LONG'
        ? `Gann 1x1 angle bertindak sebagai support.`
        : direction === 'SHORT'
          ? `Harga tergelincir ke sudut Gann 1x2.`
          : 'Persimpangan geometris waktu dan harga sedang aktif.',
      comment: direction === 'LONG'
        ? `Sudut geometris Gann 1x1 bertahan sebagai support solid di Rp ${fmtPrice(entryPrice)}. Secara siklus waktu kuantitatif, pembalikan arah bullish telah matang dan siap melonjak.`
        : direction === 'SHORT'
          ? `Harga telah menembus sudut Gann 1x2 ke bawah. Sinyal tekanan geometris menunjukkan target penurunan berikutnya berada di area support diagonal terdalam.`
          : `Pasar berada dalam zona persimpangan waktu (time junction) yang krusial. Fluktuasi tidak menentu akan mendominasi hingga siklus baru dimulai.`
    },
    {
      name: 'Satoshi Nakamoto',
      title: 'Creator of Bitcoin',
      avatarInitials: 'SN',
      avatarBg: 'from-orange-500 to-amber-700',
      methodology: 'On-chain Protocol Metrics & Consensus',
      icon: '🪙',
      vote: direction,
      outlook: direction === 'LONG'
        ? 'Aliran on-chain kuat. Akumulasi alamat aktif.'
        : direction === 'SHORT'
          ? 'Kemacetan mempool & inflow bursa central meningkat.'
          : 'Konsensus terdistribusi stabil tanpa lonjakan aktivitas.',
      comment: direction === 'LONG'
        ? `Aliran on-chain dan pertumbuhan alamat aktif menunjukkan kekuatan fundamental jaringan yang terus menguat. Transaksi terdesentralisasi mengonfirmasi akumulasi tanpa henti.`
        : direction === 'SHORT'
          ? `Terjadi kemacetan transaksi sementara dengan peningkatan arus koin masuk (inflow) ke bursa central. Ini mencerminkan tanda distribusi likuiditas jangka pendek.`
          : `Konsensus jaringan berjalan stabil namun tidak ada lonjakan aktivitas on-chain baru yang signifikan. Utamakan kedaulatan modal Anda dengan menunggu konfirmasi.`
    }
  ];

  return (
    <TiltCard className="p-5 flex flex-col gap-4 select-none bg-[#07090F]">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#1E2333] pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-extrabold text-[#E6EDF3] uppercase tracking-wider font-sans">
            Dewan Auditor Elite & Market Guardians (12 Consensus Panel)
          </h3>
        </div>
        <span className="text-[9px] bg-purple-500/10 border border-purple-550 border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded font-mono uppercase">
          Dynamic Rationale Engine
        </span>
      </div>

      <p className="text-xs text-[#8B949E] font-mono leading-relaxed">
        Simulasi tanggapan dan outlook masa depan dari 12 tokoh investor, trader legendaris dunia, dan pencipta sistem, yang masing-masing menganalisis setup <strong className="text-purple-450 text-[#58A6FF]">{symbol}/IDR</strong> saat ini menggunakan metodologi yang berbeda secara real-time.
      </p>

      {/* 12 Auditor Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
        {auditors.map((auditor) => {
          const isExpanded = expandedAuditor === auditor.name;
          const voteColors = {
            LONG: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
            SHORT: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
            NEUTRAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          };

          return (
            <div
              key={`auditor-card-${auditor.name}`}
              onClick={() => setExpandedAuditor(isExpanded ? null : auditor.name)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isExpanded
                  ? 'border-purple-500/50 bg-[#1e1c2a]/45 shadow-[0_0_15px_rgba(168,85,247,0.08)] md:col-span-2 xl:col-span-3'
                  : 'border-[#1E2333] bg-[#030407]/80 hover:bg-[#07090F]/50 hover:border-[#58A6FF]/40'
              }`}
            >
              {/* Card top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* Custom initials avatar */}
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${auditor.avatarBg} flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow`}>
                    {auditor.avatarInitials}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#E6EDF3] leading-tight flex items-center gap-1.5 font-sans">
                      {auditor.name} <span className="text-[14px]">{auditor.icon}</span>
                    </h4>
                    <span className="text-[8px] text-[#8B949E] block mt-0.5 leading-none font-mono">
                      {auditor.title}
                    </span>
                  </div>
                </div>

                {/* Vote Badge */}
                <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded border ${voteColors[auditor.vote]}`}>
                  {auditor.vote === 'LONG' ? 'BUY' : auditor.vote === 'SHORT' ? 'SELL' : 'HOLD'}
                </span>
              </div>

              {/* Methodology details */}
              <div className="border-t border-[#1E2333]/40 pt-2 mt-2.5">
                <span className="text-[8px] text-[#8B949E] uppercase font-bold tracking-wider font-mono block">
                  Metodologi: {auditor.methodology}
                </span>
                <p className="text-[10px] text-slate-300 font-sans mt-1.5 font-semibold leading-normal">
                  🔍 <span className="italic">"{auditor.outlook}"</span>
                </p>
              </div>

              {/* Expanded comment detail with animation */}
              {isExpanded ? (
                <div className="mt-3.5 bg-[#030407]/80 border border-purple-500/25 p-3 rounded-lg flex items-start gap-2.5 text-xs text-slate-100 font-sans animate-fadeIn leading-relaxed">
                  <Quote className="h-5 w-5 text-purple-400 shrink-0 mt-0.5 opacity-60" />
                  <div className="flex-1">
                    <span className="text-[9px] uppercase font-bold text-purple-400 block mb-1 font-mono">Tanggapan Mendalam & Analisis ke Depan:</span>
                    <p className="font-normal italic leading-relaxed text-[#c9d1d9]">{auditor.comment}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 text-right">
                  <span className="text-[8px] text-[#58A6FF] hover:text-[#58A6FF]/85 font-extrabold uppercase font-sans tracking-wide">
                    Detail Tanggapan &raquo;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TiltCard>
  );
}
