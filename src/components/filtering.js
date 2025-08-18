import {createComparison, defaultRules} from "../lib/compare.js";

// @todo: #4.3 — настроить компаратор
const compare = createComparison(defaultRules);

export function initFiltering(elements, indexes) {
    // @todo: #4.1 — заполнить выпадающие списки опциями
    Object.keys(indexes)
        .forEach((elementName) => {
            const targetElement = elements[elementName];
            if (!targetElement) return;
            const options = Object.values(indexes[elementName])
                .map((name) => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    return option;
                });
            targetElement.append(...options);
        });

    return (data, state, action) => {
        // @todo: #4.2 — обработать очистку поля
        if (action && action.name === 'clear') {
            const field = action.dataset.field;
            const wrapper = action.closest('.filter-wrapper') || action.parentElement;
            const input = wrapper ? wrapper.querySelector('input') : null;
            if (input) input.value = '';
            if (field) state[field] = '';
        }

        // @todo: #4.5 — отфильтровать данные используя компаратор
        return data.filter((row) => compare(row, state));
    }
}