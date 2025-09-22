import React, { useState, useCallback, useMemo } from 'react';
import { ItemTable } from './components/ItemTable/ItemTable';
import { useItems } from './hooks/useItems';
import './styles.css'

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

    // Исправленная функция сортировки с проверкой уникальности ID
    const sortedItems = useMemo(() => {
        if (!sortField) return items;

        const sorted = [...items].sort((a, b) => {
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

        // Проверка на дублирующиеся ID после сортировки
        const ids = sorted.map(item => item.id);
        const uniqueIds = new Set(ids);

        if (ids.length !== uniqueIds.size) {
            console.warn('Обнаружены дублирующиеся ID после сортировки!', {
                field: sortField,
                direction: sortDirection,
                duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
            });
        }

        return sorted;
    }, [items, sortField, sortDirection]);

    // Функция для обработки изменения порядка с учетом сортировки
    const handleOrderChange = useCallback((newOrder) => {
        // Если активна сортировка, игнорируем изменение порядка через перетаскивание
        if (sortField) {
            console.warn('Изменение порядка отключено при активной сортировке');
            return;
        }
        updateItemOrder(newOrder);
    }, [sortField, updateItemOrder]);

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
                onOrderChange={handleOrderChange}
            />
        </div>
    );
}

export default App;