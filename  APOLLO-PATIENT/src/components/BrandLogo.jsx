import React from 'react';

/**
 * BrandLogo — CareFlow
 * Renders a clean modern SVG vector logo and name for a white-label enterprise experience.
 */
export default function BrandLogo({ variant = 'inline', className = '', height = 32 }) {
  const iconSvg = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      style={{ height: `${height}px`, width: `${height}px` }}
    >
      {/* Overlapping premium operational curves representing continuous clinic flow */}
      <path
        d="M6 16C6 10.4772 10.4772 6 16 6C19.5 6 22.5 8 24 11"
        stroke="#0f766e"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M26 16C26 21.5228 21.5228 26 16 26C12.5 26 9.5 24 8 21"
        stroke="#0d9488"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4.5" fill="#0f766e" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 select-none ${className}`} 
      style={{ height: `${height}px` }}
    >
      {iconSvg}
      <span 
        className="font-sans font-extrabold tracking-tight text-[#0F172A] text-lg leading-none"
        style={{ letterSpacing: '-0.03em' }}
      >
        Care<span className="text-[#0f766e]">Flow</span>
      </span>
    </div>
  );
}
