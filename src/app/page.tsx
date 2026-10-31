'use client';

import React, { useState, useEffect, useRef } from 'react';
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

type AudioFeedbackType = 'hover' | 'click';

export default function App(): React.JSX.Element {
  const [accessed, setAccessed] = useState<boolean>(false);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [bypassIntro, setBypassIntro] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);
  const brainCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const telemetryTagRef = useRef<HTMLSpanElement>(null);

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
  // 1. KANVAS LATAR BELAKANG: GRID SIBER, BINTANG, LENS FLARE & CORNER CONNECTORS
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

      // Soft Luxury Ambient Glow (Tanpa garis laser/garis tembak yang tajam)
      const cx = w * 0.5;
      const cy = h * 0.36;
      const flareGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320);
      flareGrad.addColorStop(0, 'rgba(0, 242, 254, 0.08)');
      flareGrad.addColorStop(0.4, 'rgba(14, 165, 233, 0.025)');
      flareGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');

      ctx.save();
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 320, 0, Math.PI * 2);
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
  // 1B. KANVAS 3D LUXURY CELESTIAL CORE (SMOOTH, LIQUID & LUXURY FINISH)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (accessed) return;
    const canvas = globeCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    // Parameter Fisika Rotasi Halus & Bobot Mewah (Velvet Damping)
    const rot: RotState = {
      yaw: 0.42,
      pitch: 0.22,
      velYaw: 0.002,
      velPitch: 0,
      isDragging: false,
      lastX: 0,
      lastY: 0,
    };

    // Partikel Debu Kosmik Berpendar Lembut di Sekitar Bola
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

    // Mutiara Orbit Mewah (Satellites berkecepatan tenang)
    const luxuryPearls: LuxuryPearl[] = [
      {
        ringRadius: 1.34,
        angle: 0.8,
        speed: 0.008,
        tiltX: 0.25,
        tiltZ: 0.95,
        size: 3.2,
        glow: '#00f2fe',
      },
      {
        ringRadius: 1.22,
        angle: 3.4,
        speed: -0.006,
        tiltX: 0.85,
        tiltZ: 0.35,
        size: 2.6,
        glow: '#ffffff',
      },
      {
        ringRadius: 1.48,
        angle: 1.9,
        speed: 0.005,
        tiltX: 0.55,
        tiltZ: 0.75,
        size: 2.2,
        glow: '#38bdf8',
      },
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

    // Event Listener Interaksi Drag (Mouse & Touch)
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

    container.addEventListener('touchstart', onPointerDown as EventListener, {
      passive: true,
    });
    window.addEventListener('touchmove', onPointerMove as EventListener, {
      passive: true,
    });
    window.addEventListener('touchend', onPointerUp as EventListener);

    let time = 0;

    const render = (): void => {
      if (!container) return;
      const w = (canvas.width = container.clientWidth || 460);
      const h = (canvas.height = container.clientHeight || 270);
      ctx.clearRect(0, 0, w, h);
      time += 0.015;

      // Inersia Halus & Rotasi Otomatis yang Anggun
      if (!rot.isDragging) {
        rot.yaw += rot.velYaw;
        rot.pitch = Math.max(-1.1, Math.min(1.1, rot.pitch + rot.velPitch));
        rot.velYaw *= 0.95;
        rot.velPitch *= 0.95;

        if (Math.abs(rot.velYaw) < 0.001) {
          rot.yaw += 0.0025; // Putaran santai dan konstan
        }
      }

      // Update Label Telemetri Horologi Mewah
      if (telemetryTagRef.current) {
        const azDeg = Math.round(
          ((((rot.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180) /
            Math.PI
        );
        const elDeg = Math.round((rot.pitch * 180) / Math.PI);
        telemetryTagRef.current.innerText = `AZIMUTH: ${azDeg}° | ELEVATION: ${elDeg}° // ${
          rot.isDragging ? 'MANUAL NAVIGATION' : 'EQUILIBRIUM DRIFT'
        }`;
      }

      // Pusat Bola dengan Efek Mengambang Harmonis (Breathing Levitation)
      const levitation = Math.sin(time * 1.2) * 3.5;
      const cx = w * 0.5;
      const cy = h * 0.52 + levitation;
      const sphereR = Math.min(w * 0.26, h * 0.36, 88);

      const cosY = Math.cos(rot.yaw);
      const sinY = Math.sin(rot.yaw);
      const cosX = Math.cos(rot.pitch);
      const sinX = Math.sin(rot.pitch);
      const fov = 320;

      // Helper untuk Proyeksi Titik 3D ke 2D Layar
      const projectPoint = (
        x: number,
        y: number,
        z: number,
        baseR: number
      ): ProjectedPoint => {
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

      // Konfigurasi Cincin-Cincin Orbital Sutra (Tanpa gerigi atau garis tembak)
      const luxuryRings: LuxuryRing[] = [
        { r: sphereR * 1.35, tiltX: 0.25, tiltZ: 0.95, width: 1.4, baseAlpha: 0.45 },
        { r: sphereR * 1.22, tiltX: 0.85, tiltZ: 0.35, width: 1.0, baseAlpha: 0.3 },
        { r: sphereR * 1.48, tiltX: 0.55, tiltZ: 0.75, width: 0.8, baseAlpha: 0.22 },
      ];

      // FUNGSI MENGGAMBAR SEGMEN CINCIN (Dipisahkan belakang & depan untuk kedalaman 3D nyata)
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
            const alpha = Math.max(
              0.04,
              Math.min(0.85, ring.baseAlpha * (depthFactor * 1.4 + 0.2))
            );

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

      // -------------------------------------------------------------
      // 1. TAHAP PERTAMA: GAMBAR CINCIN BAGIAN BELAKANG (DI BALIK BOLA)
      // -------------------------------------------------------------
      luxuryRings.forEach((r) => drawRingSegment(r, false));

      // -------------------------------------------------------------
      // 2. TAHAP KEDUA: BOLA CELESTIAL KRISTAL MEWAH (SMOOTH GLASS BODY)
      // -------------------------------------------------------------
      // (A) Pendaran Aura Atmosferik Halus (Ambient Optical Halo)
      const auraGrad = ctx.createRadialGradient(
        cx,
        cy,
        sphereR * 0.6,
        cx,
        cy,
        sphereR * 1.35
      );
      auraGrad.addColorStop(0, 'rgba(0, 242, 254, 0.16)');
      auraGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.06)');
      auraGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // (B) Badan Bola Kristal Kuantum dengan Shading Kedalaman Elegan
      const sphereGrad = ctx.createRadialGradient(
        cx - sphereR * 0.32,
        cy - sphereR * 0.32,
        sphereR * 0.05,
        cx,
        cy,
        sphereR
      );
      sphereGrad.addColorStop(0, 'rgba(235, 254, 255, 0.95)'); // Pantulan cahaya atas
      sphereGrad.addColorStop(0.18, 'rgba(0, 242, 254, 0.85)'); // Pendar sian primer
      sphereGrad.addColorStop(0.48, 'rgba(3, 105, 161, 0.45)'); // Safir transparan
      sphereGrad.addColorStop(0.82, 'rgba(8, 18, 38, 0.7)'); // Obsidian bayangan
      sphereGrad.addColorStop(1, 'rgba(3, 7, 18, 0.95)'); // Batas tepi gelap

      ctx.save();
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR, 0, Math.PI * 2);
      ctx.fill();

      // (C) Kabut Nebula Dalam Bola (Internal Silk Swirl)
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

      // (D) Tepi Cahaya Refraktif (Fresnel Rim Highlight)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // 3. TAHAP KETIGA: PARTIKEL DEBU BINTANG HALUS (STARDUST)
      // -------------------------------------------------------------
      stardust.forEach((p) => {
        const proj = projectPoint(p.x, p.y, p.z, sphereR);
        const isFront = proj.pz > -0.15;
        const alphaPulse = Math.sin(time * 3 + p.pulse) * 0.25 + 0.75;
        const depthAlpha =
          Math.max(0.08, Math.min(1, (proj.pz + 1) * 0.5)) * alphaPulse;

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

      // -------------------------------------------------------------
      // 4. TAHAP KEEMPAT: GAMBAR CINCIN BAGIAN DEPAN (MELINTANG DI DEPAN BOLA)
      // -------------------------------------------------------------
      luxuryRings.forEach((r) => drawRingSegment(r, true));

      // -------------------------------------------------------------
      // 5. TAHAP KELIMA: MUTIARA ORBITAL MEWAH (CELESTIAL PEARLS)
      // -------------------------------------------------------------
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

      // Garis Area Gradasi Bawah
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

      // Garis Waveform Pendar
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

    // Generator Node Otak Anatomis (Cerebrum Hemispheres, Temporal Lobes & Cerebellum)
    const generateRealisticBrain = (): {
      nodes: BrainNode[];
      connections: BrainEdge[];
    } => {
      const nodes: BrainNode[] = [];
      const connections: BrainEdge[] = [];

      // 1. Belahan Otak Besar (Kiri & Kanan) dengan Celah Longitudinal
      [-1, 1].forEach((hemisphere) => {
        const hOffset = hemisphere * 3.8; // Celah pemisah antar belahan otak (Longitudinal Fissure)
        const hemiNodes: number[] = [];

        // Lapisan Korteks / Cortex Folds (Frontal, Parietal, Occipital, Temporal)
        const latSteps = 8;
        const lonSteps = 10;
        for (let i = 1; i <= latSteps; i++) {
          const u = (i / (latSteps + 1)) * Math.PI; // Sudut vertikal (kutub atas ke bawah)
          for (let j = 0; j < lonSteps; j++) {
            const v = (j / lonSteps) * Math.PI * 2; // Sudut radial

            // Ukuran dasar elipsoid otak manusia: Z (panjang depan-belakang), Y (tinggi), X (lebar)
            let bx = 16 * Math.sin(u) * Math.cos(v);
            let by = 19 * Math.cos(u);
            let bz = 24 * Math.sin(u) * Math.sin(v);

            // Modifikasi bentuk anatomis:
            // - Bagian depan (Frontal Lobe) membulat lebar
            if (bz > 0) {
              bx *= 1 + 0.12 * (bz / 24);
              by += 1.5 * (bz / 24);
            }
            // - Bagian belakang (Occipital Lobe) meruncing melengkung ke bawah
            if (bz < 0) {
              by -= 2.2 * Math.abs(bz / 24);
            }
            // - Bagian samping bawah (Temporal Lobe) menggembung khas di ventrolateral
            if (Math.abs(bz) < 12 && by < 2 && by > -12) {
              bx *= 1.28;
            }
            // - Cekungan dasar otak
            if (by < -10) {
              by *= 0.75;
            }

            // Lipatan girus dan sulkus (gyri & sulci wrinkles)
            const fold = Math.sin(u * 6 + v * 4) * 1.4 + Math.cos(u * 5 - v * 5) * 1.1;
            bx += (bx / 16) * fold;
            by += (by / 19) * fold;
            bz += (bz / 24) * fold;

            const nIdx = nodes.length;
            const nodeObj: BrainNode = {
              x: hemisphere * Math.abs(bx) + hOffset,
              y: -by, // Balik koordinat agar kutub atas otak berada di atas
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

        // 2. Serebelum (Cerebellum) di bagian bawah belakang oksipital
        for (let c = 0; c < 12; c++) {
          const cTheta = (c / 12) * Math.PI * 2;
          const cRadius = 6.5 + Math.sin(c * 3) * 1.2;
          const nIdx = nodes.length;
          nodes.push({
            x: hemisphere * (cRadius * Math.cos(cTheta) * 0.75 + 7),
            y: 13 + Math.sin(cTheta * 2) * 2, // Berada di bawah posterior
            z: -14 + Math.sin(cTheta) * 6,
            hemisphere,
            type: 'cerebellum',
            pulse: Math.random() * Math.PI * 2,
            size: 1.1,
          });
          hemiNodes.push(nIdx);
        }

        // Sambungan akson neural internal dalam satu hemisfer
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

      // 3. Batang Otak (Brainstem) & Penghubung Corpus Callosum Antar-Hemisfer
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

      // Jembatan Corpus Callosum (garis koneksi yang menyeberangi celah tengah)
      for (let i = 0; i < nodes.length; i++) {
        if (
          nodes[i].type === 'cortex' &&
          Math.abs(nodes[i].x) < 7 &&
          nodes[i].y < 2
        ) {
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

    // Impuls sinaptik / potensial aksi yang meluncur antar neuron
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
      angle += 0.012; // Rotasi horizontal perlahan

      const cx = w * 0.5;
      const cy = h * 0.48;
      const scale = Math.min(w, h) * 0.024; // Skala pas di dalam kartu

      // Rotasi 3D (Pitch sedikit menunduk agar belahan atas dan serebelum terlihat)
      const pitch = 0.28;
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosYaw = Math.cos(angle);
      const sinYaw = Math.sin(angle);

      const projected = brainNodes.map((n) => {
        // Rotasi Yaw (Y)
        const x1 = n.x * cosYaw - n.z * sinYaw;
        const z1 = n.x * sinYaw + n.z * cosYaw;

        // Rotasi Pitch (X)
        const y2 = n.y * cosPitch - z1 * sinPitch;
        const z2 = n.y * sinPitch + z1 * cosPitch;

        // Proyeksi Perspektif
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

      // 1. Gambar Garis Akson Saraf (Neural Synaptic Pathways)
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

      // 2. Gambar Impuls Listrik Sinapsis (Action Potential Pulses)
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

      // 3. Gambar Badan Sel Neuron (Soma Nodes) dengan Depth Shading
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

  // Jika bypass tersimpan, langsung tampilkan dashboard
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
          className="relative min-h-screen w-full bg-[#05070e] text-slate-100 flex flex-col justify-between overflow-hidden font-mono select-none"
        >
          <style>{`
            /* Beveled Cyber Tactical Corners untuk Tombol Utama */
            .cyber-button {
              position: relative;
              background: rgba(0, 242, 254, 0.06);
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
              box-shadow: 0 0 45px rgba(0, 242, 254, 0.8);
              transform: translateY(-1px);
            }

            /* 4 Sudut HUD Corner Brackets */
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
          <header className="relative z-20 w-full px-12 pt-6 flex items-center justify-between text-[11px] tracking-wider">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-[#080d1a]/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <span className="text-cyan-400 text-xs">🛡</span>
              <span className="text-cyan-300 font-semibold tracking-widest text-[10.5px]">
                COGNITIVE CRYPTO SHIELD ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-cyan-500/30 bg-[#080d1a]/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
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
              WORKSPACE 3-PANEL COMMAND DECK
          ======================================================================== */}
          <main className="relative z-10 w-full max-w-[1520px] mx-auto px-10 my-auto grid grid-cols-12 gap-8 items-center py-4">
            {/* ======================================================================
                PANEL KIRI: LOG DIAGNOSTIK VERTIKAL & TELEMETRI SAMPING
            ====================================================================== */}
            <div className="col-span-12 lg:col-span-3 flex items-start gap-4">
              {/* Baris Meter Telemetri Samping */}
              <div className="flex flex-col items-center gap-2 text-[9px] text-slate-400 pt-3">
                <div className="text-[8px] font-bold text-slate-300">STATUS:</div>
                <div className="font-mono text-cyan-300 text-[9px] leading-tight text-center">
                  1010 0 1000
                </div>
                <div className="w-full text-[8px] font-bold text-slate-400 pt-2">
                  GRID 6A2D:
                </div>
                <div className="font-mono text-slate-300 text-[8px]">[2, -3, 2, 8]</div>

                {/* Meter Blok Vertikal */}
                <div className="flex flex-col gap-[3px] py-2">
                  {[...Array(14)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2.5 h-1.5 rounded-[1px] ${
                        idx > 8
                          ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]'
                          : 'bg-slate-700/60'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-[8px] text-slate-500 pt-1">LATENCY:</div>
                <div className="text-cyan-400 font-bold text-[9px]">~12MS</div>
              </div>

              {/* Kotak Konsol Log Diagnostik Kaca */}
              <div className="flex-1 rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-4 shadow-[0_12px_40px_rgba(0,242,254,0.12)] min-h-[440px] flex flex-col justify-between text-[10px] leading-relaxed">
                {/* Header Kode Heksadesimal */}
                <div className="space-y-0.5 text-[8.5px] text-slate-500 font-mono pb-3 border-b border-cyan-500/20">
                  <div className="flex justify-between">
                    <span>GRID</span>
                    <span>100 0 1060</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6R20</span>
                    <span>123 0 2090</span>
                  </div>
                  <div className="flex justify-between">
                    <span>G020</span>
                    <span>289 0 2060</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6R20</span>
                    <span>233 0 2060</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6R20</span>
                    <span>323 0 1650</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6R20</span>
                    <span>936 0 2000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6R20</span>
                    <span>339 0 1060</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GA20</span>
                    <span>529 0 2660</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GR20</span>
                    <span>816 0 1000</span>
                  </div>
                </div>

                {/* Log Terminal Aktif */}
                <div className="space-y-3 pt-3 font-mono text-[9.5px]">
                  <div>
                    <span className="text-slate-400">[11:35:43 AM]</span>{' '}
                    <span className="text-cyan-400 font-bold">SYSTEM:</span>{' '}
                    <span className="text-slate-200">
                      DE METHODOLOGY ANALYZERS INITIALIZED (SAC, WYCKOFF, HARMONIC...)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400">[11:35:43 AM]</span>{' '}
                    <span className="text-cyan-400 font-bold">SYSTEM:</span>{' '}
                    <span className="text-slate-200">
                      MULTI-TIMEFRAME ANALYSIS COMPLETE //
                    </span>{' '}
                    <span className="text-cyan-400 font-bold tracking-wider">ACTIVE</span>
                  </div>

                  <div>
                    <span className="text-slate-400">[11:35:44 AM]</span>{' '}
                    <span className="text-cyan-400 font-bold">SYSTEM:</span>{' '}
                    <span className="text-slate-200">
                      HALF-KELLY CAPITAL PRESERVATION STRATEGY:
                    </span>{' '}
                    <span className="text-emerald-400 font-bold tracking-wider">
                      STABLE
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400">[11:35:44 AM]</span>{' '}
                    <span className="text-cyan-400 font-bold">SYSTEM:</span>{' '}
                    <span className="text-slate-200">
                      WARPING: TIME MACHINE VOLATILITY DETECTED:
                    </span>{' '}
                    <span className="text-cyan-400 font-bold tracking-wider">HIGH</span>
                  </div>

                  <div>
                    <span className="text-slate-400">[11:35:45 AM]</span>{' '}
                    <span className="text-cyan-400 font-bold">SYSTEM:</span>{' '}
                    <span className="text-slate-200">
                      COGNITIVE ENCRYPTION COMPLETE //
                    </span>{' '}
                    <span className="text-emerald-400 font-bold tracking-wider">
                      CONNECTED
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-500/20 text-[8.5px] text-slate-500 flex justify-between">
                  <span>SECURITY PROTOCOL: v4.0</span>
                  <span className="text-emerald-400">ENCRYPTED</span>
                </div>
              </div>
            </div>

            {/* ======================================================================
                PANEL TENGAH: BRANDING UTAMA, PEDESTAL & TOMBOL MASUK KE TERMINAL
            ====================================================================== */}
            <div className="col-span-12 lg:col-span-6 flex flex-col items-center text-center justify-center pt-2 pb-6">
              {/* VIEWPORT 3D CELESTIAL CORE INTERAKTIF (BISA DIGERAKKAN/DRAGGABLE) */}
              <div className="relative w-full max-w-[460px] h-[240px] sm:h-[270px] flex items-center justify-center cursor-grab active:cursor-grabbing mb-2 group">
                <canvas ref={globeCanvasRef} className="w-full h-full block" />

                {/* HUD Status Badge dengan Desain Horologi Mewah */}
                <div className="absolute bottom-1 px-3.5 py-1 rounded-full border border-cyan-500/25 bg-[#070b16]/90 text-[9px] font-mono text-cyan-300/90 flex items-center gap-2.5 pointer-events-none backdrop-blur-xl shadow-[0_4px_20px_rgba(0,242,254,0.12)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] animate-pulse" />
                  <span ref={telemetryTagRef}>AZIMUTH: 0° | ELEVATION: 0°</span>
                  <span className="text-slate-500 text-[8px] pl-1 border-l border-slate-700/60 hidden sm:inline">
                    SMOOTH TOUCH & DRAG
                  </span>
                </div>
              </div>

              {/* JUDUL BESAR: FANTASMA SYNERGY */}
              <div className="mb-2 relative">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0f9ff] to-[#38bdf8] drop-shadow-[0_0_40px_rgba(0,242,254,0.7)] uppercase">
                  FANTASMA
                </h1>
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0f9ff] to-[#38bdf8] drop-shadow-[0_0_40px_rgba(0,242,254,0.7)] uppercase -mt-2 sm:-mt-3">
                  SYNERGY
                </h2>
              </div>

              {/* SUBTITLE */}
              <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.22em] text-cyan-300/90 mb-8 max-w-xl">
                QUANTITATIVE ORACLE INVESTMENT TERMINAL v4.0 &nbsp;|&nbsp; FOREX + CRYPTO
              </p>

              {/* TOMBOL UTAMA: [ MASUK KE TERMINAL → ] */}
              <div className="cyber-border-wrap mb-4">
                <button
                  onClick={handleEnterTerminal}
                  onMouseEnter={() => playCyberSound('hover')}
                  className="cyber-button px-10 py-3 text-xs sm:text-sm font-black tracking-[0.22em] text-cyan-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                PANEL KANAN: 3 KARTU METRIK BERSIFAT VERTIKAL & SLIDER FADER
            ====================================================================== */}
            <div className="col-span-12 lg:col-span-3 flex items-start gap-4">
              {/* Kolom 3 Kartu Metrik */}
              <div className="flex-1 space-y-3.5">
                {/* KARTU 1: 1s Ticks */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3.5 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">📈</span>
                      <span>1s Ticks</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">
                      ACTIVE FEED
                    </span>
                  </div>
                  <div className="w-full h-20 relative">
                    <canvas ref={sparklineCanvasRef} className="w-full h-full block" />
                  </div>
                </div>

                {/* KARTU 2: Kelly Aware */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3.5 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">📊</span>
                      <span>Kelly Aware</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400">
                      CAPITAL GUARD
                    </span>
                  </div>

                  {/* Diagram Tangga / Stepped Ascending Bars */}
                  <div className="flex items-end justify-between gap-1.5 h-12 px-1 mb-3">
                    {[14, 20, 26, 34, 42].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-cyan-600 via-teal-400 to-[#10b981] shadow-[0_0_8px_rgba(0,242,254,0.4)]"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>RISK PROGRESS:</span>
                      <span className="text-cyan-400 font-bold">76%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden p-[1px]">
                      <div className="w-[76%] h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#10b981] shadow-[0_0_8px_#00f2fe]" />
                    </div>
                  </div>
                </div>

                {/* KARTU 3: Multi-Model */}
                <div className="rounded-2xl border border-cyan-500/40 bg-[#070b16]/85 backdrop-blur-xl p-3.5 shadow-[0_8px_30px_rgba(0,242,254,0.08)]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
                      <span className="text-cyan-400">🧠</span>
                      <span>Multi-Model</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>NEURAL 3D</span>
                    </div>
                  </div>
                  <div className="w-full h-28 relative">
                    <canvas ref={brainCanvasRef} className="w-full h-full block" />
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-cyan-500/15">
                    <span>SYNAPSES: 4,120</span>
                    <span className="text-purple-400">HEMISPHERES: L / R</span>
                  </div>
                </div>
              </div>

              {/* Telemetri Tepi Kanan (Slider & Fader S6002 / USCO2 / OA80) */}
              <div className="flex flex-col items-center gap-2 text-[9px] text-slate-400 pt-3">
                <div className="text-[8px] font-mono text-slate-400">LATENCY:</div>
                <div className="text-cyan-400 font-bold text-[9px]">~12MS</div>
                <div className="text-[8px] font-mono text-slate-500">68602800</div>

                {/* Slider Fader Audio / Hardware Mixer */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] font-mono text-slate-500">S6002:</span>
                    <div className="w-1.5 h-12 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-3 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] font-mono text-slate-500">USCO2</span>
                    <div className="w-1.5 h-12 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-6 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] font-mono text-slate-500">OA80:</span>
                    <div className="w-1.5 h-12 bg-slate-800 rounded-full relative my-1">
                      <div className="absolute top-2 -left-1 w-3.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f2fe]" />
                    </div>
                  </div>
                </div>

                <div className="text-[7px] text-slate-500 pt-1 tracking-tighter">
                  LANTER SENSOR
                </div>
              </div>
            </div>
          </main>

          {/* ========================================================================
              FOOTER TELEMETRY STATUS BAR
          ======================================================================== */}
          <footer className="relative z-20 w-full px-12 py-5 flex items-center justify-between text-[10px] tracking-widest text-slate-500 font-mono">
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
