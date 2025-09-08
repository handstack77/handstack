(function (context) {
    'use strict';
    const $request = context.$request || new syn.module();
    let document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        document = context.document;
    }

    $request.extend({
        params: {},
        path: (globalRoot.devicePlatform === 'node') ? '' : location.pathname,

        query(param, url) {
            url = url || location.href;

            return function (url) {
                let urlArray = url.split('?');
                let query = ((urlArray.length == 1) ? urlArray[0] : urlArray[1]).split('&');
                for (let i = 0; i < query.length; i++) {
                    let splitIndex = query[i].indexOf('=');
                    const key = query[i].substring(0, splitIndex);
                    const value = query[i].substring(splitIndex + 1);
                    syn.$r.params[key] = /%[0-9A-Fa-f]{2}/.test(value) == true ? decodeURIComponent(value) : value;
                }
                return syn.$r.params;
            }(url)[param];
        },

        url() {
            let urlArray = syn.$r.path.split('?');
            let param = '';

            param = syn.$r.path + ((syn.$r.path.length > 0 && urlArray.length > 1) ? '&' : '?');
            for (const key in $request.params) {
                if (typeof (syn.$r.params[key]) == 'string') {
                    param += key + '=' + syn.$r.params[key] + '&';
                }
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == false) {
                param += '&noCache=' + (new Date()).getTime();
            }

            return encodeURI(param.substring(0, param.length - 1));
        },

        toQueryString(jsonObject, isQuestion) {
            let result = jsonObject ? Object.entries(jsonObject).reduce((queryString, ref, index) => {
                const key = ref[0];
                const val = ref[1];
                queryString += `&${key}=${$string.toValue(val, '')}`;
                return queryString;
            }, '') : '';

            if ($string.isNullOrEmpty(result) == false && $string.toBoolean(isQuestion) == true) {
                result = '?' + result.substring(1);
            }

            return result;
        },

        toUrlObject(url) {
            url = url || location.href;
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
            }, {});
        },

        // resolveUrl('/api/v1/users', 'https://example.com'); // https://example.com/api/v1/users
        // resolveUrl('/api/v1/users', 'https://example.com/api/v2'); // https://example.com/api/v1/users
        // resolveUrl('../v1/users/', 'https://example.com/api/v2'); // https://example.com/api/v1/users
        // resolveUrl('users', 'https://example.com/api/v1/groups'); // https://example.com/api/v1/users
        // const usersApiUrl = resolveUrl('/api/users');
        resolveUrl(relativePath, baseUrl) {
            baseUrl = (baseUrl instanceof URL) ? baseUrl.href : (baseUrl || location.href);
            return new URL(relativePath, baseUrl).href;
        },

        addQueryParam(param, value, urlStr) {
            const url = new URL(urlStr || location.href);

            if ($object.isObject(param) == true) {
                Object.entries(param).forEach(([key, val]) => {
                    url.searchParams.append(key, String(val));
                });
            } else if ($object.isString(param) && value !== undefined) {
                url.searchParams.append(param, String(value));
            } else {
                syn.$l.eventLog('$r.addQueryParam', '잘못된 파라미터 형식입니다. 문자열 키와 값이거나 객체여야 합니다.', 'Warning');
            }

            return url.toString();
        },

        removeQueryParam(paramName, urlStr) {
            const url = new URL(urlStr || location.href);

            if ($object.isArray(paramName) == true) {
                paramName.forEach(p => url.searchParams.delete(p));
            } else if ($object.isString(paramName)) {
                url.searchParams.delete(paramName);
            } else {
                syn.$l.eventLog('$r.removeQueryParam', '잘못된 파라미터 형식입니다. 문자열 또는 문자열 배열이어야 합니다.', 'Warning');
            }

            return url.toString();
        },

        setQueryParam(param, value, urlStr) {
            const url = new URL(urlStr || location.href);

            if ($object.isObject(param) == true) {
                Object.entries(param).forEach(([key, val]) => {
                    url.searchParams.set(key, String(val));
                });
            } else if ($object.isString(param) && value !== undefined) {
                url.searchParams.set(param, String(value));
            } else {
                syn.$l.eventLog('$r.setQueryParam', '잘못된 파라미터 형식입니다. 문자열 키와 값이거나 객체여야 합니다.', 'Warning');
            }

            return url.toString();
        },

        async isCorsEnabled(url) {
            let result = false;
            try {
                const response = await fetch(url, { method: 'HEAD', timeout: 200 });
                result = (response.status >= 200 && response.status <= 299);

                if (result == false) {
                    syn.$l.eventLog('$w.isCorsEnabled', '{0}, {1}:{2}'.format(url, response.status, response.statusText), 'Warning');
                }
            } catch (error) {
                syn.$l.eventLog('$w.isCorsEnabled', error.message, 'Error');
            }

            return result;
        },

        httpFetch(url) {
            return new Proxy({}, {
                get(target, action) {
                    return async function (raw, options) {
                        if (['send'].indexOf(action) == -1) {
                            return Promise.resolve({ error: `${action} 메서드 확인 필요` });
                        }

                        options = syn.$w.argumentsExtend({
                            method: 'GET'
                        }, options);

                        let response = null;
                        let requestTimeoutID = null;
                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            options.method = options.method || 'POST';

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                if (raw instanceof FormData) {
                                }
                                else {
                                    options.headers.append('Content-Type', options.contentType || 'application/json');
                                }
                            }

                            if (syn.Environment) {
                                const environment = syn.Environment;
                                if (environment.Header) {
                                    for (const item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            const data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                const controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', options.contentType || 'application/json');
                            }

                            if (syn.Environment) {
                                const environment = syn.Environment;
                                if (environment.Header) {
                                    for (const item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            const data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                const controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }

                        let result = { error: '요청 정보 확인 필요' };
                        if (response.ok == true) {
                            const contentType = response.headers.get('Content-Type') || '';
                            if (contentType.includes('application/json') == true) {
                                result = await response.json();
                            }
                            else if (contentType.includes('text/') == true) {
                                result = await response.text();
                            }
                            else {
                                result = await response.blob();
                            }
                            return Promise.resolve(result);
                        }
                        else {
                            result = { error: `status: ${response.status}, text: ${await response.text()}` }
                            syn.$l.eventLog('$r.httpFetch', `${result.error}`, 'Error');
                        }

                        return Promise.resolve(result);
                    };
                }
            });
        },

        // var result = await syn.$r.httpRequest('GET', '/index');
        httpRequest(method, url, data, callback, options) {
            options = syn.$w.argumentsExtend({
                timeout: 0,
                responseType: 'text'
            }, options);

            if ($object.isNullOrUndefined(data) == true) {
                data = {};
            }

            const xhr = syn.$w.xmlHttp();
            xhr.open(method, url, true);
            xhr.timeout = options.timeout;
            xhr.responseType = options.responseType;
            xhr.setRequestHeader('OffsetMinutes', syn.$w.timezoneOffsetMinutes);

            let formData = null;
            if ($object.isNullOrUndefined(data.body) == false) {
                const params = data.body;
                if (method.toUpperCase() == 'GET') {
                    let paramUrl = url + ((url.split('?').length > 1) ? '&' : '?');

                    for (const key in params) {
                        paramUrl += key + '=' + params[key].toString() + '&';
                    }

                    url = encodeURI(paramUrl.substring(0, paramUrl.length - 1));
                }
                else {
                    formData = new FormData();

                    for (const key in params) {
                        formData.append(key, params[key].toString());
                    }
                }
            }
            else {
                xhr.setRequestHeader('Content-Type', options.contentType || 'application/json');
            }

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            if (callback) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            if (xhr.status == 0) {
                                syn.$l.eventLog('$r.httpRequest', 'X-Requested transport error', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$r.httpRequest', 'response status - {0}'.format(xhr.statusText) + xhr.response, 'Error');
                            }
                            return;
                        }

                        if (callback) {
                            callback({
                                status: xhr.status,
                                response: xhr.response
                            });
                        }
                    }
                }

                if (formData == null) {
                    if (data != {}) {
                        xhr.send(JSON.stringify(data));
                    } else {
                        xhr.send();
                    }
                }
                else {
                    xhr.send(formData);
                }
            }
            else if (globalRoot.Promise) {
                return new Promise(function (resolve) {
                    xhr.onload = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };
                    xhr.onerror = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };

                    if (formData == null) {
                        if (data != {}) {
                            xhr.send(JSON.stringify(data));
                        } else {
                            xhr.send();
                        }
                    }
                    else {
                        xhr.send(formData);
                    }
                });
            }
            else {
                syn.$l.eventLog('$w.httpRequest', '지원하지 않는 기능. 매개변수 확인 필요', 'Error');
            }
        },

        httpSubmit(url, formID, method) {
            if (document.forms.length == 0) {
                return false;
            }
            else if (document.forms.length > 0 && $object.isNullOrUndefined(formID) == true) {
                formID = document.forms[0].id;
            }

            const form = document.forms[formID];
            if (form) {
                form.method = method || 'POST';
                form.action = url;
                form.submit();
            }
            else {
                return false;
            }
        },

        httpDataSubmit(formData, url, callback, options) {
            options = syn.$w.argumentsExtend({
                timeout: 0,
                responseType: 'text'
            }, options);

            const xhr = syn.$w.xmlHttp();
            xhr.open('POST', url, true);
            xhr.timeout = options.timeout;
            xhr.responseType = options.responseType;
            xhr.setRequestHeader('OffsetMinutes', syn.$w.timezoneOffsetMinutes);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            if (callback) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            if (xhr.status == 0) {
                                syn.$l.eventLog('$r.httpDataSubmit', 'X-Requested transfort error', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$r.httpDataSubmit', 'response status - {0}'.format(xhr.statusText) + xhr.response, 'Error');
                            }
                            return;
                        }

                        if (callback) {
                            callback({
                                status: xhr.status,
                                response: xhr.response
                            });
                        }
                    }
                }
                xhr.send(formData);
            }
            else if (globalThis.Promise) {
                return new Promise(function (resolve) {
                    xhr.onload = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };
                    xhr.onerror = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };

                    xhr.send(formData);
                });
            }
            else {
                syn.$l.eventLog('$r.httpDataSubmit', '지원하지 않는 기능. 매개변수 확인 필요', 'Error');
            }
        },

        createBlobUrl: (globalRoot.URL && typeof globalRoot.URL.createObjectURL === 'function' && globalRoot.URL.createObjectURL.bind(globalRoot.URL)) || (typeof globalRoot.webkitURL !== 'undefined' && typeof globalRoot.webkitURL.createObjectURL === 'function' && globalRoot.webkitURL.createObjectURL.bind(globalRoot.webkitURL)) || globalRoot.createObjectURL,
        revokeBlobUrl: (globalRoot.URL && typeof globalRoot.URL.revokeObjectURL === 'function' && globalRoot.URL.revokeObjectURL.bind(globalRoot.URL)) || (typeof globalRoot.webkitURL !== 'undefined' && typeof globalRoot.webkitURL.revokeObjectURL === 'function' && globalRoot.webkitURL.revokeObjectURL.bind(globalRoot.webkitURL)) || globalRoot.revokeObjectURL,

        getCookie(id) {
            const matches = document.cookie.match(
                new RegExp(
                    '(?:^|; )' +
                    id.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
                    '=([^;]*)'
                )
            );
            return matches ? decodeURIComponent(matches[1]) : undefined;
        },

        setCookie(id, val, expires, path, domain, secure) {
            if ($object.isNullOrUndefined(expires) == true) {
                expires = new Date((new Date()).getTime() + (1000 * 60 * 60 * 24));
            }

            if ($object.isNullOrUndefined(path) == true) {
                path = '/';
            }

            document.cookie = id + '=' + encodeURI(val) + ((expires) ? ';expires=' + expires.toUTCString() : '') + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ((secure) ? ';secure' : '');
            return $request;
        },

        deleteCookie(id, path, domain) {
            if (syn.$r.getCookie(id)) {
                document.cookie = id + '=' + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
            }
            return $request;
        }
    });
    context.$request = syn.$r = $request;
})(globalRoot);
