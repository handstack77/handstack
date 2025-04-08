(function (context) {
    'use strict';
    const $network = context.$network || new syn.module();

    $network.extend({
        myChannelID: null,
        connections: [],
        concreate($network) {
            $network.myChannelID = syn.$r.query('channelID') || syn.$r.query('ChannelID') || syn.$r.query('CHANNELID') || syn.$r.query('channelid') || '';
        },

        rooms: (function () {
            let currentTransactionID = Math.floor(Math.random() * 1000001);
            const boundChannels = {};

            const addChannel = (channelWindow, origin, scope, handler) => {
                const hasWin = (arr) => arr.some(item => item.channelWindow === channelWindow);

                let exists = false;

                if (origin === '*') {
                    for (const k in boundChannels) {
                        if (!boundChannels.hasOwnProperty(k) || k === '*') continue;
                        if (typeof boundChannels[k][scope] === 'object') {
                            exists = hasWin(boundChannels[k][scope]);
                            if (exists) break;
                        }
                    }
                } else {
                    if (boundChannels['*']?.[scope]) {
                        exists = hasWin(boundChannels['*'][scope]);
                    }
                    if (!exists && boundChannels[origin]?.[scope]) {
                        exists = hasWin(boundChannels[origin][scope]);
                    }
                }

                if (exists) {
                    syn.$l.eventLog('$network.addChannel', `origin: ${origin}, scope: ${scope}에 해당하는 채널이 이미 있습니다`, 'Warning');
                    return;
                }

                if (typeof boundChannels[origin] !== 'object') {
                    boundChannels[origin] = {};
                }
                if (typeof boundChannels[origin][scope] !== 'object') {
                    boundChannels[origin][scope] = [];
                }

                boundChannels[origin][scope].push({ channelWindow, handler });
            };

            const removeChannel = (channelWindow, origin, scope) => {
                const arr = boundChannels[origin]?.[scope];
                if (!arr) return;

                boundChannels[origin][scope] = arr.filter(item => item.channelWindow !== channelWindow);

                if (boundChannels[origin][scope].length === 0) {
                    delete boundChannels[origin][scope];
                    if (Object.keys(boundChannels[origin]).length === 0) {
                        delete boundChannels[origin];
                    }
                }

                const idx = $network.connections.findIndex(item => item.options.origin === origin && item.options.scope === scope);
                if (idx > -1) {
                    $network.connections.splice(idx, 1);
                }
            };

            const transactionMessages = {};

            const onPostMessage = (evt) => {
                let parsedMessage;
                try {
                    if (!evt.data || location.origin != evt.origin) return;
                    parsedMessage = JSON.parse(evt.data);
                    if (typeof parsedMessage !== 'object' || parsedMessage === null) {
                        syn.$l.eventLog('$network.onPostMessage', 'postMessage data 확인 필요 (non-object)', 'Verbose');
                        return;
                    }
                } catch (error) {
                    syn.$l.eventLog('$network.onPostMessage', `JSON parse error: ${error.message}`, 'Verbose');
                    return;
                }

                const sourceWindow = evt.source;
                const channelOrigin = evt.origin;
                let channelScope = null;
                let methodName = null;
                let messageID = parsedMessage.id;

                if (typeof parsedMessage.method === 'string') {
                    const parts = parsedMessage.method.split('::');
                    if (parts.length === 2) {
                        [channelScope, methodName] = parts;
                    } else {
                        methodName = parsedMessage.method;
                    }
                }

                if (methodName) {
                    let delivered = false;
                    const deliver = (originToCheck) => {
                        const handlers = boundChannels[originToCheck]?.[channelScope];
                        if (handlers) {
                            for (const handlerObj of handlers) {
                                if (handlerObj.channelWindow === sourceWindow) {
                                    handlerObj.handler(channelOrigin, methodName, parsedMessage);
                                    return true;
                                }
                            }
                        }
                        return false;
                    };

                    if (deliver(channelOrigin)) {
                        delivered = true;
                    }
                    if (!delivered) {
                        deliver('*');
                    }

                } else if (messageID !== undefined) {
                    const callback = transactionMessages[messageID];
                    if (callback) {
                        callback(channelOrigin, methodName, parsedMessage);
                    }
                }
            };

            if (context.addEventListener) {
                context.addEventListener('message', onPostMessage, false);
            } else if (context.attachEvent) {
                context.attachEvent('onmessage', onPostMessage);
            }

            const connectChannel = {
                connect(options) {
                    if (typeof options !== 'object') {
                        syn.$l.eventLog('$network.options', '유효한 매개변수 없이 호출된 채널 빌드', 'Error');
                        return;
                    }
                    if (!options.window || !options.window.postMessage) {
                        syn.$l.eventLog('$network.context', '필수 매개변수 없이 호출된 채널 빌드 (window)', 'Error');
                        return;
                    }
                    if (context === options.window) {
                        syn.$l.eventLog('$network.context', '동일한 화면에서 거래되는 채널 생성은 허용되지 않음', 'Error');
                        return;
                    }

                    options.origin = options.origin || '*';
                    let validOrigin = false;
                    if (typeof options.origin === 'string') {
                        if (options.origin === '*') {
                            validOrigin = true;
                        } else {
                            const oMatch = options.origin.match(/^https?:\/\/(?:[-a-zA-Z0-9_\.])+(?::\d+)?/);
                            if (oMatch) {
                                options.origin = oMatch[0].toLowerCase();
                                validOrigin = true;
                            }
                        }
                    }

                    if (!validOrigin) {
                        syn.$l.eventLog('$network.origin', '유효한 origin 없이 호출된 채널 빌드', 'Error');
                        return;
                    }

                    let channelID = options.scope || syn.$l.random();

                    if (typeof options.scope !== 'undefined') {
                        if (typeof options.scope !== 'string') {
                            syn.$l.eventLog('$network.scope', 'scope는 문자열이어야 함', 'Error');
                            return;
                        }
                        if (options.scope.includes('::')) {
                            syn.$l.eventLog('$network.scope', 'scope에는 이중 콜론 ("::")이 포함될 수 없음', 'Error');
                            return;
                        }
                    } else {
                        options.scope = '';
                    }


                    const channel = $network.findChannel(channelID);
                    if (channel && channelID !== '') {
                        syn.$l.eventLog('$network.connect', `channelID: ${channelID} 중복 확인 필요`, 'Warning');
                        return;
                    }

                    const debug = (message) => {
                        if (options.debugOutput) {
                            try {
                                const msgString = typeof message !== 'string' ? JSON.stringify(message) : message;
                                syn.$l.eventLog('$network.debug', `channelID: ${channelID}, message: ${msgString}`, 'Information');
                            } catch (error) {
                                syn.$l.eventLog('$network.debug', `channelID: ${channelID}, message stringify error: ${error.message}`, 'Error');
                            }
                        }
                    };

                    const registrationMappingMethods = {};
                    const sendRequests = {};
                    const receivedRequests = {};
                    let ready = false;
                    const pendingQueue = [];

                    const createTransaction = (id, origin, callbacks) => {
                        let shouldDelayReturn = false;
                        let completed = false;

                        return {
                            origin,
                            invoke: (callbackName, v) => {
                                if (!receivedRequests[id]) {
                                    debug(`존재하지 않는 거래의 콜백 호출 시도: ${id}`);
                                    return;
                                }
                                if (!callbacks.includes(callbackName)) {
                                    debug(`존재하지 않는 콜백 호출 시도: ${callbackName}`);
                                    return;
                                }
                                postMessage({ id, callback: callbackName, params: v });
                            },
                            error: (error, message) => {
                                if (completed) return;
                                completed = true;
                                if (!receivedRequests[id]) {
                                    debug(`존재하지 않는 메시지의 에러 호출 시도: ${id}`);
                                    return;
                                }
                                delete receivedRequests[id];
                                postMessage({ id, error, message });
                            },
                            complete: (v) => {
                                if (completed) return;
                                completed = true;
                                if (!receivedRequests[id]) {
                                    debug(`존재하지 않는 메시지의 완료 호출 시도: ${id}`);
                                    return;
                                }
                                delete receivedRequests[id];
                                postMessage({ id, result: v });
                            },
                            delayReturn: (delay) => {
                                if (typeof delay === 'boolean') {
                                    shouldDelayReturn = delay;
                                }
                                return shouldDelayReturn;
                            },
                            completed: () => completed,
                        };
                    };

                    const setTransactionTimeout = (transactionID, timeout, method) => {
                        return setTimeout(() => {
                            const request = sendRequests[transactionID];
                            if (request) {
                                const message = `"${method}" 타임아웃 (${timeout}ms) `;
                                request.error('timeout_error', message);
                                delete sendRequests[transactionID];
                                delete transactionMessages[transactionID];
                            }
                        }, timeout);
                    };

                    const onMessage = (origin, method, data) => {
                        if (typeof options.gotMessageObserver === 'function') {
                            try {
                                options.gotMessageObserver(origin, data);
                            } catch (error) {
                                debug(`gotMessageObserver() 오류: ${error.toString()}`);
                            }
                        }

                        const { id, callback: callbackName, params, error: errorName, message: errorMessage, result } = data;

                        if (id !== undefined && method) {
                            const targetMethod = registrationMappingMethods[method];
                            if (targetMethod) {
                                const transaction = createTransaction(id, origin, data.callbacks || []);
                                receivedRequests[id] = {};
                                try {
                                    const processedParams = params;
                                    if (Array.isArray(data.callbacks)) {
                                        data.callbacks.forEach(path => {
                                            const pathItems = path.split('/');
                                            let currentParamLevel = processedParams;
                                            for (let j = 0; j < pathItems.length - 1; j++) {
                                                const cp = pathItems[j];
                                                if (typeof currentParamLevel[cp] !== 'object' || currentParamLevel[cp] === null) {
                                                    currentParamLevel[cp] = {};
                                                }
                                                currentParamLevel = currentParamLevel[cp];
                                            }
                                            const finalKey = pathItems[pathItems.length - 1];
                                            currentParamLevel[finalKey] = (callbackData) => transaction.invoke(path, callbackData);
                                        });
                                    }

                                    const response = targetMethod(transaction, processedParams);
                                    if (!transaction.delayReturn() && !transaction.completed()) {
                                        transaction.complete(response);
                                    }
                                } catch (e) {
                                    const errName = e.name || 'runtime_error';
                                    const errMessage = e.stack || e.message || String(e);
                                    syn.$l.eventLog('$network.onMessage', `Request handler error: name: ${errName}, message: ${errMessage}`, 'Error');
                                    transaction.error(errName, errMessage);
                                }
                            }
                        } else if (id !== undefined && callbackName) {
                            const request = sendRequests[id];
                            if (request?.callbacks?.[callbackName]) {
                                request.callbacks[callbackName](params);
                            } else {
                                debug(`유효하지 않는 콜백, id: ${id} (${callbackName})`);
                            }
                        } else if (id !== undefined) {
                            const request = sendRequests[id];
                            if (!request) {
                                debug(`유효하지 않는 응답: ${id}`);
                            } else {
                                clearTimeout(request.timeoutId);
                                if (errorName) {
                                    request.error(errorName, errorMessage);
                                } else {
                                    request.success(result);
                                }
                                delete sendRequests[id];
                                delete transactionMessages[id];
                            }
                        } else if (method) {
                            const targetMethod = registrationMappingMethods[method];
                            if (targetMethod) {
                                targetMethod({ origin }, params);
                            }
                        }
                    };

                    addChannel(options.window, options.origin, options.scope, onMessage);

                    const scopeMethod = (data) => (options.scope ? `${options.scope}::${data}` : data);

                    const postMessage = (message, force = false) => {
                        if (!message) {
                            syn.$l.eventLog('$network.postMessage', 'null 메시지로 postMessage 호출 시도', 'Error');
                            return;
                        }
                        const verb = ready ? 'post ' : 'queue ';
                        debug(`${verb} message (type: ${message.method || message.id || 'response'})`);


                        if (!force && !ready) {
                            pendingQueue.push(message);
                        } else {
                            if (typeof options.postMessageObserver === 'function') {
                                try {
                                    options.postMessageObserver(options.origin, message);
                                } catch (e) {
                                    debug(`postMessageObserver() 확인 필요: ${e.toString()}`);
                                }
                            }
                            try {
                                options.window.postMessage(JSON.stringify(message), options.origin);
                            } catch (error) {
                                debug(`postMessage failed: ${error.message}`);
                                syn.$l.eventLog('$network.postMessage', `postMessage failed: ${error.message}`, 'Error');
                            }
                        }
                    };

                    const onReady = (transaction, type) => {
                        debug('ready message received');
                        if (ready) {
                            syn.$l.eventLog('$network.onReady', '중복 ready 메시지 수신', 'Warning');
                            return;
                        }

                        channelID = type === 'T' ? `${channelID}-R` : `${channelID}-L`;

                        boundMessage.unbind('__ready');
                        ready = true;
                        debug('ready message accepted');

                        if (type === 'T') {
                            boundMessage.emit({ method: '__ready', params: 'A' });
                        }

                        while (pendingQueue.length > 0) {
                            postMessage(pendingQueue.shift());
                        }

                        if (typeof options.onReady === 'function') {
                            try {
                                options.onReady(boundMessage);
                            } catch (e) {
                                debug(`onReady handler failed: ${e.message}`);
                            }
                        }
                    };

                    const boundMessage = {
                        unbind(method) {
                            if (!registrationMappingMethods[method]) return false;
                            delete registrationMappingMethods[method];
                            return true;
                        },
                        bind(method, callback) {
                            if (!method || typeof method !== 'string') {
                                syn.$l.eventLog('$network.bind', 'method 매개변수 확인 필요 (유효하지 않음)', 'Warning');
                                return this;
                            }
                            if (!callback || typeof callback !== 'function') {
                                syn.$l.eventLog('$network.bind', 'callback 매개변수 확인 필요 (유효하지 않음)', 'Warning');
                                return this;
                            }
                            if (registrationMappingMethods[method]) {
                                syn.$l.eventLog('$network.bind', `${method} method 중복 확인 필요`, 'Warning');
                                return this;
                            }
                            registrationMappingMethods[method] = callback;
                            return this;
                        },
                        call(data) {
                            if (!data || !data.method || typeof data.method !== 'string' || !data.success || typeof data.success !== 'function') {
                                syn.$l.eventLog('$network.call', '필수 매개변수 확인 필요 (method, success)', 'Warning');
                                return;
                            }

                            const callbacks = {};
                            const callbackNames = [];
                            const seen = new Set();

                            const pruneFunctions = (path, params) => {
                                if (params !== null && typeof params === 'object') {
                                    if (seen.has(params)) {
                                        debug('순환 참조 감지됨, 함수 제거 건너뛰기: ' + path);
                                        return;
                                    }
                                    seen.add(params);

                                    for (const k in params) {
                                        if (params.hasOwnProperty(k)) {
                                            const value = params[k];
                                            const np = path ? `${path}/${k}` : k;
                                            if (typeof value === 'function') {
                                                callbacks[np] = value;
                                                callbackNames.push(np);
                                                delete params[k];
                                            } else if (value !== null && typeof value === 'object') {
                                                pruneFunctions(np, value);
                                            }
                                        }
                                    }
                                }
                            };

                            const paramsClone = data.params ? JSON.parse(JSON.stringify(data.params)) : {};
                            pruneFunctions('', paramsClone);

                            const message = {
                                id: currentTransactionID,
                                method: scopeMethod(data.method),
                                params: paramsClone
                            };
                            if (callbackNames.length > 0) {
                                message.callbacks = callbackNames;
                            }

                            const errorCallback = data.error || ((errName, errMessage) => debug(`Default error handler: ${errName}- ${errMessage}`)); // Default error handler

                            const requestInfo = {
                                callbacks,
                                error: errorCallback,
                                success: data.success,
                                timeoutId: null
                            };

                            if (data.timeout) {
                                requestInfo.timeoutId = setTransactionTimeout(currentTransactionID, data.timeout, scopeMethod(data.method));
                            }

                            sendRequests[currentTransactionID] = requestInfo;
                            transactionMessages[currentTransactionID] = onMessage;

                            currentTransactionID++;
                            postMessage(message);
                        },
                        emit(data) {
                            if (!data || !data.method || typeof data.method !== 'string') {
                                syn.$l.eventLog('$network.emit', '필수 매개변수 확인 필요 (method)', 'Warning');
                                return;
                            }
                            postMessage({ method: scopeMethod(data.method), params: data.params });
                        },
                        destroy() {
                            removeChannel(options.window, options.origin, options.scope);
                            ready = false;
                            Object.keys(registrationMappingMethods).forEach(key => delete registrationMappingMethods[key]);
                            Object.keys(receivedRequests).forEach(key => delete receivedRequests[key]);
                            Object.keys(sendRequests).forEach(key => {
                                clearTimeout(sendRequests[key].timeoutId);
                                delete sendRequests[key];
                                delete transactionMessages[key];
                            });
                            options.origin = null;
                            pendingQueue.length = 0;
                            channelID = '';
                            debug('채널 삭제됨');

                            const idx = $network.connections.indexOf(boundMessage);
                            if (idx > -1) {
                                $network.connections.splice(idx, 1);
                            }
                        }
                    };

                    boundMessage.bind('__ready', onReady);
                    setTimeout(() => {
                        postMessage({ method: scopeMethod('__ready'), params: 'T' }, true);
                    }, 0);

                    boundMessage.options = options;
                    $network.connections.push(boundMessage);
                    return boundMessage;
                }
            };
            return connectChannel;
        })(),

        findChannel(channelID) {
            if (!channelID) return undefined;
            return $network.connections.find(item => item.options.scope === channelID);
        },

        call(channelID, evt, params) {
            const connection = this.findChannel(channelID);
            if (!connection) {
                syn.$l.eventLog('$network.call', `Channel not found: ${channelID}`, 'Warning');
                return;
            }

            const val = {
                method: evt,
                params: params,
                success: (res) => {
                    if (connection.options.debugOutput) {
                        syn.$l.eventLog('$network.call.success', `"${evt}" call success, channelID: ${connection.options.scope}`, 'Information'); // Avoid logging potentially large 'res'
                    }
                },
                error: (error, message) => {
                    if (connection.options.debugOutput) {
                        syn.$l.eventLog('$network.call.error', `"${evt}" call error: ${error}, message: ${message || ''}, channelID: ${connection.options.scope}`, 'Information');
                    }
                }
            };
            connection.call(val);
        },

        broadCast(evt, params) {
            this.connections.forEach(connection => {
                const val = {
                    method: evt,
                    params: params,
                    success: (res) => {
                        if (connection.options.debugOutput) {
                            syn.$l.eventLog('$network.broadcast.success', `"${evt}" broadcast success, channelID: ${connection.options.scope}`, 'Information');
                        }
                    },
                    error: (error, message) => {
                        if (connection.options.debugOutput) {
                            syn.$l.eventLog('$network.broadcast.error', `"${evt}" broadcast error: ${error}, message: ${message || ''}, channelID: ${connection.options.scope}`, 'Information');
                        }
                    }
                };
                connection.call(val);
            });
        },

        emit(evt, params) {
            if (!this.myChannelID) {
                syn.$l.eventLog('$network.emit', 'Cannot emit: myChannelID is not set.', 'Warning');
                return;
            }
            const connection = this.findChannel(this.myChannelID);
            if (!connection) {
                syn.$l.eventLog('$network.emit', `Emit failed: Own channel not found or ready: ${this.myChannelID}`, 'Warning');
                return;
            }

            const val = {
                method: evt,
                params: params,
            };

            if (connection.options.debugOutput) {
                syn.$l.eventLog('$network.emit', `Emitting "${evt}", channelID: ${connection.options.scope}`, 'Information');
            }

            connection.emit(val);
        }
    });

    $network.myChannelID = syn.$r.query('channelID') || syn.$r.query('ChannelID') || syn.$r.query('CHANNELID') || syn.$r.query('channelid') || '';
    context.$network = syn.$n = $network;
})(globalRoot);
