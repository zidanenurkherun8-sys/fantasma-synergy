'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardPage from './dashboard/page';
import { Terminal, Lock, ShieldAlert, Cpu, Eye, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function Home() {
  const [accessed, setAccessed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [bypassCheck, setBypassCheck] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [mutedState, setMutedState] = useState(false);

  useEffect(() => {
    if (audio) {
      setMutedState(audio.isMuted());
    }
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0, velX: 0, velY: 0 });
  const impactRef = useRef({ velocityY: 0, velocityX: 0, pulse: 1.0 });

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

    // Drag and Zoom interaction handlers
    const handleMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking buttons, inputs, links, or labels
      if ((e.target as HTMLElement).closest('button, input, label, a, checkbox')) return;
      dragRef.current.isDragging = true;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.velX = 0;
      dragRef.current.velY = 0;
    };

    const handleMouseMoveDrag = (e: MouseEvent) => {
      // Passive mouse tracking for parallax particles
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;

      if (!dragRef.current.isDragging) return;

      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;

      rotationRef.current.y += dx * 0.005;
      rotationRef.current.x += dy * 0.005;

      dragRef.current.velX = dx * 0.005;
      dragRef.current.velY = dy * 0.005;

      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if welcome core is showing, prevent web-page scrolling
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.0015;
      zoomRef.current = Math.max(0.4, Math.min(3.0, zoomRef.current + zoomDelta));
    };

    // Touch support for mobile pinch/drag
    let touchStartDist = 0;
    const getTouchDist = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button, input, label, a')) return;
      if (e.touches.length === 1) {
        dragRef.current.isDragging = true;
        dragRef.current.lastX = e.touches[0].clientX;
        dragRef.current.lastY = e.touches[0].clientY;
        dragRef.current.velX = 0;
        dragRef.current.velY = 0;
      } else if (e.touches.length === 2) {
        dragRef.current.isDragging = false;
        touchStartDist = getTouchDist(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragRef.current.isDragging) {
        const dx = e.touches[0].clientX - dragRef.current.lastX;
        const dy = e.touches[0].clientY - dragRef.current.lastY;

        rotationRef.current.y += dx * 0.007;
        rotationRef.current.x += dy * 0.007;

        dragRef.current.velX = dx * 0.007;
        dragRef.current.velY = dy * 0.007;

        dragRef.current.lastX = e.touches[0].clientX;
        dragRef.current.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches);
        if (touchStartDist > 0 && dist > 0) {
          const ratio = dist / touchStartDist;
          zoomRef.current = Math.max(0.4, Math.min(3.0, zoomRef.current * ratio));
          touchStartDist = dist;
        }
      }
    };

    const handleTouchEnd = () => {
      dragRef.current.isDragging = false;
      touchStartDist = 0;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

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

    // 3D Wireframe Globe coordinates grid (stored as unit sphere points)
    const globeGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
    const latDiv = 8;
    const lonDiv = 14;

    for (let i = 0; i <= latDiv; i++) {
      const latAngle = (i * Math.PI) / latDiv;
      const row = [];
      for (let j = 0; j < lonDiv; j++) {
        const lonAngle = (j * 2 * Math.PI) / lonDiv;
        row.push({
          x: Math.sin(latAngle) * Math.cos(lonAngle),
          y: Math.cos(latAngle),
          z: Math.sin(latAngle) * Math.sin(lonAngle)
        });
      }
      globeGrid.push(row);
    }

    // Swarm of orbiting satellite nodes (12 nodes)
    const satellites: Array<{
      radiusFactor: number;
      inclination: number; // orbital tilt in radians
      yaw: number;         // orbital yaw in radians
      speed: number;       // angular speed
      phase: number;       // current orbital angle
      size: number;
      hue: number;
    }> = [];

    for (let i = 0; i < 12; i++) {
      satellites.push({
        radiusFactor: 1.25 + Math.random() * 0.4, // orbits between 1.25x and 1.65x globe radius
        inclination: (Math.random() - 0.5) * (Math.PI / 2.5), // tilt up to +-36 degrees
        yaw: Math.random() * Math.PI * 2,
        speed: (0.006 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1), // clockwise or counter
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5 + 1.2,
        hue: Math.random() > 0.4 ? 180 : 280
      });
    }

    // Orbiting ring points (Saturn style wireframe ring)
    const ringPoints: Array<{ x: number; y: number; z: number }> = [];
    const ringPointCount = 48;
    const ringRadiusFactor = 1.45;
    const ringTiltAngle = Math.PI / 6; // 30 degrees tilt

    for (let i = 0; i < ringPointCount; i++) {
      const theta = (i * 2 * Math.PI) / ringPointCount;
      const rx = Math.cos(theta) * ringRadiusFactor;
      const rz = Math.sin(theta) * ringRadiusFactor;
      // Tilt around Z axis:
      ringPoints.push({
        x: rx * Math.cos(ringTiltAngle),
        y: rx * Math.sin(ringTiltAngle),
        z: rz
      });
    }

    // 3D Wireframe background cubes (3 cubes)
    const cubes = [
      { x: -width * 0.22, y: -height * 0.15, z: -50, size: 22, rotX: 0.01, rotY: 0.015, angleX: 0, angleY: 0 },
      { x: width * 0.25, y: height * 0.18, z: -120, size: 28, rotX: -0.008, rotY: 0.012, angleX: 0, angleY: 0 },
      { x: -width * 0.28, y: height * 0.22, z: -80, size: 18, rotX: 0.012, rotY: -0.008, angleX: 0, angleY: 0 }
    ];

    const cubeVertices = [
      { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 }
    ];

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // back face
      [4, 5], [5, 6], [6, 7], [7, 4], // front face
      [0, 4], [1, 5], [2, 6], [3, 7]  // links
    ];

    // Define comets/meteors & explosions
    interface Comet {
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      trail: Array<{ x: number; y: number }>;
      color: string;
      glowColor: string;
      targetY: number;
    }

    interface ExplosionParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const comets: Comet[] = [];
    const explosions: ExplosionParticle[] = [];

    const spawnComet = () => {
      // Spawn from top/top-right edge traveling top-right -> bottom-left
      const startX = Math.random() * (width * 1.3);
      const startY = -40;
      const speedMultiplier = 1.0 + Math.random() * 1.5;
      const dx = (-5 - Math.random() * 8) * speedMultiplier;
      const dy = (5 + Math.random() * 8) * speedMultiplier;
      const size = Math.random() * 2.5 + 1.2;
      const isCyan = Math.random() > 0.5;

      comets.push({
        x: startX,
        y: startY,
        dx,
        dy,
        size,
        trail: [],
        color: isCyan ? 'rgba(0, 229, 255, 0.9)' : 'rgba(157, 78, 221, 0.9)',
        glowColor: isCyan ? '#00E5FF' : '#9D4EDD',
        targetY: height * 0.45 + Math.random() * (height * 0.5)
      });
    };

    const spawnExplosion = (x: number, y: number, color: string) => {
      audio?.playExplosion();
      // Physical reaction on the globe
      impactRef.current.velocityY = (Math.random() - 0.5) * 0.05;
      impactRef.current.velocityX = (Math.random() - 0.5) * 0.05;
      impactRef.current.pulse = 1.15; // pulse size scale

      const particleCount = 18 + Math.floor(Math.random() * 12);
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1.5 + Math.random() * 4.5;
        explosions.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 1.8 + 0.6,
          life: 25 + Math.floor(Math.random() * 20),
          maxLife: 45,
          color
        });
      }
    };

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Spawn comets randomly
      if (Math.random() < 0.02) {
        spawnComet();
      }

      // Update and draw comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.trail.push({ x: c.x, y: c.y });
        if (c.trail.length > 18) {
          c.trail.shift();
        }

        c.x += c.dx;
        c.y += c.dy;

        const hitTarget = c.y >= c.targetY;
        const outOfBounds = c.x < -100 || c.x > width + 100 || c.y > height + 100;

        if (hitTarget || outOfBounds) {
          if (hitTarget) {
            spawnExplosion(c.x, c.y, c.glowColor);
          }
          comets.splice(i, 1);
          continue;
        }

        if (c.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(c.trail[0].x, c.trail[0].y);
          for (let j = 1; j < c.trail.length; j++) {
            ctx.lineTo(c.trail[j].x, c.trail[j].y);
          }
          ctx.strokeStyle = c.color;
          ctx.lineWidth = c.size * 0.75;
          ctx.lineCap = 'round';
          ctx.shadowBlur = c.size * 2.5;
          ctx.shadowColor = c.glowColor;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = c.size * 5;
        ctx.shadowColor = c.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update and draw explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        const p = explosions[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life--;

        if (p.life <= 0) {
          explosions.splice(i, 1);
          continue;
        }

        const opacity = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * opacity, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 3 * opacity;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Smoothly interpolate mouse positioning (disabled cursor offset parallax)
      const mouse = mouseRef.current;
      mouse.x = width / 2;
      mouse.y = height / 2;

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

      // Draw background cubes
      cubes.forEach(cube => {
        cube.angleX += cube.rotX;
        cube.angleY += cube.rotY;

        const cCosY = Math.cos(cube.angleY);
        const cSinY = Math.sin(cube.angleY);
        const cCosX = Math.cos(cube.angleX);
        const cSinX = Math.sin(cube.angleX);

        const projectedVertices = cubeVertices.map(v => {
          let lx = v.x * cube.size;
          let ly = v.y * cube.size;
          let lz = v.z * cube.size;

          let rx = lx * cCosY - lz * cSinY;
          let rz = lx * cSinY + lz * cCosY;

          let ry = ly * cCosX - rz * cSinX;
          rz = ly * cSinX + rz * cCosX;

          const worldX = rx + cube.x - (mouse.x - width / 2) * 0.02;
          const worldY = ry + cube.y - (mouse.y - height / 2) * 0.02;
          const worldZ = rz + cube.z;

          const scale = 400 / (400 + worldZ);
          return {
            x: worldX * scale + width / 2,
            y: worldY * scale + height / 2 - 40
          };
        });

        ctx.beginPath();
        cubeEdges.forEach(edge => {
          const p1 = projectedVertices[edge[0]];
          const p2 = projectedVertices[edge[1]];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        });
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.09)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Update rotating angles with dragging state check
      if (dragRef.current.isDragging) {
        // Rotation updated directly by mouse drags
      } else {
        const d = dragRef.current;
        if (Math.abs(d.velX) > 0.0001 || Math.abs(d.velY) > 0.0001) {
          rotationRef.current.y += d.velX;
          rotationRef.current.x += d.velY;
          d.velX *= 0.95;
          d.velY *= 0.95;
        } else {
          // Default slow auto-spin
          rotationRef.current.y += 0.002 + (mouse.x - width / 2) * 0.00001;
          rotationRef.current.x += 0.0008 + (mouse.y - height / 2) * 0.000005;
        }
      }

      // Apply physical impact rotations
      rotationRef.current.y += impactRef.current.velocityY;
      rotationRef.current.x += impactRef.current.velocityX;
      impactRef.current.velocityY *= 0.92;
      impactRef.current.velocityX *= 0.92;
      impactRef.current.pulse += (1.0 - impactRef.current.pulse) * 0.08;

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
      const baseGlobeRadius = Math.min(width, height) * 0.16; // adaptive sizing
      const currentRadius = baseGlobeRadius * zoomRef.current * impactRef.current.pulse;

      const projectedGlobe = globeGrid.map(row =>
        row.map(p => {
          const px = p.x * currentRadius;
          const py = p.y * currentRadius;
          const pz = p.z * currentRadius;

          // Y-axis rotation
          let x1 = px * cosY - pz * sinY;
          let z1 = px * sinY + pz * cosY;

          // X-axis rotation
          let y2 = py * cosX - z1 * sinX;
          let z2 = py * sinX + z1 * cosX;

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

      // Project the Saturn ring
      const projectedRing = ringPoints.map(p => {
        const px = p.x * currentRadius;
        const py = p.y * currentRadius;
        const pz = p.z * currentRadius;

        let x1 = px * cosY - pz * sinY;
        let z1 = px * sinY + pz * cosY;

        let y2 = py * cosX - z1 * sinX;
        let z2 = py * sinX + z1 * cosX;

        const scale = dist / (dist + z2);
        return {
          x: x1 * scale + centerX,
          y: y2 * scale + centerY,
          z: z2
        };
      });

      // Draw projected Saturn ring
      ctx.beginPath();
      for (let i = 0; i < projectedRing.length; i++) {
        const p = projectedRing[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // Project and draw satellites
      satellites.forEach(sat => {
        sat.phase += sat.speed;

        const r = currentRadius * sat.radiusFactor;
        const sx = r * Math.cos(sat.phase);
        const sz = r * Math.sin(sat.phase);
        const sy = 0;

        const y_inc = -sz * Math.sin(sat.inclination);
        const z_inc = sz * Math.cos(sat.inclination);

        const x_yaw = sx * Math.cos(sat.yaw) - z_inc * Math.sin(sat.yaw);
        const z_yaw = sx * Math.sin(sat.yaw) + z_inc * Math.cos(sat.yaw);
        const y_yaw = y_inc;

        let x1 = x_yaw * cosY - z_yaw * sinY;
        let z1 = x_yaw * sinY + z_yaw * cosY;

        let y2 = y_yaw * cosX - z1 * sinX;
        let z2 = y_yaw * sinX + z1 * cosX;

        const scale = dist / (dist + z2);
        const screenX = x1 * scale + centerX;
        const screenY = y2 * scale + centerY;

        // Draw full orbit trailing path (tilted 3D circle)
        ctx.beginPath();
        const orbitSteps = 32;
        for (let step = 0; step <= orbitSteps; step++) {
          const stepPhase = (step * 2 * Math.PI) / orbitSteps;
          const ox = r * Math.cos(stepPhase);
          const oz = r * Math.sin(stepPhase);
          
          const oy_inc = -oz * Math.sin(sat.inclination);
          const oz_inc = oz * Math.cos(sat.inclination);

          const ox_yaw = ox * Math.cos(sat.yaw) - oz_inc * Math.sin(sat.yaw);
          const oz_yaw = ox * Math.sin(sat.yaw) + oz_inc * Math.cos(sat.yaw);
          const oy_yaw = oy_inc;

          let ox1 = ox_yaw * cosY - oz_yaw * sinY;
          let oz1 = ox_yaw * sinY + oz_yaw * cosY;

          let oy2 = oy_yaw * cosX - oz1 * sinX;
          let oz2 = oy_yaw * sinX + oz1 * cosX;

          const oscale = dist / (dist + oz2);
          const osx = ox1 * oscale + centerX;
          const osy = oy2 * oscale + centerY;

          if (step === 0) ctx.moveTo(osx, osy);
          else ctx.lineTo(osx, osy);
        }
        ctx.strokeStyle = sat.hue === 180 ? 'rgba(0, 229, 255, 0.04)' : 'rgba(157, 78, 221, 0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Draw active satellite node
        if (z2 < 100) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, sat.size, 0, Math.PI * 2);
          ctx.fillStyle = sat.hue === 180 ? '#00E5FF' : '#9D4EDD';
          ctx.shadowBlur = 6;
          ctx.shadowColor = sat.hue === 180 ? '#00E5FF' : '#9D4EDD';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw small coordinate label (Bloomberg analytical style)
          ctx.fillStyle = 'rgba(139, 152, 166, 0.35)';
          ctx.font = '7px monospace';
          ctx.fillText(`S-${sat.hue === 180 ? 'A' : 'B'}:${Math.round(z2)}`, screenX + 6, screenY + 2);
        }
      });

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
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [accessed]);

  // Decryption transition trigger
  const handleAccessCore = () => {
    setGlitching(true);
    audio?.playLaserCharge();
    // Matrix glitch delay
    setTimeout(() => {
      audio?.playSuccess();
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
        <div className="flex items-center gap-2 border border-[#8B2BE2]/40 bg-[#9D4EDD]/5 px-3 py-1.5 rounded-[3px]">
          <ShieldAlert className="h-4 w-4 text-[#9D4EDD] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#9D4EDD] font-mono">
            COGNITIVE CRYPTO SHIELD ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (audio) {
                const isMuted = audio.toggleMute();
                setMutedState(isMuted);
                if (!isMuted) {
                  audio.playClick();
                }
              }
            }}
            className="text-[#8B98A6] hover:text-white transition p-1.5 border border-[#1E2333] bg-[#07090F]/60 rounded-[3px] cursor-pointer flex items-center justify-center"
            title={mutedState ? "Unmute Audio" : "Mute Audio"}
          >
            {mutedState ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>
          <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest">
            SYS_STATUS: CRYPTED
          </div>
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
        <div className="w-full bg-[#07090F]/80 border border-[#1E2333] rounded-[3px] p-4 mt-8 font-mono text-[9px] text-left leading-normal text-[#8B98A6] flex flex-col gap-1.5 h-[120px] overflow-hidden shadow-2xl backdrop-blur-sm">
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
            className="w-full md:w-64 bg-transparent border-2 border-cyan-400/70 hover:border-cyan-400 text-cyan-400 hover:text-[#030407] hover:bg-cyan-400 font-extrabold text-xs tracking-widest py-3.5 px-6 rounded-[3px] transition-all duration-300 transform active:scale-95 hover:shadow-[0_0_25px_rgba(0,229,255,0.35)] cursor-pointer"
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
