require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Хранилище в памяти
let itemsState = {
    items: [],
    selectedItems: new Set(),
    itemOrder: []
};

// Генерация тестовых данных с оптимизацией
function generateItems() {
    if (itemsState.items.length === 0) {
        console.log('Генерация тестовых данных...');
        const items = [];

        // Оптимизированная генерация
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

// Кэш для поисковых запросов
const searchCache = new Map();
const CACHE_TTL = 30000; // 30 секунд

// Функция для очистки устаревшего кэша
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            searchCache.delete(key);
        }
    }
}, 60000);

// Получение элементов с пагинацией и оптимизацией
app.get('/api/items', (req, res) => {
    generateItems();

    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Проверка валидности параметров
    if (pageNum < 1 || limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({
            error: 'Неверные параметры пагинации'
        });
    }

    // Ключ для кэширования
    const cacheKey = `${search}-${JSON.stringify(itemsState.itemOrder)}`;

    try {
        let filteredItems;
        let total;

        // Используем кэш для поисковых запросов
        if (search && searchCache.has(cacheKey)) {
            const cached = searchCache.get(cacheKey);
            filteredItems = cached.filteredItems;
            total = cached.total;
        } else {
            // Фильтрация по поиску - ТОЧНОЕ СОВПАДЕНИЕ
            if (search) {
                const searchLower = search.toLowerCase();
                filteredItems = itemsState.items.filter(item =>
                    item.id.toString().includes(search)
                );
            } else {
                filteredItems = itemsState.items;
            }

            total = filteredItems.length;

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

            // Кэшируем результат поиска
            if (search) {
                searchCache.set(cacheKey, {
                    filteredItems,
                    total,
                    timestamp: Date.now()
                });
            }
        }

        // Пагинация
        const items = filteredItems.slice(startIndex, startIndex + limitNum);
        const hasMore = startIndex + limitNum < total;

        res.json({
            items,
            total,
            hasMore,
            page: pageNum,
            limit: limitNum
        });

    } catch (error) {
        console.error('Ошибка при получении элементов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


// Обновление порядка элементов (Drag&Drop)
app.post('/api/items/order', (req, res) => {
    try {
        const { itemOrder } = req.body;

        if (!itemOrder || !Array.isArray(itemOrder)) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат данных'
            });
        }

        // Проверяем, что все ID существуют
        const validIds = new Set(itemsState.items.map(item => item.id));
        const invalidIds = itemOrder.filter(id => !validIds.has(id));

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Найдены неверные ID: ${invalidIds.join(', ')}`
            });
        }

        itemsState.itemOrder = itemOrder;

        // Очищаем кэш поиска при изменении порядка
        searchCache.clear();

        res.json({
            success: true,
            message: 'Порядок обновлен',
            count: itemOrder.length
        });

    } catch (error) {
        console.error('Ошибка при обновлении порядка:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Обновление выбранных элементов
app.post('/api/items/selection', (req, res) => {
    try {
        const { selectedItems } = req.body;

        if (!selectedItems || !Array.isArray(selectedItems)) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат данных'
            });
        }

        // Проверяем, что все ID существуют
        const validIds = new Set(itemsState.items.map(item => item.id));
        const invalidIds = selectedItems.filter(id => !validIds.has(id));

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Найдены неверные ID: ${invalidIds.join(', ')}`
            });
        }

        itemsState.selectedItems = new Set(selectedItems);
        res.json({
            success: true,
            message: 'Выбор обновлен',
            count: selectedItems.length
        });

    } catch (error) {
        console.error('Ошибка при обновлении выбора:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Эндпоинт для массовых операций с элементами
app.post('/api/items/batch', (req, res) => {
    try {
        const { action, itemIds } = req.body;

        if (!action || !Array.isArray(itemIds)) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат данных'
            });
        }

        const validIds = new Set(itemsState.items.map(item => item.id));
        const invalidIds = itemIds.filter(id => !validIds.has(id));

        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Найдены неверные ID: ${invalidIds.join(', ')}`
            });
        }

        switch (action) {
            case 'select':
                itemIds.forEach(id => itemsState.selectedItems.add(id));
                break;
            case 'deselect':
                itemIds.forEach(id => itemsState.selectedItems.delete(id));
                break;
            case 'toggle':
                itemIds.forEach(id => {
                    if (itemsState.selectedItems.has(id)) {
                        itemsState.selectedItems.delete(id);
                    } else {
                        itemsState.selectedItems.add(id);
                    }
                });
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Неизвестное действие'
                });
        }

        res.json({
            success: true,
            message: `Действие "${action}" выполнено`,
            count: itemsState.selectedItems.size
        });

    } catch (error) {
        console.error('Ошибка при массовой операции:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Получение состояния
app.get('/api/state', (req, res) => {
    res.json({
        selectedItems: Array.from(itemsState.selectedItems),
        itemOrder: itemsState.itemOrder,
        totalItems: itemsState.items.length,
        selectedCount: itemsState.selectedItems.size
    });
});

// Эндпоинт для сброса состояния
app.post('/api/state/reset', (req, res) => {
    try {
        const { preserveSelection = false, preserveOrder = false } = req.body;

        if (!preserveSelection) {
            itemsState.selectedItems = new Set();
        }

        if (!preserveOrder) {
            itemsState.itemOrder = itemsState.items.map(item => item.id);
        }

        searchCache.clear();

        res.json({
            success: true,
            message: 'Состояние сброшено',
            preservedSelection: preserveSelection,
            preservedOrder: preserveOrder
        });

    } catch (error) {
        console.error('Ошибка при сбросе состояния:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Обработка несуществующих маршрутов
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Необработанная ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    generateItems(); // Предварительная генерация данных
});