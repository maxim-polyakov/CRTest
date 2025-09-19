import React from 'react';
import '../../styles.css'

export const SearchBar = ({ searchTerm, onSearchChange, onClearSearch }) => (
    <div className="search-container">
        <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по имени, описанию или значению..."
        />
        <button onClick={onClearSearch}>
            Очистить
        </button>
    </div>
);