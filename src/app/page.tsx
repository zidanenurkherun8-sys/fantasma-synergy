'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPage from './dashboard/page';

interface StarParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
}

interface StardustParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  pulse: number;
  color: string;
}

interface LuxuryPearl {
  ringRadius: number;
  angle: number;
  speed: number;
  tiltX: number;
  tiltZ: number;
  size: number;
  glow: string;
}

interface RotState {
  yaw: number;
  pitch: number;
  velYaw: number;
  velPitch: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

interface LuxuryRing {
  r: number;
  tiltX: number;
  tiltZ: number;
  width: number;
  baseAlpha: number;
}

interface ProjectedPoint {
  px: number;
  py: number;
  pz: number;
  pScale: number;
}

interface BrainNode {
  x: number;
  y: number;
  z: number;
  hemisphere: number;
  type: 'cortex' | 'cerebellum' | 'stem';
  pulse: number;
  size: number;
}

type BrainEdge = [number, number];

interface ActionPotential {
  edgeIdx: number;
  progress: number;
  speed: number;
  color: string;
}

interface IndodaxPair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high: number;
  low: number;
  volumeIdr: number;
  volumeCoin?: number;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CommandLogEntry {
  id: string;
  time: string;
  category: 'SYSTEM' | 'INDODAX' | 'ORACLE' | 'RISK';
  msg: string;
  status?: string;
  statusColor?: string;
}

type AudioFeedbackType = 'hover' | 'click';

export default function App(): React.JSX.Element {
  const [accessed, setAccessed] = useState<boolean>(false);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [bypassIntro, setBypassIntro] = useState<boolean>(false);

  // Left Panel State: Tabs & Settings
  const [leftTab, setLeftTab] = useState<'tradingview' | 'indodax'>('tradingview');
  const [selectedPair, setSelectedPair] = useState<string>('BTC/IDR');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [logFilter, setLogFilter] = useState<'ALL' | 'INDODAX' | 'ORACLE' | 'RISK'>('ALL');

  // Indodax Live Feed State (with robust institutional defaults)
  const [indodaxPairs, setIndodaxPairs] = useState<IndodaxPair[]>([
    {
      id: 'btc_idr',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 1486500000,
      change24h: 3.84,
      high: 1512000000,
      low: 1445000000,
      volumeIdr: 184500000000,
      volumeCoin: 124.5,
    },
    {
      id: 'eth_idr',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 54320000,
      change24h: 2.15,
      high: 55800000,
      low: 52900000,
      volumeIdr: 48900000000,
      volumeCoin: 902.1,
    },
    {
      id: 'usdt_idr',
      symbol: 'USDT',
      name: 'Tether USD',
      price: 16245,
      change24h: 0.08,
      high: 16290,
      low: 16190,
      volumeIdr: 92400000000,
      volumeCoin: 5690000,
    },
    {
      id: 'sol_idr',
      symbol: 'SOL',
      name: 'Solana',
      price: 3140000,
      change24h: 5.62,
      high: 3260000,
      low: 2970000,
      volumeIdr: 28500000000,
      volumeCoin: 9076,
    },
  ]);

  // Command Log Stream State
  const [logs, setLogs] = useState<CommandLogEntry[]>([
    {
      id: '1',
      time: '11:35:43 AM',
      category: 'SYSTEM',
      msg: 'DE METHODOLOGY ANALYZERS INITIALIZED (SAC, WYCKOFF, HARMONIC...)',
    },
    {
      id: '2',
      time: '11:35:43 AM',
      category: 'SYSTEM',
      msg: 'MULTI-TIMEFRAME ANALYSIS COMPLETE //',
      status: 'ACTIVE',
      statusColor: '#00f2fe',
    },
    {
      id: '3',
      time: '11:35:44 AM',
      category: 'INDODAX',
      msg: 'WSS TICKER GATEWAY CONNECTED [api.indodax.com]',
      status: '14MS',
      statusColor: '#10b981',
    },
    {
      id: '4',
      time: '11:35:44 AM',
      category: 'RISK',
      msg: 'HALF-KELLY CAPITAL PRESERVATION STRATEGY:',
      status: 'STABLE',
      statusColor: '#10b981',
    },
    {
      id: '5',
      time: '11:35:44 AM',
      category: 'ORACLE',
      msg: 'WARPING: TIME MACHINE VOLATILITY DETECTED:',
      status: 'HIGH',
      statusColor: '#00f2fe',
    },
    {
      id: '6',
      time: '11:35:45 AM',
      category: 'SYSTEM',
      msg: 'COGNITIVE ENCRYPTION COMPLETE //',
      status: 'CONNECTED',
      statusColor: '#10b981',
    },
    {
      id: '7',
      time: '11:35:46 AM',
      category: 'ORACLE',
      msg: 'TRADINGVIEW ENGINE READY [BTC/IDR 15M WYCKOFF ACCUMULATION]',
      status: 'SYNCED',
      statusColor: '#00f2fe',
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);
  const brainCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const tvCanvasRef = useRef<HTMLCanvasElement>(null);
  const telemetryTagRef = useRef<HTMLSpanElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real Indodax pairs if available
  useEffect(() => {
    let isMounted = true;
    const fetchMarket = async () => {
      try {
        const res = await fetch('/api/market/pairs?mode=CRYPTO');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.pairs && data.pairs.length > 0) {
          setIndodaxPairs(data.pairs.slice(0, 5));
        }
      } catch {
        // Retain robust default state
      }
    };

    fetchMarket();
    const interval = setInterval(fetchMarket, 9000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Periodic Live Command Log Streamer to make the terminal feel alive
  useEffect(() => {
    const liveStreamMessages: {
      category: 'SYSTEM' | 'INDODAX' | 'ORACLE' | 'RISK';
      msg: string;
      status?: string;
      statusColor?: string;
    }[] = [
      {
        category: 'INDODAX',
        msg: 'ORDERBOOK DEPTH SYNC: BIDS 53.4% VS ASKS 46.6% // SPREAD 0.02%',
        status: 'BALANCED',
        statusColor: '#10b981',
      },
      {
        category: 'ORACLE',
        msg: 'WYCKOFF SPRING RETEST CONFIRMED (VOLUME SPIKE 1.48x)',
        status: 'BULLISH',
        statusColor: '#00f2fe',
      },
      {
        category: 'RISK',
        msg: 'MAX ALLOWABLE DRAWDOWN CEILING: 2.5% [KELLY AWARE ON]',
        status: 'SECURE',
        statusColor: '#10b981',
      },
      {
        category: 'SYSTEM',
        msg: 'LATENCY BENCHMARK: TOKYO-SG-INDODAX ROUTE 12.4MS',
        status: 'OPTIMAL',
        statusColor: '#00f2fe',
      },
      {
        category: 'ORACLE',
        msg: 'NEURAL CLUSTER CONSENSUS: FOREX EUR/USD & BTC/IDR DECOUPLING',
        status: 'DIVERGENT',
        statusColor: '#f59e0b',
      },
    ];

    let step = 0;
    const interval = setInterval(() => {
      const entry = liveStreamMessages[step % liveStreamMessages.length];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: true });

      setLogs((prev) => [
        ...prev.slice(-12),
        {
          id: `${Date.now()}-${step}`,
          time: timeStr,
          category: entry.category,
          msg: entry.msg,
          status: entry.status,
          statusColor: entry.statusColor,
        },
      ]);

      step++;
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll command log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Cek preferensi bypass portal dari localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBypass = localStorage.getItem('fantasma_bypass_portal') === 'true';
      setBypassIntro(savedBypass);
      if (savedBypass) {
        setIsBypassed(true);
        setAccessed(true);
      }
    }
  }, []);

  const handleToggleBypass = (checked: boolean): void => {
    setBypassIntro(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fantasma_bypass_portal', checked ? 'true' : 'false');
    }
  };

  // Sintesis Suara Cybernetic Telemetri (Web Audio API)
  const playCyberSound = (type: AudioFeedbackType = 'click'): void => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1860, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      }
    } catch {
      // Abaikan jika autoplay audio dibatasi browser
    }
  };

  const handleEnterTerminal = (): void => {
    playCyberSound('click');
    setTimeout(() => {
      setAccessed(true);
    }, 280);
  };

  // --------------------------------------------------------------------------
  // 1. KANVAS LATAR BELAKANG: GRID SIBER, BINTANG, AMBIENT GLOW
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    let w = (canvas.width = canvas.parentElement.clientWidth);
    let h = (canvas.height = canvas.parentElement.clientHeight);

    const onResize = (): void => {
      if (!canvas || !canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);

    const stars: StarParticle[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.8 + 0.6,
        color:
          Math.random() > 0.4 ? '#00f2fe' : Math.random() > 0.5 ? '#c084fc' : '#38bdf8',
        alpha: Math.random() * 0.7 + 0.2,
      });
    }

