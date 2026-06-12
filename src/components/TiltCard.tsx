'use client';

import React, { useRef } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const splitClasses = (className: string) => {
  const words = className.split(/\s+/);
  const outerClasses: string[] = ['scene-3d'];
  const innerClasses: string[] = ['quantum-card', 'preserve-3d'];

  const outerKeywords = [
    'col-', 'row-', 'shrink-', 'grow-',
    'lg:col-', 'md:col-', 'sm:col-', 'xl:col-',
    'lg:row-', 'md:row-', 'sm:row-', 'xl:row-',
    'absolute', 'fixed', 'sticky',
    'top-', 'bottom-', 'left-', 'right-', 'inset-',
    'z-', 'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
    'lg:m-', 'md:m-', 'sm:m-', 'xl:m-',
    'h-', 'w-', 'min-h-', 'max-h-', 'min-w-', 'max-w-',
    'lg:h-', 'md:h-', 'sm:h-', 'xl:h-',
    'lg:w-', 'md:w-', 'sm:w-', 'xl:w-',
    'lg:min-h-', 'md:min-h-', 'sm:min-h-', 'xl:min-h-',
    'lg:max-h-', 'md:max-h-', 'sm:max-h-', 'xl:max-h-'
  ];

  words.forEach(word => {
    if (!word) return;
    if (word === 'quantum-card' || word === 'preserve-3d') return;
    
    const isOuter = outerKeywords.some(kw => word.startsWith(kw) || word.includes(':' + kw));
    if (isOuter) {
      outerClasses.push(word);
    } else {
      innerClasses.push(word);
    }
  });

  return {
    outer: outerClasses.join(' '),
    inner: innerClasses.join(' ')
  };
};

export default function TiltCard({ children, className = '', ...props }: TiltCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const tilt = tiltRef.current;
    if (!container || !tilt) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    if (centerX <= 0 || centerY <= 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Limit rotation tilt to ±6 degrees for institutional professional UX
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;

    tilt.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    tilt.style.transition = 'none';

    // Move holographic glow spot coordinates
    const glow = tilt.querySelector('.tilt-glow') as HTMLDivElement;
    if (glow) {
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 229, 255, 0.08) 0%, transparent 65%)`;
    }
  };

  const handleMouseLeave = () => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    tilt.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';

    const glow = tilt.querySelector('.tilt-glow') as HTMLDivElement;
    if (glow) {
      glow.style.background = 'transparent';
    }
  };

  const { outer, inner } = splitClasses(className);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={outer}
      {...props}
    >
      <div
        ref={tiltRef}
        className={`${inner} w-full h-full relative`}
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)' }}
      >
        {/* Dynamic spectral holographic light overlay */}
        <div className="tilt-glow absolute inset-0 pointer-events-none z-10 transition-all duration-300 rounded-[3px]" />
        <div className="relative z-20 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
