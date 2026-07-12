import React from 'react';
import { motion } from 'framer-motion';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconRight,
  loading = false,
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'bg-[#1b504c] text-white hover:bg-[#133b38] focus-visible:ring-[#1b504c] disabled:bg-[#1b504c]/40',
    ghost: 'border border-[#1b504c] text-[#1b504c] hover:bg-[#e5f9f8] focus-visible:ring-[#1b504c]',
    outline: 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300',
    danger: 'border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-300',
    link: 'text-[#1b504c] hover:underline underline-offset-2 p-0 h-auto',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-5 py-2.5 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  };

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.97 } : {}}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      ].join(' ')}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      {children}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </motion.button>
  );
}
