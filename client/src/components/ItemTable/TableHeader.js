import React from 'react';
import '../../styles.css'

export const TableHeader = ({ onSelectAll, allSelected, onSort }) => (
    <thead>
    <tr>
        <th className="checkbox-cell">
            <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
            />
        </th>
        <th onClick={() => onSort('id')}>ID ↕</th>
        <th onClick={() => onSort('name')}>Название ↕</th>
        <th onClick={() => onSort('description')}>Описание ↕</th>
        <th onClick={() => onSort('value')}>Значение ↕</th>
        <th>Действия</th>
    </tr>
    </thead>
);