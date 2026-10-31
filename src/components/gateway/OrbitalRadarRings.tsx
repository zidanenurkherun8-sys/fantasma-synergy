'use client';

import React, { useMemo } from 'react';

interface OrbitalRadarRingsProps {
  mouseX?: number;
  mouseY?: number;
  opacity?: number;
}

export const OrbitalRadarRings: React.FC<OrbitalRadarRingsProps> = ({
  mouseX = 0,
  mouseY = 0,
  opacity = 0.20, // Low opacity max 20% per instruction
}) => {
  const { degreeTicks, degreeLabels } = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; isMajor: boolean }[] = [];
    const labels: { x: number; y: number; text: string; deg: number; rot: number }[] = [];
    const rRing = 205;

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

    for (let a = -140; a <= 140; a += 2.5) {
      const rad = ((a - 90) * Math.PI) / 180;
      const isMajor = a % 10 === 0 || a === 0;
      const len = isMajor ? 11 : 5.5;

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
      const lx = Math.cos(rad) * (rRing + 21);
      const ly = Math.sin(rad) * (rRing + 21);
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

  const dashedNodes = useMemo(() => {
    const r = 165;
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

  const sphereNodes = useMemo(() => {
    return [
      { cx: -115, cy: -34, r: 2.4 },
      { cx: 115, cy: -34, r: 2.4 },
      { cx: -145, cy: 0, r: 2.6 },
      { cx: 145, cy: 0, r: 2.6 },
      { cx: -115, cy: 34, r: 2.4 },
      { cx: 115, cy: 34, r: 2.4 },
      { cx: 0, cy: -60, r: 3 },
      { cx: 0, cy: 60, r: 3 },
    ];
  }, []);

  const tiltX = 56 + mouseY * 6;
  const tiltY = mouseX * 8;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible transition-opacity duration-300"
      style={{ opacity }}
    >
      {/* Center 3D Radar System */}
      <div
        className="relative w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] preserve-3d transition-transform duration-300 ease-out"
        style={{
          perspective: '1000px',
          transform: `rotateX(${tiltX}deg) rotateZ(${tiltY}deg)`,
        }}
      >
        <svg
          viewBox="-260 -260 520 520"
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
          </defs>

          {/* Outer Boundary Reticle Ring */}
          <circle
            cx="0"
            cy="0"
            r="248"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="0.8"
            strokeOpacity="0.3"
            strokeDasharray="6 8"
          />

          {/* RING 1: Main Dial Circular Ring */}
          <circle
            cx="0"
            cy="0"
            r="205"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="1.5"
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
              strokeWidth={t.isMajor ? 1.5 : 0.75}
              strokeOpacity={t.isMajor ? 0.95 : 0.45}
            />
          ))}

          {/* Degree Labels on the Arc */}
          {degreeLabels.map((l, idx) => (
            <text
              key={`label-${idx}`}
              x={l.x}
              y={l.y}
              fill="#00F0FF"
              fontSize="7.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              opacity="0.85"
            >
              {l.text}
            </text>
          ))}

          {/* Glowing Beacon Node at Top */}
          <circle
            cx="-12"
            cy="-205"
            r="4"
            fill="#00F0FF"
            filter="url(#flareGlow)"
            className="animate-glow-pulse"
          />

          {/* RING 2: DASHED CONCENTRIC RING & GLOWING NODES */}
          <g className="animate-radar-spin-ccw">
            <circle
              cx="0"
              cy="0"
              r="165"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.2"
              strokeDasharray="6 14"
              strokeOpacity="0.75"
              filter="url(#cyanGlow)"
            />

            {dashedNodes.map((n, idx) => (
              <circle
                key={`d-node-${idx}`}
                cx={n.cx}
                cy={n.cy}
                r="3.5"
                fill="#00F0FF"
                filter="url(#cyanGlow)"
                className="animate-glow-pulse"
              />
            ))}
          </g>

          {/* ARMILLARY WIREFRAME */}
          <g className="opacity-50">
            <ellipse cx="0" cy="0" rx="180" ry="48" fill="none" stroke="#00F0FF" strokeWidth="0.8" strokeOpacity="0.45" />
            <ellipse cx="0" cy="-38" rx="155" ry="40" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="38" rx="155" ry="40" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />

            <ellipse cx="0" cy="0" rx="48" ry="180" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="0" rx="112" ry="180" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.3" />

            {sphereNodes.map((pt, idx) => (
              <circle
                key={`s-node-${idx}`}
                cx={pt.cx}
                cy={pt.cy}
                r={pt.r}
                fill="#00F0FF"
                filter="url(#cyanGlow)"
                className="animate-glow-pulse"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default OrbitalRadarRings;
