import React from 'react';
import { motion } from 'framer-motion';

// ─── Card ───
export const Card = ({ children, className = '', hover = true, onClick, style = {} }) => (
  <motion.div
    className={`card ${className}`}
    whileHover={hover ? { y: -2, boxShadow: '0 8px 24px rgba(27,80,76,0.1)' } : {}}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
  >
    {children}
  </motion.div>
);

// ─── Badge ───
export const Badge = ({ children, variant = 'primary', className = '', icon }) => {
  const variants = {
    primary: 'badge-primary',
    high: 'badge-risk-high',
    medium: 'badge-risk-medium',
    low: 'badge-risk-low',
    warm: 'badge-warm',
    default: '',
  };
  return (
    <span className={`badge ${variants[variant] || ''} ${className}`}>
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </span>
  );
};

// ─── Button ───
export const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false, icon, size = 'md', type = 'button' }) => {
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2 text-sm', lg: 'px-6 py-2.5 text-base' };
  const btnClass = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : variant === 'danger' ? 'btn-danger' : 'btn-ghost';
  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`${btnClass} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </motion.button>
  );
};

// ─── Avatar ───
export const Avatar = ({ name, color = '#1b504c', size = 'md', src }) => {
  const sizes = { sm: 28, md: 36, lg: 44, xl: 56 };
  const px = sizes[size] || 36;
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: px * 0.35,
        fontWeight: 700,
        color: 'white',
        fontFamily: 'Space Grotesk, sans-serif',
        letterSpacing: '0.01em',
      }}
    >
      {initials}
    </div>
  );
};

// ─── Divider ───
export const Divider = ({ className = '' }) => (
  <div className={`border-t border-gray-100 ${className}`} />
);

// ─── Spinner ───
export const Spinner = ({ size = 20, color = 'var(--primary)' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.5}
    strokeLinecap="round"
    style={{ animation: 'spin 0.8s linear infinite' }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── Empty State ───
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
    {icon && <div style={{ marginBottom: '1rem', opacity: 0.4 }}>{icon}</div>}
    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
    {description && <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>{description}</p>}
    {action}
  </div>
);

// ─── Stat Card ───
export const StatCard = ({ label, value, subtext, icon, color = 'var(--primary)', trend }) => (
  <Card className="p-5">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.75rem',
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </div>
      {trend && (
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: trend > 0 ? 'var(--risk-low)' : 'var(--risk-high)',
          background: trend > 0 ? 'var(--accent-green)' : '#fee2e2',
          padding: '0.2rem 0.5rem',
          borderRadius: '99px',
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="stat-value">{value}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>{label}</div>
    {subtext && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{subtext}</div>}
  </Card>
);

// ─── Risk Score Bar ───
export const RiskScoreBar = ({ score, showLabel = true }) => {
  const color = score >= 70 ? 'var(--risk-high)' : score >= 40 ? 'var(--risk-medium)' : 'var(--risk-low)';
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Risk Score</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{score}/100</span>
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

// ─── Section Header ───
export const SectionHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-center justify-between ${className}`} style={{ marginBottom: '1.25rem' }}>
    <div>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Search Input ───
export const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      className={`search-input ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);
