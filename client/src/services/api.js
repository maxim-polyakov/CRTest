import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const itemsApi = {
    getItems: async (page, limit, search = '') => {
        const response = await axios.get(`${API_BASE}/items`, {
            params: { page, limit, search }
        });
        return response.data;
    },

    saveOrder: async (itemOrder) => {
        await axios.post(`${API_BASE}/items/order`, { itemOrder });
    },

    saveSelection: async (selectedItems) => {
        await axios.post(`${API_BASE}/items/selection`, { selectedItems });
    },

    getState: async () => {
        const response = await axios.get(`${API_BASE}/state`);
        return response.data;
    }
};