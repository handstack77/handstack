/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $browser = context.$browser || new syn.module();
    var document = context.document;

    $browser.extend({
        version: '1.0.0',

        appName: navigator.appName,
        appCodeName: navigator.appCodeName,
        appVersion: navigator.appVersion,
        cookieEnabled: navigator.cookieEnabled,
        pdfViewerEnabled: navigator.pdfViewerEnabled,
        platform: navigator.platform,
        devicePlatform: context.devicePlatform,
        userAgent: navigator.userAgent,
        devicePixelRatio: context.devicePixelRatio,
        isExtended: screen.isExtended,
        screenWidth: screen.width,
        screenHeight: screen.height,
        language: (navigator.appName == 'Netscape') ? navigator.language : navigator.browserLanguage,
        isWebkit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
        isMac: navigator.appVersion.indexOf('Mac') != -1 || navigator.userAgent.indexOf('Macintosh') != -1,
        isLinux: navigator.appVersion.indexOf('Linux') != -1 || navigator.appVersion.indexOf('X11') != -1,
        isWindow: navigator.appVersion.indexOf('Win') != -1 || navigator.userAgent.indexOf('Windows') != -1,
        isOpera: navigator.appName == 'Opera',
        isIE: !!document.documentMode || (navigator.appName == 'Netscape' && navigator.userAgent.indexOf('trident') != -1) || (navigator.userAgent.indexOf('msie') != -1),
        isChrome: !!context.chrome && navigator.userAgent.indexOf('Edg') == -1,
        isEdge: !!context.chrome && navigator.userAgent.indexOf('Edg') > -1,
        isFF: typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf('Firefox') !== -1,
        isSafari: /constructor/i.test(context.HTMLElement) || (function (p) { return p.toString() === '[object SafariRemoteNotification]'; })(!context['safari'] || (typeof safari !== 'undefined' && context['safari'].pushNotification)),
        isMobile: (navigator.userAgentData && navigator.userAgentData.mobile == true) ? true : /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent),

        getSystemFonts() {
            var fonts = [
                '-apple-system',
                'BlinkMacSystemFont',
                'Cantarell',
                'Consolas',
                'Courier New',
                'Droid Sans',
                'Fira Sans',
                'Helvetica Neue',
                'Menlo',
                'Monaco',
                'Oxygen',
                'Roboto',
                'source-code-pro',
                'Segoe UI',
                'Ubuntu',
            ];
            return fonts
                .filter((font) => document.fonts.check('12px ' + font))
                .join(', ');
        },

        getCanvas2dRender() {
            var canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;

            var ctx = canvas.getContext('2d');
            if (!ctx) {
                return null;
            }

            ctx.font = '21.5px Arial';
            ctx.fillText('😉', 0, 20);

            ctx.font = '15.7px serif';
            ctx.fillText('abcdefghijklmnopqrtsuvwxyz', 0, 40);

            ctx.font = '20.5px Arial';
            var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
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
            var canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;

            var gl = canvas.getContext('webgl');
            if (!gl) {
                return null;
            }

            var vertices = [
                [-0.1, 0.8, 0.0],
                [-0.8, -0.8, 0.0],
                [0.8, -0.7, 0.0],
            ].flat();
            var vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            var indices = [0, 1, 2];
            var indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indices),
                gl.STATIC_DRAW
            );

            var vertCode = 'attribute vec3 coordinates;void main(void) {gl_Position = vec4(coordinates, 1.0);}';
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertCode);
            gl.compileShader(vertexShader);

            var fragCode = 'void main(void) {gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);}';
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragCode);
            gl.compileShader(fragmentShader);

            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            var coordinatesAttribute = gl.getAttribLocation(program, 'coordinates');

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
            return Array.from(navigator.plugins)
                .map((plugin) => plugin.name + ': ' + plugin.filename)
                .join(', ');
        },

        async fingerPrint() {
            var computeComponents = {
                appName: $browser.appName,
                appCodeName: $browser.appCodeName,
                cookieEnabled: $browser.cookieEnabled,
                pdfViewerEnabled: $browser.pdfViewerEnabled,
                devicePixelRatio: $browser.devicePixelRatio,
                isExtended: $browser.isExtended,
                screenWidth: $browser.screenWidth,
                screenHeight: $browser.screenHeight,
                userAgent: $browser.userAgent,
                platform: $browser.platform,
                plugins: $browser.getPlugins(),
                dateFormat: new Date(0).toString(),
                fonts: $browser.getSystemFonts(),
                canvas2dRender: $browser.getCanvas2dRender(),
                webglRender: $browser.getWebglRender(),
                ipAddress: await $browser.getIpAddress()
            };

            return syn.$c.sha256(JSON.stringify(computeComponents));
        },

        windowWidth() {
            var ret = null;
            if (context.innerWidth) {
                ret = context.innerWidth;
            }
            else if (document.documentElement && document.documentElement.clientWidth) {
                ret = document.documentElement.clientWidth;
            }
            else if (document.body) {
                ret = document.body.offsetWidth;
            }

            return ret;
        },

        windowHeight() {
            var ret = null;
            if (context.innerHeight) {
                ret = context.innerHeight;
            }
            else if (document.documentElement && document.documentElement.clientHeight) {
                ret = document.documentElement.clientHeight;
            }
            else if (document.body) {
                ret = document.body.clientHeight;
            }

            return ret;
        },

        async getIpAddress() {
            var result = '';

            try {
                var value = await syn.$w.apiHttp(syn.Config.FindClientIPServer || '/checkip').send(null, { timeout: 3000 });
                result = ($string.isNullOrEmpty(value) == true || syn.$v.regexs.ipAddress.test(value) == false) ? '127.0.0.1' : value;
            } catch (error) {
                syn.$l.eventLog('$b.getIpAddress', error, 'Error');
            }
            return result;
        }
    });
    syn.$b = $browser;
})(globalRoot);
