'use client';

import React, { useMemo } from 'react';

interface OrbitalRadarRingsProps {
  mouseX?: number;
  mouseY?: number;
}

export const OrbitalRadarRings: React.FC<OrbitalRadarRingsProps> = ({
  mouseX = 0,
  mouseY = 0,
}) => {
  // Degrees displayed on the outer arc matching the screenshot:
  // [100, 110, 120, 130, 310, 320, 330, 340, 350, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
  const { degreeTicks, degreeLabels } = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; isMajor: boolean }[] = [];
    const labels: { x: number; y: number; text: string; deg: number; rot: number }[] = [];
    const rRing = 195;

    // Specific displayed labels around the arc matching reference
    const arcLabels = [
      { text: '100°', angle: -130 },
      { text: '110°', angle: -115 },
      { text: '120°', angle: -100 },
      { text: '130°', angle: -85 },
      { text: '320°', angle: -65 },
      { text: '330°', angle: -50 },
      { text: '340°', angle: -35 },
      { text: '350°', angle: -18 },
      { text: '0°',   angle: 0 },
      { text: '10°',  angle: 18 },
      { text: '20°',  angle: 35 },
      { text: '30°',  angle: 50 },
      { text: '40°',  angle: 65 },
      { text: '50°',  angle: 80 },
      { text: '60°',  angle: 95 },
      { text: '70°',  angle: 110 },
      { text: '80°',  angle: 125 },
      { text: '90°',  angle: 140 },
    ];

    // Ticks around the upper and side arc (-140 to 140)
    for (let a = -140; a <= 140; a += 2.5) {
      const rad = ((a - 90) * Math.PI) / 180;
      const isMajor = a % 10 === 0 || a === 0;
      const len = isMajor ? 10 : 5;

      ticks.push({
        x1: Math.cos(rad) * rRing,
        y1: Math.sin(rad) * rRing,
        x2: Math.cos(rad) * (rRing + len),
        y2: Math.sin(rad) * (rRing + len),
        isMajor,
      });
    }

    arcLabels.forEach(item => {
      const rad = ((item.angle - 90) * Math.PI) / 180;
      const lx = Math.cos(rad) * (rRing + 20);
      const ly = Math.sin(rad) * (rRing + 20);
      labels.push({
        x: lx,
        y: ly,
        text: item.text,
        deg: item.angle,
        rot: item.angle,
      });
    });

    return { degreeTicks: ticks, degreeLabels: labels };
  }, []);

  // Dashed Ring Nodes
  const dashedNodes = useMemo(() => {
    const r = 155;
    const angles = [-120, -50, 20, 85, 160, 230];
    return angles.map(deg => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return {
        cx: Math.cos(rad) * r,
        cy: Math.sin(rad) * r,
        deg,
      };
    });
  }, []);

  // Armillary sphere intersection nodes
  const sphereNodes = useMemo(() => {
    return [
      { cx: -105, cy: -32, r: 2.2 },
      { cx: 105, cy: -32, r: 2.2 },
      { cx: -135, cy: 0, r: 2.5 },
      { cx: 135, cy: 0, r: 2.5 },
      { cx: -105, cy: 32, r: 2.2 },
      { cx: 105, cy: 32, r: 2.2 },
      { cx: 0, cy: -55, r: 2.8 },
      { cx: 0, cy: 55, r: 2.8 },
      { cx: -50, cy: -20, r: 2 },
      { cx: 50, cy: -20, r: 2 },
      { cx: -50, cy: 20, r: 2 },
      { cx: 50, cy: 20, r: 2 },
      { cx: 0, cy: 0, r: 3.2 },
      { cx: -60, cy: -75, r: 2 },
      { cx: 60, cy: -75, r: 2 },
      { cx: -80, cy: 65, r: 2 },
      { cx: 80, cy: 65, r: 2 },
    ];
  }, []);

  // Dynamic parallax tilt
  const tiltX = 58 + mouseY * 6;
  const tiltY = mouseX * 8;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      {/* Background Isometric Wireframe Planes (matching screenshot sides) */}
      <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16 pointer-events-none opacity-20">
        {/* Left Wireframe Grid Box */}
        <svg width="180" height="120" viewBox="0 0 180 120" className="hidden lg:block overflow-visible">
          <path d="M10 80 L90 30 L170 50 L90 100 Z" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <path d="M10 80 L10 110 L90 130 L90 100" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <path d="M170 50 L170 80 L90 130" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <line x1="30" y1="67" x2="110" y2="17" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="50" y1="55" x2="130" y2="5" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" />
        </svg>

        {/* Right Wireframe Grid Box */}
        <svg width="180" height="120" viewBox="0 0 180 120" className="hidden lg:block overflow-visible">
          <path d="M10 50 L90 20 L170 70 L90 100 Z" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <path d="M10 50 L10 80 L90 130 L90 100" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <path d="M170 70 L170 100 L90 130" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
          <line x1="50" y1="35" x2="130" y2="85" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Center 3D Radar System */}
      <div
        className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] preserve-3d transition-transform duration-300 ease-out"
        style={{
          perspective: '1000px',
          transform: `rotateX(${tiltX}deg) rotateZ(${tiltY}deg)`,
        }}
      >
        <svg
          viewBox="-250 -250 500 500"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="flareGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="centerAtmosphere" cx="0%" cy="0%" r="50%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#00F0FF" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Radial Atmosphere */}
          <circle cx="0" cy="0" r="170" fill="url(#centerAtmosphere)" />

          {/* Outer Boundary Reticle Ring */}
          <circle
            cx="0"
            cy="0"
            r="238"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="0.75"
            strokeOpacity="0.25"
            strokeDasharray="6 8"
          />

          {/* ========================================================
              RING 1: DEGREE TICK SCALE & ARC LABELS
             ======================================================== */}
          {/* Main Dial Circular Ring */}
          <circle
            cx="0"
            cy="0"
            r="195"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="1.4"
            filter="url(#cyanGlow)"
          />

          {/* Degree Ticks */}
          {degreeTicks.map((t, idx) => (
            <line
              key={`tick-${idx}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#00F0FF"
              strokeWidth={t.isMajor ? 1.4 : 0.7}
              strokeOpacity={t.isMajor ? 0.9 : 0.45}
            />
          ))}

          {/* Degree Labels on the Arc */}
          {degreeLabels.map((l, idx) => (
            <text
              key={`label-${idx}`}
              x={l.x}
              y={l.y}
              fill="#00F0FF"
              fontSize="7"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              opacity="0.85"
            >
              {l.text}
            </text>
          ))}

          {/* Prominent Glowing Beacon Node at Top (near -90deg / 355-0deg) */}
          <circle
            cx="-12"
            cy="-195"
            r="3.8"
            fill="#00F0FF"
            filter="url(#flareGlow)"
            className="animate-glow-pulse"
          />

          {/* ========================================================
              RING 2: DASHED CONCENTRIC RING & GLOWING NODES
             ======================================================== */}
          <g className="animate-radar-spin-ccw">
            <circle
              cx="0"
              cy="0"
              r="155"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.2"
              strokeDasharray="6 14"
              strokeOpacity="0.75"
              filter="url(#cyanGlow)"
            />

            {dashedNodes.map((n, idx) => (
              <g key={`d-node-${idx}`}>
                <circle
                  cx={n.cx}
                  cy={n.cy}
                  r="3.2"
                  fill="#00F0FF"
                  filter="url(#cyanGlow)"
                  className="animate-glow-pulse"
                />
                <circle
                  cx={n.cx}
                  cy={n.cy}
                  r="5.5"
                  fill="none"
                  stroke="#00FF9D"
                  strokeWidth="0.6"
                  strokeOpacity="0.6"
                />
              </g>
            ))}
          </g>

          {/* ========================================================
              ARMILLARY CELESTIAL SPHERE WIREFRAME (The Eye)
             ======================================================== */}
          <g className="opacity-60">
            {/* Latitude Ellipses */}
            <ellipse cx="0" cy="0" rx="168" ry="46" fill="none" stroke="#00F0FF" strokeWidth="0.8" strokeOpacity="0.45" />
            <ellipse cx="0" cy="-35" rx="146" ry="38" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="35" rx="146" ry="38" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="-70" rx="105" ry="24" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.25" />
            <ellipse cx="0" cy="70" rx="105" ry="24" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.25" />

            {/* Longitude Arcs */}
            <ellipse cx="0" cy="0" rx="46" ry="168" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="0" rx="105" ry="168" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.3" />
            <ellipse cx="0" cy="0" rx="146" ry="168" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.2" />

            {/* Intersection Nodes */}
            {sphereNodes.map((pt, idx) => (
              <circle
                key={`s-node-${idx}`}
                cx={pt.cx}
                cy={pt.cy}
                r={pt.r}
                fill="#00F0FF"
                filter="url(#cyanGlow)"
                className="animate-glow-pulse"
                style={{ animationDelay: `${idx * 0.15}s` }}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Horizontal Anamorphic Lens Flare Beam behind center typography */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[2px] pointer-events-none z-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00F0FF]/35 to-transparent blur-[1px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-[2.5px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_16px_#00F0FF]" />
        {/* Optical cyan flare spot on left */}
        <div className="absolute top-1/2 left-[24%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00F0FF] blur-[3px] opacity-90 animate-glow-pulse" />
      </div>
    </div>
  );
};

export default OrbitalRadarRings;
