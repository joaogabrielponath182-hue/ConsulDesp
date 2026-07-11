import React from 'react';
import { FileText, Car, Coins } from 'lucide-react';

interface SystemLogoProps {
  size?: number;
  className?: string;
}

export default function SystemLogo({ size = 18, className = "" }: SystemLogoProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size * 1.5, height: size * 1.5 }}>
      {/* FileText (Document) - Base layer, representing dispatcher files/documents */}
      <FileText 
        size={size * 1.3} 
        className="absolute text-slate-400 dark:text-slate-300 opacity-60 -translate-x-1.5 -translate-y-1.5" 
      />
      {/* Car (Vehicle) - Middle layer, representing dispatcher vehicle services */}
      <Car 
        size={size * 0.95} 
        className="absolute text-teal-600 dark:text-teal-400 translate-x-1.5 translate-y-1.5 drop-shadow-sm" 
      />
      {/* Coins (Finance) - Foreground overlay, representing finance control */}
      <Coins 
        size={size * 0.85} 
        className="absolute text-emerald-600 dark:text-emerald-400 -translate-x-1 translate-y-0.5 rounded-full bg-slate-100 dark:bg-[#161B22] p-0.5 border border-slate-300 dark:border-slate-800" 
      />
    </div>
  );
}
