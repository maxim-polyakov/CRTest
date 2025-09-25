import { useState, useEffect, useCallback } from 'react';
import { itemsApi } from '../services/api';
import { useDebounce } from './useDebounce';
import { useInfiniteScroll } from './useInfiniteScroll';
import '../styles.css'

// Ключи для localStorage
const STORAGE_KEYS = {
    SORT_BY: 'items_sort_by',
    SORT_ORDER: 'items_sort_order',
    SELECTED_ITEMS: 'items_selected',
    ITEM_ORDER: 'items_order'
};

// Функции для работы с localStorage
const loadFromStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from storage:`, error);
        return defaultValue;
    }
};

const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to storage:`, error);
    }
};

export function useItems() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemOrder, setItemOrder] = useState([]);

    // 🔑 Загружаем состояние сортировки из localStorage
    const [sortBy, setSortBy] = useState(() =>
        loadFromStorage(STORAGE_KEYS.SORT_BY, 'id')
    );
    const [sortOrder, setSortOrder] = useState(() =>
        loadFromStorage(STORAGE_KEYS.SORT_ORDER, 'asc')
    );

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // 🔑 Сохраняем сортировку в localStorage при изменении
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SORT_BY, sortBy);
    }, [sortBy]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SORT_ORDER, sortOrder);
    }, [sortOrder]);

    // 🔑 Функция для применения кастомной сортировки
    const applyCustomSorting = useCallback((itemsToSort, customOrder) => {
        if (!customOrder.length || !itemsToSort.length) return itemsToSort;

        const orderMap = new Map();
        customOrder.forEach((id, index) => orderMap.set(id, index));

        return [...itemsToSort].sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
            return orderA - orderB;
        });
    }, []);

    // 🔑 Функция для применения сортировки к загруженным элементам
    const applySorting = useCallback((itemsToSort, sortBy, sortOrder, itemOrder, searchTerm) => {
        if (!itemsToSort.length) return itemsToSort;

        // Если есть поиск - не применяем кастомную сортировку
        if (searchTerm) {
            return itemsToSort;
        }

        // Применяем кастомную сортировку если выбрана и есть порядок
        if (sortBy === 'custom' && itemOrder.length > 0) {
            return applyCustomSorting(itemsToSort, itemOrder);
        }

        // Стандартная сортировка по полям
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        return [...itemsToSort].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle undefined values
            if (aValue === undefined || aValue === null) aValue = '';
            if (bValue === undefined || bValue === null) bValue = '';

            // For numeric fields (id, value)
            if (sortBy === 'id' || sortBy === 'value') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
                return (aValue - bValue) * sortDirection;
            }
            // For string fields (name, description)
            else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
                return aValue.localeCompare(bValue) * sortDirection;
            }
        });
    }, [applyCustomSorting]);

    const loadItems = useCallback(async (page = 1, isNewSearch = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // 🔑 Передаем кастомный порядок на сервер при кастомной сортировке
            const customOrder = sortBy === 'custom' ? itemOrder : [];

            const response = await itemsApi.getItems(
                page,
                20,
                debouncedSearchTerm,
                sortBy, // 🔑 Теперь передаем 'custom' на сервер
                sortOrder,
                customOrder // 🔑 Передаем кастомный порядок
            );

            let processedItems = response.items;

            // 🔑 Локально применяем сортировку только если сервер не отсортировал
            if (sortBy === 'custom' && !debouncedSearchTerm && itemOrder.length > 0) {
                processedItems = applyCustomSorting(processedItems, itemOrder);
            }

            if (isNewSearch || page === 1) {
                setItems(processedItems);
                setFilteredItems(processedItems);
            } else {
                const existingIds = new Set(items.map(item => item.id));
                const uniqueNewItems = processedItems.filter(item =>
                    !existingIds.has(item.id)
                );

                if (uniqueNewItems.length !== processedItems.length) {
                    console.warn('Отфильтрованы дублирующиеся элементы при пагинации:', {
                        received: processedItems.length,
                        added: uniqueNewItems.length
                    });
                }

                setItems(prev => [...prev, ...uniqueNewItems]);
                setFilteredItems(prev => [...prev, ...uniqueNewItems]);
            }

            setHasMore(response.hasMore);
            setCurrentPage(page);
            setTotalCount(response.total);

            console.log('Загружены элементы:', {
                page,
                search: debouncedSearchTerm,
                sortBy,
                sortOrder,
                customOrder: itemOrder.length,
                received: response.items.length,
                total: response.total,
                hasMore: response.hasMore
            });

        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, sortBy, sortOrder, isLoading, items, itemOrder, applyCustomSorting]);

    // 🔑 Эффект для применения сортировки при изменении параметров
    useEffect(() => {
        if (items.length > 0) {
            const sortedItems = applySorting(items, sortBy, sortOrder, itemOrder, debouncedSearchTerm);
            setFilteredItems(sortedItems);
        }
    }, [sortBy, sortOrder, itemOrder, debouncedSearchTerm, items, applySorting]);

    const loadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadItems(currentPage + 1, false);
        }
    }, [hasMore, isLoading, currentPage, loadItems]);

    useInfiniteScroll(loadMore);

    // 🔑 Загружаем данные при изменении поиска или сортировки
    useEffect(() => {
        loadItems(1, true);
    }, [debouncedSearchTerm, sortBy, sortOrder]); // 🔑 Добавляем сортировку в зависимости

    // 🔑 Загружаем сохраненное состояние при монтировании
    useEffect(() => {
        const loadState = async () => {
            try {
                const state = await itemsApi.getState();

                // Валидируем выбранные элементы
                const validSelectedItems = Array.isArray(state.selectedItems)
                    ? state.selectedItems.filter(id => id !== undefined && id !== null)
                    : [];

                setSelectedItems(new Set(validSelectedItems));

                // Валидируем порядок элементов
                const validItemOrder = Array.isArray(state.itemOrder)
                    ? state.itemOrder.filter(id => id !== undefined && id !== null)
                    : [];

                setItemOrder(validItemOrder);

                // 🔑 Также загружаем из localStorage для резервного копирования
                const storedSelected = loadFromStorage(STORAGE_KEYS.SELECTED_ITEMS, []);
                if (storedSelected.length > 0) {
                    setSelectedItems(prev => {
                        const newSet = new Set(prev);
                        storedSelected.forEach(id => newSet.add(id));
                        return newSet;
                    });
                }

                const storedOrder = loadFromStorage(STORAGE_KEYS.ITEM_ORDER, []);
                if (storedOrder.length > 0) {
                    setItemOrder(storedOrder);
                }

            } catch (error) {
                console.error('Error loading state:', error);

                // 🔑 Если API недоступно, загружаем из localStorage
                const storedSelected = loadFromStorage(STORAGE_KEYS.SELECTED_ITEMS, []);
                const storedOrder = loadFromStorage(STORAGE_KEYS.ITEM_ORDER, []);

                setSelectedItems(new Set(storedSelected));
                setItemOrder(storedOrder);
            }
        };

        loadState();
    }, []);

    const toggleSelection = useCallback(async (id) => {
        if (!id) {
            console.error('Attempted to toggle selection with invalid ID:', id);
            return;
        }

        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }

            const validSelection = Array.from(newSelected).filter(itemId =>
                itemId !== undefined && itemId !== null
            );

            // 🔑 Сохраняем в API и localStorage
            itemsApi.saveSelection(validSelection);
            saveToStorage(STORAGE_KEYS.SELECTED_ITEMS, validSelection);

            return newSelected;
        });
    }, []);

    const toggleSelectAll = useCallback(async (selectAll) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            const visibleIds = filteredItems
                .map(item => item.id)
                .filter(id => id !== undefined && id !== null);

            if (selectAll) {
                visibleIds.forEach(id => newSelected.add(id));
            } else {
                visibleIds.forEach(id => newSelected.delete(id));
            }

            const validSelection = Array.from(newSelected);

            itemsApi.saveSelection(validSelection);
            saveToStorage(STORAGE_KEYS.SELECTED_ITEMS, validSelection);

            return newSelected;
        });
    }, [filteredItems]);

    const updateItemOrder = useCallback(async (newOrder) => {
        if (!Array.isArray(newOrder)) {
            console.error('Invalid order array:', newOrder);
            return;
        }

        const validOrder = newOrder.filter(id =>
            id !== undefined && id !== null && items.some(item => item.id === id)
        );

        if (validOrder.length !== newOrder.length) {
            console.warn('Отфильтрованы невалидные ID при изменении порядка:', {
                original: newOrder.length,
                valid: validOrder.length
            });
        }

        setItemOrder(validOrder);

        // 🔑 Сохраняем в API и localStorage
        await itemsApi.saveOrder(validOrder);
        saveToStorage(STORAGE_KEYS.ITEM_ORDER, validOrder);

        // 🔑 Если активна кастомная сортировка - перезагружаем данные
        if (sortBy === 'custom') {
            loadItems(1, true);
        }
    }, [items, sortBy, loadItems]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    // 🔑 Функция для сброса сортировки к значениям по умолчанию
    const resetSorting = useCallback(() => {
        setSortBy('id');
        setSortOrder('asc');
    }, []);

    // 🔑 Функция для очистки кастомного порядка
    const clearCustomOrder = useCallback(async () => {
        setItemOrder([]);
        await itemsApi.saveOrder([]);
        saveToStorage(STORAGE_KEYS.ITEM_ORDER, []);

        if (sortBy === 'custom') {
            resetSorting();
        }
    }, [sortBy, resetSorting]);

    // 🔑 Функция для очистки всех данных из localStorage
    const clearAllStorage = useCallback(async () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        setSortBy('id');
        setSortOrder('asc');
        setSelectedItems(new Set());
        setItemOrder([]);

        // Очищаем на сервере
        await Promise.all([
            itemsApi.saveSelection([]),
            itemsApi.saveOrder([])
        ]);
    }, []);

    const refreshData = useCallback(() => {
        setItems([]);
        setFilteredItems([]);
        setCurrentPage(1);
        loadItems(1, true);
    }, [loadItems]);

    return {
        items: filteredItems,
        selectedItems,
        searchTerm,
        setSearchTerm,
        isLoading,
        hasMore,
        totalCount,
        itemOrder,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        toggleSelection,
        toggleSelectAll,
        updateItemOrder,
        clearSearch,
        resetSorting,
        clearCustomOrder,
        clearAllStorage,
        loadMore,
        refreshData
    };
}