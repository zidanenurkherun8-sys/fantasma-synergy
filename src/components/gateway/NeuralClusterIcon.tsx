'use client';

import React from 'react';

export const NeuralClusterIcon: React.FC = () => {
  // Coordinated nodes forming an aerospace neural network / brain cluster
  const nodes = [
    // Frontal Lobe (left)
    { id: 1, cx: 12, cy: 19, r: 2.2, delay: 0 },
    { id: 2, cx: 18, cy: 11, r: 2.4, delay: 0.2 },
    { id: 3, cx: 28, cy: 9, r: 2.2, delay: 0.4 },
    { id: 4, cx: 38, cy: 10, r: 2.5, delay: 0.1 },
    { id: 5, cx: 48, cy: 13, r: 2.3, delay: 0.3 },
    { id: 6, cx: 56, cy: 20, r: 2.2, delay: 0.5 },

    // Middle Hemisphere Synapses
    { id: 7, cx: 22, cy: 23, r: 2.8, delay: 0.6 },
    { id: 8, cx: 34, cy: 22, r: 3.2, delay: 0 },
    { id: 9, cx: 46, cy: 25, r: 2.8, delay: 0.2 },

    // Core / Nucleus
    { id: 10, cx: 35, cy: 32, r: 3.6, delay: 0.3 },
    { id: 11, cx: 23, cy: 35, r: 2.5, delay: 0.5 },
    { id: 12, cx: 47, cy: 35, r: 2.6, delay: 0.1 },

    // Temporal & Stem
    { id: 13, cx: 16, cy: 31, r: 2.2, delay: 0.7 },
    { id: 14, cx: 28, cy: 44, r: 2.4, delay: 0.4 },
    { id: 15, cx: 40, cy: 43, r: 2.5, delay: 0.6 },
    { id: 16, cx: 52, cy: 31, r: 2.2, delay: 0.2 },
  ];

  // Interconnecting synapse lines
  const edges = [
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [1, 7], [2, 7], [3, 8], [4, 8], [4, 9], [5, 9], [6, 16],
    [7, 8], [8, 9], [7, 11], [8, 10], [9, 12],
    [1, 13], [13, 11], [11, 10], [10, 12], [12, 16],
    [11, 14], [10, 14], [10, 15], [12, 15], [14, 15]
  ];

  return (
    <div className="w-[58px] h-[50px] relative flex items-center justify-center">
      <svg
        viewBox="0 0 68 54"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="neuralGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Synapse Connecting Edges */}
        {edges.map(([fromId, toId], idx) => {
          const fromNode = nodes.find(n => n.id === fromId)!;
          const toNode = nodes.find(n => n.id === toId)!;
          return (
            <line
              key={`edge-${idx}`}
              x1={fromNode.cx}
              y1={fromNode.cy}
              x2={toNode.cx}
              y2={toNode.cy}
              stroke="#00F0FF"
              strokeWidth="0.8"
              strokeOpacity="0.45"
            />
          );
        })}

        {/* Dynamic Synaptic Nodes */}
        {nodes.map(node => (
          <g key={`node-${node.id}`}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="#00F0FF"
              filter="url(#neuralGlow)"
              className="animate-glow-pulse"
              style={{ animationDelay: `${node.delay}s` }}
            />
            {/* Occasional bright accent on core nodes */}
            {(node.id === 8 || node.id === 10) && (
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r * 1.5}
                fill="none"
                stroke="#00FF9D"
                strokeWidth="0.6"
                strokeOpacity="0.8"
                className="animate-ping"
                style={{ animationDuration: '3s' }}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default NeuralClusterIcon;
