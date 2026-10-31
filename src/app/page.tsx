'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPage from './dashboard/page';
import {
  ShieldCheck,
  Radio,
  Volume2,
  VolumeX,
  Activity,
  BarChart2,
  Cpu,
} from 'lucide-react';
import { audio } from '@/lib/audio';
import { OrbitalRadarRings } from '@/components/gateway/OrbitalRadarRings';
import { TerminalDiagnosticConsole } from '@/components/gateway/TerminalDiagnosticConsole';
import { LiveSparkline } from '@/components/gateway/LiveSparkline';
import { SegmentedKellyBar } from '@/components/gateway/SegmentedKellyBar';
import { NeuralClusterIcon } from '@/components/gateway/NeuralClusterIcon';

export default function Home() {
  const [accessed, setAccessed] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState('');
  const [bypassCheck, setBypassCheck] = useState(false);
  const [mutedState, setMutedState] = useState(false);

  // Mouse coordinates normalized (-1 to 1) for 3D gyro parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  // Check saved audio preference
  useEffect(() => {
    if (audio) {
      setMutedState(audio.isMuted());
    }
  }, []);

  // Check saved bypass portal preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bypass = localStorage.getItem('fantasma_bypass_portal') === 'true';
      setBypassCheck(bypass);
      if (bypass) {
        setIsBypassed(true);
        setAccessed(true);
      }
    }
  }, []);

  // Mouse movement tracking for 3D orbital rings & particles
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const normX = (clientX / w) * 2 - 1;
    const normY = (clientY / h) * 2 - 1;
    setMousePos({ x: normX, y: normY });
  };

  // Toggle Bypass Preference
  const handleToggleBypass = (checked: boolean) => {
    setBypassCheck(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fantasma_bypass_portal', checked ? 'true' : 'false');
    }
    audio?.playClick();
  };

  // Toggle Sound FX
  const handleToggleSound = () => {
    if (audio) {
      const newMuted = audio.toggleMute();
      setMutedState(newMuted);
      if (!newMuted) {
        audio.playClick();
      }
    }
  };

  // Decryption & Gateway Access Transition
  const handleAccessTerminal = () => {
    if (glitching) return;
    setGlitching(true);
    setGlitchText('DECRYPTING QUANTUM CORE...');
    audio?.playLaserCharge();

    const glitchPhases = [
      'DECRYPTING QUANTUM CORE...',
      'ARMING SAC & WYCKOFF FILTERS...',
      'ESTABLISHING COGNITIVE TUNNEL...',
      'ACCESS GRANTED // WELCOME',
    ];

    glitchPhases.forEach((phrase, idx) => {
      setTimeout(() => {
        setGlitchText(phrase);
      }, (idx + 1) * 260);
    });

    setTimeout(() => {
      audio?.playSuccess();
      setAccessed(true);
      setGlitching(false);
    }, 1200);
  };

  // 60 FPS Ambient Digital Dust & Particle Canvas
  useEffect(() => {
    if (accessed || !canvasElement) return;
    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn 65 cyber particles
    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.6 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.25 ? '#00F0FF' : '#9D4EDD',
      parallaxFactor: Math.random() * 0.04 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Shift particle position based on mouse parallax
        const px = p.x - mousePos.x * width * p.parallaxFactor;
        const py = p.y - mousePos.y * height * p.parallaxFactor;

        p.alpha += p.pulseSpeed;
        const currentAlpha = Math.abs(Math.sin(p.alpha)) * p.baseAlpha;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [accessed, canvasElement, mousePos]);

  // If user bypassed, directly render Dashboard
  if (isBypassed && accessed) {
    return <DashboardPage onExit={() => { setAccessed(false); setIsBypassed(false); }} />;
  }

  return (
    <AnimatePresence mode="wait">
      {!accessed ? (
        <motion.div
          key="gateway-portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(10px) brightness(1.5)',
            transition: { duration: 0.75, ease: 'easeInOut' },
          }}
          onMouseMove={handleMouseMove}
          className="min-h-screen w-full relative bg-[#05070A] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden select-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 38%, rgba(0, 240, 255, 0.08) 0%, rgba(10, 15, 22, 0.75) 45%, #05070A 85%),
              conic-gradient(from 180deg at 50% 50%, rgba(0, 240, 255, 0.015) 0deg, rgba(157, 78, 221, 0.015) 180deg, rgba(0, 240, 255, 0.015) 360deg)
            `,
          }}
        >
          {/* Subtle Fine Gridline Overlay (Opacity 0.035) */}
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 240, 255, 0.035) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.035) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0.2) 90%)',
            }}
          />

          {/* Interactive Digital Dust Particle Canvas */}
          <canvas
            ref={setCanvasElement}
            className="fixed inset-0 z-0 pointer-events-none"
          />

          {/* ========================================================
              6. FULL-WIDTH TELEMETRY BAR: TOP HEADER
             ======================================================== */}
          <header className="w-full h-11 px-4 md:px-8 bg-[rgba(5,7,10,0.85)] backdrop-blur-md border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between z-30">
            {/* Top-Left: Cognitive Crypto Shield Active */}
            <div className="flex items-center gap-2 border border-[rgba(0,240,255,0.25)] bg-[rgba(0,240,255,0.05)] px-3 py-1 rounded-[4px] shadow-[0_0_12px_rgba(0,240,255,0.12)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.15em] text-[#00F0FF] font-semibold uppercase">
                COGNITIVE CRYPTO SHIELD ACTIVE
              </span>
            </div>

            {/* Top-Right: Sound Control & System Status */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSound}
                onMouseEnter={() => audio?.playHover()}
                className="text-slate-400 hover:text-cyan-400 p-1 rounded border border-[#1E293B] bg-[rgba(10,15,22,0.6)] transition-colors cursor-pointer"
                title={mutedState ? 'Unmute Audio' : 'Mute Audio'}
              >
                {mutedState ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                )}
              </button>

              <div className="flex items-center gap-2 border border-[rgba(0,240,255,0.25)] bg-[rgba(10,15,22,0.7)] px-3 py-1 rounded-[4px] shadow-[0_0_12px_rgba(0,240,255,0.1)]">
                <Radio className="w-3.5 h-3.5 text-[#00FF9D] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.15em] font-semibold text-slate-300 uppercase">
                  SYS_STATUS:{' '}
                  <span className="text-[#00FF9D] drop-shadow-[0_0_6px_rgba(0,255,157,0.7)]">
                    CRYPTED
                  </span>{' '}
                  //{' '}
                  <span className="text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]">
                    ONLINE
                  </span>
                </span>
              </div>
            </div>
          </header>

          {/* ========================================================
              CENTRAL QUANTITATIVE ORACLE CORE
             ======================================================== */}
          <main className="flex-1 flex flex-col items-center justify-center relative w-full px-4 py-4 md:py-6 z-20">
            {/* Center Eye: 3D Orbital Radar Rings */}
            <div className="relative w-full max-w-[560px] h-[220px] md:h-[260px] flex items-center justify-center">
              <OrbitalRadarRings mouseX={mousePos.x} mouseY={mousePos.y} />

              {/* Central Branding Typography: FANTASMA SYNERGY */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                <h1
                  className="font-extrabold uppercase leading-[0.95] tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E0F7FA] to-[#00F0FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.85)] drop-shadow-[0_0_45px_rgba(0,240,255,0.4)]"
                  style={{
                    fontSize: 'clamp(2rem, 5.5vw, 3.4rem)',
                  }}
                >
                  <span className="block">FANTASMA</span>
                  <span className="block mt-1">SYNERGY</span>
                </h1>

                {/* Quantitative Terminal Subtitle */}
                <p className="mt-3 text-[9px] md:text-[10.5px] font-mono tracking-[0.22em] md:tracking-[0.28em] text-cyan-300/90 font-semibold uppercase">
                  QUANTITATIVE ORACLE INVESTMENT TERMINAL v4.0 | FOREX + CRYPTO
                </p>
              </div>
            </div>

            {/* 3. Terminal Diagnostic Console (Frosted Glassmorphism Log) */}
            <div className="w-full max-w-[620px] mt-4 md:mt-5">
              <TerminalDiagnosticConsole />
            </div>

            {/* 4. Tactical KPI Telemetry Cards (3 Horizontal Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-[620px] mt-3 md:mt-4">
              {/* Card 1: Live Market Ticker */}
              <div className="rounded-[4px] p-3 bg-[rgba(10,15,22,0.65)] backdrop-blur-md border border-[rgba(0,240,255,0.22)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#00F0FF]/50 transition-all duration-200">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-1">
                  <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>LIVE MARKET TICKER</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm md:text-base font-mono font-bold text-white tracking-tight">
                    1s Ticks
                  </div>
                  <LiveSparkline />
                </div>
              </div>

              {/* Card 2: R2K Layer / Kelly Aware */}
              <div className="rounded-[4px] p-3 bg-[rgba(10,15,22,0.65)] backdrop-blur-md border border-[rgba(0,240,255,0.22)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#00F0FF]/50 transition-all duration-200">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-1">
                  <BarChart2 className="w-3.5 h-3.5 text-[#00FF9D]" />
                  <span>R2K LAYER:</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm md:text-base font-mono font-bold text-white tracking-tight">
                    Kelly Aware
                  </div>
                  <SegmentedKellyBar percentage={68} />
                </div>
              </div>

              {/* Card 3: AI Conscious / Multi Model */}
              <div className="rounded-[4px] p-3 bg-[rgba(10,15,22,0.65)] backdrop-blur-md border border-[rgba(0,240,255,0.22)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#00F0FF]/50 transition-all duration-200">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] font-semibold tracking-wider uppercase mb-1">
                  <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>AI CONSENSUS:</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm md:text-base font-mono font-bold text-white tracking-tight">
                    Multi Model
                  </div>
                  <NeuralClusterIcon />
                </div>
              </div>
            </div>

            {/* 5. Gateway Action Button (Beveled Cybernetic Button) */}
            <div className="mt-5 md:mt-6 flex flex-col items-center gap-2.5 w-full max-w-[620px]">
              <button
                onClick={handleAccessTerminal}
                onMouseEnter={() => audio?.playHover()}
                disabled={glitching}
                className="w-full sm:w-[320px] py-3.5 px-6 clip-cyber-beveled neon-sweep-btn bg-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.2)] border border-[#00F0FF] text-white font-mono font-extrabold text-xs md:text-sm tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.35),inset_0_0_12px_rgba(0,240,255,0.15)] hover:shadow-[0_0_32px_rgba(0,240,255,0.6),inset_0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                style={{
                  textShadow: '0 0 10px rgba(0, 240, 255, 0.85)',
                }}
              >
                {glitching ? glitchText : '[ MASUK KE TERMINAL → ]'}
              </button>

              {/* Bypass Intro Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none py-1 group">
                <input
                  type="checkbox"
                  checked={bypassCheck}
                  onChange={e => handleToggleBypass(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-[2px] border border-[#1E293B] bg-[#0A0F16] accent-[#00F0FF] cursor-pointer focus:ring-0"
                />
                <span className="text-[10px] md:text-[10.5px] font-mono text-slate-400 group-hover:text-cyan-300 transition-colors">
                  bypass intro pada kunjungan berikutnya
                </span>
              </label>
            </div>
          </main>

          {/* ========================================================
              6. FULL-WIDTH TELEMETRY BAR: BOTTOM FOOTER
             ======================================================== */}
          <footer className="w-full h-10 px-4 md:px-8 bg-[rgba(5,7,10,0.85)] backdrop-blur-md border-t border-[rgba(0,240,255,0.12)] flex items-center justify-between text-[9px] md:text-[9.5px] font-mono tracking-[0.2em] text-slate-500 uppercase z-30">
            <div>FANTASMA SYNERGY SYSTEMS INC.</div>
            <div>ALL PROTOCOLS ENCRYPTED // [V4.0]</div>
          </footer>
        </motion.div>
      ) : (
        /* Transition to the Full Institutional Dashboard */
        <motion.div
          key="terminal-dashboard"
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="min-h-screen w-full bg-[#05070A]"
        >
          <DashboardPage
            onExit={() => {
              setAccessed(false);
              setIsBypassed(false);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
