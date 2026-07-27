/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $chart = syn.uicontrols.$chart || new syn.module();

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
                    }
                    else {
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
                return { valid: true, rows: [] };
            }
            var values = Array.isArray(value) ? value : [value];
            for (var i = 0; i < values.length; i++) {
                if (!isPlainObject(values[i])) {
                    return { valid: false, rows: [], error: 'setValue accepts an object or an array of objects.' };
                }
            }
            return { valid: true, rows: clone(values) };
        }

        function metaValue(meta, lowerName, upperName) {
            return meta ? (meta[lowerName] !== undefined ? meta[lowerName] : meta[upperName]) : undefined;
        }

        function inferTable(rows, metaColumns) {
            var result = { labelField: null, valueFields: [], labels: [], series: [] };
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
                result.valueFields = keys.filter(function (key) { return key !== result.labelField; });
            }
            result.labels = rows.map(function (row) { return row[result.labelField]; });
            result.series = result.valueFields.map(function (field) {
                return { field: field, name: field, data: rows.map(function (row) { return row[field]; }) };
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
            }
            catch (error) {
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
                return { changed: false, selected: false };
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
                    return { changed: true, selected: false };
                }
                control.selections.push(selection);
                return { changed: true, selected: true };
            }
            var changed = found < 0 || control.selections.length !== 1;
            control.selections = [selection];
            return { changed: changed, selected: true };
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
            }
            else if (requestType !== 'List') {
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
                        transactionRow.push({ prop: fieldID, val: value });
                    }
                }
                else {
                    for (var property in row) {
                        transactionRow.push({ prop: property, val: row[property] });
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
                    return control.config.selectionMode === 'multiple' || control.config.selectionMode === 'native'
                        ? rows : (rows[rows.length - 1] || null);
                }
                return serializeRows(rows, requestType, metaColumns || control.metaColumns);
            }
        };
    }

    var common = createChartCommon('$chart');

    var moduleDefinitions = {
        more: { path: 'highcharts-more.min.js' },
        '3d': { path: 'highcharts-3d.min.js' },
        stock: { path: 'modules/stock.min.js' },
        map: { path: 'modules/map.min.js' },
        gantt: { path: 'modules/gantt.min.js', dependencies: ['stock'] },
        accessibility: { path: 'modules/accessibility.min.js' },
        annotations: { path: 'modules/annotations.min.js' },
        'annotations-advanced': { path: 'modules/annotations-advanced.min.js', dependencies: ['annotations'] },
        'arc-diagram': { path: 'modules/arc-diagram.min.js', dependencies: ['sankey'] },
        'arrow-symbols': { path: 'modules/arrow-symbols.min.js' },
        boost: { path: 'modules/boost.min.js' },
        'boost-canvas': { path: 'modules/boost-canvas.min.js', dependencies: ['boost'] },
        'broken-axis': { path: 'modules/broken-axis.min.js' },
        bullet: { path: 'modules/bullet.min.js' },
        coloraxis: { path: 'modules/coloraxis.min.js' },
        'current-date-indicator': { path: 'modules/current-date-indicator.min.js' },
        cylinder: { path: 'modules/cylinder.min.js', dependencies: ['3d'] },
        data: { path: 'modules/data.min.js' },
        'data-tools': { path: 'modules/data-tools.min.js', dependencies: ['data'] },
        datagrouping: { path: 'modules/datagrouping.min.js' },
        debugger: { path: 'modules/debugger.min.js' },
        'dependency-wheel': { path: 'modules/dependency-wheel.min.js', dependencies: ['sankey'] },
        dotplot: { path: 'modules/dotplot.min.js' },
        'drag-panes': { path: 'modules/drag-panes.min.js' },
        'draggable-points': { path: 'modules/draggable-points.min.js' },
        dumbbell: { path: 'modules/dumbbell.min.js', dependencies: ['more'] },
        flowmap: { path: 'modules/flowmap.min.js', dependencies: ['map'] },
        'full-screen': { path: 'modules/full-screen.min.js' },
        funnel: { path: 'modules/funnel.min.js' },
        funnel3d: { path: 'modules/funnel3d.min.js', dependencies: ['funnel', 'cylinder', '3d'] },
        geoheatmap: { path: 'modules/geoheatmap.min.js', dependencies: ['map', 'heatmap'] },
        'grid-axis': { path: 'modules/grid-axis.min.js' },
        heatmap: { path: 'modules/heatmap.min.js' },
        heikinashi: { path: 'modules/heikinashi.min.js', dependencies: ['stock'] },
        'histogram-bellcurve': { path: 'modules/histogram-bellcurve.min.js' },
        hollowcandlestick: { path: 'modules/hollowcandlestick.min.js', dependencies: ['stock'] },
        'item-series': { path: 'modules/item-series.min.js' },
        lollipop: { path: 'modules/lollipop.min.js', dependencies: ['dumbbell'] },
        'marker-clusters': { path: 'modules/marker-clusters.min.js' },
        'mouse-wheel-zoom': { path: 'modules/mouse-wheel-zoom.min.js' },
        navigator: { path: 'modules/navigator.min.js' },
        networkgraph: { path: 'modules/networkgraph.min.js' },
        organization: { path: 'modules/organization.min.js', dependencies: ['sankey'] },
        'overlapping-datalabels': { path: 'modules/overlapping-datalabels.min.js' },
        'parallel-coordinates': { path: 'modules/parallel-coordinates.min.js' },
        pareto: { path: 'modules/pareto.min.js' },
        pictorial: { path: 'modules/pictorial.min.js' },
        pathfinder: { path: 'modules/pathfinder.min.js' },
        'pattern-fill': { path: 'modules/pattern-fill.min.js' },
        'price-indicator': { path: 'modules/price-indicator.min.js', dependencies: ['stock'] },
        pyramid3d: { path: 'modules/pyramid3d.min.js', dependencies: ['funnel3d'] },
        sankey: { path: 'modules/sankey.min.js' },
        'series-label': { path: 'modules/series-label.min.js' },
        'series-on-point': { path: 'modules/series-on-point.min.js' },
        sonification: { path: 'modules/sonification.min.js' },
        'solid-gauge': { path: 'modules/solid-gauge.min.js', dependencies: ['more'] },
        streamgraph: { path: 'modules/streamgraph.min.js' },
        'static-scale': { path: 'modules/static-scale.min.js' },
        indicators: { path: 'indicators/indicators.min.js', dependencies: ['stock'] },
        'indicators-all': { path: 'indicators/indicators-all.min.js', dependencies: ['stock'] },
        'stock-tools': {
            path: 'modules/stock-tools.min.js',
            dependencies: ['stock', 'indicators-all', 'drag-panes', 'annotations-advanced', 'price-indicator', 'full-screen'],
            styles: ['css/stocktools/gui.min.css', 'css/annotations/popup.min.css']
        },
        'styled-mode': { styles: ['css/highcharts.min.css'] },
        sunburst: { path: 'modules/sunburst.min.js', dependencies: ['treemap'] },
        tiledwebmap: { path: 'modules/tiledwebmap.min.js', dependencies: ['map'] },
        tilemap: { path: 'modules/tilemap.min.js', dependencies: ['heatmap'] },
        timeline: { path: 'modules/timeline.min.js' },
        treegraph: { path: 'modules/treegraph.min.js', dependencies: ['treemap'] },
        treegrid: { path: 'modules/treegrid.min.js' },
        treemap: { path: 'modules/treemap.min.js' },
        textpath: { path: 'modules/textpath.min.js' },
        'variable-pie': { path: 'modules/variable-pie.min.js' },
        variwide: { path: 'modules/variwide.min.js' },
        vector: { path: 'modules/vector.min.js', dependencies: ['more'] },
        venn: { path: 'modules/venn.min.js' },
        windbarb: { path: 'modules/windbarb.min.js', dependencies: ['more'] },
        wordcloud: { path: 'modules/wordcloud.min.js' },
        xrange: { path: 'modules/xrange.min.js' },
        exporting: { path: 'modules/exporting.min.js' },
        'export-data': { path: 'modules/export-data.min.js', dependencies: ['exporting'] },
        'offline-exporting': { path: 'modules/offline-exporting.min.js', dependencies: ['exporting'] },
        drilldown: { path: 'modules/drilldown.min.js' },
        'no-data-to-display': { path: 'modules/no-data-to-display.min.js' }
    };

    var typeModules = {
        arearange: 'more', areasplinerange: 'more', boxplot: 'more', bubble: 'more', columnpyramid: 'more',
        columnrange: 'more', errorbar: 'more', gauge: 'more', packedbubble: 'more', polygon: 'more', waterfall: 'more',
        solidgauge: 'solid-gauge', bullet: 'bullet', cylinder: 'cylinder', dependencywheel: 'dependency-wheel',
        dotplot: 'dotplot', dumbbell: 'dumbbell', lollipop: 'lollipop', flowmap: 'flowmap', funnel: 'funnel',
        pyramid: 'funnel', funnel3d: 'funnel3d', pyramid3d: 'pyramid3d', heatmap: 'heatmap', histogram: 'histogram-bellcurve',
        bellcurve: 'histogram-bellcurve', item: 'item-series', map: 'map', mapbubble: 'map', mapline: 'map', mappoint: 'map',
        networkgraph: 'networkgraph', organization: 'organization', pareto: 'pareto', pictorial: 'pictorial', sankey: 'sankey',
        streamgraph: 'streamgraph', sunburst: 'sunburst', tiledwebmap: 'tiledwebmap', tilemap: 'tilemap', timeline: 'timeline',
        treegraph: 'treegraph', treemap: 'treemap', variablepie: 'variable-pie', variwide: 'variwide', vector: 'vector',
        venn: 'venn', windbarb: 'windbarb', wordcloud: 'wordcloud', xrange: 'xrange', gantt: 'gantt',
        arcdiagram: 'arc-diagram', geoheatmap: 'geoheatmap', scatter3d: '3d', candlestick: 'stock', hlc: 'stock', ohlc: 'stock', flags: 'stock',
        heikinashi: 'heikinashi', hollowcandlestick: 'hollowcandlestick'
    };

    var indicatorTypes = [
        'abands', 'ad', 'ao', 'apo', 'aroon', 'aroonoscillator', 'atr', 'bb', 'cci', 'chaikin', 'cmf', 'cmo',
        'dema', 'disparityindex', 'dmi', 'dpo', 'ema', 'ikh', 'keltnerchannels', 'klinger', 'linearregression',
        'linearregressionangle', 'linearregressionintercept', 'linearregressionslope', 'macd', 'mfi', 'momentum',
        'natr', 'obv', 'pivotpoints', 'ppo', 'pc', 'pricechannel', 'priceenvelopes', 'psar', 'roc', 'rsi', 'slowstochastic',
        'sma', 'stochastic', 'supertrend', 'tema', 'trendline', 'trix', 'vbp', 'vwap', 'williamsr', 'wma', 'zigzag'
    ];
    indicatorTypes.forEach(function (type) { typeModules[type] = 'indicators-all'; });

    var moduleAliases = {
        'highcharts-more': 'more', 'highcharts-3d': '3d', highstock: 'stock', highmaps: 'map',
        'highcharts-gantt': 'gantt', 'modules/stock': 'stock', 'modules/map': 'map', 'modules/gantt': 'gantt',
        'indicators/indicators': 'indicators', 'indicators/indicators-all': 'indicators-all',
        styledmode: 'styled-mode', 'css/highcharts': 'styled-mode'
    };

    function normalizeModuleName(name) {
        name = String(name || '').replace(/\.min\.js$|\.js$/i, '').replace(/^\.\//, '');
        var lowerName = name.toLowerCase();
        if (lowerName.indexOf('modules/') === 0 && moduleDefinitions[lowerName.substring(8)]) {
            return lowerName.substring(8);
        }
        return moduleAliases[lowerName] || lowerName;
    }

    function moduleUrl(path) {
        var root = '/lib/highcharts/';
        if (syn.Config && syn.Config.DomainBaseUrl && syn.Config.DomainBaseUrl !== location.origin) {
            root = syn.Config.DomainBaseUrl.replace(/\/$/, '') + (syn.$w.proxyBasePath || '') + root;
        }
        else if (syn.Config && syn.Config.ProxyPathName) {
            root = (syn.$w.proxyBasePath || '') + root;
        }
        return root + path;
    }

    function loadStyle(path) {
        if ($chart.loadedStyles[path]) {
            return Promise.resolve();
        }
        if ($chart.stylePromises[path]) {
            return $chart.stylePromises[path];
        }
        $chart.stylePromises[path] = new Promise(function (resolve, reject) {
            var id = 'syn-highcharts-style-' + path.replace(/[^a-z0-9_-]/gi, '-');
            var existing = document.getElementById(id);
            if (existing) {
                $chart.loadedStyles[path] = true;
                resolve();
                return;
            }
            var link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = moduleUrl(path);
            link.onload = function () {
                $chart.loadedStyles[path] = true;
                resolve();
            };
            link.onerror = function () {
                delete $chart.stylePromises[path];
                reject(new Error('Failed to load Highcharts stylesheet: ' + path));
            };
            document.head.appendChild(link);
        });
        return $chart.stylePromises[path];
    }

    function loadScript(name) {
        name = normalizeModuleName(name);
        if ($chart.loadedModules[name]) {
            return Promise.resolve();
        }
        if ($chart.modulePromises[name]) {
            return $chart.modulePromises[name];
        }
        var definition = moduleDefinitions[name];
        if (!definition && /^(modules|indicators)\/[a-z0-9_-]+$/i.test(name)) {
            definition = { path: name + '.min.js' };
        }
        if (!definition) {
            return Promise.reject(new Error('Unknown Highcharts module: ' + name));
        }
        var styles = definition.styles || [];
        $chart.modulePromises[name] = Promise.all(styles.map(loadStyle)).then(function () {
            if (!definition.path) {
                $chart.loadedModules[name] = true;
                return;
            }
            return new Promise(function (resolve, reject) {
                var id = 'syn-highcharts-' + name.replace(/[^a-z0-9_-]/gi, '-');
                var existing = document.getElementById(id);
                if (existing) {
                    $chart.loadedModules[name] = true;
                    resolve();
                    return;
                }
                var script = document.createElement('script');
                script.id = id;
                script.src = moduleUrl(definition.path);
                script.onload = function () {
                    $chart.loadedModules[name] = true;
                    resolve();
                };
                script.onerror = function () {
                    delete $chart.modulePromises[name];
                    reject(new Error('Failed to load Highcharts module: ' + name));
                };
                document.head.appendChild(script);
            });
        }).catch(function (error) {
            delete $chart.modulePromises[name];
            throw error;
        });
        return $chart.modulePromises[name];
    }

    function expandModules(names, result, visiting) {
        result = result || [];
        visiting = visiting || {};
        for (var i = 0; i < names.length; i++) {
            var name = normalizeModuleName(names[i]);
            if (!name || result.indexOf(name) > -1) {
                continue;
            }
            if (!moduleDefinitions[name] && !/^(modules|indicators)\/[a-z0-9_-]+$/i.test(name)) {
                throw new Error('Unknown Highcharts module: ' + name);
            }
            if (visiting[name]) {
                throw new Error('Circular Highcharts module dependency: ' + name);
            }
            visiting[name] = true;
            var definition = moduleDefinitions[name] || { dependencies: [] };
            expandModules(definition.dependencies || [], result, visiting);
            delete visiting[name];
            if (result.indexOf(name) < 0) {
                result.push(name);
            }
        }
        return result;
    }

    function normalizeConstructorType(value) {
        var name = String(value || 'chart').toLowerCase().replace(/[-_\s]/g, '');
        if (name === 'stock' || name === 'highstock' || name === 'stockchart') { return 'stockChart'; }
        if (name === 'map' || name === 'maps' || name === 'highmaps' || name === 'mapchart') { return 'mapChart'; }
        if (name === 'gantt' || name === 'highchartsgantt' || name === 'ganttchart') { return 'ganttChart'; }
        return 'chart';
    }

    function usesPatternFill(value, seen) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        seen = seen || [];
        if (seen.indexOf(value) > -1) {
            return false;
        }
        seen.push(value);
        if (!Array.isArray(value) && value.pattern && typeof value.pattern === 'object') {
            return true;
        }
        var keys = Array.isArray(value) ? value.map(function (_, index) { return index; }) : Object.keys(value);
        for (var i = 0; i < keys.length; i++) {
            if (usesPatternFill(value[keys[i]], seen)) {
                return true;
            }
        }
        return false;
    }

    function requiredModules(config, option, extraModules) {
        var modules = (config.modules || []).concat(extraModules || []).map(normalizeModuleName);
        var constructorType = normalizeConstructorType(config.constructorType).toLowerCase();
        if (constructorType === 'stockchart') { modules.push('stock'); }
        if (constructorType === 'mapchart') { modules.push('map'); }
        if (constructorType === 'ganttchart') { modules.push('gantt'); }
        if (option && option.chart && option.chart.styledMode) { modules.push('styled-mode'); }
        if (option && option.chart && option.chart.options3d && option.chart.options3d.enabled) { modules.push('3d'); }
        if (option && option.chart && option.chart.polar) { modules.push('more'); }
        if (option && option.chart && option.chart.parallelCoordinates) { modules.push('parallel-coordinates'); }
        if (option && option.chart && option.chart.zooming && option.chart.zooming.mouseWheel) { modules.push('mouse-wheel-zoom'); }
        if (option && option.data) { modules.push('data'); }
        if (option && option.accessibility) { modules.push('accessibility'); }
        if (option && option.annotations) { modules.push('annotations'); }
        if (option && option.boost) { modules.push('boost'); }
        if (option && option.colorAxis) { modules.push('coloraxis'); }
        if (option && option.drilldown) { modules.push('drilldown'); }
        if (option && option.exporting) { modules.push('exporting'); }
        if (option && option.noData) { modules.push('no-data-to-display'); }
        if (option && (option.mapNavigation || option.mapView)) { modules.push('map'); }
        if (option && option.sonification) { modules.push('sonification'); }
        if (option && option.stockTools) { modules.push('stock-tools'); }
        if (usesPatternFill(option)) { modules.push('pattern-fill'); }
        if (option && option.navigator && constructorType !== 'stockchart' && constructorType !== 'ganttchart') { modules.push('navigator'); }
        var series = [];
        function appendSeries(value) {
            if (Array.isArray(value)) { series = series.concat(value); }
            else if (value) { series.push(value); }
        }
        appendSeries(option && option.series);
        appendSeries(option && option.drilldown && option.drilldown.series);
        appendSeries(option && option.navigator && option.navigator.series);
        var chartSeriesType = String(option && option.chart && option.chart.type || '').toLowerCase();
        if (typeModules[chartSeriesType]) { modules.push(typeModules[chartSeriesType]); }
        for (var i = 0; i < series.length; i++) {
            var type = String(series[i].type || (option.chart && option.chart.type) || '').toLowerCase();
            if (typeModules[type]) {
                modules.push(typeModules[type]);
            }
            if (series[i].onPoint) { modules.push('series-on-point'); }
            if (series[i].dataLabels && series[i].dataLabels.textPath) { modules.push('textpath'); }
            if (series[i].boostThreshold !== undefined) { modules.push('boost'); }
            if (series[i].cluster) { modules.push('marker-clusters'); }
            if (series[i].dragDrop) { modules.push('draggable-points'); }
            if (series[i].label) { modules.push('series-label'); }
            if (series[i].lastPrice || series[i].lastVisiblePrice) { modules.push('price-indicator'); }
        }
        var plotOptions = option && option.plotOptions;
        if (plotOptions) {
            Object.keys(plotOptions).forEach(function (type) {
                if (typeModules[type.toLowerCase()]) { modules.push(typeModules[type.toLowerCase()]); }
                var plotOption = plotOptions[type] || {};
                if (plotOption.boostThreshold !== undefined) { modules.push('boost'); }
                if (plotOption.cluster) { modules.push('marker-clusters'); }
                if (plotOption.dragDrop) { modules.push('draggable-points'); }
                if (plotOption.label) { modules.push('series-label'); }
            });
        }
        ['xAxis', 'yAxis'].forEach(function (axisName) {
            var axes = option && option[axisName];
            axes = Array.isArray(axes) ? axes : (axes ? [axes] : []);
            axes.forEach(function (axis) {
                if (axis.breaks) { modules.push('broken-axis'); }
                if (axis.currentDateIndicator) { modules.push('current-date-indicator'); }
                if (axis.staticScale) { modules.push('static-scale'); }
                if (axis.grid && axis.grid.enabled !== false) { modules.push('grid-axis'); }
            });
        });
        modules = modules.map(normalizeModuleName).filter(function (name, index, values) { return name && values.indexOf(name) === index; });
        var expanded = expandModules(modules);
        ['boost-canvas', 'boost'].forEach(function (name) {
            var index = expanded.indexOf(name);
            if (index > -1) {
                expanded.splice(index, 1);
                expanded.push(name);
            }
        });
        return expanded;
    }

    function ensureModules(control, option, extraModules) {
        var names;
        try {
            names = requiredModules(control.config, option || {}, extraModules);
        }
        catch (error) {
            return Promise.reject(error);
        }
        var promise = Promise.resolve();
        names.forEach(function (name) {
            promise = promise.then(function () { return loadScript(name); });
        });
        return promise.then(function () {
            refreshChartModuleDefaults(control);
        });
    }

    function refreshChartModuleDefaults(control) {
        if (control && control.chart && Highcharts.getOptions) {
            control.chart.options = Highcharts.merge({}, Highcharts.getOptions(), control.chart.options || {});
            if ($chart.loadedModules['stock-tools']) {
                control.chart.options.navigation = control.chart.options.navigation || {};
                control.chart.options.navigation.iconsURL = control.chart.options.navigation.iconsURL || moduleUrl('gfx/stock-icons/');
            }
        }
    }

    function resolveRow(control, point, event) {
        var resolver = control.selectionResolver || common.resolveFunction(control.config.selectionResolver);
        if (resolver) {
            var resolved = resolver(point, event, control.rawValue, control.chart, control);
            if (resolved === null || resolved === undefined) {
                return null;
            }
            if (typeof resolved === 'number') {
                return { rowIndex: resolved, row: control.rawValue[resolved] || null };
            }
            if (resolved.row !== undefined || resolved.rowIndex !== undefined) {
                var resolvedIndex = resolved.rowIndex !== undefined ? resolved.rowIndex : control.rawValue.indexOf(resolved.row);
                return { rowIndex: resolvedIndex, row: resolved.row !== undefined ? resolved.row : control.rawValue[resolvedIndex] };
            }
        }
        var custom = point.options && point.options.custom;
        var rowIndex = custom && typeof custom.handstackRowIndex === 'number' ? custom.handstackRowIndex : point.index;
        if (control.rowIndexMap && control.rowIndexMap[point.series.index] && control.rowIndexMap[point.series.index][point.index] !== undefined) {
            rowIndex = control.rowIndexMap[point.series.index][point.index];
        }
        if (control.config.selectionKey && point.options && typeof point.options === 'object') {
            var selectedKey = point.options[control.config.selectionKey];
            for (var i = 0; i < control.rawValue.length; i++) {
                if (control.rawValue[i] && control.rawValue[i][control.config.selectionKey] === selectedKey) {
                    rowIndex = i;
                    break;
                }
            }
        }
        return { rowIndex: rowIndex, row: control.rawValue[rowIndex] || null };
    }

    function pointYData(point) {
        var map = point.series && point.series.pointArrayMap;
        if (Array.isArray(map) && map.length > 1) {
            var value = {};
            for (var i = 0; i < map.length; i++) {
                value[map[i]] = point[map[i]];
            }
            return value;
        }
        if (point.y !== undefined) { return point.y; }
        if (point.value !== undefined) { return point.value; }
        if (point.weight !== undefined) { return point.weight; }
        return point.options;
    }

    function makeSelection(control, point, event) {
        var resolved = resolveRow(control, point, event);
        if (!resolved) {
            return null;
        }
        return {
            series: {
                index: point.series.index,
                id: point.series.options.id,
                name: point.series.name,
                type: point.series.type
            },
            point: {
                dataIndex: point.index,
                dataIndexInside: point.index,
                dataType: point.isNode ? 'node' : (point.from !== undefined && point.to !== undefined ? 'edge' : 'main'),
                name: point.name || point.category,
                value: pointYData(point),
                data: common.clone(point.options),
                color: point.color || point.series.color
            },
            yData: pointYData(point),
            rowIndex: resolved.rowIndex,
            row: resolved.row
        };
    }

    function pointClick(control, point, event) {
        if (control.config.selectionMode === 'native') {
            return;
        }
        var selection = makeSelection(control, point, event);
        var result = common.applySelection(control, selection);
        if (result.changed) {
            common.emit(control, 'selectionChange', event);
        }
    }

    function dispatchPointClick(control, point, event) {
        if (!control || !point || (event && event.handstackHandled)) { return; }
        if (event) { event.handstackHandled = true; }
        pointClick(control, point, event);
        common.emit(control, 'pointClick', event);
        common.emit(control, 'click', event);
    }

    function ensurePointClickBridge() {
        if ($chart.pointClickBridge || !Highcharts.Point) { return; }
        Highcharts.addEvent(Highcharts.Point, 'click', function (event) {
            var point = this;
            var control = $chart.chartControls.find(function (item) {
                return point.series && item.chart === point.series.chart;
            });
            dispatchPointClick(control, point, event);
        }, { order: -100 });
        $chart.pointClickBridge = true;
    }

    function wrapEvent(original, handler) {
        return function () {
            var result;
            if (original) {
                result = original.apply(this, arguments);
            }
            handler.apply(this, arguments);
            return result;
        };
    }

    var settingKeys = {
        width: true, height: true, constructorType: true, modules: true, option: true, callback: true,
        dataMode: true, dataAdapter: true, selectionResolver: true, selectionMode: true, selectionKey: true,
        clearSelectionOnBlank: true, autoResize: true, dataType: true, belongID: true, getter: true, setter: true,
        controlText: true, validators: true, transactConfig: true, triggerConfig: true
    };

    function mergeNativeOption(setting, supplied) {
        var option = common.merge({}, setting.option || {});
        Object.keys(supplied || {}).forEach(function (key) {
            if (!settingKeys[key]) {
                option[key] = common.clone(supplied[key]);
            }
        });
        return option;
    }

    function wrapMappedEvents(control, events, eventMap) {
        events = events || {};
        Object.keys(eventMap).forEach(function (sourceName) {
            events[sourceName] = wrapEvent(events[sourceName], function (event) {
                common.emit(control, eventMap[sourceName], event);
            });
        });
        return events;
    }

    function wireSeriesEvents(control, seriesOption) {
        if (!seriesOption) { return; }
        seriesOption.events = wrapMappedEvents(control, seriesOption.events, {
            afterAnimate: 'seriesAfterAnimate', checkboxClick: 'seriesCheckboxClick', click: 'seriesClick',
            hide: 'seriesHide', legendItemClick: 'seriesLegendItemClick', mouseOut: 'seriesMouseOut',
            mouseOver: 'seriesMouseOver', show: 'seriesShow'
        });
        seriesOption.point = seriesOption.point || {};
        seriesOption.point.events = seriesOption.point.events || {};
        var pointEvents = seriesOption.point.events;
        pointEvents.click = wrapEvent(pointEvents.click, function (event) {
            dispatchPointClick(control, this, event);
        });
        pointEvents.mouseOver = wrapEvent(pointEvents.mouseOver, function (event) { common.emit(control, 'pointHover', event); });
        pointEvents.mouseOut = wrapEvent(pointEvents.mouseOut, function (event) { common.emit(control, 'pointMouseOut', event); });
        pointEvents.drag = wrapEvent(pointEvents.drag, function (event) { common.emit(control, 'pointDrag', event); });
        pointEvents.drop = wrapEvent(pointEvents.drop, function (event) { common.emit(control, 'pointDrop', event); });
        pointEvents.remove = wrapEvent(pointEvents.remove, function (event) { common.emit(control, 'pointRemove', event); });
        pointEvents.update = wrapEvent(pointEvents.update, function (event) { common.emit(control, 'pointUpdate', event); });
        pointEvents.select = wrapEvent(pointEvents.select, function (event) {
            if (control.config.selectionMode === 'native') {
                var selection = makeSelection(control, this, event);
                if (selection && !control.selections.some(function (item) { return common.selectionKey(item) === common.selectionKey(selection); })) {
                    control.selections.push(selection);
                    common.emit(control, 'selectionChange', event);
                }
            }
            common.emit(control, 'pointSelect', event);
        });
        pointEvents.unselect = wrapEvent(pointEvents.unselect, function (event) {
            if (control.config.selectionMode === 'native') {
                var selection = makeSelection(control, this, event);
                if (selection) {
                    var key = common.selectionKey(selection);
                    control.selections = control.selections.filter(function (item) { return common.selectionKey(item) !== key; });
                    common.emit(control, 'selectionChange', event);
                }
            }
            common.emit(control, 'pointUnselect', event);
        });
    }

    function wireAxisEvents(control, axisOptions) {
        var values = Array.isArray(axisOptions) ? axisOptions : (axisOptions ? [axisOptions] : []);
        values.forEach(function (axisOption) {
            axisOption.events = wrapMappedEvents(control, axisOption.events, {
                afterSetExtremes: 'axisAfterSetExtremes', pointBreak: 'axisPointBreak',
                pointInBreak: 'axisPointInBreak', setExtremes: 'axisSetExtremes'
            });
        });
    }

    function prepareOption(control, option) {
        option = common.merge({}, option || {});
        option.chart = option.chart || {};
        option.chart.events = option.chart.events || {};
        if ($chart.loadedModules['stock-tools'] && option.stockTools === undefined) {
            option.stockTools = { gui: { enabled: false } };
        }
        if ($chart.loadedModules['stock-tools'] || option.stockTools) {
            option.navigation = option.navigation || {};
            option.navigation.iconsURL = option.navigation.iconsURL || moduleUrl('gfx/stock-icons/');
        }
        option.plotOptions = option.plotOptions || {};
        option.plotOptions.series = option.plotOptions.series || {};
        option.chart.events.click = wrapEvent(option.chart.events.click, function (event) {
            if (control.config.clearSelectionOnBlank && control.config.selectionMode !== 'none') {
                $chart.clearSelection(control.id);
            }
            common.emit(control, 'click', event);
        });
        option.chart.events.redraw = wrapEvent(option.chart.events.redraw, function (event) { common.emit(control, 'redraw', event); });
        option.chart.events.render = wrapEvent(option.chart.events.render, function (event) { common.emit(control, 'render', event); });
        option.chart.events.selection = wrapEvent(option.chart.events.selection, function (event) { common.emit(control, 'zoom', event); });
        option.chart.events = wrapMappedEvents(control, option.chart.events, {
            addSeries: 'addSeries', afterPrint: 'afterPrint', beforePrint: 'beforePrint',
            drilldown: 'drilldown', drillup: 'drillup', drillupall: 'drillupall',
            exportData: 'exportData', fullscreenClose: 'fullscreenClose', fullscreenOpen: 'fullscreenOpen',
            load: 'load'
        });
        Object.keys(option.plotOptions).forEach(function (type) {
            wireSeriesEvents(control, option.plotOptions[type]);
        });
        [option.series, option.drilldown && option.drilldown.series, option.navigator && option.navigator.series].forEach(function (items) {
            items = Array.isArray(items) ? items : (items ? [items] : []);
            items.forEach(function (item) { wireSeriesEvents(control, item); });
        });
        wireAxisEvents(control, option.xAxis);
        wireAxisEvents(control, option.yAxis);
        wireAxisEvents(control, option.zAxis);
        wireAxisEvents(control, option.colorAxis);
        return option;
    }

    function constructor(control) {
        var name = normalizeConstructorType(control.config.constructorType);
        control.config.constructorType = name;
        var factory = Highcharts[name] || Highcharts.chart;
        var callback = common.resolveFunction(control.config.callback);
        return factory(control.element, prepareOption(control, control.config.option), callback || undefined);
    }

    function initialize(control) {
        ensurePointClickBridge();
        return ensureModules(control, control.config.option).then(function () {
            control.chart = constructor(control);
            common.emit(control, 'initialized', { chart: control.chart });
            return control.chart;
        });
    }

    function recreate(control, constructorType, option, modules) {
        constructorType = normalizeConstructorType(constructorType || control.config.constructorType);
        option = common.clone(option || control.config.option || {});
        if (modules) { control.config.modules = common.clone(modules); }
        control.config.constructorType = constructorType;
        control.config.option = option;
        if (control.chart) {
            control.chart.destroy();
            control.chart = null;
        }
        return ensureModules(control, option).then(function () {
            control.chart = constructor(control);
            control.selections = [];
            common.emit(control, 'recreated', { chart: control.chart, constructorType: constructorType, option: option });
            return control.chart;
        });
    }

    function renderDescriptor(control, descriptor) {
        descriptor = descriptor || {};
        var option = common.clone(descriptor.option || {});
        if (!descriptor.option) {
            var descriptorKeys = {
                constructorType: true, modules: true, rows: true, metaColumns: true,
                rowIndexMap: true, selectionResolver: true, callback: true
            };
            Object.keys(descriptor).forEach(function (key) {
                if (!descriptorKeys[key]) { option[key] = common.clone(descriptor[key]); }
            });
        }
        var rows = descriptor.rows === undefined ? [] : common.normalizeRows(descriptor.rows);
        if (rows.valid === false) {
            return Promise.reject(new Error(rows.error));
        }
        if (descriptor.callback !== undefined) { control.config.callback = descriptor.callback; }
        if (descriptor.selectionResolver !== undefined) {
            control.selectionResolver = common.resolveFunction(descriptor.selectionResolver) || descriptor.selectionResolver;
        }
        control.rowIndexMap = descriptor.rowIndexMap || null;
        control.rawValue = descriptor.rows === undefined ? [] : rows.rows;
        control.metaColumns = descriptor.metaColumns || null;
        return recreate(control, descriptor.constructorType, option, descriptor.modules).then(function (chart) {
            common.emit(control, 'dataBound', { rows: common.clone(control.rawValue), option: option, descriptor: true });
            return chart;
        });
    }

    function resolveChartTarget(chart, target) {
        if (!chart || !target || target === 'chart') { return chart; }
        if (typeof target === 'string') { return chart.get(target); }
        if (target.target) { return target.target; }
        var type = String(target.type || '').toLowerCase();
        var index = target.index || 0;
        if (target.id !== undefined) { return chart.get(target.id); }
        if (type === 'series') { return chart.series[index]; }
        if (type === 'point') {
            var series = chart.series[target.seriesIndex || 0];
            return series && series.points[index];
        }
        if (type === 'xaxis' || type === 'yaxis' || type === 'zaxis' || type === 'coloraxis') {
            var key = type === 'xaxis' ? 'xAxis' : (type === 'yaxis' ? 'yAxis' : (type === 'zaxis' ? 'zAxis' : 'colorAxis'));
            return chart[key] && chart[key][index];
        }
        if (type === 'mapview') { return chart.mapView; }
        if (type === 'fullscreen') { return chart.fullscreen; }
        if (type === 'exporting') { return chart.exporting; }
        return null;
    }

    function invokeChartTarget(elID, target, method, args) {
        var chart = $chart.getChartControl(elID);
        var instance = resolveChartTarget(chart, target);
        if (!instance || !method || typeof instance[method] !== 'function') {
            throw new Error('Highcharts target method is not available: ' + method);
        }
        return instance[method].apply(instance, args || []);
    }

    function inferredOption(control, rows, metaColumns) {
        var table = common.inferTable(rows, metaColumns);
        var type = control.config.option && control.config.option.chart ? control.config.option.chart.type : null;
        var series = table.series.map(function (item) {
            return {
                name: item.name,
                type: type || undefined,
                data: rows.map(function (row, rowIndex) {
                    return {
                        name: row[table.labelField],
                        y: row[item.field] === '' || row[item.field] === null ? null : Number(row[item.field]),
                        custom: { handstackRowIndex: rowIndex }
                    };
                })
            };
        });
        return { xAxis: { categories: table.labels }, series: series };
    }

    function isLegacySeries(rows, config) {
        return config.dataMode !== 'rows' && rows.length > 0 && rows.every(function (item) {
            return Array.isArray(item.data) && (item.name !== undefined || item.type !== undefined);
        });
    }

    function applyOption(control, option) {
        return ensureModules(control, option).then(function () {
            refreshChartModuleDefaults(control);
            var prepared = prepareOption(control, option);
            control.chart.update(prepared, true, true);
            return prepared;
        });
    }

    $chart.extend({
        name: 'syn.uicontrols.$chart',
        version: 'v2026.7.27',
        chartControls: [],
        loadedModules: {},
        modulePromises: {},
        loadedStyles: {},
        stylePromises: {},
        moduleDefinitions: moduleDefinitions,
        pointClickBridge: false,
        registerModule: function (name, path, dependencies, styles) {
            if (!name || !path || !/^[a-z0-9_./-]+$/i.test(path) || path.indexOf('..') > -1) {
                throw new Error('A safe Highcharts module name and local path are required.');
            }
            moduleDefinitions[normalizeModuleName(name)] = { path: path, dependencies: dependencies || [], styles: styles || [] };
        },
        defaultSetting: {
            width: '100%',
            height: '320px',
            constructorType: 'chart',
            modules: [],
            callback: null,
            option: {
                chart: { type: 'column' },
                title: { text: '' },
                xAxis: { categories: [] },
                yAxis: { title: { text: 'Values' } },
                series: []
            },
            dataMode: 'auto',
            dataAdapter: null,
            selectionResolver: null,
            selectionMode: 'single',
            selectionKey: null,
            clearSelectionOnBlank: true,
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
            if (!el || !window.Highcharts) {
                common.log('$chart.controlLoad', 'Highcharts is not loaded.', 'Error');
                return;
            }
            var supplied = setting || {};
            setting = common.merge({}, $chart.defaultSetting, supplied);
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = common.merge(setting, mod.hook.controlInit(elID, setting));
            }
            setting.option = mergeNativeOption(setting, setting);
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;

            el.setAttribute('id', elID + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';
            var element = document.createElement('div');
            element.id = elID;
            element.className = 'syn-chart';
            element.style.width = setting.width;
            element.style.height = setting.height;
            el.parentNode.insertBefore(element, el.nextSibling);

            var control = {
                id: elID,
                element: element,
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
            $chart.chartControls.push(control);
            syn.$w.addReadyCount();
            initialize(control).then(function () {
                if (setting.autoResize && window.ResizeObserver) {
                    control.resizeObserver = new ResizeObserver(function () {
                        if (control.chart) {
                            control.chart.reflow();
                            common.emit(control, 'resized', { source: 'ResizeObserver' });
                        }
                    });
                    control.resizeObserver.observe(element);
                }
            }).catch(function (error) {
                common.log('$chart.controlLoad', error, 'Error');
                common.emit(control, 'error', error);
            }).finally(function () {
                syn.$w.removeReadyCount();
            });
        },

        getControl: function (elID) {
            return $chart.chartControls.find(function (control) { return control.id === elID; }) || null;
        },

        getChartControl: function (elID) {
            var control = $chart.getControl(elID);
            return control ? control.chart : null;
        },

        getChartInstance: function (elID) { return $chart.getChartControl(elID); },

        setValue: function (elID, value, metaColumns) {
            var control = $chart.getControl(elID);
            if (!control || !control.chart) { return Promise.resolve(null); }
            var normalized = common.normalizeRows(value);
            if (!normalized.valid) {
                common.log('$chart.setValue', normalized.error, 'Warning');
                return Promise.resolve(null);
            }
            var rows = normalized.rows;
            var adapter = common.resolveFunction(control.config.dataAdapter);
            var operation;
            if (adapter) {
                operation = Promise.resolve(adapter(rows, metaColumns, control.chart.options, control)).then(function (adapted) {
                    var envelope = adapted && adapted.option ? adapted : { option: adapted || {} };
                    control.rowIndexMap = envelope.rowIndexMap || null;
                    control.selectionResolver = common.resolveFunction(envelope.selectionResolver) || envelope.selectionResolver || control.selectionResolver;
                    return envelope.option;
                });
            }
            else if (isLegacySeries(rows, control.config)) {
                operation = Promise.resolve({ series: rows });
            }
            else {
                operation = Promise.resolve(inferredOption(control, rows, metaColumns));
            }
            return operation.then(function (option) {
                return applyOption(control, option).then(function () {
                    control.rawValue = rows;
                    control.metaColumns = metaColumns || null;
                    control.selections = [];
                    common.emit(control, 'dataBound', { rows: common.clone(rows), option: option });
                    return control.chart;
                });
            }).catch(function (error) {
                common.log('$chart.setValue', error, 'Error');
                common.emit(control, 'error', error);
                return null;
            });
        },

        setSeries: function (elID, series) {
            var control = $chart.getControl(elID);
            return control ? applyOption(control, { series: common.clone(series || []) }) : Promise.resolve(null);
        },

        renderChart: function (elID, descriptor) {
            var control = $chart.getControl(elID);
            return control ? renderDescriptor(control, descriptor) : Promise.reject(new Error('Chart not found: ' + elID));
        },

        recreate: function (elID, constructorType, option, modules) {
            var control = $chart.getControl(elID);
            return control ? recreate(control, constructorType, option, modules) : Promise.reject(new Error('Chart not found: ' + elID));
        },

        setConstructorType: function (elID, constructorType) {
            var control = $chart.getControl(elID);
            return control ? recreate(control, constructorType, control.config.option, control.config.modules) : Promise.reject(new Error('Chart not found: ' + elID));
        },

        getValue: function (elID, requestType, metaColumns) { return common.getValue($chart.getControl(elID), requestType, metaColumns); },
        getRawValue: function (elID) { var control = $chart.getControl(elID); return control ? common.clone(control.rawValue) : []; },
        getSelection: function (elID) { var control = $chart.getControl(elID); return control ? common.clone(control.selections) : []; },
        getSelectedRows: function (elID) { var control = $chart.getControl(elID); return control ? common.selectedRows(control) : []; },
        getSeriesValue: function (elID) {
            var chart = $chart.getChartControl(elID);
            return chart ? chart.series.filter(function (series) { return !series.options.isInternal; }).map(function (series) {
                return { name: series.name, data: common.clone(series.yData) };
            }) : null;
        },
        getOption: function (elID) { var control = $chart.getControl(elID); return control ? common.clone(control.config.option) : null; },
        getHighcharts: function () { return window.Highcharts; },
        get: function (elID, id) { var chart = $chart.getChartControl(elID); return chart ? chart.get(id) : null; },
        invoke: function (elID, target, method, args) { return invokeChartTarget(elID, target, method, args); },

        setSelection: function (elID, selections) {
            var control = $chart.getControl(elID);
            if (!control || !control.chart || control.config.selectionMode === 'none') { return; }
            $chart.clearSelection(elID, true);
            var values = Array.isArray(selections) ? selections : [selections];
            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                if (value === null || value === undefined) { continue; }
                var point = typeof value === 'number' ? control.chart.series[0] && control.chart.series[0].points[value] : null;
                if (!point && value && value.seriesIndex !== undefined && value.dataIndex !== undefined) {
                    point = control.chart.series[value.seriesIndex] && control.chart.series[value.seriesIndex].points[value.dataIndex];
                }
                var selection = value && value.point && value.row !== undefined ? value : (point ? makeSelection(control, point, { source: 'setSelection' }) : null);
                if (selection) {
                    control.selections.push(selection);
                    if (control.config.selectionMode === 'single') { break; }
                }
            }
            common.emit(control, 'selectionChange', { source: 'setSelection' });
        },

        clearSelection: function (elID, silent) {
            var control = $chart.getControl(elID);
            if (!control) { return; }
            control.selections = [];
            if (!silent) { common.emit(control, 'selectionChange', { source: 'clearSelection' }); }
        },

        update: function (elID, option, redraw, oneToOne) {
            var control = $chart.getControl(elID);
            if (!control) { return Promise.resolve(null); }
            return ensureModules(control, option).then(function () {
                refreshChartModuleDefaults(control);
                control.chart.update(prepareOption(control, option), redraw !== false, oneToOne !== false);
                control.config.option = common.merge({}, control.config.option || {}, option || {});
                return control.chart;
            });
        },
        setOption: function (elID, option, redraw, oneToOne) { return $chart.update(elID, option, redraw, oneToOne); },
        setOptions: function (options) { return Highcharts.setOptions(options); },
        redraw: function (elID, animation) { var chart = $chart.getChartControl(elID); if (chart) { chart.redraw(animation); } },
        reflow: function (elID) { var chart = $chart.getChartControl(elID); if (chart) { chart.reflow(); } },
        setTitle: function (elID, title, subtitle, redraw) { var chart = $chart.getChartControl(elID); if (chart) { chart.setTitle(title, subtitle, redraw !== false); } },
        setCaption: function (elID, caption, redraw) { var chart = $chart.getChartControl(elID); if (chart && chart.setCaption) { chart.setCaption(caption, redraw !== false); } },
        addSeries: function (elID, options, redraw) {
            var control = $chart.getControl(elID);
            if (!control) { return Promise.resolve(null); }
            return ensureModules(control, { series: [options] }).then(function () {
                refreshChartModuleDefaults(control);
                return control.chart.addSeries(options, redraw !== false);
            });
        },
        removeSeries: function (elID, seriesIndex, redraw) { var chart = $chart.getChartControl(elID); if (chart && chart.series[seriesIndex]) { chart.series[seriesIndex].remove(redraw !== false); } },
        updateSeries: function (elID, seriesIndex, options, redraw) {
            var control = $chart.getControl(elID);
            if (!control || !control.chart.series[seriesIndex]) { return Promise.resolve(null); }
            return ensureModules(control, { series: [options] }).then(function () {
                refreshChartModuleDefaults(control);
                control.chart.series[seriesIndex].update(options, redraw !== false);
                return control.chart.series[seriesIndex];
            });
        },
        setData: function (elID, seriesIndex, data, redraw, animation, updatePoints) {
            var chart = $chart.getChartControl(elID);
            if (chart && chart.series[seriesIndex]) { chart.series[seriesIndex].setData(data || [], redraw !== false, animation, updatePoints !== false); }
        },
        setSeriesVisible: function (elID, seriesIndex, visible, redraw) { var chart = $chart.getChartControl(elID); if (chart && chart.series[seriesIndex]) { chart.series[seriesIndex].setVisible(visible, redraw !== false); } },
        selectSeries: function (elID, seriesIndex, selected) { var chart = $chart.getChartControl(elID); if (chart && chart.series[seriesIndex]) { chart.series[seriesIndex].select(selected); } },
        addPoint: function (elID, seriesIndex, point, redraw, shift) { var chart = $chart.getChartControl(elID); if (chart && chart.series[seriesIndex]) { chart.series[seriesIndex].addPoint(point, redraw !== false, !!shift); } },
        updatePoint: function (elID, seriesIndex, pointIndex, options, redraw, animation) { var chart = $chart.getChartControl(elID); var point = chart && chart.series[seriesIndex] && chart.series[seriesIndex].points[pointIndex]; if (point) { point.update(options, redraw !== false, animation); } },
        removePoint: function (elID, seriesIndex, pointIndex, redraw, animation) { var chart = $chart.getChartControl(elID); var series = chart && chart.series[seriesIndex]; if (series) { series.removePoint(pointIndex, redraw !== false, animation); } },
        selectPoint: function (elID, seriesIndex, pointIndex, selected, accumulate) { var chart = $chart.getChartControl(elID); var point = chart && chart.series[seriesIndex] && chart.series[seriesIndex].points[pointIndex]; if (point) { point.select(selected, accumulate); } },
        setExtremes: function (elID, axisType, axisIndex, min, max, redraw) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; if (axes && axes[axisIndex || 0]) { axes[axisIndex || 0].setExtremes(min, max, redraw !== false); } },
        setCategories: function (elID, axisType, axisIndex, categories, redraw) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; if (axes && axes[axisIndex || 0]) { axes[axisIndex || 0].setCategories(categories || [], redraw !== false); } },
        updateAxis: function (elID, axisType, axisIndex, options, redraw) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; if (axes && axes[axisIndex || 0]) { axes[axisIndex || 0].update(options, redraw !== false); } },
        addPlotLine: function (elID, axisType, axisIndex, options) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; return axes && axes[axisIndex || 0] ? axes[axisIndex || 0].addPlotLine(options) : null; },
        addPlotBand: function (elID, axisType, axisIndex, options) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; return axes && axes[axisIndex || 0] ? axes[axisIndex || 0].addPlotBand(options) : null; },
        removePlotLine: function (elID, axisType, axisIndex, id) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; if (axes && axes[axisIndex || 0]) { axes[axisIndex || 0].removePlotLine(id); } },
        removePlotBand: function (elID, axisType, axisIndex, id) { var chart = $chart.getChartControl(elID); var axes = chart && chart[axisType || 'xAxis']; if (axes && axes[axisIndex || 0]) { axes[axisIndex || 0].removePlotBand(id); } },
        addAnnotation: function (elID, options, redraw) { var chart = $chart.getChartControl(elID); return chart && chart.addAnnotation ? chart.addAnnotation(options, redraw !== false) : null; },
        removeAnnotation: function (elID, id) { var chart = $chart.getChartControl(elID); if (chart && chart.removeAnnotation) { chart.removeAnnotation(id); } },
        addSeriesAsDrilldown: function (elID, point, options) { var chart = $chart.getChartControl(elID); if (chart && chart.addSeriesAsDrilldown) { chart.addSeriesAsDrilldown(point, options); } },
        drillUp: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.drillUp) { chart.drillUp(); } },
        loadModules: function (elID, modules) { var control = $chart.getControl(elID); return control ? ensureModules(control, {}, modules || []) : Promise.reject(new Error('Chart not found: ' + elID)); },
        getLoadedModules: function () { return Object.keys($chart.loadedModules).filter(function (name) { return $chart.loadedModules[name]; }); },
        registerMap: function (name, mapData) { Highcharts.maps = Highcharts.maps || {}; Highcharts.maps[name] = mapData; },
        getMap: function (name) { return Highcharts.maps ? Highcharts.maps[name] : null; },
        addEvent: function (target, eventName, handler, options) { return Highcharts.addEvent(target, eventName, handler, options); },
        removeEvent: function (target, eventName, handler) { return Highcharts.removeEvent(target, eventName, handler); },
        registerSeriesType: function () { return Highcharts.seriesType.apply(Highcharts, arguments); },

        resize: function (elID, width, height) { var control = $chart.getControl(elID); if (control && control.chart) { control.chart.setSize(width, height); common.emit(control, 'resized', { width: width, height: height }); } },
        setControlSize: function (elID, width, height) { var control = $chart.getControl(elID); if (control) { if (width !== undefined) { control.element.style.width = typeof width === 'number' ? width + 'px' : width; } if (height !== undefined) { control.element.style.height = typeof height === 'number' ? height + 'px' : height; } control.chart.reflow(); } },
        zoomOut: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.zoomOut) { chart.zoomOut(); } },
        mapZoom: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.mapZoom) { return chart.mapZoom.apply(chart, Array.prototype.slice.call(arguments, 1)); } },
        fitMapToBounds: function (elID, bounds, padding, redraw, animation) { var chart = $chart.getChartControl(elID); if (chart && chart.mapView) { chart.mapView.fitToBounds(bounds, padding, redraw !== false, animation); } },
        showLoading: function (elID, text) { var chart = $chart.getChartControl(elID); if (chart) { chart.showLoading(text); } },
        hideLoading: function (elID) { var chart = $chart.getChartControl(elID); if (chart) { chart.hideLoading(); } },
        openFullscreen: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.fullscreen) { chart.fullscreen.open(); } },
        closeFullscreen: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.fullscreen) { chart.fullscreen.close(); } },
        toggleFullscreen: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.fullscreen) { chart.fullscreen.toggle(); } },
        sonify: function (elID, options) { var chart = $chart.getChartControl(elID); if (chart && chart.sonify) { return chart.sonify(options); } },
        cancelSonify: function (elID, fadeOut) { var chart = $chart.getChartControl(elID); if (chart && chart.cancelSonify) { chart.cancelSonify(fadeOut); } },
        clear: function (elID) { var control = $chart.getControl(elID); if (control && control.chart) { control.chart.update({ series: [] }, true, true); control.rawValue = []; control.selections = []; } },
        dispose: function (elID) { var control = $chart.getControl(elID); if (!control) { return; } common.emit(control, 'disposed', {}); if (control.resizeObserver) { control.resizeObserver.disconnect(); } if (control.chart) { control.chart.destroy(); } var index = $chart.chartControls.indexOf(control); if (index > -1) { $chart.chartControls.splice(index, 1); } },

        print: function (elID) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['exporting']).then(function () { control.chart.print(); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        exportChart: function (elID, exportingOptions, chartOptions) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['exporting']).then(function () { return control.chart.exportChart(exportingOptions, chartOptions); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        exportChartLocal: function (elID, exportingOptions, chartOptions) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['offline-exporting']).then(function () { return control.chart.exportChartLocal(exportingOptions, chartOptions); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        getCSV: function (elID, useLocalDecimalPoint) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['export-data']).then(function () { return control.chart.getCSV(useLocalDecimalPoint); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        getTable: function (elID, useLocalDecimalPoint) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['export-data']).then(function () { return control.chart.getTable(useLocalDecimalPoint); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        viewData: function (elID) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['export-data']).then(function () { return control.chart.viewData(); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },
        hideData: function (elID) { var chart = $chart.getChartControl(elID); if (chart && chart.hideData) { chart.hideData(); } },
        downloadCSV: function (elID) {
            var control = $chart.getControl(elID);
            return control ? ensureModules(control, {}, ['export-data']).then(function () { return control.chart.downloadCSV(); }) : Promise.reject(new Error('Chart not found: ' + elID));
        },

        getSVG: function (elID, chartOptions) {
            var control = $chart.getControl(elID);
            if (!control) { return Promise.resolve(null); }
            return ensureModules(control, {}, ['exporting']).then(function () {
                refreshChartModuleDefaults(control);
                return control.chart.getSVG(chartOptions || {});
            });
        },
        getDataURL: function (elID, options) {
            options = common.merge({ type: 'image/png', pixelRatio: 2, backgroundColor: '#ffffff' }, options || {});
            return $chart.getSVG(elID, options.chartOptions).then(function (svg) {
                if (!svg) { return null; }
                return new Promise(function (resolve, reject) {
                    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                    var url = URL.createObjectURL(blob);
                    var image = new Image();
                    image.onload = function () {
                        var canvas = document.createElement('canvas');
                        canvas.width = image.width * options.pixelRatio;
                        canvas.height = image.height * options.pixelRatio;
                        var context = canvas.getContext('2d');
                        context.fillStyle = options.backgroundColor;
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.scale(options.pixelRatio, options.pixelRatio);
                        context.drawImage(image, 0, 0);
                        URL.revokeObjectURL(url);
                        resolve(canvas.toDataURL(options.type));
                    };
                    image.onerror = function (error) { URL.revokeObjectURL(url); reject(error); };
                    image.src = url;
                });
            });
        },
        toImage: function (elID, fileID, options) {
            return $chart.getDataURL(elID, options).then(function (dataURL) {
                if (!dataURL) { return null; }
                var anchor = document.createElement('a');
                anchor.href = dataURL;
                anchor.download = (fileID || elID) + '.png';
                anchor.click();
                return dataURL;
            });
        },
        setLocale: function (elID, translations) { Highcharts.setOptions({ lang: translations || {} }); var chart = $chart.getChartControl(elID); if (chart) { chart.redraw(); } }
    });

    syn.uicontrols.$chart = $chart;
})(window);
