/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    /*
    OpenGridJs (https://github.com/amurgola/OpenGridJs, MIT License) 기반 HandStack 고도화 그리드 엔진.

    고도화 항목:
    - 컬럼 정의(field, headerText, width, columnType, editable, hidden, align, format, options) 지원
    - 단일 행 선택, 키보드 탐색(방향키, Enter/F2 편집, Escape 취소)
    - 셀 인라인 편집(text, number, checkbox, dropdown)과 Flag(R/C/U/D) 상태 추적
    - 행 추가/수정/삭제(soft delete) 및 변경 데이터 조회
    - 가상 스크롤 개선(이벤트 위임, 다중 그리드 안전, insertAdjacentHTML 렌더링)
    - 정렬(타입 인식), 컬럼 값 필터, 전체 검색, 컬럼 이동/크기 조정
    - CSV 내보내기(BOM 포함), 컨텍스트 메뉴, 메시지 로케일 지원
    - XSS 방지를 위한 셀 값 HTML 이스케이프
    */
    class OpenGrid {
        constructor(target, setup) {
            setup = setup || {};

            this.rootElement = typeof target === 'string' ? document.querySelector(target) : target;
            if (!this.rootElement) {
                throw new Error('OpenGrid: 대상 요소를 찾을 수 없습니다.');
            }

            this.rootElement.gridInstance = this;
            this.rootElement.classList.add('opengridjs-grid', 'opengridjs-grid-container');

            this.setup = setup;
            this.gridRowPxSize = setup.rowHeight || 35;
            this.gridRowPxVisibleArea = setup.gridHeight || 300;
            this.dynamicRowHeight = setup.dynamicRowHeight === true;
            this.rowPadding = typeof setup.rowPadding === 'number' ? setup.rowPadding : 20;
            this.lineHeightMultiplier = typeof setup.lineHeightMultiplier === 'number' ? setup.lineHeightMultiplier : 1.5;
            this.editable = setup.editable !== false;
            this.selectionMode = setup.selectionMode || 'single';

            this.messages = Object.assign({
                emptyData: '데이터가 없습니다',
                contextMenuTitle: '메뉴',
                copyRow: '행 복사',
                exportCsv: 'CSV 내보내기',
                selectAll: '전체 선택',
                clearAll: '전체 해제',
                searchPlaceholder: '검색...',
                apply: '적용',
                cancel: '취소',
                emptyValue: '(빈 값)'
            }, setup.messages || {});

            this.contextMenuItems = setup.contextMenuOptions || null;
            this.contextMenuTitle = setup.contextMenuTitle || null;
            this.useContextMenu = setup.contextMenu !== false;
            this.loadMoreDataFunction = setup.loadMoreDataFunction || null;
            this.canLoadMoreData = true;
            this.isLoadingMoreData = false;
            this.loadedAtGridHeight = [];

            this.events = {
                rowClick: setup.onRowClick || null,
                rowDoubleClick: setup.onRowDoubleClick || null,
                selectionChange: setup.onSelectionChange || null,
                cellEditEnd: setup.onCellEditEnd || null,
                sortChange: setup.onSortChange || null,
                filterChange: setup.onFilterChange || null,
                dataChange: setup.onDataChange || null,
                codeHelpClick: setup.onCodeHelpClick || null
            };

            this.sortState = { header: null, sortDirection: null };
            this.columnFilters = {};
            this.filteredData = null;
            this.searchTerm = null;
            this.removedItems = [];
            this.selectedRowId = null;
            this.editingCell = null;

            this.gridData = [];
            this.originalData = [];
            this.totalHeight = 0;
            this._rowHeightCache = new Map();
            this._measureCanvas = null;
            this._measureCtx = null;
            this._destroyed = false;

            this.setColumns(setup.columns, Array.isArray(setup.data) ? setup.data : null);
            this.initGrid();
            this.generateGridHeader();

            if (typeof setup.data === 'function') {
                setup.data().then((fetchedData) => {
                    this.setData(fetchedData || [], { keepFlag: true });
                });
            }
            else {
                this.loadData(Array.isArray(setup.data) ? setup.data : []);
            }

            this.addEventListeners();
            this.observeResize();

            setTimeout(() => {
                if (this._destroyed) {
                    return;
                }

                this.updateVisibleArea();
                this.updateColumnWidths();
                this.autoResizeColumns();
                if (this.dynamicRowHeight) {
                    this.invalidateRowHeightCache();
                    this.rerender();
                }
            }, 0);
        }

        debounce(func, delay) {
            let inDebounce;
            return function () {
                const context = this;
                const args = arguments;
                clearTimeout(inDebounce);
                inDebounce = setTimeout(() => func.apply(context, args), delay);
            };
        }

        generateGUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        escapeHtml(text) {
            const str = text == null ? '' : String(text);
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        cssEscape(value) {
            if (window.CSS && window.CSS.escape) {
                return window.CSS.escape(value);
            }
            return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        }

        setMessages(messages) {
            this.messages = Object.assign(this.messages, messages || {});
            this.generateGridHeader();
            this.rerender();
        }

        normalizeColumn(column, index) {
            const field = column.field || column.dataField || column.data || 'column' + index;
            // 정의되지 않은 확장 속성(storeSourceID, nameColumnID, codeColumnID 등)은 그대로 유지한다.
            const normalized = Object.assign({}, column);
            normalized.data = field;
            normalized.field = field;
            normalized.dataField = field;
            normalized.headerName = column.headerText != null ? column.headerText : (column.columnText != null ? column.columnText : (column.headerName != null ? column.headerName : field));
            normalized.width = column.width ? (typeof column.width === 'number' ? `width:${column.width}px` : `min-width:${column.width}`) : null;
            normalized.configWidth = column.width || null;
            const columnType = column.columnType === 'numeric' ? 'number' : (column.columnType || 'text');
            normalized.columnType = ['text', 'number', 'checkbox', 'dropdown', 'codehelp'].indexOf(columnType) > -1 ? columnType : 'text';
            normalized.editable = column.editable !== false;
            normalized.hidden = column.hidden === true || column.isHidden === true;
            normalized.align = column.align || (normalized.columnType === 'number' ? 'right' : 'left');
            normalized.format = typeof column.format === 'function' ? column.format : null;
            normalized.options = Array.isArray(column.options) ? column.options : null;
            normalized.optionsProvider = typeof column.optionsProvider === 'function' ? column.optionsProvider : null;
            normalized.checkValue = column.checkValue == null ? '1' : column.checkValue;
            normalized.unCheckValue = column.unCheckValue == null ? '0' : column.unCheckValue;
            normalized.autoresize = column.autoresize !== false && !column.width;
            normalized.sortDirection = null;
            normalized.contentMinWidth = 0;
            return normalized;
        }

        getColumnOptions(header) {
            if (Array.isArray(header.options)) {
                return header.options;
            }

            if (typeof header.optionsProvider === 'function') {
                try {
                    return header.optionsProvider() || [];
                } catch (error) {
                    return [];
                }
            }

            return [];
        }

        setColumns(columns, sampleData) {
            if (!Array.isArray(columns) || columns.length === 0) {
                const sample = sampleData && sampleData.length > 0 ? sampleData[0] : null;
                columns = sample
                    ? Object.keys(sample).filter((key) => key !== 'Flag').map((key) => ({ field: key }))
                    : [];
            }

            this.allColumns = columns.map((column, index) => this.normalizeColumn(column, index));
            this.refreshVisibleColumns();
        }

        refreshVisibleColumns() {
            this.headerData = this.allColumns.filter((column) => column.hidden !== true);
            const share = this.headerData.length > 0 ? (100 / this.headerData.length) : 100;
            this.headerData.forEach((column) => {
                if (!column.width) {
                    column.width = `width:${share}%`;
                }
            });
        }

        getColumn(field) {
            return this.allColumns.find((column) => column.field === field) || null;
        }

        getColumnIndex(field) {
            return this.headerData.findIndex((column) => column.field === field);
        }

        setColumnVisible(field, visible) {
            const column = this.getColumn(field);
            if (!column) {
                return;
            }

            column.hidden = visible === false;
            this.refreshVisibleColumns();
            this.generateGridHeader();
            this.invalidateRowHeightCache();
            this.rerender();
        }

        loadData(data) {
            this.originalData = (data || []).map((item) => {
                if (item.id === undefined || item.id === null || item.id === '') {
                    item.id = this.generateGUID();
                }
                return item;
            });

            if ((!this.allColumns || this.allColumns.length === 0) && this.originalData.length > 0) {
                this.setColumns(null, this.originalData);
                this.generateGridHeader();
            }

            this.processData(this.originalData);
            this.generateGridRows();
        }

        setData(data, options) {
            options = options || {};
            this.invalidateRowHeightCache();
            this.removedItems = [];
            this.columnFilters = {};
            this.filteredData = null;
            this.searchTerm = null;
            this.selectedRowId = null;
            this.cancelEdit();

            if (options.keepFlag !== true) {
                (data || []).forEach((item) => {
                    item.Flag = 'R';
                });
            }

            this.loadData(data || []);
            this.updateFilterIndicators();
            this.raiseEvent('dataChange', 'set');
        }

        getData() {
            return this.originalData;
        }

        getViewData() {
            return this.gridData.map((item) => item.data);
        }

        processData(data) {
            this.gridData = (data || []).map((dataItem) => {
                if (dataItem.id === undefined || dataItem.id === null || dataItem.id === '') {
                    dataItem.id = this.generateGUID();
                }
                return {
                    data: dataItem,
                    position: 0,
                    height: this.gridRowPxSize,
                    isRendered: false
                };
            });

            this.sortData();
            this.calculateRowHeights();
            this.buildPositionsArray();
        }

        appendData(newData) {
            if (typeof newData === 'function') {
                newData().then((fetchedData) => {
                    if (fetchedData && fetchedData.length > 0) {
                        this.originalData = this.originalData.concat(fetchedData.map((item) => {
                            if (item.Flag === undefined) {
                                item.Flag = 'R';
                            }
                            return item;
                        }));
                        this.processData(this.filteredData || this.originalData);
                        this.rerender();
                    }
                    else {
                        this.canLoadMoreData = false;
                    }
                });
            }
            else if (newData && newData.length > 0) {
                this.originalData = this.originalData.concat(newData.map((item) => {
                    if (item.Flag === undefined) {
                        item.Flag = 'R';
                    }
                    return item;
                }));
                this.processData(this.filteredData || this.originalData);
                this.rerender();
            }
            else {
                this.canLoadMoreData = false;
            }
        }

        updateRecordData(newData, options) {
            options = options || {};
            const animate = options.animate !== false;
            const highlightDuration = options.highlightDuration || 2000;
            const recordsToUpdate = Array.isArray(newData) ? newData : [newData];

            recordsToUpdate.forEach((newRecord) => {
                if (newRecord.id == null) {
                    return;
                }

                const existingIndex = this.originalData.findIndex((item) => String(item.id) === String(newRecord.id));
                if (existingIndex === -1) {
                    return;
                }

                const oldRecord = this.originalData[existingIndex];
                const changedFields = {};
                Object.keys(newRecord).forEach((key) => {
                    if (key !== 'id' && oldRecord[key] !== newRecord[key]) {
                        changedFields[key] = {
                            oldValue: oldRecord[key],
                            newValue: newRecord[key],
                            isNumeric: !isNaN(oldRecord[key]) && !isNaN(newRecord[key])
                        };
                    }
                });

                this.originalData[existingIndex] = Object.assign({}, oldRecord, newRecord);
                this._rowHeightCache.delete(String(newRecord.id));

                if (this.filteredData) {
                    const filteredIndex = this.filteredData.findIndex((item) => String(item.id) === String(newRecord.id));
                    if (filteredIndex !== -1) {
                        this.filteredData[filteredIndex] = Object.assign({}, this.filteredData[filteredIndex], newRecord);
                    }
                }

                const gridItem = this.gridData.find((item) => String(item.data.id) === String(newRecord.id));
                if (gridItem) {
                    gridItem.data = this.originalData[existingIndex];
                }

                this.updateRecordVisually(newRecord.id, this.originalData[existingIndex], changedFields, animate, highlightDuration);
            });
        }

        updateRecordVisually(recordId, rowData, changedFields, animate, highlightDuration) {
            const rowElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(recordId))}"]`);
            if (!rowElement) {
                return;
            }

            const columnItems = rowElement.querySelectorAll('.opengridjs-grid-column-item');
            columnItems.forEach((columnItem, index) => {
                if (index >= this.headerData.length) {
                    return;
                }

                const header = this.headerData[index];
                if (changedFields[header.field]) {
                    columnItem.innerHTML = this.getCellHtmlValue(rowData, header);
                    if (animate) {
                        this.animateFieldChange(columnItem, changedFields[header.field], highlightDuration);
                    }
                }
            });
        }

        animateFieldChange(element, change, duration) {
            element.classList.remove('opengridjs-field-updated', 'opengridjs-field-increased', 'opengridjs-field-decreased');

            if (change.isNumeric) {
                const oldNum = parseFloat(change.oldValue);
                const newNum = parseFloat(change.newValue);
                if (newNum > oldNum) {
                    element.classList.add('opengridjs-field-increased');
                }
                else if (newNum < oldNum) {
                    element.classList.add('opengridjs-field-decreased');
                }
                else {
                    element.classList.add('opengridjs-field-updated');
                }
            }
            else {
                element.classList.add('opengridjs-field-updated');
            }

            setTimeout(() => {
                element.classList.remove('opengridjs-field-updated', 'opengridjs-field-increased', 'opengridjs-field-decreased');
            }, duration);
        }

        upgradeFlag(item) {
            if (item.Flag !== 'C') {
                item.Flag = 'U';
            }
        }

        getFlag(rowRef) {
            const item = this.resolveRowItem(rowRef);
            return item ? (item.Flag || '') : null;
        }

        setFlag(rowRef, flag) {
            const item = this.resolveRowItem(rowRef);
            if (item) {
                item.Flag = flag;
            }
        }

        resolveRowItem(rowRef) {
            if (rowRef == null) {
                return null;
            }

            if (typeof rowRef === 'object') {
                return rowRef;
            }

            if (typeof rowRef === 'number') {
                const gridItem = this.gridData[rowRef];
                return gridItem ? gridItem.data : null;
            }

            return this.originalData.find((item) => String(item.id) === String(rowRef)) || null;
        }

        insertRow(values, options) {
            options = options || {};
            const item = Object.assign({}, values || {});
            if (item.id === undefined || item.id === null || item.id === '') {
                item.id = this.generateGUID();
            }
            item.Flag = 'C';

            const index = typeof options.index === 'number' ? options.index : this.originalData.length;
            this.originalData.splice(index, 0, item);
            if (this.filteredData) {
                this.filteredData.splice(Math.min(index, this.filteredData.length), 0, item);
            }

            this.processData(this.filteredData || this.originalData);
            this.rerender();

            if (options.focus !== false) {
                const rowIndex = this.gridData.findIndex((gridItem) => gridItem.data === item);
                if (rowIndex > -1) {
                    this.selectRow(rowIndex);
                    this.scrollToRow(rowIndex);
                }
            }

            this.raiseEvent('dataChange', 'insert', item);
            return item;
        }

        updateRow(values, rowRef) {
            const item = this.resolveRowItem(rowRef != null ? rowRef : this.getSelectedIndex());
            if (!item) {
                return null;
            }

            Object.keys(values || {}).forEach((key) => {
                if (key !== 'id' && key !== 'Flag' && item[key] !== values[key]) {
                    item[key] = values[key];
                    this.upgradeFlag(item);
                }
            });

            this._rowHeightCache.delete(String(item.id));
            this.rerender();
            this.raiseEvent('dataChange', 'update', item);
            return item;
        }

        removeRow(rowRef) {
            const item = this.resolveRowItem(rowRef != null ? rowRef : this.getSelectedIndex());
            if (!item) {
                return null;
            }

            const removeFrom = (list) => {
                const index = list.indexOf(item);
                if (index > -1) {
                    list.splice(index, 1);
                }
            };

            if (item.Flag !== 'C') {
                const removed = Object.assign({}, item);
                removed.Flag = 'D';
                this.removedItems.push(removed);
            }

            removeFrom(this.originalData);
            if (this.filteredData) {
                removeFrom(this.filteredData);
            }

            if (this.selectedRowId != null && String(this.selectedRowId) === String(item.id)) {
                this.selectedRowId = null;
                this.raiseEvent('selectionChange', -1, null);
            }

            this.processData(this.filteredData || this.originalData);
            this.rerender();
            this.raiseEvent('dataChange', 'remove', item);
            return item;
        }

        getRemovedItems() {
            return this.removedItems;
        }

        getUpdateItems() {
            return this.originalData
                .filter((item) => item.Flag === 'C' || item.Flag === 'U')
                .concat(this.removedItems);
        }

        isUpdateData() {
            return this.getUpdateItems().length > 0;
        }

        resetUpdatedItems(flag) {
            this.removedItems = [];
            this.originalData.forEach((item) => {
                item.Flag = flag || 'R';
            });
        }

        getCellValue(rowIndex, field) {
            const gridItem = this.gridData[rowIndex];
            if (!gridItem) {
                return null;
            }

            const value = this.resolveCellValue(gridItem.data, field);
            return value === undefined ? null : value;
        }

        setCellValue(rowIndex, field, value, options) {
            options = options || {};
            const gridItem = this.gridData[rowIndex];
            if (!gridItem) {
                return;
            }

            const item = gridItem.data;
            const oldValue = item[field];
            if (oldValue === value) {
                return;
            }

            item[field] = value;
            if (options.silent !== true) {
                this.upgradeFlag(item);
            }

            this._rowHeightCache.delete(String(item.id));
            this.refreshRowElement(item);

            if (options.raiseEvent !== false) {
                this.raiseEvent('cellEditEnd', rowIndex, field, oldValue, value, item);
            }
        }

        refreshRowElement(item) {
            const rowElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(item.id))}"]`);
            if (!rowElement) {
                return;
            }

            rowElement.innerHTML = this.buildRowCellsHtml(item);
        }

        resolveCellValue(rowData, field) {
            if (field == null) {
                return undefined;
            }

            if (typeof field === 'string' && field.includes('.')) {
                const keys = field.split('.');
                let current = rowData;
                for (const key of keys) {
                    if (current == null) {
                        return undefined;
                    }
                    current = current[key];
                }
                return current;
            }

            return rowData ? rowData[field] : undefined;
        }

        initGrid() {
            if (this.dynamicRowHeight) {
                this.rootElement.classList.add('opengridjs-dynamic-row-height');
            }

            this.rootElement.innerHTML = `
        <div class='opengridjs-grid-additional'></div>
        <div class='opengridjs-grid-header'></div>
        <div class='opengridjs-grid-rows-container'></div>`;
        }

        generateGridHeader() {
            const gridHeader = this.rootElement.querySelector('.opengridjs-grid-header');
            if (!gridHeader) {
                return;
            }

            gridHeader.innerHTML = this.headerData.map((header) => {
                const headerStyle = this.getColumnStyle(header);
                return `<div class='opengridjs-grid-header-item' draggable="true" data-header='${this.escapeHtml(header.data)}' style='${headerStyle}'>
                <span class='opengridjs-header-text'>${this.escapeHtml(header.headerName)}</span>
                <span class='opengridjs-header-actions'>
                    <span class='opengridjs-filter-button' data-column='${this.escapeHtml(header.data)}' title='Filter'>▼</span>
                    <span class='opengridjs-sort-indicator'></span>
                </span>
                <span class='opengridjs-resize-handle'></span>
            </div>`;
            }).join('');

            const headerItems = Array.from(gridHeader.getElementsByClassName('opengridjs-grid-header-item'));
            let headerOrder = 0;
            headerItems.forEach((headerItem) => {
                const header = this.headerData.find((x) => x.data === headerItem.getAttribute('data-header'));
                if (header && header.sortDirection) {
                    headerItem.classList.add(header.sortDirection === 'asc' ? 'opengridjs-sort-asc' : 'opengridjs-sort-desc');
                }

                headerItem.setAttribute('data-order', headerOrder++);
                headerItem.addEventListener('dragstart', (e) => this.handleDragStart(e));
                headerItem.addEventListener('dragover', (e) => this.handleDragOver(e));
                headerItem.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                headerItem.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                headerItem.addEventListener('drop', (e) => this.handleDrop(e));
                headerItem.addEventListener('dragend', (e) => this.handleDragEnd(e));

                const resizeHandle = headerItem.querySelector('.opengridjs-resize-handle');
                if (resizeHandle) {
                    this.addResizeHandleEvents(resizeHandle, headerItem);
                }
            });

            this.updateFilterIndicators();
        }

        handleDragStart(e) {
            this.draggedColumn = e.target.closest('.opengridjs-grid-header-item');
            if (!this.draggedColumn) {
                return;
            }

            this.draggedColumn.classList.add('opengridjs-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedColumn.getAttribute('data-header'));
        }

        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        handleDragEnter(e) {
            e.preventDefault();
            const headerItem = e.target.closest('.opengridjs-grid-header-item');
            if (headerItem && headerItem !== this.draggedColumn) {
                headerItem.classList.add('opengridjs-drag-over');
            }
        }

        handleDragLeave(e) {
            const headerItem = e.target.closest('.opengridjs-grid-header-item');
            if (headerItem && !headerItem.contains(e.relatedTarget)) {
                headerItem.classList.remove('opengridjs-drag-over');
            }
        }

        handleDrop(e) {
            e.preventDefault();
            const dropTarget = e.target.closest('.opengridjs-grid-header-item');
            if (!dropTarget || !this.draggedColumn || dropTarget === this.draggedColumn) {
                return;
            }

            const draggedIndex = parseInt(this.draggedColumn.getAttribute('data-order'), 10);
            const dropIndex = parseInt(dropTarget.getAttribute('data-order'), 10);
            if (isNaN(draggedIndex) || isNaN(dropIndex) ||
                draggedIndex < 0 || dropIndex < 0 ||
                draggedIndex >= this.headerData.length || dropIndex >= this.headerData.length) {
                return;
            }

            const draggedHeader = this.headerData[draggedIndex];
            const dropHeader = this.headerData[dropIndex];

            const fromIndex = this.allColumns.indexOf(draggedHeader);
            this.allColumns.splice(fromIndex, 1);
            const toIndex = this.allColumns.indexOf(dropHeader);
            this.allColumns.splice(draggedIndex < dropIndex ? toIndex + 1 : toIndex, 0, draggedHeader);

            this.refreshVisibleColumns();
            this.generateGridHeader();
            this.invalidateRowHeightCache();
            this.updateColumnWidths();
            this.rerender();
        }

        handleDragEnd() {
            this.rootElement.querySelectorAll('.opengridjs-grid-header-item').forEach((item) => {
                item.classList.remove('opengridjs-dragging', 'opengridjs-drag-over');
            });
            this.draggedColumn = null;
        }

        addResizeHandleEvents(resizeHandle, headerItem) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            let headerIndex = 0;
            let wasResizing = false;

            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                isResizing = true;
                startX = e.clientX;
                startWidth = headerItem.offsetWidth;
                headerIndex = parseInt(headerItem.getAttribute('data-order'), 10);

                headerItem.classList.add('opengridjs-resizing');
                headerItem.setAttribute('draggable', 'false');

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });

            resizeHandle.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.autoResizeColumns();
            });

            const handleMouseMove = (e) => {
                if (!isResizing) {
                    return;
                }

                const deltaX = e.clientX - startX;
                const minAllowedWidth = this.headerData[headerIndex].contentMinWidth || 80;
                const newWidth = Math.max(minAllowedWidth, startWidth + deltaX);

                this.headerData[headerIndex].width = `width:${newWidth}px`;
                headerItem.style.width = `${newWidth}px`;
                headerItem.style.flexGrow = '0';
                headerItem.style.flexShrink = '0';

                this.updateColumnWidths();
            };

            const handleMouseUp = () => {
                if (!isResizing) {
                    return;
                }

                wasResizing = true;
                isResizing = false;
                headerItem.classList.remove('opengridjs-resizing');
                headerItem.setAttribute('draggable', 'true');

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);

                this.invalidateRowHeightCache();
                this.rerender();

                setTimeout(() => {
                    wasResizing = false;
                }, 10);
            };

            headerItem._wasResizing = () => wasResizing;
        }

        updateColumnWidths() {
            this.calculateContentMinWidths();

            const gridRows = this.rootElement.querySelectorAll('.opengridjs-grid-row');
            gridRows.forEach((row) => {
                const columnItems = row.querySelectorAll('.opengridjs-grid-column-item');
                columnItems.forEach((item, index) => {
                    if (this.headerData[index]) {
                        item.style.cssText = this.getColumnStyle(this.headerData[index], true);
                    }
                });
            });

            this.updateHeaderWidths();
        }

        updateHeaderWidths() {
            const headerItems = this.rootElement.querySelectorAll('.opengridjs-grid-header-item');
            headerItems.forEach((headerItem, index) => {
                if (this.headerData[index]) {
                    headerItem.style.cssText = this.getColumnStyle(this.headerData[index]);
                }
            });
        }

        calculateContentMinWidths() {
            const visibleRows = this.rootElement.querySelectorAll('.opengridjs-grid-row');
            const headerItems = this.rootElement.querySelectorAll('.opengridjs-grid-header-item');

            this.headerData.forEach((header, columnIndex) => {
                let maxContentWidth = 0;

                if (headerItems[columnIndex]) {
                    const headerText = headerItems[columnIndex].querySelector('.opengridjs-header-text');
                    if (headerText) {
                        const headerTextWidth = this.measureTextWidth(headerText.textContent, headerText);
                        maxContentWidth = Math.max(maxContentWidth, headerTextWidth + 50 + 32);
                    }
                }

                if (!this.dynamicRowHeight) {
                    const sampleSize = Math.min(10, visibleRows.length);
                    for (let i = 0; i < sampleSize; i++) {
                        const cell = visibleRows[i].querySelectorAll('.opengridjs-grid-column-item')[columnIndex];
                        if (cell) {
                            maxContentWidth = Math.max(maxContentWidth, this.measureTextWidth(cell.textContent, cell) + 32);
                        }
                    }
                }

                header.contentMinWidth = Math.max(80, maxContentWidth);
            });
        }

        getColumnStyle(header, isCell) {
            const baseStyle = header.width || '';
            let minWidthConstraint = '';
            if (header.contentMinWidth) {
                minWidthConstraint = `min-width: ${header.contentMinWidth}px; `;
            }

            let alignStyle = '';
            if (isCell === true && header.align && header.align !== 'left') {
                alignStyle = `justify-content: ${header.align === 'right' ? 'flex-end' : 'center'}; text-align: ${header.align}; `;
            }

            if (baseStyle.includes('min-width') || baseStyle.includes('width:')) {
                const pxMatch = baseStyle.match(/(\d+(?:\.\d+)?)px/);
                const explicitPx = pxMatch ? parseFloat(pxMatch[1]) : 0;
                const basisPx = Math.max(explicitPx, header.contentMinWidth || 0);
                const basisDecl = basisPx > 0 ? `flex-basis: ${basisPx}px; ` : '';
                return `${minWidthConstraint}${baseStyle}; ${basisDecl}${alignStyle}flex-grow: 0; flex-shrink: 0; box-sizing: border-box;`;
            }

            return `${minWidthConstraint}${baseStyle}; ${alignStyle}box-sizing: border-box;`;
        }

        autoResizeColumns() {
            const gridHeader = this.rootElement.querySelector('.opengridjs-grid-header');
            if (!gridHeader) {
                return;
            }

            const containerWidth = gridHeader.offsetWidth;
            if (containerWidth === 0) {
                return;
            }

            let fixedWidth = 0;
            let autoResizeCount = 0;
            this.headerData.forEach((header) => {
                if (header.autoresize === false) {
                    const headerEl = gridHeader.querySelector(`[data-header='${this.cssEscape(header.data)}']`);
                    fixedWidth += headerEl ? headerEl.offsetWidth : 0;
                }
                else {
                    autoResizeCount++;
                }
            });

            if (autoResizeCount === 0) {
                return;
            }

            const equalWidth = Math.floor((containerWidth - fixedWidth) / autoResizeCount);
            this.headerData.forEach((header) => {
                if (header.autoresize !== false) {
                    header.width = `width:${equalWidth}px`;
                }
            });

            this.generateGridHeader();
            this.invalidateRowHeightCache();
            this.rerender();
        }

        _getMeasureContext() {
            if (this._measureCtx) {
                return this._measureCtx;
            }

            try {
                this._measureCanvas = document.createElement('canvas');
                const ctx = this._measureCanvas.getContext('2d');
                if (ctx) {
                    this._measureCtx = ctx;
                    return ctx;
                }
            } catch (error) {
                // canvas 미지원 환경
            }
            return null;
        }

        measureTextWidth(text, element) {
            try {
                const context = this._getMeasureContext();
                if (!context) {
                    throw new Error('canvas 미지원');
                }

                const styles = window.getComputedStyle(element);
                context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
                return Math.ceil(context.measureText(text || '').width);
            } catch (error) {
                return (text || '').length * 7;
            }
        }

        measureTextHeight(text, font, cellWidth, lineHeight) {
            const str = text == null ? '' : String(text);
            if (!str.trim()) {
                return lineHeight;
            }

            const usableWidth = Math.max(20, cellWidth);
            const ctx = this._getMeasureContext();
            if (!ctx) {
                const charsPerLine = Math.max(1, Math.floor(usableWidth / 7));
                let totalLines = 0;
                str.split(/\r?\n/).forEach((segment) => {
                    totalLines += Math.max(1, Math.ceil(segment.length / charsPerLine));
                });
                return totalLines * lineHeight;
            }

            ctx.font = font;

            let totalLines = 0;
            str.split(/\r?\n/).forEach((segment) => {
                if (!segment) {
                    totalLines += 1;
                    return;
                }

                const words = segment.split(/\s+/).filter(Boolean);
                if (words.length === 0) {
                    totalLines += 1;
                    return;
                }

                let line = '';
                let lineCount = 1;
                for (const word of words) {
                    const candidate = line ? `${line} ${word}` : word;
                    if (ctx.measureText(candidate).width > usableWidth && line) {
                        lineCount++;
                        if (ctx.measureText(word).width > usableWidth) {
                            lineCount += Math.max(0, Math.floor(ctx.measureText(word).width / usableWidth));
                        }
                        line = word;
                    }
                    else {
                        line = candidate;
                    }
                }

                if (line && ctx.measureText(line).width > usableWidth) {
                    lineCount += Math.max(0, Math.floor(ctx.measureText(line).width / usableWidth));
                }
                totalLines += lineCount;
            });

            return totalLines * lineHeight;
        }

        _getRowFontMetrics() {
            let font = '400 14px -apple-system, BlinkMacSystemFont, sans-serif';
            let lineHeight = Math.ceil(14 * this.lineHeightMultiplier);

            const sample = this.rootElement.querySelector('.opengridjs-grid-column-item')
                || this.rootElement.querySelector('.opengridjs-grid-header-item');

            if (sample && window.getComputedStyle) {
                try {
                    const styles = window.getComputedStyle(sample);
                    font = `${styles.fontWeight || '400'} ${styles.fontSize || '14px'} ${styles.fontFamily || 'sans-serif'}`;
                    const parsedSize = parseFloat(styles.fontSize);
                    if (!isNaN(parsedSize) && parsedSize > 0) {
                        lineHeight = Math.ceil(parsedSize * this.lineHeightMultiplier);
                    }
                } catch (error) {
                    // 기본값 유지
                }
            }
            return { font, lineHeight };
        }

        _getColumnPixelWidths() {
            const headerEls = this.rootElement.querySelectorAll('.opengridjs-grid-header-item');
            const widths = [];
            let anyResolved = false;
            this.headerData.forEach((_, i) => {
                const el = headerEls[i];
                const w = el ? el.offsetWidth : 0;
                if (w > 0) {
                    anyResolved = true;
                }
                widths.push(w);
            });

            const container = this.rootElement.querySelector('.opengridjs-grid-header');
            const containerWidth = (container && container.offsetWidth) || this.rootElement.offsetWidth || 600;
            const fallback = Math.max(60, Math.floor(containerWidth / Math.max(1, this.headerData.length)));

            if (!anyResolved) {
                return this.headerData.map(() => fallback);
            }

            return widths.map((w) => (w > 0 ? w : fallback));
        }

        _stripHtml(value) {
            const str = value == null ? '' : String(value);
            if (!/<[^>]*>/.test(str)) {
                return str;
            }
            return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        calculateRowHeights() {
            if (!this.dynamicRowHeight) {
                this.gridData.forEach((item) => {
                    item.height = this.gridRowPxSize;
                });
                return;
            }

            const columnWidths = this._getColumnPixelWidths();
            const { font, lineHeight } = this._getRowFontMetrics();
            const horizontalPadding = 32;

            this.gridData.forEach((item) => {
                const cacheKey = item.data && item.data.id != null ? String(item.data.id) : null;
                const cached = cacheKey != null ? this._rowHeightCache.get(cacheKey) : null;
                if (cached != null) {
                    item.height = cached;
                    return;
                }

                let tallest = 0;
                this.headerData.forEach((header, colIdx) => {
                    let value = this.resolveCellValue(item.data, header.data);
                    if (value == null || value === '') {
                        return;
                    }

                    if (header.format) {
                        try {
                            value = header.format(value, item.data);
                        } catch (error) {
                            // 원본 값 사용
                        }
                    }

                    const plain = this._stripHtml(value);
                    if (!plain) {
                        return;
                    }

                    const cellWidth = Math.max(20, (columnWidths[colIdx] || 120) - horizontalPadding);
                    const h = this.measureTextHeight(plain, font, cellWidth, lineHeight);
                    if (h > tallest) {
                        tallest = h;
                    }
                });

                const computed = Math.max(this.gridRowPxSize, Math.ceil(tallest + this.rowPadding));
                item.height = computed;
                if (cacheKey != null) {
                    this._rowHeightCache.set(cacheKey, computed);
                }
            });
        }

        buildPositionsArray() {
            let pos = 0;
            for (let i = 0; i < this.gridData.length; i++) {
                const item = this.gridData[i];
                item.position = pos;
                pos += item.height || this.gridRowPxSize;
            }
            this.totalHeight = pos;
        }

        invalidateRowHeightCache() {
            this._rowHeightCache.clear();
        }

        findFirstVisibleRowIndex(scrollTop) {
            const n = this.gridData.length;
            if (n === 0) {
                return 0;
            }

            let lo = 0;
            let hi = n - 1;
            let result = n;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const item = this.gridData[mid];
                const end = item.position + (item.height || this.gridRowPxSize);
                if (end > scrollTop) {
                    result = mid;
                    hi = mid - 1;
                }
                else {
                    lo = mid + 1;
                }
            }
            return result;
        }

        findLastVisibleRowIndex(viewportBottom) {
            const n = this.gridData.length;
            if (n === 0) {
                return -1;
            }

            let lo = 0;
            let hi = n - 1;
            let result = -1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const item = this.gridData[mid];
                if (item.position < viewportBottom) {
                    result = mid;
                    lo = mid + 1;
                }
                else {
                    hi = mid - 1;
                }
            }
            return result;
        }

        updateVisibleArea() {
            const container = this.rootElement.querySelector('.opengridjs-grid-rows-container');
            if (container && container.clientHeight > 0) {
                this.gridRowPxVisibleArea = container.clientHeight;
            }
        }

        generateGridRows() {
            const gridRowsContainer = this.rootElement.querySelector('.opengridjs-grid-rows-container');
            if (!gridRowsContainer) {
                return;
            }

            if (this.setup.gridHeight) {
                gridRowsContainer.style.height = `${this.setup.gridHeight}px`;
            }

            gridRowsContainer.innerHTML = "<div class='opengridjs-grid-rows'></div>";
            const gridRows = gridRowsContainer.querySelector('.opengridjs-grid-rows');
            gridRows.style.height = `${this.totalHeight || (this.gridRowPxSize * this.gridData.length)}px`;

            this.updateVisibleArea();
            this.renderVisible(gridRowsContainer, gridRows);
            this.renderEmptyMessage(gridRowsContainer);
        }

        renderEmptyMessage(gridRowsContainer) {
            const existing = gridRowsContainer.querySelector('.opengridjs-empty-message');
            if (this.gridData.length === 0) {
                if (!existing) {
                    const empty = document.createElement('div');
                    empty.className = 'opengridjs-empty-message';
                    empty.textContent = this.messages.emptyData;
                    gridRowsContainer.appendChild(empty);
                }
            }
            else if (existing) {
                existing.remove();
            }
        }

        rerender() {
            this.cancelEdit();
            if (this.filteredData) {
                this.processData(this.filteredData);
            }
            else {
                this.processData(this.originalData);
            }
            this.generateGridRows();
        }

        renderVisible(gridRowsContainer, gridRows) {
            if (!gridRowsContainer || !gridRows) {
                return;
            }

            if (this.gridData.length === 0) {
                return;
            }

            const scrollTop = gridRowsContainer.scrollTop || 0;
            const viewportBottom = scrollTop + this.gridRowPxVisibleArea;

            let firstIdx = this.findFirstVisibleRowIndex(scrollTop);
            let lastIdx = this.findLastVisibleRowIndex(viewportBottom);

            const buffer = 3;
            firstIdx = Math.max(0, firstIdx - buffer);
            lastIdx = Math.min(this.gridData.length - 1, (lastIdx < 0 ? firstIdx : lastIdx) + buffer);

            for (let i = 0; i < this.gridData.length; i++) {
                const item = this.gridData[i];
                if (item.isRendered && (i < firstIdx || i > lastIdx)) {
                    this.removeRowElement(item);
                }
            }

            for (let i = firstIdx; i <= lastIdx; i++) {
                const item = this.gridData[i];
                if (!item.isRendered) {
                    this.addRowElement(gridRows, item, i);
                }
            }
        }

        getCellHtmlValue(rowData, header) {
            let found = this.resolveCellValue(rowData, header.data);

            if (header.columnType === 'checkbox') {
                const checked = String(found) === String(header.checkValue) || found === true || found === 1 || found === '1' || found === 'Y' || found === 'true';
                const disabled = (this.editable === false || header.editable === false) ? ' disabled' : '';
                return `<input type='checkbox' class='opengridjs-cell-checkbox' data-field='${this.escapeHtml(header.data)}'${checked ? ' checked' : ''}${disabled} />`;
            }

            if (header.columnType === 'dropdown') {
                const options = this.getColumnOptions(header);
                const matched = options.find((option) => {
                    const optionValue = option && typeof option === 'object' ? option.value : option;
                    return String(optionValue) === String(found);
                });
                if (matched) {
                    found = matched && typeof matched === 'object' ? matched.text : matched;
                }
            }

            if (header.columnType === 'codehelp') {
                const value = found == null || found === '' ? '&nbsp;' : this.escapeHtml(found);
                return `<span class='opengridjs-codehelp-value'>${value}</span><button type='button' class='opengridjs-codehelp-button' data-field='${this.escapeHtml(header.data)}' aria-label='코드도움'><svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'><circle cx='11' cy='11' r='7'></circle><line x1='16.5' y1='16.5' x2='21' y2='21'></line></svg></button>`;
            }

            if (header.format) {
                try {
                    return header.format(found, rowData) ?? '&nbsp;';
                } catch (error) {
                    // 원본 값 사용
                }
            }

            if (found == null || found === '') {
                return '&nbsp;';
            }

            return this.escapeHtml(found);
        }

        buildRowCellsHtml(rowData) {
            return this.headerData.map((header) => {
                const columnStyle = this.getColumnStyle(header, true);
                return `<div class='opengridjs-grid-column-item' data-field='${this.escapeHtml(header.data)}' style='${columnStyle}'>${this.getCellHtmlValue(rowData, header)}</div>`;
            }).join('');
        }

        addRowElement(gridRows, rowItem, rowIndex) {
            rowItem.isRendered = true;
            const rowHeight = rowItem.height || this.gridRowPxSize;
            const heightStyle = this.dynamicRowHeight ? `height:${rowHeight}px; ` : `height:${rowHeight}px; `;
            const selectedClass = this.selectedRowId != null && String(rowItem.data.id) === String(this.selectedRowId) ? ' opengridjs-selected-grid-row' : '';

            gridRows.insertAdjacentHTML('beforeend',
                `<div data-id='${this.escapeHtml(String(rowItem.data.id))}' data-row-index='${rowIndex}' class='opengridjs-grid-row${selectedClass}' style='${heightStyle}top:${rowItem.position}px'>${this.buildRowCellsHtml(rowItem.data)}</div>`);
        }

        removeRowElement(rowItem) {
            rowItem.isRendered = false;
            const found = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(rowItem.data.id))}"]`);
            if (found) {
                found.remove();
            }
        }

        raiseEvent(eventName) {
            const handler = this.events[eventName];
            if (typeof handler === 'function') {
                try {
                    return handler.apply(this, Array.prototype.slice.call(arguments, 1));
                } catch (error) {
                    if (window.syn && syn.$l && syn.$l.eventLog) {
                        syn.$l.eventLog('OpenGrid_' + eventName, error.toString(), 'Error');
                    }
                }
            }
            return undefined;
        }

        addEventListeners() {
            const gridRowsContainer = this.rootElement.querySelector('.opengridjs-grid-rows-container');

            const debouncedLoadMore = this.debounce(() => {
                if (this.isNearBottom(gridRowsContainer) && this.canLoadMoreData && !this.isLoadingMoreData && this.loadMoreDataFunction) {
                    this.isLoadingMoreData = true;
                    this.loadMoreDataFunction(() => {
                        this.isLoadingMoreData = false;
                    });
                }
            }, 300);

            gridRowsContainer.addEventListener('scroll', () => {
                this.commitEdit();
                const gridRows = gridRowsContainer.querySelector('.opengridjs-grid-rows');
                this.renderVisible(gridRowsContainer, gridRows);
                this.closeContextMenu();
                debouncedLoadMore();
            });

            gridRowsContainer.addEventListener('click', (e) => {
                this.closeContextMenu();
                const rowElement = e.target.closest('.opengridjs-grid-row');
                if (!rowElement) {
                    return;
                }

                const rowIndex = this.getRowIndexById(rowElement.getAttribute('data-id'));
                if (rowIndex === -1) {
                    return;
                }

                this.selectRow(rowIndex);

                const cell = e.target.closest('.opengridjs-grid-column-item');
                const item = this.gridData[rowIndex].data;
                const codeHelpButton = e.target.closest('.opengridjs-codehelp-button');
                if (codeHelpButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    const field = codeHelpButton.getAttribute('data-field');
                    this.raiseEvent('codeHelpClick', rowIndex, field, item);
                    return;
                }

                this.raiseEvent('rowClick', rowIndex, item, cell ? cell.getAttribute('data-field') : null);
            });

            gridRowsContainer.addEventListener('dblclick', (e) => {
                const rowElement = e.target.closest('.opengridjs-grid-row');
                if (!rowElement) {
                    return;
                }

                const rowIndex = this.getRowIndexById(rowElement.getAttribute('data-id'));
                if (rowIndex === -1) {
                    return;
                }

                const cell = e.target.closest('.opengridjs-grid-column-item');
                const item = this.gridData[rowIndex].data;
                const field = cell ? cell.getAttribute('data-field') : null;
                this.raiseEvent('rowDoubleClick', rowIndex, item, field);

                if (cell && field) {
                    this.beginEdit(rowIndex, field);
                }
            });

            gridRowsContainer.addEventListener('change', (e) => {
                if (e.target.classList && e.target.classList.contains('opengridjs-cell-checkbox')) {
                    const rowElement = e.target.closest('.opengridjs-grid-row');
                    const rowIndex = rowElement ? this.getRowIndexById(rowElement.getAttribute('data-id')) : -1;
                    const field = e.target.getAttribute('data-field');
                    if (rowIndex > -1 && field) {
                        const header = this.getColumn(field);
                        this.setCellValue(rowIndex, field, e.target.checked ? header.checkValue : header.unCheckValue);
                    }
                }
            });

            gridRowsContainer.addEventListener('contextmenu', (e) => {
                if (!this.useContextMenu) {
                    return;
                }

                const rowElement = e.target.closest('.opengridjs-grid-row');
                if (!rowElement) {
                    return;
                }

                e.preventDefault();
                const rowIndex = this.getRowIndexById(rowElement.getAttribute('data-id'));
                if (rowIndex === -1) {
                    return;
                }

                this.selectRow(rowIndex);
                this.showContextMenu(e, this.gridData[rowIndex].data);
            });

            this.rootElement.setAttribute('tabindex', '0');
            this.rootElement.addEventListener('keydown', (e) => this.handleKeydown(e));

            this.addHeaderActions();
        }

        handleKeydown(e) {
            if (this.editingCell) {
                return;
            }

            const rowIndex = this.getSelectedIndex();
            switch (e.key) {
                case 'ArrowDown':
                    if (rowIndex < this.gridData.length - 1) {
                        e.preventDefault();
                        this.selectRow(rowIndex + 1);
                        this.scrollToRow(rowIndex + 1);
                    }
                    break;
                case 'ArrowUp':
                    if (rowIndex > 0) {
                        e.preventDefault();
                        this.selectRow(rowIndex - 1);
                        this.scrollToRow(rowIndex - 1);
                    }
                    break;
                case 'Enter':
                case 'F2':
                    if (rowIndex > -1 && this.headerData.length > 0) {
                        e.preventDefault();
                        const editableHeader = this.headerData.find((header) => header.editable !== false);
                        if (editableHeader) {
                            this.beginEdit(rowIndex, editableHeader.data);
                        }
                    }
                    break;
                case 'Escape':
                    this.closeContextMenu();
                    break;
            }
        }

        addHeaderActions() {
            const gridHeader = this.rootElement.querySelector('.opengridjs-grid-header');

            gridHeader.addEventListener('click', (e) => {
                if (e.target.classList.contains('opengridjs-filter-button')) {
                    e.stopPropagation();
                    this.toggleFilterMenu(e.target);
                    return;
                }

                const headerItem = e.target.closest('.opengridjs-grid-header-item');
                if (headerItem && headerItem._wasResizing && headerItem._wasResizing()) {
                    return;
                }

                const header = headerItem ? headerItem.getAttribute('data-header') : null;
                const headerData = this.headerData.find((x) => x.data === header);
                if (headerData) {
                    headerData.sortDirection = headerData.sortDirection == null || headerData.sortDirection === 'desc' ? 'asc' : 'desc';
                    this.headerData.forEach((x) => {
                        if (x !== headerData) {
                            x.sortDirection = null;
                        }
                    });

                    this.sortState = {
                        header: header,
                        sortDirection: headerData.sortDirection
                    };

                    const headerElements = Array.from(gridHeader.getElementsByClassName('opengridjs-grid-header-item'));
                    headerElements.forEach((headerElement) => {
                        headerElement.classList.remove('opengridjs-sort-asc', 'opengridjs-sort-desc');
                        if (headerElement.getAttribute('data-header') === header) {
                            headerElement.classList.add(headerData.sortDirection === 'asc' ? 'opengridjs-sort-asc' : 'opengridjs-sort-desc');
                        }
                    });

                    if (Object.keys(this.columnFilters).length > 0) {
                        this.applyAllFilters();
                    }
                    else {
                        this.sortData();
                        this.rerender();
                    }

                    this.closeContextMenu();
                    this.raiseEvent('sortChange', header, headerData.sortDirection);
                }
            });

            gridHeader.addEventListener('contextmenu', (e) => {
                const headerItem = e.target.closest('.opengridjs-grid-header-item');
                if (headerItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const filterButton = headerItem.querySelector('.opengridjs-filter-button');
                    if (filterButton) {
                        this.toggleFilterMenu(filterButton);
                    }
                }
            });
        }

        observeResize() {
            if (typeof ResizeObserver === 'undefined') {
                return;
            }

            const debouncedResize = this.debounce(() => {
                if (this._destroyed) {
                    return;
                }
                this.updateVisibleArea();
                this.autoResizeColumns();
            }, 150);

            this._resizeObserver = new ResizeObserver(debouncedResize);
            this._resizeObserver.observe(this.rootElement);
        }

        getRowIndexById(id) {
            if (id == null) {
                return -1;
            }
            return this.gridData.findIndex((item) => String(item.data.id) === String(id));
        }

        selectRow(rowIndex) {
            const gridItem = this.gridData[rowIndex];
            if (!gridItem) {
                return;
            }

            const previousId = this.selectedRowId;
            if (previousId != null && String(previousId) === String(gridItem.data.id)) {
                return;
            }

            this.selectedRowId = gridItem.data.id;

            if (previousId != null) {
                const previousElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(previousId))}"]`);
                if (previousElement) {
                    previousElement.classList.remove('opengridjs-selected-grid-row');
                }
            }

            const rowElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(gridItem.data.id))}"]`);
            if (rowElement) {
                rowElement.classList.add('opengridjs-selected-grid-row');
            }

            this.raiseEvent('selectionChange', rowIndex, gridItem.data);
        }

        clearSelection() {
            if (this.selectedRowId == null) {
                return;
            }

            const rowElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(this.selectedRowId))}"]`);
            if (rowElement) {
                rowElement.classList.remove('opengridjs-selected-grid-row');
            }

            this.selectedRowId = null;
            this.raiseEvent('selectionChange', -1, null);
        }

        getSelectedIndex() {
            return this.selectedRowId == null ? -1 : this.getRowIndexById(this.selectedRowId);
        }

        getSelectedItem() {
            const rowIndex = this.getSelectedIndex();
            return rowIndex === -1 ? null : this.gridData[rowIndex].data;
        }

        scrollToRow(rowIndex) {
            const gridItem = this.gridData[rowIndex];
            const container = this.rootElement.querySelector('.opengridjs-grid-rows-container');
            if (!gridItem || !container) {
                return;
            }

            const rowTop = gridItem.position;
            const rowBottom = rowTop + (gridItem.height || this.gridRowPxSize);
            if (rowTop < container.scrollTop) {
                container.scrollTop = rowTop;
            }
            else if (rowBottom > container.scrollTop + this.gridRowPxVisibleArea) {
                container.scrollTop = rowBottom - this.gridRowPxVisibleArea;
            }
        }

        beginEdit(rowIndex, field) {
            if (this.editable === false) {
                return;
            }

            const header = this.headerData.find((x) => x.data === field);
            const gridItem = this.gridData[rowIndex];
            if (!header || !gridItem || header.editable === false || header.columnType === 'checkbox') {
                return;
            }

            this.commitEdit();

            const rowElement = this.rootElement.querySelector(`.opengridjs-grid-row[data-id="${this.cssEscape(String(gridItem.data.id))}"]`);
            if (!rowElement) {
                return;
            }

            const cell = rowElement.querySelector(`.opengridjs-grid-column-item[data-field="${this.cssEscape(field)}"]`);
            if (!cell) {
                return;
            }

            const rawValue = this.resolveCellValue(gridItem.data, field);
            let editor;

            if (header.columnType === 'dropdown') {
                editor = document.createElement('select');
                const options = this.getColumnOptions(header);
                options.forEach((option) => {
                    const optionElement = document.createElement('option');
                    if (option && typeof option === 'object') {
                        optionElement.value = option.value;
                        optionElement.textContent = option.text;
                    }
                    else {
                        optionElement.value = option;
                        optionElement.textContent = option;
                    }

                    if (String(optionElement.value) === String(rawValue)) {
                        optionElement.selected = true;
                    }
                    editor.appendChild(optionElement);
                });
            }
            else {
                editor = document.createElement('input');
                editor.type = header.columnType === 'number' ? 'number' : 'text';
                editor.value = rawValue == null ? '' : rawValue;
            }

            editor.className = 'opengridjs-cell-editor';
            cell.innerHTML = '';
            cell.appendChild(editor);

            this.editingCell = { rowIndex, field, header, editor, item: gridItem.data, originalValue: rawValue };

            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.commitEdit();
                    this.rootElement.focus();
                }
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.cancelEdit();
                    this.rootElement.focus();
                }
            });

            editor.addEventListener('blur', () => {
                this.commitEdit();
            });

            editor.focus();
            if (editor.select) {
                editor.select();
            }
        }

        commitEdit() {
            const editing = this.editingCell;
            if (!editing) {
                return;
            }

            this.editingCell = null;

            let newValue = editing.editor.value;
            if (editing.header.columnType === 'number') {
                newValue = newValue === '' ? null : Number(newValue);
                if (newValue != null && isNaN(newValue)) {
                    newValue = editing.originalValue;
                }
            }

            if (newValue !== editing.originalValue) {
                const item = editing.item;
                const oldValue = editing.originalValue;
                item[editing.field] = newValue;
                if (editing.header.columnType === 'dropdown' && editing.header.nameColumnID) {
                    const options = this.getColumnOptions(editing.header);
                    const matched = options.find((option) => {
                        const optionValue = option && typeof option === 'object' ? option.value : option;
                        return String(optionValue) === String(newValue);
                    });
                    if (matched) {
                        item[editing.header.nameColumnID] = matched && typeof matched === 'object' ? matched.text : matched;
                    }
                }
                this.upgradeFlag(item);
                this._rowHeightCache.delete(String(item.id));
                this.raiseEvent('cellEditEnd', editing.rowIndex, editing.field, oldValue, newValue, item);
                if (editing.header.columnType === 'codehelp') {
                    setTimeout(() => {
                        this.raiseEvent('codeHelpClick', editing.rowIndex, editing.field, item, newValue);
                    }, 0);
                }
            }

            this.refreshRowElement(editing.item);
        }

        cancelEdit() {
            const editing = this.editingCell;
            if (!editing) {
                return;
            }

            this.editingCell = null;
            this.refreshRowElement(editing.item);
        }

        sortData() {
            if (!this.sortState.header) {
                return;
            }

            const field = this.sortState.header;
            const direction = this.sortState.sortDirection === 'desc' ? -1 : 1;

            this.gridData.sort((x, y) => {
                const a = this.resolveCellValue(x.data, field);
                const b = this.resolveCellValue(y.data, field);

                if (a == null || a === '') {
                    return (b == null || b === '') ? 0 : -1 * direction;
                }
                if (b == null || b === '') {
                    return 1 * direction;
                }

                const numberA = typeof a === 'number' ? a : (String(a).trim() !== '' && !isNaN(a) ? parseFloat(a) : NaN);
                const numberB = typeof b === 'number' ? b : (String(b).trim() !== '' && !isNaN(b) ? parseFloat(b) : NaN);
                if (!isNaN(numberA) && !isNaN(numberB)) {
                    return (numberA - numberB) * direction;
                }

                return String(a).localeCompare(String(b)) * direction;
            });

            this.gridData.forEach((item) => {
                item.isRendered = false;
            });
        }

        setSorting(field, sortDirection) {
            const header = this.headerData.find((x) => x.data === field);
            if (!header) {
                return;
            }

            this.headerData.forEach((x) => {
                x.sortDirection = null;
            });
            header.sortDirection = sortDirection === 'desc' ? 'desc' : 'asc';
            this.sortState = { header: field, sortDirection: header.sortDirection };
            this.generateGridHeader();
            this.sortData();
            this.rerender();
        }

        clearSorting() {
            this.sortState = { header: null, sortDirection: null };
            this.headerData.forEach((x) => {
                x.sortDirection = null;
            });
            this.generateGridHeader();
            this.rerender();
        }

        searchFilter(term) {
            this.searchTerm = term;
            if (term == null || term === '') {
                this.reset();
                return;
            }

            const lowered = String(term).toLowerCase();
            this.filteredData = this.originalData.filter((row) => {
                return this.headerData.some((header) => {
                    const value = this.resolveCellValue(row, header.data);
                    return value != null && String(value).toLowerCase().includes(lowered);
                });
            });

            this.processData(this.filteredData);
            this.generateGridRows();
            this.raiseEvent('filterChange', 'search', term);
        }

        reset() {
            this.searchTerm = null;
            this.columnFilters = {};
            this.filteredData = null;
            this.processData(this.originalData);
            this.generateGridRows();
            this.updateFilterIndicators();
        }

        toggleFilterMenu(filterButton) {
            const column = filterButton.getAttribute('data-column');
            const existingMenu = this.rootElement.querySelector('.opengridjs-filter-menu');

            if (existingMenu && existingMenu.getAttribute('data-column') === column) {
                existingMenu.remove();
                return;
            }

            if (existingMenu) {
                existingMenu.remove();
            }

            this.showFilterMenu(filterButton, column);
        }

        showFilterMenu(filterButton, column) {
            const uniqueValues = this.getUniqueColumnValues(column);
            const currentFilter = this.columnFilters[column] || new Set(uniqueValues);

            const filterMenu = document.createElement('div');
            filterMenu.className = 'opengridjs-filter-menu';
            filterMenu.setAttribute('data-column', column);

            const headerItem = filterButton.closest('.opengridjs-grid-header-item');
            const headerItemRect = headerItem.getBoundingClientRect();
            const gridRect = this.rootElement.getBoundingClientRect();

            const headerCenter = headerItemRect.left + (headerItemRect.width / 2) - gridRect.left;
            const menuWidth = 250;
            const leftPosition = Math.max(0, headerCenter - (menuWidth / 2));

            filterMenu.style.position = 'absolute';
            filterMenu.style.left = `${leftPosition}px`;
            filterMenu.style.top = `${headerItemRect.bottom - gridRect.top}px`;
            filterMenu.style.zIndex = '1000';

            let menuContent = `
            <div class="opengridjs-filter-menu-header">
                <button class="opengridjs-filter-select-all">${this.escapeHtml(this.messages.selectAll)}</button>
                <button class="opengridjs-filter-clear-all">${this.escapeHtml(this.messages.clearAll)}</button>
            </div>
            <div class="opengridjs-filter-search">
                <input type="text" placeholder="${this.escapeHtml(this.messages.searchPlaceholder)}" class="opengridjs-filter-search-input">
            </div>
            <div class="opengridjs-filter-options">`;

            uniqueValues.forEach((value) => {
                const displayValue = value === null || value === undefined || value === '' ? this.messages.emptyValue : value;
                const isChecked = currentFilter.has(value);
                menuContent += `
                <label class="opengridjs-filter-option">
                    <input type="checkbox" value="${this.escapeHtml(String(value))}" ${isChecked ? 'checked' : ''}>
                    <span>${this.escapeHtml(String(displayValue))}</span>
                </label>`;
            });

            menuContent += `
            </div>
            <div class="opengridjs-filter-menu-footer">
                <button class="opengridjs-filter-apply">${this.escapeHtml(this.messages.apply)}</button>
                <button class="opengridjs-filter-cancel">${this.escapeHtml(this.messages.cancel)}</button>
            </div>`;

            filterMenu.innerHTML = menuContent;
            this.rootElement.querySelector('.opengridjs-grid-additional').appendChild(filterMenu);
            this.attachFilterMenuEvents(filterMenu, column, uniqueValues);

            setTimeout(() => {
                document.addEventListener('click', this.closeFilterMenuOnClickOutside);
            }, 0);
        }

        attachFilterMenuEvents(filterMenu, column, uniqueValues) {
            filterMenu.querySelector('.opengridjs-filter-select-all').addEventListener('click', () => {
                filterMenu.querySelectorAll('.opengridjs-filter-option input').forEach((checkbox) => {
                    checkbox.checked = true;
                });
            });

            filterMenu.querySelector('.opengridjs-filter-clear-all').addEventListener('click', () => {
                filterMenu.querySelectorAll('.opengridjs-filter-option input').forEach((checkbox) => {
                    checkbox.checked = false;
                });
            });

            const searchInput = filterMenu.querySelector('.opengridjs-filter-search-input');
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                filterMenu.querySelectorAll('.opengridjs-filter-option').forEach((option) => {
                    const text = option.querySelector('span').textContent.toLowerCase();
                    option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
                });
            });

            filterMenu.querySelector('.opengridjs-filter-apply').addEventListener('click', () => {
                const selectedValues = new Set();
                filterMenu.querySelectorAll('.opengridjs-filter-option input:checked').forEach((checkbox) => {
                    const originalValue = uniqueValues.find((v) => String(v) === checkbox.value);
                    selectedValues.add(originalValue);
                });

                this.applyColumnFilter(column, selectedValues);
                filterMenu.remove();
                document.removeEventListener('click', this.closeFilterMenuOnClickOutside);
            });

            filterMenu.querySelector('.opengridjs-filter-cancel').addEventListener('click', () => {
                filterMenu.remove();
                document.removeEventListener('click', this.closeFilterMenuOnClickOutside);
            });
        }

        closeFilterMenuOnClickOutside = (e) => {
            const filterMenu = this.rootElement.querySelector('.opengridjs-filter-menu');
            if (filterMenu && e.target && !filterMenu.contains(e.target) &&
                !(e.target.classList && e.target.classList.contains('opengridjs-filter-button'))) {
                filterMenu.remove();
                document.removeEventListener('click', this.closeFilterMenuOnClickOutside);
            }
        };

        getUniqueColumnValues(column) {
            const values = new Set();
            this.originalData.forEach((row) => {
                values.add(this.resolveCellValue(row, column));
            });

            return Array.from(values).sort((a, b) => {
                if (a === null || a === undefined) {
                    return 1;
                }
                if (b === null || b === undefined) {
                    return -1;
                }
                if (typeof a === 'string' && typeof b === 'string') {
                    return a.localeCompare(b);
                }
                return a > b ? 1 : a < b ? -1 : 0;
            });
        }

        applyColumnFilter(column, selectedValues) {
            if (selectedValues.size === this.getUniqueColumnValues(column).length) {
                delete this.columnFilters[column];
            }
            else {
                this.columnFilters[column] = selectedValues;
            }

            this.applyAllFilters();
            this.updateFilterIndicators();
            this.raiseEvent('filterChange', 'column', column);
        }

        applyAllFilters() {
            let filteredData = this.originalData.slice();

            Object.keys(this.columnFilters).forEach((column) => {
                const allowedValues = this.columnFilters[column];
                filteredData = filteredData.filter((row) => allowedValues.has(this.resolveCellValue(row, column)));
            });

            this.filteredData = Object.keys(this.columnFilters).length > 0 ? filteredData : null;
            this.processData(this.filteredData || this.originalData);
            this.generateGridRows();
        }

        updateFilterIndicators() {
            const headerItems = this.rootElement.querySelectorAll('.opengridjs-grid-header-item');
            headerItems.forEach((headerItem) => {
                const column = headerItem.getAttribute('data-header');
                const filterButton = headerItem.querySelector('.opengridjs-filter-button');
                if (filterButton) {
                    if (this.columnFilters[column] && this.columnFilters[column].size > 0) {
                        filterButton.classList.add('opengridjs-filter-active');
                    }
                    else {
                        filterButton.classList.remove('opengridjs-filter-active');
                    }
                }
            });
        }

        clearAllFilters() {
            this.columnFilters = {};
            this.filteredData = null;
            this.searchTerm = null;
            this.processData(this.originalData);
            this.generateGridRows();
            this.updateFilterIndicators();
            this.raiseEvent('filterChange', 'clear', null);
        }

        showContextMenu(e, rowData) {
            this.closeContextMenu();
            this.gridSelectedObject = rowData;

            let options = this.contextMenuItems;
            if (!options) {
                options = [
                    { actionName: this.messages.copyRow, action: (item) => this.copyRow(item) },
                    { actionName: this.messages.exportCsv, action: () => this.exportToCSV() }
                ];
            }

            const title = this.contextMenuTitle || this.messages.contextMenuTitle;
            const gridRect = this.rootElement.getBoundingClientRect();
            const left = `${e.clientX - gridRect.left}px`;
            const top = `${e.clientY - gridRect.top}px`;

            const menu = document.createElement('div');
            menu.className = 'opengridjs-contextMenu';
            menu.style.left = left;
            menu.style.top = top;
            menu.innerHTML = `<div class="opengridjs-title">${this.escapeHtml(title)}</div><hr/>` +
                options.map((option, index) =>
                    `<button class="opengridjs-context-menu-button ${option.className || ''} opengridjs-btn" data-action-index="${index}">${this.escapeHtml(option.actionName)}</button>`
                ).join('') + '<br/>&nbsp;';

            this.rootElement.querySelector('.opengridjs-grid-additional').appendChild(menu);

            menu.querySelectorAll('.opengridjs-context-menu-button').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const option = options[parseInt(event.target.getAttribute('data-action-index'), 10)];
                    if (option) {
                        if (typeof option.action === 'function') {
                            option.action(this.gridSelectedObject, this);
                        }
                        else if (option.actionFunctionName && typeof window[option.actionFunctionName] === 'function') {
                            window[option.actionFunctionName](this.gridSelectedObject);
                        }
                    }
                    this.closeContextMenu();
                });
            });
        }

        closeContextMenu(action) {
            this.rootElement.querySelectorAll('.opengridjs-contextMenu').forEach((item) => item.remove());
            if (action) {
                action(this.gridSelectedObject);
            }
        }

        copyRow(rowData) {
            const formattedData = Object.entries(rowData)
                .filter(([key]) => key !== 'Flag')
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(formattedData).catch(() => {
                    this.fallbackCopyToClipboard(formattedData);
                });
            }
            else {
                this.fallbackCopyToClipboard(formattedData);
            }
        }

        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);

            try {
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
            } catch (error) {
                // 클립보드 복사 실패 무시
            } finally {
                document.body.removeChild(textArea);
            }
        }

        exportToCSV(fileName) {
            const items = this.gridData.map((x) => x.data);
            if (items.length === 0) {
                return;
            }

            const quote = (value) => {
                const str = value == null ? '' : String(value);
                return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
            };

            const headers = this.headerData.map((header) => quote(header.headerName));
            const rows = items.map((row) =>
                this.headerData.map((header) => quote(this.resolveCellValue(row, header.data))).join(','));

            const csv = String.fromCharCode(0xFEFF) + [headers.join(',')].concat(rows).join('\r\n');
            const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const csvUrl = URL.createObjectURL(csvBlob);
            const link = document.createElement('a');
            link.href = csvUrl;
            link.setAttribute('download', fileName || 'export.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(csvUrl);
        }

        isNearBottom(container) {
            const result = container.scrollHeight <= container.scrollTop + this.gridRowPxVisibleArea + 4;
            if (result && !this.loadedAtGridHeight.includes(container.scrollTop)) {
                this.loadedAtGridHeight.push(container.scrollTop);
                return true;
            }
            return false;
        }

        stopLoadingMoreData() {
            this.canLoadMoreData = false;
        }

        destroy() {
            this._destroyed = true;
            document.removeEventListener('click', this.closeFilterMenuOnClickOutside);
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            this.rootElement.gridInstance = null;
            this.rootElement.innerHTML = '';
            this.rootElement.classList.remove('opengridjs-grid', 'opengridjs-grid-container', 'opengridjs-dynamic-row-height');
        }
    }

    if (!window.OpenGrid) {
        window.OpenGrid = OpenGrid;
    }

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $opengrid = syn.uicontrols.$opengrid || new syn.module();

    $opengrid.extend({
        name: 'syn.uicontrols.$opengrid',
        version: 'v2026.7.5',
        gridControls: [],
        codeHelpUrl: `${syn.$w.proxyBasePath}/assets/shared/codehelp/index2.html`,
        eventHooks: ['rowClick', 'rowDoubleClick', 'selectionChange', 'cellEditEnd', 'sortChange', 'filterChange', 'dataChange'],
        defaultSetting: {
            width: '100%',
            height: '360px',
            columns: null,
            editable: true,
            rowHeight: 35,
            dynamicRowHeight: false,
            selectionMode: 'single',
            contextMenu: true,
            contextMenuTitle: null,
            contextMenuOptions: null,
            exportFileName: null,
            loadMoreDataFunction: null,
            messages: null,
            dataType: 'list',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        // columns 축약 정의: [columnID, columnText, width, isHidden, columnType, readOnly, alignConstants, belongID, options, children]
        getInitializeColumns(elID, columns, editable) {
            var result = [];
            if ($object.isNullOrUndefined(columns) == true) {
                return result;
            }

            var mod = window[syn.$w.pageScript];
            if (mod) {
                mod.config = mod.config || {};
                mod.config.dataSource = mod.config.dataSource || {};
            }

            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                if ($object.isArray(column) == true) {
                    var columnID = column[0];
                    var columnText = column[1];
                    var width = column[2];
                    var isHidden = column[3];
                    var columnType = column[4] || 'text';
                    var readOnly = column[5];
                    var alignConstants = column[6];
                    var belongID = column[7];
                    var options = column[8];
                    var children = column[9];
                    var mappedType = columnType == 'numeric' ? 'number' : columnType;
                    if (['text', 'number', 'checkbox', 'dropdown', 'codehelp'].indexOf(mappedType) == -1) {
                        mappedType = 'text';
                    }

                    var columnInfo = {
                        elID: elID,
                        field: columnID,
                        dataField: columnID,
                        headerText: $object.isNullOrUndefined(columnText) == true ? columnID : columnText,
                        width: width || null,
                        editable: $string.toBoolean(editable) == false ? false : !$string.toBoolean(readOnly),
                        columnType: mappedType,
                        hidden: $string.toBoolean(isHidden),
                        isHidden: $string.toBoolean(isHidden),
                        align: alignConstants || null,
                        belongID: $object.isNullOrUndefined(belongID) == true ? '' : ($object.isArray(belongID) == true ? belongID.join(',') : belongID)
                    };

                    if (options && $object.isObject(options) == true) {
                        for (var option in options) {
                            columnInfo[option] = options[option];
                        }
                    }

                    if (mappedType == 'checkbox') {
                        columnInfo.checkValue = $string.isNullOrEmpty(columnInfo.checkValue) == true ? '1' : columnInfo.checkValue;
                        columnInfo.unCheckValue = $string.isNullOrEmpty(columnInfo.unCheckValue) == true ? '0' : columnInfo.unCheckValue;
                    }
                    else if (mappedType == 'dropdown') {
                        columnInfo.storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                        columnInfo.keyField = columnInfo.keyField || 'CodeID';
                        columnInfo.valueField = columnInfo.valueField || 'CodeValue';
                        if (mod && columnInfo.storeSourceID) {
                            if ($object.isNullOrUndefined(mod.config.dataSource[columnInfo.storeSourceID]) == true) {
                                mod.config.dataSource[columnInfo.storeSourceID] = {
                                    CodeColumnID: columnInfo.keyField,
                                    ValueColumnID: columnInfo.valueField,
                                    DataSource: []
                                };
                                syn.$w.addReadyCount();
                                $opengrid.dataRefresh(elID, columnInfo);
                            }

                            columnInfo.optionsProvider = function () {
                                var storeSourceID = this.storeSourceID || this.dataSourceID;
                                var keyField = this.keyField || 'CodeID';
                                var valueField = this.valueField || 'CodeValue';
                                var store = mod.config && mod.config.dataSource ? mod.config.dataSource[storeSourceID] : null;
                                var dataSource = store && store.DataSource ? store.DataSource : [];
                                return dataSource.map(function (item) {
                                    return {
                                        value: item[keyField],
                                        text: item[valueField]
                                    };
                                });
                            };
                        }
                    }
                    else if (mappedType == 'codehelp') {
                        columnInfo.dataSource = columnInfo.dataSource || null;
                        columnInfo.dataSourceID = columnInfo.dataSourceID || '';
                        columnInfo.storeSourceID = columnInfo.storeSourceID || columnInfo.dataSourceID;
                        columnInfo.local = $object.isNullOrUndefined(columnInfo.local) == true ? true : columnInfo.local;
                        columnInfo.controlText = columnInfo.controlText || '';
                        columnInfo.codeColumnID = columnInfo.codeColumnID || columnID;
                        columnInfo.textColumnID = columnInfo.textColumnID || columnID;
                        columnInfo.parameters = columnInfo.parameters || '';
                    }

                    if ($object.isNullOrUndefined(children) == false && syn.$l && syn.$l.eventLog) {
                        syn.$l.eventLog('$opengrid.getInitializeColumns', 'OpenGrid는 children 컬럼을 지원하지 않아 무시합니다. columnID: ' + columnID, 'Warning');
                    }

                    result.push(columnInfo);
                }
                else {
                    result.push(column);
                }
            }

            return result;
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);
            if ($object.isNullOrUndefined(el) == true) {
                return;
            }

            setting = syn.$w.argumentsExtend($opengrid.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.width = el.style.width || setting.width || '100%';
            if ($object.isNumber(setting.width) == true) {
                setting.width = setting.width + 'px';
            }

            setting.height = el.style.height || setting.height || '360px';
            if ($object.isNumber(setting.height) == true) {
                setting.height = setting.height + 'px';
            }

            var columns = $opengrid.getInitializeColumns(elID, setting.columns, setting.editable);

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify($opengrid.toSerializableSetting(setting)));
            el.style.display = 'none';

            var className = el.getAttribute('class') || '';
            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = `<div id="${elID}" class="syn-opengrid ${className}" style="width:${setting.width};height:${setting.height};"></div>`;
            parent.appendChild(wrapper);

            var gridSetup = {
                columns: columns,
                data: setting.data || [],
                rowHeight: setting.rowHeight,
                dynamicRowHeight: setting.dynamicRowHeight,
                editable: setting.editable,
                selectionMode: setting.selectionMode,
                contextMenu: setting.contextMenu,
                contextMenuTitle: setting.contextMenuTitle,
                contextMenuOptions: setting.contextMenuOptions,
                loadMoreDataFunction: setting.loadMoreDataFunction,
                messages: setting.messages,
                onCodeHelpClick: function (rowIndex, dataField, item, searchText) {
                    return $opengrid.showCodeHelpPopup(elID, rowIndex, dataField, item, searchText);
                }
            };

            var gridHookEvents = el.getAttribute('syn-events') || [];
            try {
                if (gridHookEvents) {
                    gridHookEvents = eval(gridHookEvents);
                }
            } catch (error) {
                gridHookEvents = [];
                syn.$l.eventLog('OpenGrid_controlLoad', error.toString(), 'Debug');
            }

            if (mod && gridHookEvents && gridHookEvents.length > 0) {
                for (var i = 0; i < $opengrid.eventHooks.length; i++) {
                    (function (hook) {
                        if (gridHookEvents.indexOf(hook) > -1) {
                            var eventHandler = mod.event ? mod.event['{0}_{1}'.format(elID, hook)] : null;
                            if (eventHandler) {
                                gridSetup['on' + hook.charAt(0).toUpperCase() + hook.slice(1)] = function () {
                                    var args = [elID].concat(Array.prototype.slice.call(arguments));
                                    return eventHandler.apply(syn.$l.get(elID), args);
                                };
                            }
                        }
                    })($opengrid.eventHooks[i]);
                }
            }

            var gridElement = syn.$l.get(elID);
            var grid = new OpenGrid(gridElement, gridSetup);

            $opengrid.gridControls.push({
                id: elID,
                grid: grid,
                setting: setting
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        toSerializableSetting(setting) {
            var result = {};
            for (var name in setting) {
                if (typeof setting[name] !== 'function' && name !== 'data') {
                    result[name] = setting[name];
                }
            }
            return result;
        },

        getControl(elID) {
            var result = null;
            var length = $opengrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var item = $opengrid.gridControls[i];
                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        getGridControl(elID) {
            var control = $opengrid.getControl(elID);
            return control ? control.grid : null;
        },

        getGridSetting(elID) {
            var control = $opengrid.getControl(elID);
            return control ? control.setting : null;
        },

        getGridID(elID) {
            elID = (elID || '').replace('_hidden', '');
            return $opengrid.getGridControl(elID) ? elID : null;
        },

        _getColumnField(elID, dataField) {
            if ($object.isNumber(dataField) == true) {
                return $opengrid.colToProp(elID, dataField);
            }
            return dataField;
        },

        _getDataItems(elID, total) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return [];
            }
            return $string.toBoolean(total) == true ? grid.getData() : grid.getViewData();
        },

        _getControlState(elID) {
            var control = $opengrid.getControl(elID);
            if (!control) {
                return null;
            }
            control.state = control.state || {
                properties: {},
                footer: null,
                fixedColumnCount: 0,
                fixedRowCount: 0,
                cellMerge: false,
                selectedColumnIndex: 0,
                filters: {}
            };
            return control.state;
        },

        _applyCompatFilters(elID) {
            var grid = $opengrid.getGridControl(elID);
            var state = $opengrid._getControlState(elID);
            if (!grid || !state) {
                return;
            }

            var filterNames = Object.keys(state.filters || {});
            if (filterNames.length == 0) {
                grid.filteredData = null;
            }
            else {
                grid.filteredData = grid.originalData.filter(function (item) {
                    for (var i = 0; i < filterNames.length; i++) {
                        var dataField = filterNames[i];
                        var filter = state.filters[dataField];
                        var value = item[dataField];
                        if (typeof filter == 'function' && filter(dataField, value, item) !== true) {
                            return false;
                        }
                    }
                    return true;
                });
            }

            grid.processData(grid.filteredData || grid.originalData);
            grid.rerender();
        },

        dataRefresh(elID, setting, callback) {
            var defaultSetting = {
                dataField: null,
                required: true,
                emptyText: '전체',
                local: true,
                sharedAssetUrl: '',
                dataSourceID: null,
                storeSourceID: null,
                dataSource: null,
                parameters: null,
                deleteCache: false,
                selectedValue: null
            };

            setting = setting || {};
            setting.elID = elID;
            setting.dataField = setting.dataField || setting.field;
            setting.storeSourceID = setting.storeSourceID || setting.dataSourceID;
            setting = syn.$w.argumentsExtend(defaultSetting, setting);
            setting.sharedAssetUrl = setting.sharedAssetUrl || syn.Config.SharedAssetUrl;

            if (!(setting.dataField && setting.storeSourceID)) {
                return;
            }

            var mod = window[syn.$w.pageScript];
            if (!mod) {
                return;
            }

            mod.config = mod.config || {};
            mod.config.dataSource = mod.config.dataSource || {};

            if (mod.config.dataSource[setting.storeSourceID] && $string.toBoolean(setting.deleteCache) == true) {
                delete mod.config.dataSource[setting.storeSourceID];
            }

            if (mod.hook && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            var refreshGrid = function () {
                var grid = $opengrid.getGridControl(elID);
                if (grid) {
                    grid.rerender();
                }
            };

            var dataSource = mod.config.dataSource[setting.storeSourceID];
            if (dataSource && dataSource.DataSource && dataSource.DataSource.length > 0) {
                if (callback) {
                    callback();
                }
                refreshGrid();
                syn.$w.removeReadyCount();
                return;
            }

            if (setting.local == true) {
                syn.$w.loadJson(setting.sharedAssetUrl + 'code/{0}.json'.format(setting.storeSourceID), setting, function (setting, json) {
                    if (json) {
                        if (setting.required == false) {
                            var empty = {};
                            empty[json.CodeColumnID] = '';
                            empty[json.ValueColumnID] = setting.emptyText || '';
                            json.DataSource.unshift(empty);
                        }

                        mod.config.dataSource[setting.storeSourceID] = json;
                        if (callback) {
                            callback();
                        }
                        refreshGrid();
                    }
                    syn.$w.removeReadyCount();
                }, false);
            }
            else {
                syn.$w.getDataSource(setting.dataSourceID, setting.parameters, function (json) {
                    if (json) {
                        if (setting.required == false) {
                            var empty = {};
                            empty[json.CodeColumnID] = '';
                            empty[json.ValueColumnID] = setting.emptyText || '';
                            json.DataSource.unshift(empty);
                        }

                        mod.config.dataSource[setting.storeSourceID] = json;
                        if (callback) {
                            callback();
                        }
                        refreshGrid();
                    }
                    syn.$w.removeReadyCount();
                });
            }
        },

        showCodeHelpPopup(elID, rowIndex, dataField, item, searchText) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            var columnInfo = grid.getColumn(dataField);
            if (!columnInfo || columnInfo.columnType != 'codehelp') {
                return;
            }

            var isAllowEdit = grid.editable !== false && columnInfo.editable !== false;
            var mod = window[syn.$w.pageScript];
            var eventHandler = isAllowEdit == true && mod && mod.event ? mod.event['{0}_{1}'.format(elID, 'cellEditBegin')] : null;
            var columnIndex = $opengrid.propToCol(elID, dataField);
            if (eventHandler) {
                var value = eventHandler({
                    elID: elID,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex,
                    dataField: dataField,
                    item: item,
                    value: item ? item[dataField] : null,
                    text: searchText
                });
                isAllowEdit = $string.toBoolean(value);
            }

            if (isAllowEdit != true || !mod) {
                return;
            }

            var synOptions = syn.$w.argumentsExtend(syn.uicontrols.$codepicker.defaultSetting, columnInfo);
            var codeButtonHandler = mod.event ? mod.event['{0}_codeButtonClick'.format(elID)] : null;
            if (codeButtonHandler) {
                var codeOptions = codeButtonHandler(elID, rowIndex, columnIndex, dataField, item);
                if ($object.isObject(codeOptions) == true) {
                    synOptions = syn.$w.argumentsExtend(synOptions, codeOptions);
                }
                else if ($string.toBoolean(codeOptions) == false) {
                    return;
                }
            }

            synOptions.elID = elID;
            synOptions.viewType = 'opengrid';
            synOptions.url = $opengrid.codeHelpUrl || '';
            synOptions.searchText = searchText || (item ? item[dataField] : '') || '';
            syn.uicontrols.$codepicker.find(synOptions, function (result) {
                var changeHandler = mod.event ? mod.event['{0}_codeChange'.format(elID)] : null;
                if (changeHandler) {
                    changeHandler(elID, rowIndex, columnIndex, dataField, result);
                }

                var returnHandler = mod.hook ? mod.hook.frameEvent : null;
                if (returnHandler) {
                    returnHandler.call(this, 'codeReturn', {
                        elID: elID,
                        row: rowIndex,
                        col: columnIndex,
                        columnName: dataField,
                        result: result
                    });
                }
            });
        },

        getGridData(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            var result = grid.getData().map(function (item) {
                var clone = $object.clone(item);
                if ($object.isNullOrUndefined(clone.Flag) == true) {
                    clone.Flag = '';
                }
                return clone;
            });

            return result.concat(grid.getRemovedItems());
        },

        getUpdateItems(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getUpdateItems() : [];
        },

        isUpdateData(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.isUpdateData() : false;
        },

        checkEditValue(elID) {
            return $opengrid.isUpdateData(elID);
        },

        resetUpdatedItems(elID, flag) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if (flag == null || flag == 'a') {
                    flag = 'R';
                }
                grid.resetUpdatedItems(flag);
            }
        },

        insertRow(elID, values, options) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            if ($object.isObject(values) == true && (values.values || values.amount || values.index || values.rowIndex)) {
                var setting = syn.$w.argumentsExtend({
                    values: {},
                    index: null,
                    rowIndex: null,
                    amount: 1
                }, values);
                var inserted = null;
                var insertIndex = setting.index != null ? setting.index : setting.rowIndex;
                if (insertIndex == 'last') {
                    insertIndex = null;
                }
                for (var i = 0; i < setting.amount; i++) {
                    inserted = grid.insertRow(setting.values, { index: insertIndex == null ? undefined : insertIndex + i });
                }
                if (typeof options == 'function') {
                    options(grid.getSelectedIndex(), setting);
                }
                return inserted;
            }

            return grid.insertRow(values, options);
        },

        removeRow(elID, dataField, rowIndex, callback) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            var rowRef = rowIndex;
            if (arguments.length <= 2) {
                rowRef = dataField;
            }
            if ($string.isNullOrEmpty(rowRef) == true) {
                rowRef = grid.getSelectedIndex();
            }

            var removed = grid.removeRow(rowRef);
            var nextIndex = Math.min(rowRef > -1 ? rowRef : grid.getSelectedIndex(), grid.gridData.length - 1);
            if (nextIndex > -1) {
                grid.selectRow(nextIndex);
            }
            if (typeof callback == 'function') {
                callback(nextIndex, $opengrid.propToCol(elID, dataField));
            }
            return removed;
        },

        updateRow(elID, values, rowRef) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.updateRow(values, rowRef) : null;
        },

        appendData(elID, newData) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.appendData(newData);
            }
        },

        updateRecordData(elID, newData, options) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.updateRecordData(newData, options);
            }
        },

        countRows(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getViewData().length : 0;
        },

        getFlag(elID, rowRef) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getFlag(rowRef) : null;
        },

        setFlag(elID, rowRef, flag) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setFlag(rowRef, flag);
            }
        },

        getCellValue(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }

            if ($object.isNumber(dataField) == true) {
                dataField = $opengrid.colToProp(elID, dataField);
            }

            return grid.getCellValue(rowIndex, dataField);
        },

        getDataAtCell(elID, rowIndex, dataField) {
            return $opengrid.getCellValue(elID, rowIndex, dataField);
        },

        setCellValue(elID, rowIndex, dataField, value) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($object.isNumber(dataField) == true) {
                    dataField = $opengrid.colToProp(elID, dataField);
                }
                grid.setCellValue(rowIndex, dataField, value);
            }
        },

        setDataAtCell(elID, rowIndex, dataField, value) {
            $opengrid.setCellValue(elID, rowIndex, dataField, value);
        },

        getColumnValues(elID, dataField, total) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return [];
            }

            dataField = $opengrid._getColumnField(elID, dataField);
            return $opengrid._getDataItems(elID, total).map(function (item) {
                return item[dataField];
            });
        },

        propToCol(elID, dataField) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getColumnIndex(dataField) : -1;
        },

        colToProp(elID, colIndex) {
            var grid = $opengrid.getGridControl(elID);
            if (grid && grid.headerData[colIndex]) {
                return grid.headerData[colIndex].field;
            }
            return null;
        },

        getSelectedIndex(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getSelectedIndex() : -1;
        },

        getActiveRowIndex(elID) {
            return $opengrid.getSelectedIndex(elID);
        },

        getSelectedItem(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.getSelectedItem() : null;
        },

        selectRow(elID, rowIndex) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.selectRow(rowIndex);
                grid.scrollToRow(rowIndex);
            }
        },

        setRowPosition(elID, rowIndex) {
            $opengrid.selectRow(elID, rowIndex);
        },

        clearSelection(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.clearSelection();
            }
        },

        setSorting(elID, dataField, sortDirection) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($object.isArray(dataField) == true && dataField.length > 0) {
                    var sortInfo = dataField[0];
                    grid.setSorting(sortInfo.dataField || sortInfo.field, sortInfo.sortType == -1 || sortInfo.sortDirection == 'desc' ? 'desc' : 'asc');
                }
                else {
                    grid.setSorting($opengrid._getColumnField(elID, dataField), sortDirection);
                }
            }
        },

        clearSorting(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.clearSorting();
            }
        },

        searchAll(elID, term) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.searchFilter(term);
            }
        },

        clearFilter(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.clearAllFilters();
            }
        },

        visibleColumns(elID, columns, isShow) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($object.isArray(columns) == false) {
                    columns = [columns];
                }

                for (var i = 0; i < columns.length; i++) {
                    var dataField = $opengrid._getColumnField(elID, columns[i]);
                    grid.setColumnVisible(dataField, $string.toBoolean(isShow));
                }
            }
        },

        isColumnHidden(elID, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                var column = grid.getColumn(dataField);
                return column ? column.hidden === true : false;
            }
            return false;
        },

        getColumnInfoList(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.allColumns : [];
        },

        setControlSize(elID, size) {
            var el = syn.$l.get(elID);
            if (el) {
                size = size || {};
                if (size.width) {
                    el.style.width = $object.isNumber(size.width) == true ? size.width + 'px' : size.width;
                }

                if (size.height) {
                    el.style.height = $object.isNumber(size.height) == true ? size.height + 'px' : size.height;
                }

                var grid = $opengrid.getGridControl(elID);
                if (grid) {
                    setTimeout(function () {
                        grid.updateVisibleArea();
                        grid.updateColumnWidths();
                        grid.rerender();
                    }, 50);
                }
            }
        },

        exportFile(elID, options) {
            options = options || {};
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                var setting = $opengrid.getGridSetting(elID);
                grid.exportToCSV(options.fileName || (setting && setting.exportFileName) || elID + '.csv');
            }
        },

        hideContextMenu() {
            var length = $opengrid.gridControls.length;
            for (var i = 0; i < length; i++) {
                var grid = $opengrid.gridControls[i].grid;
                if (grid && grid.closeContextMenu) {
                    grid.closeContextMenu();
                }
            }
        },

        contextEventHandler(evt) {
            $opengrid.hideContextMenu();
        },

        headerMenuSelectHandler(evt, ui) {
            $opengrid.hideContextMenu();
        },

        getProperty(elID, name) {
            var grid = $opengrid.getGridControl(elID);
            var setting = $opengrid.getGridSetting(elID);
            var state = $opengrid._getControlState(elID);
            if (!grid) {
                return null;
            }
            if (name in grid) {
                return grid[name];
            }
            if (setting && name in setting) {
                return setting[name];
            }
            return state && state.properties ? state.properties[name] : null;
        },

        setColumnProperty(elID, dataField, value) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            dataField = $opengrid._getColumnField(elID, dataField);
            var column = grid.getColumn(dataField);
            if (column && value) {
                Object.assign(column, value);
                if (value.headerText || value.headerName || value.columnText) {
                    column.headerName = value.headerText || value.headerName || value.columnText;
                }
                if (value.width) {
                    column.configWidth = value.width;
                    column.width = $object.isNumber(value.width) == true ? `width:${value.width}px` : `min-width:${value.width}`;
                }
                grid.refreshVisibleColumns();
                grid.generateGridHeader();
                grid.rerender();
            }
        },

        setProperty(elID, name, value) {
            var grid = $opengrid.getGridControl(elID);
            var state = $opengrid._getControlState(elID);
            if (!grid || !state) {
                return;
            }

            state.properties[name] = value;
            if (name == 'editable') {
                grid.editable = $string.toBoolean(value);
            }
            else if (name == 'rowHeight') {
                grid.gridRowPxSize = Number(value) || grid.gridRowPxSize;
                grid.invalidateRowHeightCache();
            }
            grid.rerender();
        },

        setFooter(elID, footerLayout, isChangeFooter) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.footer = footerLayout || null;
            }
        },

        search(elID, dataField, term, options) {
            dataField = $opengrid._getColumnField(elID, dataField);
            $opengrid.removeCondition(elID, dataField);
            if ($string.isNullOrEmpty(term) == true) {
                return;
            }
            $opengrid.setFilter(elID, dataField, function (field, value) {
                return String(value == null ? '' : value).toLowerCase().indexOf(String(term).toLowerCase()) > -1;
            });
        },

        getColumnWidth(elID, dataField) {
            var column = $opengrid.getColumnInfo(elID, dataField);
            return column ? (column.configWidth || column.width || null) : null;
        },

        getColumnWidths(elID, isKeyValue) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            return columns.map(function (column) {
                var width = column.configWidth || column.width || null;
                return $string.toBoolean(isKeyValue) == true ? { dataField: column.dataField || column.field, width: width } : width;
            });
        },

        setColumnWidth(elID, dataField, width) {
            var item = {};
            item.width = width;
            $opengrid.setColumnProperty(elID, dataField, item);
        },

        setColumnWidths(elID, columnWidths) {
            if ($object.isArray(columnWidths) == false) {
                return;
            }

            for (var i = 0; i < columnWidths.length; i++) {
                var item = columnWidths[i];
                if ($object.isObject(item) == true) {
                    $opengrid.setColumnWidth(elID, item.dataField || item.field, item.width);
                }
                else {
                    $opengrid.setColumnWidth(elID, i, item);
                }
            }
        },

        getColumnSize(elID, dataField) {
            return $opengrid.propToCol(elID, dataField);
        },

        setFitColumnSize(elID, maxWidth, fitToGrid) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.autoResizeColumns();
                if (maxWidth) {
                    grid.allColumns.forEach(function (column) {
                        var width = parseInt(column.width ? String(column.width).replace(/[^0-9]/g, '') : '0', 10);
                        if (width > maxWidth) {
                            column.configWidth = maxWidth;
                            column.width = `width:${maxWidth}px`;
                        }
                    });
                    grid.updateColumnWidths();
                }
            }
        },

        setCellMerge(elID, isMerged) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.cellMerge = $string.toBoolean(isMerged);
            }
        },

        setFixedColumnCount(elID, fixedCount) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.fixedColumnCount = Math.max(0, Number(fixedCount) || 0);
            }
        },

        setFixedRowCount(elID, fixedCount) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.fixedRowCount = Math.max(0, Number(fixedCount) || 0);
            }
        },

        getActiveColIndex(elID) {
            var state = $opengrid._getControlState(elID);
            return state ? (state.selectedColumnIndex || 0) : -1;
        },

        selectCell(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            var state = $opengrid._getControlState(elID);
            if (grid) {
                dataField = $opengrid._getColumnField(elID, dataField);
                if (state) {
                    state.selectedColumnIndex = $opengrid.propToCol(elID, dataField);
                }
                grid.selectRow(Number(rowIndex));
                grid.scrollToRow(Number(rowIndex));
            }
        },

        setFilter(elID, dataField, func) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var state = $opengrid._getControlState(elID);
            if (state && $string.isNullOrEmpty(dataField) == false && typeof func == 'function') {
                state.filters[dataField] = func;
                $opengrid._applyCompatFilters(elID);
            }
        },

        addFilterCache(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var state = $opengrid._getControlState(elID);
            if (state && $string.isNullOrEmpty(dataField) == false) {
                state.filters[dataField] = function (field, cellValue) {
                    return cellValue == value;
                };
                $opengrid._applyCompatFilters(elID);
            }
        },

        addCondition(elID, dataField, name, args, args2) {
            dataField = $opengrid._getColumnField(elID, dataField);
            if ($string.isNullOrEmpty(dataField) == true) {
                return;
            }

            $opengrid.setFilter(elID, dataField, function (field, value) {
                var result = false;
                if ($string.isNullOrEmpty(value) == false) {
                    switch (name) {
                        case 'begins_with':
                            result = String(value).startsWith(args);
                            break;
                        case 'between':
                            result = (args <= value && value <= args2);
                            break;
                        case 'ends_with':
                            result = String(value).endsWith(args);
                            break;
                        case 'contains':
                            result = String(value).indexOf(args) > -1;
                            break;
                        case 'by_value':
                        case 'eq':
                            result = value == args;
                            break;
                        case 'not_contains':
                            result = String(value).indexOf(args) == -1;
                            break;
                        case 'neq':
                            result = value != args;
                            break;
                        case 'gt':
                            result = value > args;
                            break;
                        case 'gte':
                            result = value >= args;
                            break;
                        case 'lt':
                            result = value < args;
                            break;
                        case 'lte':
                            result = value <= args;
                            break;
                        case 'not_between':
                            result = !(args <= value && value <= args2);
                            break;
                        case 'not_empty':
                            result = $string.isNullOrEmpty(value) == false;
                            break;
                        default:
                            result = value == args;
                            break;
                    }
                }
                else {
                    result = name == 'empty';
                }
                return result;
            });
        },

        removeCondition(elID, dataField) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var state = $opengrid._getControlState(elID);
            if (state && state.filters) {
                delete state.filters[dataField];
                $opengrid._applyCompatFilters(elID);
            }
        },

        clearConditions(elID) {
            var state = $opengrid._getControlState(elID);
            var grid = $opengrid.getGridControl(elID);
            if (state) {
                state.filters = {};
            }
            if (grid) {
                grid.clearAllFilters();
            }
        },

        render(elID) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.rerender();
            }
        },

        removeRowByRowId(elID, rowIDs) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }
            if ($object.isArray(rowIDs) == false) {
                rowIDs = [rowIDs];
            }
            for (var i = 0; i < rowIDs.length; i++) {
                var index = grid.getRowIndexById(rowIDs[i]);
                if (index > -1) {
                    grid.removeRow(index);
                }
            }
        },

        countCols(elID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.headerData.length : 0;
        },

        getFirstShowColIndex(elID) {
            return $opengrid.countCols(elID) > 0 ? 0 : -1;
        },

        getLastShowColIndex(elID) {
            var count = $opengrid.countCols(elID);
            return count > 0 ? count - 1 : -1;
        },

        getSelected(elID) {
            var rowIndex = $opengrid.getSelectedIndex(elID);
            var item = $opengrid.getSelectedItem(elID);
            if (!item || rowIndex < 0) {
                return [];
            }
            return [{
                rowIndex: rowIndex,
                columnIndex: $opengrid.getActiveColIndex(elID),
                item: item
            }];
        },

        getMergeItems(elID, rowIndex, dataField) {
            var item = $opengrid.getItemByRowIndex(elID, rowIndex);
            return item ? [item] : [];
        },

        getRangeSelected(elID, rowID, colID) {
            var data = $opengrid.getSelected(elID);
            return $opengrid.getRangeIndices(data, rowID || 'rowIndex', colID || 'columnIndex');
        },

        getRangeIndices(data, rowID, colID) {
            if (!data || data.length === 0) {
                return null;
            }

            rowID = rowID || 'rowIndex';
            colID = colID || 'columnIndex';

            return data.reduce(function (range, cell, index) {
                if (index === 0) {
                    return {
                        startRowIndex: cell[rowID],
                        endRowIndex: cell[rowID],
                        startColIndex: cell[colID],
                        endColIndex: cell[colID]
                    };
                }

                return {
                    startRowIndex: Math.min(range.startRowIndex, cell[rowID]),
                    endRowIndex: Math.max(range.endRowIndex, cell[rowID]),
                    startColIndex: Math.min(range.startColIndex, cell[colID]),
                    endColIndex: Math.max(range.endColIndex, cell[colID])
                };
            }, {});
        },

        hasMerge(elID, startRowIndex, startDataField, endRowIndex, endDataField) {
            return false;
        },

        getRowPosition(elID) {
            return $opengrid.getSelectedIndex(elID);
        },

        setColumnPosition(elID, dataField) {
            var state = $opengrid._getControlState(elID);
            if (state) {
                state.selectedColumnIndex = $opengrid.propToCol(elID, dataField);
            }
        },

        isCreated(elID) {
            return !!$opengrid.getGridControl(elID);
        },

        getPhysicalColText(elID, columnText) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].headerName == columnText || columns[i].headerText == columnText) {
                    return i;
                }
            }
            return -1;
        },

        unHiddenColumns(elID) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            for (var i = 0; i < columns.length; i++) {
                columns[i].hidden = false;
            }
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.refreshVisibleColumns();
                grid.generateGridHeader();
                grid.rerender();
            }
        },

        exportToObject(elID, keyValueMode) {
            var rows = $opengrid.getGridData(elID) || [];
            return $string.toBoolean(keyValueMode) == false ? rows.map(function (item) {
                return Object.keys(item).map(function (key) {
                    return item[key];
                });
            }) : rows;
        },

        exportAsString(elID, options) {
            options = syn.$w.argumentsExtend({
                type: 'json',
                callback: null
            }, options || {});

            var rows = $opengrid.getGridData(elID) || [];
            var result = '';
            if (options.type == 'csv' || options.type == 'txt') {
                var columns = $opengrid.getColumnInfoList(elID) || [];
                var fields = columns.map(function (column) { return column.dataField || column.field; });
                result = fields.join(',') + '\n' + rows.map(function (row) {
                    return fields.map(function (field) {
                        var value = row[field] == null ? '' : String(row[field]).replace(/"/g, '""');
                        return '"' + value + '"';
                    }).join(',');
                }).join('\n');
            }
            else {
                result = JSON.stringify(rows);
            }

            if (typeof options.callback == 'function') {
                options.callback(result);
            }
            return result;
        },

        importFile(elID, callback) {
            var fileEL = syn.$l.get('{0}_ImportFile'.format(elID));
            if (!fileEL) {
                fileEL = document.createElement('input');
                fileEL.type = 'file';
                fileEL.id = '{0}_ImportFile'.format(elID);
                fileEL.style.display = 'none';
                fileEL.addEventListener('change', $opengrid.importFileLoad);
                document.body.appendChild(fileEL);
            }
            fileEL.callback = callback;
            fileEL.click();
        },

        importFileLoad(evt) {
            var el = evt.srcElement || evt.target;
            if (!el || !el.files || el.files.length == 0) {
                return;
            }

            var elID = el.id.split('_')[0];
            var fileName = el.files[0].name;
            var fileExtension = fileName.substring(fileName.lastIndexOf('.') == -1 ? fileName.length : fileName.lastIndexOf('.')).toLowerCase();
            var reader = new FileReader();
            reader.onload = function (file) {
                var result = [];
                var data = file.target.result;
                if (fileExtension == '.csv' || fileExtension == '.txt') {
                    var lines = data.split(/\r\n|\n/).filter(function (line) { return line !== ''; });
                    if (lines.length > 0) {
                        var headers = lines[0].split(',').map(function (value) { return value.replace(/^"|"$/g, ''); });
                        for (var i = 1; i < lines.length; i++) {
                            var values = lines[i].split(',');
                            var row = {};
                            for (var j = 0; j < headers.length; j++) {
                                row[headers[j]] = (values[j] || '').replace(/^"|"$/g, '').replace(/""/g, '"');
                            }
                            result.push(row);
                        }
                    }
                }
                else if (window.XLSX) {
                    var workbook = XLSX.read(data, { type: 'binary' });
                    var sheet = workbook.Sheets[workbook.SheetNames[0]];
                    result = XLSX.utils.sheet_to_json(sheet);
                }

                $opengrid.setValue(elID, result);
                if (el.callback) {
                    el.callback(result, fileName);
                }
                el.value = '';
            };

            if (fileExtension == '.csv' || fileExtension == '.txt') {
                reader.readAsText(el.files[0]);
            }
            else {
                reader.readAsBinaryString(el.files[0]);
            }
        },

        getColumnInfo(elID, dataField) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return null;
            }
            dataField = $opengrid._getColumnField(elID, dataField);
            return grid.getColumn(dataField);
        },

        getColumnLayout(elID) {
            return $opengrid.getColumnInfoList(elID);
        },

        getDataAtCol(elID, dataField, total) {
            return $opengrid.getColumnValues(elID, dataField, total);
        },

        getSelectedItems(elID) {
            var item = $opengrid.getSelectedItem(elID);
            return item ? [item] : [];
        },

        getSelectedText(elID) {
            var item = $opengrid.getSelectedItem(elID);
            var dataField = $opengrid.colToProp(elID, $opengrid.getActiveColIndex(elID));
            return item && dataField ? item[dataField] : null;
        },

        forceEditingComplete(elID, value, cancel) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                if ($string.toBoolean(cancel) == true) {
                    grid.cancelEdit();
                }
                else {
                    grid.commitEdit();
                }
            }
        },

        getCellFormatValue(elID, rowIndex, dataField) {
            var grid = $opengrid.getGridControl(elID);
            var column = $opengrid.getColumnInfo(elID, dataField);
            var item = $opengrid.getItemByRowIndex(elID, rowIndex);
            if (!grid || !column || !item) {
                return null;
            }
            return grid.getCellHtmlValue(item, column).replace(/<[^>]*>/g, '');
        },

        getColumnDistinctValues(elID, rowIndex, dataField) {
            var values = $opengrid.getColumnValues(elID, dataField, true) || [];
            var result = [];
            for (var i = rowIndex || 0; i < values.length; i++) {
                if (result.indexOf(values[i]) == -1) {
                    result.push(values[i]);
                }
            }
            return result;
        },

        validateGridData(elID, dataField) {
            var columns = dataField ? [$opengrid.getColumnInfo(elID, dataField)] : $opengrid.getColumnInfoList(elID);
            var rows = $opengrid._getDataItems(elID, true);
            var errors = [];
            columns = (columns || []).filter(function (column) { return !!column; });
            for (var i = 0; i < rows.length; i++) {
                for (var j = 0; j < columns.length; j++) {
                    var column = columns[j];
                    if ($string.toBoolean(column.required) == true && $string.isNullOrEmpty(rows[i][column.dataField || column.field]) == true) {
                        errors.push({ rowIndex: i, dataField: column.dataField || column.field, reason: 'required' });
                    }
                }
            }
            return errors.length > 0 ? errors : null;
        },

        setDataAtRow(elID, values) {
            if ($object.isArray(values) == false) {
                return;
            }
            for (var i = 0; i < values.length; i++) {
                var item = values[i];
                var row = item[0];
                var col = item[1];
                var value = item[2];
                $opengrid.setDataAtCell(elID, row, col, value);
            }
        },

        updateRows(elID, values, rowIndexs) {
            if ($object.isArray(values) == false) {
                return;
            }
            for (var i = 0; i < values.length; i++) {
                var rowIndex = rowIndexs && rowIndexs[i] != null ? rowIndexs[i] : i;
                $opengrid.updateRow(elID, values[i], rowIndex);
            }
        },

        updateRowBlockToValue(elID, startRowIndex, endRowIndex, dataFields, values) {
            if ($object.isArray(dataFields) == false) {
                dataFields = [dataFields];
            }
            if ($object.isArray(values) == false) {
                values = [values];
            }
            for (var rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
                var rowValues = {};
                for (var i = 0; i < dataFields.length; i++) {
                    rowValues[$opengrid._getColumnField(elID, dataFields[i])] = values[i];
                }
                $opengrid.updateRow(elID, rowValues, rowIndex);
            }
        },

        updateRowsById(elID, values) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid || $object.isArray(values) == false) {
                return;
            }
            for (var i = 0; i < values.length; i++) {
                var rowID = values[i].id || values[i]._$uid || values[i].rowId;
                var rowIndex = grid.getRowIndexById(rowID);
                if (rowIndex > -1) {
                    $opengrid.updateRow(elID, values[i], rowIndex);
                }
            }
        },

        updateAllToValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var rows = $opengrid._getDataItems(elID, true);
            for (var i = 0; i < rows.length; i++) {
                rows[i][dataField] = value;
                if (rows[i].Flag != 'C') {
                    rows[i].Flag = 'U';
                }
            }
            $opengrid.render(elID);
        },

        indexToRowID(elID, rowIndex) {
            var item = $opengrid.getItemByRowIndex(elID, rowIndex);
            return item ? item.id : null;
        },

        isUniqueValue(elID, dataField, value) {
            var values = $opengrid.getColumnValues(elID, dataField, true) || [];
            return values.filter(function (item) { return item == value; }).length <= 1;
        },

        getCheckedRowItems(elID) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            var checkColumn = columns.find(function (column) { return column.columnType == 'checkbox'; });
            if (!checkColumn) {
                return [];
            }
            var field = checkColumn.dataField || checkColumn.field;
            var checkValue = checkColumn.checkValue;
            return $opengrid._getDataItems(elID, true).filter(function (item) {
                return String(item[field]) == String(checkValue) || item[field] === true;
            });
        },

        getRowIndexByValue(elID, dataField, value) {
            var indexes = $opengrid.getRowIndexesByValue(elID, dataField, value);
            return indexes.length > 0 ? indexes[0] : -1;
        },

        getRowIndexesByValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            var rows = $opengrid._getDataItems(elID, true);
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                if (rows[i][dataField] == value) {
                    result.push(i);
                }
            }
            return result;
        },

        getRowsByValue(elID, dataField, value) {
            dataField = $opengrid._getColumnField(elID, dataField);
            return $opengrid._getDataItems(elID, true).filter(function (item) {
                return item[dataField] == value;
            });
        },

        getInitValueItem(elID, RowID) {
            return $opengrid.getItemByRowID(elID, RowID);
        },

        getSourceDataAtRow(elID, rowIndex) {
            return $opengrid.getItemByRowIndex(elID, rowIndex);
        },

        getItemByRowIndex(elID, rowIndex) {
            var grid = $opengrid.getGridControl(elID);
            var item = grid && grid.gridData[rowIndex] ? grid.gridData[rowIndex].data : null;
            return item || null;
        },

        getItemByRowID(elID, rowID) {
            var grid = $opengrid.getGridControl(elID);
            return grid ? grid.resolveRowItem(rowID) : null;
        },

        getItemsByValue(elID, dataField, value) {
            return $opengrid.getRowsByValue(elID, dataField, value);
        },

        changeColumnLayout(elID, columnLayout) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setColumns(columnLayout || [], grid.getData());
                grid.generateGridHeader();
                grid.rerender();
            }
        },

        checkUniqueValueCol(elID, dataField, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            return values.filter(function (row, index) { return values.indexOf(row) !== index; }).length == 0;
        },

        checkValueCountCol(elID, dataField, checkValue, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            return values.filter(function (item) { return item === checkValue; }).length;
        },

        checkEmptyValueCol(elID, dataField, checkValue, total) {
            var values = $opengrid.getColumnValues(elID, dataField, total) || [];
            if ($object.isNullOrUndefined(checkValue) == true) {
                return values.length > 0 && values.filter(function (item) { return $string.isNullOrEmpty(item) == true; }).length > 0;
            }
            return values.filter(function (item) { return item === checkValue; }).length > 0;
        },

        checkEmptyValueCols(elID, columns, checkValue) {
            var rows = $opengrid._getDataItems(elID, true);
            for (var i = 0; i < rows.length; i++) {
                var empty = true;
                for (var j = 0; j < columns.length; j++) {
                    var value = rows[i][columns[j]];
                    if ($object.isNullOrUndefined(checkValue) == true) {
                        empty = $string.isNullOrEmpty(value) == true;
                    }
                    else {
                        empty = $string.isNullOrEmpty(value) == true || value === checkValue;
                    }
                    if (empty == false) {
                        break;
                    }
                }
                if (empty == true) {
                    return true;
                }
            }
            return false;
        },

        setTransactionBelongID(elID, belongFlow, transactConfig) {
            var columns = $opengrid.getColumnInfoList(elID) || [];
            belongFlow.items = belongFlow.items || {};
            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                var dataType = 'string';
                switch (column.columnType) {
                    case 'checkbox':
                        dataType = 'bool';
                        break;
                    case 'number':
                        dataType = 'number';
                        break;
                }

                var isBelong = $object.isNullOrUndefined(transactConfig) == true || column.dataField == 'Flag';
                if (isBelong == false && $string.isNullOrEmpty(column.belongID) == false) {
                    var belongIDs = String(column.belongID).split(',');
                    isBelong = belongIDs.indexOf(transactConfig.functionID) > -1;
                }

                if (isBelong == true) {
                    belongFlow.items[column.dataField || column.field] = {
                        fieldID: column.dataField || column.field,
                        dataType: dataType
                    };
                }
            }
        },

        getValue(elID, requestType, metaColumns) {
            var result = [];
            var items = [];
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return result;
            }

            if (metaColumns) {
                if (requestType == 'Row') {
                    var selectedItem = grid.getSelectedItem();
                    if (selectedItem) {
                        var rowFlag = selectedItem.Flag || 'C';
                        if (rowFlag && rowFlag != 'S') {
                            items.push($opengrid.mapMetaColumns(selectedItem, rowFlag, metaColumns));
                        }
                    }
                }
                else if (requestType == 'List') {
                    var updateItems = grid.getUpdateItems();
                    for (var i = 0, length = updateItems.length; i < length; i++) {
                        var rowData = updateItems[i];
                        var flag = rowData.Flag || 'C';
                        if (flag && flag != 'S' && flag != 'R') {
                            items.push($opengrid.mapMetaColumns(rowData, flag, metaColumns));
                        }
                    }
                }

                var length = items.length;
                for (var i = 0; i < length; i++) {
                    var item = items[i];
                    var row = [];
                    for (var key in item) {
                        row.push({ prop: key, val: item[key] });
                    }
                    result.push(row);
                }
            }
            else {
                syn.$l.eventLog('$opengrid.getValue', 'Input Mapping 설정 없음', 'Debug');
            }

            return result;
        },

        mapMetaColumns(rowData, flag, metaColumns) {
            var data = {};
            data.Flag = flag;

            for (var key in metaColumns) {
                var column = metaColumns[key];
                var rowValue = rowData[key];

                if (rowValue === undefined) {
                    data[column.fieldID] = column.dataType == 'number' ? null : $object.defaultValue(column.dataType);
                }
                else {
                    data[column.fieldID] = rowValue;
                }
            }

            return data;
        },

        setValue(elID, value, metaColumns) {
            var grid = $opengrid.getGridControl(elID);
            if (!grid) {
                return;
            }

            value = value || [];
            if (value.length > 0 && $object.isNullOrUndefined(metaColumns) == false) {
                var item = value[0];
                for (var column in item) {
                    var isTypeCheck = false;
                    var metaColumn = metaColumns[column];
                    if (metaColumn) {
                        switch (metaColumn.dataType.toLowerCase()) {
                            case 'string':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isString(item[column]) || $string.isNumber(item[column]);
                                break;
                            case 'bool':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isBoolean(item[column]);
                                break;
                            case 'number':
                            case 'numeric':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $string.isNumber(item[column]) || $object.isNumber(item[column]);
                                break;
                            case 'date':
                                isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $date.isDate(item[column]);
                                break;
                            default:
                                isTypeCheck = false;
                                break;
                        }

                        if (isTypeCheck == false) {
                            syn.$l.eventLog('syn.uicontrols.$opengrid', '바인딩 데이터 타입과 매핑 정의가 다름, 바인딩 ID - "{0}", 타입 - "{1}"'.format(column, metaColumn.dataType), 'Warning');
                            return;
                        }
                    }
                    else {
                        continue;
                    }
                }
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                value[i].Flag = 'R';
            }

            grid.setData(value, { keepFlag: true });
        },

        clear(elID, isControlLoad) {
            var grid = $opengrid.getGridControl(elID);
            if (grid) {
                grid.setData([]);
            }
        },

        setLocale(elID, translations, control, options) {
            var grid = $opengrid.getGridControl(elID);
            if (grid && translations) {
                grid.setMessages(translations);
            }
        },

        destroy(elID) {
            var control = $opengrid.getControl(elID);
            if (control) {
                control.grid.destroy();
                var index = $opengrid.gridControls.indexOf(control);
                if (index > -1) {
                    $opengrid.gridControls.splice(index, 1);
                }
            }
        }
    });

    syn.uicontrols.$opengrid = $opengrid;
})(window);
