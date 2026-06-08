'use client';

import React, { useRef } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function TiltCard({ children, className = '', ...props }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Limit rotation tilt to ±6 degrees for institutional professional UX
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    card.style.transition = 'none';

    // Move holographic glow spot coordinates
    const glow = card.querySelector('.tilt-glow') as HTMLDivElement;
    if (glow) {
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 229, 255, 0.08) 0%, transparent 65%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';

    const glow = card.querySelector('.tilt-glow') as HTMLDivElement;
    if (glow) {
      glow.style.background = 'transparent';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`quantum-card preserve-3d relative ${className}`}
      {...props}
    >
      {/* Dynamic spectral holographic light overlay */}
      <div className="tilt-glow absolute inset-0 pointer-events-none z-10 transition-all duration-300 rounded-xl" />
      <div className="relative z-20 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
