import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { ItemRow } from './ItemRow';
import { TableHeader } from './TableHeader';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from '../Loading/LoadingSpinner';

export const ItemTable = ({
                              items,
                              selectedItems,
                              searchTerm,
                              isLoading,
                              totalCount,
                              onSearchChange,
                              onClearSearch,
                              onSelect,
                              onSelectAll,
                              onSort,
                              onOrderChange
                          }) => {
    const tableBodyRef = useRef(null);
    const sortableRef = useRef(null);

    useEffect(() => {
        if (tableBodyRef.current && !sortableRef.current) {
            sortableRef.current = Sortable.create(tableBodyRef.current, {
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    const rows = Array.from(tableBodyRef.current.querySelectorAll('tr'));
                    const newOrder = rows.map(row => parseInt(row.dataset.id));
                    onOrderChange(newOrder);
                }
            });
        }

        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
            }
        };
    }, [onOrderChange]);

    const allSelected = items.length > 0 && items.every(item => selectedItems.has(item.id));

    return (
        <div className="container">
            <h1>Управление элементами (1-1,000,000)</h1>

            <SearchBar
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                onClearSearch={onClearSearch}
            />

            <div className="stats">
                Найдено: {totalCount} элементов |
                Выбрано: {selectedItems.size}
            </div>

            <div className="table-container">
                <table>
                    <TableHeader
                        onSelectAll={onSelectAll}
                        allSelected={allSelected}
                        onSort={onSort}
                    />
                    <tbody ref={tableBodyRef}>
                    {items.map(item => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            isSelected={selectedItems.has(item.id)}
                            onSelect={onSelect}
                        />
                    ))}
                    </tbody>
                </table>
            </div>

            {isLoading && <LoadingSpinner />}
        </div>
    );
};