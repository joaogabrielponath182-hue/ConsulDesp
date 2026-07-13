import React from 'react';
// @ts-ignore
import logoImg from '../assets/images/consul_desp_logo_1783942080739.jpg';

interface SystemLogoProps {
  size?: number;
  className?: string;
}

export default function SystemLogo({ size = 24, className = "" }: SystemLogoProps) {
  return (
    <div 
      className={`shrink-0 overflow-hidden relative rounded-md border border-emerald-500/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoImg}
        alt="ConsulDesp Logo"
        className="absolute inset-0 w-full h-full object-cover scale-[1.3] origin-center"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

