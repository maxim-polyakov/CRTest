import { useState, useEffect, useCallback } from 'react';
import { itemsApi } from '../services/api';
import { useDebounce } from './useDebounce';
import { useInfiniteScroll } from './useInfiniteScroll';
import '../styles.css'

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

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const loadItems = useCallback(async (page = 1, isNewSearch = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await itemsApi.getItems(page, 20, debouncedSearchTerm);

            if (isNewSearch || page === 1) {
                setItems(response.items);
                setFilteredItems(response.items);
            } else {
                // Простая проверка на дубликаты при добавлении новых элементов
                const existingIds = new Set(items.map(item => item.id));
                const uniqueNewItems = response.items.filter(item =>
                    !existingIds.has(item.id)
                );

                if (uniqueNewItems.length !== response.items.length) {
                    console.warn('Отфильтрованы дублирующиеся элементы при пагинации:', {
                        received: response.items.length,
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
                page: page,
                search: debouncedSearchTerm,
                received: response.items.length,
                total: response.total,
                hasMore: response.hasMore
            });

        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, isLoading, items]);

    const loadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadItems(currentPage + 1, false);
        }
    }, [hasMore, isLoading, currentPage, loadItems]);

    useInfiniteScroll(loadMore);

    useEffect(() => {
        loadItems(1, true);
    }, [debouncedSearchTerm]);

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

            // Сохраняем только валидные ID
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
            const visibleIds = filteredItems
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
    }, [filteredItems]);

    const updateItemOrder = useCallback(async (newOrder) => {
        if (!Array.isArray(newOrder)) {
            console.error('Invalid order array:', newOrder);
            return;
        }

        // Фильтруем валидные ID
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
        await itemsApi.saveOrder(validOrder);
    }, [items]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    // Функция для принудительной перезагрузки данных
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
        toggleSelection,
        toggleSelectAll,
        updateItemOrder,
        clearSearch,
        loadMore,
        refreshData
    };
}