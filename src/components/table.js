import {cloneTemplate} from "../lib/utils.js";

/**
 * Инициализирует таблицу и вызывает коллбэк при любых изменениях и нажатиях на кнопки
 *
 * @param {Object} settings
 * @param {(action: HTMLButtonElement | undefined) => void} onAction
 * @returns {{container: Node, elements: *, render: render}}
 */
export function initTable(settings, onAction) {
    const {tableTemplate, rowTemplate, before, after} = settings;
    const root = cloneTemplate(tableTemplate);

    // @todo: #1.2 —  вывести дополнительные шаблоны до и после таблицы
    const beforeClones = (Array.isArray(before) && before.length)
        ? [...before].reverse().map((templateId) => cloneTemplate(templateId))
        : [];
    beforeClones.forEach((cloned) => root.container.prepend(cloned.container));
    // Затем добавляем «after» в обычном порядке
    const afterClones = (Array.isArray(after) && after.length)
        ? after.map((templateId) => cloneTemplate(templateId))
        : [];
    afterClones.forEach((cloned) => root.container.appendChild(cloned.container));
    // Сохраняем клоны в root для последующего доступа
    root.before = beforeClones;
    root.after = afterClones;
    // Явная ссылка на пагинацию, если она присутствует среди before/after
    const paginationIndexAfter = Array.isArray(after) ? after.findIndex((id) => id === 'pagination') : -1;
    if (paginationIndexAfter >= 0) {
        root.pagination = afterClones[paginationIndexAfter];
    } else if (Array.isArray(before) && before.length) {
        const beforeIdsReversed = [...before].reverse();
        const paginationIndexBefore = beforeIdsReversed.findIndex((id) => id === 'pagination');
        if (paginationIndexBefore >= 0) {
            root.pagination = beforeClones[paginationIndexBefore];
        }
    }
    // Явная ссылка на header, если он присутствует среди before/after
    const headerIndexAfter = Array.isArray(after) ? after.findIndex((id) => id === 'header') : -1;
    if (headerIndexAfter >= 0) {
        root.header = afterClones[headerIndexAfter];
    } else if (Array.isArray(before) && before.length) {
        const beforeIdsReversed = [...before].reverse();
        const headerIndexBefore = beforeIdsReversed.findIndex((id) => id === 'header');
        if (headerIndexBefore >= 0) {
            root.header = beforeClones[headerIndexBefore];
        }
    }
    // Явная ссылка на filter, если он присутствует среди before/after
    const filterIndexAfter = Array.isArray(after) ? after.findIndex((id) => id === 'filter') : -1;
    if (filterIndexAfter >= 0) {
        root.filter = afterClones[filterIndexAfter];
    } else if (Array.isArray(before) && before.length) {
        const beforeIdsReversed2 = [...before].reverse();
        const filterIndexBefore = beforeIdsReversed2.findIndex((id) => id === 'filter');
        if (filterIndexBefore >= 0) {
            root.filter = beforeClones[filterIndexBefore];
        }
    }
    // Явная ссылка на search, если он присутствует среди before/after
    const searchIndexAfter = Array.isArray(after) ? after.findIndex((id) => id === 'search') : -1;
    if (searchIndexAfter >= 0) {
        root.search = afterClones[searchIndexAfter];
    } else if (Array.isArray(before) && before.length) {
        const beforeIdsReversed3 = [...before].reverse();
        const searchIndexBefore = beforeIdsReversed3.findIndex((id) => id === 'search');
        if (searchIndexBefore >= 0) {
            root.search = beforeClones[searchIndexBefore];
        }
    }

    // @todo: #1.3 —  обработать события и вызвать onAction()
    root.container.addEventListener('change', () => {
        onAction();
    });

    root.container.addEventListener('reset', () => {
        setTimeout(onAction);
    });

    root.container.addEventListener('submit', (e) => {
        e.preventDefault();
        onAction(e.submitter);
    });

    const render = (data) => {
        // @todo: #1.1 — преобразовать данные в массив строк на основе шаблона rowTemplate
        const nextRows = data.map((item) => {
            const row = cloneTemplate(rowTemplate);
            Object.keys(item).forEach((key) => {
                if (row.elements[key]) {
                    row.elements[key].textContent = item[key] != null ? String(item[key]) : '';
                }
            });
            return row.container;
        });
        root.elements.rows.replaceChildren(...nextRows);
    }

    return {...root, render};
}