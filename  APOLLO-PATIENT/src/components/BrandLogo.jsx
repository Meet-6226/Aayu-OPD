import React from 'react';

/**
 * BrandLogo — Aether OPD
 * Uses brand-logo.png (full logo with caduceus + text)
 * Use variant="icon" for emblem-only version
 */
export default function BrandLogo({ variant = 'inline', className = '', height = 44 }) {

  if (variant === 'icon') {
    return (
      <img
        src="/brand-icon.png"
        alt="Aether OPD"
        className={`w-auto shrink-0 object-contain ${className}`}
        style={{ height: `${height}px` }}
      />
    );
  }

  // Default: full brand-logo.png
  return (
    <img
      src="/brand-logo.png"
      alt="Aether OPD"
      className={`w-auto shrink-0 object-contain ${className}`}
      style={{ height: `${height}px` }}
    />
  );
}
