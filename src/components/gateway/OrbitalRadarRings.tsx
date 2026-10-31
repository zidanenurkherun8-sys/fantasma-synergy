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
  // Generate degree scale ticks and labels for Ring 1 (Degree Dial)
  const { majorTicks, minorTicks, degreeLabels } = useMemo(() => {
    const majors: { x1: number; y1: number; x2: number; y2: number; deg: number }[] = [];
    const minors: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const labels: { x: number; y: number; text: string; deg: number }[] = [];
    const radius = 200;

    // Display labels specifically matching telemetry aerospace HUD style
    const labeledAngles = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 330, 340, 350];

    for (let deg = 0; deg < 360; deg += 2.5) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const isMajor = deg % 10 === 0;
      const tickLen = isMajor ? 10 : 5;

      const x1 = Math.cos(rad) * radius;
      const y1 = Math.sin(rad) * radius;
      const x2 = Math.cos(rad) * (radius - tickLen);
      const y2 = Math.sin(rad) * (radius - tickLen);

      if (isMajor) {
        majors.push({ x1, y1, x2, y2, deg });
        if (labeledAngles.includes(deg)) {
          const lx = Math.cos(rad) * (radius - 20);
          const ly = Math.sin(rad) * (radius - 20);
          labels.push({ x: lx, y: ly, text: `${deg}°`, deg });
        }
      } else {
        minors.push({ x1, y1, x2, y2 });
      }
    }

    return { majorTicks: majors, minorTicks: minors, degreeLabels: labels };
  }, []);

  // Glowing nodes along Ring 2 (Dashed Ring)
  const ring2Nodes = useMemo(() => {
    const radius = 158;
    const angles = [15, 65, 125, 190, 245, 305];
    return angles.map(deg => {
      const rad = (deg * Math.PI) / 180;
      return {
        cx: Math.cos(rad) * radius,
        cy: Math.sin(rad) * radius,
        deg,
      };
    });
  }, []);

  // Wireframe intersection nodes (Armillary Sphere / Celestial Globe)
  const sphereNodes = useMemo(() => {
    return [
      { cx: -95, cy: -32, r: 2.2 },
      { cx: 95, cy: -32, r: 2.2 },
      { cx: -130, cy: 0, r: 2.5 },
      { cx: 130, cy: 0, r: 2.5 },
      { cx: -95, cy: 32, r: 2.2 },
      { cx: 95, cy: 32, r: 2.2 },
      { cx: 0, cy: -50, r: 2.8 },
      { cx: 0, cy: 50, r: 2.8 },
      { cx: -45, cy: -18, r: 2 },
      { cx: 45, cy: -18, r: 2 },
      { cx: -45, cy: 18, r: 2 },
      { cx: 45, cy: 18, r: 2 },
      { cx: 0, cy: 0, r: 3 },
    ];
  }, []);

  // Subtle interactive 3D tilt offset
  const tiltX = 60 + mouseY * 6;
  const tiltY = mouseX * 8;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible radar-perspective-container">
      {/* 3D Tilted Orbital System */}
      <div
        className="relative w-[340px] h-[340px] md:w-[500px] md:h-[500px] transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: `rotateX(${tiltX}deg) rotateZ(${tiltY}deg)`,
        }}
      >
        <svg
          viewBox="-250 -250 500 500"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Neon Cyan Glow Filter */}
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intense Glow for Primary Accents */}
            <filter id="intenseGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial Gradient for Center Ambience */}
            <radialGradient id="radarCenterAmbient" cx="0%" cy="0%" r="50%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#00F0FF" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Center Glow Circle */}
          <circle cx="0" cy="0" r="160" fill="url(#radarCenterAmbient)" />

          {/* ========================================================
              RING 3 (Luar): Lingkaran tipis dengan opacity rendah
              sebagai pembatas visual + Reticle marks
             ======================================================== */}
          <g className="opacity-40">
            <circle
              cx="0"
              cy="0"
              r="232"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
            <circle
              cx="0"
              cy="0"
              r="244"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            {/* 4 Quadrant Reticle Marks */}
            <line x1="-248" y1="0" x2="-236" y2="0" stroke="#00F0FF" strokeWidth="1.5" />
            <line x1="236" y1="0" x2="248" y2="0" stroke="#00F0FF" strokeWidth="1.5" />
            <line x1="0" y1="-248" x2="0" y2="-236" stroke="#00F0FF" strokeWidth="1.5" />
            <line x1="0" y1="236" x2="0" y2="248" stroke="#00F0FF" strokeWidth="1.5" />
          </g>

          {/* ========================================================
              RING 1 (Dalam / Dial): Garis tipis (1px) dengan skala derajat
              (tick marks) setiap 10 derajat, berputar lambat searah jarum jam.
             ======================================================== */}
          <g className="animate-radar-spin-cw">
            {/* Primary Ring 1 Path */}
            <circle
              cx="0"
              cy="0"
              r="200"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.2"
              filter="url(#cyanGlow)"
            />

            {/* Minor Ticks (every 2.5 deg) */}
            {minorTicks.map((t, idx) => (
              <line
                key={`minor-${idx}`}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#00F0FF"
                strokeWidth="0.6"
                strokeOpacity="0.4"
              />
            ))}

            {/* Major Ticks (every 10 deg) */}
            {majorTicks.map(t => (
              <line
                key={`major-${t.deg}`}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#00F0FF"
                strokeWidth="1.2"
                strokeOpacity="0.85"
                filter="url(#cyanGlow)"
              />
            ))}

            {/* Degree Number Labels */}
            {degreeLabels.map(l => (
              <text
                key={`deg-${l.deg}`}
                x={l.x}
                y={l.y}
                fill="#00F0FF"
                fontSize="7.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${l.deg + 90}, ${l.x}, ${l.y})`}
                opacity="0.8"
              >
                {l.text}
              </text>
            ))}
          </g>

          {/* ========================================================
              RING 2 (Tengah): Garis putus-putus (dashed) dengan
              beberapa node kecil (titik) yang menyala, berputar berlawanan arah.
             ======================================================== */}
          <g className="animate-radar-spin-ccw">
            <circle
              cx="0"
              cy="0"
              r="158"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.2"
              strokeDasharray="6 12"
              strokeOpacity="0.75"
              filter="url(#cyanGlow)"
            />

            {/* Orbiting Glowing Nodes */}
            {ring2Nodes.map(node => (
              <g key={`r2-node-${node.deg}`}>
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="3.2"
                  fill="#00F0FF"
                  filter="url(#intenseGlow)"
                  className="animate-glow-pulse"
                />
                <circle
                  cx={node.cx}
                  cy={node.cy}
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
              3D ARMILLARY SPHERE / CELESTIAL WIREFRAME (The Eye)
              Latitude and Longitude Grid with illuminated vertices
             ======================================================== */}
          <g className="opacity-65">
            {/* Latitude Circles (Perspective Ellipses) */}
            <ellipse cx="0" cy="0" rx="170" ry="46" fill="none" stroke="#00F0FF" strokeWidth="0.8" strokeOpacity="0.4" />
            <ellipse cx="0" cy="-35" rx="146" ry="38" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.3" />
            <ellipse cx="0" cy="35" rx="146" ry="38" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.3" />
            <ellipse cx="0" cy="-70" rx="100" ry="24" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.2" />
            <ellipse cx="0" cy="70" rx="100" ry="24" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.2" />

            {/* Longitude Arcs */}
            <ellipse cx="0" cy="0" rx="48" ry="170" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.35" />
            <ellipse cx="0" cy="0" rx="105" ry="170" fill="none" stroke="#00F0FF" strokeWidth="0.6" strokeOpacity="0.3" />
            <ellipse cx="0" cy="0" rx="148" ry="170" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeOpacity="0.2" />

            {/* Wireframe Intersection Vertices */}
            {sphereNodes.map((pt, idx) => (
              <circle
                key={`vtx-${idx}`}
                cx={pt.cx}
                cy={pt.cy}
                r={pt.r}
                fill="#00F0FF"
                filter="url(#cyanGlow)"
                className="animate-glow-pulse"
                style={{ animationDelay: `${idx * 0.2}s` }}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Horizontal Anamorphic Lens Flare Beam behind center branding */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[2px] pointer-events-none z-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent blur-[1px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#00F0FF]" />
        {/* Optical flare spot on the left */}
        <div className="absolute top-1/2 left-[28%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00F0FF] blur-[2px] opacity-80 animate-glow-pulse" />
      </div>
    </div>
  );
};

export default OrbitalRadarRings;
