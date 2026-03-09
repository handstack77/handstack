(function () {
    const scenarios = [
        {
            key: "lab-html",
            title: "브라우저 HTML",
            method: "GET",
            accept: "text/html,application/xhtml+xml",
            contentType: "application/json",
            body: "",
            description: "HTML 대상 페이지를 통해 상대 경로 CSS, 스크립트, SVG, 폼, 이동 링크 동작을 확인합니다."
        },
        {
            key: "lab-json",
            title: "JSON API",
            method: "GET",
            accept: "application/json",
            contentType: "application/json",
            body: "",
            description: "요청 헤더와 현재 쿠키 값을 포함한 기본 JSON 응답을 확인합니다."
        },
        {
            key: "lab-echo",
            title: "POST Echo",
            method: "POST",
            accept: "application/json",
            contentType: "application/json",
            body: JSON.stringify({ message: "hello-forwarder", trace: "index-demo" }, null, 2),
            headers: { "X-Proxy-Lab": "echo" },
            description: "POST 본문, 사용자 정의 헤더, 원문 요청 본문 전달 여부를 확인합니다."
        },
        {
            key: "lab-redirect",
            title: "리다이렉트",
            method: "GET",
            accept: "text/html,application/xhtml+xml",
            contentType: "application/json",
            body: "",
            description: "리다이렉트 이후 최종 HTML 페이지에 정상 도달하는지 확인합니다."
        },
        {
            key: "lab-cookie-set",
            title: "쿠키 저장",
            method: "GET",
            accept: "application/json",
            contentType: "application/json",
            body: "",
            description: "ProxyLabCookie 값을 세션 저장소에 기록합니다."
        },
        {
            key: "lab-cookie-read",
            title: "쿠키 조회",
            method: "GET",
            accept: "application/json",
            contentType: "application/json",
            body: "",
            description: "앞서 저장한 ProxyLabCookie 값을 다시 읽어 세션 유지 여부를 확인합니다."
        },
        {
            key: "lab-slow",
            title: "지연 응답",
            method: "GET",
            accept: "application/json",
            contentType: "application/json",
            body: "",
            timeoutMS: 4500,
            description: "지연 응답 대상에 대해 시간 제한과 장기 요청 동작을 점검합니다."
        }
    ];

    const elements = {
        bearerToken: document.getElementById("bearerToken"),
        requestKey: document.getElementById("requestKey"),
        method: document.getElementById("method"),
        accept: document.getElementById("accept"),
        timeoutMS: document.getElementById("timeoutMS"),
        contentType: document.getElementById("contentType"),
        extraHeaders: document.getElementById("extraHeaders"),
        requestBody: document.getElementById("requestBody"),
        scenarioGrid: document.getElementById("scenarioGrid"),
        runBrowser: document.getElementById("runBrowser"),
        runProgram: document.getElementById("runProgram"),
        copyCurl: document.getElementById("copyCurl"),
        copyPowerShell: document.getElementById("copyPowerShell"),
        statusLine: document.getElementById("statusLine"),
        metricMode: document.getElementById("metricMode"),
        metricStatus: document.getElementById("metricStatus"),
        metricElapsed: document.getElementById("metricElapsed"),
        metricContentType: document.getElementById("metricContentType"),
        responseUrl: document.getElementById("responseUrl"),
        responseHeaders: document.getElementById("responseHeaders"),
        responseBody: document.getElementById("responseBody"),
        previewFrame: document.getElementById("previewFrame"),
        curlCommand: document.getElementById("curlCommand"),
        powerShellCommand: document.getElementById("powerShellCommand")
    };

    function initialize() {
        restoreState();
        renderScenarioCards();
        bindEvents();
        if (!elements.requestKey.value) {
            applyScenario(scenarios[0]);
        }
        updateCommandSnippets();
    }

    function bindEvents() {
        elements.runBrowser.addEventListener("click", () => executeBrowserMode());
        elements.runProgram.addEventListener("click", () => executeProgramMode());
        elements.copyCurl.addEventListener("click", () => copyText(elements.curlCommand.value, "curl 명령을 복사했습니다."));
        elements.copyPowerShell.addEventListener("click", () => copyText(elements.powerShellCommand.value, "PowerShell 명령을 복사했습니다."));

        [
            elements.bearerToken,
            elements.requestKey,
            elements.method,
            elements.accept,
            elements.timeoutMS,
            elements.contentType,
            elements.extraHeaders,
            elements.requestBody
        ].forEach((element) => {
            element.addEventListener("input", () => {
                persistState();
                updateCommandSnippets();
            });
        });
    }

    function renderScenarioCards() {
        elements.scenarioGrid.innerHTML = "";
        scenarios.forEach((scenario) => {
            const article = document.createElement("article");
            article.className = "scenario-card";
            article.innerHTML = `
                <span class="pill">${scenario.key}</span>
                <h3>${scenario.title}</h3>
                <p>${scenario.description}</p>
                <button type="button">프리셋 적용</button>
            `;
            article.querySelector("button").addEventListener("click", () => {
                applyScenario(scenario);
                setStatus(`프리셋을 적용했습니다: ${scenario.key}`, "success");
            });
            elements.scenarioGrid.appendChild(article);
        });
    }

    function applyScenario(scenario) {
        elements.requestKey.value = scenario.key;
        elements.method.value = scenario.method;
        elements.accept.value = scenario.accept;
        elements.contentType.value = scenario.contentType;
        elements.requestBody.value = scenario.body || "";
        elements.timeoutMS.value = scenario.timeoutMS || 30000;
        elements.extraHeaders.value = JSON.stringify(scenario.headers || {}, null, 2);
        persistState();
        updateCommandSnippets();
    }

    async function executeBrowserMode() {
        const request = buildRequest();
        if (!request) {
            return;
        }

        const url = buildForwarderUrl(request.requestKey, request.timeoutMS);
        const headers = buildTransportHeaders(request, "Browser");
        const fetchOptions = {
            method: request.method,
            headers,
            redirect: "follow"
        };

        if (shouldSendBody(request.method) || request.body.length > 0) {
            fetchOptions.body = request.body;
        }

        const startedAt = performance.now();
        setBusy(true);
        try {
            const response = await fetch(url, fetchOptions);
            const elapsedMS = Math.round(performance.now() - startedAt);
            const result = await readFetchResponse(response, "Browser", elapsedMS, url);
            renderResult(result);
            setStatus(`브라우저 모드 요청이 완료되었습니다: ${response.status}`, "success");
        } catch (error) {
            renderError(error);
        } finally {
            setBusy(false);
        }
    }

    async function executeProgramMode() {
        const request = buildRequest();
        if (!request) {
            return;
        }

        const startedAt = performance.now();
        setBusy(true);
        try {
            const response = await fetch("/forwarder/api/forward-proxy-lab/program-execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    requestKey: request.requestKey,
                    bearerToken: request.bearerToken,
                    method: request.method,
                    contentType: request.contentType,
                    body: request.body,
                    timeoutMS: request.timeoutMS,
                    headers: request.headers
                })
            });

            const elapsedMS = Math.round(performance.now() - startedAt);
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(typeof payload === "string" ? payload : JSON.stringify(payload));
            }

            renderResult({
                mode: payload.mode || "Program",
                statusCode: payload.statusCode,
                statusText: payload.statusText,
                responseUrl: payload.responseUrl,
                contentType: payload.contentType,
                headers: payload.headers || {},
                body: payload.body || "",
                elapsedMS: payload.elapsedMS || elapsedMS,
                isHtml: (payload.contentType || "").toLowerCase().includes("text/html")
            });
            setStatus(`프로그램 모드 요청이 완료되었습니다: ${payload.statusCode}`, "success");
        } catch (error) {
            renderError(error);
        } finally {
            setBusy(false);
        }
    }

    function buildRequest() {
        const bearerToken = elements.bearerToken.value.trim();
        const requestKey = elements.requestKey.value.trim();
        if (!requestKey) {
            setStatus("requestKey를 입력하세요.", "error");
            return null;
        }

        const parsedHeaders = parseJson(elements.extraHeaders.value.trim() || "{}");
        if (parsedHeaders == null) {
            setStatus("추가 헤더는 올바른 JSON 객체여야 합니다.", "error");
            return null;
        }

        return {
            bearerToken,
            requestKey,
            method: elements.method.value,
            accept: elements.accept.value.trim(),
            timeoutMS: Number(elements.timeoutMS.value || 0),
            contentType: elements.contentType.value.trim(),
            headers: parsedHeaders,
            body: elements.requestBody.value
        };
    }

    function buildTransportHeaders(request, mode) {
        const headers = new Headers();
        headers.set("BearerToken", request.bearerToken);
        headers.set("X-Forwarder-ClientKind", mode);

        if (request.accept) {
            headers.set("Accept", request.accept);
        }

        Object.entries(request.headers).forEach(([key, value]) => {
            if (value == null || value === "") {
                return;
            }

            headers.set(key, String(value));
        });

        if ((shouldSendBody(request.method) || request.body.length > 0) && request.contentType) {
            headers.set("Content-Type", request.contentType);
        }

        return headers;
    }

    async function readFetchResponse(response, mode, elapsedMS, requestUrl) {
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const contentType = response.headers.get("content-type") || "";
        const body = await response.text();

        return {
            mode,
            statusCode: response.status,
            statusText: response.statusText,
            responseUrl: response.url || requestUrl,
            contentType,
            headers,
            body,
            elapsedMS,
            isHtml: contentType.toLowerCase().includes("text/html") || body.trimStart().startsWith("<!DOCTYPE html")
        };
    }

    function renderResult(result) {
        elements.metricMode.textContent = getModeLabel(result.mode);
        elements.metricStatus.textContent = `${result.statusCode} ${result.statusText || ""}`.trim();
        elements.metricElapsed.textContent = `${result.elapsedMS} ms`;
        elements.metricContentType.textContent = result.contentType || "(없음)";
        elements.responseUrl.value = result.responseUrl || "";
        elements.responseHeaders.value = JSON.stringify(result.headers || {}, null, 2);
        elements.responseBody.value = result.body || "";
        elements.previewFrame.srcdoc = result.isHtml ? result.body : createNonHtmlPreview(result);
    }

    function renderError(error) {
        const message = error instanceof Error ? error.message : String(error);
        elements.metricMode.textContent = "-";
        elements.metricStatus.textContent = "오류";
        elements.metricElapsed.textContent = "-";
        elements.metricContentType.textContent = "-";
        elements.responseUrl.value = "";
        elements.responseHeaders.value = "";
        elements.responseBody.value = message;
        elements.previewFrame.srcdoc = createErrorPreview(message);
        setStatus(message, "error");
    }

    function createNonHtmlPreview(result) {
        const escaped = escapeHtml(result.body || "(없음)");
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="utf-8" />
                <style>
                    body { font-family: Segoe UI, sans-serif; margin: 0; padding: 20px; background: #f6f3ea; color: #102032; }
                    h1 { margin-top: 0; font-size: 18px; }
                    pre { white-space: pre-wrap; word-break: break-word; background: #fff; border: 1px solid #d8d3c8; border-radius: 14px; padding: 14px; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(result.contentType || "비 HTML 응답")}</h1>
                <pre>${escaped}</pre>
            </body>
            </html>
        `;
    }

    function createErrorPreview(message) {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="utf-8" />
                <style>
                    body { font-family: Segoe UI, sans-serif; margin: 0; padding: 20px; background: #fff4ef; color: #7d2e1f; }
                    pre { white-space: pre-wrap; word-break: break-word; }
                </style>
            </head>
            <body>
                <h1>요청에 실패했습니다</h1>
                <pre>${escapeHtml(message)}</pre>
            </body>
            </html>
        `;
    }

    function getModeLabel(mode) {
        if (String(mode).toLowerCase() === "browser") {
            return "브라우저";
        }

        if (String(mode).toLowerCase() === "program") {
            return "프로그램";
        }

        return mode || "-";
    }

    function buildForwarderUrl(requestKey, timeoutMS) {
        const url = new URL("/forwarder/api/proxy/pipe", window.location.origin);
        url.searchParams.set("requestKey", requestKey);
        if (timeoutMS > 0) {
            url.searchParams.set("timeoutMS", timeoutMS);
        }

        return url.toString();
    }

    function updateCommandSnippets() {
        const request = buildRequestForPreview();
        if (!request) {
            elements.curlCommand.value = "";
            elements.powerShellCommand.value = "";
            return;
        }

        const forwarderUrl = buildForwarderUrl(request.requestKey, request.timeoutMS);
        const curlParts = [
            "curl.exe",
            "-i",
            "-X",
            request.method,
            `"${forwarderUrl}"`,
            `-H "BearerToken: ${escapeShellDoubleQuotes(request.bearerToken)}"`,
            `-H "X-Forwarder-ClientKind: Program"`
        ];

        if (request.accept) {
            curlParts.push(`-H "Accept: ${escapeShellDoubleQuotes(request.accept)}"`);
        }

        Object.entries(request.headers).forEach(([key, value]) => {
            curlParts.push(`-H "${escapeShellDoubleQuotes(key)}: ${escapeShellDoubleQuotes(String(value))}"`);
        });

        if ((shouldSendBody(request.method) || request.body.length > 0) && request.contentType) {
            curlParts.push(`-H "Content-Type: ${escapeShellDoubleQuotes(request.contentType)}"`);
        }

        if (request.body.length > 0) {
            curlParts.push(`--data "${escapeShellDoubleQuotes(request.body)}"`);
        }

        const psHeaders = Object.assign({}, request.headers, {
            BearerToken: request.bearerToken,
            "X-Forwarder-ClientKind": "Program"
        });

        if (request.accept) {
            psHeaders.Accept = request.accept;
        }

        if ((shouldSendBody(request.method) || request.body.length > 0) && request.contentType) {
            psHeaders["Content-Type"] = request.contentType;
        }

        const headerLines = Object.entries(psHeaders)
            .map(([key, value]) => `    '${escapePowerShellSingleQuotes(key)}' = '${escapePowerShellSingleQuotes(String(value))}'`)
            .join("`n");

        elements.curlCommand.value = curlParts.join(" ");
        elements.powerShellCommand.value =
`$headers = @{
${headerLines}
}
Invoke-WebRequest -Method ${request.method} -Uri '${escapePowerShellSingleQuotes(forwarderUrl)}' -Headers $headers${request.body.length > 0 ? ` -Body '${escapePowerShellSingleQuotes(request.body)}'` : ""}`;
    }

    function buildRequestForPreview() {
        const bearerToken = elements.bearerToken.value.trim();
        const requestKey = elements.requestKey.value.trim();
        if (!bearerToken || !requestKey) {
            return null;
        }

        const parsedHeaders = parseJson(elements.extraHeaders.value.trim() || "{}");
        if (parsedHeaders == null) {
            return null;
        }

        return {
            bearerToken,
            requestKey,
            method: elements.method.value,
            accept: elements.accept.value.trim(),
            timeoutMS: Number(elements.timeoutMS.value || 0),
            contentType: elements.contentType.value.trim(),
            headers: parsedHeaders,
            body: elements.requestBody.value
        };
    }

    function parseJson(text) {
        try {
            const parsed = JSON.parse(text);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }

    function shouldSendBody(method) {
        return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method).toUpperCase());
    }

    function setBusy(isBusy) {
        elements.runBrowser.disabled = isBusy;
        elements.runProgram.disabled = isBusy;
    }

    function setStatus(message, tone) {
        elements.statusLine.textContent = message;
        elements.statusLine.className = `status-line${tone ? ` ${tone}` : ""}`;
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function escapeShellDoubleQuotes(text) {
        return String(text).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
    }

    function escapePowerShellSingleQuotes(text) {
        return String(text).replaceAll("'", "''");
    }

    async function copyText(text, message) {
        if (!text) {
            return;
        }

        await navigator.clipboard.writeText(text);
        setStatus(message, "success");
    }

    function persistState() {
        const payload = {
            bearerToken: elements.bearerToken.value,
            requestKey: elements.requestKey.value,
            method: elements.method.value,
            accept: elements.accept.value,
            timeoutMS: elements.timeoutMS.value,
            contentType: elements.contentType.value,
            extraHeaders: elements.extraHeaders.value,
            requestBody: elements.requestBody.value
        };

        window.localStorage.setItem("forwardProxyLab", JSON.stringify(payload));
    }

    function restoreState() {
        const raw = window.localStorage.getItem("forwardProxyLab");
        if (!raw) {
            return;
        }

        try {
            const payload = JSON.parse(raw);
            elements.bearerToken.value = payload.bearerToken || "";
            elements.requestKey.value = payload.requestKey || "";
            elements.method.value = payload.method || "GET";
            elements.accept.value = payload.accept || "application/json";
            elements.timeoutMS.value = payload.timeoutMS || "30000";
            elements.contentType.value = payload.contentType || "application/json";
            elements.extraHeaders.value = payload.extraHeaders || "{}";
            elements.requestBody.value = payload.requestBody || "";
        } catch {
        }
    }

    initialize();
})();
