import { useState, useEffect, useCallback } from 'react';
import { itemsApi } from '../services/api';
import { useDebounce } from './useDebounce';
import { useInfiniteScroll } from './useInfiniteScroll';
import '../styles.css'

export function useItems() {
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemOrder, setItemOrder] = useState([]);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const validateAndFixItems = useCallback((newItems, existingItems = []) => {
        if (!Array.isArray(newItems)) return [];

        const allItems = [...existingItems, ...newItems];
        const idMap = new Map();
        const duplicates = new Set();

        allItems.forEach(item => {
            if (item && item.id !== undefined) {
                if (idMap.has(item.id)) {
                    duplicates.add(item.id);
                } else {
                    idMap.set(item.id, item);
                }
            }
        });

        const fixedItems = newItems.map((item, index) => {
            if (!item || item.id === undefined) return item;

            if (duplicates.has(item.id) || existingItems.some(existing => existing.id === item.id)) {
                const uniqueId = `${item.id}-page${currentPage}-idx${index}-${Date.now()}`;
                console.warn('Исправлен дублирующийся ID:', {
                    originalId: item.id,
                    newId: uniqueId,
                    page: currentPage,
                    index: index
                });
                return { ...item, id: uniqueId };
            }
            return item;
        });

        if (duplicates.size > 0) {
            console.warn('Обнаружены дублирующиеся ID:', Array.from(duplicates));
        }

        return fixedItems;
    }, [currentPage]);

    // Функция для сортировки по ID (числа и строки)
    const sortItemsById = useCallback((itemsArray) => {
        return [...itemsArray].sort((a, b) => {
            // Для числовых ID
            if (typeof a.id === 'number' && typeof b.id === 'number') {
                return a.id - b.id;
            }
            // Для строковых ID или смешанных типов
            return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        });
    }, []);

    const loadItems = useCallback(async (page = 1, isNewSearch = false, shouldSort = true) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Запрашиваем сортировку по ID с сервера
            const response = await itemsApi.getItems(page, 20, debouncedSearchTerm, 'id');

            const validatedItems = validateAndFixItems(
                response.items,
                isNewSearch ? [] : items
            );

            let processedItems = validatedItems;

            // Сортируем только если это новая загрузка или первая страница
            if (shouldSort && (isNewSearch || page === 1)) {
                processedItems = sortItemsById(validatedItems);
            }

            if (isNewSearch || page === 1) {
                setItems(processedItems);
            } else {
                // Для последующих страниц просто добавляем к существующим
                const existingIds = new Set(items.map(item => item.id));
                const uniqueNewItems = processedItems.filter(item =>
                    !existingIds.has(item.id)
                );

                if (uniqueNewItems.length !== processedItems.length) {
                    console.warn('Отфильтрованы дублирующиеся элементы при пагинации');
                }

                // Объединяем и пересортируем ВСЕ элементы
                const allItems = [...items, ...uniqueNewItems];
                const finalSortedItems = sortItemsById(allItems);

                setItems(finalSortedItems);
            }

            setHasMore(response.hasMore);
            setCurrentPage(page);
            setTotalCount(response.total);

            console.log('Загружены элементы:', {
                page: page,
                search: debouncedSearchTerm,
                items: processedItems.length,
                total: response.total,
                sorted: shouldSort
            });

        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, items, validateAndFixItems, debouncedSearchTerm, sortItemsById]);

    const loadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadItems(currentPage + 1, false, true); // Всегда сортируем при подгрузке
        }
    }, [hasMore, isLoading, currentPage, loadItems]);

    useInfiniteScroll(loadMore);

    // Загружаем сначала элементы с меньшими ID
    useEffect(() => {
        setItems([]);
        setCurrentPage(1);
        setHasMore(true);

        // Загружаем первую страницу с сортировкой
        loadItems(1, true, true);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        const loadState = async () => {
            try {
                const state = await itemsApi.getState();

                const validSelectedItems = Array.isArray(state.selectedItems)
                    ? state.selectedItems.filter(id => id !== undefined && id !== null)
                    : [];

                setSelectedItems(new Set(validSelectedItems));

                const validItemOrder = Array.isArray(state.itemOrder)
                    ? state.itemOrder.filter(id => id !== undefined && id !== null)
                    : [];

                setItemOrder(validItemOrder);
            } catch (error) {
                console.error('Error loading state:', error);
            }
        };

        loadState();
    }, []);

    // Сброс фильтрации при перезагрузке страницы
    useEffect(() => {
        // Этот эффект выполнится только при первоначальной загрузке компонента
        setSearchTerm(''); // Сбрасываем поисковый запрос
    }, []); // Пустой массив зависимостей = выполняется только при монтировании

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

            itemsApi.saveSelection(validSelection);
            return newSelected;
        });
    }, []);

    const toggleSelectAll = useCallback(async (selectAll) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            const visibleIds = items
                .map(item => item.id)
                .filter(id => id !== undefined && id !== null);

            if (selectAll) {
                visibleIds.forEach(id => newSelected.add(id));
            } else {
                visibleIds.forEach(id => newSelected.delete(id));
            }

            itemsApi.saveSelection(Array.from(newSelected));
            return newSelected;
        });
    }, [items]);

    const updateItemOrder = useCallback(async (newOrder) => {
        if (!Array.isArray(newOrder)) {
            console.error('Invalid order array:', newOrder);
            return;
        }

        const validOrder = newOrder.filter(id =>
            id !== undefined && id !== null && items.some(item => item.id === id)
        );

        if (validOrder.length !== newOrder.length) {
            console.warn('Отфильтрованы невалидные ID при изменении порядка');
        }

        setItemOrder(validOrder);
        await itemsApi.saveOrder(validOrder);
    }, [items]);

    // Функция для принудительной пересортировки
    const reorderItems = useCallback(() => {
        const sortedItems = sortItemsById(items);
        setItems(sortedItems);
    }, [items, sortItemsById]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    const refreshData = useCallback(() => {
        setItems([]);
        setCurrentPage(1);
        setSearchTerm(''); // Сбрасываем поиск при ручной перезагрузке
        loadItems(1, true, true);
    }, [loadItems]);

    return {
        items: items,
        selectedItems,
        searchTerm,
        setSearchTerm,
        isLoading,
        hasMore,
        totalCount,
        itemOrder,
        toggleSelection,
        toggleSelectAll,
        updateItemOrder,
        clearSearch,
        loadMore,
        refreshData,
        reorderItems
    };
}