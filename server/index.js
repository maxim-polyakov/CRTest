require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Хранилище в памяти (заменяет базу данных)
let itemsState = {
    items: [],
    selectedItems: new Set(),
    itemOrder: []
};

// Генерация тестовых данных (1-1,000,000)
function generateItems() {
    if (itemsState.items.length === 0) {
        console.log('Генерация тестовых данных...');
        const items = [];
        for (let i = 1; i <= 1000000; i++) {
            items.push({
                id: i,
                name: `Элемент ${i}`,
                description: `Описание элемента ${i}`,
                value: Math.floor(Math.random() * 1000)
            });
        }
        itemsState.items = items;
        itemsState.itemOrder = items.map(item => item.id);
        console.log('Тестовые данные сгенерированы');
    }
}

// Получение элементов с пагинацией
app.get('/api/items', (req, res) => {
    generateItems();

    const { page = 1, limit = 20, search = '' } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    let filteredItems = itemsState.items;

    // Фильтрация по поиску
    if (search) {
        const searchLower = search.toLowerCase();
        filteredItems = itemsState.items.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.value.toString().includes(search)
        );
    }

    // Применение пользовательского порядка
    if (itemsState.itemOrder.length > 0) {
        const orderMap = new Map();
        itemsState.itemOrder.forEach((id, index) => orderMap.set(id, index));

        filteredItems.sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
            return orderA - orderB;
        });
    }

    const total = filteredItems.length;
    const items = filteredItems.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    res.json({
        items,
        total,
        hasMore,
        page: parseInt(page),
        limit: parseInt(limit)
    });
});

// Обновление порядка элементов
app.post('/api/items/order', (req, res) => {
    const { itemOrder } = req.body;
    if (itemOrder && Array.isArray(itemOrder)) {
        itemsState.itemOrder = itemOrder;
        res.json({ success: true, message: 'Порядок обновлен' });
    } else {
        res.status(400).json({ success: false, message: 'Неверный формат данных' });
    }
});

// Обновление выбранных элементов
app.post('/api/items/selection', (req, res) => {
    const { selectedItems } = req.body;
    if (selectedItems && Array.isArray(selectedItems)) {
        itemsState.selectedItems = new Set(selectedItems);
        res.json({ success: true, message: 'Выбор обновлен' });
    } else {
        res.status(400).json({ success: false, message: 'Неверный формат данных' });
    }
});

// Получение состояния
app.get('/api/state', (req, res) => {
    res.json({
        selectedItems: Array.from(itemsState.selectedItems),
        itemOrder: itemsState.itemOrder
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});