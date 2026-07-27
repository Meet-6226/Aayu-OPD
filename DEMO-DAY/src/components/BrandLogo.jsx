import React from 'react';

export default function BrandLogo({ variant = 'inline', className = '', height = 36 }) {
  if (variant === 'image') {
    return (
      <img
        src="/brand-logo.png"
        alt="Apollo OPD Intelligence"
        className={`h-9 sm:h-10 object-contain ${className}`}
        style={{ height: height ? `${height}px` : undefined }}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <img
        src="/brand-icon.png"
        alt="Apollo Emblem"
        className={`h-8 sm:h-9 object-contain ${className}`}
        style={{ height: height ? `${height}px` : undefined }}
      />
    );
  }

  return (
    <div className={`flex items-center space-x-3.5 group select-none ${className}`}>
      <img
        src="/brand-icon.png"
        alt="Apollo OPD"
        className="h-9 sm:h-10 object-contain transition-transform duration-200 group-hover:scale-105"
      />
      <div className="flex flex-col justify-center">
        <span className="font-fraunces font-bold text-[19px] sm:text-[21px] text-[#241C15] leading-none tracking-tight">
          Apollo <span className="font-inter font-semibold text-[15px] sm:text-[16px] text-[#13737A] ml-0.5 tracking-normal">OPD</span>
        </span>
        <span className="text-[8.5px] sm:text-[9.5px] font-mono-data font-bold tracking-[0.12em] text-[#6B5D4F] uppercase mt-0.5">
          Hospital Operations Intelligence
        </span>
      </div>
    </div>
  );
}
