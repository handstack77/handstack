/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $chartjs = syn.uicontrols.$chartjs || new syn.module();

    function createChartCommon(scope) {
        function isPlainObject(value) {
            return value !== null && typeof value === 'object' && !Array.isArray(value) &&
                (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
        }

        function clone(value) {
            if (Array.isArray(value)) {
                return value.map(clone);
            }
            if (isPlainObject(value)) {
                var result = {};
                for (var key in value) {
                    result[key] = clone(value[key]);
                }
                return result;
            }
            if (value instanceof Date) {
                return new Date(value.getTime());
            }
            return value;
        }

        function merge(target) {
            target = isPlainObject(target) ? target : {};
            for (var sourceIndex = 1; sourceIndex < arguments.length; sourceIndex++) {
                var source = arguments[sourceIndex];
                if (!isPlainObject(source)) {
                    continue;
                }
                for (var key in source) {
                    if (isPlainObject(source[key])) {
                        target[key] = merge(isPlainObject(target[key]) ? target[key] : {}, source[key]);
                    } else {
                        target[key] = clone(source[key]);
                    }
                }
            }
            return target;
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

        function normalizeRows(value) {
            if (value === null || value === undefined) {
                return {
                    valid: true,
                    rows: []
                };
            }
            var values = Array.isArray(value) ? value : [value];
            for (var i = 0; i < values.length; i++) {
                if (!isPlainObject(values[i])) {
                    return {
                        valid: false,
                        rows: [],
                        error: 'setValue accepts an object or an array of objects.'
                    };
                }
            }
            return {
                valid: true,
                rows: clone(values)
            };
        }

        function metaValue(meta, lowerName, upperName) {
            return meta ? (meta[lowerName] !== undefined ? meta[lowerName] : meta[upperName]) : undefined;
        }

        function inferTable(rows, metaColumns) {
            var result = {
                labelField: null,
                valueFields: [],
                labels: [],
                series: []
            };
            if (!rows.length) {
                return result;
            }
            var keys = Object.keys(rows[0]);
            if (!keys.length) {
                return result;
            }
            for (var i = 0; i < keys.length; i++) {
                var type = String(metaValue(metaColumns && metaColumns[keys[i]], 'dataType', 'DataType') || '').toLowerCase();
                if (type === 'string' || type === 'date' || type === 'datetime') {
                    result.labelField = keys[i];
                    break;
                }
            }
            result.labelField = result.labelField || keys[0];
            for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                var key = keys[keyIndex];
                if (key === result.labelField) {
                    continue;
                }
                var dataType = String(metaValue(metaColumns && metaColumns[key], 'dataType', 'DataType') || '').toLowerCase();
                var isNumeric = dataType === 'number' || dataType === 'int' || dataType === 'integer' || dataType === 'decimal' || dataType === 'float';
                if (!dataType) {
                    isNumeric = rows.every(function (row) {
                        return row[key] === null || row[key] === undefined || row[key] === '' ||
                            (typeof row[key] === 'number' && isFinite(row[key])) ||
                            (typeof row[key] === 'string' && row[key].trim() !== '' && isFinite(Number(row[key])));
                    });
                }
                if (isNumeric) {
                    result.valueFields.push(key);
                }
            }
            if (!result.valueFields.length) {
                result.valueFields = keys.filter(function (key) {
                    return key !== result.labelField;
                });
            }
            result.labels = rows.map(function (row) {
                return row[result.labelField];
            });
            result.series = result.valueFields.map(function (field) {
                return {
                    field: field,
                    name: field,
                    data: rows.map(function (row) {
                        return row[field];
                    })
                };
            });
            return result;
        }

        function log(logScope, message, level) {
            if (syn.$l && syn.$l.eventLog) {
                syn.$l.eventLog(logScope, message && message.message ? message.message : String(message), level || 'Debug');
            }
        }

        function parseEvents(el) {
            var value = el ? el.getAttribute('syn-events') : null;
            if (!value) {
                return [];
            }
            try {
                var events = eval(value);
                return Array.isArray(events) ? events : [];
            } catch (error) {
                log(scope + '.parseEvents', error, 'Warning');
                return [];
            }
        }

        function emit(control, eventName, params) {
            var mod = window[syn.$w.pageScript];
            var handler = mod && mod.event ? mod.event[control.id + '_' + eventName] : null;
            if (handler) {
                handler.apply(syn.$l.get(control.id), [control.id, params, clone(control.selections || [])]);
            }
        }

        function selectionKey(selection) {
            return [selection.series.index, selection.point.dataType || '', selection.point.dataIndex].join('|');
        }

        function applySelection(control, selection) {
            if (!selection || control.config.selectionMode === 'none') {
                return {
                    changed: false,
                    selected: false
                };
            }
            var key = selectionKey(selection);
            var found = -1;
            for (var i = 0; i < control.selections.length; i++) {
                if (selectionKey(control.selections[i]) === key) {
                    found = i;
                    break;
                }
            }
            if (control.config.selectionMode === 'multiple' || control.config.selectionMode === 'native') {
                if (found > -1) {
                    control.selections.splice(found, 1);
                    return {
                        changed: true,
                        selected: false
                    };
                }
                control.selections.push(selection);
                return {
                    changed: true,
                    selected: true
                };
            }
            var changed = found < 0 || control.selections.length !== 1;
            control.selections = [selection];
            return {
                changed: changed,
                selected: true
            };
        }

        function selectedRows(control) {
            var rows = [];
            var seen = {};
            for (var i = 0; i < control.selections.length; i++) {
                var selection = control.selections[i];
                if (selection.row === null || selection.row === undefined) {
                    continue;
                }
                var key = selection.rowIndex > -1 ? 'index:' + selection.rowIndex : 'row:' + i;
                if (!seen[key]) {
                    rows.push(clone(selection.row));
                    seen[key] = true;
                }
            }
            return rows;
        }

        function serializeRows(rows, requestType, metaColumns) {
            if (requestType === 'Row') {
                rows = rows.length ? [rows[rows.length - 1]] : [];
            } else if (requestType !== 'List') {
                return [];
            }
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var transactionRow = [];
                if (metaColumns) {
                    for (var key in metaColumns) {
                        var meta = metaColumns[key] || {};
                        var fieldID = metaValue(meta, 'fieldID', 'FieldID') || key;
                        var dataType = metaValue(meta, 'dataType', 'DataType');
                        var value = row[key];
                        if (value === undefined && window.$object && $object.defaultValue) {
                            value = String(dataType || '').toLowerCase() === 'number' ? null : $object.defaultValue(dataType);
                        }
                        transactionRow.push({
                            prop: fieldID,
                            val: value
                        });
                    }
                } else {
                    for (var property in row) {
                        transactionRow.push({
                            prop: property,
                            val: row[property]
                        });
                    }
                }
                result.push(transactionRow);
            }
            return result;
        }

        return {
            clone: clone,
            merge: merge,
            resolveFunction: resolveFunction,
            normalizeRows: normalizeRows,
            inferTable: inferTable,
            parseEvents: parseEvents,
            log: log,
            emit: emit,
            selectionKey: selectionKey,
            applySelection: applySelection,
            selectedRows: selectedRows,
            serializeRows: serializeRows,
            getValue: function (control, requestType, metaColumns) {
                if (!control) {
                    return requestType ? [] : null;
                }
                var rows = selectedRows(control);
                if (!requestType) {
                    return control.config.selectionMode === 'multiple' || control.config.selectionMode === 'native' ?
                        rows : (rows[rows.length - 1] || null);
                }
                return serializeRows(rows, requestType, metaColumns || control.metaColumns);
            }
        };
    }

    var common = createChartCommon('$chartjs');

    if (window.Chart) {
        Chart.defaults.font.family = "Noto Sans KR, 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';
        Chart.defaults.plugins.legend.position = 'bottom';
    }

    // Chart.js date adapter backed by the locally bundled moment.js (/lib/moment.js/moment-with-locales.min.js).
    // Chart.js v4 requires a `_adapters._date` implementation for `scales: { x: { type: 'time' } }`; the npm package
    // `chartjs-adapter-moment` is not vendored in this repository (CDN/외부 패키지 다운로드 금지), so this reimplements
    // its small public surface directly against moment.js. Load order: moment.js -> Chart.js(UMD) -> this file.
    if (window.Chart && typeof moment !== 'undefined') {
        var DATE_ADAPTER_FORMATS = {
            datetime: 'MMM D, YYYY, h:mm:ss a',
            millisecond: 'h:mm:ss.SSS a',
            second: 'h:mm:ss a',
            minute: 'h:mm a',
            hour: 'hA',
            day: 'MMM D',
            week: 'll',
            month: 'MMM YYYY',
            quarter: '[Q]Q - YYYY',
            year: 'YYYY'
        };

        Chart._adapters._date.override({
            _id: 'moment',

            formats: function () {
                return DATE_ADAPTER_FORMATS;
            },

            parse: function (value, format) {
                if (value === null || typeof value === 'undefined') {
                    return null;
                }
                var type = typeof value;
                var result;
                if (type === 'number' || value instanceof Date) {
                    result = moment(value);
                }
                else if (type === 'string' && typeof format === 'string') {
                    result = moment(value, format);
                }
                else if (!(value instanceof moment)) {
                    result = moment(value);
                }
                else {
                    result = value;
                }
                return result.isValid() ? result.valueOf() : null;
            },

            format: function (time, format) {
                return moment(time).format(format);
            },

            add: function (time, amount, unit) {
                return moment(time).add(amount, unit).valueOf();
            },

            diff: function (max, min, unit) {
                return moment(max).diff(moment(min), unit);
            },

            startOf: function (time, unit, weekday) {
                var value = moment(time);
                if (unit === 'isoWeek') {
                    var isoWeekday = Math.trunc(Math.min(Math.max(0, weekday), 6));
                    return value.isoWeekday(isoWeekday).startOf('day').valueOf();
                }
                return value.startOf(unit).valueOf();
            },

            endOf: function (time, unit) {
                return moment(time).endOf(unit).valueOf();
            }
        });
    }

    function resolveRow(control, datasetIndex, dataIndex, activeElement, event) {
        var resolver = control.selectionResolver || common.resolveFunction(control.config.selectionResolver);
        if (resolver) {
            var resolved = resolver(activeElement, event, control.rawValue, control.chart, control);
            if (resolved === null || resolved === undefined) {
                return null;
            }
            if (typeof resolved === 'number') {
                return {
                    rowIndex: resolved,
                    row: control.rawValue[resolved] || null
                };
            }
            if (resolved.row !== undefined || resolved.rowIndex !== undefined) {
                var index = resolved.rowIndex !== undefined ? resolved.rowIndex : control.rawValue.indexOf(resolved.row);
                return {
                    rowIndex: index,
                    row: resolved.row !== undefined ? resolved.row : control.rawValue[index]
                };
            }
        }
        var rowIndex = dataIndex;
        if (control.rowIndexMap && control.rowIndexMap[datasetIndex] && control.rowIndexMap[datasetIndex][dataIndex] !== undefined) {
            rowIndex = control.rowIndexMap[datasetIndex][dataIndex];
        }
        var raw = control.chart.data.datasets[datasetIndex] && control.chart.data.datasets[datasetIndex].data[dataIndex];
        if (control.config.selectionKey && raw && typeof raw === 'object') {
            var selectedKey = raw[control.config.selectionKey];
            for (var i = 0; i < control.rawValue.length; i++) {
                if (control.rawValue[i] && control.rawValue[i][control.config.selectionKey] === selectedKey) {
                    rowIndex = i;
                    break;
                }
            }
        }
        return {
            rowIndex: rowIndex,
            row: control.rawValue[rowIndex] || null
        };
    }

    function parsedValue(chart, datasetIndex, dataIndex) {
        var meta = chart.getDatasetMeta(datasetIndex);
        var parsed = meta && meta.controller && meta.controller.getParsed ? meta.controller.getParsed(dataIndex) : null;
        if (parsed && parsed.y !== undefined) {
            return parsed.y;
        }
        if (parsed && parsed.r !== undefined) {
            return parsed.r;
        }
        if (parsed !== null && parsed !== undefined) {
            return parsed;
        }
        return chart.data.datasets[datasetIndex].data[dataIndex];
    }

    function makeSelection(control, datasetIndex, dataIndex, activeElement, event) {
        var resolved = resolveRow(control, datasetIndex, dataIndex, activeElement, event);
        if (!resolved) {
            return null;
        }
        var dataset = control.chart.data.datasets[datasetIndex];
        var raw = dataset.data[dataIndex];
        var meta = control.chart.getDatasetMeta(datasetIndex);
        var label = control.chart.data.labels && control.chart.data.labels[dataIndex];
        var value = parsedValue(control.chart, datasetIndex, dataIndex);
        return {
            series: {
                index: datasetIndex,
                id: dataset.id,
                name: dataset.label,
                type: dataset.type || meta.type || control.chart.config.type
            },
            point: {
                dataIndex: dataIndex,
                dataIndexInside: dataIndex,
                dataType: 'main',
                name: raw && raw.name !== undefined ? raw.name : label,
                value: value,
                data: common.clone(raw),
                color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[dataIndex] : dataset.backgroundColor
            },
            yData: value,
            rowIndex: resolved.rowIndex,
            row: resolved.row
        };
    }

    function handleClick(control, event, activeElements) {
        if (control.config.selectionMode === 'none') {
            return;
        }
        if (!activeElements.length) {
            if (control.config.clearSelectionOnBlank) {
                $chartjs.clearSelection(control.id);
            }
            return;
        }
        var active = activeElements[0];
        var selection = makeSelection(control, active.datasetIndex, active.index, active, event);
        common.emit(control, 'pointClick', {
            event: event,
            active: active,
            selection: selection
        });
        var result = common.applySelection(control, selection);
        if (result.changed) {
            common.emit(control, 'selectionChange', event);
        }
    }

    function chartConfig(control, setting) {
        var userOptions = common.merge({}, setting.options || {});
        var originalClick = userOptions.onClick;
        var originalHover = userOptions.onHover;
        userOptions.responsive = userOptions.responsive !== false;
        userOptions.maintainAspectRatio = userOptions.maintainAspectRatio === undefined ? false : userOptions.maintainAspectRatio;
        userOptions.animation = userOptions.animation === undefined ? false : userOptions.animation;
        userOptions.plugins = common.merge({
            legend: {
                display: true,
                position: 'bottom'
            },
            tooltip: {
                mode: 'nearest',
                intersect: false
            }
        }, userOptions.plugins || {});
        userOptions.interaction = common.merge({
            mode: setting.interactionMode,
            intersect: setting.intersect
        }, userOptions.interaction || {});
        userOptions.onClick = function (event, activeElements, chart) {
            handleClick(control, event, activeElements || []);
            if (originalClick) {
                originalClick(event, activeElements, chart);
            }
            common.emit(control, 'click', {
                event: event,
                active: activeElements || [],
                chart: chart
            });
        };
        userOptions.onHover = function (event, activeElements, chart) {
            if (originalHover) {
                originalHover(event, activeElements, chart);
            }
            if (activeElements && activeElements.length) {
                common.emit(control, 'pointHover', {
                    event: event,
                    active: activeElements,
                    chart: chart
                });
            }
        };
        return {
            type: setting.type || 'line',
            data: common.clone(setting.data || {
                labels: [],
                datasets: []
            }),
            options: userOptions,
            plugins: setting.plugins || []
        };
    }

    function createChart(control, setting) {
        control.chart = new Chart(control.canvas, chartConfig(control, setting));
        common.emit(control, 'initialized', {
            chart: control.chart
        });
        return control.chart;
    }

    function legacyData(control, rows) {
        var labelID = control.config.labelID;
        var seriesSettings = control.config.series || [];
        var keys = rows.length ? Object.keys(rows[0]) : [];
        var fields = seriesSettings.length ? seriesSettings.map(function (item) {
            return item.columnID;
        }) : keys.filter(function (key) {
            return key !== labelID;
        });
        var labels = rows.map(function (row) {
            return row[labelID];
        });
        var rowIndexMap = [];
        var datasets = fields.map(function (field) {
            var series = seriesSettings.find(function (item) {
                return item.columnID === field;
            }) || {};
            var dataset = common.merge({}, series.options || {}, series);
            delete dataset.columnID;
            delete dataset.options;
            delete dataset.dataType;
            dataset.label = series.label || field;
            dataset.data = rows.map(function (row) {
                return row[field];
            });
            if (dataset.fill === undefined) {
                dataset.fill = false;
            }
            rowIndexMap.push(rows.map(function (row, index) {
                return index;
            }));
            return dataset;
        });
        return {
            config: {
                data: {
                    labels: labels,
                    datasets: datasets
                }
            },
            rowIndexMap: rowIndexMap
        };
    }

    function inferredData(rows, metaColumns) {
        var table = common.inferTable(rows, metaColumns);
        var rowIndexMap = [];
        var datasets = table.series.map(function (item) {
            rowIndexMap.push(rows.map(function (row, index) {
                return index;
            }));
            return {
                label: item.name,
                data: item.data,
                fill: false
            };
        });
        return {
            config: {
                data: {
                    labels: table.labels,
                    datasets: datasets
                }
            },
            rowIndexMap: rowIndexMap
        };
    }

    function applyConfig(control, patch) {
        patch = patch || {};
        if (patch.type && patch.type !== control.chart.config.type) {
            var nextSetting = common.merge({}, control.config, patch);
            control.chart.destroy();
            control.config.type = patch.type;
            control.config.data = patch.data || control.config.data;
            control.config.options = common.merge({}, control.config.options, patch.options || {});
            return createChart(control, nextSetting);
        }
        if (patch.data) {
            control.chart.data.labels = common.clone(patch.data.labels || []);
            control.chart.data.datasets = common.clone(patch.data.datasets || []);
        }
        if (patch.options) {
            control.config.options = common.merge({}, control.config.options, patch.options);
            var nextSetting = common.merge({}, control.config, {
                data: common.clone(control.chart.data),
                options: control.config.options
            });
            control.chart.destroy();
            return createChart(control, nextSetting);
        }
        control.chart.update();
        return control.chart;
    }

    $chartjs.extend({
        name: 'syn.uicontrols.$chartjs',
        version: 'v2026.7.26',
        chartControls: [],
        defaultSetting: {
            width: '100%',
            height: '320px',
            labelID: '',
            series: [],
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {},
            plugins: [],
            dataAdapter: null,
            selectionResolver: null,
            selectionMode: 'single',
            selectionKey: null,
            clearSelectionOnBlank: true,
            interactionMode: 'nearest',
            intersect: true,
            autoResize: true,
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
            if (!el || !window.Chart) {
                common.log('$chartjs.controlLoad', 'Chart.js is not loaded.', 'Error');
                return;
            }
            setting = common.merge({}, $chartjs.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = common.merge(setting, mod.hook.controlInit(elID, setting));
            }
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;
            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var wrapper = document.createElement('div');
            wrapper.className = 'chart-container syn-chartjs';
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            wrapper.style.position = 'relative';
            var canvas = document.createElement('canvas');
            canvas.id = elID;
            wrapper.appendChild(canvas);
            var loading = document.createElement('div');
            loading.className = 'syn-chartjs-loading';
            loading.style.display = 'none';
            wrapper.appendChild(loading);
            el.parentNode.insertBefore(wrapper, el.nextSibling);

            var control = {
                id: elID,
                element: wrapper,
                canvas: canvas,
                loadingElement: loading,
                chart: null,
                config: setting,
                rawValue: [],
                metaColumns: null,
                selections: [],
                rowIndexMap: null,
                selectionResolver: common.resolveFunction(setting.selectionResolver),
                eventNames: common.parseEvents(el),
                resizeObserver: null
            };
            $chartjs.chartControls.push(control);
            try {
                createChart(control, setting);
                if (setting.autoResize && window.ResizeObserver) {
                    control.resizeObserver = new ResizeObserver(function () {
                        if (control.chart) {
                            control.chart.resize();
                            common.emit(control, 'resized', {
                                source: 'ResizeObserver'
                            });
                        }
                    });
                    control.resizeObserver.observe(wrapper);
                }
            } catch (error) {
                common.log('$chartjs.controlLoad', error, 'Error');
                common.emit(control, 'error', error);
            }
        },

        getControl: function (elID) {
            return $chartjs.chartControls.find(function (control) {
                return control.id === elID;
            }) || null;
        },
        getChartControl: function (elID) {
            return $chartjs.getControl(elID);
        },
        getChartInstance: function (elID) {
            var control = $chartjs.getControl(elID);
            return control ? control.chart : null;
        },

        setValue: function (elID, value, metaColumns) {
            var control = $chartjs.getControl(elID);
            if (!control || !control.chart) {
                return Promise.resolve(null);
            }
            var normalized = common.normalizeRows(value);
            if (!normalized.valid) {
                common.log('$chartjs.setValue', normalized.error, 'Warning');
                return Promise.resolve(null);
            }
            var rows = normalized.rows;
            var adapter = common.resolveFunction(control.config.dataAdapter);
            var operation;
            if (adapter) {
                operation = Promise.resolve(adapter(rows, metaColumns, control.chart.config, control)).then(function (adapted) {
                    var envelope = adapted && adapted.config ? adapted : {
                        config: adapted || {}
                    };
                    control.rowIndexMap = envelope.rowIndexMap || null;
                    control.selectionResolver = common.resolveFunction(envelope.selectionResolver) || envelope.selectionResolver || control.selectionResolver;
                    return envelope.config;
                });
            } else {
                var mapped = control.config.labelID ? legacyData(control, rows) : inferredData(rows, metaColumns);
                control.rowIndexMap = mapped.rowIndexMap;
                operation = Promise.resolve(mapped.config);
            }
            return operation.then(function (config) {
                applyConfig(control, config);
                control.rawValue = rows;
                control.metaColumns = metaColumns || null;
                control.selections = [];
                common.emit(control, 'dataBound', {
                    rows: common.clone(rows),
                    config: config
                });
                return control.chart;
            }).catch(function (error) {
                common.log('$chartjs.setValue', error, 'Error');
                common.emit(control, 'error', error);
                return null;
            });
        },

        getValue: function (elID, requestType, metaColumns) {
            return common.getValue($chartjs.getControl(elID), requestType, metaColumns);
        },
        getRawValue: function (elID) {
            var control = $chartjs.getControl(elID);
            return control ? common.clone(control.rawValue) : [];
        },
        getSelection: function (elID) {
            var control = $chartjs.getControl(elID);
            return control ? common.clone(control.selections) : [];
        },
        getSelectedRows: function (elID) {
            var control = $chartjs.getControl(elID);
            return control ? common.selectedRows(control) : [];
        },
        getChartData: function (elID) {
            var chart = $chartjs.getChartInstance(elID);
            return chart ? common.clone(chart.data) : null;
        },

        setSelection: function (elID, selections) {
            var control = $chartjs.getControl(elID);
            if (!control || !control.chart || control.config.selectionMode === 'none') {
                return;
            }
            control.selections = [];
            var values = Array.isArray(selections) ? selections : [selections];
            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                if (value === null || value === undefined) {
                    continue;
                }
                var datasetIndex = typeof value === 'number' ? 0 : value.seriesIndex;
                var dataIndex = typeof value === 'number' ? value : value.dataIndex;
                var selection = value.point && value.row !== undefined ? value :
                    (typeof dataIndex === 'number' ? makeSelection(control, datasetIndex || 0, dataIndex, null, {
                        source: 'setSelection'
                    }) : null);
                if (selection) {
                    control.selections.push(selection);
                    if (control.config.selectionMode === 'single') {
                        break;
                    }
                }
            }
            common.emit(control, 'selectionChange', {
                source: 'setSelection'
            });
        },
        clearSelection: function (elID, silent) {
            var control = $chartjs.getControl(elID);
            if (!control) {
                return;
            }
            control.selections = [];
            if (!silent) {
                common.emit(control, 'selectionChange', {
                    source: 'clearSelection'
                });
            }
        },

        setConfig: function (elID, config) {
            var control = $chartjs.getControl(elID);
            return control ? applyConfig(control, config) : null;
        },
        setData: function (elID, data) {
            return $chartjs.setConfig(elID, {
                data: data
            });
        },
        update: function (elID, mode) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.update(mode);
            }
        },
        render: function (elID) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.render();
            }
        },
        reset: function (elID) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.reset();
            }
        },
        stop: function (elID) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.stop();
            }
        },
        setActiveElements: function (elID, activeElements) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.setActiveElements(activeElements || []);
                chart.update();
            }
        },
        toggleDataVisibility: function (elID, index) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.toggleDataVisibility(index);
                chart.update();
            }
        },
        getDatasetMeta: function (elID, datasetIndex) {
            var chart = $chartjs.getChartInstance(elID);
            return chart ? chart.getDatasetMeta(datasetIndex) : null;
        },
        register: function () {
            return Chart.register.apply(Chart, arguments);
        },
        unregister: function () {
            return Chart.unregister.apply(Chart, arguments);
        },
        resize: function (elID, width, height) {
            var control = $chartjs.getControl(elID);
            if (control && control.chart) {
                control.chart.resize(width, height);
                common.emit(control, 'resized', {
                    width: width,
                    height: height
                });
            }
        },
        setControlSize: function (elID, width, height) {
            var control = $chartjs.getControl(elID);
            if (control) {
                if (width !== undefined) {
                    control.element.style.width = typeof width === 'number' ? width + 'px' : width;
                }
                if (height !== undefined) {
                    control.element.style.height = typeof height === 'number' ? height + 'px' : height;
                }
                control.chart.resize();
            }
        },
        showLoading: function (elID, text) {
            var control = $chartjs.getControl(elID);
            if (control) {
                control.loadingElement.textContent = text || 'Loading...';
                control.loadingElement.style.display = 'flex';
            }
        },
        hideLoading: function (elID) {
            var control = $chartjs.getControl(elID);
            if (control) {
                control.loadingElement.style.display = 'none';
            }
        },
        clear: function (elID) {
            var control = $chartjs.getControl(elID);
            if (control && control.chart) {
                control.chart.data.labels = [];
                control.chart.data.datasets = [];
                control.rawValue = [];
                control.selections = [];
                control.chart.update();
            }
        },
        dispose: function (elID) {
            var control = $chartjs.getControl(elID);
            if (!control) {
                return;
            }
            common.emit(control, 'disposed', {});
            if (control.resizeObserver) {
                control.resizeObserver.disconnect();
            }
            if (control.chart) {
                control.chart.destroy();
            }
            var index = $chartjs.chartControls.indexOf(control);
            if (index > -1) {
                $chartjs.chartControls.splice(index, 1);
            }
        },
        getDataURL: function (elID, type, quality) {
            var chart = $chartjs.getChartInstance(elID);
            return chart ? chart.toBase64Image(type || 'image/png', quality) : null;
        },
        toImage: function (elID, fileID, type, quality) {
            var dataURL = $chartjs.getDataURL(elID, type, quality);
            if (!dataURL) {
                return null;
            }
            var anchor = document.createElement('a');
            anchor.href = dataURL;
            anchor.download = (fileID || elID) + '.png';
            anchor.click();
            return dataURL;
        },
        setLocale: function (elID, locale) {
            var chart = $chartjs.getChartInstance(elID);
            if (chart) {
                chart.options.locale = locale;
                chart.update();
            }
        }
    });

    syn.uicontrols.$chartjs = $chartjs;
})(window);
