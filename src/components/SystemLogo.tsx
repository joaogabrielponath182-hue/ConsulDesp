import React from 'react';

interface SystemLogoProps {
  size?: number;
  className?: string;
}

export default function SystemLogo({ size = 24, className = "" }: SystemLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-200 ${className}`}
    >
      <defs>
        {/* Background gradient for depth */}
        <linearGradient id="shieldBg" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.6" />
        </linearGradient>

        {/* Upward financial trend gradient */}
        <linearGradient id="financialTrend" x1="15" y1="80" x2="85" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" /> {/* Emerald 600 */}
          <stop offset="50%" stopColor="#10B981" /> {/* Emerald 500 */}
          <stop offset="100%" stopColor="#34D399" /> {/* Emerald 400 */}
        </linearGradient>

        {/* Coin Glow */}
        <radialGradient id="coinOuterGlow" cx="74" cy="74" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hexagonal Shield Background - High security corporate feel */}
      <path 
        d="M 50,5 L 88,27 L 88,73 L 50,95 L 12,73 L 12,27 Z" 
        fill="url(#shieldBg)"
        className="stroke-[1.5] stroke-slate-300 dark:stroke-slate-800"
        strokeLinejoin="round"
      />
      
      {/* 1. DOCUMENT (Dispatcher deeds, reports, filings) */}
      <g className="opacity-75 dark:opacity-90">
        {/* Document page body with folder corner */}
        <path 
          d="M 28,24 H 58 L 70,36 V 76 H 28 Z" 
          fill="none" 
          className="stroke-[2] stroke-slate-500 dark:stroke-slate-400"
          strokeLinejoin="round"
        />
        {/* Page folded corner */}
        <path 
          d="M 58,24 V 36 H 70" 
          fill="none"
          className="stroke-[2] stroke-slate-500 dark:stroke-slate-400"
          strokeLinejoin="round"
        />
        {/* Mini text representation lines */}
        <line x1="34" y1="42" x2="48" y2="42" className="stroke-[1.5] stroke-slate-400 dark:stroke-slate-500" strokeLinecap="round" />
        <line x1="34" y1="48" x2="44" y2="48" className="stroke-[1.5] stroke-slate-400 dark:stroke-slate-500" strokeLinecap="round" />
      </g>

      {/* 2. VEHICLE (Automobile contours seamlessly nested inside document body) */}
      <g className="opacity-90 dark:opacity-100">
        {/* Stylized sports/utility car contour */}
        <path 
          d="M 33,63 C 33,60.5 38,58.5 42,58.5 C 44.5,58.5 47,54 50,54 C 55,54 58,58.5 62,58.5 C 65,58.5 67,60.5 67,63 L 67,66 C 67,67 66,67.5 65,67.5 H 35 C 34,67.5 33,67 33,66 Z" 
          fill="none"
          className="stroke-[1.75] stroke-teal-500 dark:stroke-teal-400"
          strokeLinejoin="round"
        />
        {/* Tire/wheel cutouts */}
        <circle cx="41" cy="67.5" r="2.2" className="fill-slate-100 dark:fill-[#0F1115] stroke-[1.75] stroke-teal-500 dark:stroke-teal-400" />
        <circle cx="59" cy="67.5" r="2.2" className="fill-slate-100 dark:fill-[#0F1115] stroke-[1.75] stroke-teal-500 dark:stroke-teal-400" />
      </g>

      {/* 3. FINANCE (High contrast, modern glowing upward trend arrow) */}
      <path 
        d="M 18,80 Q 32,74 46,52 T 76,20" 
        fill="none" 
        stroke="url(#financialTrend)" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="drop-shadow-[0_2px_3px_rgba(16,185,129,0.3)]"
      />
      {/* Upward arrow pointer */}
      <path 
        d="M 68,20 H 76 V 28" 
        fill="none" 
        stroke="url(#financialTrend)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Bottom right coin badge overlay */}
      <g className="drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]">
        {/* Glow */}
        <circle cx="74" cy="74" r="12" fill="url(#coinOuterGlow)" />
        {/* Coin frame */}
        <circle 
          cx="74" cy="74" r="9" 
          className="fill-emerald-500 dark:fill-emerald-650 stroke-[1.5] stroke-white dark:stroke-emerald-300" 
        />
        {/* Dollar indicator */}
        <path 
          d="M 74,70.5 V 77.5 M 76,72 H 73 C 72.2,72 71.8,72.4 71.8,73 C 71.8,73.6 72.5,74 73.5,74.3 C 74.5,74.6 75.2,75 75.2,75.7 C 75.2,76.3 74.5,76.8 73.8,76.8 H 72" 
          fill="none" 
          className="stroke-[1.25] stroke-white dark:stroke-emerald-100" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