    let time = 0;

    const render = (): void => {
      ctx.clearRect(0, 0, w, h);
      time += 0.01;

      // Grid Siber Latar Belakang
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 46;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Bintang Kosmik
      stars.forEach((s) => {
        s.alpha += Math.sin(time * 2 + s.x) * 0.008;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.12, Math.min(0.85, s.alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Soft Luxury Ambient Glow
      const cx = w * 0.5;
      const cy = h * 0.38;
      const flareGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 340);
      flareGrad.addColorStop(0, 'rgba(0, 242, 254, 0.09)');
      flareGrad.addColorStop(0.4, 'rgba(14, 165, 233, 0.03)');
      flareGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');

      ctx.save();
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 340, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [accessed]);

  // --------------------------------------------------------------------------
  // 1B. KANVAS 3D LUXURY CELESTIAL CORE (DRAGGABLE / TOUCH)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = globeCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const rot: RotState = {
      yaw: 0.42,
      pitch: 0.22,
      velYaw: 0.002,
      velPitch: 0,
      isDragging: false,
      lastX: 0,
      lastY: 0,
    };

    const stardustCount = 85;
    const stardust: StardustParticle[] = [];
    for (let i = 0; i < stardustCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 1.05 + Math.random() * 0.45;
      stardust.push({
        x: Math.sin(phi) * Math.cos(theta) * rad,
        y: Math.cos(phi) * rad,
        z: Math.sin(phi) * Math.sin(theta) * rad,
        size: Math.random() * 1.4 + 0.8,
        pulse: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? 'rgba(0, 242, 254,' : 'rgba(186, 230, 253,',
      });
    }

    const luxuryPearls: LuxuryPearl[] = [
      { ringRadius: 1.34, angle: 0.8, speed: 0.008, tiltX: 0.25, tiltZ: 0.95, size: 3.2, glow: '#00f2fe' },
      { ringRadius: 1.22, angle: 3.4, speed: -0.006, tiltX: 0.85, tiltZ: 0.35, size: 2.6, glow: '#ffffff' },
      { ringRadius: 1.48, angle: 1.9, speed: 0.005, tiltX: 0.55, tiltZ: 0.75, size: 2.2, glow: '#38bdf8' },
    ];

    const getClientCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      if ('touches' in e && e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if ('clientX' in e) {
        return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
      }
      return { x: 0, y: 0 };
    };

    const onPointerDown = (e: MouseEvent | TouchEvent): void => {
      rot.isDragging = true;
      rot.velYaw = 0;
      rot.velPitch = 0;
      const coords = getClientCoords(e);
      rot.lastX = coords.x;
      rot.lastY = coords.y;
      playCyberSound('hover');
    };

    const onPointerMove = (e: MouseEvent | TouchEvent): void => {
      if (!rot.isDragging) return;
      const coords = getClientCoords(e);
      const curX = coords.x;
      const curY = coords.y;
      const dx = curX - rot.lastX;
      const dy = curY - rot.lastY;

      rot.yaw += dx * 0.006;
      rot.pitch = Math.max(-1.1, Math.min(1.1, rot.pitch - dy * 0.006));

      rot.velYaw = dx * 0.004;
      rot.velPitch = -dy * 0.004;

      rot.lastX = curX;
      rot.lastY = curY;
    };

    const onPointerUp = (): void => {
      rot.isDragging = false;
    };

    const container = canvas.parentElement;
    if (!container) return;

    container.addEventListener('mousedown', onPointerDown as EventListener);
    window.addEventListener('mousemove', onPointerMove as EventListener);
    window.addEventListener('mouseup', onPointerUp as EventListener);
    container.addEventListener('touchstart', onPointerDown as EventListener, { passive: true });
    window.addEventListener('touchmove', onPointerMove as EventListener, { passive: true });
    window.addEventListener('touchend', onPointerUp as EventListener);

    let time = 0;

    const render = (): void => {
      if (!container) return;
      const w = (canvas.width = container.clientWidth || 460);
      const h = (canvas.height = container.clientHeight || 270);
      ctx.clearRect(0, 0, w, h);
      time += 0.015;

      if (!rot.isDragging) {
        rot.yaw += rot.velYaw;
        rot.pitch = Math.max(-1.1, Math.min(1.1, rot.pitch + rot.velPitch));
        rot.velYaw *= 0.95;
        rot.velPitch *= 0.95;

        if (Math.abs(rot.velYaw) < 0.001) {
          rot.yaw += 0.0025;
        }
      }

      if (telemetryTagRef.current) {
        const azDeg = Math.round(
          ((((rot.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180) / Math.PI
        );
        const elDeg = Math.round((rot.pitch * 180) / Math.PI);
        telemetryTagRef.current.innerText = `AZIMUTH: ${azDeg}° | ELEVATION: ${elDeg}° // ${
          rot.isDragging ? 'MANUAL NAVIGATION' : 'EQUILIBRIUM DRIFT'
        }`;
      }

      const levitation = Math.sin(time * 1.2) * 3.5;
      const cx = w * 0.5;
      const cy = h * 0.52 + levitation;
      const sphereR = Math.min(w * 0.26, h * 0.36, 88);

      const cosY = Math.cos(rot.yaw);
      const sinY = Math.sin(rot.yaw);
      const cosX = Math.cos(rot.pitch);
      const sinX = Math.sin(rot.pitch);
      const fov = 320;

      const projectPoint = (x: number, y: number, z: number, baseR: number): ProjectedPoint => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const pScale = fov / (fov + z2 * baseR);
        return {
          px: cx + x1 * baseR * pScale,
          py: cy + y2 * baseR * pScale,
          pz: z2,
          pScale,
        };
      };

      const luxuryRings: LuxuryRing[] = [
        { r: sphereR * 1.35, tiltX: 0.25, tiltZ: 0.95, width: 1.4, baseAlpha: 0.45 },
        { r: sphereR * 1.22, tiltX: 0.85, tiltZ: 0.35, width: 1.0, baseAlpha: 0.3 },
        { r: sphereR * 1.48, tiltX: 0.55, tiltZ: 0.75, width: 0.8, baseAlpha: 0.22 },
      ];

      const drawRingSegment = (ring: LuxuryRing, isFrontPass: boolean): void => {
        const segments = 100;
        const pts: (ProjectedPoint & { angle: number })[] = [];
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const rx = Math.cos(a) * ring.r;
          const ry = Math.sin(a) * ring.tiltX * ring.r;
          const rz = Math.sin(a) * ring.tiltZ * ring.r;
          const proj = projectPoint(rx / ring.r, ry / ring.r, rz / ring.r, ring.r);
          pts.push({ ...proj, angle: a });
        }

        ctx.save();
        ctx.lineWidth = ring.width;
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const isFront = p1.pz >= -0.05;

          if (isFront === isFrontPass) {
            const depthFactor = (p1.pz + 1) * 0.5;
            const alpha = Math.max(0.04, Math.min(0.85, ring.baseAlpha * (depthFactor * 1.4 + 0.2)));

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
            if (isFrontPass && p1.pz > 0.4) {
              ctx.shadowColor = 'rgba(0, 242, 254, 0.5)';
              ctx.shadowBlur = 6;
            } else {
              ctx.shadowBlur = 0;
            }
            ctx.stroke();
          }
        }
        ctx.restore();
      };

      luxuryRings.forEach((r) => drawRingSegment(r, false));

      const auraGrad = ctx.createRadialGradient(cx, cy, sphereR * 0.6, cx, cy, sphereR * 1.35);
      auraGrad.addColorStop(0, 'rgba(0, 242, 254, 0.16)');
      auraGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.06)');
      auraGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR * 1.35, 0, Math.PI * 2);
      ctx.fill();

