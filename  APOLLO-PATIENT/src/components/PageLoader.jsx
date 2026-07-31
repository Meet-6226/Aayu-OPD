import React from 'react';

/**
 * A premium ECG/heartbeat animation loader for route transitions and lazy-loading.
 * @param {boolean} fullScreen - Whether to take up the full screen (for initial or auth transitions) or inline area (for layout changes)
 * @param {string} message - Message text displayed under the animation
 */
export default function PageLoader({ fullScreen = true, message = "Synchronizing Clinic Intelligence..." }) {
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    minHeight: '350px',
    width: '100%',
    background: 'transparent',
  };

  return (
    <div style={containerStyle} className="font-sans select-none animate-fadeIn">
      {/* Premium ECG/Heartbeat Animation */}
      <div className="flex items-center justify-center">
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
            stroke="#0f766e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: '300',
              strokeDashoffset: '300',
              animation: 'ecgWave 2s linear infinite',
              filter: 'drop-shadow(0px 0px 4px rgba(15, 118, 110, 0.4))'
            }}
          />
        </svg>
      </div>

      <div style={{
        color: '#0f766e',
        fontWeight: 600,
        fontSize: '0.85rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '1.5rem',
        animation: 'pulseText 1.5s ease-in-out infinite',
      }}>
        <span style={{ 
          display: 'inline-block', 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: '#0f766e',
          animation: 'pingDot 1s cubic-bezier(0, 0, 0.2, 1) infinite' 
        }} />
        {message}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ecgWave {
          0% { stroke-dashoffset: 300; }
          100% { stroke-dashoffset: -300; }
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}} />
    </div>
  );
}
