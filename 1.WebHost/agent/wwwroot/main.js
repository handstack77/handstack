'use strict';

let $main = {
    hook: {
        pageLoad() {
            $this.method.initializeBaseUrl();
            $this.method.populateTargetSelectors([]);
            $this.method.populateModuleSelectors([]);
            $this.method.loadProfile();
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
                $this.method.populateTargetSelectors($this.method.extractTargetOptions(response.data));
            }
        },

        async btnGetTargetStatus_click() {
            const targetAckId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/targets/' + encodeURIComponent(targetAckId) + '/status',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
                $this.method.syncTargetSelectors(targetAckId);
                await $this.method.loadModulesForTarget(targetAckId);
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

        async btnGetDiagnostics_click() {
            const settingsId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (settingsId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/settings/' + encodeURIComponent(settingsId) + '/diagnostics',
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnGetAppSettings_click() {
            const settingsId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (settingsId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/settings/' + encodeURIComponent(settingsId),
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnSaveAppSettings_click() {
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
            const targetAckId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

            const moduleId = $this.method.requireText('txtModuleId', '모듈 ID를 입력하세요.');
            if (moduleId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/modules/' + encodeURIComponent(targetAckId) + '/' + encodeURIComponent(moduleId),
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data);
            }
        },

        async btnSaveModule_click() {
            const targetAckId = $this.method.requireText('txtSettingsId', '설정 대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

            const moduleId = $this.method.requireText('txtModuleId', '모듈 ID를 입력하세요.');
            if (moduleId === null) {
                return;
            }

            const payload = $this.method.tryParseJson('txtModulePayload');
            if (payload === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'POST',
                path: '/modules/' + encodeURIComponent(targetAckId) + '/' + encodeURIComponent(moduleId),
                includeManagementKey: true,
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

        async btnGetLogs_click() {
            const targetAckId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

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
                path: '/logs/' + encodeURIComponent(targetAckId),
                includeManagementKey: true,
                query: query
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, response.data.lines.join('\n'));
            }
        },

        async btnGetLogTree_click() {
            const targetAckId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/logtree/' + encodeURIComponent(targetAckId),
                includeManagementKey: true
            });

            if (response && response.ok) {
                $this.method.renderResponse(response.status, response.statusText, JSON.stringify(response.data.tree, null, 2));
            }
        },

        async btnLogout_click() {
            $this.method.setMessage('', false);

            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    location.replace('/login.html');
                    return;
                }

                $this.method.setMessage('로그아웃 처리에 실패했습니다.', true);
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        }
    },

    method: {
        bindEvents() {
            syn.$l.addEvent('btnLogout', 'click', $this.event.btnLogout_click);
            syn.$l.addEvent('btnValidateKey', 'click', $this.event.btnValidateKey_click);
            syn.$l.addEvent('btnGetTargets', 'click', $this.event.btnGetTargets_click);
            syn.$l.addEvent('btnGetTargetStatus', 'click', $this.event.btnGetTargetStatus_click);
            syn.$l.addEvent('btnStartTarget', 'click', $this.event.btnStartTarget_click);
            syn.$l.addEvent('btnStopTarget', 'click', $this.event.btnStopTarget_click);
            syn.$l.addEvent('btnRestartTarget', 'click', $this.event.btnRestartTarget_click);
            syn.$l.addEvent('btnGetDiagnostics', 'click', $this.event.btnGetDiagnostics_click);
            syn.$l.addEvent('btnGetAppSettings', 'click', $this.event.btnGetAppSettings_click);
            syn.$l.addEvent('btnSaveAppSettings', 'click', $this.event.btnSaveAppSettings_click);
            syn.$l.addEvent('btnGetModule', 'click', $this.event.btnGetModule_click);
            syn.$l.addEvent('btnSaveModule', 'click', $this.event.btnSaveModule_click);
            syn.$l.addEvent('btnGetStats', 'click', $this.event.btnGetStats_click);
            syn.$l.addEvent('btnGetLogs', 'click', $this.event.btnGetLogs_click);
            syn.$l.addEvent('btnGetLogTree', 'click', $this.event.btnGetLogTree_click);
        },

        initializeBaseUrl() {
            const baseUrl = window.location.origin || '';
            if (syn.$l.get('txtBaseUrl').value === '') {
                $this.method.setText('txtBaseUrl', baseUrl);
            }
        },

        extractTargetOptions(data) {
            if (Array.isArray(data) === false) {
                return [];
            }

            return data
                .map(function (item) {
                    const value = String(item?.id ?? item?.Id ?? '').trim();
                    if (value === '') {
                        return null;
                    }

                    const name = String(item?.name ?? item?.Name ?? '').trim();
                    return {
                        value: value,
                        text: name !== '' && name !== value ? name + ' [' + value + ']' : value
                    };
                })
                .filter(function (item) {
                    return item !== null;
                });
        },

        populateTargetSelectors(options) {
            const targetAckId = $this.method.getValue('txtTargetId');
            const settingsId = $this.method.getValue('txtSettingsId');
            const defaultTargetId = targetAckId || settingsId || (options[0] ? options[0].value : '');

            $this.method.setSelectOptions('txtTargetId', options, '대상 목록 조회 후 선택', targetAckId, defaultTargetId);
            $this.method.setSelectOptions('txtSettingsId', options, '대상 목록 조회 후 선택', settingsId, defaultTargetId);
        },

        syncTargetSelectors(targetAckId) {
            if (targetAckId === '') {
                return;
            }

            $this.method.setText('txtTargetId', targetAckId);
            $this.method.setText('txtSettingsId', targetAckId);
        },

        async loadModulesForTarget(targetAckId) {
            if (targetAckId === '') {
                $this.method.populateModuleSelectors([]);
                return;
            }

            const response = await $this.method.requestApi({
                method: 'GET',
                path: '/settings/' + encodeURIComponent(targetAckId),
                includeManagementKey: true,
                renderRequest: false,
                renderError: false
            });

            if (response && response.ok) {
                $this.method.populateModuleSelectors($this.method.extractModuleOptions(response.data));
                return;
            }

            $this.method.populateModuleSelectors([]);
        },

        extractModuleOptions(data) {
            const runtimeMessage = $this.method.normalizeObject(data?.runtimeMessage ?? data?.RuntimeMessage);
            const modules = runtimeMessage.AppSettings.LoadModules;
            if (Array.isArray(modules) === false) {
                return [];
            }

            return modules.map(value => ({
                value: value,
                text: value
            }));
        },

        populateModuleSelectors(options) {
            const moduleId = $this.method.getValue('txtModuleId');
            const defaultModuleId = options[0] ? options[0].value : '';
            $this.method.setSelectOptions('txtModuleId', options, '대상 상태 조회 후 선택', moduleId, defaultModuleId);
        },

        normalizeObject(value) {
            if (value === null || value === undefined) {
                return null;
            }

            if (typeof value === 'string') {
                const text = value.trim();
                if (text === '') {
                    return null;
                }

                try {
                    return JSON.parse(text);
                }
                catch (error) {
                    return null;
                }
            }

            return value;
        },

        async loadProfile() {
            try {
                const response = await fetch('/auth/me', { credentials: 'include' });
                if (response.status === 401) {
                    location.replace('/login.html');
                    return;
                }

                if (response.ok === false) {
                    $this.method.setMessage('사용자 정보를 조회할 수 없습니다.', true);
                    return;
                }

                const payload = await response.json();
                const user = payload?.user || {};

                $this.method.setText('txtEmailID', $this.method.getUserField(user, 'EmailID'));
                $this.method.setText('txtUserName', $this.method.getUserField(user, 'UserName'));
                $this.method.setText('txtRoles', $this.method.getUserField(user, 'Roles'));
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        },

        getUserField(user, fieldName) {
            const camelCaseFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
            const value = user?.[fieldName] ?? user?.[camelCaseFieldName];

            if (Array.isArray(value) === true) {
                return value.length > 0 ? value.join(', ') : '-';
            }

            if (value === null || value === undefined || value === '') {
                return '-';
            }

            return value;
        },

        setMessage(message, isError) {
            const messageElement = document.getElementById('lblMessage');
            messageElement.textContent = message || '';

            if (message) {
                messageElement.classList.remove('d-none');
                messageElement.classList.toggle('alert-danger', isError === true);
                messageElement.classList.toggle('alert-success', isError !== true);
            }
            else {
                messageElement.classList.add('d-none');
                messageElement.classList.remove('alert-success');
                messageElement.classList.add('alert-danger');
            }
        },

        async callTargetAction(actionName) {
            const targetAckId = $this.method.requireText('txtTargetId', '대상 ID를 입력하세요.');
            if (targetAckId === null) {
                return;
            }

            const response = await $this.method.requestApi({
                method: 'POST',
                path: '/targets/' + encodeURIComponent(targetAckId) + '/' + actionName,
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
                if (element.value === undefined) {
                    element.innerText = value;
                }
                else {
                    element.value = value;
                }
            }
        },

        getValue(elementId) {
            const element = syn.$l.get(elementId);
            return element ? String(element.value || '').trim() : '';
        },

        setSelectOptions(elementId, items, placeholderText, selectedValue, defaultValue) {
            const element = syn.$l.get(elementId);
            if (!element) {
                return;
            }

            const options = [];
            const values = new Set();
            (items || []).forEach(function (item) {
                const value = String(item?.value ?? '').trim();
                if (value === '' || values.has(value) === true) {
                    return;
                }

                values.add(value);
                options.push({
                    value: value,
                    text: String(item?.text ?? value)
                });
            });

            element.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholderText;
            element.appendChild(placeholderOption);

            options.forEach(function (item) {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.text;
                element.appendChild(option);
            });

            const preferredValue = String(selectedValue ?? '').trim();
            const fallbackValue = String(defaultValue ?? '').trim();
            if (preferredValue !== '' && values.has(preferredValue) === true) {
                element.value = preferredValue;
            }
            else if (fallbackValue !== '' && values.has(fallbackValue) === true) {
                element.value = fallbackValue;
            }
            else {
                element.value = '';
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
            if (options.renderRequest !== false) {
                $this.method.renderRequest(requestLine);
            }

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
                if (options.renderError !== false) {
                    $this.method.renderError(error.message || String(error));
                }

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
