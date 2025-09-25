import React from 'react';
import '../../styles.css'

export const TableHeader = ({
                                onSelectAll,
                                allSelected,
                                onSort,
                                sortBy,
                                sortOrder
                            }) => {
    const handleSort = (column) => {
        if (onSort) {
            onSort(column);
        }
    };

    const getSortIndicator = (column) => {
        if (sortBy !== column) return '↕';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    const getHeaderClassName = (column) => {
        const baseClass = "sortable-header";
        return sortBy === column ? `${baseClass} active` : baseClass;
    };

    return (
        <thead>
        <tr>
            <th className="checkbox-cell">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                />
            </th>
            <th
                className={getHeaderClassName('id')}
                onClick={() => handleSort('id')}
            >
                ID {getSortIndicator('id')}
            </th>
            <th
                className={getHeaderClassName('name')}
                onClick={() => handleSort('name')}
            >
                Название {getSortIndicator('name')}
            </th>
            <th
                className={getHeaderClassName('description')}
                onClick={() => handleSort('description')}
            >
                Описание {getSortIndicator('description')}
            </th>
            <th
                className={getHeaderClassName('value')}
                onClick={() => handleSort('value')}
            >
                Значение {getSortIndicator('value')}
            </th>
            <th>Действия</th>
        </tr>
        </thead>
    );
};