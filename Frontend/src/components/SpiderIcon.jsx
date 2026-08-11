import React from 'react';

const SpiderIcon = ({ size = 28, className = '', style = {} }) => {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6e6e6',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default SpiderIcon;
