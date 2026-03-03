'use strict';

let $AGM000 = {
    hook: {
        pageLoad() {
            $this.method.initializeBaseUrl();
            $this.method.bindEvents();
        }
    },

    event: {
        async btnValidateKey_click() {
            const key = syn.$l.get('txtManagementKey').value;
            if (key === '') {
                $this.method.renderError('/validate/{key} 호출에 사용할 키를 입력하세요.');
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/validate/' + encodeURIComponent(key),
                includeManagementKey: false
            });

            if (response && response.ok && response.data && response.data.header) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
                $this.method.setText('txtHeaderName', String(response.data.header));
            }
        },

        async btnGetTargets_click() {
            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/targets',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnGetTargetStatus_click() {
            const targetId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/targets/' + encodeURIComponent(targetId) + '/status',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnStartTarget_click() {
            await $this.method.callTargetAction('start');
        },

        async btnStopTarget_click() {
            await $this.method.callTargetAction('stop');
        },

        async btnRestartTarget_click() {
            await $this.method.callTargetAction('restart');
        },

        async btnGetSettingsStatus_click() {
            const settingsId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (settingsId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/settings/' + encodeURIComponent(settingsId) + '/status',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnSaveSettings_click() {
            const settingsId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (settingsId === null) {
                return;
            }

            const payload = $this.method.tryParseJson('txtSettingsPayload');
            if (payload === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'POST',
                path: '/settings/' + encodeURIComponent(settingsId),
                includeManagementKey: true,
                body: payload
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnGetModule_click() {
            const moduleId = $this.method.requireText('txtModuleId', '모듈 ID를 입력하세요.');
            if (moduleId === null) {
                return;
            }

            const query = {};
            const targetId = syn.$l.get('txtModuleTargetId').value;
            if (targetId !== '') {
                query.id = targetId;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/modules/' + encodeURIComponent(moduleId),
                includeManagementKey: true,
                query: query
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnSaveModule_click() {
            const moduleId = $this.method.requireText('txtModuleId', '모듈 ID를 입력하세요.');
            if (moduleId === null) {
                return;
            }

            const payload = $this.method.tryParseJson('txtModulePayload');
            if (payload === null) {
                return;
            }

            const query = {};
            const targetId = syn.$l.get('txtModuleTargetId').value;
            if (targetId !== '') {
                query.id = targetId;
            }

            const response = await $this.method.requestApi({
                method: 'POST',
                path: '/modules/' + encodeURIComponent(moduleId),
                includeManagementKey: true,
                query: query,
                body: payload
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnGetStats_click() {
            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/stats',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnCollect_click() {
            const collectId = $this.method.requireText('txtCollectId', '수집 대상 ID를 입력하세요.');
            if (collectId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/collect/' + encodeURIComponent(collectId),
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnGetLogs_click() {
            const query = {};
            const file = syn.$l.get('txtLogFile').value.trim();
            if (file !== '') {
                query.file = file;
            }

            const rowsText = syn.$l.get('txtLogRows').value.trim();
            if (rowsText !== '') {
                const rows = Number(rowsText);
                if (Number.isInteger(rows) === false) {
                    $this.method.renderError('로그 행 수(rows)는 정수여야 합니다.');
                    return;
                }

                query.rows = rows;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/logs',
                includeManagementKey: true,
                query: query
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data.lines.join('\n'));
            }
        },

        async btnGetLogTree_click() {
            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/logtree',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, JSON.stringify(response.data.tree, null, 2));
            }
        }
    },

    method: {
        bindEvents() {
            syn.$l.addEvent('btnValidateKey', 'click', $this.event.btnValidateKey_click);
            syn.$l.addEvent('btnGetTargets', 'click', $this.event.btnGetTargets_click);
            syn.$l.addEvent('btnGetTargetStatus', 'click', $this.event.btnGetTargetStatus_click);
            syn.$l.addEvent('btnStartTarget', 'click', $this.event.btnStartTarget_click);
            syn.$l.addEvent('btnStopTarget', 'click', $this.event.btnStopTarget_click);
            syn.$l.addEvent('btnRestartTarget', 'click', $this.event.btnRestartTarget_click);
            syn.$l.addEvent('btnGetSettingsStatus', 'click', $this.event.btnGetSettingsStatus_click);
            syn.$l.addEvent('btnSaveSettings', 'click', $this.event.btnSaveSettings_click);
            syn.$l.addEvent('btnGetModule', 'click', $this.event.btnGetModule_click);
            syn.$l.addEvent('btnSaveModule', 'click', $this.event.btnSaveModule_click);
            syn.$l.addEvent('btnGetStats', 'click', $this.event.btnGetStats_click);
            syn.$l.addEvent('btnCollect', 'click', $this.event.btnCollect_click);
            syn.$l.addEvent('btnGetLogs', 'click', $this.event.btnGetLogs_click);
            syn.$l.addEvent('btnGetLogTree', 'click', $this.event.btnGetLogTree_click);
        },

        initializeBaseUrl() {
            const baseUrl = window.location.origin || '';
            if (syn.$l.get('txtBaseUrl').value === '') {
                $this.method.setText('txtBaseUrl', baseUrl);
            }
        },

        async callTargetAction(actionName) {
            const targetId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'POST',
                path: '/targets/' + encodeURIComponent(targetId) + '/' + actionName,
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        tryParseJson(elementId) {
            const text = syn.$l.get(elementId).value;
            if (text === '') {
                return {};
            }

            try {
                return JSON.parse(text);
            }
            catch (error) {
                $this.method.renderError(elementId + ' 항목의 JSON 형식이 올바르지 않습니다: ' + error.message);
                return null;
            }
        },

        requireText(elementId, errorMessage) {
            const value = syn.$l.get(elementId).value;
            if (value === '') {
                $this.method.renderError(errorMessage);
                return null;
            }

            return value;
        },

        setText(elementId, value) {
            const element = syn.$l.get(elementId);
            if (element) {
                element.value = value;
            }
        },

        buildUrl(path, query) {
            const baseUrl = syn.$l.get('txtBaseUrl').value || window.location.origin || '';
            const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
            const normalizedPath = path.startsWith('/') ? path : '/' + path;
            const url = new URL(normalizedBaseUrl + normalizedPath);

            if (query) {
                Object.keys(query).forEach(function (key) {
                    const value = query[key];
                    if (value !== null && value !== undefined && String(value).trim() !== '') {
                        url.searchParams.set(key, String(value));
                    }
                });
            }

            return url;
        },

        buildHeaders(includeManagementKey, hasBody) {
            const headers = {};
            if (hasBody === true) {
                headers['Content-Type'] = 'application/json';
            }

            if (includeManagementKey === true) {
                const headerName = syn.$l.get('txtHeaderName').value || 'X-Management-Key';
                const managementKey = syn.$l.get('txtManagementKey').value;
                if (managementKey !== '') {
                    headers[headerName] = managementKey;
                }
            }

            return headers;
        },

        async requestApi(options) {
            const requestUrl = $this.method.buildUrl(options.path, options.query);
            const requestInit = {
                method: options.method,
                headers: $this.method.buildHeaders(options.includeManagementKey === true, options.body !== undefined)
            };

            if (options.body !== undefined) {
                requestInit.body = JSON.stringify(options.body);
            }

            const requestLine = options.method + ' ' + requestUrl.toString();
            $this.method.renderRequest(requestLine);

            try {
                const response = await fetch(requestUrl, requestInit);
                const text = await response.text();
                const data = options.rawResponse === true ? text : $this.method.parseResponse(text);

                return {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                };
            }
            catch (error) {
                $this.method.renderError(error.message || String(error));
                return null;
            }
        },

        parseResponse(text) {
            const trimmed = String(text || '').trim();
            if (trimmed === '') {
                return {};
            }

            try {
                return JSON.parse(trimmed);
            }
            catch (error) {
                return trimmed;
            }
        },

        renderRequest(requestLine) {
            const requestLabel = syn.$l.get('lblRequest');
            const statusLabel = syn.$l.get('lblStatus');
            if (requestLabel) {
                requestLabel.textContent = requestLine;
            }

            if (statusLabel) {
                statusLabel.textContent = '요청 중...';
            }
        },

        renderResponse(statusCode, statusText, data) {
            const statusLabel = syn.$l.get('lblStatus');
            const responseElement = syn.$l.get('txtResponse');

            if (statusLabel) {
                statusLabel.textContent = statusCode + ' ' + statusText;
            }

            if (responseElement) {
                if (typeof data === 'string') {
                    responseElement.textContent = data;
                }
                else {
                    responseElement.textContent = JSON.stringify(data, null, 2);
                }
            }
        },

        renderError(message) {
            const statusLabel = syn.$l.get('lblStatus');
            const responseElement = syn.$l.get('txtResponse');

            if (statusLabel) {
                statusLabel.textContent = '오류';
            }

            if (responseElement) {
                responseElement.textContent = message;
            }
        }
    }
};
