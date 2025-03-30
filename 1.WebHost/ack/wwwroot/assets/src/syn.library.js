(function (context) {
    'use strict';
    const $library = context.$library || new syn.module();
    let doc = null;

    if (globalRoot.devicePlatform !== 'node') {
        doc = context.document;

        if (typeof context.CustomEvent !== 'function') {
            let customEventPolyfill = function (event, params = {}) {
                const evt = doc.createEvent('CustomEvent');
                const { bubbles = false, cancelable = false, detail = undefined } = params;
                evt.initCustomEvent(event, bubbles, cancelable, detail);
                return evt;
            };
            customEventPolyfill.prototype = context.Event.prototype;
            context.CustomEvent = customEventPolyfill;
        }
    }

    const eventRegistry = (() => {
        const items = [];
        return Object.freeze({
            add(el, type, handler, capture = false) {
                if (!el || !type || typeof handler !== 'function') return false;
                if (!items.some(item => item.el === el && item.type === type && item.handler === handler && item.capture === capture)) {
                    items.push({ el, type, handler, capture });
                    return true;
                }
                return false;
            },
            remove(el, type, handler, capture = false) {
                const initialLength = items.length;
                for (let i = items.length - 1; i >= 0; i--) {
                    const item = items[i];
                    if (item.el === el && item.type === type && item.handler === handler && item.capture === capture) {
                        items.splice(i, 1);
                    }
                }
                return items.length < initialLength;
            },
            removeAllForElement(el) {
                for (let i = items.length - 1; i >= 0; i--) {
                    if (items[i].el === el) {
                        items.splice(i, 1);
                    }
                }
            },
            findByArgs(el, type, handler, capture = false) {
                return items.filter(item =>
                    item.el === el &&
                    item.type === type &&
                    item.handler === handler &&
                    item.capture === capture
                );
            },
            findAllByArgs(el, type) {
                return items.filter(item => item.el === el && item.type === type);
            },
            getAll() {
                return [...items];
            },
            flush() {
                this.getAll().forEach(({ el, type, handler, capture }) => {
                    if (el.removeEventListener) {
                        el.removeEventListener(type, handler, capture);
                    }
                });
                items.length = 0;
            }
        });
    })();

    $library.extend({
        prefixs: Object.freeze(['webkit', 'moz', 'ms', 'o', '']),
        eventMap: Object.freeze({
            'mousedown': 'touchstart',
            'mouseup': 'touchend',
            'mousemove': 'touchmove'
        }),

        events: eventRegistry,

        concreate() {
            if (globalRoot.devicePlatform !== 'node') {
                doc.addEventListener('DOMContentLoaded', () => {
                    this.addEvent(context, 'unload', () => this.events.flush());
                }, { once: true });
            }
        },

        guid() {
            if (context.crypto?.randomUUID) {
                return context.crypto.randomUUID();
            }

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        getElement(el) {
            return $object.isString(el) ? this.get(el) : el;
        },

        stringToArrayBuffer(value, isTwoByte = false) {
            const str = String(value);
            const bufferLength = str.length * (isTwoByte ? 2 : 1);
            const buffer = new ArrayBuffer(bufferLength);
            const bufView = isTwoByte ? new Uint16Array(buffer) : new Uint8Array(buffer);
            for (let i = 0; i < str.length; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buffer;
        },

        arrayBufferToString(buffer) {
            if (!(buffer instanceof ArrayBuffer)) return '';

            try {
                if (typeof TextDecoder !== 'undefined') {
                    return new TextDecoder().decode(buffer);
                }

                const uint8Array = new Uint8Array(buffer);
                let binaryString = '';
                for (const byte of uint8Array) {
                    binaryString += String.fromCharCode(byte);
                }

                return binaryString;
            } catch (e) {
                console.error("ArrayBuffer 문자열 변환 실패:", e);
                return '';
            }
        },

        random(len = 8, toLower = false) {
            let result = '';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            if (context.crypto?.getRandomValues) {
                const randomValues = new Uint32Array(len);
                context.crypto.getRandomValues(randomValues);
                for (let i = 0; i < len; i++) {
                    result += chars[randomValues[i] % chars.length];
                }
            } else {
                for (let i = 0; i < len; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            }
            return toLower ? result.toLowerCase() : result.toUpperCase();
        },

        execPrefixFunc(el, funcName) {
            if (!el || !funcName) return undefined;

            for (const prefix of this.prefixs) {
                let methodName = funcName;
                if (prefix) {
                    methodName = prefix + funcName.charAt(0).toUpperCase() + funcName.slice(1);
                } else {
                    methodName = funcName.charAt(0).toLowerCase() + funcName.slice(1);
                }

                if (typeof el[methodName] !== 'undefined') {
                    return typeof el[methodName] === 'function' ? el[methodName]() : el[methodName];
                }
            }
            return undefined;
        },

        dispatchClick(el, options = {}) {
            el = this.getElement(el);
            if (!el || globalRoot.devicePlatform === 'node' || !doc?.createEvent) return;

            try {
                const defaultOptions = {
                    bubbles: true,
                    cancelable: true,
                    view: context,
                    detail: 1,
                    screenX: 0, screenY: 0, clientX: 0, clientY: 0,
                    ctrlKey: false, altKey: false, shiftKey: false, metaKey: false,
                    button: 0,
                    relatedTarget: null,
                    ...options
                };

                const evt = new MouseEvent('click', defaultOptions);
                el.dispatchEvent(evt);

            } catch (error) {
                $l.eventLog('$l.dispatchClick', `클릭 디스패치 오류: ${error}`, 'Warning');
            }
        },

        addEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el || typeof handler !== 'function') return this;

            if (this.events.add(el, type, handler, false)) {
                if (el.addEventListener) {
                    el.addEventListener(type, handler, false);
                }
            }

            if ($object.isString(type) && type.toLowerCase() === 'resize') {
                handler();
            }

            return this;
        },

        addEvents(query, type, handler) {
            if (typeof handler !== 'function') return this;

            let elements = [];
            if ($object.isString(query)) {
                elements = this.querySelectorAll(query);
            } else if (Array.isArray(query)) {
                query.forEach(item => {
                    if ($object.isString(item)) {
                        elements = elements.concat(this.querySelectorAll(item));
                    } else if ($object.isObject(item)) {
                        elements.push(item);
                    }
                });
                elements = [...new Set(elements)];
            } else if ($object.isObject(query)) {
                elements = [query];
            }


            elements.forEach(el => this.addEvent(el, type, handler));

            return this;
        },

        addLive(query, type, handler) {
            if (globalRoot.devicePlatform === 'node') return this;

            this.addEvent(doc, type, (evt) => {
                const targetElement = evt.target.closest(query);
                if (targetElement) {
                    handler.call(targetElement, evt);
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            });
            return this;
        },

        removeEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el || typeof handler !== 'function') return this;

            if (this.events.remove(el, type, handler, false)) {
                if (el.removeEventListener) {
                    el.removeEventListener(type, handler, false);
                }
            }
            return this;
        },

        hasEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el) return false;

            if (typeof handler === 'function') {
                return this.events.findByArgs(el, type, handler, false).length > 0;
            } else {
                return this.events.findAllByArgs(el, type).length > 0;
            }
        },

        trigger(el, type, value) {
            el = this.getElement(el);
            if (!el) return false;

            let triggered = false;
            const handlers = this.events.findAllByArgs(el, type);

            handlers.forEach(({ handler }) => {
                try {
                    handler.call(el, value);
                    triggered = true;
                } catch (e) {
                    $l.eventLog('$l.trigger', `"${type}" 이벤트 핸들러 실행 오류: ${e}`, 'Warning');
                }
            });

            return triggered;
        },

        triggerEvent(el, type, customData) {
            el = this.getElement(el);
            if (!el || globalRoot.devicePlatform === 'node') return this;

            try {
                let event;
                if (typeof context.CustomEvent === 'function') {
                    event = new CustomEvent(type, { detail: customData, bubbles: true, cancelable: true });
                }
                else if (doc.createEvent) {
                    event = doc.createEvent('HTMLEvents');
                    event.initEvent(type, true, true);
                }

                if (event) {
                    el.dispatchEvent(event);
                }
            } catch (error) {
                $l.eventLog('$l.triggerEvent', `"${type}" 이벤트 디스패치 오류: ${error}`, 'Warning');
            }

            return this;
        },

        getValue(elID, defaultValue = '') {
            if (!$this?.context?.synControls) return defaultValue;

            const synControls = $this.context.synControls;
            const controlInfo = synControls.find(item => item.id === elID || item.id === `${elID}_hidden`);

            if (controlInfo?.module) {
                const controlModule = $webform.getControlModule(controlInfo.module);
                if (controlModule?.getValue) {
                    try {
                        return controlModule.getValue(controlInfo.id.replace('_hidden', ''), controlInfo) ?? defaultValue;
                    } catch (e) {
                        $l.eventLog('$l.getValue', `"${elID}" 값 가져오기 오류: ${e}`, 'Warning');
                    }
                }
            } else if (doc) {
                const el = this.get(elID);
                if (el) return el.value ?? defaultValue;
            }

            return defaultValue;
        },

        get(...ids) {
            if (globalRoot.devicePlatform === 'node' || !doc) return ids.length === 1 ? null : [];
            const results = ids.map(id => $object.isString(id) ? doc.getElementById(id) : null).filter(el => el !== null);
            return ids.length === 1 ? results[0] || null : results;
        },

        querySelector(...queries) {
            if (globalRoot.devicePlatform === 'node' || !doc) return queries.length === 1 ? null : [];

            const results = [];
            queries.forEach(query => {
                if ($object.isString(query)) {
                    try {
                        if (query.startsWith('//') || query.startsWith('.//')) {
                            const xpathResult = doc.evaluate(query, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                                results.push(xpathResult.snapshotItem(i));
                            }
                        } else {
                            const el = doc.querySelector(query);
                            if (el) results.push(el);
                        }
                    } catch (e) {
                        $l.eventLog('$l.querySelector', `잘못된 셀렉터 "${query}": ${e}`, 'Warning');
                    }
                }
            });

            return queries.length === 1 ? results[0] || null : results;
        },


        getTagName(...tagNames) {
            if (globalRoot.devicePlatform === 'node' || !doc) return [];
            let results = [];
            tagNames.forEach(tagName => {
                if ($object.isString(tagName)) {
                    results = results.concat(Array.from(doc.getElementsByTagName(tagName)));
                }
            });
            return results;
        },

        querySelectorAll(...queries) {
            if (globalRoot.devicePlatform === 'node' || !doc) return [];
            let results = [];
            queries.forEach(query => {
                if ($object.isString(query)) {
                    try {
                        if (query.startsWith('//') || query.startsWith('.//')) {
                            const xpathResult = doc.evaluate(query, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                                results.push(xpathResult.snapshotItem(i));
                            }
                        } else {
                            results = results.concat(Array.from(doc.querySelectorAll(query)));
                        }
                    } catch (e) {
                        $l.eventLog('$l.querySelectorAll', `잘못된 셀렉터 "${query}": ${e}`, 'Warning');
                    }
                }
            });
            return results;
        },

        toEnumText(enumObject, value) {
            if (!$object.isObject(enumObject)) return null;
            const entry = Object.entries(enumObject).find(([key, val]) => val === value);
            return entry ? entry[0] : null;
        },

        prettyTSD(tsd, isFormat = false) {
            if (typeof tsd !== 'string') return tsd;
            try {
                const parts = tsd.split('＾');
                let jsonData;
                const options = { delimiter: '｜', newline: '↵' };

                if (parts.length > 1) {
                    options.meta = $string.toParameterObject(parts[0]);
                    jsonData = $string.toJson(parts[1], options);
                } else {
                    jsonData = $string.toJson(parts[0], options);
                }

                return $string.toBoolean(isFormat) ? JSON.stringify(jsonData, null, 2) : jsonData;
            } catch (error) {
                $l.eventLog('$l.prettyTSD', `TSD 파싱 오류: ${error}`, 'Error');
                return `TSD 파싱 오류: ${error.message}`;
            }
        },

        text2Json(data, delimiter = ',', newLine = '\n') {
            if (typeof data !== 'string') return [];
            const lines = data.trim().split(newLine);
            if (lines.length < 2) return [];

            const titles = lines[0].split(delimiter).map(t => t.trim());

            return lines.slice(1).map(line => {
                const values = line.split(delimiter);
                return titles.reduce((obj, title, index) => {
                    obj[title] = values[index]?.trim() ?? '';
                    return obj;
                }, {});
            }).filter(obj => Object.keys(obj).length > 0);
        },

        json2Text(arr, columns, delimiter = ',', newLine = '\n') {
            if (!Array.isArray(arr) || !Array.isArray(columns)) return '';

            const headerRow = columns.join(delimiter);

            const valueRows = arr.map(obj =>
                columns.map(key => {
                    let cellValue = obj[key] ?? '';
                    cellValue = String(cellValue);
                    if (cellValue.includes(delimiter) || cellValue.includes(newLine) || cellValue.includes('"')) {
                        cellValue = `"${cellValue.replace(/"/g, '""')}"`;
                    }
                    return cellValue;
                }).join(delimiter)
            );

            return [headerRow, ...valueRows].join(newLine);
        },


        nested2Flat(data, itemID, parentItemID, childrenID = 'items') {
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

        parseNested2Flat(data, newData, itemID, parentItemID, childrenID = 'items') {
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

        flat2Nested(data, itemID, parentItemID, childrenID = 'items') {
            var result = null;

            if (data && itemID && parentItemID) {
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

        parseFlat2Nested(data, root, newData, itemID, parentItemID, childrenID = 'items') {
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

        findNestedByID(data, findID, itemID, childrenID = 'items') {
            if (!data || !itemID) return null;

            const itemsToSearch = Array.isArray(data) ? data : [data];

            for (const item of itemsToSearch) {
                if (item[itemID] == findID) {
                    return item;
                }

                if (Array.isArray(item[childrenID])) {
                    const foundInChildren = this.findNestedByID(item[childrenID], findID, itemID, childrenID);
                    if (foundInChildren) {
                        return foundInChildren;
                    }
                }
            }

            return null;
        },


        deepFreeze(object) {
            if (!object || typeof object !== 'object' || Object.isFrozen(object)) {
                return object;
            }

            Object.getOwnPropertyNames(object).forEach(name => {
                const value = object[name];
                if (typeof value === 'object' && value !== null) {
                    this.deepFreeze(value);
                }
            });

            return Object.freeze(object);
        },

        createBlob(data, type) {
            try {
                return new Blob([data], { type });
            } catch {
                try {
                    const BlobBuilder = context.BlobBuilder || context.WebKitBlobBuilder || context.MozBlobBuilder || context.MSBlobBuilder;
                    if (!BlobBuilder) throw new Error("BlobBuilder가 지원되지 않습니다.");
                    const builder = new BlobBuilder();
                    builder.append(data.buffer || data);
                    return builder.getBlob(type);
                } catch (fallbackError) {
                    $l.eventLog('$l.createBlob', `Blob 생성 실패: ${fallbackError}`, 'Error');
                    return null;
                }
            }
        },

        dataUriToBlob(dataUri) {
            if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;
            try {
                const parts = dataUri.split(',');
                const meta = parts[0].split(':')[1].split(';');
                const mimeType = meta[0];
                const base64 = meta.includes('base64');
                const dataString = base64 ? atob(parts[1]) : decodeURIComponent(parts[1]);

                const byteNumbers = new Array(dataString.length);
                for (let i = 0; i < dataString.length; i++) {
                    byteNumbers[i] = dataString.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                return new Blob([byteArray], { type: mimeType });
            } catch (error) {
                $l.eventLog('$l.dataUriToBlob', `Data URI -> Blob 변환 오류: ${error}`, 'Warning');
                return null;
            }
        },

        dataUriToText(dataUri) {
            if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;
            try {
                const parts = dataUri.split(',');
                const meta = parts[0].split(':')[1].split(';');
                const mimeType = meta[0];
                const base64 = meta.includes('base64');
                const value = base64 ? $cryptography.base64Decode(parts[1]) : decodeURIComponent(parts[1]);

                return { value, mime: mimeType };
            } catch (error) {
                $l.eventLog('$l.dataUriToText', `Data URI -> Text 변환 오류: ${error}`, 'Warning');
                return null;
            }
        },

        blobToDataUri(blob, callback) {
            if (!(blob instanceof Blob) || typeof callback !== 'function') {
                $l.eventLog('$l.blobToDataUri', '잘못된 Blob 또는 콜백 함수가 제공되었습니다.', 'Warning');
                if (callback) callback(new Error("잘못된 입력값"), null);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.error) {
                    $l.eventLog('$l.blobToDataUri', `FileReader 오류: ${reader.error}`, 'Error');
                    callback(reader.error, null);
                } else {
                    callback(null, reader.result);
                }
            };
            reader.onerror = () => {
                const error = reader.error || new Error('알 수 없는 FileReader 오류');
                $l.eventLog('$l.blobToDataUri', `FileReader 오류: ${error}`, 'Error');
                callback(error, null);
            };
            reader.readAsDataURL(blob);
        },


        blobToDownload(blob, fileName) {
            if (globalRoot.devicePlatform === 'node') return;

            if (!(blob instanceof Blob) || !fileName) {
                $l.eventLog('$l.blobToDownload', '잘못된 Blob 또는 파일 이름이 제공되었습니다.', 'Warning');
                return;
            }

            if (context.navigator && context.navigator.msSaveOrOpenBlob) {
                try {
                    context.navigator.msSaveOrOpenBlob(blob, fileName);
                } catch (e) {
                    $l.eventLog('$l.blobToDownload', `msSaveOrOpenBlob 실패: ${e}`, 'Error');
                }
                return;
            }

            let blobUrl = null;
            try {
                blobUrl = URL.createObjectURL(blob);
                const link = doc.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                doc.body.appendChild(link);
                link.click();
                doc.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

            } catch (e) {
                $l.eventLog('$l.blobToDownload', `다운로드 실패: ${e}`, 'Error');
                if (blobUrl) URL.revokeObjectURL(blobUrl);
            }
        },

        blobUrlToBlob(url, callback) {
            if (typeof callback !== 'function') {
                $l.eventLog('$l.blobUrlToBlob', '콜백 함수 확인 필요', 'Warning');
                if (callback) callback(new Error("콜백 함수가 필요합니다."), null);
                return;
            }
            if (!url || typeof url !== 'string') {
                if (callback) callback(new Error("잘못된 URL"), null);
                return;
            }

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP 오류! 상태: ${response.status} ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => callback(null, blob))
                .catch(error => {
                    $l.eventLog('$l.blobUrlToBlob', `url: ${url}, 오류: ${error}`, 'Warning');
                    callback(error, null);
                });
        },

        blobUrlToDataUri(url, callback) {
            if (typeof callback !== 'function') {
                $l.eventLog('$l.blobUrlToDataUri', '콜백 함수 확인 필요', 'Warning');
                if (callback) callback(new Error("콜백 함수가 필요합니다."), null);
                return;
            }
            if (!url || typeof url !== 'string') {
                if (callback) callback(new Error("잘못된 URL"), null);
                return;
            }

            this.blobUrlToBlob(url, (error, blob) => {
                if (error) {
                    callback(error, null);
                    return;
                }
                if (blob) {
                    this.blobToDataUri(blob, callback);
                } else {
                    callback(new Error("URL에서 Blob 가져오기 실패"), null);
                }
            });
        },

        async blobToBase64(blob, base64Only = false) {
            if (!(blob instanceof Blob)) return null;

            if (globalRoot.devicePlatform === 'node' && typeof Buffer !== 'undefined') {
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64Data = buffer.toString('base64');
                    if (base64Only) return base64Data;

                    const mimeType = blob.type || 'application/octet-stream';
                    return `data:${mimeType};base64,${base64Data}`;
                } catch (error) {
                    $l.eventLog('$l.blobToBase64 (Node)', `Blob -> Base64 변환 오류(Node): ${error}`, 'Error');
                    return null;
                }
            } else if (typeof FileReader !== 'undefined') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.error) {
                            reject(reader.error);
                        } else {
                            const dataUrl = reader.result;
                            if (base64Only) {
                                const base64Content = dataUrl.split(';base64,')[1] || null;
                                resolve(base64Content);
                            } else {
                                resolve(dataUrl);
                            }
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(blob);
                });
            } else {
                return null;
            }
        },

        base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
            if (!b64Data || typeof b64Data !== 'string') return null;

            try {
                const byteCharacters = atob(b64Data);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    const slice = byteCharacters.slice(offset, offset + sliceSize);
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    byteArrays.push(new Uint8Array(byteNumbers));
                }

                return new Blob(byteArrays, { type: contentType });
            } catch (e) {
                $l.eventLog('$l.base64ToBlob', `Base64 디코딩 또는 Blob 생성 실패: ${e}`, 'Error');
                return null;
            }
        },

        async blobToFile(blob, fileName, mimeType) {
            if (!(blob instanceof Blob) || !fileName) return null;
            const effectiveMimeType = mimeType || blob.type || 'application/octet-stream';
            return new File([blob], fileName, { type: effectiveMimeType });
        },

        async fileToBase64(file) {
            if (globalRoot.devicePlatform === 'node') {
                const fs = require('fs').promises;
                const path = require('path');
                const fetch = require('node-fetch');

                try {
                    let buffer;
                    let mimeType = 'application/octet-stream';

                    if (typeof file === 'string' && (file.startsWith('http:') || file.startsWith('https:'))) {
                        const response = await fetch(file);
                        if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
                        mimeType = response.headers.get('content-type') || mimeType;
                        buffer = Buffer.from(await response.arrayBuffer());
                    } else if (typeof file === 'string') {
                        const filePath = file;
                        buffer = await fs.readFile(filePath);
                        const extension = path.extname(filePath).toLowerCase();
                        const mimeTypes = {
                            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
                            '.pdf': 'application/pdf', '.txt': 'text/plain', '.html': 'text/html', '.json': 'application/json'
                        };
                        mimeType = mimeTypes[extension] || mimeType;
                    } else {
                        throw new Error("Node.js에서 fileToBase64에 잘못된 입력 유형입니다.");
                    }

                    const base64Data = buffer.toString('base64');
                    return `data:${mimeType};base64,${base64Data}`;

                } catch (error) {
                    $l.eventLog('$l.fileToBase64 (Node)', `파일 -> Base64 변환 오류(Node): ${error}`, 'Error');
                    return null;
                }

            } else if (file instanceof File && typeof FileReader !== 'undefined') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            } else {
                $l.eventLog('$l.fileToBase64', '잘못된 입력 또는 환경입니다.', 'Warning');
                return null;
            }
        },

        async fileToBlob(file) {
            const base64 = await this.fileToBase64(file);
            if (!base64) return null;

            const match = base64.match(/^data:(.+?);base64,(.+)$/);
            if (!match) return null;

            const mimeType = match[1];
            const realData = match[2];

            return this.base64ToBlob(realData, mimeType);
        },

        async resizeImage(blob, maxSize) {
            if (globalRoot.devicePlatform === 'node' || !(blob instanceof Blob) || !blob.type.startsWith('image/')) {
                const errorMsg = globalRoot.devicePlatform === 'node'
                    ? "Node.js 환경에서는 이미지 크기 조정을 지원하지 않습니다."
                    : "잘못된 입력: 이미지 Blob이 아닙니다.";
                $l.eventLog('$l.resizeImage', errorMsg, 'Warning');
                return Promise.reject(new Error(errorMsg));
            }

            const targetSize = (typeof maxSize === 'number' && maxSize > 0) ? maxSize : 80;

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                const image = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                image.onload = () => {
                    let { width, height } = image;

                    if (width > height) {
                        if (width > targetSize) {
                            height = Math.round(height * (targetSize / width));
                            width = targetSize;
                        }
                    } else {
                        if (height > targetSize) {
                            width = Math.round(width * (targetSize / height));
                            height = targetSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(image, 0, 0, width, height);

                    canvas.toBlob(resizedBlob => {
                        if (resizedBlob) {
                            resolve({ blob: resizedBlob, width, height });
                        } else {
                            reject(new Error("캔버스 -> Blob 변환 실패."));
                        }
                    }, 'image/jpeg', 0.9);
                };

                image.onerror = () => reject(new Error("이미지 로드 실패"));
                reader.onload = (e) => image.src = e.target.result;
                reader.onerror = () => reject(new Error("Blob 읽기 실패"));
                reader.readAsDataURL(blob);
            });
        },


        logLevel: Object.freeze({
            Verbose: 0, Debug: 1, Information: 2, Warning: 3, Error: 4, Fatal: 5
        }),

        start: Date.now(),
        eventLogTimer: null,
        eventLogCount: 0,

        eventLog(event, data, logLevelInput = 'Verbose') {
            const message = data instanceof Error ? data.message : String(data);
            const stack = data instanceof Error ? data.stack : undefined;

            let logLevelNum;
            if (typeof logLevelInput === 'string' && this.logLevel.hasOwnProperty(logLevelInput)) {
                logLevelNum = this.logLevel[logLevelInput];
            } else if (typeof logLevelInput === 'number') {
                logLevelNum = logLevelInput;
            } else {
                logLevelNum = this.logLevel.Verbose;
            }

            const configuredLevelName = syn.Config?.UIEventLogLevel || 'Verbose';
            const configuredLevelNum = this.logLevel[configuredLevelName] ?? this.logLevel.Verbose;

            if (logLevelNum < configuredLevelNum) {
                return;
            }

            const logLevelText = this.toEnumText(this.logLevel, logLevelNum) || 'Unknown';
            const diff = (Date.now() - this.start) / 1000;
            const timestamp = diff.toFixed(3);
            const logMessageBase = `${this.eventLogCount}@${timestamp} [${logLevelText}] [${event}]`;
            const logDetails = stack ? `${message}\n${stack}` : message;
            const finalLogMessage = `${logMessageBase} ${logDetails}`;

            if (globalRoot.devicePlatform === 'node' && globalRoot.$logger) {
                const loggerMethod = logLevelText.toLowerCase();
                if (typeof globalRoot.$logger[loggerMethod] === 'function') {
                    globalRoot.$logger[loggerMethod](finalLogMessage);
                } else {
                    globalRoot.$logger.trace(finalLogMessage);
                }
                if (context.console) console.log(finalLogMessage);

            } else if (context.console) {
                switch (logLevelNum) {
                    case this.logLevel.Error:
                    case this.logLevel.Fatal:
                        console.error(finalLogMessage); break;
                    case this.logLevel.Warning:
                        console.warn(finalLogMessage); break;
                    case this.logLevel.Information:
                        console.info(finalLogMessage); break;
                    case this.logLevel.Debug:
                        console.debug(finalLogMessage); break;
                    default: // Verbose
                        console.log(finalLogMessage); break;
                }

                if (syn.Config?.IsDebugMode === true && syn.Config?.Environment === 'Development' && logLevelNum >= this.logLevel.Warning) {
                    debugger;
                }

                if (doc && !context.console) {
                    const div = doc.createElement('div');
                    div.textContent = finalLogMessage;
                    const eventlogs = doc.getElementById('eventlogs');
                    if (eventlogs) {
                        eventlogs.appendChild(div);
                        clearTimeout(this.eventLogTimer);
                        this.eventLogTimer = setTimeout(() => {
                            eventlogs.scrollTop = eventlogs.scrollHeight;
                        }, 10);
                    } else {
                        doc.body?.appendChild(div);
                    }
                }

                if (context.bound?.browserEvent) {
                    try {
                        context.bound.browserEvent('browser', {
                            ID: 'EventLog',
                            Data: finalLogMessage
                        }, (error, json) => {
                            if (error) console.log(`browserEvent EventLog 콜백 오류: ${error}`);
                        });
                    } catch (bridgeError) {
                        console.log(`bound.browserEvent 호출 오류: ${bridgeError}`);
                    }
                }
            }

            this.eventLogCount++;
        },

        getBasePath(basePathInput, defaultPath) {
            if (globalRoot.devicePlatform !== 'node') return basePathInput || defaultPath || '';

            const path = require('path');
            const entryBasePath = process.cwd();
            let resolvedPath = '';

            if (!basePathInput) {
                resolvedPath = defaultPath ? path.resolve(entryBasePath, defaultPath) : entryBasePath;
            } else if (path.isAbsolute(basePathInput)) {
                resolvedPath = basePathInput;
            } else {
                resolvedPath = path.resolve(entryBasePath, basePathInput);
            }

            return resolvedPath;
        },

        moduleEventLog(moduleID, event, data, logLevelInput = 'Verbose') {
            if (globalRoot.devicePlatform !== 'node' || !moduleID) return;

            const message = data instanceof Error ? data.message : String(data);
            const stack = data instanceof Error ? data.stack : undefined;

            let logLevelNum;
            if (typeof logLevelInput === 'string' && this.logLevel.hasOwnProperty(logLevelInput)) {
                logLevelNum = this.logLevel[logLevelInput];
            } else if (typeof logLevelInput === 'number') {
                logLevelNum = logLevelInput;
            } else {
                logLevelNum = this.logLevel.Verbose;
            }


            const configuredLevelName = syn.Config?.UIEventLogLevel || 'Verbose';
            const configuredLevelNum = this.logLevel[configuredLevelName] ?? this.logLevel.Verbose;

            if (logLevelNum < configuredLevelNum) {
                return;
            }

            const logLevelText = this.toEnumText(this.logLevel, logLevelNum) || 'Unknown';
            const diff = (Date.now() - this.start) / 1000;
            const timestamp = diff.toFixed(3);

            const logMessageBase = `${this.eventLogCount}@${timestamp} [${event}]`;
            const logDetails = stack ? `${message}\n${stack}` : message;
            const finalLogMessage = `${logMessageBase} ${logDetails}`;

            const moduleLibrary = syn.getModuleLibrary ? syn.getModuleLibrary(moduleID) : null;
            const logger = moduleLibrary?.logger;

            if (logger) {
                const loggerMethod = logLevelText.toLowerCase();
                if (typeof logger[loggerMethod] === 'function') {
                    logger[loggerMethod](finalLogMessage);
                } else {
                    logger.trace(finalLogMessage);
                }
                if (context.console) console.log(`[${moduleID}] ${logLevelText}: ${finalLogMessage}`);

            } else {
                console.log(`모듈 로거 오류: ModuleID "${moduleID}"에 대한 로거를 찾을 수 없습니다. 메시지: ${finalLogMessage}`);
            }

            this.eventLogCount++;
        }

    });

    if (globalRoot.devicePlatform === 'node') {
        const browserOnlyMethods = [
            'addEvent', 'addEvents', 'addLive', 'removeEvent', 'hasEvent', 'trigger',
            'triggerEvent', 'getValue', 'get', 'querySelector', 'getTagName',
            'querySelectorAll', 'dispatchClick'
        ];
        browserOnlyMethods.forEach(method => { delete $library[method]; });
    } else {
        const nodeOnlyMethods = ['getBasePath', 'moduleEventLog'];
        nodeOnlyMethods.forEach(method => { delete $library[method]; });
    }

    context.$library = syn.$l = $library;
})(globalRoot);
