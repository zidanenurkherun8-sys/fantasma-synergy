'use client';

import React from 'react';

export const NeuralClusterIcon: React.FC = () => {
  // Polygonal wireframe brain nodes matching the screenshot
  const nodes = [
    // Outer crown & frontal lobe
    { id: 1,  x: 18, y: 15 },
    { id: 2,  x: 27, y: 8 },
    { id: 3,  x: 40, y: 7 },
    { id: 4,  x: 52, y: 11 },
    { id: 5,  x: 62, y: 20 },
    { id: 6,  x: 65, y: 32 },

    // Mid cortex & parietal lobe
    { id: 7,  x: 22, y: 24 },
    { id: 8,  x: 35, y: 18 },
    { id: 9,  x: 48, y: 22 },
    { id: 10, x: 57, y: 32 },

    // Deep nucleus & subcortex
    { id: 11, x: 30, y: 31 },
    { id: 12, x: 44, y: 33 },
    { id: 13, x: 50, y: 41 },

    // Temporal lobe & cerebellum
    { id: 14, x: 20, y: 37 },
    { id: 15, x: 33, y: 44 },
    { id: 16, x: 42, y: 48 },
  ];

  // Triangulated faceted polygon edges forming the brain
  const edges = [
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [1, 7], [2, 7], [2, 8], [3, 8], [3, 9], [4, 9], [5, 9], [5, 10], [6, 10],
    [7, 8], [8, 9], [7, 11], [8, 11], [8, 12], [9, 12], [9, 10], [10, 13],
    [1, 14], [7, 14], [11, 14], [11, 15], [12, 13], [12, 15], [13, 16], [15, 16],
    [14, 15]
  ];

  return (
    <div className="w-[68px] h-[50px] flex items-center justify-end overflow-visible">
      <svg
        viewBox="10 4 60 48"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="brainGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brain Triangulated Mesh Wireframe Edges */}
        {edges.map(([fromId, toId], idx) => {
          const p1 = nodes.find(n => n.id === fromId)!;
          const p2 = nodes.find(n => n.id === toId)!;
          return (
            <line
              key={`b-edge-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#00F0FF"
              strokeWidth="0.85"
              strokeOpacity="0.55"
            />
          );
        })}

        {/* Vertex Glowing Nodes */}
        {nodes.map(n => (
          <circle
            key={`b-node-${n.id}`}
            cx={n.x}
            cy={n.y}
            r={n.id === 8 || n.id === 12 ? 2.5 : 1.8}
            fill="#00F0FF"
            filter="url(#brainGlow)"
            className="animate-glow-pulse"
            style={{ animationDelay: `${(n.id % 5) * 0.25}s` }}
          />
        ))}

        {/* Core Focal Synapse Node */}
        <circle
          cx="44"
          cy="33"
          r="3"
          fill="#00FF9D"
          filter="url(#brainGlow)"
          className="animate-ping"
          style={{ animationDuration: '3s' }}
        />
      </svg>
    </div>
  );
};

export default NeuralClusterIcon;
