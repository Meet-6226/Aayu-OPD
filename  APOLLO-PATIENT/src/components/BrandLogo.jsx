import React from 'react';

/**
 * BrandLogo — Aayu
 * Renders the custom Aayu emblem (caduceus / medical curves) and typography.
 */
export default function BrandLogo({ variant = 'inline', className = '', height = 32 }) {
  const iconSvg = (
    <img
      src="/AAYU-logo-transparent.png"
      alt="AAYU Logo"
      className="shrink-0 object-contain drop-shadow-sm"
      style={{ height: `${height}px`, width: 'auto' }}
    />
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  // Calculate text scale based on height
  const titleSize = height >= 40 ? 'text-xl' : 'text-md';
  const subtitleSize = height >= 40 ? 'text-[8.5px]' : 'text-[7px]';

  return (
    <div 
      className={`flex items-center gap-3 select-none ${className}`} 
      style={{ height: `${height}px` }}
    >
      {iconSvg}
      <div className="flex flex-col justify-center text-left leading-none">
        <span 
          className={`font-sans font-extrabold tracking-tight text-[#0F172A] ${titleSize} flex items-center leading-none`}
          style={{ letterSpacing: '-0.02em' }}
        >
          Aayu<span className="text-[#0f766e] ml-1">OPD</span>
        </span>
        <span 
          className={`font-sans font-black tracking-widest text-[#64748B] uppercase ${subtitleSize} mt-1`}
          style={{ letterSpacing: '0.12em' }}
        >
          Predict. Prevent. Optimize.
        </span>
      </div>
    </div>
  );
}
