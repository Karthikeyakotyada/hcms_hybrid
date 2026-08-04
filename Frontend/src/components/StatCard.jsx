import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--accent-primary)' }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {title}
        </span>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
          {value}
        </h3>
        {subtitle && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>

      {Icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} color={color} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
