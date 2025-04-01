(function (context) {
    'use strict';
    const $request = context.$request || new syn.module();
    let doc = null;
    let currentPath = '';
    let currentHref = '';

    if (globalRoot.devicePlatform !== 'node') {
        doc = context.document;
        currentPath = context.location?.pathname ?? '';
        currentHref = context.location?.href ?? '';
    }

    $request.extend({
        params: {},
        path: currentPath,

        query(param, url) {
            url = url || currentHref;

            return function (url) {
                url = url.split('?');
                let query = ((url.length == 1) ? url[0] : url[1]).split('&');
                for (let i = 0; i < query.length; i++) {
                    let splitIndex = query[i].indexOf('=');
                    let key = query[i].substring(0, splitIndex);
                    let value = query[i].substring(splitIndex + 1);
                    syn.$r.params[key] = value;
                }
                return syn.$r.params;
            }(url)[param];
        },

        url() {
            const url = syn.$r.path.split('?');
            let param = '';

            param = syn.$r.path + ((syn.$r.path.length > 0 && url.length > 1) ? '&' : '?');
            for (let key in $request.params) {
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
            const result = jsonObject ? Object.entries(jsonObject).reduce((queryString, ref, index) => {
                let key = ref[0];
                let val = ref[1];
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
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce((a, v) => {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
            }, {});
        },

        async isCorsEnabled(url) {
            if (!url || globalRoot.devicePlatform === 'node') return true;
            try {
                const response = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache', signal: AbortSignal.timeout(2000) });
                const corsOk = response.ok;
                if (!corsOk) {
                    syn.$l.eventLog('$r.isCorsEnabled', `${url}, Status: ${response.status} ${response.statusText}`, 'Warning');
                }
                return corsOk;
            } catch (error) {
                syn.$l.eventLog('$r.isCorsEnabled', `${url}, Error: ${error.message}`, (error.name === 'AbortError' ? 'Warning' : 'Error'));
                return false;
            }
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
                                let environment = syn.Environment;
                                if (environment.Header) {
                                    for (let item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            let data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                let controller = new AbortController();
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
                                let environment = syn.Environment;
                                if (environment.Header) {
                                    for (let item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            let data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                let controller = new AbortController();
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
                            let contentType = response.headers.get('Content-Type') || '';
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

        // let result = await syn.$r.httpRequest('GET', '/index');
        httpRequest(method, url, data, callback, options) {
            options = syn.$w.argumentsExtend({
                timeout: 0,
                responseType: 'text'
            }, options);

            if ($object.isNullOrUndefined(data) == true) {
                data = {};
            }

            let xhr = syn.$w.xmlHttp();
            xhr.open(method, url, true);
            xhr.timeout = options.timeout;
            xhr.responseType = options.responseType;
            xhr.setRequestHeader('OffsetMinutes', syn.$w.timezoneOffsetMinutes);

            let formData = null;
            if ($object.isNullOrUndefined(data.body) == false) {
                let params = data.body;
                if (method.toUpperCase() == 'GET') {
                    let paramUrl = url + ((url.split('?').length > 1) ? '&' : '?');

                    for (let key in params) {
                        paramUrl += key + '=' + params[key].toString() + '&';
                    }

                    url = encodeURI(paramUrl.substring(0, paramUrl.length - 1));
                }
                else {
                    formData = new FormData();

                    for (let key in params) {
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

            let form = document.forms[formID];
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

            let xhr = syn.$w.xmlHttp();
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

        createBlobUrl: context.URL?.createObjectURL?.bind(context.URL) ?? context.webkitURL?.createObjectURL?.bind(context.webkitURL),
        revokeBlobUrl: context.URL?.revokeObjectURL?.bind(context.URL) ?? context.webkitURL?.revokeObjectURL?.bind(context.webkitURL),

        getCookie(id) {
            if (globalRoot.devicePlatform === 'node' || !doc?.cookie) return undefined;
            const cookies = doc.cookie.split('; ');
            for (const cookie of cookies) {
                const [name, ...valueParts] = cookie.split('=');
                if (name === id) {
                    return decodeURIComponent(valueParts.join('='));
                }
            }
            return undefined;
        },

        setCookie(id, val, expires, path = '/', domain, secure = false) {
            if (globalRoot.devicePlatform === 'node' || !doc) return this;
            let cookieString = `${id}=${encodeURIComponent(val)}`;

            if (expires instanceof Date) {
                cookieString += `; expires=${expires.toUTCString()}`;
            } else if (typeof expires === 'number') {
                cookieString += `; max-age=${expires}`;
            }

            cookieString += `; path=${path}`;
            if (domain) cookieString += `; domain=${domain}`;
            if (secure) cookieString += `; secure`;
            cookieString += `; SameSite=Lax`;

            doc.cookie = cookieString;
            return this;
        },

        deleteCookie(id, path = '/', domain) {
            this.setCookie(id, '', new Date(0), path, domain);
            return this;
        }
    });
    context.$request = syn.$r = $request;
})(globalRoot);
