(function () {
    "use strict";

    const pollIntervalMs = 3000;
    const endpoint = "/api/configuration/sync-secrets";

    const dom = {
        alert: document.getElementById("globalAlert"),
        connectionBadge: document.getElementById("connectionBadge"),
        btnReload: document.getElementById("btnReload"),
        btnSave: document.getElementById("btnSave"),
        chkAutoReload: document.getElementById("chkAutoReload"),
        sourceFileBadge: document.getElementById("sourceFileBadge"),
        dirtyBadge: document.getElementById("dirtyBadge"),
        lastWriteText: document.getElementById("lastWriteText"),
        statusText: document.getElementById("statusText"),
        txtUserName: document.getElementById("txtUserName"),
        txtUserEmail: document.getElementById("txtUserEmail"),
        txtFileSyncServer: document.getElementById("txtFileSyncServer"),
        txtFileSyncAccessToken: document.getElementById("txtFileSyncAccessToken"),
        txtGitHubPersonalAccessToken: document.getElementById("txtGitHubPersonalAccessToken"),
        txtGitHubRepositoryOwner: document.getElementById("txtGitHubRepositoryOwner"),
        txtGitHubRepositoryName: document.getElementById("txtGitHubRepositoryName"),
        txtGitHubRepositoryBranch: document.getElementById("txtGitHubRepositoryBranch"),
        txtGitHubRepositoryBasePath: document.getElementById("txtGitHubRepositoryBasePath")
    };

    const state = {
        config: null,
        lastWriteTimeUtc: null,
        isDirty: false,
        isSaving: false
    };

    let pollTimer = 0;

    const inputElements = [
        dom.txtUserName,
        dom.txtUserEmail,
        dom.txtFileSyncServer,
        dom.txtFileSyncAccessToken,
        dom.txtGitHubPersonalAccessToken,
        dom.txtGitHubRepositoryOwner,
        dom.txtGitHubRepositoryName,
        dom.txtGitHubRepositoryBranch,
        dom.txtGitHubRepositoryBasePath
    ];

    function setConnection(ok, message) {
        dom.connectionBadge.className = "badge status-pill";
        dom.connectionBadge.classList.add(ok ? "bg-green-lt" : "bg-red-lt");
        dom.connectionBadge.textContent = message;
    }

    function setAlert(message, level) {
        const alertLevel = level || "info";
        dom.alert.className = "alert";
        dom.alert.classList.add("alert-" + alertLevel);
        dom.alert.textContent = message;
    }

    function setStatus(text) {
        dom.statusText.textContent = "상태: " + text;
    }

    function formatTime(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString();
    }

    function normalizeConfig(config) {
        const source = config || {};
        return {
            userName: (source.userName || "").trim(),
            userEmail: (source.userEmail || "").trim(),
            fileSyncServer: (source.fileSyncServer || "").trim(),
            fileSyncAccessToken: (source.fileSyncAccessToken || "").trim(),
            gitHubPersonalAccessToken: (source.gitHubPersonalAccessToken || "").trim(),
            gitHubRepositoryOwner: (source.gitHubRepositoryOwner || "").trim(),
            gitHubRepositoryName: (source.gitHubRepositoryName || "").trim(),
            gitHubRepositoryBranch: (source.gitHubRepositoryBranch || "").trim(),
            gitHubRepositoryBasePath: (source.gitHubRepositoryBasePath || "").trim()
        };
    }

    function configsEqual(left, right) {
        return JSON.stringify(left) === JSON.stringify(right);
    }

    function collectFormConfig() {
        return normalizeConfig({
            userName: dom.txtUserName.value,
            userEmail: dom.txtUserEmail.value,
            fileSyncServer: dom.txtFileSyncServer.value,
            fileSyncAccessToken: dom.txtFileSyncAccessToken.value,
            gitHubPersonalAccessToken: dom.txtGitHubPersonalAccessToken.value,
            gitHubRepositoryOwner: dom.txtGitHubRepositoryOwner.value,
            gitHubRepositoryName: dom.txtGitHubRepositoryName.value,
            gitHubRepositoryBranch: dom.txtGitHubRepositoryBranch.value,
            gitHubRepositoryBasePath: dom.txtGitHubRepositoryBasePath.value
        });
    }

    function applyFormConfig(config) {
        dom.txtUserName.value = config.userName;
        dom.txtUserEmail.value = config.userEmail;
        dom.txtFileSyncServer.value = config.fileSyncServer;
        dom.txtFileSyncAccessToken.value = config.fileSyncAccessToken;
        dom.txtGitHubPersonalAccessToken.value = config.gitHubPersonalAccessToken;
        dom.txtGitHubRepositoryOwner.value = config.gitHubRepositoryOwner;
        dom.txtGitHubRepositoryName.value = config.gitHubRepositoryName;
        dom.txtGitHubRepositoryBranch.value = config.gitHubRepositoryBranch;
        dom.txtGitHubRepositoryBasePath.value = config.gitHubRepositoryBasePath;
    }

    function refreshDirtyState() {
        if (!state.config) {
            state.isDirty = false;
            dom.dirtyBadge.classList.add("d-none");
            return;
        }

        state.isDirty = !configsEqual(collectFormConfig(), state.config);
        if (state.isDirty) {
            dom.dirtyBadge.classList.remove("d-none");
            setStatus("편집 중");
        } else {
            dom.dirtyBadge.classList.add("d-none");
            setStatus("동기화됨");
        }
    }

    function setSaveEnabled(enabled) {
        dom.btnSave.disabled = !enabled;
    }

    function requestOptions(method, body) {
        const options = {
            method: method,
            headers: {
                "Accept": "application/json"
            }
        };

        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        return options;
    }

    async function requestJson(url, options) {
        let response;
        try {
            response = await fetch(url, options);
        } catch (_error) {
            setConnection(false, "연결 실패");
            throw new Error("서버 연결 실패");
        }

        const text = await response.text();
        let payload = null;
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch (_error) {
                payload = null;
            }
        }

        if (!response.ok) {
            const message = payload && payload.message ? payload.message : "요청 처리 실패";
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }

        setConnection(true, "연결됨");
        return payload;
    }

    function applySnapshot(fileSnapshot) {
        const normalized = normalizeConfig(fileSnapshot.config);

        state.config = normalized;
        state.lastWriteTimeUtc = fileSnapshot.lastWriteTimeUtc || null;
        state.isDirty = false;

        applyFormConfig(normalized);
        dom.sourceFileBadge.textContent = "원본: " + fileSnapshot.fileName;
        dom.lastWriteText.textContent = "마지막 변경: " + formatTime(state.lastWriteTimeUtc);
        dom.dirtyBadge.classList.add("d-none");
        setStatus(fileSnapshot.exists ? "로드 완료" : "새 파일 생성 대기");
    }

    async function loadSecrets(silent) {
        try {
            const payload = await requestJson(endpoint, requestOptions("GET"));
            applySnapshot(payload.file);
            if (!silent) {
                setAlert("sync-secrets.json 파일을 불러왔습니다.", "info");
            }
        } catch (error) {
            setStatus("로드 실패");
            setAlert(error.message, "danger");
            throw error;
        }
    }

    async function saveSecrets() {
        if (state.isSaving) {
            return;
        }

        state.isSaving = true;
        setSaveEnabled(false);
        setStatus("저장 중");

        try {
            const payload = await requestJson(
                endpoint,
                requestOptions("PUT", {
                    config: collectFormConfig(),
                    lastKnownWriteTimeUtc: state.lastWriteTimeUtc
                }));

            applySnapshot(payload.file);
            setAlert(payload.message || "sync-secrets.json 저장 완료.", "success");
        } catch (error) {
            setStatus("저장 실패");
            setAlert(error.message, error.status === 409 ? "warning" : "danger");
        } finally {
            state.isSaving = false;
            setSaveEnabled(true);
        }
    }

    async function pollSecrets() {
        if (!dom.chkAutoReload.checked || state.isSaving) {
            return;
        }

        let payload;
        try {
            payload = await requestJson(endpoint, requestOptions("GET"));
        } catch (_error) {
            return;
        }

        const remoteLastWrite = payload.file.lastWriteTimeUtc || "";
        const localLastWrite = state.lastWriteTimeUtc || "";
        if (remoteLastWrite === localLastWrite) {
            return;
        }

        if (state.isDirty) {
            setStatus("서버 변경 감지");
            setAlert("저장되지 않은 변경이 있어 자동 반영을 건너뛰었습니다.", "warning");
            return;
        }

        applySnapshot(payload.file);
        setAlert("서버 설정 변경을 반영했습니다.", "info");
    }

    function startPolling() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
        }

        pollTimer = window.setInterval(function () {
            pollSecrets();
        }, pollIntervalMs);
    }

    function bindEvents() {
        for (let i = 0; i < inputElements.length; i += 1) {
            inputElements[i].addEventListener("input", refreshDirtyState);
        }

        dom.btnReload.addEventListener("click", async function () {
            try {
                await loadSecrets(false);
            } catch (_error) {
            }
        });

        dom.btnSave.addEventListener("click", async function () {
            await saveSecrets();
        });
    }

    async function initialize() {
        setConnection(false, "연결 확인 중");
        setAlert("설정 파일을 불러오는 중입니다.", "info");
        bindEvents();

        try {
            await loadSecrets(false);
            setAlert("sync-secrets.json 로드 완료.", "success");
        } catch (_error) {
        }

        startPolling();
    }

    initialize();
})();