      const sphereGrad = ctx.createRadialGradient(
        cx - sphereR * 0.32,
        cy - sphereR * 0.32,
        sphereR * 0.05,
        cx,
        cy,
        sphereR
      );
      sphereGrad.addColorStop(0, 'rgba(235, 254, 255, 0.95)');
      sphereGrad.addColorStop(0.18, 'rgba(0, 242, 254, 0.85)');
      sphereGrad.addColorStop(0.48, 'rgba(3, 105, 161, 0.45)');
      sphereGrad.addColorStop(0.82, 'rgba(8, 18, 38, 0.7)');
      sphereGrad.addColorStop(1, 'rgba(3, 7, 18, 0.95)');

      ctx.save();
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR, 0, Math.PI * 2);
      ctx.fill();

      const pulseWave = Math.sin(time * 2) * 4;
      const innerAura = ctx.createRadialGradient(
        cx + Math.sin(time) * 10,
        cy + Math.cos(time * 0.8) * 8,
        0,
        cx,
        cy,
        sphereR * 0.75 + pulseWave
      );
      innerAura.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      innerAura.addColorStop(0.4, 'rgba(0, 242, 254, 0.3)');
      innerAura.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = innerAura;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR * 0.75 + pulseWave, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      stardust.forEach((p) => {
        const proj = projectPoint(p.x, p.y, p.z, sphereR);
        const isFront = proj.pz > -0.15;
        const alphaPulse = Math.sin(time * 3 + p.pulse) * 0.25 + 0.75;
        const depthAlpha = Math.max(0.08, Math.min(1, (proj.pz + 1) * 0.5)) * alphaPulse;

        ctx.beginPath();
        ctx.arc(proj.px, proj.py, p.size * (isFront ? 1.15 : 0.75), 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${depthAlpha})`;
        if (isFront && proj.pz > 0.4) {
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      luxuryRings.forEach((r) => drawRingSegment(r, true));

      luxuryPearls.forEach((pearl) => {
        pearl.angle += pearl.speed;
        const rad = pearl.ringRadius * sphereR;
        const rx = Math.cos(pearl.angle) * rad;
        const ry = Math.sin(pearl.angle) * pearl.tiltX * rad;
        const rz = Math.sin(pearl.angle) * pearl.tiltZ * rad;
        const proj = projectPoint(rx / rad, ry / rad, rz / rad, rad);

        const isFront = proj.pz > -0.2;
        const alpha = Math.max(0.2, Math.min(1, (proj.pz + 1) * 0.55));

        ctx.save();
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, pearl.size * (isFront ? 1.3 : 0.8), 0, Math.PI * 2);
        ctx.fillStyle = pearl.glow;
        ctx.shadowColor = pearl.glow;
        ctx.shadowBlur = isFront ? 14 : 4;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onPointerDown as EventListener);
      window.removeEventListener('mousemove', onPointerMove as EventListener);
      window.removeEventListener('mouseup', onPointerUp as EventListener);
      container.removeEventListener('touchstart', onPointerDown as EventListener);
      window.removeEventListener('touchmove', onPointerMove as EventListener);
      window.removeEventListener('touchend', onPointerUp as EventListener);
    };
  }, [accessed]);

  // --------------------------------------------------------------------------
  // 1C. KANVAS TRADINGVIEW ("TRATING VIEW") PREVIEW MINI-CHART
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed || leftTab !== 'tradingview') return;
    const canvas = tvCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    // Generate high-resolution mock candles representing BTC/IDR Wyckoff accumulation
    const generateCandles = (): Candle[] => {
      const list: Candle[] = [];
      let base = 1450000000;
      const now = Math.floor(Date.now() / 1000);
      const count = 28;

      for (let i = 0; i < count; i++) {
        const trend = (i / count) * 35000000;
        const volatility = (Math.sin(i * 0.8) + Math.cos(i * 0.4)) * 9000000;
        const open = base + trend + volatility;
        const change = (Math.random() - 0.45) * 8000000;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 5000000;
        const low = Math.min(open, close) - Math.random() * 5000000;
        const volume = Math.random() * 85 + 25;
        list.push({ time: now - (count - i) * 900, open, high, low, close, volume });
      }
      return list;
    };

    const candleData = generateCandles();
    let tickCounter = 0;

    const renderChart = (): void => {
      if (!canvas.parentElement) return;
      const w = (canvas.width = canvas.parentElement.clientWidth || 320);
      const h = (canvas.height = canvas.parentElement.clientHeight || 155);

      ctx.clearRect(0, 0, w, h);
      tickCounter += 0.05;

      // Slight live wiggle on the last candle close
      const lastCandle = candleData[candleData.length - 1];
      const liveClose = lastCandle.close + Math.sin(tickCounter) * 1200000;

      // Calculate Min & Max for scaling
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let maxVol = 0;

      candleData.forEach((c, idx) => {
        const curClose = idx === candleData.length - 1 ? liveClose : c.close;
        minPrice = Math.min(minPrice, c.low, curClose);
        maxPrice = Math.max(maxPrice, c.high, curClose);
        maxVol = Math.max(maxVol, c.volume);
      });

      const padTop = 15;
      const padBottom = 25;
      const chartH = h - padTop - padBottom;
      const priceRange = maxPrice - minPrice || 1;
      const candleW = Math.max(4, (w - 50) / candleData.length - 3);

      const getY = (val: number): number => {
        return padTop + (1 - (val - minPrice) / priceRange) * chartH;
      };

      // 1. Gridlines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.lineWidth = 1;
      for (let gy = padTop; gy <= h - padBottom; gy += 30) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w - 45, gy);
        ctx.stroke();
      }

      // 2. Volume Histogram at Bottom
      const volHMax = 32;
      candleData.forEach((c, i) => {
        const x = i * (candleW + 3) + 12;
        const isGreen = c.close >= c.open;
        const vH = (c.volume / maxVol) * volHMax;
        ctx.fillStyle = isGreen ? 'rgba(0, 255, 157, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(x, h - padBottom - vH, candleW, vH);
      });

      // 3. EMA 8 (Cyan) & EMA 21 (Amber) Indicator Lines
      const drawEma = (period: number, color: string): void => {
        ctx.beginPath();
        let k = 2 / (period + 1);
        let ema = candleData[0].close;

        candleData.forEach((c, i) => {
          const cClose = i === candleData.length - 1 ? liveClose : c.close;
          ema = cClose * k + ema * (1 - k);
          const x = i * (candleW + 3) + 12 + candleW / 2;
          const y = getY(ema);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      };

      drawEma(8, '#00f2fe'); // EMA 8 (Cyan)
      drawEma(21, '#f59e0b'); // EMA 21 (Amber)

      // 4. Candlesticks (Green & Red)
      candleData.forEach((c, i) => {
        const curClose = i === candleData.length - 1 ? liveClose : c.close;
        const isGreen = curClose >= c.open;
        const x = i * (candleW + 3) + 12;
        const candleCenter = x + candleW / 2;

        const yOpen = getY(c.open);
        const yClose = getY(curClose);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);

        const color = isGreen ? '#00ff9d' : '#f43f5e';

        // Sumbu Lilin (Wick)
        ctx.beginPath();
        ctx.moveTo(candleCenter, yHigh);
        ctx.lineTo(candleCenter, yLow);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Badan Lilin (Body)
        const topY = Math.min(yOpen, yClose);
        const bodyH = Math.max(2, Math.abs(yClose - yOpen));
        ctx.fillStyle = color;
        ctx.fillRect(x, topY, candleW, bodyH);

        // Pendaran Lilin Terakhir (Current Live Price Pulse)
        if (i === candleData.length - 1) {
          ctx.beginPath();
          ctx.arc(candleCenter, yClose, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Garis Putus-Putus Menuju Sumbu Harga Kanan
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(candleCenter, yClose);
          ctx.lineTo(w, yClose);
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
          ctx.stroke();
          ctx.setLineDash([]);

          // Tag Harga Sisi Kanan
          ctx.fillStyle = isGreen ? '#10b981' : '#f43f5e';
          ctx.fillRect(w - 44, yClose - 8, 44, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((liveClose / 1000000).toFixed(1) + 'M', w - 22, yClose);
        }
      });

      animId = requestAnimationFrame(renderChart);
    };

    renderChart();
    return () => cancelAnimationFrame(animId);
  }, [accessed, leftTab]);

  // --------------------------------------------------------------------------
  // 2. KANVAS SPARKLINE BESAR (Kartu Kanan: 1s Ticks)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = sparklineCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const data: number[] = [
      18, 25, 20, 36, 28, 48, 38, 54, 42, 50, 68, 56, 74, 66, 82, 70, 88, 76, 94,
    ];
    let offset = 0;

    const drawSparkline = (): void => {
      if (!canvas.parentElement) return;
      const w = (canvas.width = canvas.parentElement.clientWidth || 240);
      const h = (canvas.height = canvas.parentElement.clientHeight || 110);

      ctx.clearRect(0, 0, w, h);
      offset += 0.045;

      const dynamicPoints = data.map((v, i) => {
        const wave = Math.sin(offset + i * 0.55) * 5;
        return {
          x: (i / (data.length - 1)) * w,
          y: h - ((v + wave) / 105) * (h * 0.82) - 6,
        };
      });

      ctx.beginPath();
      ctx.moveTo(dynamicPoints[0].x, dynamicPoints[0].y);
      for (let i = 1; i < dynamicPoints.length; i++) {
        ctx.lineTo(dynamicPoints[i].x, dynamicPoints[i].y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
      grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dynamicPoints[0].x, dynamicPoints[0].y);
      for (let i = 1; i < dynamicPoints.length; i++) {
        ctx.lineTo(dynamicPoints[i].x, dynamicPoints[i].y);
      }
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(drawSparkline);
    };

    drawSparkline();
    return () => cancelAnimationFrame(animId);
  }, [accessed]);

  // --------------------------------------------------------------------------
  // 3. KANVAS ANATOMICAL BRAIN 3D HOLOGRAM (Kartu Kanan: Multi-Model)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = brainCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const generateRealisticBrain = (): {
      nodes: BrainNode[];
      connections: BrainEdge[];
    } => {
      const nodes: BrainNode[] = [];
      const connections: BrainEdge[] = [];

      [-1, 1].forEach((hemisphere) => {
        const hOffset = hemisphere * 3.8;
        const hemiNodes: number[] = [];

        const latSteps = 8;
        const lonSteps = 10;
        for (let i = 1; i <= latSteps; i++) {
          const u = (i / (latSteps + 1)) * Math.PI;
          for (let j = 0; j < lonSteps; j++) {
            const v = (j / lonSteps) * Math.PI * 2;

            let bx = 16 * Math.sin(u) * Math.cos(v);
            let by = 19 * Math.cos(u);
            let bz = 24 * Math.sin(u) * Math.sin(v);

            if (bz > 0) {
              bx *= 1 + 0.12 * (bz / 24);
              by += 1.5 * (bz / 24);
            }
            if (bz < 0) {
              by -= 2.2 * Math.abs(bz / 24);
            }
            if (Math.abs(bz) < 12 && by < 2 && by > -12) {
              bx *= 1.28;
            }
            if (by < -10) {
              by *= 0.75;
            }

            const fold = Math.sin(u * 6 + v * 4) * 1.4 + Math.cos(u * 5 - v * 5) * 1.1;
            bx += (bx / 16) * fold;
            by += (by / 19) * fold;
            bz += (bz / 24) * fold;

            const nIdx = nodes.length;
            const nodeObj: BrainNode = {
              x: hemisphere * Math.abs(bx) + hOffset,
              y: -by,
              z: bz,
              hemisphere,
              type: 'cortex',
              pulse: Math.random() * Math.PI * 2,
              size: Math.random() * 1.4 + 1.2,
            };
            nodes.push(nodeObj);
            hemiNodes.push(nIdx);
          }
        }

        for (let c = 0; c < 12; c++) {
          const cTheta = (c / 12) * Math.PI * 2;
          const cRadius = 6.5 + Math.sin(c * 3) * 1.2;
          const nIdx = nodes.length;
          nodes.push({
            x: hemisphere * (cRadius * Math.cos(cTheta) * 0.75 + 7),
            y: 13 + Math.sin(cTheta * 2) * 2,
            z: -14 + Math.sin(cTheta) * 6,
            hemisphere,
            type: 'cerebellum',
            pulse: Math.random() * Math.PI * 2,
            size: 1.1,
          });
          hemiNodes.push(nIdx);
        }

        for (let a = 0; a < hemiNodes.length; a++) {
          for (let b = a + 1; b < hemiNodes.length; b++) {
            const idxA = hemiNodes[a];
            const idxB = hemiNodes[b];
            const dist = Math.hypot(
              nodes[idxA].x - nodes[idxB].x,
              nodes[idxA].y - nodes[idxB].y,
              nodes[idxA].z - nodes[idxB].z
            );
            if (dist < 10.5) {
              connections.push([idxA, idxB]);
            }
          }
        }
      });

      for (let s = 0; s < 7; s++) {
        const sY = 12 + s * 2.4;
        const stemIdx = nodes.length;
        nodes.push({
          x: Math.sin(s * 1.5) * 1.2,
          y: sY,
          z: -5 + s * 0.5,
          hemisphere: 0,
          type: 'stem',
          pulse: Math.random() * Math.PI * 2,
          size: 1.3,
        });
        if (s > 0) connections.push([stemIdx - 1, stemIdx]);
      }

      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'cortex' && Math.abs(nodes[i].x) < 7 && nodes[i].y < 2) {
          for (let j = i + 1; j < nodes.length; j++) {
            if (
              nodes[j].type === 'cortex' &&
              nodes[i].hemisphere !== nodes[j].hemisphere &&
              Math.abs(nodes[j].x) < 7
            ) {
              const d = Math.hypot(
                nodes[i].x - nodes[j].x,
                nodes[i].y - nodes[j].y,
                nodes[i].z - nodes[j].z
              );
              if (d < 11) {
                connections.push([i, j]);
              }
            }
          }
        }
      }

      return { nodes, connections };
    };

    const { nodes: brainNodes, connections: brainEdges } = generateRealisticBrain();

    const actionPotentials: ActionPotential[] = [];
    for (let p = 0; p < 22; p++) {
      actionPotentials.push({
        edgeIdx: Math.floor(Math.random() * brainEdges.length),
        progress: Math.random(),
        speed: 0.012 + Math.random() * 0.018,
        color: Math.random() > 0.35 ? '#00f2fe' : '#f43f5e',
      });
    }

    let angle = 0;

    const drawBrain = (): void => {
      if (!canvas.parentElement) return;
      const w = (canvas.width = canvas.parentElement.clientWidth || 220);
      const h = (canvas.height = canvas.parentElement.clientHeight || 115);

      ctx.clearRect(0, 0, w, h);
      angle += 0.012;

      const cx = w * 0.5;
      const cy = h * 0.48;
      const scale = Math.min(w, h) * 0.024;

      const pitch = 0.28;
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosYaw = Math.cos(angle);
      const sinYaw = Math.sin(angle);

      const projected = brainNodes.map((n) => {
        const x1 = n.x * cosYaw - n.z * sinYaw;
        const z1 = n.x * sinYaw + n.z * cosYaw;

        const y2 = n.y * cosPitch - z1 * sinPitch;
        const z2 = n.y * sinPitch + z1 * cosPitch;

        const fov = 140;
        const pScale = fov / (fov + z2);
        return {
          px: cx + x1 * scale * pScale,
          py: cy + y2 * scale * pScale,
          pz: z2,
          pScale,
          type: n.type,
          size: n.size,
        };
      });

      ctx.lineWidth = 0.85;
      brainEdges.forEach(([iA, iB]) => {
        const pA = projected[iA];
        const pB = projected[iB];
        const avgZ = (pA.pz + pB.pz) * 0.5;
        const alpha = Math.max(0.08, Math.min(0.48, (avgZ + 35) / 70));

        ctx.beginPath();
        ctx.moveTo(pA.px, pA.py);
        ctx.lineTo(pB.px, pB.py);
        ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
        ctx.stroke();
      });

      actionPotentials.forEach((pulse) => {
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) {
          pulse.progress = 0;
          pulse.edgeIdx = Math.floor(Math.random() * brainEdges.length);
        }

        const [iA, iB] = brainEdges[pulse.edgeIdx];
        const pA = projected[iA];
        const pB = projected[iB];

        const curX = pA.px + (pB.px - pA.px) * pulse.progress;
        const curY = pA.py + (pB.py - pA.py) * pulse.progress;
        const curZ = pA.pz + (pB.pz - pA.pz) * pulse.progress;

        if (curZ > -20) {
          ctx.beginPath();
          ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = pulse.color;
          ctx.shadowColor = pulse.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      projected.forEach((p) => {
        const isFront = p.pz > 0;
        const alpha = Math.max(0.18, Math.min(1, (p.pz + 30) / 60));
        const rad = Math.max(0.8, p.size * p.pScale * (isFront ? 1.1 : 0.8));

        ctx.beginPath();
        ctx.arc(p.px, p.py, rad, 0, Math.PI * 2);

        if (p.type === 'cortex') {
          ctx.fillStyle = isFront
            ? `rgba(0, 242, 254, ${alpha})`
            : `rgba(30, 144, 255, ${alpha * 0.6})`;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = isFront ? 6 : 0;
        } else if (p.type === 'cerebellum') {
          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = isFront ? 5 : 0;
        } else {
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(drawBrain);
    };

    drawBrain();
    return () => cancelAnimationFrame(animId);
  }, [accessed]);

  // Filtered command logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return logs;
    return logs.filter((l) => l.category === logFilter);
  }, [logs, logFilter]);

  if (isBypassed && accessed) {
    return (
      <DashboardPage
        onExit={() => {
          setAccessed(false);
          setIsBypassed(false);
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!accessed ? (
        <motion.div
          key="gateway-portal"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            filter: 'blur(10px)',
            transition: { duration: 0.4, ease: 'easeInOut' },
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative min-h-screen w-full bg-[#04060A] text-slate-100 flex flex-col justify-between overflow-hidden font-mono select-none"
        >
          <style>{`
            .cyber-button {
              position: relative;
              background: rgba(0, 242, 254, 0.08);
              clip-path: polygon(
                14px 0%, 
                calc(100% - 14px) 0%, 
                100% 14px, 
                100% calc(100% - 14px), 
                calc(100% - 14px) 100%, 
                14px 100%, 
                0% calc(100% - 14px), 
                0% 14px
              );
            }

            .cyber-border-wrap {
              position: relative;
              clip-path: polygon(
                14px 0%, 
                calc(100% - 14px) 0%, 
                100% 14px, 
                100% calc(100% - 14px), 
                calc(100% - 14px) 100%, 
                14px 100%, 
                0% calc(100% - 14px), 
                0% 14px
              );
              padding: 1.5px;
              background: linear-gradient(135deg, #00f2fe 0%, rgba(0, 242, 254, 0.45) 50%, #00f2fe 100%);
              box-shadow: 0 0 25px rgba(0, 242, 254, 0.45);
              transition: all 0.3s ease;
            }

            .cyber-border-wrap:hover {
              box-shadow: 0 0 45px rgba(0, 242, 254, 0.85);
              transform: translateY(-1px);
            }

            .hud-corner-tl {
              position: absolute;
              top: 18px;
              left: 18px;
              width: 26px;
              height: 26px;
              border-top: 2px solid #00f2fe;
              border-left: 2px solid #00f2fe;
              pointer-events: none;
              z-index: 30;
            }
            .hud-corner-tr {
              position: absolute;
              top: 18px;
              right: 18px;
              width: 26px;
              height: 26px;
              border-top: 2px solid #00f2fe;
              border-right: 2px solid #00f2fe;
              pointer-events: none;
              z-index: 30;
            }
            .hud-corner-bl {
              position: absolute;
              bottom: 18px;
              left: 18px;
              width: 26px;
              height: 26px;
              border-bottom: 2px solid #00f2fe;
              border-left: 2px solid #00f2fe;
              pointer-events: none;
              z-index: 30;
            }
            .hud-corner-br {
              position: absolute;
              bottom: 18px;
              right: 18px;
              width: 26px;
              height: 26px;
              border-bottom: 2px solid #00f2fe;
              border-right: 2px solid #00f2fe;
              pointer-events: none;
              z-index: 30;
            }
          `}</style>

          {/* 4 Corner HUD Brackets */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* Kanvas Latar Belakang Siber & Radar */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* ========================================================================
              HEADER BAR
          ======================================================================== */}
          <header className="relative z-20 w-full px-8 lg:px-12 pt-5 pb-1 flex items-center justify-between text-[11px] tracking-wider">
            {/* Top-Left Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-[#080d1a]/85 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <span className="text-cyan-400 text-xs">🛡</span>
              <span className="text-cyan-300 font-semibold tracking-widest text-[10.5px]">
                COGNITIVE CRYPTO SHIELD ACTIVE
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[9px] text-slate-400 hidden sm:inline">
                GATEWAY SEC: 256-BIT
              </span>
            </div>

            {/* Top-Center Live UTC Clock */}
            <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400 font-mono tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>INDODAX REST/WSS: CONNECTED</span>
              </span>
              <span className="text-slate-600">//</span>
              <span className="text-cyan-300">TRADINGVIEW ENGINE: ACTIVE</span>
            </div>

            {/* Top-Right Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#080d1a]/85 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <span className="text-cyan-400 text-xs">((i))</span>
              <span className="text-slate-300 font-medium tracking-wider text-[10.5px]">
                SYS_STATUS:
              </span>
              <span className="text-cyan-400 font-bold text-[10.5px]">CRYPTED</span>
              <span className="text-slate-500">//</span>
              <span className="text-emerald-400 font-bold text-[10.5px]">ONLINE</span>
            </div>
          </header>

          {/* ========================================================================
              WORKSPACE 3-PANEL COMMAND DECK (FULL-WIDTH 16:9 COCKPIT)
          ======================================================================== */}
          <main className="relative z-10 w-full max-w-[1640px] mx-auto px-6 lg:px-10 my-auto grid grid-cols-12 gap-6 items-center py-3">
            {/* ======================================================================
                PANEL KIRI (WIDGET GANDA): 
                1. PREVIEW TRADINGVIEW & INDODAX API PREVIEW
                2. COMMAND LOG STREAM & TERMINAL KONTROL
            ====================================================================== */}
            <div className="col-span-12 xl:col-span-4 lg:col-span-4 flex flex-col gap-3.5">
              {/* --------------------------------------------------------------------
                  WIDGET 1 (ATAS): PREVIEW TRADINGVIEW & API INDODAX
              -------------------------------------------------------------------- */}
              <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/90 backdrop-blur-xl p-3.5 shadow-[0_10px_35px_rgba(0,242,254,0.1)] flex flex-col justify-between">
                {/* Header Switcher: TradingView vs Indodax API */}
                <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setLeftTab('tradingview');
                        playCyberSound('hover');
                      }}
                      className={`px-2.5 py-1 rounded text-[9.5px] font-bold tracking-wider transition-all cursor-pointer ${
                        leftTab === 'tradingview'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📊 TRADINGVIEW
                    </button>
                    <button
                      onClick={() => {
                        setLeftTab('indodax');
                        playCyberSound('hover');
                      }}
                      className={`px-2.5 py-1 rounded text-[9.5px] font-bold tracking-wider transition-all cursor-pointer ${
                        leftTab === 'indodax'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚡ INDODAX API
                    </button>
                  </div>

                  {/* Indicator / Status Badge */}
                  <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE 14MS</span>
                  </div>
                </div>

                {/* TAB 1: TRADINGVIEW ("TRATING VIEW") PREVIEW */}
                {leftTab === 'tradingview' ? (
                  <div className="pt-2">
                    {/* Toolbar Mini TradingView */}
                    <div className="flex items-center justify-between text-[9px] mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[11px] tracking-wide">
                          {selectedPair}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8.5px] font-bold border border-emerald-500/30">
                          +3.84%
                        </span>
                      </div>

                      {/* Timeframe Switcher Buttons */}
                      <div className="flex items-center gap-1 text-[8px] bg-slate-900/60 p-0.5 rounded border border-slate-700/60">
                        {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
                          <button
                            key={tf}
                            onClick={() => {
                              setTimeframe(tf);
                              playCyberSound('hover');
                            }}
                            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              timeframe === tf
                                ? 'bg-cyan-500 text-black font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kanvas Candlestick TradingView Realistis */}
                    <div className="w-full h-[140px] relative rounded-lg bg-[#040813] border border-cyan-500/20 overflow-hidden">
                      <canvas ref={tvCanvasRef} className="w-full h-full block" />
                      
                      {/* Watermark Indikator Wyckoff di Sudut */}
                      <div className="absolute top-1.5 left-2 pointer-events-none text-[7.5px] font-mono text-cyan-400/70">
                        EMA 8: <span className="text-[#00f2fe]">CYAN</span> | EMA 21: <span className="text-[#f59e0b]">AMBER</span> // WYCKOFF ACCUMULATION
                      </div>
                    </div>

                    {/* Footer Info TradingView */}
                    <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1.5 font-mono">
                      <span>RSI: 58.4 (BULLISH BIAS)</span>
                      <span className="text-cyan-400">VOL: 148.2 BTC // 24H</span>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: INDODAX API PREVIEW */
                  <div className="pt-2 font-mono">
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 mb-2 border-b border-cyan-500/15 pb-1">
                      <span>ENDPOINT: <span className="text-cyan-300">api.indodax.com/api/summaries</span></span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>

                    {/* Ticker List Indodax */}
                    <div className="space-y-1.5 mb-2.5">
                      {indodaxPairs.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-2 py-1 rounded bg-[#091024]/60 border border-slate-800 text-[9px] hover:border-cyan-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{p.symbol}/IDR</span>
                            <span className="text-[7.5px] text-slate-500 hidden sm:inline">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-200">
                              Rp {p.price >= 1000000 ? (p.price / 1000000).toFixed(2) + 'M' : p.price.toLocaleString('id-ID')}
                            </span>
                            <span
                              className={`text-[8px] font-bold ${
                                p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {p.change24h >= 0 ? `+${p.change24h.toFixed(2)}%` : `${p.change24h.toFixed(2)}%`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Book Depth Bar Ratio (Bids vs Asks) */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                        <span className="text-emerald-400">BUY DEPTH (53.4%)</span>
                        <span className="text-rose-400">SELL DEPTH (46.6%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: '53.4%' }} />
                        <div className="h-full bg-rose-500" style={{ width: '46.6%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------
                  WIDGET 2 (BAWAH): COMMAND LOG STREAM & TERMINAL DIAGNOSTIK
              -------------------------------------------------------------------- */}
              <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/90 backdrop-blur-xl p-3.5 shadow-[0_10px_35px_rgba(0,242,254,0.1)] flex flex-col justify-between">
                {/* Header Command Log & Filter Tabs */}
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 text-[9px]">
                  <div className="flex items-center gap-1.5 font-bold text-white tracking-wider">
                    <span className="text-cyan-400">⌨</span>
                    <span>COMMAND LOG</span>
                  </div>

                  <div className="flex items-center gap-1 text-[7.5px]">
                    {(['ALL', 'INDODAX', 'ORACLE', 'RISK'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setLogFilter(cat);
                          playCyberSound('hover');
                        }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          logFilter === cat
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log Stream Box dengan Auto-Scroll */}
                <div
                  ref={logContainerRef}
                  className="space-y-1.5 py-2 font-mono text-[8.5px] max-h-[155px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-cyan-500/30"
                >
                  {filteredLogs.map((item) => (
                    <div key={item.id} className="leading-relaxed hover:bg-cyan-500/5 px-1 py-0.5 rounded transition-colors">
                      <span className="text-slate-500">[{item.time}]</span>{' '}
                      <span className="text-cyan-400 font-bold">{item.category}:</span>{' '}
                      <span className="text-slate-200">{item.msg}</span>{' '}
                      {item.status && (
                        <span
                          className="font-bold tracking-wider text-[8px] px-1 py-0.2 rounded bg-cyan-950/40"
                          style={{ color: item.statusColor || '#00f2fe' }}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Interactive CLI Prompt Line */}
                <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1 text-cyan-300">
                    <span className="text-emerald-400">root@fantasma-v4:~$</span>
                    <span>scan --wyckoff --indodax</span>
                    <span className="w-1.5 h-3 bg-cyan-400 animate-pulse ml-0.5" />
                  </div>
                  <span className="text-slate-500 hidden sm:inline">BUF: 100%</span>
                </div>
              </div>
            </div>

            {/* ======================================================================
                PANEL TENGAH: 3D LUXURY CELESTIAL CORE & BRANDING UTAMA
            ====================================================================== */}
            <div className="col-span-12 xl:col-span-5 lg:col-span-5 flex flex-col items-center text-center justify-center pt-1 pb-4">
              {/* VIEWPORT 3D CELESTIAL CORE INTERAKTIF (BISA DIGERAKKAN/DRAGGABLE) */}
              <div className="relative w-full max-w-[440px] h-[230px] sm:h-[260px] flex items-center justify-center cursor-grab active:cursor-grabbing mb-1 group">
                <canvas ref={globeCanvasRef} className="w-full h-full block" />

                {/* HUD Status Badge dengan Desain Horologi Mewah */}
                <div className="absolute bottom-1 px-3 py-1 rounded-full border border-cyan-500/25 bg-[#070b16]/90 text-[8.5px] font-mono text-cyan-300/90 flex items-center gap-2 pointer-events-none backdrop-blur-xl shadow-[0_4px_20px_rgba(0,242,254,0.12)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] animate-pulse" />
                  <span ref={telemetryTagRef}>AZIMUTH: 0° | ELEVATION: 0°</span>
                  <span className="text-slate-500 text-[7.5px] pl-1 border-l border-slate-700/60 hidden sm:inline">
                    TOUCH & DRAG
                  </span>
                </div>
              </div>

              {/* JUDUL BESAR: FANTASMA SYNERGY */}
              <div className="mb-1 relative">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0f9ff] to-[#38bdf8] drop-shadow-[0_0_40px_rgba(0,242,254,0.7)] uppercase">
                  FANTASMA
                </h1>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0f9ff] to-[#38bdf8] drop-shadow-[0_0_40px_rgba(0,242,254,0.7)] uppercase -mt-2">
                  SYNERGY
                </h2>
              </div>

              {/* SUBTITLE */}
              <p className="text-[9.5px] sm:text-[10.5px] font-mono tracking-[0.22em] text-cyan-300/90 mb-6 max-w-xl">
                QUANTITATIVE ORACLE INVESTMENT TERMINAL v4.0 &nbsp;|&nbsp; FOREX + CRYPTO
              </p>

              {/* TOMBOL UTAMA: [ MASUK KE TERMINAL → ] */}
              <div className="cyber-border-wrap mb-3.5">
                <button
                  onClick={handleEnterTerminal}
                  onMouseEnter={() => playCyberSound('hover')}
                  className="cyber-button px-9 py-2.5 text-xs sm:text-sm font-black tracking-[0.22em] text-cyan-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>[ MASUK KE TERMINAL → ]</span>
                </button>
              </div>

              {/* Checkbox: bypass intro pada kunjungan berikutnya */}
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={bypassIntro}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleToggleBypass(e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded border border-cyan-500/60 bg-[#080d19] accent-cyan-500 cursor-pointer"
                />
                <span>bypass intro pada kunjungan berikutnya</span>
              </label>
            </div>

            {/* ======================================================================
                PANEL KANAN: 3 KARTU METRIK & HARDWARE FADER SLIDERS
            ====================================================================== */}
            <div className="col-span-12 xl:col-span-3 lg:col-span-3 flex items-start gap-3.5">
              {/* Kolom 3 Kartu Metrik */}
              <div className="flex-1 space-y-3">
                {/* KARTU 1: 1s Ticks */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">📈</span>
                      <span>1s Ticks</span>
                    </div>
                    <span className="text-[8.5px] font-mono text-emerald-400">ACTIVE FEED</span>
                  </div>
                  <div className="w-full h-18 relative">
                    <canvas ref={sparklineCanvasRef} className="w-full h-full block" />
                  </div>
                </div>

                {/* KARTU 2: Kelly Aware */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">📊</span>
                      <span>Kelly Aware</span>
                    </div>
                    <span className="text-[8.5px] font-mono text-cyan-400">CAPITAL GUARD</span>
                  </div>

                  {/* Diagram Tangga / Stepped Ascending Bars */}
                  <div className="flex items-end justify-between gap-1.5 h-10 px-1 mb-2">
                    {[14, 20, 26, 34, 42].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-cyan-600 via-teal-400 to-[#10b981] shadow-[0_0_8px_rgba(0,242,254,0.4)]"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="pt-0.5">
                    <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mb-1">
                      <span>RISK PROGRESS:</span>
                      <span className="text-cyan-400 font-bold">76%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden p-[1px]">
                      <div className="w-[76%] h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#10b981] shadow-[0_0_8px_#00f2fe]" />
                    </div>
                  </div>
                </div>

                {/* KARTU 3: Multi-Model */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">🧠</span>
                      <span>Multi-Model</span>
                    </div>
                    <div className="flex items-center gap-1 text-[8.5px] font-mono text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>NEURAL 3D</span>
                    </div>
                  </div>
                  <div className="w-full h-24 relative">
                    <canvas ref={brainCanvasRef} className="w-full h-full block" />
                  </div>
                  <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-500 pt-1 border-t border-cyan-500/15">
                    <span>SYNAPSES: 4,120</span>
                    <span className="text-purple-400">HEMISPHERES: L / R</span>
                  </div>
                </div>
              </div>

              {/* Telemetri Tepi Kanan (Slider & Fader Hardware Mixer) */}
              <div className="flex flex-col items-center gap-2 text-[9px] text-slate-400 pt-2">
                <div className="text-[8px] font-mono text-slate-400">LATENCY:</div>
                <div className="text-cyan-400 font-bold text-[9px]">~12MS</div>
                <div className="text-[7.5px] font-mono text-slate-500">68602800</div>

                {/* Slider Fader Audio / Hardware Mixer */}
                <div className="flex flex-col items-center gap-3.5 py-1.5">
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-slate-500">S6002:</span>
                    <div className="w-1.5 h-11 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-2.5 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-slate-500">USCO2</span>
                    <div className="w-1.5 h-11 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-5 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-slate-500">OA80:</span>
                    <div className="w-1.5 h-11 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-1.5 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>
                </div>

                <div className="text-[7px] text-slate-500 pt-0.5 tracking-tighter">
                  LANTER SENSOR
                </div>
              </div>
            </div>
          </main>

          {/* ========================================================================
              FOOTER TELEMETRY STATUS BAR
          ======================================================================== */}
          <footer className="relative z-20 w-full px-8 lg:px-12 py-4 flex items-center justify-between text-[10px] tracking-widest text-slate-500 font-mono">
            <div>FANTASMA SYNERGY SYSTEMS INC.</div>
            <div className="hidden md:flex items-center gap-4 text-[9px] text-slate-400">
              <span>TRADINGVIEW CHART ENGINE: V2.4</span>
              <span>•</span>
              <span>INDODAX GATEWAY: ACTIVE (IDR_MARKET)</span>
            </div>
            <div>ALL PROTOCOLS ENCRYPTED // [v4.0]</div>
          </footer>
        </motion.div>
      ) : (
        /* Transition to Institutional Dashboard */
        <motion.div
          key="terminal-dashboard"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            filter: 'blur(10px)',
            transition: { duration: 0.4, ease: 'easeInOut' },
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
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
