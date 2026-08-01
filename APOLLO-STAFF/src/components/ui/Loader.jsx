import React from 'react';

export default function Loader({ message = "Synchronizing Clinic Intelligence..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      height: '50vh',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: 'transparent',
    }}>
      {/* Premium ECG/Heartbeat Animation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="120" height="50" viewBox="0 0 120 50" style={{ overflow: 'visible' }}>
          {/* Background Guide Line */}
          <path
            d="M0,25 L40,25 L45,10 L50,40 L55,20 L65,28 L70,25 L120,25"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Animated Glowing ECG Line */}
          <path
            d="M0,25 L40,25 L45,10 L50,40 L55,20 L65,28 L70,25 L120,25"
            fill="none"
            stroke="#1b504c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: '300',
              strokeDashoffset: '300',
              animation: 'ecgWave 2s linear infinite',
              filter: 'drop-shadow(0px 0px 4px rgba(27, 80, 76, 0.4))'
            }}
          />
        </svg>
      </div>

      <div style={{
        color: '#1b504c',
        fontWeight: 600,
        fontSize: '0.85rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: 'pulseText 1.5s ease-in-out infinite',
      }}>
        <span style={{ 
          display: 'inline-block', 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: '#1b504c',
          animation: 'pingDot 1s cubic-bezier(0, 0, 0.2, 1) infinite' 
        }} />
        {message}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ecgWave {
          0% {
            stroke-dashoffset: 300;
          }
          100% {
            stroke-dashoffset: -300;
          }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.6; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes pingDot {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
