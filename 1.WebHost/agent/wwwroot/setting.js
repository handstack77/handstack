'use strict';

(function () {
    const realtimeAppKeys = [
        'BusinessServerUrl',
        'FindGlobalIDServer',
        'HostAccessID',
        'IsTenantFunction',
        'IsExceptionDetailText',
        'ContractRequestPath',
        'TenantAppRequestPath',
        'CookiePrefixName',
        'UserSignExpire',
        'StaticFileCacheMaxAge',
        'WithOnlyIPs',
        'IsPermissionRoles',
        'PermissionRoles'
    ];

    const state = {
        targets: [],
        appRoot: null,
        moduleRoot: null,
        currentModuleId: ''
    };

    const el = id => document.getElementById(id);

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        restoreAuth();
        setSelectOptions(el('targetSelect'), [], '대상 조회 후 선택');
        setSelectOptions(el('moduleSelect'), [], '대상 선택 후 조회');
    });

    function bindEvents() {
        el('loadTargets').addEventListener('click', loadTargets);
        el('targetSelect').addEventListener('change', onTargetChanged);
        el('loadAppSettings').addEventListener('click', loadAppSettings);
        el('loadDiagnostics').addEventListener('click', loadDiagnostics);
        el('loadModule').addEventListener('click', loadModule);
        el('saveAppSettings').addEventListener('click', saveAppSettings);
        el('saveModule').addEventListener('click', saveModule);
        el('resetAppForm').addEventListener('click', renderAppForm);
        el('resetModuleForm').addEventListener('click', renderModuleForm);
        el('jsonSource').addEventListener('change', syncJsonEditor);
        el('formatJson').addEventListener('click', formatJsonEditor);
        el('applyJsonToForm').addEventListener('click', applyJsonToForm);

        document.querySelectorAll('.tab').forEach(button => {
            button.addEventListener('click', () => selectTab(button.dataset.tab));
        });

        el('headerName').addEventListener('change', persistAuth);
        el('managementKey').addEventListener('change', persistAuth);
    }

    function restoreAuth() {
        el('headerName').value = localStorage.getItem('handstack.setting.headerName') || 'X-Management-Key';
        el('managementKey').value = localStorage.getItem('handstack.setting.managementKey') || '';
    }

    function persistAuth() {
        localStorage.setItem('handstack.setting.headerName', el('headerName').value.trim() || 'X-Management-Key');
        localStorage.setItem('handstack.setting.managementKey', el('managementKey').value);
    }

    async function loadTargets() {
        persistAuth();
        const response = await requestApi('GET', '/targets');
        if (!response) {
            return;
        }

        state.targets = Array.isArray(response.data) ? response.data : [];
        const options = state.targets.map(target => {
            const value = String(target.TargetAckId || target.targetAckId || target.Id || target.id || '').trim();
            const name = String(target.Name || target.name || '').trim();
            return {
                value,
                text: name && name !== value ? `${name} [${value}]` : value
            };
        }).filter(item => item.value);

        setSelectOptions(el('targetSelect'), options, '대상 없음');
        setStatus('대상 목록을 불러왔습니다.', 'success');
        await onTargetChanged();
    }

    async function onTargetChanged() {
        state.appRoot = null;
        state.moduleRoot = null;
        state.currentModuleId = '';
        el('appForm').innerHTML = '';
        el('moduleForm').innerHTML = '';
        el('jsonEditor').value = '';
        setSelectOptions(el('moduleSelect'), [], 'appsettings 로드 후 선택');

        if (getTargetId()) {
            await loadAppSettings();
        }
    }

    async function loadAppSettings() {
        const targetId = requireTarget();
        if (!targetId) {
            return;
        }

        const response = await requestApi('GET', `/settings/${encodeURIComponent(targetId)}`);
        if (!response) {
            return;
        }

        const root = normalizeObject(response.data.RuntimeMessage ?? response.data.runtimeMessage);
        if (!root || typeof root !== 'object') {
            setStatus('appsettings.json 응답을 해석하지 못했습니다.', 'error');
            return;
        }

        state.appRoot = root;
        populateModules(root);
        renderAppForm();
        syncJsonEditor();
        setStatus('appsettings.json을 불러왔습니다.', 'success');
    }

    async function loadDiagnostics() {
        const targetId = requireTarget();
        if (!targetId) {
            return;
        }

        const response = await requestApi('GET', `/settings/${encodeURIComponent(targetId)}/diagnostics`);
        if (response) {
            renderResult(response.data);
            selectTab('result');
            setStatus('런타임 상태를 조회했습니다.', 'success');
        }
    }

    async function loadModule() {
        const targetId = requireTarget();
        const moduleId = requireModule();
        if (!targetId || !moduleId) {
            return;
        }

        const response = await requestApi('GET', `/modules/${encodeURIComponent(targetId)}/${encodeURIComponent(moduleId)}`);
        if (!response) {
            return;
        }

        const root = normalizeObject(response.data.Module ?? response.data.module);
        if (!root || typeof root !== 'object') {
            setStatus('module.json 응답을 해석하지 못했습니다.', 'error');
            return;
        }

        state.moduleRoot = root;
        state.currentModuleId = moduleId;
        renderModuleForm();
        syncJsonEditor();
        setStatus(`${moduleId} module.json을 불러왔습니다.`, 'success');
    }

    async function saveAppSettings() {
        const targetId = requireTarget();
        if (!targetId || !state.appRoot) {
            return;
        }

        const updated = clone(state.appRoot);
        updated.AppSettings = updated.AppSettings || {};

        try {
            readFormIntoObject('appForm', updated.AppSettings);
        }
        catch (error) {
            setStatus(error.message, 'error');
            return;
        }

        const response = await requestApi('POST', `/settings/${encodeURIComponent(targetId)}`, updated);
        if (!response) {
            return;
        }

        state.appRoot = updated;
        renderResult(response.data);
        syncJsonEditor();
        selectTab('result');
        setStatus('appsettings.json을 저장했습니다.', response.ok ? 'success' : 'error');
    }

    async function saveModule() {
        const targetId = requireTarget();
        const moduleId = requireModule();
        if (!targetId || !moduleId || !state.moduleRoot) {
            return;
        }

        const updated = clone(state.moduleRoot);
        updated.ModuleConfig = updated.ModuleConfig || {};

        try {
            readFormIntoObject('moduleForm', updated.ModuleConfig);
        }
        catch (error) {
            setStatus(error.message, 'error');
            return;
        }

        const response = await requestApi('POST', `/modules/${encodeURIComponent(targetId)}/${encodeURIComponent(moduleId)}`, updated);
        if (!response) {
            return;
        }

        state.moduleRoot = updated;
        renderResult(response.data);
        syncJsonEditor();
        selectTab('result');
        setStatus('module.json을 저장했습니다. ack watcher가 런타임 반영을 처리합니다.', response.ok ? 'success' : 'error');
    }

    function populateModules(root) {
        const modules = root?.AppSettings?.LoadModules;
        const options = Array.isArray(modules)
            ? modules.map(value => ({ value: String(value), text: String(value) }))
            : [];
        setSelectOptions(el('moduleSelect'), options, '모듈 없음');
    }

    function renderAppForm() {
        const container = el('appForm');
        container.innerHTML = '';
        if (!state.appRoot?.AppSettings) {
            container.innerHTML = '<p class="muted">appsettings.json을 먼저 불러오세요.</p>';
            return;
        }

        realtimeAppKeys.forEach(key => {
            const value = state.appRoot.AppSettings[key];
            container.appendChild(createConfigRow(key, value, `AppSettings:${key}`));
        });
    }

    function renderModuleForm() {
        const container = el('moduleForm');
        container.innerHTML = '';
        if (!state.moduleRoot?.ModuleConfig) {
            container.innerHTML = '<p class="muted">module.json을 먼저 불러오세요.</p>';
            return;
        }

        Object.keys(state.moduleRoot.ModuleConfig).sort().forEach(key => {
            const value = state.moduleRoot.ModuleConfig[key];
            container.appendChild(createConfigRow(key, value, `ModuleConfig:${key}`));
        });
    }

    function createConfigRow(key, value, path) {
        const row = document.createElement('div');
        const isComplex = Array.isArray(value) || (value !== null && typeof value === 'object');
        row.className = `config-row${isComplex ? ' full' : ''}`;

        const header = document.createElement('div');
        header.className = 'config-key';
        header.innerHTML = `<span>${escapeHtml(path)}</span><span class="badge">${getValueType(value)}</span>`;
        row.appendChild(header);

        const field = createInputForValue(value);
        field.dataset.key = key;
        field.dataset.kind = getValueType(value);
        row.appendChild(field);
        return row;
    }

    function createInputForValue(value) {
        if (typeof value === 'boolean') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            input.style.width = 'auto';
            return input;
        }

        if (typeof value === 'number') {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = String(value);
            return input;
        }

        if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
            const textarea = document.createElement('textarea');
            textarea.value = JSON.stringify(value, null, 2);
            return textarea;
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value === null || value === undefined ? '' : String(value);
        return input;
    }

    function readFormIntoObject(containerId, target) {
        document.querySelectorAll(`#${containerId} [data-key]`).forEach(field => {
            const key = field.dataset.key;
            const kind = field.dataset.kind;
            if (kind === 'boolean') {
                target[key] = field.checked;
            }
            else if (kind === 'number') {
                const numberValue = Number(field.value);
                if (Number.isFinite(numberValue) === false) {
                    throw new Error(`${key} 값은 숫자여야 합니다.`);
                }
                target[key] = numberValue;
            }
            else if (kind === 'array' || kind === 'object') {
                try {
                    target[key] = JSON.parse(field.value || (kind === 'array' ? '[]' : '{}'));
                }
                catch {
                    throw new Error(`${key} 값은 올바른 JSON이어야 합니다.`);
                }
            }
            else {
                target[key] = field.value;
            }
        });
    }

    function syncJsonEditor() {
        const source = el('jsonSource').value;
        const root = source === 'module' ? state.moduleRoot : state.appRoot;
        el('jsonEditor').value = root ? JSON.stringify(root, null, 2) : '';
    }

    function formatJsonEditor() {
        try {
            const parsed = JSON.parse(el('jsonEditor').value || '{}');
            el('jsonEditor').value = JSON.stringify(parsed, null, 2);
            setStatus('JSON을 정렬했습니다.', 'success');
        }
        catch {
            setStatus('JSON 형식이 올바르지 않습니다.', 'error');
        }
    }

    function applyJsonToForm() {
        try {
            const parsed = JSON.parse(el('jsonEditor').value || '{}');
            if (el('jsonSource').value === 'module') {
                state.moduleRoot = parsed;
                renderModuleForm();
            }
            else {
                state.appRoot = parsed;
                populateModules(parsed);
                renderAppForm();
            }
            setStatus('JSON 내용을 폼에 반영했습니다.', 'success');
        }
        catch {
            setStatus('JSON 형식이 올바르지 않습니다.', 'error');
        }
    }

    async function requestApi(method, path, body) {
        persistAuth();
        const headers = {};
        const headerName = el('headerName').value.trim() || 'X-Management-Key';
        const managementKey = el('managementKey').value;
        if (managementKey) {
            headers[headerName] = managementKey;
        }
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(path, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body)
            });
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
            if (!response.ok) {
                setStatus(data.Message || data.message || `HTTP ${response.status}`, 'error');
            }
            return { ok: response.ok, status: response.status, data };
        }
        catch (error) {
            setStatus(error.message || String(error), 'error');
            return null;
        }
    }

    function renderResult(data) {
        const body = el('resultBody');
        const rows = [];
        const add = (name, value) => {
            rows.push(`<tr><th>${escapeHtml(name)}</th><td>${formatValue(value)}</td></tr>`);
        };

        add('성공', data.Success ?? data.success ?? '');
        add('메시지', data.Message ?? data.message ?? '');
        add('저장됨', data.Saved ?? data.saved ?? '');
        add('런타임 적용', data.RuntimeApplied ?? data.runtimeApplied ?? '');
        add('변경 항목', data.ChangedKeys ?? data.changedKeys ?? data.ChangedPaths ?? data.changedPaths ?? []);
        add('삭제 항목', data.RemovedKeys ?? data.removedKeys ?? data.RemovedPaths ?? data.removedPaths ?? []);
        add('재시작 필요', data.RestartRequiredKeys ?? data.restartRequiredKeys ?? data.RestartRequiredPaths ?? data.restartRequiredPaths ?? []);
        add('오류', data.Errors ?? data.errors ?? []);
        body.innerHTML = rows.join('');
    }

    function formatValue(value) {
        if (Array.isArray(value)) {
            return value.length ? `<pre>${escapeHtml(value.join('\n'))}</pre>` : '<span class="muted">없음</span>';
        }
        if (value && typeof value === 'object') {
            return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }
        return escapeHtml(String(value ?? ''));
    }

    function selectTab(name) {
        document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item.dataset.tab === name));
        document.querySelectorAll('.tab-view').forEach(item => item.classList.toggle('active', item.id === `tab-${name}`));
        if (name === 'json') {
            syncJsonEditor();
        }
    }

    function setStatus(message, type) {
        const status = el('status');
        status.className = `status ${type || ''}`.trim();
        status.textContent = message;
    }

    function setSelectOptions(select, options, emptyText) {
        select.innerHTML = '';
        if (!options.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = emptyText;
            select.appendChild(option);
            return;
        }
        options.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.text;
            select.appendChild(option);
        });
    }

    function getTargetId() {
        return el('targetSelect').value.trim();
    }

    function requireTarget() {
        const targetId = getTargetId();
        if (!targetId) {
            setStatus('ack 대상을 선택하세요.', 'warn');
            return '';
        }
        return targetId;
    }

    function requireModule() {
        const moduleId = el('moduleSelect').value.trim();
        if (!moduleId) {
            setStatus('모듈을 선택하세요.', 'warn');
            return '';
        }
        return moduleId;
    }

    function normalizeObject(value) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return null;
            }
        }
        return value;
    }

    function getValueType(value) {
        if (Array.isArray(value)) {
            return 'array';
        }
        if (value === null) {
            return 'string';
        }
        return typeof value;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
