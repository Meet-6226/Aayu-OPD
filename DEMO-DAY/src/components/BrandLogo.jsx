import React from 'react';

/**
 * BrandLogo — Nidaan One (Staff Portal Variant)
 * Renders the custom Nidaan One emblem (caduceus / medical curves) and typography.
 */
export default function BrandLogo({ variant = 'inline', className = '', height = 32 }) {
  const iconSvg = (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      style={{ height: `${height}px`, width: `${height * 1.2}px` }}
    >
      <defs>
        <linearGradient id="nidaanGradStaff" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="nidaanLightGradStaff" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {/* Stylized Wing/Caduceus curves intersecting 'N' */}
      {/* Left wing */}
      <path
        d="M20 18C15 17.5 8 16 6 12C8.5 12 14.5 14 20 16"
        stroke="url(#nidaanGradStaff)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 15C13 14 7 12 5 8C8.5 8.5 14 11 20 13"
        stroke="url(#nidaanGradStaff)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right wing */}
      <path
        d="M28 18C33 17.5 40 16 42 12C39.5 12 33.5 14 28 16"
        stroke="url(#nidaanLightGradStaff)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 15C35 14 41 12 43 8C39.5 8.5 34 11 28 13"
        stroke="url(#nidaanLightGradStaff)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Staff (Rod of Asclepius) */}
      <rect x="23" y="10" width="2" height="28" rx="1" fill="url(#nidaanGradStaff)" />
      <circle cx="24" cy="8" r="3" fill="url(#nidaanGradStaff)" />

      {/* Winding Snakes */}
      <path
        d="M17 32C17 28 31 29 31 25C31 21 17 22 17 18C17 15 22 14 24 14"
        stroke="url(#nidaanGradStaff)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M31 32C31 28 17 29 17 25C17 21 31 22 31 18C31 15 26 14 24 14"
        stroke="url(#nidaanLightGradStaff)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'icon' || variant === 'image') {
    return (
      <div className={`flex items-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  // Calculate text scale based on height
  const titleSize = height >= 36 ? 'text-lg sm:text-xl' : 'text-sm sm:text-md';
  const subtitleSize = height >= 36 ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[7px] sm:text-[8px]';

  return (
    <div 
      className={`flex items-center gap-3.5 select-none ${className}`} 
      style={{ height: `${height}px` }}
    >
      {iconSvg}
      <div className="flex flex-col justify-center text-left leading-none">
        <span 
          className={`font-sans font-extrabold tracking-tight text-[#0F172A] ${titleSize} flex items-center leading-none`}
          style={{ letterSpacing: '-0.02em' }}
        >
          Nidaan<span className="text-[#0f766e] ml-1">One</span>
          <span className="font-sans font-semibold text-[13px] sm:text-[14px] text-[#0f766e] ml-1.5 px-1.5 py-0.2 bg-[#f0fdfa] border border-[#ccfbf1] rounded-[4px] tracking-normal">OPD</span>
        </span>
        <span 
          className={`font-sans font-black tracking-widest text-[#64748B] uppercase ${subtitleSize} mt-1`}
          style={{ letterSpacing: '0.12em' }}
        >
          Hospital Operations Intelligence
        </span>
      </div>
    </div>
  );
}
