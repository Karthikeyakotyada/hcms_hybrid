import React from 'react';

const SpiderIcon = ({ size = 28, className = '', style = {} }) => {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0d14',
        boxShadow: '0 0 12px rgba(229, 9, 20, 0.5)',
        border: '1px solid rgba(229, 9, 20, 0.6)',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src="/Spidy.jpeg"
        alt="Spider-Man Logo"
        style={{
          width: '180%',
          height: '180%',
          objectFit: 'cover',
          objectPosition: 'center 45%',
          transform: 'scale(1.2)',
        }}
      />
    </div>
  );
};

export default SpiderIcon;
