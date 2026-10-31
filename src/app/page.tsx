'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPage from './dashboard/page';

export interface LogEntry {
  time: string;
  tag: string;
  msg: string;
  status?: string;
  statusColor?: string;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  speed: number;
}

interface SphereNode {
  phi: number;
  theta: number;
  size: number;
}

interface ProjectedNode {
  x: number;
  y: number;
  z: number;
  alpha: number;
  size: number;
}

interface DegreeLabel {
  deg: number;
  text: string;
}

interface BrainNode {
  x: number;
  y: number;
  z: number;
}

type AudioFeedbackType = 'hover' | 'click';

export default function App(): React.JSX.Element {
  const [accessed, setAccessed] = useState<boolean>(false);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [bypassIntro, setBypassIntro] = useState<boolean>(false);

  const [logs] = useState<LogEntry[]>([
    {
      time: '11:35:43 AM',
      tag: 'SYSTEM:',
      msg: 'DE METHODOLOGY ANALYZERS',
      status: 'INITIALIZED (SAC, WYCKOFF, HARMONIC...)',
      statusColor: '#10b981',
    },
    {
      time: '11:35:43 AM',
      tag: 'SYSTEM:',
      msg: 'MULTI-TIMEFRAME ANALYSIS COMPLETE //',
      status: 'ACTIVE',
      statusColor: '#00f2fe',
    },
    {
      time: '11:35:44 AM',
      tag: 'SYSTEM:',
      msg: 'HALF-KELLY CAPITAL PRESERVATION STRATEGY:',
      status: 'STABLE',
      statusColor: '#10b981',
    },
    {
      time: '11:35:44 AM',
      tag: 'SYSTEM:',
      msg: 'WARPING: TIME MACHINE VOLATILITY DETECTED:',
      status: 'HIGH',
      statusColor: '#10b981',
    },
    {
      time: '11:35:45 AM',
      tag: 'SYSTEM:',
      msg: 'COGNITIVE ENCRYPTION COMPLETE //',
      status: 'CONNECTED',
      statusColor: '#10b981',
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brainCanvasRef = useRef<HTMLCanvasElement>(null);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Check saved bypass portal preference on mount
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

  // Sintesis Suara Cybernetic Audio menggunakan Web Audio API
  const playCyberSound = (type: AudioFeedbackType = 'click'): void => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Abaikan jika browser membatasi audio tanpa interaksi awal
    }
  };

  const handleEnterTerminal = (): void => {
    playCyberSound('click');
    setTimeout(() => {
      setAccessed(true);
    }, 280);
  };

  // -------------------------------------------------------------
  // 1. CANVAS UTAMA: Celestial Holographic Radar, Degrees & Sphere
  // -------------------------------------------------------------
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

    // Kumpulan partikel bintang kosmik di latar belakang
    const stars: StarParticle[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.8 + 0.5,
        color: Math.random() > 0.4 ? '#00f2fe' : Math.random() > 0.5 ? '#c084fc' : '#38bdf8',
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    // Titik-titik pada permukaan bola 3D (Spherical Constellation)
    const sphereNodes: SphereNode[] = [];
    const numNodes = 42;
    for (let i = 0; i < numNodes; i++) {
      const phi = Math.acos(-1 + (2 * i) / numNodes);
      const theta = Math.sqrt(numNodes * Math.PI) * phi;
      sphereNodes.push({ phi, theta, size: Math.random() * 2 + 1.5 });
    }

    let angle = 0;

    const render = (): void => {
      ctx.clearRect(0, 0, w, h);
      angle += 0.008;

      // Pusat Radar (Tepat di atas title "FANTASMA SYNERGY")
      const cx = w * 0.5;
      const cy = h * 0.36;
      const baseR = Math.min(w * 0.24, 210);

      // (A) Gambar Grid Latar Belakang Siber & Crosshairs
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 48;
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

      // (B) Bintang-bintang Kosmik Berkedip
      stars.forEach((s) => {
        s.alpha += Math.sin(angle * 2 + s.x) * 0.01;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, s.alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // (C) Wireframe Proyeksi Ruang Isometrik di Sisi Kiri & Kanan Belakang
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.lineWidth = 1;
      // Grid kiri
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.65);
      ctx.lineTo(w * 0.24, h * 0.68);
      ctx.lineTo(w * 0.22, h * 0.74);
      ctx.lineTo(w * 0.1, h * 0.71);
      ctx.closePath();
      ctx.stroke();

      // Grid kanan
      ctx.beginPath();
      ctx.moveTo(w * 0.76, h * 0.64);
      ctx.lineTo(w * 0.88, h * 0.61);
      ctx.lineTo(w * 0.9, h * 0.67);
      ctx.lineTo(w * 0.78, h * 0.7);
      ctx.closePath();
      ctx.stroke();

      // (D) Anamorphic Horizontal Lens Flare Streak (Menyilang di pusat)
      const flareGrad = ctx.createLinearGradient(cx - baseR * 2.2, cy, cx + baseR * 2.2, cy);
      flareGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      flareGrad.addColorStop(0.35, 'rgba(0, 242, 254, 0.15)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.75)');
      flareGrad.addColorStop(0.65, 'rgba(0, 242, 254, 0.15)');
      flareGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - baseR * 2.2, cy);
      ctx.lineTo(cx + baseR * 2.2, cy);
      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // (E) Cincin Lingkaran Radar Holografis Luar dengan Skala Derajat
      ctx.save();
      ctx.translate(cx, cy);

      // Cincin Busur Utama Berpendar (Cyan Glow Outer Ring)
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cincin Busur Konsentris Sekunder
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.88, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Lingkaran Putus-putus
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.94, 0, Math.PI * 2);
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Garis Skala Derajat & Label Teks Derajat (0°, 10°, 20°, ... 370°)
      const degreeLabels: DegreeLabel[] = [
        { deg: 0, text: '0°' },
        { deg: 10, text: '10°' },
        { deg: 20, text: '20°' },
        { deg: 30, text: '30°' },
        { deg: 40, text: '40°' },
        { deg: 60, text: '60°' },
        { deg: 70, text: '70°' },
        { deg: 80, text: '80°' },
        { deg: 90, text: '90°' },
        { deg: 130, text: '130°' },
        { deg: 160, text: '160°' },
        { deg: 180, text: '180°' },
        { deg: 290, text: '290°' },
        { deg: 320, text: '320°' },
        { deg: 330, text: '330°' },
        { deg: 370, text: '370°' },
      ];

      // Gambar semua garis tick kecil di sepanjang keliling lingkaran
      for (let d = 0; d < 360; d += 3) {
        const rad = (d - 90) * (Math.PI / 180);
        const isMajor = d % 15 === 0;
        const tickLength = isMajor ? 9 : 4.5;
        const rInner = baseR - tickLength;
        const rOuter = baseR;

        const x1 = Math.cos(rad) * rInner;
        const y1 = Math.sin(rad) * rInner;
        const x2 = Math.cos(rad) * rOuter;
        const y2 = Math.sin(rad) * rOuter;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? 'rgba(0, 242, 254, 0.7)' : 'rgba(0, 242, 254, 0.3)';
        ctx.lineWidth = isMajor ? 1.4 : 0.8;
        ctx.stroke();
      }

      // Cetak Teks Derajat
      ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      degreeLabels.forEach((item) => {
        const rad = (item.deg - 90) * (Math.PI / 180);
        const tr = baseR + 13;
        const tx = Math.cos(rad) * tr;
        const ty = Math.sin(rad) * tr;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rad + Math.PI / 2);
        ctx.fillText(item.text, 0, 0);
        ctx.restore();
      });

      // (F) Satelit / Mutiara Sian Mengorbit di Busur Lingkaran Atas
      const orbitAngle = -Math.PI * 0.45 + Math.sin(angle * 0.7) * 0.4;
      const orbX = Math.cos(orbitAngle) * baseR;
      const orbY = Math.sin(orbitAngle) * baseR;

      ctx.beginPath();
      ctx.arc(orbX, orbY, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inti putih satelit
      ctx.beginPath();
      ctx.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // (G) Bola Selestial 3D (3D Celestial Globe Latitudes & Rotating Nodes)
      const sphereRadius = baseR * 0.72;

      // Elips garis lintang / bujur 3D
      const tilts: number[] = [-0.65, -0.25, 0.25, 0.7];
      tilts.forEach((tilt, idx) => {
        ctx.save();
        ctx.rotate(angle * (idx % 2 === 0 ? 0.3 : -0.2) + idx);
        ctx.beginPath();
        ctx.ellipse(0, 0, sphereRadius, sphereRadius * Math.abs(Math.sin(tilt + 1)), 0, 0, Math.PI * 2);
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(0, 242, 254, 0.22)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Proyeksi 3D Nodes pada Permukaan Bola
      const projected: ProjectedNode[] = [];
      sphereNodes.forEach((node) => {
        const currentTheta = node.theta + angle * 0.4;
        const currentPhi = node.phi;

        const x3 = sphereRadius * Math.sin(currentPhi) * Math.cos(currentTheta);
        const y3 = sphereRadius * Math.cos(currentPhi);
        const z3 = sphereRadius * Math.sin(currentPhi) * Math.sin(currentTheta);

        const alphaNorm = (z3 + sphereRadius) / (2 * sphereRadius);
        projected.push({ x: x3, y: y3, z: z3, alpha: alphaNorm, size: node.size });
      });

      // Hubungkan garis antar titik terdekat di bola
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.18)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < sphereRadius * 0.38) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Gambar simpul titik pada bola
      projected.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (0.6 + p.alpha * 0.5)), 0, Math.PI * 2);
        ctx.fillStyle = p.z > 0 ? '#00f2fe' : 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = p.z > 0 ? 8 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [accessed]);

  // -------------------------------------------------------------
  // 2. CANVAS SPARKLINE (Kartu: 1s Ticks)
  // -------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = sparklineCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const data: number[] = [22, 26, 19, 32, 28, 42, 35, 50, 38, 45, 55, 48, 62, 58, 68, 60, 75, 70, 82];
    let offset = 0;

    const drawSparkline = (): void => {
      if (!canvas.parentElement) return;
      const w = (canvas.width = canvas.parentElement.clientWidth || 100);
      const h = (canvas.height = canvas.parentElement.clientHeight || 40);

      ctx.clearRect(0, 0, w, h);
      offset += 0.05;

      const dynamicPoints = data.map((v, i) => {
        const wave = Math.sin(offset + i * 0.6) * 6;
        return {
          x: (i / (data.length - 1)) * w,
          y: h - ((v + wave) / 100) * (h * 0.8) - 4,
        };
      });

      // Garis Waveform
      ctx.beginPath();
      ctx.moveTo(dynamicPoints[0].x, dynamicPoints[0].y);
      for (let i = 1; i < dynamicPoints.length; i++) {
        ctx.lineTo(dynamicPoints[i].x, dynamicPoints[i].y);
      }
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Garis Area Bawah Lembut
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
      grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      animId = requestAnimationFrame(drawSparkline);
    };

    drawSparkline();
    return () => cancelAnimationFrame(animId);
  }, [accessed]);

  // -------------------------------------------------------------
  // 3. CANVAS BRAIN CLUSTER (Kartu: Multi Model)
  // -------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = brainCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const brainNodes: BrainNode[] = [
      { x: -14, y: -8, z: 2 },
      { x: -18, y: -2, z: -4 },
      { x: -16, y: 6, z: 4 },
      { x: -10, y: 12, z: -2 },
      { x: -4, y: 14, z: 5 },
      { x: -2, y: -10, z: -5 },
      { x: -8, y: -14, z: 4 },
      { x: 14, y: -8, z: -2 },
      { x: 18, y: -2, z: 4 },
      { x: 16, y: 6, z: -4 },
      { x: 10, y: 12, z: 2 },
      { x: 4, y: 14, z: -5 },
      { x: 2, y: -10, z: 5 },
      { x: 8, y: -14, z: -4 },
      { x: 0, y: 0, z: 6 },
      { x: -6, y: 2, z: -6 },
      { x: 6, y: 2, z: 6 },
    ];

    let t = 0;

    const drawBrain = (): void => {
      if (!canvas.parentElement) return;
      const w = (canvas.width = canvas.parentElement.clientWidth || 50);
      const h = (canvas.height = canvas.parentElement.clientHeight || 45);

      ctx.clearRect(0, 0, w, h);
      t += 0.02;

      const cx = w * 0.5;
      const cy = h * 0.5;

      const rot = brainNodes.map((n) => {
        const cos = Math.cos(t);
        const sin = Math.sin(t);
        const rx = n.x * cos - n.z * sin;
        const rz = n.x * sin + n.z * cos;
        return { x: cx + rx * 1.1, y: cy + n.y * 1.1, z: rz };
      });

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < rot.length; i++) {
        for (let j = i + 1; j < rot.length; j++) {
          const d = Math.hypot(rot[i].x - rot[j].x, rot[i].y - rot[j].y);
          if (d < 16) {
            ctx.beginPath();
            ctx.moveTo(rot[i].x, rot[i].y);
            ctx.lineTo(rot[j].x, rot[j].y);
            ctx.stroke();
          }
        }
      }

      rot.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = p.z > 0 ? '#00f2fe' : 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = p.z > 0 ? 6 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(drawBrain);
    };

    drawBrain();
    return () => cancelAnimationFrame(animId);
  }, [accessed]);

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
          className="relative min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between overflow-hidden font-mono select-none"
        >
          <style>{`
            /* Beveled Cyber Tactical Corners untuk Tombol Utama */
            .cyber-button {
              position: relative;
              background: rgba(0, 242, 254, 0.08);
              clip-path: polygon(
                12px 0%, 
                calc(100% - 12px) 0%, 
                100% 12px, 
                100% calc(100% - 12px), 
                calc(100% - 12px) 100%, 
                12px 100%, 
                0% calc(100% - 12px), 
                0% 12px
              );
            }

            .cyber-border-wrap {
              position: relative;
              clip-path: polygon(
                12px 0%, 
                calc(100% - 12px) 0%, 
                100% 12px, 
                100% calc(100% - 12px), 
                calc(100% - 12px) 100%, 
                12px 100%, 
                0% calc(100% - 12px), 
                0% 12px
              );
              padding: 1.5px;
              background: linear-gradient(135deg, #00f2fe 0%, rgba(0, 242, 254, 0.4) 50%, #00f2fe 100%);
              box-shadow: 0 0 25px rgba(0, 242, 254, 0.4);
              transition: all 0.3s ease;
            }

            .cyber-border-wrap:hover {
              box-shadow: 0 0 40px rgba(0, 242, 254, 0.7);
              transform: translateY(-1px);
            }
          `}</style>

          {/* ========================================================================
              KANVAS LATAR BELAKANG: SPHERE, RADAR, DEGREES, PARTICLES
          ======================================================================== */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* ========================================================================
              TOP HEADER TELEMETRY BAR
          ======================================================================== */}
          <header className="relative z-20 w-full px-6 pt-5 pb-2 flex items-center justify-between text-[11px] tracking-wider">
            {/* Top-Left Pill: COGNITIVE CRYPTO SHIELD ACTIVE */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-[#090e1a]/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <span className="text-cyan-400 text-xs">🛡</span>
              <span className="text-cyan-300 font-semibold tracking-widest">
                COGNITIVE CRYPTO SHIELD ACTIVE
              </span>
            </div>

            {/* Top-Right Pill: SYS_STATUS: CRYPTED // ONLINE */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#090e1a]/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <span className="text-cyan-400 text-xs">((i))</span>
              <span className="text-slate-300 font-medium tracking-wider">SYS_STATUS:</span>
              <span className="text-cyan-400 font-bold">CRYPTED</span>
              <span className="text-slate-500">//</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
          </header>

          {/* ========================================================================
              CENTER HERO CONTENT: BRANDING, CONSOLE LOGS & TELEMETRY CARDS
          ======================================================================== */}
          <main className="relative z-10 w-full max-w-4xl mx-auto px-4 my-auto flex flex-col items-center text-center pt-2 pb-6">
            {/* BRANDING TITLE: FANTASMA SYNERGY */}
            <div className="mb-2 relative">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e0f7fe] to-[#38bdf8] drop-shadow-[0_0_35px_rgba(0,242,254,0.65)] uppercase">
                FANTASMA
              </h1>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e0f7fe] to-[#38bdf8] drop-shadow-[0_0_35px_rgba(0,242,254,0.65)] uppercase -mt-2 sm:-mt-3">
                SYNERGY
              </h2>
            </div>

            {/* SUBTITLE */}
            <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-cyan-300/90 mb-5">
              QUANTITATIVE ORACLE INVESTMENT TERMINAL v4.0 &nbsp;|&nbsp; FOREX + CRYPTO
            </p>

            {/* ========================================================================
                DIAGNOSTIC CONSOLE LOG WINDOW (GAYA TERMINAL VERSI GAMBAR)
            ======================================================================== */}
            <div className="w-full max-w-[620px] rounded-xl border border-cyan-500/40 bg-[#080d19]/85 backdrop-blur-xl p-3.5 mb-4 shadow-[0_10px_35px_rgba(0,242,254,0.12)] text-left text-[10px] sm:text-[10.5px] leading-relaxed">
              {logs.map((item, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5 font-mono py-0.5">
                  <span className="text-slate-400 tracking-tight">[{item.time}]</span>
                  <span className="text-cyan-400 font-bold">{item.tag}</span>
                  <span className="text-slate-200">{item.msg}</span>
                  {item.status && (
                    <span
                      className="font-bold tracking-wider"
                      style={{ color: item.statusColor }}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ========================================================================
                3 MODULAR KPI TELEMETRY CARDS (1s Ticks, Kelly Aware, Multi Model)
            ======================================================================== */}
            <div className="w-full max-w-[620px] grid grid-cols-3 gap-3 mb-6">
              {/* KARTU 1: 1s Ticks */}
              <div className="rounded-xl border border-cyan-500/30 bg-[#080d19]/80 backdrop-blur-md p-2.5 flex items-center justify-between text-left shadow-[0_4px_20px_rgba(0,242,254,0.06)] hover:border-cyan-400/60 transition-colors">
                <div>
                  <div className="flex items-center gap-1 text-[8px] text-slate-400 tracking-wider mb-0.5">
                    <span className="text-cyan-400">📈</span>
                    <span>LIVE MARKET TICKER</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    1s Ticks
                  </div>
                </div>
                {/* Live Sparkline Waveform Canvas */}
                <div className="w-16 h-8 relative">
                  <canvas ref={sparklineCanvasRef} className="w-full h-full block" />
                </div>
              </div>

              {/* KARTU 2: Kelly Aware */}
              <div className="rounded-xl border border-cyan-500/30 bg-[#080d19]/80 backdrop-blur-md p-2.5 flex items-center justify-between text-left shadow-[0_4px_20px_rgba(0,242,254,0.06)] hover:border-cyan-400/60 transition-colors">
                <div>
                  <div className="flex items-center gap-1 text-[8px] text-slate-400 tracking-wider mb-0.5">
                    <span className="text-cyan-400">📊</span>
                    <span>R25K LAYER:</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Kelly Aware
                  </div>
                </div>
                {/* Stepped Battery / Bar Risk Gauge with Angled Profile */}
                <div
                  className="flex items-end gap-[2px] h-7 px-1.5 py-1 rounded bg-[#050811]/60 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,242,254,0.15)]"
                  style={{
                    clipPath: 'polygon(0 15%, 100% 0%, 100% 100%, 0 100%)',
                  }}
                >
                  {[8, 12, 16, 20, 24].map((hVal, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-[1px] bg-gradient-to-t from-cyan-400 to-[#10b981] shadow-[0_0_6px_#00f2fe]"
                      style={{ height: `${hVal}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* KARTU 3: Multi Model */}
              <div className="rounded-xl border border-cyan-500/30 bg-[#080d19]/80 backdrop-blur-md p-2.5 flex items-center justify-between text-left shadow-[0_4px_20px_rgba(0,242,254,0.06)] hover:border-cyan-400/60 transition-colors">
                <div>
                  <div className="flex items-center gap-1 text-[8px] text-slate-400 tracking-wider mb-0.5">
                    <span className="text-cyan-400">⚙</span>
                    <span>AI CONSENSUS:</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Multi Model
                  </div>
                </div>
                {/* 3D Rotating Neural Brain Cluster Canvas */}
                <div className="w-10 h-8 relative">
                  <canvas ref={brainCanvasRef} className="w-full h-full block" />
                </div>
              </div>
            </div>

            {/* ========================================================================
                TOMBOL UTAMA: [ MASUK KE TERMINAL → ]
            ======================================================================== */}
            <div className="cyber-border-wrap mb-3.5">
              <button
                onClick={handleEnterTerminal}
                onMouseEnter={() => playCyberSound('hover')}
                className="cyber-button px-9 py-2.5 text-xs sm:text-sm font-black tracking-[0.2em] text-cyan-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
          </main>

          {/* ========================================================================
              FOOTER TELEMETRY STATUS BAR
          ======================================================================== */}
          <footer className="relative z-20 w-full px-6 py-4 flex items-center justify-between text-[10px] tracking-widest text-slate-500 font-mono">
            <div>FANTASMA SYNERGY SYSTEMS INC.</div>
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
