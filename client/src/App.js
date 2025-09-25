import React from 'react';
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
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        toggleSelection,
        toggleSelectAll,
        updateItemOrder,
        clearSearch,
        resetSorting,
        clearAllStorage
    } = useItems();

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            {/* Добавьте кнопки для управления */}
            <div style={{ marginBottom: '10px' }}>
                <button onClick={resetSorting} style={{ marginRight: '10px' }}>
                    Сбросить сортировку
                </button>
                <button onClick={clearAllStorage} style={{ marginRight: '10px' }}>
                    Очистить все данные
                </button>
            </div>

            <ItemTable
                items={items}
                selectedItems={selectedItems}
                searchTerm={searchTerm}
                isLoading={isLoading}
                totalCount={totalCount}
                sortBy={sortBy}
                sortOrder={sortOrder}
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