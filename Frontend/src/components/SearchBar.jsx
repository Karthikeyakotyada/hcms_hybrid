import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search by Team Number or Name...', onClear }) => {
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
      <Search
        size={18}
        color="var(--text-muted)"
        style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        type="text"
        className="form-input"
        style={{ paddingLeft: '2.5rem', paddingRight: value ? '2.5rem' : '1rem' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          style={{
            position: 'absolute',
            right: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
