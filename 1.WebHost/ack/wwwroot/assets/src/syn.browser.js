(function (context) {
    'use strict';
    const $browser = context.$browser || new syn.module();
    const doc = context.document;
    const nav = context.navigator;
    const screen = context.screen;

    $browser.extend({
        appName: nav.appName,
        appCodeName: nav.appCodeName,
        appVersion: nav.appVersion,
        cookieEnabled: nav.cookieEnabled,
        pdfViewerEnabled: nav.pdfViewerEnabled,
        platform: nav.platform,
        devicePlatform: context.devicePlatform,
        userAgent: nav.userAgent,
        effectiveType: nav.effectiveType,
        devicePixelRatio: context.devicePixelRatio,
        isExtended: screen?.isExtended ?? false,
        screenWidth: screen?.width ?? 0,
        screenHeight: screen?.height ?? 0,
        language: nav.language || nav.browserLanguage || nav.userLanguage || 'en',
        isWebkit: /AppleWebKit\//.test(nav.userAgent),
        isMac: /Mac|Macintosh/.test(nav.appVersion) || /Macintosh/.test(nav.userAgent),
        isLinux: /Linux|X11/.test(nav.appVersion),
        isWindow: /Win|Windows/.test(nav.appVersion) || /Windows/.test(nav.userAgent),
        isOpera: nav.appName === 'Opera' || /OPR\//.test(nav.userAgent),
        isIE: !!doc?.documentMode || /Trident|MSIE/i.test(nav.userAgent),
        isChrome: !!context.chrome && !/Edg\//.test(nav.userAgent),
        isEdge: !!context.chrome && /Edg\//.test(nav.userAgent),
        isFF: typeof context.InstallTrigger !== 'undefined' || /Firefox/i.test(nav.userAgent),
        isSafari: /constructor/i.test(context.HTMLElement) || ((p) => p.toString() === '[object SafariRemoteNotification]')(!context.safari || (typeof safari !== 'undefined' && context.safari.pushNotification)),
        isMobile: () => (nav.userAgentData?.mobile ?? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent)),

        getSystemFonts(fontListToCheck = []) {
            const defaultFonts = [
                // Serif
                'Georgia', 'Times New Roman', 'Palatino Linotype', 'Book Antiqua',
                'Garamond', 'Constantia', 'Cambria', 'Didot', 'Hoefler Text',
                // Sans-serif
                'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Geneva',
                'Lucida Grande', 'Segoe UI', 'Roboto', 'Open Sans', 'Lato',
                'Calibri', 'Optima', 'Candara', 'Trebuchet MS',
                // Monospace
                'Courier New', 'Lucida Console', 'Monaco', 'Consolas', 'Menlo', 'Inconsolata',
                // 한국어 폰트
                'Malgun Gothic', '맑은 고딕', 'Dotum', '돋움', 'Gulim', '굴림',
                'Batang', '바탕', 'Gungsuh', '궁서',
                'Noto Sans KR', 'Pretendard',
                'Nanum Gothic', '나눔 고딕',
                'Nanum Myeongjo', '나눔 명조',
                'Nanum Brush Script', '나눔 손글씨 붓'
            ];

            const fontsToCheck = fontListToCheck.length > 0 ? fontListToCheck : defaultFonts;
            const availableFonts = [];

            const baseFonts = ['serif', 'sans-serif', 'monospace'];
            const testString = "abcdefghijklmnopqrstuvwxyz0123456789";
            const testFontSize = '72px';

            const baseWidths = {};
            const testElement = doc.createElement('span');
            testElement.style.position = 'absolute';
            testElement.style.visibility = 'hidden';
            testElement.style.top = '-9999px';
            testElement.style.left = '-9999px';
            testElement.style.fontSize = testFontSize;
            testElement.textContent = testString;
            doc.body.appendChild(testElement);

            baseFonts.forEach(baseFont => {
                testElement.style.fontFamily = baseFont;
                baseWidths[baseFont] = testElement.offsetWidth;
            });

            for (const font of fontsToCheck) {
                let detected = false;
                for (const baseFont of baseFonts) {
                    testElement.style.fontFamily = `"${font}", ${baseFont}`;
                    const currentWidth = testElement.offsetWidth;
                    if (currentWidth !== baseWidths[baseFont]) {
                        detected = true;
                        break;
                    }
                }

                if (detected) {
                    availableFonts.push(font);
                }
            }

            doc.body.removeChild(testElement);

            const uniqueFonts = [...new Set(availableFonts)];
            uniqueFonts.sort();
            return uniqueFonts;
        },

        getCanvas2dRender() {
            if (!doc) return null;
            const canvas = doc.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.font = '21.5px Arial';
            ctx.fillText('😉', 0, 20);

            ctx.font = '15.7px serif';
            ctx.fillText('abcdefghijklmnopqrtsuvwxyz', 0, 40);

            ctx.font = '20.5px Arial';
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(0.5, 'green');
            gradient.addColorStop(1.0, 'blue');
            ctx.fillStyle = gradient;
            ctx.fillText('Lorem ipsum!', 30, 20);

            ctx.beginPath();
            ctx.moveTo(170, 5);
            ctx.lineTo(160, 25);
            ctx.lineTo(185, 20);
            ctx.fill();

            return canvas.toDataURL();
        },

        getWebglRender() {
            if (!doc) return null;
            const canvas = doc.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return null;

            const vertices = [-0.1, 0.8, 0.0, -0.8, -0.8, 0.0, 0.8, -0.7, 0.0];
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const indices = [0, 1, 2];
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            const vertCode = 'attribute vec3 coordinates;void main(void) {gl_Position = vec4(coordinates, 1.0);}';
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertCode);
            gl.compileShader(vertexShader);

            const fragCode = 'void main(void) {gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);}';
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragCode);
            gl.compileShader(fragmentShader);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const coordinatesAttribute = gl.getAttribLocation(program, 'coordinates');
            gl.vertexAttribPointer(coordinatesAttribute, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coordinatesAttribute);

            gl.clearColor(1, 1, 1, 1);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

            return canvas.toDataURL();
        },

        getPlugins() {
            if (!nav?.plugins) return '';
            return Array.from(nav.plugins)
                .map(plugin => `${plugin.name}: ${plugin.filename}`);
        },

        fingerPrint(userID, clientIP) {
            const computeComponents = {
                appName: this.appName,
                appCodeName: this.appCodeName,
                cookieEnabled: this.cookieEnabled,
                pdfViewerEnabled: this.pdfViewerEnabled,
                devicePixelRatio: this.devicePixelRatio,
                isExtended: this.isExtended,
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                userAgent: this.userAgent,
                platform: this.platform,
                plugins: this.getPlugins(),
                dateFormat: new Date(0).toString(),
                fonts: this.getSystemFonts(),
                ipAddress: clientIP,
                fingerUserID: userID
            };

            const computeString = JSON.stringify(computeComponents);
            return `${syn.$c.sha256(computeString)}|${computeString}|${$date.toString(new Date(), 'f')}`;
        },

        windowWidth() {
            return context.innerWidth || doc?.documentElement?.clientWidth || doc?.body?.offsetWidth || 0;
        },

        windowHeight() {
            return context.innerHeight || doc?.documentElement?.clientHeight || doc?.body?.clientHeight || 0;
        },

        async getIpAddress() {
            let ipAddress = '127.0.0.1';
            const urls = [
                { url: 'https://api.ipify.org' },
                { url: syn.Config.FindClientIPServer || '/checkip' }
            ];

            for (const item of urls) {
                try {
                    const response = await fetch(item.url);
                    if (response.ok) {
                        ipAddress = await response.text();
                        break;
                    }
                } catch (error) {
                    console.warn(`'${item.url}' 에서 IP 를 가져오지 못했습니다:`, error);
                }
            }

            return ipAddress;
        },

        canShare(data) {
            return !!context.navigator?.share && (!data || !context.navigator.canShare || context.navigator.canShare(data));
        },

        // const shareData = {
        //     title: 'HandStack',
        //     text: 'HandStack 의 목표는 개발자가 좋아하고 기업이 신뢰하는 비즈니스 앱 '시스템'을 제공 하는 것입니다.',
        //     url: 'https://handstack.kr',
        //     files: Array.from(files) // 지원하는 환경에서만 가능
        // }
        // await syn.$b.share(shareData);
        async share(data) {
            if (this.canShare(data)) {
                try {
                    await context.navigator.share(data);
                    syn.$l.eventLog('$b.share', '공유 UI가 성공적으로 호출되었습니다.', 'Information');
                    return;
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        syn.$l.eventLog('$b.share', 'Web Share API 에러:', 'Error', error);
                    } else {
                        syn.$l.eventLog('$b.share', '사용자가 공유를 취소했습니다.', 'Information');
                    }
                    throw error;
                }
            } else {
                syn.$l.eventLog('$b.share', 'Web Share API가 지원되지 않습니다.', 'Warning');
                if (data.url || data.text) {
                    const textToCopy = data.url || data.text;
                    await syn.$w.copyToClipboard(textToCopy);
                }
                throw new Error('Web Share API가 지원되지 않습니다.');
            }
        },

        // const navigationEntry = syn.$l.getPerformanceEntries({ type: 'navigation' });
        // const transactionEntry = syn.$l.getPerformanceEntries({ name: resolveUrl('/transact/api/transaction/execute'), type: 'resource' });
        // https://developer.mozilla.org/en-US/docs/Web/API/Performance_API
        getPerformanceEntries(options = {}) {
            if (!context.performance?.getEntries) {
                syn.$l.eventLog('$b.getPerformanceEntries', 'Performance Timeline API is not supported.', 'Warning');
                return [];
            }

            const { type, name } = options;

            if (name && type) {
                return context.performance.getEntriesByName(name, type);
            }
            if (name) {
                return context.performance.getEntriesByName(name);
            }
            if (type) {
                return context.performance.getEntriesByType(type);
            }
            return context.performance.getEntries();
        },

        markPerformance(markName) {
            if (context.performance?.mark) {
                context.performance.mark(markName);
            }
            return this;
        },

        // syn.$b.markPerformance('start-data-processing');
        // // ... 데이터 처리 로직 ...
        // syn.$b.markPerformance('end-data-processing');
        // syn.$b.measurePerformance('data-processing-time', 'start-data-processing', 'end-data-processing');
        // const [measureEntry] = syn.$b.getPerformanceEntries({ type: 'measure', name: 'data-processing-time' });
        // if(measureEntry) {
        //     console.log(`데이터 처리 시간: ${measureEntry.duration.toFixed(2)}ms`);
        // }
        measurePerformance(measureName, startMark, endMark) {
            if (context.performance?.measure) {
                try {
                    context.performance.measure(measureName, startMark, endMark);
                    const entries = this.getPerformanceEntries({ type: 'measure', name: measureName });
                    return entries.length > 0 ? entries[entries.length - 1] : null;
                } catch (e) {
                    syn.$l.eventLog('$b.measurePerformance', `'${measureName}' 측정값을 생성할 수 없습니다.`, 'Error', e);
                    return null;
                }
            }
            return null;
        }
    });
    context.$browser = syn.$b = $browser;
})(globalRoot);
