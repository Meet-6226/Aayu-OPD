import React from 'react';

/**
 * BrandLogo — Aayu (Staff Portal Variant)
 * Renders the custom Aayu emblem (caduceus / medical curves) and typography.
 */
export default function BrandLogo({ variant = 'inline', className = '', height = 32, textColor = '#0F172A', subColor = '#64748B' }) {
  const iconSvg = (
    <img
      src="/AAYU-logo.jpeg"
      alt="AAYU Logo"
      className="shrink-0 rounded-md"
      style={{ height: `${height}px`, width: 'auto', objectFit: 'contain' }}
    />
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
          className={`font-sans font-extrabold tracking-tight ${titleSize} flex items-center leading-none`}
          style={{ letterSpacing: '-0.02em', color: textColor }}
        >
          Aayu<span className="text-[#0f766e] ml-1">OPD</span>
        </span>
        <span 
          className={`font-sans font-black tracking-widest uppercase ${subtitleSize} mt-1`}
          style={{ letterSpacing: '0.12em', color: subColor }}
        >
          Hospital Operations Intelligence
        </span>
      </div>
    </div>
  );
}
