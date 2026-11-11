/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $echarts = syn.uicontrols.$echarts || new syn.module();

    function cloneValue(value, references, copies) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return value;
        }
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
            return value.slice ? value.slice() : value;
        }

        references = references || [];
        copies = copies || [];
        var referenceIndex = references.indexOf(value);
        if (referenceIndex > -1) {
            return copies[referenceIndex];
        }

        var result = Array.isArray(value) ? [] : {};
        references.push(value);
        copies.push(result);
        for (var key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                result[key] = cloneValue(value[key], references, copies);
            }
        }
        return result;
    }

    function asArray(value) {
        if (value === null || value === undefined) {
            return [];
        }
        return Array.isArray(value) ? value : [value];
    }

    function resolveFunction(value) {
        if (typeof value === 'function') {
            return value;
        }
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        var current = window;
        var names = value.split('.');
        for (var i = 0; i < names.length && current; i++) {
            current = current[names[i]];
        }
        return typeof current === 'function' ? current : null;
    }

    function isPromise(value) {
        return value && typeof value.then === 'function';
    }

    function hasOwn(target, name) {
        return target && Object.prototype.hasOwnProperty.call(target, name);
    }

    function mergeSetting(target, source) {
        return syn.$w.argumentsExtend(target, source || {});
    }

    function getPageHandler(elID, eventName) {
        var mod = window[syn.$w.pageScript];
        return mod && mod.event ? mod.event[elID + '_' + eventName] : null;
    }

    function emit(control, eventName, params) {
        var handler = getPageHandler(control.id, eventName);
        if (handler) {
            handler.apply(syn.$l.get(control.id), [control.id, params, $echarts.getSelection(control.id)]);
        }
    }

    function emitZr(control, eventName, params) {
        var handlerName = 'zr' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
        var handler = getPageHandler(control.id, handlerName);
        if (handler) {
            handler.apply(syn.$l.get(control.id), [control.id, params, $echarts.getSelection(control.id)]);
        }
    }

    function logError(scope, error) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog(scope, error && error.message ? error.message : String(error), 'Error');
        }
    }

    function logWarning(scope, message) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog(scope, message, 'Warning');
        }
    }

    function handleError(control, scope, error) {
        logError(scope, error);
        if (control) {
            emit(control, 'error', error);
        }
        return null;
    }

    function validateRows(value, scope) {
        if (value !== null && value !== undefined && !Array.isArray(value) && typeof value !== 'object') {
            logWarning(scope, 'The value must be an object or an array of objects.');
            return null;
        }

        var rows = asArray(value);
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i] || typeof rows[i] !== 'object' || Array.isArray(rows[i])) {
                logWarning(scope, 'Every array item must be an object.');
                return null;
            }
        }
        return cloneValue(rows);
    }

    function getSeries(option, seriesIndex) {
        var series = option && option.series;
        if (!Array.isArray(series)) {
            series = series ? [series] : [];
        }
        return series[seriesIndex] || {};
    }

    function getDimensionName(dimensions, dimension) {
        if (typeof dimension !== 'number' || !dimensions || dimensions[dimension] === undefined) {
            return dimension;
        }
        return typeof dimensions[dimension] === 'object' ? dimensions[dimension].name : dimensions[dimension];
    }

    function getEncodedValue(source, encodeValue, dimensions) {
        if (encodeValue === undefined || encodeValue === null || source === undefined || source === null) {
            return undefined;
        }

        var encoded = Array.isArray(encodeValue) ? encodeValue : [encodeValue];
        var values = [];
        for (var i = 0; i < encoded.length; i++) {
            var key = getDimensionName(dimensions, encoded[i]);
            var value;
            if (Array.isArray(source) && typeof key === 'number') {
                value = source[key];
            }
            else if (Array.isArray(source) && dimensions) {
                var dimensionIndex = -1;
                for (var j = 0; j < dimensions.length; j++) {
                    if (getDimensionName(dimensions, j) === key) {
                        dimensionIndex = j;
                        break;
                    }
                }
                value = dimensionIndex > -1 ? source[dimensionIndex] : undefined;
            }
            else if (source && typeof source === 'object') {
                value = source[key];
            }
            values.push(value);
        }
        return values.length === 1 ? values[0] : values;
    }

    function normalizeMappedRow(mapped, rows) {
        if (mapped === null || mapped === undefined) {
            return null;
        }
        if (typeof mapped === 'number') {
            return { rowIndex: mapped, row: rows[mapped] };
        }
        if (mapped && typeof mapped === 'object' && (mapped.row !== undefined || mapped.rowIndex !== undefined)) {
            var rowIndex = mapped.rowIndex !== undefined ? mapped.rowIndex : rows.indexOf(mapped.row);
            return { rowIndex: rowIndex, row: mapped.row !== undefined ? mapped.row : rows[rowIndex] };
        }
        return null;
    }

    function resolveRowIndexMap(control, params, series) {
        var map = control.rowIndexMap || control.config.rowIndexMap;
        if (!map) {
            return null;
        }
        if (typeof map === 'function') {
            return normalizeMappedRow(map(params, control.rawValue, control), control.rawValue);
        }

        var seriesIndex = params.seriesIndex || 0;
        var seriesMap;
        if (Array.isArray(map)) {
            seriesMap = map[seriesIndex];
        }
        else {
            seriesMap = map[params.seriesId] || map[series.id] || map[params.seriesName] || map[series.name] || map[seriesIndex];
        }
        if (!seriesMap) {
            return null;
        }
        if (!Array.isArray(seriesMap) && params.dataType && seriesMap[params.dataType] !== undefined) {
            seriesMap = seriesMap[params.dataType];
        }
        if (typeof seriesMap === 'function') {
            return normalizeMappedRow(seriesMap(params, control.rawValue, control), control.rawValue);
        }
        return normalizeMappedRow(seriesMap[params.dataIndex], control.rawValue);
    }

    function resolveSelectionRow(control, params, option, series) {
        var resolver = control.selectionResolver || resolveFunction(control.config.selectionResolver);
        if (resolver) {
            var resolved = normalizeMappedRow(resolver(params, control.rawValue, option, control), control.rawValue);
            if (resolved) {
                return resolved;
            }
            return null;
        }

        var data = params.data;
        if (data && typeof data === 'object' && typeof data.__handstackRowIndex === 'number') {
            return normalizeMappedRow(data.__handstackRowIndex, control.rawValue);
        }

        if (control.config.selectionKey && data && typeof data === 'object') {
            var selectedKey = data[control.config.selectionKey];
            if (selectedKey === undefined && data.value && typeof data.value === 'object') {
                selectedKey = data.value[control.config.selectionKey];
            }
            for (var i = 0; i < control.rawValue.length; i++) {
                if (control.rawValue[i] && control.rawValue[i][control.config.selectionKey] === selectedKey) {
                    return { rowIndex: i, row: control.rawValue[i] };
                }
            }
        }

        var mapped = resolveRowIndexMap(control, params, series);
        if (mapped) {
            return mapped;
        }

        var rowIndex = typeof params.dataIndex === 'number' ? params.dataIndex : -1;
        return { rowIndex: rowIndex, row: rowIndex > -1 ? control.rawValue[rowIndex] : null };
    }

    function selectionKey(selection) {
        return [selection.series.index, selection.point.dataType || '', selection.point.dataIndex].join('|');
    }

    function makeSelection(control, params) {
        params = params || {};
        var option = control.chart && control.chart.getOption ? control.chart.getOption() : control.config.option;
        var seriesIndex = params.seriesIndex !== undefined ? params.seriesIndex : 0;
        var series = getSeries(option, seriesIndex);
        var resolved = resolveSelectionRow(control, params, option, series);
        if (!resolved) {
            return null;
        }

        var encode = series.encode || {};
        var datasetOption = option && option.dataset;
        var datasetIndex = series.datasetIndex !== undefined ? series.datasetIndex : control.config.datasetIndex;
        var dataset = Array.isArray(datasetOption) ? datasetOption[datasetIndex || 0] : datasetOption;
        var dimensions = dataset && dataset.dimensions ? dataset.dimensions : null;
        var yData = getEncodedValue(params.value, encode.y, dimensions);
        if (yData === undefined) {
            yData = getEncodedValue(params.value, encode.value, dimensions);
        }
        if (yData === undefined) {
            yData = getEncodedValue(resolved.row, encode.y, dimensions);
        }
        if (yData === undefined) {
            yData = getEncodedValue(resolved.row, encode.value, dimensions);
        }
        if (yData === undefined) {
            yData = params.value;
        }

        return {
            series: {
                index: seriesIndex,
                id: params.seriesId !== undefined ? params.seriesId : series.id,
                name: params.seriesName !== undefined ? params.seriesName : series.name,
                type: params.seriesType !== undefined ? params.seriesType : series.type
            },
            point: {
                dataIndex: params.dataIndex,
                dataIndexInside: params.dataIndexInside,
                dataType: params.dataType,
                name: params.name,
                value: params.value,
                data: params.data,
                color: params.color
            },
            yData: yData,
            rowIndex: resolved.rowIndex,
            row: resolved.row === undefined ? null : resolved.row
        };
    }

    function updateClickSelection(control, params) {
        if (control.config.selectionMode === 'none' || control.config.selectionMode === 'native' || params.componentType !== 'series') {
            return;
        }

        var selection = makeSelection(control, params);
        if (!selection) {
            return;
        }

        var key = selectionKey(selection);
        var found = -1;
        for (var i = 0; i < control.selections.length; i++) {
            if (selectionKey(control.selections[i]) === key) {
                found = i;
                break;
            }
        }

        if (control.config.selectionMode === 'multiple') {
            if (found > -1) {
                control.selections.splice(found, 1);
            }
            else {
                control.selections.push(selection);
            }
        }
        else {
            control.selections = [selection];
        }
        emit(control, 'selectionChange', params);
    }

    function syncNativeSelection(control, params) {
        if (control.config.selectionMode !== 'native') {
            return;
        }
        var selectedGroups = params && params.selected;
        if (!Array.isArray(selectedGroups)) {
            return;
        }

        var selections = [];
        for (var i = 0; i < selectedGroups.length; i++) {
            var selectedGroup = selectedGroups[i];
            var dataIndexes = asArray(selectedGroup.dataIndex);
            for (var j = 0; j < dataIndexes.length; j++) {
                var dataIndex = dataIndexes[j];
                var selection = makeSelection(control, {
                    componentType: 'series',
                    seriesIndex: selectedGroup.seriesIndex,
                    dataIndex: dataIndex,
                    dataType: selectedGroup.dataType,
                    data: control.rawValue[dataIndex],
                    value: control.rawValue[dataIndex]
                });
                if (selection) {
                    selections.push(selection);
                }
            }
        }

        var previousKeys = control.selections.map(selectionKey).join(',');
        var currentKeys = selections.map(selectionKey).join(',');
        control.selections = selections;
        if (previousKeys !== currentKeys) {
            emit(control, 'selectionChange', params);
        }
    }

    function bindRuntimeEvent(control, registration) {
        var handler = resolveFunction(registration.handler);
        if (!handler) {
            return;
        }
        registration.listener = function (params) {
            handler.apply(control.element, [control.id, params, $echarts.getSelection(control.id)]);
        };
        if (registration.query !== undefined && registration.query !== null) {
            control.chart.on(registration.eventName, registration.query, registration.listener);
        }
        else {
            control.chart.on(registration.eventName, registration.listener);
        }
    }

    function bindRuntimeZrEvent(control, registration) {
        var handler = resolveFunction(registration.handler);
        if (!handler) {
            return;
        }
        registration.listener = function (params) {
            handler.apply(control.element, [control.id, params, $echarts.getSelection(control.id)]);
        };
        control.chart.getZr().on(registration.eventName, registration.listener);
    }

    function bindEvents(control) {
        var chart = control.chart;
        var eventNames = control.eventNames;
        var queries = control.config.eventQueries || {};

        for (var i = 0; i < eventNames.length; i++) {
            (function (eventName) {
                if ($echarts.syntheticEvents.indexOf(eventName) > -1) {
                    return;
                }
                var listener = function (params) {
                    if (eventName === 'click') {
                        updateClickSelection(control, params);
                    }
                    else if (eventName === 'selectchanged') {
                        syncNativeSelection(control, params);
                    }
                    emit(control, eventName, params);
                };
                if (queries[eventName] !== undefined && queries[eventName] !== null) {
                    chart.on(eventName, queries[eventName], listener);
                }
                else {
                    chart.on(eventName, listener);
                }
            })(eventNames[i]);
        }

        if (eventNames.indexOf('click') < 0) {
            chart.on('click', function (params) {
                updateClickSelection(control, params);
            });
        }
        if (eventNames.indexOf('selectchanged') < 0) {
            chart.on('selectchanged', function (params) {
                syncNativeSelection(control, params);
            });
        }

        var zr = chart.getZr();
        zr.on('click', function (event) {
            if (!event.target && control.config.clearSelectionOnBlank) {
                $echarts.clearSelection(control.id);
            }
        });
        for (var zrIndex = 0; zrIndex < control.zrEventNames.length; zrIndex++) {
            (function (eventName) {
                zr.on(eventName, function (params) {
                    emitZr(control, eventName, params);
                });
            })(control.zrEventNames[zrIndex]);
        }

        for (var runtimeIndex = 0; runtimeIndex < control.runtimeEvents.length; runtimeIndex++) {
            bindRuntimeEvent(control, control.runtimeEvents[runtimeIndex]);
        }
        for (var runtimeZrIndex = 0; runtimeZrIndex < control.runtimeZrEvents.length; runtimeZrIndex++) {
            bindRuntimeZrEvent(control, control.runtimeZrEvents[runtimeZrIndex]);
        }
    }

    function createChart(control, applyOption) {
        var initOptions = mergeSetting({}, control.config.initOptions || {});
        initOptions.locale = control.config.locale;
        control.chart = echarts.init(control.element, control.config.theme, initOptions);
        if (control.config.group !== null && control.config.group !== undefined) {
            control.chart.group = control.config.group;
        }
        bindEvents(control);
        if (applyOption !== false && control.config.option) {
            control.chart.setOption(control.config.option, control.config.setOptionOptions);
        }
    }

    function rememberOption(control, option, options) {
        options = options || control.config.setOptionOptions || {};
        if (options.notMerge) {
            control.config.option = option || {};
        }
        else {
            control.config.option = mergeSetting(mergeSetting({}, control.config.option || {}), option || {});
        }
    }

    function applyOption(control, option, options, source) {
        options = options || control.config.setOptionOptions;
        control.chart.setOption(option || {}, options);
        rememberOption(control, option, options);
        emit(control, 'optionChanged', { source: source || 'setOption', option: option || {}, options: options });
        return control.chart;
    }

    function makeDatasetPatch(control, rows, metaColumns) {
        var currentOption = control.chart.getOption() || control.config.option || {};
        var dataset = { source: rows };
        var datasetOption = currentOption.dataset;
        var existingDataset = Array.isArray(datasetOption) ? datasetOption[control.config.datasetIndex] : datasetOption;
        if ((!existingDataset || !existingDataset.dimensions) && metaColumns) {
            dataset.dimensions = [];
            for (var key in metaColumns) {
                if (Object.prototype.hasOwnProperty.call(metaColumns, key)) {
                    dataset.dimensions.push(key);
                }
            }
        }
        if (Array.isArray(datasetOption) || control.config.datasetIndex > 0) {
            var datasets = Array.isArray(datasetOption) ? datasetOption.slice() : [];
            while (datasets.length <= control.config.datasetIndex) {
                datasets.push({});
            }
            datasets[control.config.datasetIndex] = mergeSetting(mergeSetting({}, datasets[control.config.datasetIndex]), dataset);
            return { dataset: datasets };
        }
        return { dataset: mergeSetting(mergeSetting({}, datasetOption || {}), dataset) };
    }

    function applyAdaptedValue(control, token, rows, metaColumns, adapted) {
        if (token !== control.dataRequestVersion) {
            return control.chart;
        }

        var patch = adapted;
        var selectionResolver;
        var rowIndexMap;
        if (adapted && adapted.option) {
            patch = adapted.option;
            selectionResolver = adapted.selectionResolver;
            rowIndexMap = adapted.rowIndexMap;
        }
        patch = patch || makeDatasetPatch(control, rows, metaColumns);

        control.rawValue = rows;
        control.metaColumns = metaColumns || null;
        control.selections = [];
        if (selectionResolver !== undefined) {
            control.selectionResolver = resolveFunction(selectionResolver) || selectionResolver;
        }
        if (rowIndexMap !== undefined) {
            control.rowIndexMap = rowIndexMap;
        }
        applyOption(control, patch, control.config.setOptionOptions, 'setValue');
        emit(control, 'dataBound', { rows: cloneValue(rows), option: patch });
        return control.chart;
    }

    function recreateChart(control, options) {
        options = options || {};
        if (control.chart && !control.chart.isDisposed()) {
            control.chart.dispose();
        }
        if (hasOwn(options, 'theme')) { control.config.theme = options.theme; }
        if (hasOwn(options, 'locale')) { control.config.locale = options.locale; }
        if (hasOwn(options, 'initOptions')) { control.config.initOptions = options.initOptions || {}; }
        if (hasOwn(options, 'group')) { control.config.group = options.group; }
        if (hasOwn(options, 'option')) { control.config.option = options.option || {}; }
        control.selections = [];
        createChart(control, options.applyOption !== false);
        emit(control, 'reinitialized', {
            theme: control.config.theme,
            locale: control.config.locale,
            initOptions: cloneValue(control.config.initOptions)
        });
        return control.chart;
    }

    function transactionRows(control, requestType, metaColumns) {
        var rows = $echarts.getSelectedRows(control.id);
        if (requestType === 'Row') {
            rows = rows.length ? [rows[rows.length - 1]] : [];
        }
        else if (requestType !== 'List') {
            return [];
        }

        var result = [];
        var columns = metaColumns || control.metaColumns;
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var transactionRow = [];
            if (columns) {
                for (var key in columns) {
                    if (!Object.prototype.hasOwnProperty.call(columns, key)) {
                        continue;
                    }
                    var column = columns[key] || {};
                    var fieldID = column.fieldID || column.FieldID || key;
                    var dataType = column.dataType || column.DataType;
                    var rowValue = row[key];
                    if (rowValue === undefined && window.$object && $object.defaultValue) {
                        rowValue = dataType === 'number' ? null : $object.defaultValue(dataType);
                    }
                    transactionRow.push({ prop: fieldID, val: rowValue });
                }
            }
            else {
                for (var property in row) {
                    if (Object.prototype.hasOwnProperty.call(row, property)) {
                        transactionRow.push({ prop: property, val: row[property] });
                    }
                }
            }
            result.push(transactionRow);
        }
        return result;
    }

    $echarts.extend({
        name: 'syn.uicontrols.$echarts',
        version: 'v2026.7.27',
        chartControls: [],
        syntheticEvents: ['initialized', 'dataBound', 'selectionChange', 'optionChanged', 'reinitialized', 'resized', 'disposed', 'error'],
        defaultSetting: {
            width: '100%',
            height: '320px',
            option: {},
            theme: null,
            locale: 'KO',
            initOptions: { renderer: 'canvas', useDirtyRect: false },
            group: null,
            dataMode: 'dataset',
            datasetIndex: 0,
            dataAdapter: null,
            selectionResolver: null,
            rowIndexMap: null,
            selectionMode: 'single',
            selectionKey: null,
            clearSelectionOnBlank: true,
            autoResize: true,
            eventQueries: {},
            zrEvents: [],
            setOptionOptions: { notMerge: false, lazyUpdate: false, silent: false },
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList: function (el, moduleList, setting, controlType) {
            var form = el.closest('form');
            moduleList.push({
                id: el.getAttribute('id'),
                formDataFieldID: form ? form.getAttribute('syn-datafield') : '',
                field: el.getAttribute('syn-datafield'),
                module: this.name,
                type: controlType
            });
        },

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            if (!el) {
                return;
            }
            if (!window.echarts) {
                logError('$echarts.controlLoad', 'ECharts library is not loaded.');
                return;
            }

            setting = mergeSetting(mergeSetting({}, $echarts.defaultSetting), setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = mergeSetting(setting, mod.hook.controlInit(elID, setting));
            }
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;
            setting.option = mergeSetting({}, setting.option || {});

            var eventNames = [];
            var synEvents = el.getAttribute('syn-events');
            if (synEvents) {
                try {
                    eventNames = eval(synEvents);
                }
                catch (error) {
                    logError('$echarts.controlLoad', error);
                }
            }
            eventNames = Array.isArray(eventNames) ? eventNames : [];

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var chartElement = document.createElement('div');
            chartElement.id = elID;
            chartElement.className = 'syn-echarts' + (el.className ? ' ' + el.className : '');
            chartElement.style.width = setting.width;
            chartElement.style.height = setting.height;
            el.parentNode.insertBefore(chartElement, el.nextSibling);

            var control = {
                id: elID,
                element: chartElement,
                chart: null,
                config: setting,
                rawValue: [],
                metaColumns: null,
                selections: [],
                selectionResolver: resolveFunction(setting.selectionResolver),
                rowIndexMap: setting.rowIndexMap,
                eventNames: eventNames,
                zrEventNames: asArray(setting.zrEvents),
                runtimeEvents: [],
                runtimeZrEvents: [],
                resizeObserver: null,
                resizeHandler: null,
                dataRequestVersion: 0
            };

            try {
                createChart(control, true);
                $echarts.chartControls.push(control);
                if (setting.autoResize) {
                    if (window.ResizeObserver) {
                        control.resizeObserver = new ResizeObserver(function () {
                            if (control.chart && !control.chart.isDisposed()) {
                                control.chart.resize();
                                emit(control, 'resized', { source: 'ResizeObserver' });
                            }
                        });
                        control.resizeObserver.observe(chartElement);
                    }
                    else {
                        control.resizeHandler = function () { $echarts.resize(elID); };
                        window.addEventListener('resize', control.resizeHandler);
                    }
                }
                emit(control, 'initialized', { chart: control.chart });
            }
            catch (error) {
                handleError(control, '$echarts.controlLoad', error);
            }
        },

        getControl: function (elID) {
            for (var i = 0; i < $echarts.chartControls.length; i++) {
                if ($echarts.chartControls[i].id === elID) {
                    return $echarts.chartControls[i];
                }
            }
            return null;
        },

        getChartControl: function (elID) {
            var control = $echarts.getControl(elID);
            return control ? control.chart : null;
        },

        getChartInstance: function (elID) {
            return $echarts.getChartControl(elID);
        },

        getECharts: function () {
            return window.echarts;
        },

        setValue: function (elID, value, metaColumns) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return Promise.resolve(null);
            }
            var rows = validateRows(value, '$echarts.setValue');
            if (rows === null) {
                return Promise.resolve(null);
            }

            var token = ++control.dataRequestVersion;
            var adapter = resolveFunction(control.config.dataAdapter);
            if (!adapter) {
                return Promise.resolve(applyAdaptedValue(control, token, rows, metaColumns, null));
            }

            var adapted;
            try {
                adapted = adapter(rows, metaColumns, control.config.option || control.chart.getOption(), control);
            }
            catch (error) {
                handleError(control, '$echarts.setValue', error);
                return Promise.resolve(null);
            }

            if (isPromise(adapted)) {
                return adapted.then(function (result) {
                    return applyAdaptedValue(control, token, rows, metaColumns, result);
                }).catch(function (error) {
                    return handleError(control, '$echarts.setValue', error);
                });
            }
            try {
                return Promise.resolve(applyAdaptedValue(control, token, rows, metaColumns, adapted));
            }
            catch (error) {
                handleError(control, '$echarts.setValue', error);
                return Promise.resolve(null);
            }
        },

        renderChart: function (elID, descriptor) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return Promise.resolve(null);
            }
            var token = ++control.dataRequestVersion;

            try {
                if (typeof descriptor === 'function') {
                    descriptor = descriptor(control, echarts);
                }
            }
            catch (error) {
                handleError(control, '$echarts.renderChart', error);
                return Promise.resolve(null);
            }

            return Promise.resolve(descriptor || {}).then(function (resolvedDescriptor) {
                if (token !== control.dataRequestVersion) {
                    return control.chart;
                }
                var option = resolvedDescriptor.option || {};
                if (typeof option === 'function') {
                    option = option(control, echarts, resolvedDescriptor.rows);
                }
                return Promise.resolve(option).then(function (resolvedOption) {
                    if (token !== control.dataRequestVersion) {
                        return control.chart;
                    }

                    var rows = control.rawValue;
                    if (hasOwn(resolvedDescriptor, 'rows')) {
                        rows = validateRows(resolvedDescriptor.rows, '$echarts.renderChart');
                        if (rows === null) {
                            return null;
                        }
                    }
                    var shouldRecreate = hasOwn(resolvedDescriptor, 'theme') || hasOwn(resolvedDescriptor, 'locale') || hasOwn(resolvedDescriptor, 'initOptions');
                    if (hasOwn(resolvedDescriptor, 'setOptionOptions')) {
                        control.config.setOptionOptions = resolvedDescriptor.setOptionOptions || $echarts.defaultSetting.setOptionOptions;
                    }
                    if (hasOwn(resolvedDescriptor, 'selectionResolver')) {
                        control.selectionResolver = resolveFunction(resolvedDescriptor.selectionResolver) || resolvedDescriptor.selectionResolver;
                    }
                    if (hasOwn(resolvedDescriptor, 'rowIndexMap')) {
                        control.rowIndexMap = resolvedDescriptor.rowIndexMap;
                    }
                    if (hasOwn(resolvedDescriptor, 'metaColumns')) {
                        control.metaColumns = resolvedDescriptor.metaColumns;
                    }
                    if (hasOwn(resolvedDescriptor, 'group')) {
                        control.config.group = resolvedDescriptor.group;
                    }
                    control.rawValue = rows;
                    control.selections = [];

                    if (shouldRecreate) {
                        recreateChart(control, {
                            theme: hasOwn(resolvedDescriptor, 'theme') ? resolvedDescriptor.theme : control.config.theme,
                            locale: hasOwn(resolvedDescriptor, 'locale') ? resolvedDescriptor.locale : control.config.locale,
                            initOptions: hasOwn(resolvedDescriptor, 'initOptions') ? resolvedDescriptor.initOptions : control.config.initOptions,
                            group: control.config.group,
                            option: resolvedOption || {},
                            applyOption: true
                        });
                        emit(control, 'optionChanged', { source: 'renderChart', option: resolvedOption || {}, options: control.config.setOptionOptions });
                    }
                    else {
                        applyOption(control, resolvedOption || {}, resolvedDescriptor.setOptionOptions || control.config.setOptionOptions, 'renderChart');
                        if (hasOwn(resolvedDescriptor, 'group')) {
                            control.chart.group = resolvedDescriptor.group;
                        }
                    }
                    if (hasOwn(resolvedDescriptor, 'rows')) {
                        emit(control, 'dataBound', { rows: cloneValue(rows), option: resolvedOption || {} });
                    }
                    return control.chart;
                });
            }).catch(function (error) {
                return handleError(control, '$echarts.renderChart', error);
            });
        },

        getRawValue: function (elID) {
            var control = $echarts.getControl(elID);
            return control ? cloneValue(control.rawValue) : [];
        },

        getSelection: function (elID) {
            var control = $echarts.getControl(elID);
            return control ? cloneValue(control.selections) : [];
        },

        getSelectedRows: function (elID) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return [];
            }
            var rows = [];
            var indexes = {};
            for (var i = 0; i < control.selections.length; i++) {
                var selection = control.selections[i];
                var key = selection.rowIndex > -1 ? 'index-' + selection.rowIndex : 'row-' + i;
                if (selection.row !== null && selection.row !== undefined && !indexes[key]) {
                    rows.push(cloneValue(selection.row));
                    indexes[key] = true;
                }
            }
            return rows;
        },

        getValue: function (elID, requestType, metaColumns) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return requestType ? [] : null;
            }
            if (requestType) {
                return transactionRows(control, requestType, metaColumns);
            }
            var rows = $echarts.getSelectedRows(elID);
            return control.config.selectionMode === 'multiple' || control.config.selectionMode === 'native' ? rows : (rows[rows.length - 1] || null);
        },

        setSelection: function (elID, selections) {
            var control = $echarts.getControl(elID);
            if (!control || control.config.selectionMode === 'none') {
                return;
            }
            $echarts.clearSelection(elID, true);
            var values = asArray(selections);
            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                var params = typeof value === 'number' ? { seriesIndex: 0, dataIndex: value, componentType: 'series' } : value;
                var selection = value && value.row !== undefined && value.point ? value : makeSelection(control, params);
                if (selection) {
                    control.selections.push(selection);
                    if (control.config.selectionMode === 'single') {
                        break;
                    }
                }
            }
            emit(control, 'selectionChange', { source: 'setSelection' });
        },

        clearSelection: function (elID, silent) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return;
            }
            control.selections = [];
            if (!silent) {
                emit(control, 'selectionChange', { source: 'clearSelection' });
            }
        },

        setOption: function (elID, option, options) {
            var control = $echarts.getControl(elID);
            return control ? applyOption(control, option || {}, options || control.config.setOptionOptions, 'setOption') : null;
        },

        getOption: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getOption() : null;
        },

        dispatchAction: function (elID, action) {
            var chart = $echarts.getChartControl(elID);
            if (chart) { return chart.dispatchAction(action); }
            return null;
        },

        appendData: function (elID, options) {
            var chart = $echarts.getChartControl(elID);
            if (chart) { return chart.appendData(options); }
            return null;
        },

        on: function (elID, eventName, query, handler) {
            var control = $echarts.getControl(elID);
            if (!control) { return null; }
            if (handler === undefined) {
                handler = query;
                query = null;
            }
            var registration = { eventName: eventName, query: query, handler: handler, listener: null };
            control.runtimeEvents.push(registration);
            bindRuntimeEvent(control, registration);
            return registration.listener;
        },

        off: function (elID, eventName, handler) {
            var control = $echarts.getControl(elID);
            if (!control) { return; }
            for (var i = control.runtimeEvents.length - 1; i >= 0; i--) {
                var item = control.runtimeEvents[i];
                if (item.eventName === eventName && (!handler || item.handler === handler)) {
                    control.chart.off(eventName, item.listener);
                    control.runtimeEvents.splice(i, 1);
                }
            }
        },

        onZr: function (elID, eventName, handler) {
            var control = $echarts.getControl(elID);
            if (!control) { return null; }
            var registration = { eventName: eventName, handler: handler, listener: null };
            control.runtimeZrEvents.push(registration);
            bindRuntimeZrEvent(control, registration);
            return registration.listener;
        },

        offZr: function (elID, eventName, handler) {
            var control = $echarts.getControl(elID);
            if (!control) { return; }
            var zr = control.chart.getZr();
            for (var i = control.runtimeZrEvents.length - 1; i >= 0; i--) {
                var item = control.runtimeZrEvents[i];
                if (item.eventName === eventName && (!handler || item.handler === handler)) {
                    zr.off(eventName, item.listener);
                    control.runtimeZrEvents.splice(i, 1);
                }
            }
        },

        invoke: function (elID, target, method, args) {
            var chart = $echarts.getChartControl(elID);
            var instance = target === 'zr' && chart ? chart.getZr() : chart;
            return instance && typeof instance[method] === 'function' ? instance[method].apply(instance, args || []) : null;
        },

        invokeGlobal: function (method, args) {
            return window.echarts && typeof echarts[method] === 'function' ? echarts[method].apply(echarts, args || []) : null;
        },

        getZr: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getZr() : null;
        },

        getDom: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getDom() : null;
        },

        getWidth: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getWidth() : 0;
        },

        getHeight: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getHeight() : 0;
        },

        getDevicePixelRatio: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getDevicePixelRatio() : null;
        },

        getVisual: function (elID, finder, visualType) {
            var chart = $echarts.getChartControl(elID);
            return chart && chart.getVisual ? chart.getVisual(finder, visualType) : null;
        },

        isDisposed: function (elID) {
            var chart = $echarts.getChartControl(elID);
            return !chart || chart.isDisposed();
        },

        setGroup: function (elID, group) {
            var control = $echarts.getControl(elID);
            if (control) {
                control.config.group = group;
                control.chart.group = group;
            }
        },

        resize: function (elID, options) {
            var control = $echarts.getControl(elID);
            if (control) {
                control.chart.resize(options);
                emit(control, 'resized', options || { source: 'api' });
            }
        },

        setControlSize: function (elID, width, height) {
            var control = $echarts.getControl(elID);
            if (control) {
                if (width !== undefined) { control.element.style.width = typeof width === 'number' ? width + 'px' : width; }
                if (height !== undefined) { control.element.style.height = typeof height === 'number' ? height + 'px' : height; }
                $echarts.resize(elID);
            }
        },

        clear: function (elID) {
            var control = $echarts.getControl(elID);
            if (control) {
                control.dataRequestVersion++;
                control.chart.clear();
                control.config.option = {};
                control.rawValue = [];
                control.selections = [];
                control.rowIndexMap = null;
            }
        },

        dispose: function (elID) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return;
            }
            emit(control, 'disposed', {});
            control.dataRequestVersion++;
            if (control.resizeObserver) { control.resizeObserver.disconnect(); }
            if (control.resizeHandler) { window.removeEventListener('resize', control.resizeHandler); }
            if (control.chart && !control.chart.isDisposed()) { control.chart.dispose(); }
            var index = $echarts.chartControls.indexOf(control);
            if (index > -1) { $echarts.chartControls.splice(index, 1); }
        },

        toImage: function (elID, options) {
            return $echarts.getDataURL(elID, options);
        },

        getDataURL: function (elID, options) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getDataURL(options || { type: 'png', pixelRatio: 2, backgroundColor: '#fff' }) : null;
        },

        getConnectedDataURL: function (elID, options) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.getConnectedDataURL(options || { type: 'png', pixelRatio: 2 }) : null;
        },

        convertToPixel: function (elID, finder, value) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.convertToPixel(finder, value) : null;
        },

        convertFromPixel: function (elID, finder, value) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.convertFromPixel(finder, value) : null;
        },

        containPixel: function (elID, finder, value) {
            var chart = $echarts.getChartControl(elID);
            return chart ? chart.containPixel(finder, value) : false;
        },

        showLoading: function (elID, type, options) {
            var chart = $echarts.getChartControl(elID);
            if (chart) { chart.showLoading(type || 'default', options); }
        },

        hideLoading: function (elID) {
            var chart = $echarts.getChartControl(elID);
            if (chart) { chart.hideLoading(); }
        },

        reinitialize: function (elID, theme, locale, initOptions) {
            var control = $echarts.getControl(elID);
            if (!control) {
                return null;
            }
            return recreateChart(control, {
                theme: theme !== undefined ? theme : control.config.theme,
                locale: locale !== undefined ? locale : control.config.locale,
                initOptions: initOptions !== undefined ? initOptions : control.config.initOptions,
                group: control.config.group,
                option: control.config.option,
                applyOption: true
            });
        },

        setTheme: function (elID, theme) {
            return $echarts.reinitialize(elID, theme, undefined, undefined);
        },

        setLocale: function (elID, locale) {
            return $echarts.reinitialize(elID, undefined, locale, undefined);
        },

        connect: function (group) { return echarts.connect(group); },
        disconnect: function (group) { return echarts.disconnect(group); },
        registerMap: function (mapName, geoJson, specialAreas) { return echarts.registerMap(mapName, geoJson, specialAreas); },
        getMap: function (mapName) { return echarts.getMap(mapName); },
        registerTheme: function (themeName, theme) { return echarts.registerTheme(themeName, theme); },
        registerLocale: function (localeName, locale) { return echarts.registerLocale(localeName, locale); },
        registerTransform: function (transform) { return echarts.registerTransform(transform); },
        registerCustomSeries: function (seriesName, renderItem) {
            if (echarts.registerCustomSeries) {
                return echarts.registerCustomSeries(seriesName, renderItem);
            }
            logWarning('$echarts.registerCustomSeries', 'registerCustomSeries requires ECharts 6 or later.');
            return null;
        }
    });

    syn.uicontrols.$echarts = $echarts;
})(window);
