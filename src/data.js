import {makeIndex} from "./lib/utils.js";

export function initData(sourceData) {
    // Локальные индексы и кеш
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;

    // Подготовим индексы из локального датасета
    const ensureIndexes = () => {
        if (!sellers || !customers) {
            sellers = sourceData.sellers.reduce((acc, s) => ({ ...acc, [s.id]: `${s.first_name} ${s.last_name}` }), {});
            customers = sourceData.customers.reduce((acc, c) => ({ ...acc, [c.id]: `${c.first_name} ${c.last_name}` }), {});
        }
    };

    // Приведение полей записи к виду UI
    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    // Получение индексов из локальных данных
    const getIndexes = async () => {
        ensureIndexes();
        return { sellers, customers };
    };

    // Локальная выборка данных (фильтры, поиск, сортировка, пагинация)
    const getRecords = async (query, isUpdated = false) => {
        ensureIndexes();
        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();
        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }

        // Начальные данные
        let items = sourceData.purchase_records;

        // Поиск (search) по нескольким полям: дата, продавец, покупатель
        const search = query.search?.trim();
        if (search) {
            const s = search.toLowerCase();
            items = items.filter((r) => {
                const sellerName = sellers[r.seller_id]?.toLowerCase() || '';
                const customerName = customers[r.customer_id]?.toLowerCase() || '';
                return r.date.toLowerCase().includes(s) || sellerName.includes(s) || customerName.includes(s);
            });
        }

        // Фильтры
        const filter = Object.keys(query)
            .filter(k => k.startsWith('filter['))
            .reduce((acc, k) => {
                acc[k] = query[k];
                return acc;
            }, {});

        // Примеры ожидаемых ключей:
        // filter[date], filter[customer], filter[seller], filter[total][from], filter[total][to]
        if (filter['filter[date]']) {
            const f = String(filter['filter[date]']).toLowerCase();
            items = items.filter(r => r.date.toLowerCase().includes(f));
        }
        if (filter['filter[customer]']) {
            const f = String(filter['filter[customer]']).toLowerCase();
            items = items.filter(r => (customers[r.customer_id] || '').toLowerCase().includes(f));
        }
        if (filter['filter[seller]']) {
            const f = String(filter['filter[seller]']).toLowerCase();
            items = items.filter(r => (sellers[r.seller_id] || '').toLowerCase().includes(f));
        }
        const totalFrom = Number(filter['filter[total][from]'] ?? query['filter[totalFrom]']);
        const totalTo = Number(filter['filter[total][to]'] ?? query['filter[totalTo]']);
        if (Number.isFinite(totalFrom)) {
            items = items.filter(r => r.total_amount >= totalFrom);
        }
        if (Number.isFinite(totalTo)) {
            items = items.filter(r => r.total_amount <= totalTo);
        }

        // Сортировка: sort="field:up|down" где field: date | total
        if (query.sort) {
            const [field, dir] = String(query.sort).split(':');
            const factor = dir === 'down' ? -1 : 1;
            if (field === 'date') {
                items = items.toSorted((a, b) => factor * (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
            } else if (field === 'total') {
                items = items.toSorted((a, b) => factor * (a.total_amount - b.total_amount));
            }
        }

        // Пагинация
        const limit = Number(query.limit) || 10;
        const page = Number(query.page) || 1;
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);

        lastQuery = nextQuery;
        lastResult = {
            total: items.length,
            items: mapRecords(paged)
        };
        return lastResult;
    };

    return { getIndexes, getRecords };
}