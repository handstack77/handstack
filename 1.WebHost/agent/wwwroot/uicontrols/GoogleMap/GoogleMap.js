(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module;
    var $googlemap = syn.uicontrols.$googlemap || new syn.module;
    function hasOwn(target, name) {
        return target && Object.prototype.hasOwnProperty.call(target, name)
    }
    function isPlainObject(value) {
        return value && Object.prototype.toString.call(value) === '[object Object]'
    }
    function clone(value, seen, copies) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return value
        }
        if (value instanceof Date) {
            return new Date(value.getTime())
        }
        if (!Array.isArray(value) && !isPlainObject(value)) {
            return value
        }
        seen = seen || [];
        copies = copies || [];
        var found = seen.indexOf(value);
        if (found > -1) {
            return copies[found]
        }
        var result = Array.isArray(value) ? [] : {};
        seen.push(value);
        copies.push(result);
        for (var key in value) {
            if (hasOwn(value, key)) {
                result[key] = clone(value[key], seen, copies)
            }
        }
        return result
    }
    function merge(target) {
        target = target || {};
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (!source || typeof source !== 'object') {
                continue
            }
            for (var key in source) {
                if (!hasOwn(source, key)) {
                    continue
                }
                var value = source[key];
                if (isPlainObject(value)) {
                    target[key] = merge(isPlainObject(target[key]) ? target[key] : {}, value)
                }
                else {
                    target[key] = clone(value)
                }
            }
        }
        return target
    }
    function asArray(value) {
        return value === null || value === undefined ? [] : (Array.isArray(value) ? value : [
            value
        ])
    }
    function resolveFunction(value) {
        if (typeof value === 'function') {
            return value
        }
        if (typeof value !== 'string' || !value) {
            return null
        }
        var current = window;
        var path = value.split('.');
        for (var i = 0; i < path.length && current; i++) {
            current = current[path[i]]
        }
        return typeof current === 'function' ? current : null
    }
    function log(scope, error, level) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog(scope, error && error.message ? error.message : String(error), level || 'Error')
        }
    }
    function parseEvents(el) {
        var text = el ? el.getAttribute('syn-events') : '';
        if (!text) {
            return []
        }
        try {
            var events = eval(text);
            return Array.isArray(events) ? events : []
        }
        catch (error) {
            log('$googlemap.parseEvents', error, 'Warning');
            return []
        }
    }
    function pageHandler(id, eventName) {
        var mod = window[syn.$w.pageScript];
        return mod && mod.event ? mod.event[id + '_' + eventName] : null
    }
    function emit(control, eventName, payload) {
        var handler = pageHandler(control.id, eventName);
        if (!handler) {
            return
        }
        try {
            handler.apply(control.element, [
                control.id,
                payload || {},
                getSelection(control)
            ])
        }
        catch (error) {
            log('$googlemap.emit.' + eventName, error)
        }
    }
    function errorOf(code, message, detail) {
        var error = new Error(message);
        error.code = code;
        if (detail !== undefined) {
            error.detail = detail
        }
        return error
    }
    function fail(control, scope, error) {
        log(scope, error);
        if (control) {
            var fatal = !control.map || /^GOOGLE_MAP_(?:API_KEY|MAP_ID|SDK|AUTH)/.test(error.code || '');
            if (fatal) {
                control.element.classList.remove('is-loading');
                control.element.classList.add('is-error');
                control.status.textContent = error.message || String(error)
            }
            emit(control, 'error', {
                code: error.code || 'GOOGLE_MAP_ERROR',
                message: error.message || String(error),
                detail: error.detail
            })
        }
        return null
    }
    function normalizeRows(value) {
        if (value === null || value === undefined) {
            return []
        }
        if (!Array.isArray(value) && !isPlainObject(value)) {
            throw errorOf('INVALID_POI_DATA', 'setValue는 단일 객체 또는 객체 배열만 허용합니다.');
        }
        var rows = asArray(value);
        for (var i = 0; i < rows.length; i++) {
            if (!isPlainObject(rows[i])) {
                throw errorOf('INVALID_POI_DATA', '모든 POI 데이터는 객체여야 합니다.', {
                    rowIndexes: [
                        i
                    ]
                });
            }
        }
        return clone(rows)
    }
    function mapped(row, mapping, name, aliases) {
        var resolver = mapping ? mapping[name] : null;
        if (typeof resolver === 'function') {
            return resolver(row)
        }
        if (typeof resolver === 'string' && hasOwn(row, resolver)) {
            return row[resolver]
        }
        for (var i = 0; i < aliases.length; i++) {
            if (hasOwn(row, aliases[i])) {
                return row[aliases[i]]
            }
        }
        return undefined
    }
    function bool(value, fallback) {
        if (value === undefined || value === null || value === '') {
            return fallback
        }
        if (typeof value === 'string') {
            return /^(true|y|yes|1)$/i.test(value)
        }
        return value === true || value === 1
    }
    function number(value) {
        if (value === null || value === undefined || value === '') {
            return NaN
        }
        return Number(value)
    }
    function normalizePoi(row, index, setting) {
        var mapping = setting.poiMapping || {};
        var latitude = number(mapped(row, mapping, 'latitude', ['LAT', 'lat', 'latitude', 'Latitude']));
        var longitude = number(mapped(row, mapping, 'longitude', ['LNG', 'lng', 'longitude', 'Longitude']));
        if (!isFinite(latitude) || !isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw errorOf('INVALID_POI_COORDINATE', '유효하지 않은 POI 좌표가 있습니다.', {
                rowIndexes: [
                    index
                ],
                latitude: latitude,
                longitude: longitude
            });
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
            pinOptions: mapped(row, mapping, 'pinOptions', ['PinOptions', 'pinOptions']),
            markerOptions: mapped(row, mapping, 'markerOptions', ['MarkerOptions', 'markerOptions']),
            infoWindowContent: mapped(row, mapping, 'infoWindowContent', ['InfoWindowContent', 'infoWindowContent']),
            visible: bool(mapped(row, mapping, 'visible', ['Visible', 'visible']), true),
            draggable: bool(mapped(row, mapping, 'draggable', ['Draggable', 'draggable']), false),
            zIndex: mapped(row, mapping, 'zIndex', ['ZIndex', 'zIndex'])
        }
    }
    function normalizePois(rows, setting) {
        var result = [];
        var invalid = [];
        for (var i = 0; i < rows.length; i++) {
            try {
                result.push(normalizePoi(rows[i], i, setting))
            }
            catch (error) {
                invalid.push(i)
            }
        }
        if (invalid.length) {
            throw errorOf('INVALID_POI_COORDINATE', '유효하지 않은 POI 좌표가 있습니다: ' + invalid.join(', '), { rowIndexes: invalid });
        }
        return result
    }
    function selectionOf(poi) {
        if (!poi) {
            return null
        }
        var position = poi.marker ? poi.marker.position : null;
        return {
            poiIndex: poi.index,
            poiId: poi.id,
            position: {
                lat: position && typeof position.lat === 'function' ? position.lat() : (position && position.lat !== undefined ? Number(position.lat) : poi.latitude),
                lng: position && typeof position.lng === 'function' ? position.lng() : (position && position.lng !== undefined ? Number(position.lng) : poi.longitude)
            },
            row: clone(poi.row)
        }
    }
    function selectedPois(control) {
        var result = [];
        for (var keyIndex = 0; keyIndex < control.selectionKeys.length; keyIndex++) {
            for (var i = 0; i < control.pois.length; i++) {
                if (control.pois[i].key === control.selectionKeys[keyIndex]) {
                    result.push(control.pois[i]);
                    break
                }
            }
        }
        return result
    }
    function getSelection(control) {
        if (!control) {
            return null
        }
        var values = selectedPois(control).map(selectionOf);
        return control.config.selectionMode === 'multiple' ? values : (values[0] || null)
    }
    function serializeRows(rows, requestType, metaColumns) {
        if (requestType !== 'Row' && requestType !== 'List') {
            return []
        }
        var columns = metaColumns || null;
        return rows.map(function (row) {
            var result = [];
            if (Array.isArray(columns)) {
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    var name = typeof column === 'string' ? column : (column.data || column.field || column.name || column.ColumnName);
                    var fieldID = typeof column === 'string' ? name : (column.fieldID || column.FieldID || name);
                    if (name) {
                        result.push({
                            prop: fieldID,
                            val: row ? row[name] : undefined
                        })
                    }
                }
            }
            else if (columns) {
                for (var columnKey in columns) {
                    if (!hasOwn(columns, columnKey)) {
                        continue
                    }
                    var meta = columns[columnKey] || {};
                    var metaFieldID = meta.fieldID || meta.FieldID || columnKey;
                    var dataType = meta.dataType || meta.DataType;
                    var metaValue = row ? row[columnKey] : undefined;
                    if (metaValue === undefined && window.$object && $object.defaultValue) {
                        metaValue = String(dataType || '').toLowerCase() === 'number' ? null : $object.defaultValue(dataType)
                    }
                    result.push({
                        prop: metaFieldID,
                        val: metaValue
                    })
                }
            }
            else {
                for (var key in row) {
                    if (hasOwn(row, key)) {
                        result.push({
                            prop: key,
                            val: row[key]
                        })
                    }
                }
            }
            return result
        })
    }
    function googleEvent() {
        return window.google && window.google.maps ? window.google.maps.event : null
    }
    function addListener(target, eventName, listener, bucket) {
        var Event = googleEvent();
        if (!Event || !target) {
            return null
        }
        var handle = Event.addListener(target, eventName, listener);
        if (bucket) {
            bucket.push(handle)
        }
        return handle
    }
    function removeListeners(bucket) {
        var Event = googleEvent();
        if (!Event) {
            bucket.length = 0;
            return
        }
        for (var i = 0; i < bucket.length; i++) {
            if (bucket[i] && typeof bucket[i].remove === 'function') {
                bucket[i].remove()
            }
            else {
                Event.removeListener(bucket[i])
            }
        }
        bucket.length = 0
    }
    function latLng(value) {
        if (!value || !window.google || !window.google.maps) {
            return value
        }
        if (value instanceof window.google.maps.LatLng) {
            return value
        }
        if (Array.isArray(value)) {
            return new window.google.maps.LatLng(Number(value[0]), Number(value[1]))
        }
        var lat = value.lat !== undefined ? value.lat : (value.latitude !== undefined ? value.latitude : value.y);
        var lng = value.lng !== undefined ? value.lng : (value.longitude !== undefined ? value.longitude : value.x);
        return new window.google.maps.LatLng(Number(lat), Number(lng))
    }
    function bounds(value) {
        if (!value || !window.google || !window.google.maps) {
            return value
        }
        if (value instanceof window.google.maps.LatLngBounds) {
            return value
        }
        if (value.south !== undefined && value.west !== undefined && value.north !== undefined && value.east !== undefined) {
            return new window.google.maps.LatLngBounds({
                lat: Number(value.south),
                lng: Number(value.west)
            }, {
                lat: Number(value.north),
                lng: Number(value.east)
            })
        }
        var sw = value.sw || value.southWest || value[0];
        var ne = value.ne || value.northEast || value[1];
        return new window.google.maps.LatLngBounds(latLng(sw), latLng(ne))
    }
    function configureAuthFailure() {
        if ($googlemap.authFailureInstalled) {
            return
        }
        $googlemap.authFailureInstalled = true;
        $googlemap.previousAuthFailure = window.gm_authFailure;
        window.gm_authFailure = function () {
            if (typeof $googlemap.previousAuthFailure === 'function') {
                try {
                    $googlemap.previousAuthFailure.apply(window, arguments)
                }
                catch (error) {
                    log('$googlemap.authFailure.previous', error)
                }
            }
            for (var i = 0; i < $googlemap.mapControls.length; i++) {
                var control = $googlemap.mapControls[i];
                var authError = errorOf('GOOGLE_MAP_AUTH_FAILURE', 'Google Maps API 인증에 실패했습니다.');
                fail(control, '$googlemap.authFailure', authError);
                emit(control, 'authFailure', {
                    code: authError.code,
                    message: authError.message
                })
            }
        }
    }
    function sdkKey(setting) {
        var configured = window.syn && syn.Config ? syn.Config.GoogleMapApiKey : '';
        return setting.apiKey || configured || ''
    }
    function sdkMapId(setting) {
        var configured = window.syn && syn.Config ? syn.Config.GoogleMapID : '';
        return setting.mapId || (setting.mapOptions && setting.mapOptions.mapId) || configured || ''
    }
    function ensureLibraries(setting) {
        var libraries = asArray(setting.libraries).filter(Boolean);
        if (!window.google || !window.google.maps) {
            return Promise.reject(errorOf('GOOGLE_MAP_SDK_INVALID', 'Google Maps SDK를 초기화할 수 없습니다.'))
        }
        if (typeof window.google.maps.importLibrary !== 'function') {
            return Promise.resolve(window.google)
        }
        return Promise.all(libraries.map(function (name) {
            return window.google.maps.importLibrary(name)
        })).then(function () {
            return window.google
        })
    }
    function loadSDK(setting) {
        configureAuthFailure();
        var mapId = sdkMapId(setting);
        if (!mapId) {
            return Promise.reject(errorOf('GOOGLE_MAP_MAP_ID_REQUIRED', 'syn.Config.GoogleMapID, mapId 옵션 또는 mapOptions.mapId가 필요합니다.'))
        }
        setting.mapId = mapId;
        if (window.google && window.google.maps && (window.google.maps.Map || typeof window.google.maps.importLibrary === 'function')) {
            return ensureLibraries(setting)
        }
        var key = sdkKey(setting) || $googlemap.sdkApiKey || '';
        if (!key) {
            return Promise.reject(errorOf('GOOGLE_MAP_API_KEY_REQUIRED', 'syn.Config.GoogleMapApiKey 또는 apiKey 옵션이 필요합니다.'))
        }
        var libraries = asArray(setting.libraries).filter(Boolean).join(',');
        var signature = [
            setting.apiUrl,
            key,
            setting.version,
            setting.language,
            setting.region,
            setting.authReferrerPolicy,
            setting.channel,
            setting.solutionChannel
        ].join('|');
        if ($googlemap.sdkPromise) {
            if ($googlemap.sdkSignature !== signature) {
                return Promise.reject(errorOf('GOOGLE_MAP_SDK_CONFLICT', '이미 다른 Google Maps SDK 설정으로 로딩을 시작했습니다.'))
            }
            return $googlemap.sdkPromise.then(function () {
                return ensureLibraries(setting)
            })
        }
        $googlemap.sdkApiKey = key;
        $googlemap.sdkSignature = signature;
        $googlemap.sdkPromise = new Promise(function (resolve, reject) {
            var callbackName = '__handstackGoogleMapLoaded';
            var script = document.createElement('script');
            var query = [
                'key=' + encodeURIComponent(key),
                'loading=async',
                'callback=' + callbackName
            ];
            if (setting.version) {
                query.push('v=' + encodeURIComponent(setting.version))
            }
            if (libraries) {
                query.push('libraries=' + encodeURIComponent(libraries))
            }
            if (setting.language) {
                query.push('language=' + encodeURIComponent(setting.language))
            }
            if (setting.region) {
                query.push('region=' + encodeURIComponent(setting.region))
            }
            if (setting.authReferrerPolicy) {
                query.push('auth_referrer_policy=' + encodeURIComponent(setting.authReferrerPolicy))
            }
            if (mapId) {
                query.push('map_ids=' + encodeURIComponent(mapId))
            }
            if (setting.channel) {
                query.push('channel=' + encodeURIComponent(setting.channel))
            }
            if (setting.solutionChannel) {
                query.push('solution_channel=' + encodeURIComponent(setting.solutionChannel))
            }
            var timeout = window.setTimeout(function () {
                reject(errorOf('GOOGLE_MAP_SDK_TIMEOUT', 'Google Maps SDK 로딩 시간이 초과되었습니다.'))
            }, Number(setting.loadTimeout) || 15000);
            window[callbackName] = function () {
                window.clearTimeout(timeout);
                try {
                    delete window[callbackName]
                }
                catch (ignore) {
                    window[callbackName] = undefined
                }
                if (window.google && window.google.maps && window.google.maps.Map) {
                    ensureLibraries(setting).then(resolve, reject)
                }
                else {
                    reject(errorOf('GOOGLE_MAP_SDK_INVALID', 'Google Maps SDK를 초기화할 수 없습니다.'))
                }
            };
            script.async = true;
            script.defer = true;
            var nonceScript = document.querySelector('script[nonce]');
            if (nonceScript) {
                script.nonce = nonceScript.nonce || nonceScript.getAttribute('nonce')
            }
            script.src = String(setting.apiUrl || '').replace(/[?&]$/, '') + (String(setting.apiUrl).indexOf('?') > -1 ? '&' : '?') + query.join('&');
            script.onerror = function () {
                window.clearTimeout(timeout);
                reject(errorOf('GOOGLE_MAP_SDK_LOAD_FAILED', 'Google Maps SDK를 불러오지 못했습니다.'))
            };
            document.head.appendChild(script)
        });
        return $googlemap.sdkPromise
    }
    function infoContent(control, poi) {
        var resolver = resolveFunction(control.config.infoWindowContentResolver);
        var content = resolver ? resolver(clone(poi.row), poi.index, control) : poi.infoWindowContent;
        if (content !== undefined && content !== null) {
            return content
        }
        var box = document.createElement('div');
        box.className = 'syn-googlemap-infowindow';
        box.style.padding = '10px 12px';
        if (poi.title !== undefined && poi.title !== null) {
            var title = document.createElement('strong');
            title.textContent = String(poi.title);
            box.appendChild(title)
        }
        if (poi.description !== undefined && poi.description !== null) {
            var description = document.createElement('div');
            description.textContent = String(poi.description);
            box.appendChild(description)
        }
        return box
    }
    function closeInfo(control) {
        if (control.infoWindow && control.infoWindow.close) {
            control.infoWindow.close();
            emit(control, 'infoWindowClose', {})
        }
    }
    function openInfo(control, poi) {
        if (!control.config.openInfoWindowOnSelect || !poi) {
            return null
        }
        closeInfo(control);
        var options = merge({}, control.config.infoWindowOptions || {}, { content: infoContent(control, poi) });
        control.infoWindow = new window.google.maps.InfoWindow(options);
        control.infoWindow.open({
            map: control.map,
            anchor: poi.marker
        });
        emit(control, 'infoWindowOpen', {
            selection: selectionOf(poi),
            infoWindow: control.infoWindow
        });
        return control.infoWindow
    }
    function changeSelection(control, poi, source, event) {
        if (control.config.selectionMode === 'none') {
            return
        }
        var changed = false;
        var index = control.selectionKeys.indexOf(poi.key);
        if (control.config.selectionMode === 'multiple') {
            if (index > -1) {
                control.selectionKeys.splice(index, 1)
            }
            else {
                control.selectionKeys.push(poi.key)
            }
            changed = true
        }
        else if (index < 0 || control.selectionKeys.length !== 1) {
            control.selectionKeys = [
                poi.key
            ];
            changed = true
        }
        if (control.selectionKeys.indexOf(poi.key) > -1) {
            openInfo(control, poi)
        }
        else {
            closeInfo(control)
        }
        if (changed) {
            emit(control, 'selectionChange', {
                source: source || 'api',
                event: event || null,
                selection: getSelection(control)
            })
        }
    }
    function contentNode(value) {
        if (value === null || value === undefined || value === '') {
            return null
        }
        if (value && value.nodeType) {
            return value.cloneNode(true)
        }
        if (isPlainObject(value) && hasOwn(value, 'content')) {
            return contentNode(value.content)
        }
        var element;
        if (isPlainObject(value) && value.url) {
            element = document.createElement('img');
            element.src = value.url;
            element.alt = value.alt || '';
            if (value.width) {
                element.style.width = typeof value.width === 'number' ? value.width + 'px' : value.width
            }
            if (value.height) {
                element.style.height = typeof value.height === 'number' ? value.height + 'px' : value.height
            }
            return element
        }
        if (typeof value === 'string' && !/^\s*</.test(value)) {
            element = document.createElement('img');
            element.src = value;
            element.alt = '';
            return element
        }
        element = document.createElement('div');
        element.innerHTML = String(value);
        return element.childNodes.length === 1 ? element.removeChild(element.firstChild) : element
    }
    function setMarkerMap(marker, map) {
        if (marker) {
            marker.map = map || null
        }
    }
    function markerPosition(marker) {
        return marker ? marker.position : null
    }
    function applyMarkerContent(marker, visual) {
        if (!marker || visual === undefined) {
            return
        }
        var node = contentNode(visual);
        if (marker.replaceChildren) {
            marker.replaceChildren()
        }
        else {
            while (marker.firstChild) {
                marker.removeChild(marker.firstChild)
            }
        }
        if (node) {
            marker.appendChild(node)
        }
    }
    function advancedMarkerDescriptor(control, poi) {
        var options = merge({}, control.config.markerOptions || {}, isPlainObject(poi.markerOptions) ? poi.markerOptions : {});
        var resolver = resolveFunction(control.config.markerOptionsResolver);
        if (resolver) {
            options = merge(options, resolver(clone(poi.row), poi.index, control) || {})
        }
        var visual = hasOwn(options, 'content') ? options.content : poi.icon;
        delete options.content;
        delete options.icon;
        delete options.visible;
        delete options.draggable;
        options.map = null;
        options.position = new window.google.maps.LatLng(poi.latitude, poi.longitude);
        if (poi.title !== undefined) {
            options.title = String(poi.title)
        }
        options.gmpClickable = options.gmpClickable !== false;
        options.gmpDraggable = poi.draggable;
        if (poi.zIndex !== undefined && poi.zIndex !== null && poi.zIndex !== '') {
            options.zIndex = Number(poi.zIndex)
        }
        if (!visual && poi.pinOptions && window.google.maps.marker.PinElement) {
            visual = new window.google.maps.marker.PinElement(clone(poi.pinOptions))
        }
        return {
            options: options,
            visual: visual
        }
    }
    function createAdvancedMarker(control, poi) {
        var AdvancedMarkerElement = window.google && window.google.maps && window.google.maps.marker ? window.google.maps.marker.AdvancedMarkerElement : null;
        if (!AdvancedMarkerElement) {
            throw errorOf('GOOGLE_MAP_ADVANCED_MARKER_REQUIRED', 'Advanced Marker 라이브러리를 사용할 수 없습니다.');
        }
        var descriptor = advancedMarkerDescriptor(control, poi);
        var marker = new AdvancedMarkerElement(descriptor.options);
        if (descriptor.visual) {
            applyMarkerContent(marker, descriptor.visual)
        }
        return marker
    }
    function bindMarker(control, poi) {
        var events = ['click', 'dragstart', 'drag', 'dragend'];
        for (var i = 0; i < events.length; i++) {
            (function (eventName) {
                addListener(poi.marker, eventName, function (event) {
                    if (eventName === 'click') {
                        changeSelection(control, poi, 'poiClick', event)
                    }
                    if (eventName === 'dragend') {
                        var position = markerPosition(poi.marker);
                        poi.latitude = position && typeof position.lat === 'function' ? position.lat() : Number(position.lat);
                        poi.longitude = position && typeof position.lng === 'function' ? position.lng() : Number(position.lng)
                    }
                    var name = 'poi' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
                    emit(control, name, {
                        event: event,
                        selection: selectionOf(poi),
                        marker: poi.marker
                    })
                }, poi.listeners)
            })(events[i])
        }
        ['dblclick', 'mouseover', 'mouseout'].forEach(function (eventName) {
            var listener = function (event) {
                var name = 'poi' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
                emit(control, name, {
                    event: event,
                    selection: selectionOf(poi),
                    marker: poi.marker
                })
            };
            poi.marker.addEventListener(eventName, listener);
            poi.listeners.push({
                remove: function () {
                    poi.marker.removeEventListener(eventName, listener)
                }
            })
        })
    }
    function destroyPoi(poi) {
        removeListeners(poi.listeners || []);
        setMarkerMap(poi.marker, null)
    }
    function fitPois(control) {
        if (!control.config.fitBoundsOnData || !control.pois.length) {
            return
        }
        if (control.pois.length === 1) {
            control.map.setCenter(markerPosition(control.pois[0].marker));
            return
        }
        var result = new window.google.maps.LatLngBounds;
        for (var i = 0; i < control.pois.length; i++) {
            result.extend(markerPosition(control.pois[i].marker))
        }
        control.map.fitBounds(result)
    }
    function applyPois(control, rows, metaColumns) {
        var normalized = normalizePois(rows, control.config);
        var created = [];
        try {
            for (var i = 0; i < normalized.length; i++) {
                var poi = normalized[i];
                poi.listeners = [];
                poi.marker = createAdvancedMarker(control, poi);
                bindMarker(control, poi);
                created.push(poi)
            }
        }
        catch (error) {
            for (var failed = 0; failed < created.length; failed++) {
                destroyPoi(created[failed])
            }
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
                if (created[poiIndex].key === previousKeys[keyIndex]) {
                    control.selectionKeys.push(previousKeys[keyIndex]);
                    break
                }
            }
        }
        for (var mapIndex = 0; mapIndex < created.length; mapIndex++) {
            if (created[mapIndex].visible) {
                setMarkerMap(created[mapIndex].marker, control.map)
            }
        }
        for (var oldIndex = 0; oldIndex < old.length; oldIndex++) {
            destroyPoi(old[oldIndex])
        }
        closeInfo(control);
        fitPois(control);
        emit(control, 'dataBound', {
            rowCount: rows.length,
            rows: clone(rows)
        });
        return control.map
    }
    function bindMapEvents(control) {
        var synthetic = $googlemap.syntheticEvents;
        var names = control.eventNames.slice();
        if (names.indexOf('click') < 0) {
            names.push('click')
        }
        for (var i = 0; i < names.length; i++) {
            (function (eventName) {
                if (synthetic.indexOf(eventName) > -1 || eventName.indexOf('poi') === 0) {
                    return
                }
                addListener(control.map, eventName, function (event) {
                    if (eventName === 'click' && control.config.clearSelectionOnMapClick) {
                        $googlemap.clearSelection(control.id, 'mapClick')
                    }
                    if (control.eventNames.indexOf(eventName) > -1) {
                        emit(control, eventName, event)
                    }
                }, control.mapListeners)
            })(names[i])
        }
    }
    function createMap(control) {
        if (control.disposed) {
            return null
        }
        control.element.classList.remove('is-error');
        var options = merge({}, control.config.mapOptions || {});
        options.center = latLng(options.center || {
            lat: 36.5,
            lng: 127.8
        });
        options.mapId = control.config.mapId;
        control.mapOptions = clone(options);
        control.map = new window.google.maps.Map(control.canvas, options);
        bindMapEvents(control);
        if (control.config.autoResize && window.ResizeObserver) {
            control.resizeObserver = new ResizeObserver(function () {
                $googlemap.resize(control.id)
            });
            control.resizeObserver.observe(control.element)
        }
        control.element.classList.remove('is-loading');
        control.status.textContent = '';
        emit(control, 'sdkLoaded', { google: window.google });
        emit(control, 'initialized', { map: control.map });
        control.pendingValue = null;
        return control.map
    }
    function targetOf(control, target) {
        if (!control) {
            return null
        }
        if (!target || target === 'map') {
            return control.map
        }
        if (target === 'data') {
            return control.map ? control.map.data : null
        }
        if (target === 'infoWindow') {
            return control.infoWindow
        }
        if (target === 'drawing') {
            return control.drawingManager
        }
        return control.overlays[target] || control.layers[target] || control.extensions[target] || null
    }
    function registryRemove(registry, id) {
        var value = registry[id];
        if (!value) {
            return null
        }
        if (value.setMap) {
            value.setMap(null)
        }
        else if (hasOwn(value, 'map') || value.map !== undefined) {
            value.map = null
        }
        if (value.setVisible && value.getVisible) {
            value.setVisible(false)
        }
        if (value.close) {
            value.close()
        }
        delete registry[id];
        return value
    }
    $googlemap.extend({
        name: 'syn.uicontrols.$googlemap',
        version: 'v2026.7.27',
        mapControls: [],
        sdkPromise: null,
        sdkSignature: null,
        sdkApiKey: null,
        authFailureInstalled: false,
        previousAuthFailure: null,
        syntheticEvents: ['sdkLoaded', 'initialized', 'dataBound', 'selectionChange', 'infoWindowOpen', 'infoWindowClose', 'authFailure', 'resized', 'disposed', 'error'],
        defaultSetting: {
            width: '100%',
            height: '400px',
            apiKey: '',
            mapId: '',
            apiUrl: 'https://maps.googleapis.com/maps/api/js',
            version: 'weekly',
            libraries: ['maps', 'marker', 'geocoding', 'geometry', 'streetView'],
            language: 'ko',
            region: 'KR',
            authReferrerPolicy: '',
            channel: '',
            solutionChannel: '',
            loadTimeout: 15000,
            mapOptions: {
                center: {
                    lat: 36.5,
                    lng: 127.8
                },
                zoom: 7,
                minZoom: 6,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true
            },
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
                id: el.id,
                formDataFieldID: form ? form.getAttribute('syn-datafield') : '',
                field: el.getAttribute('syn-datafield'),
                module: this.name,
                type: controlType
            })
        },
        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            if (!el) {
                return null
            }
            setting = merge({}, $googlemap.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = merge(setting, mod.hook.controlInit(elID, setting) || {})
            }
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;
            var display = el.style.display;
            el.id = elID + '_hidden';
            try {
                el.setAttribute('syn-options', JSON.stringify(setting))
            }
            catch (error) {
                log('$googlemap.controlLoad', 'syn-options contains a non-serializable value.', 'Warning')
            }
            el.style.display = 'none';
            var wrapper = document.createElement('div');
            wrapper.id = elID;
            wrapper.className = 'syn-googlemap is-loading';
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            var canvas = document.createElement('div');
            canvas.id = elID + '_canvas';
            canvas.className = 'syn-googlemap-canvas';
            var status = document.createElement('div');
            status.className = 'syn-googlemap-status';
            status.textContent = '지도를 불러오는 중입니다.';
            wrapper.appendChild(canvas);
            wrapper.appendChild(status);
            el.parentNode.insertBefore(wrapper, el.nextSibling);
            var control = {
                id: elID,
                originalElement: el,
                originalDisplay: display,
                element: wrapper,
                canvas: canvas,
                status: status,
                config: setting,
                map: null,
                rawValue: [],
                metaColumns: null,
                pois: [],
                selectionKeys: [],
                infoWindow: null,
                overlays: {},
                layers: {},
                extensions: {},
                drawingManager: null,
                eventNames: parseEvents(el),
                mapListeners: [],
                runtimeListeners: [],
                resizeObserver: null,
                pendingValue: null,
                setValueVersion: 0,
                disposed: false,
                readyPromise: null,
                mapOptions: null
            };
            $googlemap.mapControls.push(control);
            control.readyPromise = loadSDK(setting).then(function () {
                return createMap(control)
            }).catch(function (error) {
                return fail(control, '$googlemap.controlLoad', error)
            });
            return control.readyPromise
        },
        getControl: function (elID) {
            return $googlemap.mapControls.find(function (item) {
                return item.id === elID
            }) || null
        },
        getMap: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? control.map : null
        },
        getGoogle: function () {
            return window.google || null
        },
        importLibrary: function (name) {
            if (!window.google || !window.google.maps || typeof window.google.maps.importLibrary !== 'function') {
                return Promise.reject(errorOf('GOOGLE_MAP_SDK_INVALID', 'Google Maps importLibrary를 사용할 수 없습니다.'))
            }
            return window.google.maps.importLibrary(name)
        },
        ready: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? control.readyPromise : Promise.resolve(null)
        },
        setValue: function (elID, value, metaColumns) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return Promise.resolve(null)
            }
            var rows;
            try {
                rows = normalizeRows(value)
            }
            catch (error) {
                fail(control, '$googlemap.setValue', error);
                return Promise.resolve(null)
            }
            var token = ++control.setValueVersion;
            if (!control.map) {
                control.pendingValue = {
                    value: rows,
                    metaColumns: metaColumns
                }
            }
            var adapter = resolveFunction(control.config.dataAdapter);
            var operation;
            try {
                operation = adapter ? adapter(clone(rows), metaColumns, control) : rows
            }
            catch (error) {
                fail(control, '$googlemap.setValue', error);
                return Promise.resolve(null)
            }
            return control.readyPromise.then(function () {
                return Promise.resolve(operation)
            }).then(function (adapted) {
                if (token !== control.setValueVersion || !control.map || control.disposed) {
                    return control.map
                }
                var normalized = normalizeRows(adapted);
                normalizePois(normalized, control.config);
                return applyPois(control, normalized, metaColumns)
            }).catch(function (error) {
                return fail(control, '$googlemap.setValue', error)
            })
        },
        getValue: function (elID, requestType, metaColumns) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return requestType ? [] : null
            }
            var rows = selectedPois(control).map(function (poi) {
                return clone(poi.row)
            });
            if (!requestType) {
                return control.config.selectionMode === 'multiple' ? rows : (rows[0] || null)
            }
            if (requestType === 'Row') {
                rows = rows.length ? [
                    rows[rows.length - 1]
                ] : []
            }
            return serializeRows(rows, requestType, metaColumns || control.metaColumns)
        },
        getRawValue: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? clone(control.rawValue) : []
        },
        getSelection: function (elID) {
            return getSelection($googlemap.getControl(elID))
        },
        getSelectedRows: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? selectedPois(control).map(function (poi) {
                return clone(poi.row)
            }) : []
        },
        getMarkers: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? control.pois.map(function (poi) {
                return poi.marker
            }) : []
        },
        getSelectedMarkers: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? selectedPois(control).map(function (poi) {
                return poi.marker
            }) : []
        },
        getMarker: function (elID, indexOrId) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return null
            }
            for (var i = 0; i < control.pois.length; i++) {
                if (i === indexOrId || control.pois[i].id === String(indexOrId) || control.pois[i].key === indexOrId) {
                    return control.pois[i].marker
                }
            }
            return null
        },
        getInfoWindow: function (elID) {
            var control = $googlemap.getControl(elID);
            return control ? control.infoWindow : null
        },
        setSelection: function (elID, value, source) {
            var control = $googlemap.getControl(elID);
            if (!control || control.config.selectionMode === 'none') {
                return null
            }
            var requested = asArray(value);
            control.selectionKeys = [];
            for (var r = 0; r < requested.length; r++) {
                for (var i = 0; i < control.pois.length; i++) {
                    var poi = control.pois[i];
                    if (i === requested[r] || poi.id === String(requested[r]) || poi.key === requested[r]) {
                        control.selectionKeys.push(poi.key);
                        if (control.config.selectionMode !== 'multiple') {
                            r = requested.length
                        }
                        break
                    }
                }
            }
            var selected = selectedPois(control);
            if (selected.length) {
                openInfo(control, selected[selected.length - 1])
            }
            else {
                closeInfo(control)
            }
            emit(control, 'selectionChange', {
                source: source || 'api',
                selection: getSelection(control)
            });
            return getSelection(control)
        },
        clearSelection: function (elID, source) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return
            }
            var changed = control.selectionKeys.length > 0;
            control.selectionKeys = [];
            closeInfo(control);
            if (changed) {
                emit(control, 'selectionChange', {
                    source: source || 'api',
                    selection: getSelection(control)
                })
            }
        },
        setOptions: function (elID, options) {
            var control = $googlemap.getControl(elID);
            if (control && control.map) {
                control.mapOptions = merge({}, control.mapOptions || {}, options || {});
                control.map.setOptions(options || {})
            }
            return control ? control.map : null
        },
        getOptions: function (elID, key) {
            var control = $googlemap.getControl(elID);
            if (!control || !control.map) {
                return null
            }
            return key ? (control.map.get ? control.map.get(key) : control.mapOptions[key]) : clone(control.mapOptions || {})
        },
        setCenter: function (elID, value) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.setCenter(latLng(value))
            }
        },
        getCenter: function (elID) {
            var map = $googlemap.getMap(elID);
            return map ? map.getCenter() : null
        },
        setZoom: function (elID, value) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.setZoom(Number(value))
            }
        },
        getZoom: function (elID) {
            var map = $googlemap.getMap(elID);
            return map ? map.getZoom() : null
        },
        fitBounds: function (elID, value, margin) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.fitBounds(bounds(value), margin)
            }
        },
        panTo: function (elID, value, options) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.panTo(latLng(value), options)
            }
        },
        panToBounds: function (elID, value, options) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.panToBounds(bounds(value), options)
            }
        },
        panBy: function (elID, delta, y) {
            var map = $googlemap.getMap(elID);
            if (!map) {
                return
            }
            var xValue = Array.isArray(delta) ? delta[0] : (delta && delta.x !== undefined ? delta.x : delta);
            var yValue = Array.isArray(delta) ? delta[1] : (delta && delta.y !== undefined ? delta.y : y);
            map.panBy(Number(xValue) || 0, Number(yValue) || 0)
        },
        getBounds: function (elID) {
            var map = $googlemap.getMap(elID);
            return map ? map.getBounds() : null
        },
        setMapTypeId: function (elID, value) {
            var map = $googlemap.getMap(elID);
            if (map) {
                map.setMapTypeId(value)
            }
        },
        resize: function (elID) {
            var control = $googlemap.getControl(elID);
            if (!control || !control.map) {
                return
            }
            var Event = googleEvent();
            if (Event && Event.trigger) {
                Event.trigger(control.map, 'resize')
            }
            emit(control, 'resized', {
                width: control.element.clientWidth,
                height: control.element.clientHeight
            })
        },
        updateMarker: function (elID, indexOrId, options) {
            var marker = $googlemap.getMarker(elID, indexOrId);
            var control = $googlemap.getControl(elID);
            if (!marker || !options) {
                return marker
            }
            var config = merge({}, options);
            var visual;
            if (hasOwn(config, 'content')) {
                visual = config.content;
                delete config.content
            }
            else if (hasOwn(config, 'icon')) {
                visual = config.icon;
                delete config.icon
            }
            if (config.pinOptions && window.google.maps.marker.PinElement) {
                visual = new window.google.maps.marker.PinElement(clone(config.pinOptions));
                delete config.pinOptions
            }
            if (hasOwn(config, 'position')) {
                config.position = latLng(config.position)
            }
            if (hasOwn(config, 'draggable')) {
                config.gmpDraggable = !!config.draggable;
                delete config.draggable
            }
            if (hasOwn(config, 'visible')) {
                setMarkerMap(marker, config.visible ? control.map : null);
                delete config.visible
            }
            for (var key in config) {
                if (hasOwn(config, key) && key !== 'map') {
                    marker[key] = config[key]
                }
            }
            if (visual !== undefined) {
                applyMarkerContent(marker, visual)
            }
            return marker
        },
        setMarkerVisible: function (elID, indexOrId, visible) {
            var marker = $googlemap.getMarker(elID, indexOrId);
            var map = $googlemap.getMap(elID);
            if (marker) {
                setMarkerMap(marker, visible ? map : null)
            }
        },
        openInfoWindow: function (elID, indexOrId) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return null
            }
            for (var i = 0; i < control.pois.length; i++) {
                if (i === indexOrId || control.pois[i].id === String(indexOrId) || control.pois[i].key === indexOrId) {
                    return openInfo(control, control.pois[i])
                }
            }
            return null
        },
        closeInfoWindow: function (elID) {
            var control = $googlemap.getControl(elID);
            if (control) {
                closeInfo(control)
            }
        },
        invokeMarker: function (elID, indexOrId, method, args) {
            var marker = $googlemap.getMarker(elID, indexOrId);
            return marker && typeof marker[method] === 'function' ? marker[method].apply(marker, args || []) : null
        },
        addGeoJson: function (elID, geoJson, autoStyle) {
            var map = $googlemap.getMap(elID);
            return map && map.data ? map.data.addGeoJson(geoJson, autoStyle) : null
        },
        removeGeoJson: function (elID, feature) {
            var map = $googlemap.getMap(elID);
            return map && map.data ? map.data.remove(feature) : null
        },
        setDataStyle: function (elID, style) {
            var map = $googlemap.getMap(elID);
            if (map && map.data) {
                map.data.setStyle(style)
            }
        },
        overrideDataStyle: function (elID, feature, style) {
            var map = $googlemap.getMap(elID);
            if (map && map.data) {
                map.data.overrideStyle(feature, style)
            }
        },
        revertDataStyle: function (elID, feature) {
            var map = $googlemap.getMap(elID);
            if (map && map.data) {
                map.data.revertStyle(feature)
            }
        },
        addOverlay: function (elID, id, type, options) {
            var control = $googlemap.getControl(elID);
            var allowed = ['Marker', 'InfoWindow', 'Polyline', 'Polygon', 'Circle', 'Rectangle', 'GroundOverlay'];
            if (!control) {
                return null
            }
            if (allowed.indexOf(type) < 0) {
                throw errorOf('GOOGLE_MAP_UNSUPPORTED_API', 'Google Maps에서 지원하지 않는 오버레이 형식입니다: ' + type);
            }
            registryRemove(control.overlays, id);
            var config = merge({}, options || {});
            if (config.position) {
                config.position = latLng(config.position)
            }
            if (config.center) {
                config.center = latLng(config.center)
            }
            if (config.bounds) {
                config.bounds = bounds(config.bounds)
            }
            if (type === 'Marker') {
                var content = hasOwn(config, 'content') ? config.content : config.icon;
                delete config.content;
                delete config.icon;
                if (hasOwn(config, 'draggable')) {
                    config.gmpDraggable = !!config.draggable;
                    delete config.draggable
                }
                config.map = config.map === undefined ? control.map : config.map;
                control.overlays[id] = new window.google.maps.marker.AdvancedMarkerElement(config);
                if (content !== undefined) {
                    applyMarkerContent(control.overlays[id], content)
                }
            }
            else if (type === 'GroundOverlay') {
                if (!config.url || !config.bounds) {
                    throw errorOf('INVALID_OVERLAY_OPTIONS', 'GroundOverlay에는 url과 bounds가 필요합니다.');
                }
                control.overlays[id] = new window.google.maps.GroundOverlay(config.url, config.bounds, config.options || {});
                control.overlays[id].setMap(config.map === undefined ? control.map : config.map)
            }
            else {
                config.map = config.map === undefined ? control.map : config.map;
                control.overlays[id] = new window.google.maps[type](config)
            }
            return control.overlays[id]
        },
        getOverlay: function (elID, id) {
            var control = $googlemap.getControl(elID);
            return control ? control.overlays[id] || null : null
        },
        removeOverlay: function (elID, id) {
            var control = $googlemap.getControl(elID);
            return control ? registryRemove(control.overlays, id) : null
        },
        createLayer: function (elID, id, type, options) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return null
            }
            var aliases = { BicycleLayer: 'BicyclingLayer' };
            var nativeType = aliases[type] || type;
            var allowed = ['TrafficLayer', 'TransitLayer', 'BicyclingLayer', 'StreetViewCoverageLayer'];
            if (allowed.indexOf(nativeType) < 0 || !window.google.maps[nativeType]) {
                throw errorOf('GOOGLE_MAP_UNSUPPORTED_API', 'Google Maps에서 지원하지 않는 레이어 형식입니다: ' + type);
            }
            registryRemove(control.layers, id);
            control.layers[id] = new window.google.maps[nativeType](options || {});
            if (control.layers[id].setMap) {
                control.layers[id].setMap(control.map)
            }
            return control.layers[id]
        },
        getLayer: function (elID, id) {
            var control = $googlemap.getControl(elID);
            return control ? control.layers[id] || null : null
        },
        setLayerVisible: function (elID, id, visible) {
            var control = $googlemap.getControl(elID);
            var layer = control ? control.layers[id] : null;
            if (layer && layer.setMap) {
                layer.setMap(visible ? control.map : null)
            }
        },
        removeLayer: function (elID, id) {
            var control = $googlemap.getControl(elID);
            return control ? registryRemove(control.layers, id) : null
        },
        geocode: function (query) {
            var request = typeof query === 'string' ? { address: query } : merge({}, query || {});
            if (request.query !== undefined && request.address === undefined) {
                request.address = request.query;
                delete request.query
            }
            return $googlemap.service(request)
        },
        reverseGeocode: function (query) {
            var isCoordinate = query && ((query.lat !== undefined && query.lng !== undefined) || typeof query.lat === 'function');
            var request = isCoordinate ? { location: query } : merge({}, query || {});
            if (request.coords !== undefined && request.location === undefined) {
                request.location = request.coords;
                delete request.coords
            }
            if (request.location) {
                request.location = latLng(request.location)
            }
            return $googlemap.service(request)
        },
        transCoord: function () {
            return Promise.reject(errorOf('GOOGLE_MAP_UNSUPPORTED_API', 'Google Maps JavaScript API는 transCoord를 제공하지 않습니다.'))
        },
        service: function (request) {
            if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
                return Promise.reject(errorOf('GOOGLE_MAP_LIBRARY_REQUIRED', 'geocoding 라이브러리가 필요합니다.'))
            }
            try {
                return Promise.resolve((new window.google.maps.Geocoder).geocode(request || {}))
            }
            catch (error) {
                return Promise.reject(error)
            }
        },
        createDrawingManager: function () {
            throw errorOf('GOOGLE_MAP_UNSUPPORTED_API', 'Google Maps DrawingManager는 2026년 6월부터 제공되지 않습니다. addOverlay 또는 별도 drawing 라이브러리를 사용하세요.');
        },
        createPanorama: function (elID, id, container, options) {
            var control = $googlemap.getControl(elID);
            if (!control || !window.google.maps.StreetViewPanorama) {
                throw errorOf('GOOGLE_MAP_LIBRARY_REQUIRED', 'streetView 라이브러리가 필요합니다.');
            }
            var element = typeof container === 'string' ? document.getElementById(container) : container;
            registryRemove(control.extensions, id);
            control.extensions[id] = new window.google.maps.StreetViewPanorama(element, options || {});
            return control.extensions[id]
        },
        createVisualization: function () {
            throw errorOf('GOOGLE_MAP_UNSUPPORTED_API', 'Google Maps Heatmap Layer는 2026년 5월부터 제공되지 않습니다. 별도 visualization 라이브러리를 사용하세요.');
        },
        on: function (elID, target, eventName, handler) {
            var control = $googlemap.getControl(elID);
            if (arguments.length === 3) {
                handler = eventName;
                eventName = target;
                target = 'map'
            }
            var callback = resolveFunction(handler);
            var nativeTarget = targetOf(control, target);
            if (!control || !nativeTarget || !callback) {
                return null
            }
            var listener = function (event) {
                callback(control.id, event, getSelection(control))
            };
            var handle = addListener(nativeTarget, eventName, listener);
            control.runtimeListeners.push({
                target: target,
                eventName: eventName,
                handler: handler,
                handle: handle
            });
            return handle
        },
        off: function (elID, target, eventName, handler) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return
            }
            if (arguments.length === 3) {
                handler = eventName;
                eventName = target;
                target = 'map'
            }
            var Event = googleEvent();
            for (var i = control.runtimeListeners.length - 1; i >= 0; i--) {
                var item = control.runtimeListeners[i];
                if (item.target === target && item.eventName === eventName && (!handler || item.handler === handler || item.handle === handler)) {
                    if (Event) {
                        Event.removeListener(item.handle)
                    }
                    control.runtimeListeners.splice(i, 1)
                }
            }
        },
        invoke: function (elID, target, method, args) {
            var control = $googlemap.getControl(elID);
            if (arguments.length === 3) {
                args = method;
                method = target;
                target = 'map'
            }
            var nativeTarget = targetOf(control, target);
            return nativeTarget && typeof nativeTarget[method] === 'function' ? nativeTarget[method].apply(nativeTarget, args || []) : null
        },
        invokeGlobal: function (path, method, args) {
            var target = window.google;
            var names = String(path || '').split('.');
            for (var i = 0; i < names.length && target; i++) {
                if (names[i] && names[i] !== 'google') {
                    target = target[names[i]]
                }
            }
            return target && typeof target[method] === 'function' ? target[method].apply(target, args || []) : null
        },
        clear: function (elID) {
            return $googlemap.setValue(elID, [])
        },
        dispose: function (elID) {
            var control = $googlemap.getControl(elID);
            if (!control) {
                return
            }
            control.disposed = true;
            control.setValueVersion++;
            closeInfo(control);
            removeListeners(control.mapListeners);
            var Event = googleEvent();
            for (var i = 0; i < control.runtimeListeners.length; i++) {
                if (Event) {
                    Event.removeListener(control.runtimeListeners[i].handle)
                }
            }
            control.runtimeListeners.length = 0;
            for (var p = 0; p < control.pois.length; p++) {
                destroyPoi(control.pois[p])
            }
            for (var overlay in control.overlays) {
                if (hasOwn(control.overlays, overlay)) {
                    registryRemove(control.overlays, overlay)
                }
            }
            for (var layer in control.layers) {
                if (hasOwn(control.layers, layer)) {
                    registryRemove(control.layers, layer)
                }
            }
            for (var extension in control.extensions) {
                if (hasOwn(control.extensions, extension)) {
                    registryRemove(control.extensions, extension)
                }
            }
            if (control.drawingManager && control.drawingManager.setMap) {
                control.drawingManager.setMap(null)
            }
            if (control.resizeObserver) {
                control.resizeObserver.disconnect()
            }
            emit(control, 'disposed', {});
            if (control.element.parentNode) {
                control.element.parentNode.removeChild(control.element)
            }
            control.originalElement.id = elID;
            control.originalElement.style.display = control.originalDisplay;
            $googlemap.mapControls.splice($googlemap.mapControls.indexOf(control), 1)
        }
    });
    syn.uicontrols.$googlemap = $googlemap
})(window);
