import axios from 'axios';
import '../styles.css'

// Конфигурируемый базовый URL
const API_BASE = 'https://crtestserver.baxic.ru/api';

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Функция для проверки уникальности ID в данных
const validateItemsData = (items) => {
    if (!Array.isArray(items)) {
        throw new Error('Сервер вернул некорректные данные: ожидался массив');
    }

    const ids = items.map(item => item?.id).filter(Boolean);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.warn('Обнаружены дублирующиеся ID в ответе сервера:', {
            totalItems: items.length,
            uniqueIds: uniqueIds.size,
            duplicates: duplicates
        });

        // Исправляем дубликаты, добавляя суффикс
        return items.map((item, index) => ({
            ...item,
            id: item.id && items.findIndex(it => it.id === item.id) !== index
                ? `${item.id}-${index}`
                : item.id
        }));
    }

    return items;
};

// Добавляем перехватчик для валидации данных
apiClient.interceptors.response.use(
    (response) => {
        // Если в ответе есть массив items, валидируем его
        if (response.data && Array.isArray(response.data.items)) {
            response.data.items = validateItemsData(response.data.items);
        } else if (Array.isArray(response.data)) {
            response.data = validateItemsData(response.data);
        }
        return response;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export const itemsApi = {
    getItems: async (page = 1, limit = 100, search = '') => {
        try {
            const response = await apiClient.get('/items', {
                params: {
                    page: Math.max(1, page),
                    limit: Math.max(1, Math.min(limit, 1000)), // Ограничиваем лимит
                    search
                }
            });

            // Дополнительная валидация
            if (response.data && Array.isArray(response.data.items)) {
                return {
                    ...response.data,
                    items: validateItemsData(response.data.items)
                };
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    },

    saveOrder: async (itemOrder) => {
        try {
            // Валидируем входные данные
            if (!Array.isArray(itemOrder)) {
                throw new Error('itemOrder должен быть массивом');
            }

            const uniqueOrder = [...new Set(itemOrder)]; // Убираем дубликаты
            await apiClient.post('/items/order', { itemOrder: uniqueOrder });
        } catch (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    },

    saveSelection: async (selectedItems) => {
        try {
            // Преобразуем Set в массив если нужно
            const itemsArray = selectedItems instanceof Set
                ? Array.from(selectedItems)
                : selectedItems;

            if (!Array.isArray(itemsArray)) {
                throw new Error('selectedItems должен быть массивом или Set');
            }

            const uniqueSelection = [...new Set(itemsArray)]; // Убираем дубликаты
            await apiClient.post('/items/selection', {
                selectedItems: uniqueSelection
            });
        } catch (error) {
            console.error('Error saving selection:', error);
            throw error;
        }
    },

    getState: async () => {
        try {
            const response = await apiClient.get('/state');

            // Валидируем данные состояния
            if (response.data && response.data.items) {
                response.data.items = validateItemsData(response.data.items);
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching state:', error);
            throw error;
        }
    }
};