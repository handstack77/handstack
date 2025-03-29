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


        getSystemFonts() {
            const fonts = [
                '-apple-system', 'BlinkMacSystemFont', 'Cantarell', 'Consolas', 'Courier New',
                'Droid Sans', 'Fira Sans', 'Helvetica Neue', 'Menlo', 'Monaco', 'Oxygen',
                'Roboto', 'source-code-pro', 'Segoe UI', 'Ubuntu',
            ];
            if (!doc?.fonts?.check) return '';
            return fonts.filter(font => doc.fonts.check(`12px ${font} `)).join(', ');
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
                .map(plugin => `${plugin.name}: ${plugin.filename} `)
                .join(', ');
        },

        async fingerPrint() {
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
                canvas2dRender: this.getCanvas2dRender(),
                webglRender: this.getWebglRender(),
                ipAddress: await this.getIpAddress()
            };

            return syn.$c.sha256(JSON.stringify(computeComponents));
        },

        windowWidth() {
            return context.innerWidth || doc?.documentElement?.clientWidth || doc?.body?.offsetWidth || 0;
        },

        windowHeight() {
            return context.innerHeight || doc?.documentElement?.clientHeight || doc?.body?.clientHeight || 0;
        },

        async getIpAddress() {
            let ipAddress = '127.0.0.1';
            const ipServerUrl = syn.Config.FindClientIPServer || '/checkip';
            try {
                const value = await syn.$r.httpFetch(ipServerUrl).send(null, { timeout: 3000 });
                if (value && syn.$v.regexs.ipAddress.test(value)) {
                    ipAddress = value;
                }
            } catch (error) {
                syn.$l.eventLog('$b.getIpAddress', error, 'Error');
            }
            return ipAddress;
        }
    });
    context.$browser = syn.$b = $browser;
})(globalRoot);
