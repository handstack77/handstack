(function (context) {
    'use strict';
    const $request = context.$request || new syn.module();
    let doc = null;
    let currentPath = '';
    let currentHref = '';

    const $s = context.$string;
    const $l = context.$library;
    const $w = context.$webform;

    if (globalRoot.devicePlatform !== 'node') {
        doc = context.document;
        currentPath = context.location?.pathname ?? '';
        currentHref = context.location?.href ?? '';
    }

    $request.extend({
        params: {},
        path: currentPath,

        query(param, url) {
            const targetUrl = url || currentHref;
            if (!this.params[targetUrl]) {
                this.params[targetUrl] = {};
                try {
                    const searchParams = new URL(targetUrl).searchParams;
                    searchParams.forEach((value, key) => {
                        this.params[targetUrl][key] = value;
                    });
                } catch (e) {
                    const queryString = targetUrl.split('?')[1] || '';
                    queryString.split('&').forEach(pair => {
                        const parts = pair.split('=');
                        if (parts.length === 2) {
                            const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
                            const value = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                            if (key) this.params[targetUrl][key] = value;
                        }
                    });
                }
            }
            return this.params[targetUrl][param];
        },

        url() {
            let baseUrl = this.path;
            const currentParams = { ...this.params[currentHref] };

            if (syn.Config?.IsClientCaching === false) {
                currentParams.noCache = Date.now();
            }

            const queryString = this.toQueryString(currentParams, true);
            return encodeURI(baseUrl + queryString);
        },

        toQueryString(jsonObject, includeQuestionMark = false) {
            if (!jsonObject || typeof jsonObject !== 'object') return '';
            const params = new URLSearchParams();
            Object.entries(jsonObject).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    params.append(key, $s.toValue(val, ''));
                }
            });
            const queryString = params.toString();
            if (queryString && includeQuestionMark) {
                return `?${queryString}`;
            }
            return queryString ? `&${queryString}` : '';
        },

        toUrlObject(url) {
            const targetUrl = url || currentHref;
            const params = {};
            try {
                const urlObj = new URL(targetUrl);
                urlObj.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            } catch (e) {
                const queryString = targetUrl.split('?')[1] || '';
                queryString.split('&').forEach(pair => {
                    const parts = pair.split('=');
                    if (parts.length === 2) {
                        const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
                        const value = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                        if (key) params[key] = value;
                    }
                });
            }
            return params;
        },

        async isCorsEnabled(url) {
            if (!url || globalRoot.devicePlatform === 'node') return true;
            try {
                const response = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache', signal: AbortSignal.timeout(2000) });
                const corsOk = response.ok;
                if (!corsOk) {
                    $l.eventLog('$r.isCorsEnabled', `${url}, Status: ${response.status} ${response.statusText}`, 'Warning');
                }
                return corsOk;
            } catch (error) {
                $l.eventLog('$r.isCorsEnabled', `${url}, Error: ${error.message}`, (error.name === 'AbortError' ? 'Warning' : 'Error'));
                return false;
            }
        },

        httpFetch(url) {
            if (!url) return Promise.reject(new Error("URL is required for httpFetch"));

            return {
                send: async (rawData, options = {}) => {
                    const { method = 'GET', timeout, contentType, ...restOptions } = options;
                    const effectiveMethod = (rawData !== null && rawData !== undefined && method === 'GET') ? 'POST' : method;
                    const headers = new Headers(restOptions.headers || {});

                    if (!(rawData instanceof FormData) && !headers.has('Content-Type')) {
                        headers.set('Content-Type', contentType || 'application/json');
                    }

                    if (syn.Environment?.Header) {
                        Object.entries(syn.Environment.Header).forEach(([key, value]) => {
                            if (!headers.has(key)) headers.append(key, value);
                        });
                    }

                    if (!headers.has('OffsetMinutes')) {
                        headers.append('OffsetMinutes', String($w?.timezoneOffsetMinutes ?? -(new Date().getTimezoneOffset())));
                    }

                    const fetchOptions = {
                        method: effectiveMethod,
                        headers: headers,
                        redirect: 'follow',
                        body: (rawData instanceof FormData) ? rawData : (rawData !== null && rawData !== undefined ? JSON.stringify(rawData) : null),
                        ...restOptions
                    };

                    let timeoutId = null;
                    if (typeof timeout === 'number' && timeout > 0) {
                        const controller = new AbortController();
                        fetchOptions.signal = controller.signal;
                        timeoutId = setTimeout(() => controller.abort(), timeout);
                    }

                    try {
                        const response = await fetch(url, fetchOptions);

                        if (timeoutId) clearTimeout(timeoutId);

                        if (!response.ok) {
                            const errorText = await response.text().catch(() => 'Failed to read error response body');
                            const errorMsg = `HTTP error! status: ${response.status}, text: ${errorText}`;
                            $l.eventLog('$r.httpFetch', errorMsg, 'Error');
                            return { error: errorMsg };
                        }

                        const responseContentType = response.headers.get('Content-Type') || '';
                        if (responseContentType.includes('application/json')) {
                            return await response.json();
                        } else if (responseContentType.includes('text/')) {
                            return await response.text();
                        } else {
                            return await response.blob();
                        }

                    } catch (error) {
                        if (timeoutId) clearTimeout(timeoutId);
                        $l.eventLog('$r.httpFetch', `Fetch error: ${error.message}`, 'Error');
                        return { error: `Fetch error: ${error.message}` };
                    }
                }
            };
        },

        httpRequest(method, url, data = {}, callback, options = {}) {
            const { timeout = 0, responseType = 'text', contentType } = options;
            const effectiveMethod = String(method).toUpperCase();
            let requestUrl = url;
            let requestBody = null;
            const headers = {};

            headers['OffsetMinutes'] = String($w?.timezoneOffsetMinutes ?? -(new Date().getTimezoneOffset()));

            if (data && Object.keys(data).length > 0) {
                if (effectiveMethod === 'GET') {
                    const queryString = $r.toQueryString(data, !url.includes('?'));
                    requestUrl += queryString;
                } else {
                    if (data instanceof FormData) {
                        requestBody = data;
                    } else if (typeof data === 'object') {
                        if (contentType === 'application/x-www-form-urlencoded') {
                            requestBody = $r.toQueryString(data, false).substring(1);
                            headers['Content-Type'] = 'application/x-www-form-urlencoded';
                        } else {
                            try {
                                requestBody = JSON.stringify(data);
                                headers['Content-Type'] = contentType || 'application/json';
                            } catch (e) {
                                const errorMsg = 'Failed to stringify data for request body';
                                $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                                if (callback) return callback({ status: -1, response: errorMsg });
                                return Promise.resolve({ status: -1, response: errorMsg });
                            }
                        }
                    } else {
                        requestBody = String(data);
                        headers['Content-Type'] = contentType || 'text/plain';
                    }
                }
            } else if (!headers['Content-Type'] && effectiveMethod !== 'GET' && effectiveMethod !== 'HEAD') {
                headers['Content-Type'] = contentType || 'application/json';
            }

            if (!callback && typeof Promise !== 'undefined') {
                const fetchOptions = {
                    method: effectiveMethod,
                    headers: { ...headers },
                    body: requestBody,
                    signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined
                };
                if ($w?.setServiceClientHeader) {
                    const tempHeaders = new Headers(fetchOptions.headers);
                    if ($w.setServiceClientHeader(tempHeaders) === false) {
                        return Promise.resolve({ status: -1, response: 'ServiceClientHeader check failed' });
                    }
                    fetchOptions.headers = tempHeaders;
                }

                return fetch(requestUrl, fetchOptions)
                    .then(async response => ({
                        status: response.status,
                        response: responseType === 'blob' ? await response.blob()
                            : responseType === 'json' ? await response.json()
                                : await response.text()
                    }))
                    .catch(error => {
                        const errorMsg = error.name === 'AbortError' ? 'Request timed out' : `Fetch error: ${error.message}`;
                        $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                        return { status: -1, response: errorMsg };
                    });
            }

            if (!context.XMLHttpRequest) {
                const errorMsg = 'XMLHttpRequest not supported';
                $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                if (callback) return callback({ status: -1, response: errorMsg });
                return;
            }

            const xhr = new context.XMLHttpRequest();
            xhr.open(effectiveMethod, requestUrl, true);
            xhr.timeout = timeout;
            try {
                xhr.responseType = responseType;
            } catch {
                $l.eventLog('$r.httpRequest', `XHR responseType '${responseType}' not supported`, 'Warning');
            }

            Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));

            if ($w?.setServiceClientHeader && $w.setServiceClientHeader(xhr) === false) {
                if (callback) callback({ status: -1, response: 'ServiceClientHeader check failed' });
                return;
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && callback) {
                    if (xhr.status === 0 && !xhr.response) {
                        $l.eventLog('$r.httpRequest', 'XHR Request failed (Network error or CORS)', 'Fatal');
                        callback({ status: xhr.status, response: 'XHR Request failed (Network error or CORS)' });
                    } else if (xhr.status < 200 || xhr.status >= 300) {
                        $l.eventLog('$r.httpRequest', `XHR response status - ${xhr.status} ${xhr.statusText}: ${xhr.response}`, 'Error');
                        callback({ status: xhr.status, response: xhr.response || xhr.statusText });
                    } else {
                        callback({ status: xhr.status, response: xhr.response });
                    }
                }
            };

            xhr.onerror = () => {
                if (callback) {
                    $l.eventLog('$r.httpRequest', 'XHR Network Error', 'Error');
                    callback({ status: -1, response: 'XHR Network Error' });
                }
            };
            xhr.ontimeout = () => {
                if (callback) {
                    $l.eventLog('$r.httpRequest', 'XHR Request Timed Out', 'Error');
                    callback({ status: -1, response: 'XHR Request Timed Out' });
                }
            };

            try {
                xhr.send(requestBody);
            } catch (e) {
                if (callback) {
                    $l.eventLog('$r.httpRequest', `XHR send error: ${e}`, 'Error');
                    callback({ status: -1, response: `XHR send error: ${e.message}` });
                }
            }
        },

        httpSubmit(url, formID, method = 'POST') {
            if (globalRoot.devicePlatform === 'node' || !doc?.forms) return false;

            const form = formID ? doc.forms[formID] : doc.forms[0];
            if (form instanceof HTMLFormElement) {
                form.method = method;
                form.action = url;
                form.submit();
                return true;
            }
            return false;
        },

        httpDataSubmit(formData, url, callback, options = {}) {
            return this.httpRequest('POST', url, formData, callback, options);
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
