/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $navermap = syn.uicontrols.$navermap || new syn.module();

    function hasOwn(target, name) {
        return target && Object.prototype.hasOwnProperty.call(target, name);
    }

    function isPlainObject(value) {
        return value && Object.prototype.toString.call(value) === '[object Object]';
    }

    function clone(value, seen, copies) {
        if (value === null || value === undefined || typeof value !== 'object') { return value; }
        if (value instanceof Date) { return new Date(value.getTime()); }
        if (!Array.isArray(value) && !isPlainObject(value)) { return value; }
        seen = seen || [];
        copies = copies || [];
        var found = seen.indexOf(value);
        if (found > -1) { return copies[found]; }
        var result = Array.isArray(value) ? [] : {};
        seen.push(value);
        copies.push(result);
        for (var key in value) {
            if (hasOwn(value, key)) { result[key] = clone(value[key], seen, copies); }
        }
        return result;
    }

    function merge(target) {
        target = target || {};
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (!source || typeof source !== 'object') { continue; }
            for (var key in source) {
                if (!hasOwn(source, key)) { continue; }
                var value = source[key];
                if (isPlainObject(value)) {
                    target[key] = merge(isPlainObject(target[key]) ? target[key] : {}, value);
                }
                else { target[key] = clone(value); }
            }
        }
        return target;
    }

    function asArray(value) {
        return value === null || value === undefined ? [] : (Array.isArray(value) ? value : [value]);
    }

    function resolveFunction(value) {
        if (typeof value === 'function') { return value; }
        if (typeof value !== 'string' || !value) { return null; }
        var current = window;
        var path = value.split('.');
        for (var i = 0; i < path.length && current; i++) { current = current[path[i]]; }
        return typeof current === 'function' ? current : null;
    }

    function log(scope, error, level) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog(scope, error && error.message ? error.message : String(error), level || 'Error');
        }
    }

    function parseEvents(el) {
        var text = el ? el.getAttribute('syn-events') : '';
        if (!text) { return []; }
        try {
            var events = eval(text);
            return Array.isArray(events) ? events : [];
        }
        catch (error) {
            log('$navermap.parseEvents', error, 'Warning');
            return [];
        }
    }

    function pageHandler(id, eventName) {
        var mod = window[syn.$w.pageScript];
        return mod && mod.event ? mod.event[id + '_' + eventName] : null;
    }

    function emit(control, eventName, payload) {
        var handler = pageHandler(control.id, eventName);
        if (!handler) { return; }
        try { handler.apply(control.element, [control.id, payload || {}, getSelection(control)]); }
        catch (error) { log('$navermap.emit.' + eventName, error); }
    }

    function errorOf(code, message, detail) {
        var error = new Error(message);
        error.code = code;
        if (detail !== undefined) { error.detail = detail; }
        return error;
    }

    function fail(control, scope, error) {
        log(scope, error);
        if (control) {
            var fatal = !control.map || /^NAVER_MAP_(?:API_KEY|SDK|AUTH)/.test(error.code || '');
            if (fatal) {
                control.element.classList.remove('is-loading');
                control.element.classList.add('is-error');
                control.status.textContent = error.message || String(error);
            }
            emit(control, 'error', { code: error.code || 'NAVER_MAP_ERROR', message: error.message || String(error), detail: error.detail });
        }
        return null;
    }

    function normalizeRows(value) {
        if (value === null || value === undefined) { return []; }
        if (!Array.isArray(value) && !isPlainObject(value)) {
            throw errorOf('INVALID_POI_DATA', 'setValue는 단일 객체 또는 객체 배열만 허용합니다.');
        }
        var rows = asArray(value);
        for (var i = 0; i < rows.length; i++) {
            if (!isPlainObject(rows[i])) {
                throw errorOf('INVALID_POI_DATA', '모든 POI 데이터는 객체여야 합니다.', { rowIndexes: [i] });
            }
        }
        return clone(rows);
    }

    function mapped(row, mapping, name, aliases) {
        var resolver = mapping ? mapping[name] : null;
        if (typeof resolver === 'function') { return resolver(row); }
        if (typeof resolver === 'string' && hasOwn(row, resolver)) { return row[resolver]; }
        for (var i = 0; i < aliases.length; i++) {
            if (hasOwn(row, aliases[i])) { return row[aliases[i]]; }
        }
        return undefined;
    }

    function bool(value, fallback) {
        if (value === undefined || value === null || value === '') { return fallback; }
        if (typeof value === 'string') { return /^(true|y|yes|1)$/i.test(value); }
        return value === true || value === 1;
    }

    function number(value) {
        if (value === null || value === undefined || value === '') { return NaN; }
        return Number(value);
    }

    function normalizePoi(row, index, setting) {
        var mapping = setting.poiMapping || {};
        var latitude = number(mapped(row, mapping, 'latitude', ['LAT', 'lat', 'latitude', 'Latitude']));
        var longitude = number(mapped(row, mapping, 'longitude', ['LNG', 'lng', 'longitude', 'Longitude']));
        if (!isFinite(latitude) || !isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw errorOf('INVALID_POI_COORDINATE', '유효하지 않은 POI 좌표가 있습니다.', { rowIndexes: [index], latitude: latitude, longitude: longitude });
        }
        var id = mapped(row, mapping, 'id', ['AS_NUM', 'POIID', 'PoiID', 'id', 'ID']);
        return {
            key: id === undefined || id === null || id === '' ? 'index:' + index : 'id:' + String(id),
            id: id === undefined || id === null ? null : String(id),
            index: index,
            row: row,
            latitude: latitude,
            longitude: longitude,
            title: mapped(row, mapping, 'title', ['CT_NAME', 'Title', 'title', 'Name', 'name']),
            description: mapped(row, mapping, 'description', ['CT_ADDRESS', 'Description', 'description', 'Address', 'address']),
            icon: mapped(row, mapping, 'icon', ['Icon', 'icon']),
            markerOptions: mapped(row, mapping, 'markerOptions', ['MarkerOptions', 'markerOptions']),
            infoWindowContent: mapped(row, mapping, 'infoWindowContent', ['InfoWindowContent', 'infoWindowContent']),
            visible: bool(mapped(row, mapping, 'visible', ['Visible', 'visible']), true),
            draggable: bool(mapped(row, mapping, 'draggable', ['Draggable', 'draggable']), false),
            zIndex: mapped(row, mapping, 'zIndex', ['ZIndex', 'zIndex'])
        };
    }

    function normalizePois(rows, setting) {
        var result = [];
        var invalid = [];
        for (var i = 0; i < rows.length; i++) {
            try { result.push(normalizePoi(rows[i], i, setting)); }
            catch (error) { invalid.push(i); }
        }
        if (invalid.length) {
            throw errorOf('INVALID_POI_COORDINATE', '유효하지 않은 POI 좌표가 있습니다: ' + invalid.join(', '), { rowIndexes: invalid });
        }
        return result;
    }

    function selectionOf(poi) {
        if (!poi) { return null; }
        var position = poi.marker && poi.marker.getPosition ? poi.marker.getPosition() : null;
        return {
            poiIndex: poi.index,
            poiId: poi.id,
            position: {
                lat: position && position.lat ? position.lat() : poi.latitude,
                lng: position && position.lng ? position.lng() : poi.longitude
            },
            row: clone(poi.row)
        };
    }

    function selectedPois(control) {
        var result = [];
        for (var keyIndex = 0; keyIndex < control.selectionKeys.length; keyIndex++) {
            for (var i = 0; i < control.pois.length; i++) {
                if (control.pois[i].key === control.selectionKeys[keyIndex]) { result.push(control.pois[i]); break; }
            }
        }
        return result;
    }

    function getSelection(control) {
        if (!control) { return null; }
        var values = selectedPois(control).map(selectionOf);
        return control.config.selectionMode === 'multiple' ? values : (values[0] || null);
    }

    function serializeRows(rows, requestType, metaColumns) {
        if (requestType !== 'Row' && requestType !== 'List') { return []; }
        var columns = metaColumns || null;
        return rows.map(function (row) {
            var result = [];
            if (Array.isArray(columns)) {
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    var name = typeof column === 'string' ? column : (column.data || column.field || column.name || column.ColumnName);
                    var fieldID = typeof column === 'string' ? name : (column.fieldID || column.FieldID || name);
                    if (name) { result.push({ prop: fieldID, val: row ? row[name] : undefined }); }
                }
            }
            else if (columns) {
                for (var columnKey in columns) {
                    if (!hasOwn(columns, columnKey)) { continue; }
                    var meta = columns[columnKey] || {};
                    var metaFieldID = meta.fieldID || meta.FieldID || columnKey;
                    var dataType = meta.dataType || meta.DataType;
                    var metaValue = row ? row[columnKey] : undefined;
                    if (metaValue === undefined && window.$object && $object.defaultValue) {
                        metaValue = String(dataType || '').toLowerCase() === 'number' ? null : $object.defaultValue(dataType);
                    }
                    result.push({ prop: metaFieldID, val: metaValue });
                }
            }
            else {
                for (var key in row) { if (hasOwn(row, key)) { result.push({ prop: key, val: row[key] }); } }
            }
            return result;
        });
    }

    function naverEvent() {
        return window.naver && window.naver.maps ? window.naver.maps.Event : null;
    }

    function addListener(target, eventName, listener, bucket) {
        var Event = naverEvent();
        if (!Event || !target) { return null; }
        var handle = Event.addListener(target, eventName, listener);
        if (bucket) { bucket.push(handle); }
        return handle;
    }

    function removeListeners(bucket) {
        var Event = naverEvent();
        if (!Event) { bucket.length = 0; return; }
        for (var i = 0; i < bucket.length; i++) { Event.removeListener(bucket[i]); }
        bucket.length = 0;
    }

    function latLng(value) {
        if (!value || !window.naver || !window.naver.maps) { return value; }
        if (value instanceof window.naver.maps.LatLng) { return value; }
        if (Array.isArray(value)) { return new window.naver.maps.LatLng(Number(value[0]), Number(value[1])); }
        var lat = value.lat !== undefined ? value.lat : (value.latitude !== undefined ? value.latitude : value.y);
        var lng = value.lng !== undefined ? value.lng : (value.longitude !== undefined ? value.longitude : value.x);
        return new window.naver.maps.LatLng(Number(lat), Number(lng));
    }

    function bounds(value) {
        if (!value || !window.naver || !window.naver.maps) { return value; }
        if (value instanceof window.naver.maps.LatLngBounds) { return value; }
        var sw = value.sw || value.southWest || value[0];
        var ne = value.ne || value.northEast || value[1];
        return new window.naver.maps.LatLngBounds(latLng(sw), latLng(ne));
    }

    function configureAuthFailure() {
        if ($navermap.authFailureInstalled) { return; }
        $navermap.authFailureInstalled = true;
        $navermap.previousAuthFailure = window.navermap_authFailure;
        window.navermap_authFailure = function () {
            if (typeof $navermap.previousAuthFailure === 'function') {
                try { $navermap.previousAuthFailure.apply(window, arguments); }
                catch (error) { log('$navermap.authFailure.previous', error); }
            }
            for (var i = 0; i < $navermap.mapControls.length; i++) {
                var control = $navermap.mapControls[i];
                var authError = errorOf('NAVER_MAP_AUTH_FAILURE', 'NAVER Maps API 인증에 실패했습니다.');
                fail(control, '$navermap.authFailure', authError);
                emit(control, 'authFailure', { code: authError.code, message: authError.message });
            }
        };
    }

    function sdkKey(setting) {
        return setting.apiKey || '';
    }

    function loadSDK(setting) {
        configureAuthFailure();
        if (window.naver && window.naver.maps && window.naver.maps.Map) { return Promise.resolve(window.naver); }
        var key = sdkKey(setting);
        if (!key) { log('$navermap.loadSDK', errorOf('NAVER_MAP_API_KEY_REQUIRED', 'apiKey 옵션이 필요합니다.'), 'Warning'); }
        var modules = asArray(setting.submodules).filter(Boolean).join(',');
        var signature = [setting.apiUrl, key, modules, setting.language || ''].join('|');
        if ($navermap.sdkPromise) {
            if ($navermap.sdkSignature !== signature) {
                return Promise.reject(errorOf('NAVER_MAP_SDK_CONFLICT', '이미 다른 NAVER Maps SDK 설정으로 로딩을 시작했습니다.'));
            }
            return $navermap.sdkPromise;
        }
        $navermap.sdkSignature = signature;
        $navermap.sdkPromise = new Promise(function (resolve, reject) {
            var callbackName = '__handstackNaverMapLoaded';
            var script = document.createElement('script');
            var query = ['ncpKeyId=' + encodeURIComponent(key), 'callback=' + callbackName];
            if (modules) { query.push('submodules=' + encodeURIComponent(modules)); }
            if (setting.language) { query.push('language=' + encodeURIComponent(setting.language)); }
            var timeout = window.setTimeout(function () {
                reject(errorOf('NAVER_MAP_SDK_TIMEOUT', 'NAVER Maps SDK 로딩 시간이 초과되었습니다.'));
            }, Number(setting.loadTimeout) || 15000);
            window[callbackName] = function () {
                window.clearTimeout(timeout);
                try { delete window[callbackName]; } catch (ignore) { window[callbackName] = undefined; }
                if (window.naver && window.naver.maps && window.naver.maps.Map) { resolve(window.naver); }
                else { reject(errorOf('NAVER_MAP_SDK_INVALID', 'NAVER Maps SDK를 초기화할 수 없습니다.')); }
            };
            script.async = true;
            script.src = String(setting.apiUrl || '').replace(/[?&]$/, '') + (String(setting.apiUrl).indexOf('?') > -1 ? '&' : '?') + query.join('&');
            script.onerror = function () {
                window.clearTimeout(timeout);
                reject(errorOf('NAVER_MAP_SDK_LOAD_FAILED', 'NAVER Maps SDK를 불러오지 못했습니다.'));
            };
            document.head.appendChild(script);
        });
        return $navermap.sdkPromise;
    }

    function infoContent(control, poi) {
        var resolver = resolveFunction(control.config.infoWindowContentResolver);
        var content = resolver ? resolver(clone(poi.row), poi.index, control) : poi.infoWindowContent;
        if (content !== undefined && content !== null) { return content; }
        var box = document.createElement('div');
        box.className = 'syn-navermap-infowindow';
        box.style.padding = '10px 12px';
        if (poi.title !== undefined && poi.title !== null) {
            var title = document.createElement('strong');
            title.textContent = String(poi.title);
            box.appendChild(title);
        }
        if (poi.description !== undefined && poi.description !== null) {
            var description = document.createElement('div');
            description.textContent = String(poi.description);
            box.appendChild(description);
        }
        return box;
    }

    function closeInfo(control) {
        if (control.infoWindow && control.infoWindow.close) {
            control.infoWindow.close();
            emit(control, 'infoWindowClose', {});
        }
    }

    function openInfo(control, poi) {
        if (!control.config.openInfoWindowOnSelect || !poi) { return null; }
        closeInfo(control);
        var options = merge({}, control.config.infoWindowOptions || {}, { content: infoContent(control, poi) });
        control.infoWindow = new window.naver.maps.InfoWindow(options);
        control.infoWindow.open(control.map, poi.marker);
        emit(control, 'infoWindowOpen', { selection: selectionOf(poi), infoWindow: control.infoWindow });
        return control.infoWindow;
    }

    function changeSelection(control, poi, source, event) {
        if (control.config.selectionMode === 'none') { return; }
        var changed = false;
        var index = control.selectionKeys.indexOf(poi.key);
        if (control.config.selectionMode === 'multiple') {
            if (index > -1) { control.selectionKeys.splice(index, 1); }
            else { control.selectionKeys.push(poi.key); }
            changed = true;
        }
        else if (index < 0 || control.selectionKeys.length !== 1) {
            control.selectionKeys = [poi.key];
            changed = true;
        }
        if (control.selectionKeys.indexOf(poi.key) > -1) { openInfo(control, poi); }
        else { closeInfo(control); }
        if (changed) { emit(control, 'selectionChange', { source: source || 'api', event: event || null, selection: getSelection(control) }); }
    }

    function markerOptions(control, poi) {
        var options = merge({}, control.config.markerOptions || {}, isPlainObject(poi.markerOptions) ? poi.markerOptions : {});
        var resolver = resolveFunction(control.config.markerOptionsResolver);
        if (resolver) { options = merge(options, resolver(clone(poi.row), poi.index, control) || {}); }
        options.map = null;
        options.position = new window.naver.maps.LatLng(poi.latitude, poi.longitude);
        if (poi.title !== undefined) { options.title = String(poi.title); }
        if (poi.icon !== undefined && poi.icon !== null) { options.icon = clone(poi.icon); }
        options.visible = poi.visible;
        options.draggable = poi.draggable;
        if (poi.zIndex !== undefined && poi.zIndex !== null && poi.zIndex !== '') { options.zIndex = Number(poi.zIndex); }
        return options;
    }

    function bindMarker(control, poi) {
        var events = ['click', 'dblclick', 'mouseover', 'mouseout', 'dragstart', 'drag', 'dragend'];
        for (var i = 0; i < events.length; i++) {
            (function (eventName) {
                addListener(poi.marker, eventName, function (event) {
                    if (eventName === 'click') { changeSelection(control, poi, 'poiClick', event); }
                    if (eventName === 'dragend' && poi.marker.getPosition) {
                        var position = poi.marker.getPosition();
                        poi.latitude = position.lat();
                        poi.longitude = position.lng();
                    }
                    var name = 'poi' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
                    emit(control, name, { event: event, selection: selectionOf(poi), marker: poi.marker });
                }, poi.listeners);
            })(events[i]);
        }
    }

    function destroyPoi(poi) {
        removeListeners(poi.listeners || []);
        if (poi.marker && poi.marker.setMap) { poi.marker.setMap(null); }
    }

    function fitPois(control) {
        if (!control.config.fitBoundsOnData || !control.pois.length) { return; }
        if (control.pois.length === 1) { control.map.setCenter(control.pois[0].marker.getPosition()); return; }
        var result = new window.naver.maps.LatLngBounds();
        for (var i = 0; i < control.pois.length; i++) { result.extend(control.pois[i].marker.getPosition()); }
        control.map.fitBounds(result);
    }

    function applyPois(control, rows, metaColumns) {
        var normalized = normalizePois(rows, control.config);
        var created = [];
        try {
            for (var i = 0; i < normalized.length; i++) {
                var poi = normalized[i];
                poi.listeners = [];
                poi.marker = new window.naver.maps.Marker(markerOptions(control, poi));
                bindMarker(control, poi);
                created.push(poi);
            }
        }
        catch (error) {
            for (var failed = 0; failed < created.length; failed++) { destroyPoi(created[failed]); }
            throw error;
        }
        var previousKeys = control.config.preserveSelection ? control.selectionKeys.slice() : [];
        var old = control.pois;
        control.pois = created;
        control.rawValue = clone(rows);
        control.metaColumns = metaColumns || null;
        control.selectionKeys = [];
        for (var keyIndex = 0; keyIndex < previousKeys.length; keyIndex++) {
            for (var poiIndex = 0; poiIndex < created.length; poiIndex++) {
                if (created[poiIndex].key === previousKeys[keyIndex]) { control.selectionKeys.push(previousKeys[keyIndex]); break; }
            }
        }
        for (var mapIndex = 0; mapIndex < created.length; mapIndex++) {
            if (created[mapIndex].visible) { created[mapIndex].marker.setMap(control.map); }
        }
        for (var oldIndex = 0; oldIndex < old.length; oldIndex++) { destroyPoi(old[oldIndex]); }
        closeInfo(control);
        fitPois(control);
        emit(control, 'dataBound', { rowCount: rows.length, rows: clone(rows) });
        return control.map;
    }

    function bindMapEvents(control) {
        var synthetic = $navermap.syntheticEvents;
        var names = control.eventNames.slice();
        if (names.indexOf('click') < 0) { names.push('click'); }
        for (var i = 0; i < names.length; i++) {
            (function (eventName) {
                if (synthetic.indexOf(eventName) > -1 || eventName.indexOf('poi') === 0) { return; }
                addListener(control.map, eventName, function (event) {
                    if (eventName === 'click' && control.config.clearSelectionOnMapClick) {
                        $navermap.clearSelection(control.id, 'mapClick');
                    }
                    if (control.eventNames.indexOf(eventName) > -1) { emit(control, eventName, event); }
                }, control.mapListeners);
            })(names[i]);
        }
    }

    function createMap(control) {
        if (control.disposed) { return null; }
        control.element.classList.remove('is-error');
        var options = merge({}, control.config.mapOptions || {});
        options.center = latLng(options.center || { lat: 36.5, lng: 127.8 });
        control.map = new window.naver.maps.Map(control.canvas, options);
        bindMapEvents(control);
        if (control.config.autoResize && window.ResizeObserver) {
            control.resizeObserver = new ResizeObserver(function () { $navermap.resize(control.id); });
            control.resizeObserver.observe(control.element);
        }
        control.element.classList.remove('is-loading');
        control.status.textContent = '';
        emit(control, 'sdkLoaded', { naver: window.naver });
        emit(control, 'initialized', { map: control.map });
        control.pendingValue = null;
        return control.map;
    }

    function targetOf(control, target) {
        if (!control) { return null; }
        if (!target || target === 'map') { return control.map; }
        if (target === 'data') { return control.map ? control.map.data : null; }
        if (target === 'infoWindow') { return control.infoWindow; }
        if (target === 'drawing') { return control.drawingManager; }
        return control.overlays[target] || control.layers[target] || control.extensions[target] || null;
    }

    function registryRemove(registry, id) {
        var value = registry[id];
        if (!value) { return null; }
        if (value.setMap) { value.setMap(null); }
        if (value.close) { value.close(); }
        delete registry[id];
        return value;
    }

    $navermap.extend({
        name: 'syn.uicontrols.$navermap',
        version: 'v2026.7.27',
        mapControls: [],
        sdkPromise: null,
        sdkSignature: null,
        authFailureInstalled: false,
        previousAuthFailure: null,
        syntheticEvents: ['sdkLoaded', 'initialized', 'dataBound', 'selectionChange', 'infoWindowOpen', 'infoWindowClose', 'authFailure', 'resized', 'disposed', 'error'],
        defaultSetting: {
            width: '100%',
            height: '400px',
            apiKey: '',
            apiUrl: 'https://oapi.map.naver.com/openapi/v3/maps.js',
            submodules: ['panorama', 'geocoder', 'drawing', 'visualization'],
            language: 'ko',
            loadTimeout: 15000,
            mapOptions: { center: { lat: 36.5, lng: 127.8 }, zoom: 7, minZoom: 6, zoomControl: true, mapTypeControl: true, scaleControl: true },
            markerOptions: {},
            infoWindowOptions: {},
            openInfoWindowOnSelect: true,
            selectionMode: 'single',
            clearSelectionOnMapClick: true,
            preserveSelection: false,
            fitBoundsOnData: false,
            autoResize: true,
            poiMapping: {},
            dataAdapter: null,
            markerOptionsResolver: null,
            infoWindowContentResolver: null,
            dataType: 'string', belongID: null, getter: false, setter: false, controlText: null,
            validators: null, transactConfig: null, triggerConfig: null
        },

        addModuleList: function (el, moduleList, setting, controlType) {
            var form = el.closest('form');
            moduleList.push({ id: el.id, formDataFieldID: form ? form.getAttribute('syn-datafield') : '', field: el.getAttribute('syn-datafield'), module: this.name, type: controlType });
        },

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            if (!el) { return null; }
            setting = merge({}, $navermap.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) { setting = merge(setting, mod.hook.controlInit(elID, setting) || {}); }
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;
            var display = el.style.display;
            el.id = elID + '_hidden';
            try { el.setAttribute('syn-options', JSON.stringify(setting)); }
            catch (error) { log('$navermap.controlLoad', 'syn-options contains a non-serializable value.', 'Warning'); }
            el.style.display = 'none';
            var wrapper = document.createElement('div');
            wrapper.id = elID;
            wrapper.className = 'syn-navermap is-loading';
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            var canvas = document.createElement('div');
            canvas.id = elID + '_canvas';
            canvas.className = 'syn-navermap-canvas';
            var status = document.createElement('div');
            status.className = 'syn-navermap-status';
            status.textContent = '지도를 불러오는 중입니다.';
            wrapper.appendChild(canvas);
            wrapper.appendChild(status);
            el.parentNode.insertBefore(wrapper, el.nextSibling);
            var control = {
                id: elID, originalElement: el, originalDisplay: display, element: wrapper, canvas: canvas, status: status,
                config: setting, map: null, rawValue: [], metaColumns: null, pois: [], selectionKeys: [], infoWindow: null,
                overlays: {}, layers: {}, extensions: {}, drawingManager: null, eventNames: parseEvents(el), mapListeners: [], runtimeListeners: [],
                resizeObserver: null, pendingValue: null, setValueVersion: 0, disposed: false, readyPromise: null
            };
            $navermap.mapControls.push(control);
            control.readyPromise = loadSDK(setting).then(function () { return createMap(control); }).catch(function (error) { return fail(control, '$navermap.controlLoad', error); });
            return control.readyPromise;
        },

        getControl: function (elID) { return $navermap.mapControls.find(function (item) { return item.id === elID; }) || null; },
        getMap: function (elID) { var control = $navermap.getControl(elID); return control ? control.map : null; },
        getNaver: function () { return window.naver || null; },
        ready: function (elID) { var control = $navermap.getControl(elID); return control ? control.readyPromise : Promise.resolve(null); },

        setValue: function (elID, value, metaColumns) {
            var control = $navermap.getControl(elID);
            if (!control) { return Promise.resolve(null); }
            var rows;
            try { rows = normalizeRows(value); }
            catch (error) { fail(control, '$navermap.setValue', error); return Promise.resolve(null); }
            var token = ++control.setValueVersion;
            if (!control.map) { control.pendingValue = { value: rows, metaColumns: metaColumns }; }
            var adapter = resolveFunction(control.config.dataAdapter);
            var operation;
            try { operation = adapter ? adapter(clone(rows), metaColumns, control) : rows; }
            catch (error) { fail(control, '$navermap.setValue', error); return Promise.resolve(null); }
            return control.readyPromise.then(function () { return Promise.resolve(operation); }).then(function (adapted) {
                if (token !== control.setValueVersion || !control.map || control.disposed) { return control.map; }
                var normalized = normalizeRows(adapted);
                normalizePois(normalized, control.config);
                return applyPois(control, normalized, metaColumns);
            }).catch(function (error) { return fail(control, '$navermap.setValue', error); });
        },

        getValue: function (elID, requestType, metaColumns) {
            var control = $navermap.getControl(elID);
            if (!control) { return requestType ? [] : null; }
            var rows = selectedPois(control).map(function (poi) { return clone(poi.row); });
            if (!requestType) { return control.config.selectionMode === 'multiple' ? rows : (rows[0] || null); }
            if (requestType === 'Row') { rows = rows.length ? [rows[rows.length - 1]] : []; }
            return serializeRows(rows, requestType, metaColumns || control.metaColumns);
        },

        getRawValue: function (elID) { var control = $navermap.getControl(elID); return control ? clone(control.rawValue) : []; },
        getSelection: function (elID) { return getSelection($navermap.getControl(elID)); },
        getSelectedRows: function (elID) { var control = $navermap.getControl(elID); return control ? selectedPois(control).map(function (poi) { return clone(poi.row); }) : []; },
        getMarkers: function (elID) { var control = $navermap.getControl(elID); return control ? control.pois.map(function (poi) { return poi.marker; }) : []; },
        getSelectedMarkers: function (elID) { var control = $navermap.getControl(elID); return control ? selectedPois(control).map(function (poi) { return poi.marker; }) : []; },
        getMarker: function (elID, indexOrId) {
            var control = $navermap.getControl(elID);
            if (!control) { return null; }
            for (var i = 0; i < control.pois.length; i++) {
                if (i === indexOrId || control.pois[i].id === String(indexOrId) || control.pois[i].key === indexOrId) { return control.pois[i].marker; }
            }
            return null;
        },
        getInfoWindow: function (elID) { var control = $navermap.getControl(elID); return control ? control.infoWindow : null; },

        setSelection: function (elID, value, source) {
            var control = $navermap.getControl(elID);
            if (!control || control.config.selectionMode === 'none') { return null; }
            var requested = asArray(value);
            control.selectionKeys = [];
            for (var r = 0; r < requested.length; r++) {
                for (var i = 0; i < control.pois.length; i++) {
                    var poi = control.pois[i];
                    if (i === requested[r] || poi.id === String(requested[r]) || poi.key === requested[r]) {
                        control.selectionKeys.push(poi.key);
                        if (control.config.selectionMode !== 'multiple') { r = requested.length; }
                        break;
                    }
                }
            }
            var selected = selectedPois(control);
            if (selected.length) { openInfo(control, selected[selected.length - 1]); } else { closeInfo(control); }
            emit(control, 'selectionChange', { source: source || 'api', selection: getSelection(control) });
            return getSelection(control);
        },

        clearSelection: function (elID, source) {
            var control = $navermap.getControl(elID);
            if (!control) { return; }
            var changed = control.selectionKeys.length > 0;
            control.selectionKeys = [];
            closeInfo(control);
            if (changed) { emit(control, 'selectionChange', { source: source || 'api', selection: getSelection(control) }); }
        },

        setOptions: function (elID, options) { var map = $navermap.getMap(elID); if (map) { map.setOptions(options || {}); } return map; },
        getOptions: function (elID, key) { var map = $navermap.getMap(elID); return map && map.getOptions ? map.getOptions(key) : null; },
        setCenter: function (elID, value) { var map = $navermap.getMap(elID); if (map) { map.setCenter(latLng(value)); } },
        getCenter: function (elID) { var map = $navermap.getMap(elID); return map ? map.getCenter() : null; },
        setZoom: function (elID, value, useEffect) { var map = $navermap.getMap(elID); if (map) { map.setZoom(Number(value), !!useEffect); } },
        getZoom: function (elID) { var map = $navermap.getMap(elID); return map ? map.getZoom() : null; },
        fitBounds: function (elID, value, margin) { var map = $navermap.getMap(elID); if (map) { map.fitBounds(bounds(value), margin); } },
        panTo: function (elID, value, options) { var map = $navermap.getMap(elID); if (map) { map.panTo(latLng(value), options); } },
        panToBounds: function (elID, value, options) { var map = $navermap.getMap(elID); if (map) { map.panToBounds(bounds(value), options); } },
        panBy: function (elID, delta, options) { var map = $navermap.getMap(elID); if (map) { map.panBy(delta, options); } },
        getBounds: function (elID) { var map = $navermap.getMap(elID); return map ? map.getBounds() : null; },
        setMapTypeId: function (elID, value) { var map = $navermap.getMap(elID); if (map) { map.setMapTypeId(value); } },
        resize: function (elID) {
            var control = $navermap.getControl(elID);
            if (!control || !control.map) { return; }
            var Event = naverEvent();
            if (Event && Event.trigger) { Event.trigger(control.map, 'resize'); }
            emit(control, 'resized', { width: control.element.clientWidth, height: control.element.clientHeight });
        },

        updateMarker: function (elID, indexOrId, options) { var marker = $navermap.getMarker(elID, indexOrId); if (marker) { marker.setOptions(options || {}); } return marker; },
        setMarkerVisible: function (elID, indexOrId, visible) { var marker = $navermap.getMarker(elID, indexOrId); var map = $navermap.getMap(elID); if (marker) { marker.setMap(visible ? map : null); } },
        openInfoWindow: function (elID, indexOrId) {
            var control = $navermap.getControl(elID);
            if (!control) { return null; }
            for (var i = 0; i < control.pois.length; i++) {
                if (i === indexOrId || control.pois[i].id === String(indexOrId) || control.pois[i].key === indexOrId) { return openInfo(control, control.pois[i]); }
            }
            return null;
        },
        closeInfoWindow: function (elID) { var control = $navermap.getControl(elID); if (control) { closeInfo(control); } },
        invokeMarker: function (elID, indexOrId, method, args) { var marker = $navermap.getMarker(elID, indexOrId); return marker && typeof marker[method] === 'function' ? marker[method].apply(marker, args || []) : null; },

        addGeoJson: function (elID, geoJson, autoStyle) { var map = $navermap.getMap(elID); return map && map.data ? map.data.addGeoJson(geoJson, autoStyle) : null; },
        removeGeoJson: function (elID, feature) { var map = $navermap.getMap(elID); return map && map.data ? map.data.removeFeature(feature) : null; },
        setDataStyle: function (elID, style) { var map = $navermap.getMap(elID); if (map && map.data) { map.data.setStyle(style); } },
        overrideDataStyle: function (elID, feature, style) { var map = $navermap.getMap(elID); if (map && map.data) { map.data.overrideStyle(feature, style); } },
        revertDataStyle: function (elID, feature) { var map = $navermap.getMap(elID); if (map && map.data) { map.data.revertStyle(feature); } },

        addOverlay: function (elID, id, type, options) {
            var control = $navermap.getControl(elID);
            var allowed = ['Marker', 'InfoWindow', 'Polyline', 'Polygon', 'Circle', 'Ellipse', 'Rectangle', 'GroundOverlay'];
            if (!control || allowed.indexOf(type) < 0 || !window.naver.maps[type]) { throw errorOf('INVALID_OVERLAY_TYPE', '지원하지 않는 오버레이 형식입니다: ' + type); }
            registryRemove(control.overlays, id);
            var config = merge({}, options || {});
            if (config.position) { config.position = latLng(config.position); }
            if (config.center) { config.center = latLng(config.center); }
            if (config.bounds) { config.bounds = bounds(config.bounds); }
            config.map = config.map === undefined ? control.map : config.map;
            control.overlays[id] = new window.naver.maps[type](config);
            return control.overlays[id];
        },
        getOverlay: function (elID, id) { var control = $navermap.getControl(elID); return control ? control.overlays[id] || null : null; },
        removeOverlay: function (elID, id) { var control = $navermap.getControl(elID); return control ? registryRemove(control.overlays, id) : null; },

        createLayer: function (elID, id, type, options) {
            var control = $navermap.getControl(elID);
            var allowed = ['TrafficLayer', 'BicycleLayer', 'CadastralLayer', 'StreetLayer', 'LabelLayer'];
            if (!control || allowed.indexOf(type) < 0 || !window.naver.maps[type]) { throw errorOf('INVALID_LAYER_TYPE', '지원하지 않는 레이어 형식입니다: ' + type); }
            registryRemove(control.layers, id);
            control.layers[id] = new window.naver.maps[type](options || {});
            if (control.layers[id].setMap) { control.layers[id].setMap(control.map); }
            return control.layers[id];
        },
        getLayer: function (elID, id) { var control = $navermap.getControl(elID); return control ? control.layers[id] || null : null; },
        setLayerVisible: function (elID, id, visible) { var control = $navermap.getControl(elID); var layer = control ? control.layers[id] : null; if (layer && layer.setMap) { layer.setMap(visible ? control.map : null); } },
        removeLayer: function (elID, id) { var control = $navermap.getControl(elID); return control ? registryRemove(control.layers, id) : null; },

        geocode: function (query) { return $navermap.service('geocode', query); },
        reverseGeocode: function (query) { return $navermap.service('reverseGeocode', query); },
        transCoord: function (query) { return $navermap.service('transCoord', query); },
        service: function (method, query) {
            return new Promise(function (resolve, reject) {
                var service = window.naver && window.naver.maps ? window.naver.maps.Service : null;
                if (!service || typeof service[method] !== 'function') { reject(errorOf('NAVER_MAP_SUBMODULE_REQUIRED', 'geocoder 서브모듈이 필요합니다.')); return; }
                service[method](query || {}, function (status, response) {
                    var ok = service.Status ? status === service.Status.OK : String(status).toLowerCase() === 'ok';
                    if (ok) { resolve(response); } else { reject(errorOf('NAVER_MAP_SERVICE_ERROR', method + ' 요청에 실패했습니다.', { status: status, response: response })); }
                });
            });
        },

        createDrawingManager: function (elID, options) {
            var control = $navermap.getControl(elID);
            var DrawingManager = window.naver && window.naver.maps && window.naver.maps.drawing ? window.naver.maps.drawing.DrawingManager : null;
            if (!control || !DrawingManager) { throw errorOf('NAVER_MAP_SUBMODULE_REQUIRED', 'drawing 서브모듈이 필요합니다.'); }
            if (control.drawingManager && control.drawingManager.setMap) { control.drawingManager.setMap(null); }
            control.drawingManager = new DrawingManager(merge({ map: control.map }, options || {}));
            return control.drawingManager;
        },
        createPanorama: function (elID, id, container, options) {
            var control = $navermap.getControl(elID);
            if (!control || !window.naver.maps.Panorama) { throw errorOf('NAVER_MAP_SUBMODULE_REQUIRED', 'panorama 서브모듈이 필요합니다.'); }
            var element = typeof container === 'string' ? document.getElementById(container) : container;
            control.extensions[id] = new window.naver.maps.Panorama(element, options || {});
            return control.extensions[id];
        },
        createVisualization: function (elID, id, type, options) {
            var control = $navermap.getControl(elID);
            var visual = window.naver && window.naver.maps ? window.naver.maps.visualization : null;
            if (!control || !visual || ['HeatMap', 'DotMap'].indexOf(type) < 0 || !visual[type]) { throw errorOf('NAVER_MAP_SUBMODULE_REQUIRED', 'visualization 서브모듈 또는 형식을 확인하세요.'); }
            registryRemove(control.extensions, id);
            control.extensions[id] = new visual[type](merge({ map: control.map }, options || {}));
            return control.extensions[id];
        },

        on: function (elID, target, eventName, handler) {
            var control = $navermap.getControl(elID);
            if (arguments.length === 3) { handler = eventName; eventName = target; target = 'map'; }
            var callback = resolveFunction(handler);
            var nativeTarget = targetOf(control, target);
            if (!control || !nativeTarget || !callback) { return null; }
            var listener = function (event) { callback(control.id, event, getSelection(control)); };
            var handle = addListener(nativeTarget, eventName, listener);
            control.runtimeListeners.push({ target: target, eventName: eventName, handler: handler, handle: handle });
            return handle;
        },
        off: function (elID, target, eventName, handler) {
            var control = $navermap.getControl(elID);
            if (!control) { return; }
            if (arguments.length === 3) { handler = eventName; eventName = target; target = 'map'; }
            var Event = naverEvent();
            for (var i = control.runtimeListeners.length - 1; i >= 0; i--) {
                var item = control.runtimeListeners[i];
                if (item.target === target && item.eventName === eventName && (!handler || item.handler === handler || item.handle === handler)) {
                    if (Event) { Event.removeListener(item.handle); }
                    control.runtimeListeners.splice(i, 1);
                }
            }
        },
        invoke: function (elID, target, method, args) {
            var control = $navermap.getControl(elID);
            if (arguments.length === 3) { args = method; method = target; target = 'map'; }
            var nativeTarget = targetOf(control, target);
            return nativeTarget && typeof nativeTarget[method] === 'function' ? nativeTarget[method].apply(nativeTarget, args || []) : null;
        },
        invokeGlobal: function (path, method, args) {
            var target = window.naver;
            var names = String(path || '').split('.');
            for (var i = 0; i < names.length && target; i++) { if (names[i] && names[i] !== 'naver') { target = target[names[i]]; } }
            return target && typeof target[method] === 'function' ? target[method].apply(target, args || []) : null;
        },

        clear: function (elID) { return $navermap.setValue(elID, []); },
        dispose: function (elID) {
            var control = $navermap.getControl(elID);
            if (!control) { return; }
            control.disposed = true;
            control.setValueVersion++;
            closeInfo(control);
            removeListeners(control.mapListeners);
            var Event = naverEvent();
            for (var i = 0; i < control.runtimeListeners.length; i++) { if (Event) { Event.removeListener(control.runtimeListeners[i].handle); } }
            control.runtimeListeners.length = 0;
            for (var p = 0; p < control.pois.length; p++) { destroyPoi(control.pois[p]); }
            for (var overlay in control.overlays) { if (hasOwn(control.overlays, overlay)) { registryRemove(control.overlays, overlay); } }
            for (var layer in control.layers) { if (hasOwn(control.layers, layer)) { registryRemove(control.layers, layer); } }
            for (var extension in control.extensions) { if (hasOwn(control.extensions, extension)) { registryRemove(control.extensions, extension); } }
            if (control.drawingManager && control.drawingManager.setMap) { control.drawingManager.setMap(null); }
            if (control.resizeObserver) { control.resizeObserver.disconnect(); }
            emit(control, 'disposed', {});
            if (control.element.parentNode) { control.element.parentNode.removeChild(control.element); }
            control.originalElement.id = elID;
            control.originalElement.style.display = control.originalDisplay;
            $navermap.mapControls.splice($navermap.mapControls.indexOf(control), 1);
        }
    });

    syn.uicontrols.$navermap = $navermap;
})(window);
