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

    const loadItems = useCallback(async (page = 1, isNewSearch = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Используем актуальный поисковый запрос
            const response = await itemsApi.getItems(page, 20, debouncedSearchTerm);

            const validatedItems = validateAndFixItems(
                response.items,
                isNewSearch ? [] : items
            );

            if (isNewSearch || page === 1) {
                setItems(validatedItems);
            } else {
                const existingIds = new Set(items.map(item => item.id));
                const uniqueNewItems = validatedItems.filter(item => !existingIds.has(item.id));

                if (uniqueNewItems.length !== validatedItems.length) {
                    console.warn('Отфильтрованы дублирующиеся элементы при пагинации');
                }

                setItems(prev => [...prev, ...uniqueNewItems]);
            }

            setHasMore(response.hasMore);
            setCurrentPage(page);
            setTotalCount(response.total);

            console.log('Загружены элементы:', {
                page: page,
                search: debouncedSearchTerm, // Добавили поиск в лог
                items: validatedItems.length,
                total: response.total
            });

        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, items, validateAndFixItems, debouncedSearchTerm]); // Добавили debouncedSearchTerm в зависимости

    const loadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadItems(currentPage + 1, false);
        }
    }, [hasMore, isLoading, currentPage, loadItems]);

    useInfiniteScroll(loadMore);

    // Ключевое исправление: перезагружаем данные при изменении поиска
    useEffect(() => {
        // Сбрасываем состояние перед новым поиском
        setItems([]);
        setCurrentPage(1);
        setHasMore(true);

        // Загружаем данные с новым поисковым запросом
        loadItems(1, true);
    }, [debouncedSearchTerm]); // Зависимость от debouncedSearchTerm

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

    // Функция очистки поиска - теперь она работает правильно
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        // Данные автоматически перезагрузятся через useEffect с debouncedSearchTerm
    }, []);

    // Функция перезагрузки данных
    const refreshData = useCallback(() => {
        setItems([]);
        setCurrentPage(1);
        setSearchTerm(''); // Сбрасываем поиск при перезагрузке
        loadItems(1, true);
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
        refreshData
    };
}