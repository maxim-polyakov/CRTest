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
                setItems(prev => [...prev, ...response.items]);
                setFilteredItems(prev => [...prev, ...response.items]);
            }

            setHasMore(response.hasMore);
            setCurrentPage(page);
            setTotalCount(response.total);
        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, isLoading]);

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
                setSelectedItems(new Set(state.selectedItems));
                setItemOrder(state.itemOrder);
            } catch (error) {
                console.error('Error loading state:', error);
            }
        };

        loadState();
    }, []);

    const toggleSelection = useCallback(async (id) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }

            itemsApi.saveSelection(Array.from(newSelected));
            return newSelected;
        });
    }, []);

    const toggleSelectAll = useCallback(async (selectAll) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            const visibleIds = filteredItems.map(item => item.id);

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
        setItemOrder(newOrder);
        await itemsApi.saveOrder(newOrder);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

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
        loadMore
    };
}