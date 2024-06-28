/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $library = context.$library || new syn.module();
    var document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        document = context.document;

        (function () {
            if (typeof context.CustomEvent !== 'function') {
                var CustomEvent = function (event, params) {
                    params = params || { bubbles: false, cancelable: false, detail: undefined };
                    var evt = document.createEvent('CustomEvent');
                    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                    return evt;
                }

                CustomEvent.prototype = context.Event.prototype;
                context.CustomEvent = CustomEvent;
            }

            context['events'] = function () {
                var items = [];

                return {
                    items: items,
                    add(el, eventName, handler) {
                        items.push(arguments);
                    },
                    remove(el, eventName, handler) {
                        var index = items.findIndex((item) => { return item[0] == arguments[0] && item[1] == arguments[1] && item[2] == arguments[2] });
                        if (index > -1) {
                            items.splice(index, 1);
                        }
                    },
                    flush() {
                        var i, item;
                        for (i = items.length - 1; i >= 0; i = i - 1) {
                            item = items[i];
                            if (item[0].removeEventListener) {
                                item[0].removeEventListener(item[1], item[2], item[3]);
                            }
                            if (item[1].substring(0, 2) != 'on') {
                                item[1] = 'on' + item[1];
                            }
                            if (item[0].detachEvent) {
                                item[0].detachEvent(item[1], item[2]);
                            }
                            item[0][item[1]] = null;
                        }

                        syn.$w.purge(document.body);
                    }
                }
            }();
        })();
    }

    $library.extend({
        version: '1.0.0',
        prefixs: ['webkit', 'moz', 'ms', 'o', ''],

        eventMap: {
            'mousedown': 'touchstart',
            'mouseup': 'touchend',
            'mousemove': 'touchmove'
        },

        guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        stringToArrayBuffer(value, isTwoByte) {
            var bufferCount = 1;
            if ($string.toBoolean(isTwoByte) == true) {
                bufferCount = 2;
            }

            var result = new ArrayBuffer(value.length * bufferCount);
            var bufView = new Uint8Array(result);
            for (var i = 0, strLen = value.length; i < strLen; i++) {
                bufView[i] = value.charCodeAt(i);
            }
            return result;
        },

        arrayBufferToString(buffer) {
            var arrayBuffer = new Uint8Array(buffer);
            var s = String.fromCharCode.apply(null, arrayBuffer);
            return decodeURIComponent(s);
        },

        random(len, toLower) {
            var result = '';
            var len = len || 8;
            var val = '';

            while (val.length < len) {
                val += Math.random().toString(36).substring(2);
            }

            if ($string.toBoolean(toLower) == true) {
                result = val.substring(0, len);
            }
            else {
                result = val.substring(0, len).toUpperCase();
            }

            return result;
        },

        execPrefixFunc(el, func) {
            var prefixs = syn.$l.prefixs;
            var i = 0, m, t;
            while (i < prefixs.length && !el[m]) {
                m = func;
                if (prefixs[i] == '') {
                    m = m.substring(0, 1).toLowerCase() + m.substring(1);
                }
                m = prefixs[i] + m;
                t = typeof el[m];
                if (t != 'undefined') {
                    prefixs = [prefixs[i]];
                    return (t == 'function' ? el[m]() : el[m]);
                }
                i++;
            }
        },

        dispatchClick(el, options) {
            try {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                options = syn.$w.argumentsExtend({
                    canBubble: true,
                    cancelable: true,
                    view: context,
                    detail: 0,
                    screenX: 0,
                    screenY: 0,
                    clientX: 80,
                    clientY: 20,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: null
                }, options);

                var evt = document.createEvent('MouseEvents');

                // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/initMouseEvent
                evt.initMouseEvent('click', options.canBubble, options.cancelable, options.view, options.detail, options.screenX, options.screenY, options.clientX, options.clientY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget);
                el.dispatchEvent(evt);
            } catch (error) {
                syn.$l.eventLog('$l.dispatchClick', error, 'Warning');
            }
        },

        // http://www.w3schools.com/html5/html5_ref_eventattributes.asp
        addEvent(el, type, func) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (el && func && $object.isFunction(func) == true) {
                if (el.addEventListener) {
                    el.addEventListener(type, func, false);
                }
                else if (el.attachEvent) {
                    el.attachEvent('on' + type, func);
                }
                else {
                    el['on' + type] = el['e' + type + func];
                }

                events.add(el, type, func);

                if ($object.isString(type) == true && type.toLowerCase() === 'resize') {
                    func();
                }
            }

            return $library;
        },

        addEvents(query, type, func) {
            if (func && $object.isFunction(func) == true) {
                var items = [];
                if ($object.isString(query) == true && $string.isNullOrEmpty(query) == false) {
                    items = syn.$l.querySelectorAll(query);
                }
                else if ($object.isArray(query) == true && query.length > 0) {
                    var item = query[0];
                    if ($object.isString(item) == true) {
                        for (var i = 0, length = query.length; i < length; i++) {
                            items = $array.merge(items, syn.$l.querySelectorAll(query[i]));
                        }
                    }
                    else if ($object.isObject(item) == true) {
                        items = query;
                    }
                }
                else if ($object.isObject(query) == true) {
                    items = [query];
                }

                for (var i = 0, length = items.length; i < length; i++) {
                    var el = items[i];
                    syn.$l.addEvent(el, type, func);
                }
            }

            return $library;
        },

        addLive(elID, type, fn) {
            $library.addEvent(context || document, type, function (evt) {
                var found;
                var targetEL = syn.$w.activeControl(evt);
                while (targetEL && !(found = targetEL.id == elID)) {
                    targetEL = targetEL.parentElement;
                }

                if (found) {
                    fn.call(targetEL, evt);
                }
            });

            return $library;
        },

        removeEvent(el, type, func) {
            if (func && $object.isFunction(func) == true) {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                if (el.removeEventListener) {
                    el.removeEventListener(type, func, false);
                }
                else if (el.detachEvent) {
                    el.detachEvent('on' + type, func);
                }
                else {
                    el['on' + type] = null;
                }

                events.remove(el, type, func);
            }

            return $library;
        },

        hasEvent(el, type) {
            var item = null;
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            for (var i = 0, len = events.items.length; i < len; i++) {
                item = events.items[i];

                if (item && item[0] instanceof context.constructor || item[0] instanceof document.constructor) {
                    if (item[1] == type) {
                        result = true;
                        break;
                    }
                }
                else {
                    if (item && item[0].id) {
                        if (item[0].id == el.id && item[1] == type) {
                            result = true;
                            break;
                        }
                    }
                }
            }

            return result;
        },

        trigger(el, type, value) {
            var result = false;
            var item = null;
            var action = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            for (var i = 0, len = events.items.length; i < len; i++) {
                item = events.items[i];

                if (el instanceof HTMLElement) {
                    if (item[0].id == el.id && item[1] == type) {
                        action = item[2];
                        break;
                    }
                }
                else if (item[0] instanceof context.constructor || item[0] instanceof document.constructor) {
                    if (item[1] == type) {
                        action = item[2];
                        break;
                    }
                }
            }

            if (action) {
                if (value) {
                    action.call(el, value);
                }
                else {
                    action.call(el);
                }
                result = true;
            }

            return result;
        },

        triggerEvent(el, type, customData) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (context.CustomEvent) {
                if (customData) {
                    el.dispatchEvent(new CustomEvent(type, { detail: customData }));
                }
                else {
                    el.dispatchEvent(new CustomEvent(type));
                }
            }
            else if (document.createEvent) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent(type, false, true);

                if (customData) {
                    el.dispatchEvent(evt, customData);
                }
                else {
                    el.dispatchEvent(evt);
                }
            }
            else if (el.fireEvent) {
                var evt = document.createEventObject();
                evt.eventType = type;
                if (customData) {
                    el.fireEvent('on' + evt.eventType, customData);
                }
                else {
                    el.fireEvent('on' + evt.eventType);
                }
            }

            return $library;
        },

        get() {
            var result = [];
            var find = null;
            var elID = '';

            for (var i = 0, len = arguments.length; i < len; i++) {
                elID = arguments[i];

                if ($object.isString(elID) == true) {
                    find = document.getElementById(elID);
                }

                result.push(find);
            }

            if (result.length == 1) {
                return find;
            }
            else {
                return result;
            }
        },

        querySelector() {
            var result = [];
            var find = null;
            var query = '';

            for (var i = 0, len = arguments.length; i < len; i++) {
                query = arguments[i];

                if ($object.isString(query) == true) {
                    find = document.querySelector(query);
                }

                result.push(find);
            }

            if (result.length == 1) {
                return find;
            }
            else {
                return result;
            }
        },

        getTagName() {
            var result = [];
            for (var i = 0, len = arguments.length; i < len; i++) {
                var tagName = arguments[i];
                if ($object.isString(tagName) == true) {
                    var els = document.getElementsByTagName(tagName);
                    for (var j = 0, length = els.length; j < length; j++) {
                        result.push(els[j]);
                    }
                }
            }
            return result;
        },

        querySelectorAll() {
            var result = [];
            for (var i = 0, len = arguments.length; i < len; i++) {
                var query = arguments[i];
                if ($object.isString(query) == true) {
                    var els = document.querySelectorAll(query);
                    for (var j = 0, length = els.length; j < length; j++) {
                        result.push(els[j]);
                    }
                }
            }
            return result;
        },

        toEnumText(enumObject, value) {
            var text = null;
            for (var k in enumObject) {
                if (enumObject[k] == value) {
                    text = k;
                    break;
                }
            }
            return text;
        },

        prettyTSD(tsd, isFormat) {
            var result = null;
            try {
                var Value = tsd.split('＾');
                if (Value.length > 1) {
                    var meta = $string.toParameterObject(Value[0]);
                    result = $string.toJson(Value[1], { delimeter: '｜', newline: '↵', meta: meta });
                }
                else {
                    result = $string.toJson(Value[0], { delimeter: '｜', newline: '↵' });
                }

                return $string.toBoolean(isFormat) == true ? JSON.stringify(result, null, 2) : result;
            } catch (error) {
                result = error.message;
            }

            return result;
        },

        text2Json(data, delimiter, newLine) {
            if (delimiter == undefined) {
                delimiter = ',';
            }

            if (newLine == undefined) {
                newLine = '\n';
            }

            var titles = data.slice(0, data.indexOf(newLine)).split(delimiter);
            return data
                .slice(data.indexOf(newLine) + 1)
                .split(newLine)
                .map(function (v) {
                    var values = v.split(delimiter);
                    return titles.reduce(function (obj, title, index) {
                        return (obj[title] = values[index]), obj;
                    }, {});
                });
        },

        json2Text(arr, columns, delimiter, newLine) {
            function _toConsumableArray(arr) {
                return (
                    _arrayWithoutHoles(arr) ||
                    _iterableToArray(arr) ||
                    _unsupportedIterableToArray(arr) ||
                    _nonIterableSpread()
                );
            }

            function _nonIterableSpread() {
                throw new TypeError('유효하지 않은 데이터 타입');
            }

            function _unsupportedIterableToArray(o, minLen) {
                if (!o) return;
                if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
                var n = Object.prototype.toString.call(o).slice(8, -1);
                if (n === 'Object' && o.constructor) n = o.constructor.name;
                if (n === 'Map' || n === 'Set') return Array.from(o);
                if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
                    return _arrayLikeToArray(o, minLen);
            }

            function _iterableToArray(iter) {
                if (typeof Symbol !== 'undefined' && Symbol.iterator in Object(iter))
                    return Array.from(iter);
            }

            function _arrayWithoutHoles(arr) {
                if (Array.isArray(arr)) return _arrayLikeToArray(arr);
            }

            function _arrayLikeToArray(arr, len) {
                if (len == null || len > arr.length) len = arr.length;
                for (var i = 0, arr2 = new Array(len); i < len; i++) {
                    arr2[i] = arr[i];
                }
                return arr2;
            }

            if (delimiter == delimiter) {
                delimiter = ',';
            }

            if (newLine == undefined) {
                newLine = '\n';
            }

            return [columns.join(delimiter)]
                .concat(
                    _toConsumableArray(
                        arr.map(function (obj) {
                            return columns.reduce(function (acc, key) {
                                return ''
                                    .concat(acc)
                                    .concat(!acc.length ? '' : delimiter)
                                    .concat(!obj[key] ? '' : obj[key]);
                            }, '');
                        })
                    )
                )
                .join(newLine);
        },

        nested2Flat(data, itemID, parentItemID, childrenID) {
            var result = [];

            if (data) {
                if ($object.isNullOrUndefined(childrenID) == true) {
                    childrenID = 'items';
                }

                var root = $object.clone(data, false);
                delete root[childrenID];
                root[parentItemID] = null;
                result.push(root);

                syn.$l.parseNested2Flat(data, result, itemID, parentItemID, childrenID);
            }
            else {
                syn.$l.eventLog('$l.nested2Flat', '필수 데이터 확인 필요', 'Warning');
            }

            return result;
        },

        parseNested2Flat(data, newData, itemID, parentItemID, childrenID) {
            var result = null;

            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var items = data[childrenID];
            if (data && items) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];

                    var cloneItem = $object.clone(item, false);
                    delete cloneItem[childrenID];
                    cloneItem[parentItemID] = data[itemID];

                    newData.push(cloneItem);

                    if (item[childrenID] && item[childrenID].length > 0) {
                        syn.$l.parseNested2Flat(item, newData, itemID, parentItemID, childrenID);
                    }
                }
            }

            return result;
        },

        flat2Nested(data, itemID, parentItemID, childrenID) {
            var result = null;

            if (data && itemID && parentItemID) {
                if ($object.isNullOrUndefined(childrenID) == true) {
                    childrenID = 'items';
                }

                var root = data.find(function (item) { return item[parentItemID] == null });
                var json = syn.$l.parseFlat2Nested(data, root, [], itemID, parentItemID, childrenID);
                root[childrenID] = json[childrenID];
                result = root;
            }
            else {
                syn.$l.eventLog('$l.flat2Nested', '필수 데이터 확인 필요', 'Warning');
            }

            return result;
        },

        parseFlat2Nested(data, root, newData, itemID, parentItemID, childrenID) {
            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var child = data.filter(function (item) { return item[parentItemID] == root[itemID] });
            if (child.length > 0) {
                if (!newData[childrenID]) {
                    newData[childrenID] = [];
                }
                for (var i = 0; i < child.length; i++) {
                    newData[childrenID].push($object.clone(child[i]));
                    syn.$l.parseFlat2Nested(data, child[i], newData[childrenID][i], itemID, parentItemID, childrenID);
                }
            }
            return newData;
        },

        findNestedByID(data, findID, itemID, childrenID) {
            var result = null;

            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var items = data[childrenID];
            if (data && items) {
                if (data[itemID] == findID) {
                    result = data;

                    return result;
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];

                    if (item[itemID] == findID) {
                        result = item;

                        return result;
                    }
                    else if (item[childrenID] && item[childrenID].length > 0) {
                        result = syn.$l.findNestedByID(item, findID, itemID, childrenID);

                        if (result) {
                            return result;
                        }
                    }
                }
            }

            return result;
        },

        deepFreeze(object) {
            var propNames = Object.getOwnPropertyNames(object);
            for (let name of propNames) {
                let value = object[name];

                object[name] = value && typeof value === 'object' ? syn.$l.deepFreeze(value) : value;
            }

            return Object.freeze(object);
        },

        createBlob(data, type) {
            try {
                return new Blob([data], { type: type });
            } catch (e) {
                var BlobBuilder = globalRoot.BlobBuilder || globalRoot.WebKitBlobBuilder || globalRoot.MozBlobBuilder || globalRoot.MSBlobBuilder;
                var builder = new BlobBuilder();
                builder.append(data.buffer || data);
                return builder.getBlob(type);
            }
        },

        dataUriToBlob(dataUri) {
            var result = null;

            try {
                var byteString = syn.$c.base64Decode(dataUri.split(',')[1]);
                var mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                result = new Blob([ab], { type: mimeString });
            } catch (error) {
                syn.$l.eventLog('$w.dataUriToBlob', error, 'Warning');
            }
            return result;
        },

        dataUriToText(dataUri) {
            var result = null;

            try {
                result = {
                    value: syn.$c.base64Decode(dataUri.split(',')[1]),
                    mime: dataUri.split(',')[0].split(':')[1].split(';')[0]
                };
            } catch (error) {
                syn.$l.eventLog('$w.dataUriToText', error, 'Warning');
            }
            return result;
        },

        blobToDataUri(blob, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobToDataUri', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var reader = new FileReader();
            reader.onloadend = function () {
                var base64data = reader.result;
                callback(base64data);
            }
            reader.onerror = function () {
                syn.$l.eventLog('$l.blobToDataUri', reader.error, 'Error');
                reader.abort();
            }
            reader.readAsDataURL(blob);
        },

        blobToDownload(blob, fileName) {
            if (context.navigator && context.navigator.msSaveOrOpenBlob) {
                context.navigator.msSaveOrOpenBlob(blob, fileName);
            } else {
                var blobUrl = syn.$r.createBlobUrl(blob);
                var link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;

                syn.$l.dispatchClick(link);

                setTimeout(function () {
                    syn.$r.revokeBlobUrl(blobUrl);
                    if (link.remove) {
                        link.remove();
                    }
                }, 100);
            }
        },

        blobUrlToBlob(url, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobUrlToBlob', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open('GET', url);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            xhr.responseType = 'blob';
            xhr.onload = function () {
                callback(xhr.response);
            }
            xhr.onerror = function () {
                syn.$l.eventLog('$l.blobUrlToBlob', 'url: {0}, status: {1}'.format(url, xhr.statusText), 'Warning');
            }
            xhr.send();
        },

        blobUrlToDataUri(url, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobUrlToDataUri', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open('GET', url);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            xhr.responseType = 'blob';
            xhr.onload = function () {
                var reader = new FileReader();
                reader.onloadend = function () {
                    var base64data = reader.result;
                    setTimeout(function () {
                        syn.$r.revokeBlobUrl(url);
                    }, 25);
                    callback(null, base64data);
                }
                reader.onerror = function () {
                    syn.$l.eventLog('$l.blobUrlToDataUri', reader.error, 'Error');
                    reader.abort();
                    callback(reader.error.message, null);
                }
                reader.readAsDataURL(xhr.response);
            }
            xhr.onerror = function () {
                syn.$l.eventLog('$l.blobUrlToDataUri', 'url: {0}, status: {1}'.format(url, xhr.statusText), 'Warning');
                callback('url: {0}, status: {1}'.format(url, xhr.statusText), null);
            }
            xhr.send();
        },

        async blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(blob);
            });
        },

        base64ToBlob(b64Data, contentType, sliceSize) {
            if (b64Data === '' || b64Data === undefined) {
                return;
            }

            if ($string.isNullOrEmpty(contentType) == true) {
                contentType = '';
            }

            if ($string.isNullOrEmpty(sliceSize) == true) {
                sliceSize = 512;
            }

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);
                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        },

        async blobToFile(blob, fileName, mimeType = 'text/plain') {
            var result = null;
            if (blob && blob.type && blob.size) {
                result = new File([blob], fileName, { type: mimeType });
            }

            return result;
        },

        async fileToBase64(file) {
            return new Promise((resolve, reject) => {
                var reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        },

        async fileToBlob(file) {
            var base64 = await syn.$l.fileToBase64(file);

            var mimeType = base64?.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            var realData = base64.split(',')[1];

            return syn.$l.base64ToBlob(realData, mimeType);
        },

        async resizeImage(blob, maxSize) {
            var reader = new FileReader();
            var image = new Image();
            var canvas = document.createElement('canvas');
            var dataURItoBlob = function (dataURI) {
                var bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
                    atob(dataURI.split(',')[1]) :
                    decodeURIComponent(dataURI.split(',')[1]);
                var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var max = bytes.length;
                var ia = new Uint8Array(max);
                for (var i = 0; i < max; i++)
                    ia[i] = bytes.charCodeAt(i);
                return new Blob([ia], { type: mime || 'image/jpeg' });
            };
            var resize = function () {
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (maxSize <= 0) {
                        maxSize = 80;
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                } else {
                    if (maxSize <= 0) {
                        maxSize = 80;
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg');
                return {
                    blob: dataURItoBlob(dataUrl),
                    width: width,
                    height: height,
                };
            };
            return new Promise(function (success, failure) {
                if (!blob.type.match(/image.*/)) {
                    failure(new Error("이미지 파일 확인 필요"));
                    return;
                }
                reader.onload = function (readerEvent) {
                    image.onload = function () { return success(resize()); };
                    image.src = readerEvent.target.result;
                };
                reader.readAsDataURL(blob);
            });
        },

        logLevel: new function () {
            this.Verbose = 0;
            this.Debug = 1;
            this.Information = 2;
            this.Warning = 3;
            this.Error = 4;
            this.Fatal = 5;
        },

        start: (new Date()).getTime(),
        eventLogTimer: null,
        eventLogCount: 0,
        eventLog(event, data, logLevel) {
            var message = typeof data == 'object' ? data.message : data;
            var stack = typeof data == 'object' ? data.stack : data;
            if (logLevel) {
                if ($object.isString(logLevel) == true) {
                    logLevel = syn.$l.logLevel[logLevel];
                }
            }
            else {
                logLevel = 0;
            }

            if (syn.Config && syn.Config.UIEventLogLevel) {
                if (syn.$l.logLevel[syn.Config.UIEventLogLevel] > logLevel) {
                    return;
                }
            }

            var logLevelText = syn.$l.toEnumText(syn.$l.logLevel, logLevel);
            var now = (new Date()).getTime(),
                diff = now - syn.$l.start,
                value, div, text;

            if (globalRoot.devicePlatform === 'node') {
                value = syn.$l.eventLogCount.toString() +
                    '@' + (diff / 1000).toString().format('0.000') +
                    ' [' + event + '] ' + (message === stack ? message : stack);

                switch (logLevelText) {
                    case 'Debug':
                        globalRoot.$logger.debug(value);
                        break;
                    case 'Information':
                        globalRoot.$logger.info(value);
                        break;
                    case 'Warning':
                        globalRoot.$logger.warn(value);
                        break;
                    case 'Error':
                        globalRoot.$logger.error(value);
                        break;
                    case 'Fatal':
                        globalRoot.$logger.fatal(value);
                        break;
                    default:
                        globalRoot.$logger.trace(value);
                        break;
                }

                if (globalRoot.console) {
                    console.log(`${logLevelText}: ${value}`);
                }
            }
            else {
                value = syn.$l.eventLogCount.toString() +
                    '@' + (diff / 1000).toString().format('0.000') +
                    ' [' + logLevelText + '] ' +
                    '[' + event + '] ' + (message === stack ? message : stack);

                if (syn.Config.IsDebugMode == true && syn.Config.Environment == 'Development' && ['Warning', 'Error', 'Fatal'].indexOf(logLevelText) > -1) {
                    debugger;
                }

                if (context.console) {
                    console.log(value);
                }
                else {
                    div = document.createElement('DIV');
                    text = document.createTextNode(value);

                    div.appendChild(text);

                    var eventlogs = document.getElementById('eventlogs');
                    if (eventlogs) {
                        eventlogs.appendChild(div);

                        clearTimeout(syn.$l.eventLogTimer);
                        syn.$l.eventLogTimer = setTimeout(function () {
                            eventlogs.scrollTop = eventlogs.scrollHeight;
                        }, 10);
                    }
                    else {
                        document.body.appendChild(div);
                    }
                }

                if (context.bound) {
                    bound.browserEvent('browser', {
                        ID: 'EventLog',
                        Data: value
                    }, function (error, json) {
                        if (error) {
                            console.log('browser EventLog - {0}'.format(error));
                        }
                    });
                }
            }

            syn.$l.eventLogCount++;
        },

        getBasePath(basePath, defaultPath) {
            const path = require('path');
            let entryBasePath = process.cwd();

            if (!basePath) {
                basePath = '';
            } else if (basePath.startsWith('.')) {
                basePath = path.resolve(entryBasePath, basePath);
            } else {
                basePath = path.resolve(basePath);
            }

            if (!basePath && defaultPath) {
                basePath = defaultPath;
            }

            return basePath;
        },

        moduleEventLog(moduleID, event, data, logLevel) {
            var message = typeof data == 'object' ? data.message : data;
            var stack = typeof data == 'object' ? data.stack : data;
            if (logLevel) {
                if ($object.isString(logLevel) == true) {
                    logLevel = syn.$l.logLevel[logLevel];
                }
            }
            else {
                logLevel = 0;
            }

            if (syn.Config && syn.Config.UIEventLogLevel) {
                if (syn.$l.logLevel[syn.Config.UIEventLogLevel] > logLevel) {
                    return;
                }
            }

            var logLevelText = syn.$l.toEnumText(syn.$l.logLevel, logLevel);
            var now = (new Date()).getTime(),
                diff = now - syn.$l.start,
                value;

            value = syn.$l.eventLogCount.toString() +
                '@' + (diff / 1000).toString().format('0.000') +
                ' [' + event + '] ' + (message === stack ? message : stack);

            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                var logger = moduleLibrary.logger;
                switch (logLevelText) {
                    case 'Debug':
                        logger.debug(value);
                        break;
                    case 'Information':
                        logger.info(value);
                        break;
                    case 'Warning':
                        logger.warn(value);
                        break;
                    case 'Error':
                        logger.error(value);
                        break;
                    case 'Fatal':
                        logger.fatal(value);
                        break;
                    default:
                        logger.trace(value);
                        break;
                }

                if (globalRoot.console) {
                    console.log(`${logLevelText}: ${value}`);
                }
            }
            else {
                console.log('ModuleID 확인 필요 - {0}'.format(moduleID));
            }

            syn.$l.eventLogCount++;
        }
    });

    syn.$l = $library;
    if (globalRoot.devicePlatform === 'node') {
        delete syn.$l.addEvent;
        delete syn.$l.addLive;
        delete syn.$l.removeEvent;
        delete syn.$l.hasEvent;
        delete syn.$l.trigger;
        delete syn.$l.triggerEvent;
        delete syn.$l.addBind;
        delete syn.$l.get;
        delete syn.$l.querySelector;
        delete syn.$l.getName;
        delete syn.$l.querySelectorAll;
        delete syn.$l.getElementsById;
        delete syn.$l.getElementsByClassName;
        delete syn.$l.getElementsByTagName;
    }
    else {
        delete syn.$l.getBasePath;
        delete syn.$l.moduleEventLog;

        context.onevent = syn.$l.addEvent;
        context.bind = syn.$l.addBind;
        context.trigger = syn.$l.trigger;

        syn.$l.addEvent(context, 'unload', events.flush);
    }
})(globalRoot);
