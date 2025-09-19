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
        // Убедитесь, что элементы есть и Sortable еще не инициализирован
        if (tableBodyRef.current && items.length > 0 && !sortableRef.current) {
            sortableRef.current = Sortable.create(tableBodyRef.current, {
                handle: '.drag-handle', // Указываем элемент-хэндл для перетаскивания:cite[2]
                ghostClass: 'sortable-ghost', // Класс для элемента-призрака
                animation: 150, // Добавляем анимацию:cite[5]
                onStart: function (evt) {
                    // Добавляем визуальную обратную связь
                    evt.item.classList.add('sortable-drag');
                },
                onEnd: function (evt) {
                    // Убираем класс после завершения
                    evt.item.classList.remove('sortable-drag');

                    // Получаем новый порядок элементов
                    const rows = Array.from(tableBodyRef.current.children);
                    const newOrder = rows.map(row => parseInt(row.dataset.id));

                    // Проверяем, что порядок изменился
                    const oldOrder = items.map(item => item.id);
                    if (JSON.stringify(newOrder) !== JSON.stringify(oldOrder)) {
                        onOrderChange(newOrder);
                    }
                }
            });
        }

        // Обновляем Sortable при изменении элементов
        if (sortableRef.current && items.length > 0) {
            sortableRef.current.option('disabled', false);
        }

        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
                sortableRef.current = null;
            }
        };
    }, [items, onOrderChange]); // Добавляем items в зависимости

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