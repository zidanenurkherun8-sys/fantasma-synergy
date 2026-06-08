'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardPage from './dashboard/page';
import { Terminal, Lock, ShieldAlert, Cpu, Eye, HelpCircle } from 'lucide-react';

export default function Home() {
  const [accessed, setAccessed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [bypassCheck, setBypassCheck] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  // Load configuration and simulate console logging
  useEffect(() => {
    const bypass = localStorage.getItem('fantasma_bypass_portal') === 'true';
    setBypassCheck(bypass);
    if (bypass) {
      setAccessed(true);
      return;
    }

    const logs = [
      'SYSTEM: [SECURE COGNITIVE DECRYPTION ACTIVE]',
      'SYSTEM: INITIALIZING QUANTUM ORACLE ENGINE PROTOCOLS...',
      'SYSTEM: PULLING INDODAX TICKER INDEX & ORDERBOOK PRESSURES...',
      'SYSTEM: CONNECTED TO INDODAX REST COGNITIVE TUNNEL (OK)',
      'SYSTEM: 12 ELITE MARKET GUARDIANS LOADED INTO PERSISTENT CACHE...',
      'SYSTEM: HALF-KELLY CAPITAL PRESERVATION STRATEGY: STAGED',
      'SYSTEM: WARNING: TIME REGIME VOLATILITY DETECTED: HIGH',
      'SYSTEM: COGNITIVE DECRYPTION COMPLETED.',
      'FANTASMA SYNERGY QUANTUM GATEWAY IS ONLINE.'
    ];

    logs.forEach((logText, idx) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logText}`].slice(-6));
      }, idx * 600);
    });
  }, []);

  // 3D Parallax Canvas Particle & Hologram Loop
  useEffect(() => {
    if (accessed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Resize listener
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Define 80 floating parallax dust particles
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      parallaxFactor: number;
      hue: number;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        parallaxFactor: Math.random() * 0.04 + 0.005, // controls depth look
        hue: Math.random() > 0.6 ? 180 : 280 // Cyan or Purple
      });
    }

    // 3D Wireframe Globe coordinates grid
    const globeGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
    const latDiv = 8;
    const lonDiv = 14;
    const globeRadius = Math.min(width, height) * 0.16; // adaptive sizing

    for (let i = 0; i <= latDiv; i++) {
      const latAngle = (i * Math.PI) / latDiv;
      const row = [];
      for (let j = 0; j < lonDiv; j++) {
        const lonAngle = (j * 2 * Math.PI) / lonDiv;
        row.push({
          x: globeRadius * Math.sin(latAngle) * Math.cos(lonAngle),
          y: globeRadius * Math.cos(latAngle),
          z: globeRadius * Math.sin(latAngle) * Math.sin(lonAngle)
        });
      }
      globeGrid.push(row);
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate mouse positioning
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Draw background spectral nebula glows
      const glowGrad = ctx.createRadialGradient(
        width / 2 + (mouse.x - width / 2) * 0.15,
        height / 2 + (mouse.y - height / 2) * 0.15,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.6
      );
      glowGrad.addColorStop(0, 'rgba(26, 11, 46, 0.55)');   // Deep spectral purple
      glowGrad.addColorStop(0.5, 'rgba(5, 7, 13, 0.95)');   // Pitch black
      glowGrad.addColorStop(1, '#030407');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw floating space particles with cursor parallax shifting
      particles.forEach(p => {
        // Shift particle coordinate by parallax factor
        const shiftedX = p.x - (mouse.x - width / 2) * p.parallaxFactor;
        const shiftedY = p.y - (mouse.y - height / 2) * p.parallaxFactor;

        // Draw particle
        ctx.beginPath();
        ctx.arc(shiftedX, shiftedY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity})`;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = p.hue === 180 ? '#00E5FF' : '#9D4EDD';
        ctx.fill();
        ctx.shadowBlur = 0; // reset glow

        // Update particle natural position
        p.x += p.speedX;
        p.y += p.speedY;

        // Screen boundary loops
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // Update rotating angles based on mouse positioning
      rotationRef.current.y += 0.003 + (mouse.x - width / 2) * 0.00002;
      rotationRef.current.x += 0.001 + (mouse.y - height / 2) * 0.00001;

      const angleY = rotationRef.current.y;
      const angleX = rotationRef.current.x;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Project 3D Grid points to 2D Screen
      const centerX = width / 2;
      const centerY = height / 2 - 40;
      const dist = 400; // perspective camera depth

      const projectedGlobe = globeGrid.map(row =>
        row.map(p => {
          // Y-axis rotation
          let x1 = p.x * cosY - p.z * sinY;
          let z1 = p.x * sinY + p.z * cosY;

          // X-axis rotation
          let y2 = p.y * cosX - z1 * sinX;
          let z2 = p.y * sinX + z1 * cosX;

          // Perspective scaling factor
          const scale = dist / (dist + z2);
          return {
            x: x1 * scale + centerX,
            y: y2 * scale + centerY,
            z: z2
          };
        })
      );

      // Draw projected Globe lines
      // 1. Latitude circles
      for (let i = 0; i < projectedGlobe.length; i++) {
        ctx.beginPath();
        for (let j = 0; j < projectedGlobe[i].length; j++) {
          const p = projectedGlobe[i][j];
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(projectedGlobe[i][0].x, projectedGlobe[i][0].y); // loop close
        
        // Ghostly fade color based on latitude
        const latRatio = i / latDiv;
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.08 + Math.sin(latRatio * Math.PI) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Longitude vertical links
      for (let j = 0; j < lonDiv; j++) {
        ctx.beginPath();
        for (let i = 0; i < projectedGlobe.length; i++) {
          const p = projectedGlobe[i][j];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `rgba(157, 78, 221, 0.12)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 3. Draw glow nodes at intersections
      projectedGlobe.forEach(row => {
        row.forEach(p => {
          // Draw only front-facing nodes for organic looks
          if (p.z < 10) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#00E5FF';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#00E5FF';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      });

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [accessed]);

  // Decryption transition trigger
  const handleAccessCore = () => {
    setGlitching(true);
    // Matrix glitch delay
    setTimeout(() => {
      setAccessed(true);
      setGlitching(false);
    }, 1100);
  };

  const toggleBypassOption = (checked: boolean) => {
    setBypassCheck(checked);
    localStorage.setItem('fantasma_bypass_portal', checked ? 'true' : 'false');
  };

  if (accessed) {
    return <DashboardPage />;
  }

  return (
    <div 
      className={`min-h-screen relative overflow-hidden bg-[#030407] text-[#F0F3F8] font-sans flex flex-col items-center justify-between select-none ${
        glitching ? 'animate-[pulse_0.1s_infinite] saturate-[300%] contrast-[150%]' : ''
      }`}
    >
      {/* Dynamic Parallax Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Spooky Scanning Glitch Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-70" />

      {/* Top Banner Alert */}
      <header className="w-full max-w-6xl px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 border border-[#8B2BE2]/40 bg-[#9D4EDD]/5 px-3 py-1.5 rounded-lg">
          <ShieldAlert className="h-4 w-4 text-[#9D4EDD] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#9D4EDD] font-mono">
            COGNITIVE CRYPTO SHIELD ACTIVE
          </span>
        </div>
        <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest">
          SYS_STATUS: CRYPTED
        </div>
      </header>

      {/* Main Core Elements */}
      <div className="flex flex-col items-center justify-center text-center z-20 flex-1 px-4 max-w-lg mt-[-20px]">
        {/* Wireframe Area Placeholder for spacing (canvas draws over this) */}
        <div className="h-[260px] w-full pointer-events-none" />

        {/* Brand Names & Subtitle */}
        <h1 
          className="text-4xl md:text-5xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#9D4EDD] to-[#00E5FF] drop-shadow-[0_0_20px_rgba(0,229,255,0.15)] font-sans uppercase cyber-glitch-text cursor-crosshair"
          title="FANTASMA SYNERGY"
        >
          FANTASMA SYNERGY
        </h1>
        <p className="text-[10px] font-bold font-mono tracking-[0.4em] text-cyan-400/80 uppercase mt-2 select-none">
          Quantum Oracle Investment Terminal v3.5
        </p>

        {/* Cyber Logs Feed Console */}
        <div className="w-full bg-[#07090F]/80 border border-[#1E2333] rounded-xl p-4 mt-8 font-mono text-[9px] text-left leading-normal text-[#8B98A6] flex flex-col gap-1.5 h-[120px] overflow-hidden shadow-2xl backdrop-blur-sm">
          {consoleLogs.map((log, index) => (
            <div key={`log-${index}`} className="flex items-start gap-1">
              <span className="text-[#9D4EDD] font-bold">{'>'}</span>
              <span className={index === consoleLogs.length - 1 ? 'text-white font-extrabold' : ''}>
                {log}
              </span>
            </div>
          ))}
          {consoleLogs.length === 0 && (
            <span className="text-gray-600 animate-pulse">Establishing encrypted socket tunnel...</span>
          )}
        </div>

        {/* Action Button & Bypass controls */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full">
          <button
            onClick={handleAccessCore}
            disabled={glitching}
            className="w-full md:w-64 bg-transparent border-2 border-cyan-400/70 hover:border-cyan-400 text-cyan-400 hover:text-[#030407] hover:bg-cyan-400 font-extrabold text-xs tracking-widest py-3.5 px-6 rounded-xl transition-all duration-300 transform active:scale-95 hover:shadow-[0_0_25px_rgba(0,229,255,0.35)] cursor-pointer"
          >
            {glitching ? 'DECRYPTING CORE...' : 'INISIALISASI QUANTUM CORE'}
          </button>
          
          <label className="flex items-center gap-2 cursor-pointer select-none py-1.5">
            <input
              type="checkbox"
              checked={bypassCheck}
              onChange={(e) => toggleBypassOption(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#1E2333] bg-[#07090F] checked:bg-cyan-400 focus:ring-0 cursor-pointer"
            />
            <span className="text-[10px] text-[#8B98A6] font-mono hover:text-white transition">
              Bypass intro pada kunjungan berikutnya
            </span>
          </label>
        </div>
      </div>

      {/* Spooky Footers */}
      <footer className="w-full max-w-6xl px-6 py-6 border-t border-[#1E2333]/30 flex flex-col sm:flex-row items-center justify-between text-[8px] text-[#8B98A6]/60 font-mono tracking-widest gap-2 z-20">
        <div>COGNITIVE AUDIT BLOCK #0409A8F</div>
        <div className="text-center sm:text-right">
          © 2026 FANTASMA SYNERGY INC. ALL PROTOCOLS ENCRYPTED.
        </div>
      </footer>
    </div>
  );
}
