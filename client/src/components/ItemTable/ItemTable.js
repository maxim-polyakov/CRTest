import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { ItemRow } from './ItemRow';
import { TableHeader } from './TableHeader';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import '../../styles.css';

export const ItemTable = ({
                              items,
                              selectedItems,
                              searchTerm,
                              isLoading,
                              totalCount,
                              sortBy, // добавьте этот пропс
                              sortOrder, // добавьте этот пропс
                              onSearchChange,
                              onClearSearch,
                              onSelect,
                              onSelectAll,
                              onSort,
                              onOrderChange
                          }) => {
    const tableBodyRef = useRef(null);
    const sortableRef = useRef(null);
    const itemsRef = useRef(items);

    // Обновляем ref при изменении items
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        if (!tableBodyRef.current) return;

        // Уничтожаем старый экземпляр Sortable при каждом обновлении
        if (sortableRef.current) {
            sortableRef.current.destroy();
            sortableRef.current = null;
        }

        // Создаем новый экземпляр Sortable только если есть элементы
        if (items.length > 0) {
            sortableRef.current = Sortable.create(tableBodyRef.current, {
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                animation: 150,
                onStart: function (evt) {
                    evt.item.classList.add('sortable-drag');
                },
                onEnd: function (evt) {
                    evt.item.classList.remove('sortable-drag');

                    // Получаем новый порядок элементов
                    const rows = Array.from(tableBodyRef.current.children);
                    const newOrder = rows.map(row => {
                        const id = parseInt(row.dataset.id);
                        // Проверяем валидность ID
                        if (isNaN(id)) {
                            console.error('Invalid ID found:', row.dataset.id);
                            return null;
                        }
                        return id;
                    }).filter(id => id !== null);

                    // Проверяем, что порядок изменился
                    const currentOrder = itemsRef.current.map(item => item.id);
                    if (JSON.stringify(newOrder) !== JSON.stringify(currentOrder)) {
                        onOrderChange(newOrder);
                    }
                }
            });
        }

        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
                sortableRef.current = null;
            }
        };
    }, [items, onOrderChange]);

    const allSelected = items.length > 0 && selectedItems.size > 0 &&
        items.every(item => selectedItems.has(item.id));

    // Функция для проверки уникальности ID
    const checkDuplicateIds = () => {
        const ids = items.map(item => item.id);
        const uniqueIds = new Set(ids);

        if (ids.length !== uniqueIds.size) {
            console.warn('Обнаружены дублирующиеся ID:', {
                totalItems: items.length,
                uniqueIds: uniqueIds.size,
                duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
            });
            return false;
        }
        return true;
    };

    // Проверяем уникальность ID при рендере
    useEffect(() => {
        if (items.length > 0) {
            checkDuplicateIds();
        }
    }, [items]);


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
                {sortBy && (
                    <span style={{color: 'blue', marginLeft: '10px'}}>
                        🔒 Сортировка по {sortBy} ({sortOrder === 'asc' ? '↑' : '↓'})
                    </span>
                )}
                {items.length > 0 && !checkDuplicateIds() && (
                    <span style={{color: 'red', marginLeft: '10px'}}>
                        ⚠️ Обнаружены дублирующиеся ID!
                    </span>
                )}
            </div>

            <div className="table-container">
                <table>
                    <TableHeader
                        onSelectAll={onSelectAll}
                        allSelected={allSelected}
                        onSort={onSort}
                        sortBy={sortBy} // передаем текущую сортировку
                        sortOrder={sortOrder} // передаем порядок сортировки
                    />
                    <tbody ref={tableBodyRef}>
                    {items.map((item, index) => (
                        <ItemRow
                            key={`${item.id}-${index}`}
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