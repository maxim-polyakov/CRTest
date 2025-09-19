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

// Добавляем перехватчик для ошибок
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export const itemsApi = {
    getItems: async (page, limit, search = '') => {
        const response = await apiClient.get('/items', {
            params: { page, limit, search }
        });
        return response.data;
    },

    saveOrder: async (itemOrder) => {
        await apiClient.post('/items/order', { itemOrder });
    },

    saveSelection: async (selectedItems) => {
        await apiClient.post('/items/selection', { selectedItems });
    },

    getState: async () => {
        const response = await apiClient.get('/state');
        return response.data;
    }
};