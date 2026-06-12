'use client';

import React from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function TiltCard({ children, className = '', ...props }: TiltCardProps) {
  return (
    <div
      className={`quantum-card rounded-[3px] bg-[#07090F] border border-[#1E2333] overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
