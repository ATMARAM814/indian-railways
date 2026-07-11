import React from 'react';

const Loader = ({ message = 'Loading...', size = 'md', fullPage = false }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Poppins', 'Inter', sans-serif",
    ...(fullPage ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      zIndex: 9999,
      height: '100vh',
      width: '100vw',
    } : {
      minHeight: '300px',
      width: '100%',
      height: '100%',
    })
  };

  const ringSize = size === 'sm' ? '60px' : size === 'lg' ? '120px' : '90px';
  const logoSize = size === 'sm' ? '36px' : size === 'lg' ? '76px' : '56px';

  // Inject keyframe animations to keep the component fully self-contained and performant
  const styleTagContent = `
    @keyframes ir-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes ir-pulse {
      0%, 100% { transform: scale(0.96); opacity: 0.95; }
      50% { transform: scale(1.04); opacity: 1; }
    }
    @keyframes ir-fade {
      0%, 100% { opacity: 0.75; }
      50% { opacity: 1; }
    }
    .ir-spinner-ring {
      animation: ir-rotate 1.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }
    .ir-logo-pulse {
      animation: ir-pulse 2.2s ease-in-out infinite;
    }
    .ir-text-fade {
      animation: ir-fade 2s ease-in-out infinite;
    }
  `;

  return (
    <div style={containerStyle}>
      <style dangerouslySetInnerHTML={{ __html: styleTagContent }} />
      <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Outer Rotating Track */}
        <div 
          className="ir-spinner-ring"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid rgba(11, 35, 65, 0.08)',
            borderTop: '2px solid #2B5CE6',
            borderRight: '2px solid #2B5CE6',
          }}
        />

        {/* Inner Pulsing Logo */}
        <div 
          className="ir-logo-pulse"
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(11, 35, 65, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '4px'
          }}
        >
          <img 
            src="/logo.png" 
            alt="Indian Railways Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }} 
          />
        </div>
      </div>

      {/* Loading Message */}
      {message && (
        <span 
          className="ir-text-fade"
          style={{
            marginTop: '20px',
            fontSize: size === 'sm' ? '13px' : '14.5px',
            color: '#0B2341',
            fontWeight: 600,
            letterSpacing: '0.3px',
            textAlign: 'center'
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default Loader;
