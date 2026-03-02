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
            const key = $this.method.getText('txtValidateKey') || $this.method.getText('txtManagementKey');
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
                $this.method.setText('txtHeaderName', String(response.data.header));
            }
        },

        async btnGetTargets_click() {
            await $this.method.requestApi({
                method: 'GET',
                path: '/targets',
                includeManagementKey: true
            });
        },

        async btnGetTargetStatus_click() {
            const targetId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetId === null) {
                return;
            }

            await $this.method.requestApi({
                method: 'GET',
                path: '/targets/' + encodeURIComponent(targetId) + '/status',
                includeManagementKey: true
            });
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

            await $this.method.requestApi({
                method: 'GET',
                path: '/settings/' + encodeURIComponent(settingsId) + '/status',
                includeManagementKey: true
            });
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

            await $this.method.requestApi({
                method: 'POST',
                path: '/settings/' + encodeURIComponent(settingsId),
                includeManagementKey: true,
                body: payload
            });
        },

        async btnGetModule_click() {
            const moduleId = $this.method.requireText('txtModuleId', '모듈 ID를 입력하세요.');
            if (moduleId === null) {
                return;
            }

            const query = {};
            const targetId = $this.method.getText('txtModuleTargetId');
            if (targetId !== '') {
                query.id = targetId;
            }

            await $this.method.requestApi({
                method: 'GET',
                path: '/modules/' + encodeURIComponent(moduleId),
                includeManagementKey: true,
                query: query
            });
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
            const targetId = $this.method.getText('txtModuleTargetId');
            if (targetId !== '') {
                query.id = targetId;
            }

            await $this.method.requestApi({
                method: 'POST',
                path: '/modules/' + encodeURIComponent(moduleId),
                includeManagementKey: true,
                query: query,
                body: payload
            });
        },

        async btnGetStats_click() {
            await $this.method.requestApi({
                method: 'GET',
                path: '/stats',
                includeManagementKey: true
            });
        },

        async btnCollect_click() {
            const collectId = $this.method.requireText('txtCollectId', '수집 대상 ID를 입력하세요.');
            if (collectId === null) {
                return;
            }

            await $this.method.requestApi({
                method: 'GET',
                path: '/collect/' + encodeURIComponent(collectId),
                includeManagementKey: true
            });
        }
    },

    method: {
        bindEvents() {
            $this.method.bindButton('btnValidateKey', $this.event.btnValidateKey_click);
            $this.method.bindButton('btnGetTargets', $this.event.btnGetTargets_click);
            $this.method.bindButton('btnGetTargetStatus', $this.event.btnGetTargetStatus_click);
            $this.method.bindButton('btnStartTarget', $this.event.btnStartTarget_click);
            $this.method.bindButton('btnStopTarget', $this.event.btnStopTarget_click);
            $this.method.bindButton('btnRestartTarget', $this.event.btnRestartTarget_click);
            $this.method.bindButton('btnGetSettingsStatus', $this.event.btnGetSettingsStatus_click);
            $this.method.bindButton('btnSaveSettings', $this.event.btnSaveSettings_click);
            $this.method.bindButton('btnGetModule', $this.event.btnGetModule_click);
            $this.method.bindButton('btnSaveModule', $this.event.btnSaveModule_click);
            $this.method.bindButton('btnGetStats', $this.event.btnGetStats_click);
            $this.method.bindButton('btnCollect', $this.event.btnCollect_click);
        },

        bindButton(buttonId, callback) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', callback);
            }
        },

        initializeBaseUrl() {
            const baseUrl = window.location.origin || '';
            if ($this.method.getText('txtBaseUrl') === '') {
                $this.method.setText('txtBaseUrl', baseUrl);
            }
        },

        async callTargetAction(actionName) {
            const targetId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetId === null) {
                return;
            }

            await $this.method.requestApi({
                method: 'POST',
                path: '/targets/' + encodeURIComponent(targetId) + '/' + actionName,
                includeManagementKey: true
            });
        },

        tryParseJson(elementId) {
            const text = $this.method.getRawText(elementId).trim();
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
            const value = $this.method.getText(elementId);
            if (value === '') {
                $this.method.renderError(errorMessage);
                return null;
            }

            return value;
        },

        getRawText(elementId) {
            const element = document.getElementById(elementId);
            if (!element) {
                return '';
            }

            return String(element.value || '');
        },

        getText(elementId) {
            return $this.method.getRawText(elementId).trim();
        },

        setText(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.value = value;
            }
        },

        buildUrl(path, query) {
            const baseUrl = $this.method.getText('txtBaseUrl') || window.location.origin || '';
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
                const headerName = $this.method.getText('txtHeaderName') || 'X-Management-Key';
                const managementKey = $this.method.getText('txtManagementKey');
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
                const data = $this.method.parseResponse(text);
                $this.method.renderResponse(response.status, response.statusText, data);

                return {
                    ok: response.ok,
                    status: response.status,
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
            const requestLabel = document.getElementById('lblRequest');
            const statusLabel = document.getElementById('lblStatus');
            if (requestLabel) {
                requestLabel.textContent = requestLine;
            }

            if (statusLabel) {
                statusLabel.textContent = '요청 중...';
            }
        },

        renderResponse(statusCode, statusText, data) {
            const statusLabel = document.getElementById('lblStatus');
            const responseElement = document.getElementById('txtResponse');

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
            const statusLabel = document.getElementById('lblStatus');
            const responseElement = document.getElementById('txtResponse');

            if (statusLabel) {
                statusLabel.textContent = '오류';
            }

            if (responseElement) {
                responseElement.textContent = message;
            }
        }
    }
};
