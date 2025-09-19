import React, { useState, useCallback, useMemo } from 'react';
import { ItemTable } from './components/ItemTable/ItemTable';
import { useItems } from './hooks/useItems';

function App() {
    const {
        items,
        selectedItems,
        searchTerm,
        setSearchTerm,
        isLoading,
        totalCount,
        toggleSelection,
        toggleSelectAll,
        updateItemOrder,
        clearSearch
    } = useItems();

    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = useCallback((field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField]);

    const sortedItems = useMemo(() => {
        if (!sortField) return items;

        return [...items].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortDirection === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        });
    }, [items, sortField, sortDirection]);

    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            <ItemTable
                items={sortedItems}
                selectedItems={selectedItems}
                searchTerm={searchTerm}
                isLoading={isLoading}
                totalCount={totalCount}
                onSearchChange={setSearchTerm}
                onClearSearch={clearSearch}
                onSelect={toggleSelection}
                onSelectAll={toggleSelectAll}
                onSort={handleSort}
                onOrderChange={updateItemOrder}
            />
        </div>
    );
}

export default App;