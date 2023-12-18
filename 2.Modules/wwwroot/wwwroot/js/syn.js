/*!
HandStack Javascript Library v1.0.0
https://syn.handshake.kr

Copyright 2023, HandStack
*/
var getGlobal = function () {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    if (typeof this !== 'undefined') return this;
    throw new Error('전역 객체를 찾을 수 없습니다');
};

var globalRoot = getGlobal();
globalRoot.devicePlatform = 'browser';
if ('AndroidScript' in globalRoot) {
    globalRoot.devicePlatform = 'android';
}
else if ('webkit' in globalRoot) {
    globalRoot.devicePlatform = 'ios';
}
else if ('process' in globalRoot && typeof module === 'object') {
    globalRoot.devicePlatform = 'node';
}

var syn = syn || function () { };
syn.module = function () { };
syn.module.extend = function (newType, staticType) {
    var extend = syn.module.prototype.extend;

    syn.module.prototyping = true;
    var prototype = new this;

    extend.call(prototype, newType);

    prototype.base = function () {
    };

    delete syn.module.prototyping;

    var constructor = prototype.constructor;
    var object = prototype.constructor = function () {
        if (!syn.module.prototyping) {
            if (this.constructing || this.constructor == object) {
                this.constructing = true;
                constructor.apply(this, arguments);

                delete this.constructing;
            }
            else if (arguments[0] != null) {
                return (arguments[0].extend || extend).call(arguments[0], prototype);
            }
        }
    };

    object.ancestor = this;
    object.extend = this.extend;
    object.each = this.each;
    object.implement = this.implement;
    object.prototype = prototype;
    object.toString = this.toString;
    object.valueOf = function (type) {
        return (type == 'object') ? object : constructor.valueOf();
    }

    extend.call(object, staticType);

    if (typeof object.init == 'function') {
        object.init();
    }

    return object;
};

syn.module.prototype = {
    extend(source, val) {
        if (arguments.length > 1) {
            var ancestor = this[source];
            if (ancestor && (typeof val == 'function') && (!ancestor.valueOf || ancestor.valueOf() != val.valueOf()) && /\bbase\b/.test(val)) {
                var method = val.valueOf();

                val = function () {
                    var previous = this.base || syn.module.prototype.base;
                    this.base = ancestor;
                    var returnValue = method.apply(this, arguments);
                    this.base = previous;
                    return returnValue;
                };

                val.valueOf = function (type) {
                    return (type == 'object') ? val : method;
                };

                val.toString = syn.module.toString;
            }

            if (source === 'config') {
                var argumentsExtend = function () {
                    var extended = {};

                    for (var key in arguments) {
                        var argument = arguments[key];
                        for (var prop in argument) {
                            if (Object.prototype.hasOwnProperty.call(argument, prop)) {
                                extended[prop] = argument[prop];
                            }
                        }
                    }

                    return extended;
                }

                this[source] = argumentsExtend(this[source], val);
            }
            else {
                this[source] = val;
            }
        }
        else if (source) {
            var extend = syn.module.prototype.extend;

            if (!syn.module.prototyping && typeof this != 'function') {
                extend = this.extend || extend;
            }
            var prototype = { toSource: null }
            var hidden = ['constructor', 'toString', 'valueOf', 'concreate'];
            var i = syn.module.prototyping ? 0 : 1;
            while (key = hidden[i++]) {
                if (source[key] != prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            for (var key in source) {
                if (!prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            var concreate = source['concreate'];
            if (concreate) {
                concreate(source);
            }
        }
        return this;
    }
};

syn.module = syn.module.extend(
    {
        constructor() {
            this.extend(arguments[0]);
        },

        concreate() {
        }
    },
    {
        ancestor: Object,

        version: '1.0.0',

        each(els, func, props) {
            if (func == undefined || func.length == 0) {
                return;
            }

            for (var key in els) {
                if (typeof els[key] === 'object') {
                    func.apply(els[key], props);
                }
            }
        },

        implement() {
            for (var i = 0, len = arguments.length; i < len; i++) {
                if (typeof arguments[i] === 'function') {
                    arguments[i](this.prototype);
                }
                else {
                    this.prototype.extend(arguments[i]);
                }
            }
            return this;
        },

        toString() {
            return String(this.valueOf());
        }
    });

globalRoot.syn = syn;

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
            var result = '127.0.0.1';

            try {
                var value = await syn.$w.apiHttp('/checkip').send(null, { timeout: 200 });
                result = (value.status === 200 && syn.$v.regexs.ipAddress.test(value.response) == true) ? value.response : '127.0.0.1';
            } catch (error) {
                syn.$l.eventLog('$b.getIpAddress', error, 'Error');
            }
            return result;
        }
    });
    syn.$b = $browser;
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $manipulation = context.$manipulation || new syn.module();
    var document = context.document;

    $manipulation.extend({
        version: '1.0.0',

        body() {
            return document;
        },

        documentElement() {
            return document.documentElement;
        },

        childNodes(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.childNodes;
        },

        children(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.children;
        },

        firstChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.firstChild;
        },

        firstElementChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.firstElementChild;
        },

        lastChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.lastChild;
        },

        lastElementChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.lastElementChild;
        },

        nextSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.nextSibling;
        },

        nextElementSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.nextElementSibling;
        },

        previousSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.previousSibling;
        },

        previousElementSibling(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.previousElementSibling;
        },

        siblings(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return [].slice.call(el.parentElement.children).filter(function (child) {
                return child !== el;
            });
        },

        parentNode(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.parentNode;
        },

        parentElement(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.parentElement;
        },

        value(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.value = $string.toValue(value);
            }
            return el.value;
        },

        textContent(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.textContent = $string.toValue(value);
            }
            return el.textContent;
        },

        innerText(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.innerText = $string.toValue(value);
            }
            return el.innerText;
        },

        innerHTML(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            else {
                el.innerHTML = $string.toValue(value);
            }
            return el.innerHTML;
        },

        outerHTML(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.outerHTML;
        },

        className(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.className;
        },

        removeAttribute(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.removeAttribute(prop);
        },

        getAttribute(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.getAttribute(prop);
        },

        setAttribute(el, prop, val) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.setAttribute(prop, val);
        },

        appendChild(el, node) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.appendChild(node);
        },

        setStyle(el, prop, val) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                el.style[prop] = val;
            }
            return $manipulation;
        },

        addCssText(el, cssText) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                el.style.cssText = cssText;
            }
            return $manipulation;
        },

        addStyle(el, objects) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                for (var prop in objects) {
                    $manipulation.setStyle(el, prop, objects[prop]);
                }
            }
            return $manipulation;
        },

        getStyle(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.style[prop];
        },

        hasHidden(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            return (el == null || el.offsetParent == null || context.getComputedStyle(el)['display'] == 'none');
        },

        getComputedStyle(el, prop) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return context.getComputedStyle(el)[prop];
        },

        addClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;

            if ($object.isNullOrUndefined(el) == false) {
                if ($string.isNullOrEmpty(css) == false) {
                    if (css.indexOf(' ') > -1) {
                        var classList = css.split(' ');
                        for (var i = 0, length = classList.length; i < length; i++) {
                            var cssItem = classList[i];
                            if ($string.isNullOrEmpty(cssItem) == false) {
                                if ($manipulation.hasClass(el, cssItem) == false) {
                                    if (el.classList && el.classList.add) {
                                        el.classList.add(cssItem);
                                    }
                                    else {
                                        el.className = (el.className + ' ' + cssItem).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if ($manipulation.hasClass(el, css) == false) {
                            if (el.classList && el.classList.add) {
                                el.classList.add(css);
                            }
                            else {
                                el.className = (el.className + ' ' + css).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                            }
                        }
                    }
                }
            }

            return $manipulation;
        },

        hasClass(el, css) {
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (el.classList && el.classList.contains) {
                    result = el.classList.contains(css);
                }
                else {
                    result = syn.$m.getClassRegEx(css).test(el.className);
                }
            }

            return result;
        },

        toggleClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (el.classList && el.classList.toggle) {
                    el.classList.toggle(css);
                }
            }

            return $manipulation;
        },

        removeClass(el, css) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (css === undefined) {
                    el.className = '';
                }
                else {
                    if (el.classList && el.classList.remove) {
                        el.classList.remove(css);
                    }
                    else {
                        var re = syn.$m.getClassRegEx(css);
                        el.className = el.className.replace(re, '');
                        re = null;
                    }

                }
            }

            return $manipulation;
        },

        append(baseEl, tag, elID, options) {
            var el = null;
            baseEl = $object.isString(baseEl) == true ? syn.$l.get(baseEl) : baseEl;
            if ($object.isNullOrUndefined(baseEl) == false && $string.isNullOrEmpty(tag) == false) {
                el = document.createElement(tag);

                if ($string.isNullOrEmpty(elID) == false) {
                    el.id = elID;
                }

                if ($object.isNullOrUndefined(options) == false) {
                    if ($string.isNullOrEmpty(options.type) == false) {
                        el.type = options.type;
                    }

                    if ($object.isNullOrUndefined(options.styles) == false) {
                        $manipulation.addStyle(el, options.styles);
                    }

                    if ($string.isNullOrEmpty(options.classNames) == false) {
                        $manipulation.addClass(el, options.classNames);
                    }

                    if ($object.isNullOrUndefined(options.value) == false) {
                        $manipulation.value(el, options.value);
                    }

                    if ($object.isNullOrUndefined(options.text) == false) {
                        $manipulation.innerText(el, options.text);
                    }

                    if ($object.isNullOrUndefined(options.content) == false) {
                        $manipulation.textContent(el, options.content);
                    }

                    if ($object.isNullOrUndefined(options.html) == false) {
                        $manipulation.innerHTML(el, options.html);
                    }
                }

                baseEl.appendChild(el);
            }
            return el;
        },

        prepend(el, baseEl) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            baseEl = $object.isString(baseEl) == true ? syn.$l.get(baseEl) : baseEl;
            if ($object.isNullOrUndefined(el) == false && $object.isNullOrUndefined(baseEl) == false) {
                baseEl.insertBefore(el, baseEl.firstChild);
            }

            return $manipulation;
        },

        copy(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                return null;
            }
            return el.cloneNode(true);
        },

        remove(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                syn.$w.purge(el);

                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }

            return $manipulation;
        },

        hasChild(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                return el.hasChildNodes();
            }

            return false;
        },

        insertAfter(el, targetEL) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            targetEL = $object.isString(targetEL) == true ? syn.$l.get(targetEL) : targetEL;
            if ($object.isNullOrUndefined(el) == false && $object.isNullOrUndefined(targetEL) == false) {
                var parent = targetEL.parentNode;
                if (targetEL.nextElementSibling) {
                    parent.insertBefore(el, targetEL.nextElementSibling);
                } else {
                    if ($object.isNullOrUndefined(parent) == false) {
                        parent.appendChild(el);
                    }
                    else {
                        $manipulation.appendChild(targetEL, el);
                    }
                }
            }

            return $manipulation;
        },

        display(el, isShow) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(isShow) == true) {
                    el.style.display = 'block';
                }
                else {
                    el.style.display = 'none';
                }
            }

            return $manipulation;
        },

        toggleDisplay(el) {
            var result = 'none';
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if (context.getComputedStyle(el).display === 'block') {
                    $manipulation.display(el, false);
                }
                else {
                    $manipulation.display(el, true);
                }

                result = context.getComputedStyle(el).display;
            }

            return result;
        },

        parent(el, id) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var parent = el.parentElement;
                if ($string.isNullOrEmpty(id) == false) {
                    while (parent && ($string.isNullOrEmpty(parent.tagName) == false && parent.tagName != 'HTML')) {
                        if ($object.isNullOrUndefined(parent) == true) {
                            break;
                        }

                        if (parent.id == id) {
                            return parent;
                        }

                        parent = parent.parentElement;
                    }
                }
            }

            return parent;
        },

        create(options) {
            var el = document.createElement(options.tag || 'div');
            if ($string.isNullOrEmpty(options.id) == false) {
                el.id = options.id;
            }

            if ($object.isNullOrUndefined(options.styles) == false) {
                $manipulation.addStyle(el, options.styles);
            }

            if ($string.isNullOrEmpty(options.className) == false) {
                el.className = options.className;
            }

            if ($string.isNullOrEmpty(options.classNames) == false) {
                $manipulation.addClass(el, options.classNames);
            }

            if ($object.isNullOrUndefined(options.attributes) == false) {
                for (var prop in options.attributes) {
                    el.setAttribute(prop, options.attributes[prop]);
                }
            }

            if ($object.isNullOrUndefined(options.data) == false) {
                el.setAttribute('dataset', JSON.stringify(options.data));
            }

            if ($object.isNullOrUndefined(options.value) == false) {
                $manipulation.value(el, options.value);
            }

            if ($object.isNullOrUndefined(options.text) == false) {
                $manipulation.innerText(el, options.text);
            }

            if ($object.isNullOrUndefined(options.content) == false) {
                $manipulation.textContent(el, options.content);
            }

            if ($object.isNullOrUndefined(options.html) == false) {
                $manipulation.innerHTML(el, options.html);
            }

            return el;
        },

        each(array, handler) {
            if ($object.isNullOrUndefined(array) == false) {
                if ($object.isArray(array) == true && $object.isFunction(handler) == true) {
                    for (var i = 0, length = array.length; i < length; i++) {
                        handler(array[i], i);
                    }
                }
            }
        },

        setActive(el, value) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(value) == true) {
                    el.classList.add('active');
                }
                else {
                    el.classList.remove('active');
                }
            }
        },

        setSelected(el, value, multiple) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(multiple) == false) {
                    var siblingELs = $manipulation.siblings(el);
                    if ($object.isNullOrUndefined(siblingELs) == false) {
                        $manipulation.each(siblingELs, (itemEL, index) => {
                            itemEL.selected = false;
                            itemEL.removeAttribute('selected');
                        });
                    }
                }

                if ($string.toBoolean(value) == true) {
                    el.selected = true;
                    el.setAttribute('selected', 'selected');
                }
                else {
                    el.selected = false;
                    el.removeAttribute('selected');
                }
            }
        },

        setChecked(el, value, multiple) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                if ($string.toBoolean(multiple) == false) {
                    var siblingELs = $manipulation.siblings(el);
                    if ($object.isNullOrUndefined(siblingELs) == false) {
                        $manipulation.each(siblingELs, (itemEL, index) => {
                            itemEL.checked = false;
                            itemEL.removeAttribute('checked');
                        });
                    }
                }

                if ($string.toBoolean(value) == true) {
                    el.checked = true;
                    el.setAttribute('checked', 'checked');
                }
                else {
                    el.checked = false;
                    el.removeAttribute('checked');
                }
            }
        },

        getClassRegEx(css) {
            return new RegExp('(^|\\s)' + css + '(\\s|$)');
        }
    });
    syn.$m = $manipulation;
})(globalRoot);

/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $dimension = context.$dimension || new syn.module();
    var document = context.document;

    $dimension.extend({
        version: '1.0.0',

        getDocumentSize() {
            return {
                width: Math.max(
                    document.body.scrollWidth, document.documentElement.scrollWidth,
                    document.body.offsetWidth, document.documentElement.offsetWidth,
                    document.body.clientWidth, document.documentElement.clientWidth
                ),
                height: Math.max(
                    document.body.scrollHeight, document.documentElement.scrollHeight,
                    document.body.offsetHeight, document.documentElement.offsetHeight,
                    document.body.clientHeight, document.documentElement.clientHeight
                ),
                frameWidth: document.documentElement.clientWidth || document.body.clientWidth || 0,
                frameHeight: document.documentElement.clientHeight || document.body.clientHeight || 0
            };
        },

        getWindowSize() {
            return {
                width: globalRoot.innerWidth,
                height: globalRoot.innerHeight
            };
        },

        getScrollPosition(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == true) {
                result = {
                    left: document.documentElement.scrollLeft || document.body.scrollLeft || 0,
                    top: document.documentElement.scrollTop || document.body.scrollTop || 0
                };
            }
            else {
                result = {
                    left: el.pageXOffset || el.scrollLeft || 0,
                    top: el.pageYOffset || el.scrollTop || 0
                };
            }

            return result;
        },

        getMousePosition(evt) {
            evt = evt || context.event || top.context.event;
            var scroll = syn.$d.getScrollPosition();
            return {
                x: evt.pageX || evt.clientX + scroll.left || 0,
                y: evt.pageY || evt.clientY + scroll.top || 0,
                relativeX: evt.layerX || evt.offsetX || 0,
                relativeY: evt.layerY || evt.offsetY || 0
            };
        },

        offset(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var rect = el.getBoundingClientRect();
                var scrollLeft = context.pageXOffset || document.documentElement.scrollLeft;
                var scrollTop = context.pageYOffset || document.documentElement.scrollTop;
                result = {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            }

            return result;
        },

        offsetLeft(el) {
            var result = 0;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                while (typeof el !== 'undefined' && el && el.parentElement !== context) {
                    if (el.offsetLeft) {
                        result += el.offsetLeft;
                    }
                    el = el.parentElement;
                }
            }

            return result;
        },

        parentOffsetLeft(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            el = el || top.document.documentElement || top.document.body;
            return el.parentElement === el.offsetParent ? el.offsetLeft : (syn.$d.offsetLeft(el) - syn.$d.offsetLeft(el.parentElement));
        },

        offsetTop(el) {
            var result = 0;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                while (typeof el !== 'undefined' && el && el.parentElement !== context) {
                    if (el.offsetTop) {
                        result += el.offsetTop;
                    }
                    el = el.parentElement;
                }
            }

            return result;
        },

        parentOffsetTop(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            el = el || top.document.documentElement || top.document.body;
            return el.parentElement === el.offsetParent ? el.offsetTop : (syn.$d.offsetTop(el) - syn.$d.offsetTop(el.parentElement));
        },

        getSize(el) {
            var result = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false) {
                var styles = context.getComputedStyle(el);
                result = {
                    width: el.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight),
                    height: el.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom),
                    clientWidth: el.clientWidth,
                    clientHeight: el.clientHeight,
                    offsetWidth: el.offsetWidth,
                    offsetHeight: el.offsetHeight,
                    marginWidth: el.offsetWidth + parseFloat(styles.marginLeft) + parseFloat(styles.marginRight),
                    marginHeight: el.offsetHeight + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom),
                };
            }

            return result;
        },

        measureWidth(text, fontSize) {
            var el = document.createElement('div');

            el.style.position = 'absolute';
            el.style.visibility = 'hidden';
            el.style.whiteSpace = 'nowrap';
            el.style.left = '-9999px';

            if (fontSize) {
                el.style.fontSize = fontSize;
            }
            el.innerText = text;

            document.body.appendChild(el);
            var width = context.getComputedStyle(el).width;
            document.body.removeChild(el);
            return width;
        },

        measureHeight(text, width, fontSize) {
            var el = document.createElement('div');

            el.style.position = 'absolute';
            el.style.visibility = 'hidden';
            el.style.width = width;
            el.style.left = '-9999px';

            if (fontSize) {
                el.style.fontSize = fontSize;
            }
            el.innerText = text;

            document.body.appendChild(el);
            var height = context.getComputedStyle(el).height;
            document.body.removeChild(el);
            return height;
        },

        measureSize(text, fontSize) {
            if ($object.isNullOrUndefined(text) == true) {
                return null;
            }

            var width = syn.$d.measureWidth(text, fontSize);
            return {
                width: width,
                height: syn.$d.measureHeight(text, width, fontSize)
            };
        }
    });
    syn.$d = $dimension;
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $crytography = context.$crytography || new syn.module();

    $crytography.extend({
        version: '1.0.0',

        base64Encode(val) {
            if (globalRoot.devicePlatform === 'node') {
                return Buffer.from(val).toString('base64');
            }
            else {
                return btoa(encodeURIComponent(val).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                    return String.fromCharCode(parseInt(p1, 16));
                }));
            }
        },

        base64Decode(val) {
            if (globalRoot.devicePlatform === 'node') {
                return Buffer.from(val, 'base64').toString();
            }
            else {
                return decodeURIComponent(atob(val).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            }
        },

        utf8Encode(plainString) {
            if (typeof plainString != 'string') {
                throw new TypeError('parameter is not a plain string');
            }

            var utf8String = plainString.replace(/[\u0080-\u07ff]/g, function (c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
            }).replace(/[\u0800-\uffff]/g,
                function (c) {
                    var cc = c.charCodeAt(0);
                    return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
                });
            return utf8String;
        },

        utf8Decode(utf8String) {
            if (typeof utf8String != 'string') {
                throw new TypeError('parameter is not a utf8 string');
            }

            var plainString = utf8String.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,
                function (c) {
                    var cc = (c.charCodeAt(0) & 0x0f) << 12 | (c.charCodeAt(1) & 0x3f) << 6 | c.charCodeAt(2) & 0x3f;
                    return String.fromCharCode(cc);
                }).replace(/[\u00c0-\u00df][\u0080-\u00bf]/g,
                    function (c) {
                        var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                        return String.fromCharCode(cc);
                    });
            return plainString;
        },

        sha256(s) {
            var chrsz = 8;
            var hexcase = 0;

            function safe_add(x, y) {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            }

            function S(X, n) { return (X >>> n) | (X << (32 - n)); }
            function R(X, n) { return (X >>> n); }
            function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
            function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
            function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
            function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
            function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
            function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

            function core_sha256(m, l) {

                var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1,
                    0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
                    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786,
                    0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
                    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147,
                    0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
                    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B,
                    0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
                    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
                    0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
                    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);

                var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);

                var W = new Array(64);
                var a, b, c, d, e, f, g, h, i, j;
                var T1, T2;

                m[l >> 5] |= 0x80 << (24 - l % 32);
                m[((l + 64 >> 9) << 4) + 15] = l;

                for (var i = 0; i < m.length; i += 16) {
                    a = HASH[0];
                    b = HASH[1];
                    c = HASH[2];
                    d = HASH[3];
                    e = HASH[4];
                    f = HASH[5];
                    g = HASH[6];
                    h = HASH[7];

                    for (var j = 0; j < 64; j++) {
                        if (j < 16) W[j] = m[j + i];
                        else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);

                        T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                        T2 = safe_add(Sigma0256(a), Maj(a, b, c));

                        h = g;
                        g = f;
                        f = e;
                        e = safe_add(d, T1);
                        d = c;
                        c = b;
                        b = a;
                        a = safe_add(T1, T2);
                    }

                    HASH[0] = safe_add(a, HASH[0]);
                    HASH[1] = safe_add(b, HASH[1]);
                    HASH[2] = safe_add(c, HASH[2]);
                    HASH[3] = safe_add(d, HASH[3]);
                    HASH[4] = safe_add(e, HASH[4]);
                    HASH[5] = safe_add(f, HASH[5]);
                    HASH[6] = safe_add(g, HASH[6]);
                    HASH[7] = safe_add(h, HASH[7]);
                }
                return HASH;
            }

            function str2binb(str) {
                var bin = Array();
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < str.length * chrsz; i += chrsz) {
                    bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
                }
                return bin;
            }

            function binb2hex(binarray) {
                var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                        hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
                }
                return str;
            }

            s = syn.$c.utf8Encode(s);
            return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
        },

        encrypt(value, key) {
            if ($object.isNullOrUndefined(value) == true) {
                return null;
            }

            var keyLength = 6;
            if ($string.isNullOrEmpty(key) == true) {
                key = '';
                key = syn.$c.sha256(key).substring(0, keyLength);
            }
            else {
                keyLength = key.length;
            }

            key = syn.$c.sha256(key).substring(0, keyLength);

            var encrypt = function (content, passcode) {
                var result = [];
                var passLen = passcode.length;
                for (var i = 0; i < content.length; i++) {
                    var passOffset = i % passLen;
                    var calAscii = (content.charCodeAt(i) + passcode.charCodeAt(passOffset));
                    result.push(calAscii);
                }
                return JSON.stringify(result);
            };

            return encodeURIComponent(syn.$c.base64Encode(encrypt(value, key) + '.' + key));
        },

        decrypt(value, key) {
            var result = null;

            if ($object.isNullOrUndefined(value) == true) {
                return result;
            }

            try {
                value = syn.$c.base64Decode(decodeURIComponent(value));

                if (value.indexOf('.') === -1) {
                    return result;
                }

                var source = value.split('.');
                var decrypt = function (content, passcode) {
                    var str = '';

                    var keyLength = 6;
                    if ($string.isNullOrEmpty(key) == true) {
                        key = '';
                        key = syn.$c.sha256(key).substring(0, keyLength);
                    }
                    else {
                        keyLength = key.length;
                    }

                    if (passcode == syn.$c.sha256(key).substring(0, keyLength)) {
                        var result = [];
                        var codesArr = JSON.parse(content);
                        var passLen = passcode.length;
                        for (var i = 0; i < codesArr.length; i++) {
                            var passOffset = i % passLen;
                            var calAscii = (codesArr[i] - passcode.charCodeAt(passOffset));
                            result.push(calAscii);
                        }
                        for (var i = 0; i < result.length; i++) {
                            var ch = String.fromCharCode(result[i]);
                            str += ch;
                        }
                    }

                    return str;
                }

                result = decrypt(source[0], source[1]);
            } catch (error) {
                syn.$l.eventLog('$c.decrypt', error, 'Error');
            }
            return result;
        },

        LZString: (function () {
            var f = String.fromCharCode;
            var keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
            var baseReverseDic = {};

            function getBaseValue(alphabet, character) {
                if (!baseReverseDic[alphabet]) {
                    baseReverseDic[alphabet] = {};
                    for (var i = 0; i < alphabet.length; i++) {
                        baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                    }
                }
                return baseReverseDic[alphabet][character];
            }

            var LZString = {
                compressToBase64(input) {
                    if (input == null) return '';
                    var res = LZString._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
                    switch (res.length % 4) {
                        default:
                        case 0: return res;
                        case 1: return res + '===';
                        case 2: return res + '==';
                        case 3: return res + '=';
                    }
                },

                decompressFromBase64(input) {
                    if (input == null) return '';
                    if (input == '') return null;
                    return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
                },

                compressToUTF16(input) {
                    if (input == null) return '';
                    return LZString._compress(input, 15, function (a) { return f(a + 32); }) + ' ';
                },

                decompressFromUTF16(compressed) {
                    if (compressed == null) return '';
                    if (compressed == '') return null;
                    return LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; });
                },

                compressToUint8Array(uncompressed) {
                    var compressed = LZString.compress(uncompressed);
                    var buf = new Uint8Array(compressed.length * 2);

                    for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                        var current_value = compressed.charCodeAt(i);
                        buf[i * 2] = current_value >>> 8;
                        buf[i * 2 + 1] = current_value % 256;
                    }
                    return buf;
                },

                decompressFromUint8Array(compressed) {
                    if ($object.isNullOrUndefined(compressed) == true) {
                        return LZString.decompress(compressed);
                    } else {
                        var buf = new Array(compressed.length / 2);
                        for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                            buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                        }

                        var result = [];
                        buf.forEach(function (c) {
                            result.push(f(c));
                        });
                        return LZString.decompress(result.join(''));
                    }
                },

                compressToEncodedURIComponent(input) {
                    if (input == null) return '';
                    return LZString._compress(input, 6, function (a) { return keyStrUriSafe.charAt(a); });
                },

                decompressFromEncodedURIComponent(input) {
                    if (input == null) return '';
                    if (input == '') return null;
                    input = input.replace(/ /g, '+');
                    return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
                },

                compress(uncompressed) {
                    return LZString._compress(uncompressed, 16, function (a) { return f(a); });
                },

                _compress(uncompressed, bitsPerChar, getCharFromInt) {
                    if (uncompressed == null) return '';
                    var i, value,
                        context_dictionary = {},
                        context_dictionaryToCreate = {},
                        context_c = '',
                        context_wc = '',
                        context_w = '',
                        context_enlargeIn = 2,
                        context_dictSize = 3,
                        context_numBits = 2,
                        context_data = [],
                        context_data_val = 0,
                        context_data_position = 0,
                        ii;

                    for (ii = 0; ii < uncompressed.length; ii += 1) {
                        context_c = uncompressed.charAt(ii);
                        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                            context_dictionary[context_c] = context_dictSize++;
                            context_dictionaryToCreate[context_c] = true;
                        }

                        context_wc = context_w + context_c;
                        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                            context_w = context_wc;
                        } else {
                            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                                if (context_w.charCodeAt(0) < 256) {
                                    for (i = 0; i < context_numBits; i++) {
                                        context_data_val = (context_data_val << 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                    }
                                    value = context_w.charCodeAt(0);
                                    for (i = 0; i < 8; i++) {
                                        context_data_val = (context_data_val << 1) | (value & 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = value >> 1;
                                    }
                                } else {
                                    value = 1;
                                    for (i = 0; i < context_numBits; i++) {
                                        context_data_val = (context_data_val << 1) | value;
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = 0;
                                    }
                                    value = context_w.charCodeAt(0);
                                    for (i = 0; i < 16; i++) {
                                        context_data_val = (context_data_val << 1) | (value & 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = value >> 1;
                                    }
                                }
                                context_enlargeIn--;
                                if (context_enlargeIn == 0) {
                                    context_enlargeIn = Math.pow(2, context_numBits);
                                    context_numBits++;
                                }
                                delete context_dictionaryToCreate[context_w];
                            } else {
                                value = context_dictionary[context_w];
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }


                            }
                            context_enlargeIn--;
                            if (context_enlargeIn == 0) {
                                context_enlargeIn = Math.pow(2, context_numBits);
                                context_numBits++;
                            }

                            context_dictionary[context_wc] = context_dictSize++;
                            context_w = String(context_c);
                        }
                    }

                    if (context_w !== '') {
                        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                            if (context_w.charCodeAt(0) < 256) {
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 8; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            } else {
                                value = 1;
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1) | value;
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                    value = 0;
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 16; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            }
                            context_enlargeIn--;
                            if (context_enlargeIn == 0) {
                                context_enlargeIn = Math.pow(2, context_numBits);
                                context_numBits++;
                            }
                            delete context_dictionaryToCreate[context_w];
                        } else {
                            value = context_dictionary[context_w];
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }


                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                    }

                    value = 2;
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }

                    while (true) {
                        context_data_val = (context_data_val << 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data.push(getCharFromInt(context_data_val));
                            break;
                        }
                        else context_data_position++;
                    }
                    return context_data.join('');
                },

                decompress(compressed) {
                    if (compressed == null) return '';
                    if (compressed == '') return null;
                    return LZString._decompress(compressed.length, 32768, function (index) { return compressed.charCodeAt(index); });
                },

                _decompress(length, resetValue, getNextValue) {
                    var dictionary = [],
                        next,
                        enlargeIn = 4,
                        dictSize = 4,
                        numBits = 3,
                        entry = '',
                        result = [],
                        i,
                        w,
                        bits, resb, maxpower, power,
                        c,
                        data = { val: getNextValue(0), position: resetValue, index: 1 };

                    for (i = 0; i < 3; i += 1) {
                        dictionary[i] = i;
                    }

                    bits = 0;
                    maxpower = Math.pow(2, 2);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }

                    switch (next = bits) {
                        case 0:
                            bits = 0;
                            maxpower = Math.pow(2, 8);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            c = f(bits);
                            break;
                        case 1:
                            bits = 0;
                            maxpower = Math.pow(2, 16);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            c = f(bits);
                            break;
                        case 2:
                            return '';
                    }
                    dictionary[3] = c;
                    w = c;
                    result.push(c);
                    while (true) {
                        if (data.index > length) {
                            return '';
                        }

                        bits = 0;
                        maxpower = Math.pow(2, numBits);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }

                        switch (c = bits) {
                            case 0:
                                bits = 0;
                                maxpower = Math.pow(2, 8);
                                power = 1;
                                while (power != maxpower) {
                                    resb = data.val & data.position;
                                    data.position >>= 1;
                                    if (data.position == 0) {
                                        data.position = resetValue;
                                        data.val = getNextValue(data.index++);
                                    }
                                    bits |= (resb > 0 ? 1 : 0) * power;
                                    power <<= 1;
                                }

                                dictionary[dictSize++] = f(bits);
                                c = dictSize - 1;
                                enlargeIn--;
                                break;
                            case 1:
                                bits = 0;
                                maxpower = Math.pow(2, 16);
                                power = 1;
                                while (power != maxpower) {
                                    resb = data.val & data.position;
                                    data.position >>= 1;
                                    if (data.position == 0) {
                                        data.position = resetValue;
                                        data.val = getNextValue(data.index++);
                                    }
                                    bits |= (resb > 0 ? 1 : 0) * power;
                                    power <<= 1;
                                }
                                dictionary[dictSize++] = f(bits);
                                c = dictSize - 1;
                                enlargeIn--;
                                break;
                            case 2:
                                return result.join('');
                        }

                        if (enlargeIn == 0) {
                            enlargeIn = Math.pow(2, numBits);
                            numBits++;
                        }

                        if (dictionary[c]) {
                            entry = dictionary[c];
                        } else {
                            if (c === dictSize) {
                                entry = w + w.charAt(0);
                            } else {
                                return null;
                            }
                        }
                        result.push(entry);

                        dictionary[dictSize++] = w + entry.charAt(0);
                        enlargeIn--;

                        w = entry;

                        if (enlargeIn == 0) {
                            enlargeIn = Math.pow(2, numBits);
                            numBits++;
                        }

                    }
                }
            };
            return LZString;
        })()
    });
    syn.$c = $crytography;
})(globalRoot);

/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $keyboard = context.$keyboard || new syn.module();

    $keyboard.extend({
        version: '1.0.0',

        keyCodes: {
            'backspace': 8,
            'tab': 9,
            'enter': 13,
            'shift': 16,
            'control': 17,
            'alt': 18,
            'capslock': 20,
            'escape': 27,
            'space': 32,
            'pageup': 33,
            'pagedown': 34,
            'end': 35,
            'home': 36,
            'left': 37,
            'up': 38,
            'right': 39,
            'down': 40,
            'delete': 46,
            'semicolon': 186,
            'colon': 186,
            'equal': 187,
            'plus': 187,
            'comma': 188,
            'less': 188,
            'minus': 189,
            'underscore': 189,
            'period': 190,
            'greater': 190,
            'slash': 191,
            'questionmark': 191,
            'backtick': 192,
            'tilde': 192,
            'openingsquarebracket': 219,
            'openingcurlybracket': 219,
            'backslash': 220,
            'pipe': 220,
            'closingsquarebracket': 221,
            'closingcurlybracket': 221,
            'singlequote': 222,
            'doublequote': 222,
            'clear': 12,
            'meta': 91,
            'contextmenu': 93,
            'numpad0': 96,
            'numpad1': 97,
            'numpad2': 98,
            'numpad3': 99,
            'numpad4': 100,
            'numpad5': 101,
            'numpad6': 102,
            'numpad7': 103,
            'numpad8': 104,
            'numpad9': 105,
            'multiply': 106,
            'add': 107,
            'subtract': 109,
            'decimal': 110,
            'divide': 111,
            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,
            'a': 65,
            'b': 66,
            'c': 67,
            'd': 68,
            'e': 69,
            'f': 70,
            'g': 71,
            'h': 72,
            'i': 73,
            'j': 74,
            'k': 75,
            'l': 76,
            'm': 77,
            'n': 78,
            'o': 79,
            'p': 80,
            'q': 81,
            'r': 82,
            's': 83,
            't': 84,
            'u': 85,
            'v': 86,
            'w': 87,
            'x': 88,
            'y': 89,
            'z': 90,
            'f1': 112,
            'f2': 113,
            'f3': 114,
            'f4': 115,
            'f5': 116,
            'f6': 117,
            'f7': 118,
            'f8': 119,
            'f9': 120,
            'f10': 121,
            'f11': 122,
            'f12': 123
        },

        targetEL: null,
        elements: {},

        setElement(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                var keyObject = $keyboard.elements[el.id];
                if ($object.isNullOrUndefined(keyObject) == true) {
                    keyObject = {};
                    keyObject['keydown'] = {};
                    keyObject['keyup'] = {};

                    function handler(evt) {
                        var eventType = evt.type;
                        var keyCode = evt.keyCode;

                        if (keyObject[eventType][keyCode] != null) {
                            var val = keyObject[eventType][keyCode](evt);
                            if (val === false) {
                                evt.returnValue = false;
                                evt.cancel = true;
                                if (evt.preventDefault) {
                                    evt.preventDefault();
                                }

                                if (evt.stopPropagation) {
                                    evt.stopPropagation();
                                }
                                return false;
                            }
                        }
                    };

                    syn.$l.addEvent(el, 'keydown', handler);
                    syn.$l.addEvent(el, 'keyup', handler);

                    $keyboard.elements[el.id] = keyObject;
                }

                $keyboard.targetEL = el;
            }

            return $keyboard;
        },

        addKeyCode(keyType, keyCode, func) {
            if ($keyboard.targetEL) {
                var keyObject = $keyboard.elements[$keyboard.targetEL.id];
                if ($object.isNullOrUndefined(keyObject) == false) {
                    keyObject[keyType][keyCode] = func;
                }
            }
            return $keyboard;
        },

        removeKeyCode(keyType, keyCode) {
            if ($keyboard.targetEL) {
                var keyObject = $keyboard.elements[$keyboard.targetEL.id];
                if ($object.isNullOrUndefined(keyObject) == false) {
                    keyObject[keyType][keyCode] = null;
                    delete keyObject[keyType][keyCode];
                }
            }
            return $keyboard;
        }
    });
    syn.$k = $keyboard;
})(globalRoot);

/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $validation = context.$validation || new syn.module();

    $validation.extend({
        version: '1.0.0',
        isContinue: true,
        messages: [],
        targetEL: null,
        elements: {},

        initializeValidObject(el) {
            var validObject = $validation.elements[el.id];
            if ($object.isNullOrUndefined(validObject) == true) {
                validObject = {};
                validObject['pattern'] = {};
                validObject['range'] = {};
                validObject['custom'] = {};

                $validation.elements[el.id] = validObject;
            }
        },

        setElement(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                $validation.initializeValidObject(el);
                $validation.targetEL = el;
            }

            return $validation;
        },

        required(el, isRequired, message) {
            if ($string.isNullOrEmpty(message) == false) {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                $validation.setElement(el);
                if ($object.isNullOrUndefined(el) == false) {
                    el.required = $string.toBoolean(isRequired);
                    el.message = message;
                }
            }
            else {
                syn.$l.eventLog('$v.required', 'message 확인 필요', 'Information');
            }
            return $validation;
        },

        pattern(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($object.isNullOrUndefined(options.expr) == false && $string.isNullOrEmpty(options.message) == false) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['pattern'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.pattern', 'options.expr, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.pattern', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        range(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($string.isNumber(options.min) == true
                    && $string.isNumber(options.max) == true
                    && $string.isNullOrEmpty(options.minOperator) == false
                    && $string.isNullOrEmpty(options.maxOperator) == false
                    && $string.isNullOrEmpty(options.message) == false
                ) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['range'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.pattern', 'options.min, options.minOperator, options.max, options.maxOperator, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.range', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        custom(el, validID, options) {
            if ($object.isNullOrUndefined(options) == false) {
                if ($object.isNullOrUndefined(options.functionName) == false && $string.isNullOrEmpty(options.message) == false) {
                    el = $object.isString(el) == true ? syn.$l.get(el) : el;
                    $validation.setElement(el);
                    if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                        var validObject = $validation.elements[el.id];
                        validObject['custom'][validID] = options;
                    }
                }
                else {
                    syn.$l.eventLog('$v.custom', 'options.functionName, options.message 확인 필요', 'Information');
                }
            }
            else {
                syn.$l.eventLog('$v.custom', 'options 확인 필요', 'Information');
            }
            return $validation;
        },

        removeValidate(validType, validID) {
            if ($validation.targetEL) {
                $validation.initializeValidObject($validation.targetEL);
                var validObject = $validation.elements[$validation.targetEL.id];

                try {
                    validObject[validType][validID] = null;
                    delete validObject[validType][validID];
                } catch {
                }
            }
            return $validation;
        },

        remove(validID) {
            if ($validation.targetEL) {
                var validObject = $validation.elements[$validation.targetEL.id];
                if ($object.isNullOrUndefined(validObject) == false) {
                    validObject['pattern'][validID] = null;
                    delete validObject['pattern'][validID];
                    validObject['range'][validID] = null;
                    delete validObject['range'][validID];
                    validObject['custom'][validID] = null;
                    delete validObject['custom'][validID];
                }
            }
            return $validation;
        },

        clear() {
            $validation.isContinue = false;
            $validation.messages = [];
            $validation.targetEL = null;
            $validation.elements = {};

            return $validation;
        },

        validateControl(el) {
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            $validation.setElement(el);
            if ($object.isNullOrUndefined(el) == false && $string.isNullOrEmpty(el.id) == false) {
                if ($string.toBoolean(el.required) == true) {
                    if (el.value.length > 0) {
                        result = true;
                    }
                    else {
                        result = false;
                        $validation.messages.push(el.message);

                        if ($validation.isContinue == false) {
                            return result;
                        }
                    }
                }

                var validObject = $validation.elements[el.id];
                if ($object.isNullOrUndefined(validObject) == false) {
                    for (var validType in validObject) {
                        if (validType === 'pattern') {
                            var pattern = null;
                            var expr = null;

                            for (var validID in validObject[validType]) {
                                var pattern = validObject[validType][validID];
                                var expr = pattern.expr;
                                result = expr.test(el.value);

                                if (result == false) {
                                    $validation.messages.push(pattern.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                        else if (validType === 'range') {
                            var range = null;
                            var min = null;
                            var max = null;
                            var minOperator = null;
                            var maxOperator = null;

                            for (var validID in validObject[validType]) {
                                range = validObject[validType][validID];
                                min = range.min;
                                max = range.max;
                                minOperator = range.minOperator;
                                maxOperator = range.maxOperator;

                                try {
                                    var value = el.value.trim();
                                    if ($string.isNumber(value) == true) {
                                        result = eval(`${min} ${minOperator} ${value} && ${max} ${maxOperator} ${value}`);
                                    }
                                    else {
                                        result = false;
                                    }
                                } catch (error) {
                                    syn.$l.eventLog('$v.validateControl', 'elID: "{0}" 유효성 range 검사 오류 '.format(el.id) + error.message, 'Warning');
                                }

                                if (result == false) {
                                    $validation.messages.push(range.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                        else if (validType === 'custom') {
                            var custom = null;
                            var functionName = null;
                            var parameters = null;

                            for (var validID in validObject[validType]) {
                                custom = validObject[validType][validID];
                                functionName = custom.functionName;
                                parameters = [];

                                for (var parameterName in custom) {
                                    if (parameterName !== 'functionName') {
                                        parameters[parameterName] = custom[parameterName];
                                    }
                                }

                                try {
                                    if ($this) {
                                        result = eval('window[syn.$w.pageScript]["method"]["' + functionName + '"]').call($this, parameters);
                                    }
                                    else {
                                        result = eval(functionName).call(globalRoot, parameters);
                                    }
                                } catch (error) {
                                    syn.$l.eventLog('$v.validateControl', 'elID: "{0}" 유효성 custom 검사 오류 '.format(el.id) + error.message, 'Warning');
                                }

                                if (result == false) {
                                    $validation.messages.push(custom.message);

                                    if ($validation.isContinue == false) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return $validation.messages.length === 0;
        },

        validateControls(els) {
            var result = true;
            var el = null;

            if (els.type) {
                el = els;
                result = $validation.validateControl(el);
            }
            else if (els.length) {
                for (var i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    result = $validation.validateControl(el);
                }
            }

            return result;
        },

        validateForm() {
            var result = false;
            for (var elID in $validation.elements) {
                result = $validation.validateControl(elID);
            }

            return result;
        },

        toMessages() {
            var result = [];
            for (var i = 0; i < $validation.messages.length; i++) {
                result.push($validation.messages[i]);
            }

            $validation.messages = [];
            return result.join('\n');
        },

        valueType: new function () {
            this.valid = 0;
            this.valueMissing = 1;
            this.typeMismatch = 2;
            this.patternMismatch = 3;
            this.tooLong = 4;
            this.rangeUnderflow = 5;
            this.rangeOverflow = 6;
            this.stepMismatch = 7;
        },

        validType: new function () {
            this.required = 0;
            this.pattern = 1;
            this.range = 2;
            this.custom = 3;
        },

        regexs: new function () {
            this.alphabet = /^[a-zA-Z]*$/;
            this.juminNo = /^(?:[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1,2][0-9]|3[0,1]))-?[1-4][0-9]{6}$/;
            this.numeric = /^-?[0-9]*(\.[0-9]+)?$/;
            this.email = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i;
            this.url = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i;
            this.ipAddress = /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;
            this.date = /^\d{4}-\d{2}-\d{2}$/;
            this.mobilePhone = /^01([0|1|6|7|8|9])(\d{7,8})/;
            this.seoulPhone = /^02(\d{7,8})/;
            this.areaPhone = /^0([0|3|4|5|6|7|8|])([0|1|2|3|4|5|])(\d{7,8})/;
            this.onesPhone = /^050([2|5])(\d{7,8})/;
            this.float = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
            this.isoDate = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
        }
    });
    syn.$v = $validation;
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $date = context.$date || new syn.module();
    var $array = context.$array || new syn.module();
    var $string = context.$string || new syn.module();
    var $number = context.$number || new syn.module();
    var $object = context.$object || new syn.module();

    (function () {
        if (!Function.prototype.clone) {
            Function.prototype.clone = function () {
                var that = this;
                var result = function T() {
                    return that.apply(this, arguments);
                };

                for (var key in this) {
                    result[key] = this[key];
                }

                return result;
            };
        }

        if (!Object.assign) {
            Object.assign = function clone(obj) {
                if (obj === null || typeof (obj) !== 'object') {
                    return obj;
                }

                var copy = obj.constructor();

                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) {
                        copy[attr] = obj[attr];
                    }
                }

                return copy;
            }
        }

        if (!Object.entries) {
            Object.entries = function (obj) {
                var ownProps = Object.keys(obj),
                    i = ownProps.length,
                    resArray = new Array(i);
                while (i--) {
                    resArray[i] = [ownProps[i], obj[ownProps[i]]];
                }
                return resArray;
            }
        }

        if (!String.prototype.trim) {
            String.prototype.trim = function () {
                var val = this.replace(/^\s+/, '');
                for (var i = val.length - 1; i > 0; i--) {
                    if (/\S/.test(val.charAt(i))) {
                        val = val.substring(0, i + 1);
                        break;
                    }
                }

                return val;
            };
        }

        if (!String.prototype.includes) {
            String.prototype.includes = function (val) {
                return this.indexOf(val) !== -1;
            };
        }

        if (!String.prototype.format) {
            String.prototype.format = function () {
                var val = this;
                for (var i = 0, len = arguments.length; i < len; i++) {
                    var exp = new RegExp('\{' + i.toString() + '+?\}', 'g');
                    val = val.replace(exp, arguments[i]);
                }

                return val;
            };
        }

        if (globalRoot.devicePlatform === 'node') {
        }
        else {
            if (!Element.prototype.matches) {
                Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
            }

            if (!Element.prototype.closest) {
                Element.prototype.closest = function (s) {
                    var el = this;

                    do {
                        if (el.matches(s)) {
                            return el;
                        }
                        el = el.parentElement || el.parentNode;
                    } while (el !== null && el.nodeType === 1);
                    return null;
                };
            }
        }
    })();

    $date.extend({
        version: '1.0.0',
        interval: {
            year: 1000 * 60 * 60 * 24 * 365,
            week: 1000 * 60 * 60 * 24 * 7,
            day: 1000 * 60 * 60 * 24,
            hour: 60000 * 60,
            minute: 60000,
            second: 1000,
        },

        now() {
            return new Date();
        },

        clone(date) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime());
            }
            else if ($object.isString(date) == true) {
                result = new Date(date);
            }
            return result;
        },

        isBetween(date, start, end) {
            var result = false;
            if (date instanceof Date && start instanceof Date && end instanceof Date) {
                result = date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
            }

            return result;
        },

        equals(date, targetDate) {
            var result = false;
            if (date instanceof Date && targetDate instanceof Date) {
                result = (date.getTime() == targetDate.getTime());
            }

            return result;
        },

        equalDay(date, targetDate) {
            var result = false;
            if (date instanceof Date && targetDate instanceof Date) {
                result = date.toDateString() == targetDate.toDateString();
            }

            return result;
        },

        isToday(date) {
            var result = false;
            if (date instanceof Date) {
                result = $date.equalDay(date, new Date());
            }
            return result;
        },

        toString(date, format) {
            var result = '';
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate().toString().length == 1 ? '0' + date.getDate().toString() : date.getDate().toString();
            var hours = date.getHours().toString().length == 1 ? '0' + date.getHours().toString() : date.getHours().toString();
            var minutes = date.getMinutes().toString().length == 1 ? '0' + date.getMinutes().toString() : date.getMinutes().toString();
            var seconds = date.getSeconds().toString().length == 1 ? '0' + date.getSeconds().toString() : date.getSeconds().toString();
            var milliseconds = date.getMilliseconds().toString().padStart(3, '0');
            var weekNames = ['일', '월', '화', '수', '목', '금', '토'];

            month = month.toString().length == 1 ? '0' + month.toString() : month.toString();

            switch (format) {
                case 'd':
                    result = year.toString().concat('-', month, '-', day);
                    break;
                case 't':
                    result = hours.toString().concat(':', minutes, ':', seconds);
                    break;
                case 'a':
                    result = year.toString().concat('-', month, '-', day, ' ', hours, ':', minutes, ':', seconds);
                    break;
                case 'f':
                    result = year.toString().concat(month, day, hours, minutes, seconds, milliseconds);
                    break;
                case 's':
                    result = hours.toString().concat(minutes, seconds, milliseconds);
                    break;
                case 'n':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = year.toString().concat('년 ', month, '월 ', day, '일 ', '(', dayOfWeek, ')');
                    break;
                case 'mdn':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = month.toString().concat('월 ', day, '일');
                    break;
                case 'w':
                    var weekNumber = 1;
                    var weekOfMonths = $date.weekOfMonth(year, month);
                    var currentDate = Number($date.toString(date, 'd').replace(/-/g, ''));
                    for (var i = 0; i < weekOfMonths.length; i++) {
                        var weekOfMonth = weekOfMonths[i];
                        var startDate = Number(weekOfMonth.weekStartDate.replace(/-/g, ''));
                        var endDate = Number(weekOfMonth.weekEndDate.replace(/-/g, ''));

                        if (currentDate >= startDate && currentDate <= endDate) {
                            weekNumber = (i + 1);
                            break;
                        }
                    }

                    result = weekNumber;
                    break;
                case 'wn':
                    result = weekNames[date.getDay()];
                    break;
                case 'm':
                    result = month;
                    break;
                case 'ym':
                    result = year.toString().concat('-', month);
                    break;
                default:
                    result = date.getDate().toString().padStart(2, '0');
            }

            return result;
        },

        addSecond(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.second));
            }
            return result;
        },

        addMinute(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.minute));
            }
            return result;
        },

        addHour(date, val) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.getTime() + (val * $date.interval.hour));
            }
            return result;
        },

        addDay(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setDate(date.getDate() + val));
            }
            return result;
        },

        addWeek(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setDate(date.getDate() + (val * 7)));
            }
            return result;
        },

        addMonth(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setMonth(date.getMonth() + val));
            }
            return result;
        },

        addYear(date, val) {
            var result = null;
            if (date instanceof Date) {
                var cloneDate = new Date(date.getTime());
                result = new Date(cloneDate.setFullYear(date.getFullYear() + val));
            }
            return result;
        },

        getFirstDate(date) {
            var result = null;
            if (date instanceof Date) {
                result = new Date(date.setDate(1));
            }
            return result;
        },

        getLastDate(date) {
            var result = null;
            if (date instanceof Date) {
                date = $date.addMonth(date, 1);
                return $date.addDay(new Date(date.setDate(1)), -1);
            }
            return result;
        },

        diff(start, end, interval) {
            var result = 0;
            if (start instanceof Date && end instanceof Date) {
                interval = interval || 'day';

                if (interval == 'month') {
                    result = end.getMonth() - start.getMonth() + 12 * (end.getFullYear() - start.getFullYear());
                }
                else if ($object.isNullOrUndefined($date.interval[interval]) == false) {
                    var diff = Math.abs(end - start)
                    result = Math.floor(diff / $date.interval[interval]);
                }
            }

            return result;
        },

        toTicks(date) {
            return ((date.getTime() * 10000) + 621355968000000000);
        },

        isDate(val) {
            var result = false;
            var scratch = null;
            if ($object.isString(val) == true) {
                scratch = new Date(val);
                if (scratch.toString() == 'NaN' || scratch.toString() == 'Invalid Date') {
                    if (syn.$b.isSafari == true && syn.$b.isChrome == false) {
                        var parts = val.match(/(\d+)/g);
                        scratch = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (scratch.toString() == 'NaN' || scratch.toString() == 'Invalid Date') {
                            result = false;
                        }
                        else {
                            result = true;
                        }
                    }
                    else {
                        result = false;
                    }
                }
                else {
                    result = true;
                }
            }

            return result;
        },

        isISOString(val) {
            var result = false;
            if ($date.isDate(val) == true) {
                var date = new Date(val);
                result = date.toISOString() === val;
            }

            return result;
        },

        weekOfMonth(year, month, weekStand) {
            var result = [];
            month = month || new Date().getMonth() + 1;
            weekStand = weekStand || 8;
            var date = new Date(year, month);

            var firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
            var week = null;

            var firstWeekEndDate = true;
            var thisMonthFirstWeek = firstDay.getDay();
            var numberPad = function (num, width) {
                num = String(num);
                return num.length >= width ? num : new Array(width - num.length + 1).join('0') + num;
            }

            for (var num = 1; num <= 6; num++) {
                if (lastDay.getMonth() != firstDay.getMonth()) {
                    break;
                }

                week = {};
                if (firstDay.getDay() <= 1) {
                    if (firstDay.getDay() == 0) {
                        firstDay.setDate(firstDay.getDate() + 1);
                    }

                    week.weekStartDate = firstDay.getFullYear().toString() + '-' + numberPad((firstDay.getMonth() + 1).toString(), 2) + '-' + numberPad(firstDay.getDate().toString(), 2);
                }

                if (weekStand > thisMonthFirstWeek) {
                    if (firstWeekEndDate) {
                        if (weekStand - firstDay.getDay() == 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }

                        if (weekStand - firstDay.getDay() > 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }

                        firstWeekEndDate = false;
                    } else {
                        firstDay.setDate(firstDay.getDate() + 6);
                    }
                } else {
                    firstDay.setDate(firstDay.getDate() + (6 - firstDay.getDay()) + weekStand);
                }

                if (typeof week.weekStartDate !== 'undefined') {
                    week.weekEndDate = firstDay.getFullYear().toString() + '-' + numberPad((firstDay.getMonth() + 1).toString(), 2) + '-' + numberPad(firstDay.getDate().toString(), 2);
                    result.push(week);
                }

                firstDay.setDate(firstDay.getDate() + 1);
            }

            return result;
        }
    });
    context.$date = $date;

    $string.extend({
        version: '1.0.0',

        toValue(value, defaultValue) {
            var result = '';
            if ($object.isNullOrUndefined(value) == true) {
                if ($string.isNullOrEmpty(defaultValue) == false) {
                    result = defaultValue.toString();
                }
            }
            else {
                result = value.toString();
            }

            return result;
        },

        br(val) {
            return val.replace(/(\r\n|\r|\n)/g, '<br />');
        },

        interpolate(text, json, options = null) {
            var result = null;

            if (json != null) {
                options = syn.$w.argumentsExtend({
                    defaultValue: null,
                    separator: '\n',
                }, options);

                var replaceFunc = function (text, item) {
                    return text.replace(/\#{([^{}]*)}/g,
                        function (pattern, key) {
                            var value = item[key];
                            var result = pattern;
                            if (typeof value === 'string' || typeof value === 'number') {
                                result = value;
                            }
                            else if ($object.isNullOrUndefined(value) == false) {
                                if ($object.isArray(value) == true) {
                                    result = value.join(', ');
                                }
                                else if ($object.isDate(value) == true) {
                                    result = $date.toString(value, 'a');
                                }
                                else if ($object.isBoolean(value) == true) {
                                    result = value.toString();
                                }
                            }
                            else {
                                result = options.defaultValue == null ? pattern : options.defaultValue;
                            }
                            return result;
                        }
                    )
                };

                if ($object.isArray(json) == false) {
                    result = replaceFunc(text, json);
                }
                else {
                    var values = [];
                    for (var key in json) {
                        var item = json[key];
                        values.push(replaceFunc(text, item));
                    }

                    result = values.join(options.separator);
                }
            }

            return result;
        },

        isNullOrEmpty(val) {
            if (val === undefined || val === null || val === '') {
                return true;
            }
            else {
                return false;
            }
        },

        sanitizeHTML(val, hasSpecialChar) {
            var result = '';
            hasSpecialChar = hasSpecialChar || true;

            if (hasSpecialChar == true) {
                result = val.replace(/<.[^<>]*?>/g, '')
                    .replace(/&nbsp;|&#160;/gi, ' ');
            }
            else {
                result = val.replace(/<.[^<>]*?>/g, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .replace(/[.(),;:!?%#$'\"_+=\/\-“”’]*/g, '');
            }

            return result.trim();
        },

        cleanHTML(val) {
            var el = document.createElement('div');
            el.innerHTML = val.replace(/\<br\s*\/\>/gim, '\n');
            return el.innerText.trim();
        },

        // 참조(http://www.ascii.cl/htmlcodes.htm)
        toHtmlChar(val) {
            return val.replace(/&/g, '&amp;').replace(/\'/g, '&quot;').replace(/\'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        toCharHtml(val) {
            return val.replace(/&amp;/g, '&').replace(/&quot;/g, '\'').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        },

        length(val) {
            var result = 0;
            for (var i = 0, len = val.length; i < len; i++) {
                if (val.charCodeAt(i) > 127) {
                    result += 2;
                }
                else {
                    result++;
                }
            }

            return result;
        },

        split(val, char) {
            return val.split(char).filter(p => p);
        },

        isNumber(num) {
            num = String(num).replace(/^\s+|\s+$/g, '');
            var regex = /^[\-]?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+){1}(\.[0-9]+)?$/g;

            if (regex.test(num)) {
                num = num.replace(/,/g, '');
                return isNaN(num) ? false : true;
            } else {
                return false;
            }
        },

        toNumber(val) {
            var result = 0;
            try {
                result = parseFloat(($object.isNullOrUndefined(val) == true ? 0 : val) === 0 || val === '' ? '0' : val.toString().replace(/,/g, ''));
            } catch (error) {
                syn.$l.eventLog('$string.toNumber', error, 'Warning');
            }

            return result;
        },

        capitalize(val) {
            return val.replace(/\b([a-z])/g, function (val) {
                return val.toUpperCase()
            });
        },

        toJson(val, option) {
            option = option || {};
            var delimeter = option.delimeter || ',';
            var newline = option.newline || '\n';
            var meta = option.meta || {};
            var i, row, lines = val.split(RegExp('{0}'.format(newline), 'g'));
            var headers = lines[0].split(delimeter);
            for (i = 0; i < headers.length; i++) {
                headers[i] = headers[i].replace(/(^[\s"]+|[\s"]+$)/g, '');
            }
            var result = [];
            var lineLength = lines.length;
            var headerLength = headers.length;
            if ($object.isEmpty(meta) == true) {
                for (i = 1; i < lineLength; i++) {
                    row = lines[i].split(delimeter);
                    var item = {};
                    for (var j = 0; j < headerLength; j++) {
                        item[headers[j]] = $string.toDynamic(row[j]);
                    }
                    result.push(item);
                }
            }
            else {
                for (i = 1; i < lineLength; i++) {
                    row = lines[i].split(delimeter);
                    var item = {};
                    for (var j = 0; j < headerLength; j++) {
                        var columnName = headers[j];
                        item[columnName] = $string.toParseType(row[j], meta[columnName]);
                    }
                    result.push(item);
                }
            }
            return result;
        },

        toParameterObject(parameters) {
            return (parameters.match(/([^?:;]+)(:([^;]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf(':')).replace('@', '')] = v.slice(v.indexOf(':') + 1), a;
            }, {});
        },

        toBoolean(val) {
            return (val === 'true' || val === 'True' || val === 'TRUE' || val === 'Y' || val == '1');
        },

        toDynamic(val, emptyIsNull) {
            var result;
            emptyIsNull = $string.toBoolean(emptyIsNull);

            if (emptyIsNull == true && val === '') {
                result = null;
            }
            else {
                if (val === 'true' || val === 'True' || val === 'TRUE') {
                    result = true;
                }
                else if (val === 'false' || val === 'False' || val === 'FALSE') {
                    result = false;
                }
                else if ($validation.regexs.float.test(val)) {
                    result = $string.toNumber(val);
                }
                else if ($validation.regexs.isoDate.test(val)) {
                    result = new Date(val);
                }
                else {
                    result = val;
                }
            }

            return result;
        },

        toParseType(val, metaType, emptyIsNull) {
            var result;
            metaType = metaType || 'string';
            emptyIsNull = $string.toBoolean(emptyIsNull);

            if (emptyIsNull == true && val === '') {
                result = null;
            }
            else {
                switch (metaType) {
                    case 'string':
                        result = val;
                        break;
                    case 'bool':
                        result = $string.toBoolean(val);
                        break;
                    case 'number':
                    case 'int':
                        result = $object.isNullOrUndefined(val) == true ? null : $string.isNumber(val) == true ? $string.toNumber(val) : null;
                        break;
                    case 'date':
                        if ($validation.regexs.isoDate.test(val)) {
                            result = new Date(val);
                        }
                        break;
                    default:
                        result = val;
                        break;
                }
            }

            return result;
        },

        toNumberString(val) {
            return val.trim().replace(/[^0-9\-\.]/g, '');
        },

        toCurrency(val, localeID, options) {
            var result = null;
            if ($string.isNumber(val) == false) {
                return result;
            }

            if ($object.isNullOrUndefined(localeID) == true) {
                var x = val.toString().split('.');
                var x1 = x[0];

                var x2 = x.length > 1 ? '.' + x[1] : '';
                var expr = /(\d+)(\d{3})/;

                while (expr.test(x1)) {
                    x1 = x1.replace(expr, '$1' + ',' + '$2');
                }

                result = x1 + x2;
            }
            else {
                // https://ko.wikipedia.org/wiki/ISO_4217
                var formatOptions = syn.$w.argumentsExtend({
                    style: 'currency',
                    currency: 'KRW'
                }, options);

                result = Intl.NumberFormat(localeID, formatOptions).format(val);
            }

            return result;
        }
    });
    context.$string = $string;

    $array.extend({
        version: '1.0.0',

        distinct(arr) {
            var derived = [];
            for (var i = 0, len = arr.length; i < len; i++) {
                if ($array.contains(derived, arr[i]) == false) {
                    derived.push(arr[i])
                }
            }

            return derived;
        },

        sort(arr, order) {
            var temp = null;
            order = order || true;
            if (order == true) {
                for (var i = 0, ilen = arr.length; i < ilen; i++) {
                    for (var j = 0, jlen = arr.length; j < jlen; j++) {
                        if (arr[i] < arr[j]) {
                            temp = arr[i];
                            arr[i] = arr[j];
                            arr[j] = temp;
                        }
                    }
                }
            }
            else {
                for (var i = 0, ilen = arr.length; i < ilen; i++) {
                    for (var j = 0, jlen = arr.length; j < jlen; j++) {
                        if (arr[i] > arr[j]) {
                            temp = arr[i];
                            arr[i] = arr[j];
                            arr[j] = temp;
                        }
                    }
                }
            }
            return arr;
        },

        objectSort(arr, prop, order) {
            order = order || true;
            if (order == true) {
                arr.sort(
                    function (v1, v2) {
                        var prop1 = v1[prop];
                        var prop2 = v2[prop];

                        if (prop1 < prop2) {
                            return -1;
                        }

                        if (prop1 > prop2) {
                            return 1;
                        }

                        return 0;
                    }
                );
            }
            else {
                arr.sort(
                    function (v1, v2) {
                        var prop1 = v1[prop];
                        var prop2 = v2[prop];

                        if (prop1 < prop2) {
                            return 1;
                        }

                        if (prop1 > prop2) {
                            return -1;
                        }

                        return 0;
                    }
                );
            }
            return arr;
        },

        groupBy(data, predicate) {
            return data.reduce((result, value) => {
                var group = value[predicate];

                if ('function' === typeof predicate) {
                    group = predicate(value);
                }

                if (result[group] === undefined) {
                    result[group] = [];
                }

                result[group].push(value);
                return result;
            }, {});
        },

        shuffle(arr) {
            var i = arr.length, j;
            var temp = null;
            while (i--) {
                j = Math.floor((i + 1) * Math.random());
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return arr;
        },

        addAt(arr, index, val) {
            if (index <= arr.length - 1) {
                arr.splice(index, 0, val);
            }
            return arr;
        },

        removeAt(arr, index) {
            if (index <= (arr.length - 1)) {
                arr.splice(index, 1);
            }
            return arr;
        },

        contains(arr, val) {
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === val) {
                    return true;
                }
            }

            return false;
        },

        merge(arr, brr, predicate = (arr, brr) => arr === brr) {
            const crr = [...arr];
            brr.forEach((bItem) => (crr.some((cItem) => predicate(bItem, cItem)) ? null : crr.push(bItem)));
            return crr;
        },

        union(sourceArray, targetArray) {
            var result = [];
            var temp = {}
            for (var i = 0; i < sourceArray.length; i++) {
                temp[sourceArray[i]] = 1;
            }

            for (var i = 0; i < targetArray.length; i++) {
                temp[targetArray[i]] = 1;
            }

            for (var k in temp) {
                result.push(k)
            };
            return result;
        },

        difference(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return !targetArray.includes(x);
            });
        },

        intersect(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return targetArray.includes(x);
            });
        },

        symmetryDifference(sourceArray, targetArray) {
            return sourceArray.filter(function (x) {
                return !targetArray.includes(x);
            }).concat(targetArray.filter(function (x) {
                return !sourceArray.includes(x);
            }));
        },

        getValue(items, parameterName, defaultValue, parameterProperty, valueProperty) {
            var result = null;

            if (items && items.length > 0) {
                var parseParameter = null;
                if (parameterProperty) {
                    parseParameter = items.find(function (item) { return item[parameterProperty] == parameterName; });
                }
                else {
                    parseParameter = items.find(function (item) { return item.parameterName == parameterName; });
                }

                if (parseParameter) {
                    if (valueProperty) {
                        result = parseParameter[valueProperty];
                    }
                    else {
                        result = parseParameter.value;
                    }
                }
                else {
                    if (defaultValue === undefined) {
                        result = '';
                    }
                    else {
                        result = defaultValue;
                    }
                }
            }

            return result;
        },

        ranks(value, asc) {
            var result = [];
            if ($object.isNullOrUndefined(value) == false && $object.isArray(value) == true) {
                if ($object.isNullOrUndefined(asc) == true) {
                    asc = false;
                }
                else {
                    asc = $string.toBoolean(asc);
                }

                if (asc == true) {
                    for (var i = 0; i < value.length; i++) {
                        value[i] = - + value[i];
                    }
                }

                var sorted = value.slice().sort(function (a, b) {
                    return b - a;
                });
                result = value.map(function (v) {
                    return sorted.indexOf(v) + 1;
                });
            }

            return result;
        }
    });
    context.$array = $array;

    $number.extend({
        version: '1.0.0',

        duration(ms) {
            if (ms < 0) ms = -ms;
            var time = {
                year: 0,
                week: 0,
                day: Math.floor(ms / 86400000),
                hour: Math.floor(ms / 3600000) % 24,
                minute: Math.floor(ms / 60000) % 60,
                second: Math.floor(ms / 1000) % 60,
                millisecond: Math.floor(ms) % 1000
            };

            if (time.day > 365) {
                time.year = time.day % 365;
                time.day = Math.floor(time.day / 365);
            }

            if (time.day > 7) {
                time.week = time.day % 7;
                time.day = Math.floor(time.day / 7);
            }

            return time;
        },

        toByteString(num, precision, addSpace) {
            if (precision === void 0) {
                precision = 3;
            }

            if (addSpace === void 0) {
                addSpace = true;
            }

            var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            if (Math.abs(num) < 1) return num + (addSpace ? ' ' : '') + units[0];
            var exponent = Math.min(Math.floor(Math.log10(num < 0 ? -num : num) / 3), units.length - 1);
            var n = Number(((num < 0 ? -num : num) / Math.pow(1024, exponent)).toPrecision(precision));
            return (num < 0 ? '-' : '') + n + (addSpace ? ' ' : '') + units[exponent];
        },

        random(start, end) {
            if ($string.isNullOrEmpty(start) == true) {
                start = 0;
            }

            if ($string.isNullOrEmpty(end) == true) {
                end = 10;
            }

            return Math.floor((Math.random() * (end - start + 1)) + start);
        },

        isRange(num, low, high) {
            return num >= low && num <= high;
        },

        limit(num, low, high) {
            return num < low ? low : (num > high ? high : num);
        },

        percent(num, total, precision) {
            var precision = precision || 0;
            var result = Math.pow(10, precision);

            return Math.round((num * 100 / total) * result) / result;
        }
    });
    context.$number = $number;

    $object.extend({
        version: '1.0.0',

        isNullOrUndefined(val) {
            if (val === undefined || val === null) {
                return true;
            }
            else {
                return false;
            }
        },

        toCSV(obj, option) {
            if (typeof obj !== 'object') return null;
            option = option || {};
            var scopechar = option.scopechar || '/';
            var delimeter = option.delimeter || ',';
            var newline = option.newline || '\n';
            if (Array.isArray(obj) === false) obj = [obj];
            var curs, name, i, key, queue, values = [], rows = [], headers = {}, headersArr = [];
            for (i = 0; i < obj.length; i++) {
                queue = [obj[i], ''];
                rows[i] = {};
                while (queue.length > 0) {
                    name = queue.pop();
                    curs = queue.pop();
                    if (curs !== null && typeof curs === 'object') {
                        for (key in curs) {
                            if (curs.hasOwnProperty(key)) {
                                queue.push(curs[key]);
                                queue.push(name + (name ? scopechar : '') + key);
                            }
                        }
                    } else {
                        if (headers[name] === undefined) headers[name] = true;
                        rows[i][name] = curs;
                    }
                }
                values[i] = [];
            }

            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    headersArr.push(key);
                    for (i = 0; i < obj.length; i++) {
                        values[i].push(rows[i][key] === undefined
                            ? ''
                            : rows[i][key]);
                    }
                }
            }
            for (i = 0; i < obj.length; i++) {
                values[i] = values[i].join(delimeter);
            }
            return headersArr.join(delimeter) + newline + values.join(newline);
        },

        toParameterString(jsonObject) {
            return jsonObject ? Object.entries(jsonObject).reduce(function (queryString, ref, index) {
                var key = ref[0];
                var val = ref[1];
                queryString += `@${key}:${$string.toValue($string.toDynamic(val), '')};`;
                return queryString;
            }, '') : '';
        },

        getType(val) {
            var result = typeof val;
            if (result == 'object') {
                if (val) {
                    if (val instanceof Array || (!(val instanceof Object) && (Object.prototype.toString.call((val)) == '[object Array]') || typeof val.length == 'number' && typeof val.splice != 'undefined' && typeof val.propertyIsEnumerable != 'undefined' && !val.propertyIsEnumerable('splice'))) {
                        return 'array';
                    }

                    if (!(val instanceof Object) && (Object.prototype.toString.call((val)) == '[object Function]' || typeof val.call != 'undefined' && typeof val.propertyIsEnumerable != 'undefined' && !val.propertyIsEnumerable('call'))) {
                        return 'function';
                    }

                    if (val instanceof Date) {
                        return 'date';
                    }

                    if (val instanceof HTMLElement) {
                        return 'element';
                    }
                }
                else {
                    return 'null';
                }
            }
            else if (result == 'function' && typeof val.call == 'undefined') {
                return 'object';
            }

            return result;
        },

        defaultValue(type) {
            if (typeof type !== 'string') {
                return '';
            }

            switch (type) {
                case 'bool':
                case 'boolean':
                    return false;
                case 'function': return function () { };
                case 'null': return null;
                case 'int':
                case 'number':
                    return 0;
                case 'object': return {};
                case 'date': return new Date();
                case 'string': return '';
                case 'symbol': return Symbol();
                case 'undefined': return void 0;
                default: return '';
            }
        },

        isDefined(val) {
            return val !== undefined;
        },

        isNull(val) {
            return val === null;
        },

        isArray(val) {
            return this.getType(val) == 'array';
        },

        isDate(val) {
            var result = false;
            try {
                if (Object.prototype.toString.call(val) === '[object Date]') {
                    result = true;
                }
                else if (typeof val == 'string') {
                    if (val.includes('T') == true) {
                        var date = val.parseISOString();
                        result = typeof date.getFullYear == 'function';
                    }
                    else if ($date.isDate(val) == true) {
                        result = true;
                    }
                }
            } catch (e) {
            }

            return result;
        },

        isString(val) {
            return typeof val == 'string';
        },

        isNumber(val) {
            return typeof val == 'number';
        },

        isFunction(val) {
            return this.getType(val) == 'function';
        },

        isObject(val) {
            return typeof val == 'object';
        },

        isObjectEmpty(val) {
            if (typeof val == 'object') {
                for (var key in val) {
                    if (val.hasOwnProperty(key) == true) {
                        return false;
                    }
                }
            }
            return true;
        },

        isBoolean(val) {
            if ($object.isNullOrUndefined(val) == true) {
                return false;
            }

            if (typeof val == 'boolean') {
                return true;
            }
            else if (typeof val == 'string' || typeof val == 'number') {
                val = val.toString();
                return (val.toUpperCase() === 'TRUE' ||
                    val.toUpperCase() === 'FALSE' ||
                    val === 'Y' ||
                    val === 'N' ||
                    val == '1' ||
                    val == '0');
            }

            return false;
        },

        isEmpty(val) {
            var result = false;
            if (typeof val == 'number' || typeof val == 'boolean' || typeof val == 'function' || (typeof val === 'object' && val instanceof Date)) {
                result = false;
            }
            else {
                result = (val == null || !(Object.keys(val) || val).length);
            }
            return result;
        },

        clone(val, isNested) {
            var result = null;

            if ($object.isNullOrUndefined(isNested) == true) {
                isNested = true;
            }

            if ($object.isArray(val) == true) {
                result = JSON.parse(JSON.stringify(val));
            }
            else if ($object.isObject(val) == true) {
                if (val) {
                    var types = [Number, String, Boolean], result;
                    types.forEach(function (type) {
                        if (val instanceof type) {
                            result = type(val);
                        }
                    });

                    if (isNested == true && Object.prototype.toString.call(val) === '[object Array]') {
                        result = [];
                        val.forEach(function (child, index, array) {
                            result[index] = $object.clone(child);
                        });
                    }
                    else if (typeof val == 'object') {
                        if (val.nodeType && typeof val.cloneNode == 'function') {
                            result = val.cloneNode(true);
                        }
                        else if (!val.prototype) {
                            result = {};
                            for (var i in val) {
                                result[i] = $object.clone(val[i]);
                            }
                        }
                        else {
                            if (val.constructor) {
                                result = new val.constructor();
                            }
                            else {
                                result = val;
                            }
                        }
                    }
                    else {
                        result = val;
                    }
                }
                else {
                    result = val;
                }
            }
            else if ($object.isFunction(val) == true) {
                result = val.clone();
            }
            else {
                result = val;
            }

            return result;
        },

        extend(to, from, overwrite) {
            var prop, hasProp;
            for (prop in from) {
                hasProp = to[prop] !== undefined;
                if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                    if ($object.isDate(from[prop])) {
                        if (overwrite) {
                            to[prop] = new Date(from[prop].getTime());
                        }
                    }
                    else if ($object.isArray(from[prop])) {
                        if (overwrite) {
                            to[prop] = from[prop].slice(0);
                        }
                    } else {
                        to[prop] = $object.extend({}, from[prop], overwrite);
                    }
                } else if (overwrite || !hasProp) {
                    to[prop] = from[prop];
                }
            }
            return to;
        }
    });
    context.$object = $object;
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $library = context.$library || new syn.module();
    var document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        document = context.document;

        (function () {
            if (typeof context.CustomEvent !== 'function') {
                var CustomEvent = function (event, params) {
                    params = params || { bubbles: false, cancelable: false, detail: undefined };
                    var evt = document.createEvent('CustomEvent');
                    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                    return evt;
                }

                CustomEvent.prototype = context.Event.prototype;
                context.CustomEvent = CustomEvent;
            }

            context['events'] = function () {
                var items = [];

                return {
                    items: items,
                    add(el, eventName, handler) {
                        items.push(arguments);
                    },
                    remove(el, eventName, handler) {
                        var index = items.findIndex((item) => { return item[0] == arguments[0] && item[1] == arguments[1] && item[2] == arguments[2] });
                        if (index > -1) {
                            items.splice(index, 1);
                        }
                    },
                    flush() {
                        var i, item;
                        for (i = items.length - 1; i >= 0; i = i - 1) {
                            item = items[i];
                            if (item[0].removeEventListener) {
                                item[0].removeEventListener(item[1], item[2], item[3]);
                            }
                            if (item[1].substring(0, 2) != 'on') {
                                item[1] = 'on' + item[1];
                            }
                            if (item[0].detachEvent) {
                                item[0].detachEvent(item[1], item[2]);
                            }
                            item[0][item[1]] = null;
                        }

                        syn.$w.purge(document.body);
                    }
                }
            }();
        })();
    }

    $library.extend({
        version: '1.0.0',
        prefixs: ['webkit', 'moz', 'ms', 'o', ''],

        eventMap: {
            'mousedown': 'touchstart',
            'mouseup': 'touchend',
            'mousemove': 'touchmove'
        },

        guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        stringToArrayBuffer(value, isTwoByte) {
            var bufferCount = 1;
            if ($string.toBoolean(isTwoByte) == true) {
                bufferCount = 2;
            }

            var result = new ArrayBuffer(value.length * bufferCount);
            var bufView = new Uint8Array(result);
            for (var i = 0, strLen = value.length; i < strLen; i++) {
                bufView[i] = value.charCodeAt(i);
            }
            return result;
        },

        arrayBufferToString(buffer) {
            var arrayBuffer = new Uint8Array(buffer);
            var s = String.fromCharCode.apply(null, arrayBuffer);
            return decodeURIComponent(s);
        },

        random(len, toLower) {
            var result = '';
            var len = len || 8;
            var val = '';

            while (val.length < len) {
                val += Math.random().toString(36).substring(2);
            }

            if ($string.toBoolean(toLower) == true) {
                result = val.substring(0, len);
            }
            else {
                result = val.substring(0, len).toUpperCase();
            }

            return result;
        },

        execPrefixFunc(el, func) {
            var prefixs = syn.$l.prefixs;
            var i = 0, m, t;
            while (i < prefixs.length && !el[m]) {
                m = func;
                if (prefixs[i] == '') {
                    m = m.substring(0, 1).toLowerCase() + m.substring(1);
                }
                m = prefixs[i] + m;
                t = typeof el[m];
                if (t != 'undefined') {
                    prefixs = [prefixs[i]];
                    return (t == 'function' ? el[m]() : el[m]);
                }
                i++;
            }
        },

        dispatchClick(el, options) {
            try {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                options = syn.$w.argumentsExtend({
                    canBubble: true,
                    cancelable: true,
                    view: context,
                    detail: 0,
                    screenX: 0,
                    screenY: 0,
                    clientX: 80,
                    clientY: 20,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: null
                }, options);

                var evt = document.createEvent('MouseEvents');

                // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/initMouseEvent
                evt.initMouseEvent('click', options.canBubble, options.cancelable, options.view, options.detail, options.screenX, options.screenY, options.clientX, options.clientY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget);
                el.dispatchEvent(evt);
            } catch (error) {
                syn.$l.eventLog('$l.dispatchClick', error, 'Warning');
            }
        },

        // http://www.w3schools.com/html5/html5_ref_eventattributes.asp
        addEvent(el, type, func) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (el && func && $object.isFunction(func) == true) {
                if (el.addEventListener) {
                    el.addEventListener(type, func, false);
                }
                else if (el.attachEvent) {
                    el.attachEvent('on' + type, func);
                }
                else {
                    el['on' + type] = el['e' + type + func];
                }

                events.add(el, type, func);

                if ($object.isString(type) == true && type.toLowerCase() === 'resize') {
                    func();
                }
            }

            return $library;
        },

        addEvents(query, type, func) {
            if (func && $object.isFunction(func) == true) {
                var items = [];
                if ($object.isString(query) == true && $string.isNullOrEmpty(query) == false) {
                    items = syn.$l.querySelectorAll(query);
                }
                else if ($object.isArray(query) == true && query.length > 0) {
                    var item = query[0];
                    if ($object.isString(item) == true) {
                        for (var i = 0, length = query.length; i < length; i++) {
                            items = $array.merge(items, syn.$l.querySelectorAll(query[i]));
                        }
                    }
                    else if ($object.isObject(item) == true) {
                        items = query;
                    }
                }
                else if ($object.isObject(query) == true) {
                    items = [query];
                }

                for (var i = 0, length = items.length; i < length; i++) {
                    var el = items[i];
                    syn.$l.addEvent(el, type, func);
                }
            }

            return $library;
        },

        addLive(elID, type, fn) {
            $library.addEvent(context || document, type, function (evt) {
                var found;
                var targetEL = syn.$w.activeControl(evt);
                while (targetEL && !(found = targetEL.id == elID)) {
                    targetEL = targetEL.parentElement;
                }

                if (found) {
                    fn.call(targetEL, evt);
                }
            });

            return $library;
        },

        removeEvent(el, type, func) {
            if (func && $object.isFunction(func) == true) {
                el = $object.isString(el) == true ? syn.$l.get(el) : el;
                if (el.removeEventListener) {
                    el.removeEventListener(type, func, false);
                }
                else if (el.detachEvent) {
                    el.detachEvent('on' + type, func);
                }
                else {
                    el['on' + type] = null;
                }

                events.remove(el, type, func);
            }

            return $library;
        },

        hasEvent(el, type) {
            var item = null;
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            for (var i = 0, len = events.items.length; i < len; i++) {
                item = events.items[i];

                if (item && item[0] instanceof context.constructor || item[0] instanceof document.constructor) {
                    if (item[1] == type) {
                        result = true;
                        break;
                    }
                }
                else {
                    if (item && item[0].id) {
                        if (item[0].id == el.id && item[1] == type) {
                            result = true;
                            break;
                        }
                    }
                }
            }

            return result;
        },

        trigger(el, type, value) {
            var result = false;
            var item = null;
            var action = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            for (var i = 0, len = events.items.length; i < len; i++) {
                item = events.items[i];

                if (item[0] instanceof context.constructor || item[0] instanceof document.constructor) {
                    if (item[1] == type) {
                        action = item[2];
                        break;
                    }
                }
                else {
                    if (item[0].id) {
                        if (item[0].id == el.id && item[1] == type) {
                            action = item[2];
                            break;
                        }
                    }
                }
            }

            if (action) {
                if (value) {
                    action.call(el, value);
                }
                else {
                    action.call(el);
                }
                result = true;
            }

            return result;
        },

        triggerEvent(el, type, customData) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (context.CustomEvent) {
                if (customData) {
                    el.dispatchEvent(new CustomEvent(type, { detail: customData }));
                }
                else {
                    el.dispatchEvent(new CustomEvent(type));
                }
            }
            else if (document.createEvent) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent(type, false, true);

                if (customData) {
                    el.dispatchEvent(evt, customData);
                }
                else {
                    el.dispatchEvent(evt);
                }
            }
            else if (el.fireEvent) {
                var evt = document.createEventObject();
                evt.eventType = type;
                if (customData) {
                    el.fireEvent('on' + evt.eventType, customData);
                }
                else {
                    el.fireEvent('on' + evt.eventType);
                }
            }

            return $library;
        },

        get() {
            var result = [];
            var find = null;
            var elID = '';

            for (var i = 0, len = arguments.length; i < len; i++) {
                elID = arguments[i];

                if ($object.isString(elID) == true) {
                    find = document.getElementById(elID);
                }

                result.push(find);
            }

            if (result.length == 1) {
                return find;
            }
            else {
                return result;
            }
        },

        querySelector() {
            var result = [];
            var find = null;
            var query = '';

            for (var i = 0, len = arguments.length; i < len; i++) {
                query = arguments[i];

                if ($object.isString(query) == true) {
                    find = document.querySelector(query);
                }

                result.push(find);
            }

            if (result.length == 1) {
                return find;
            }
            else {
                return result;
            }
        },

        getTagName() {
            var result = [];
            for (var i = 0, len = arguments.length; i < len; i++) {
                var tagName = arguments[i];
                if ($object.isString(tagName) == true) {
                    var els = document.getElementsByTagName(tagName);
                    for (var j = 0, length = els.length; j < length; j++) {
                        result.push(els[j]);
                    }
                }
            }
            return result;
        },

        querySelectorAll() {
            var result = [];
            for (var i = 0, len = arguments.length; i < len; i++) {
                var query = arguments[i];
                if ($object.isString(query) == true) {
                    var els = document.querySelectorAll(query);
                    for (var j = 0, length = els.length; j < length; j++) {
                        result.push(els[j]);
                    }
                }
            }
            return result;
        },

        toEnumText(enumObject, value) {
            var text = null;
            for (var k in enumObject) {
                if (enumObject[k] == value) {
                    text = k;
                    break;
                }
            }
            return text;
        },

        prettyTSD(tsd, isFormat) {
            var result = null;
            try {
                var Value = tsd.split('＾');
                if (Value.length > 1) {
                    var meta = $string.toParameterObject(Value[0]);
                    result = $string.toJson(Value[1], { delimeter: '｜', newline: '↵', meta: meta });
                }
                else {
                    result = $string.toJson(Value[0], { delimeter: '｜', newline: '↵' });
                }

                return $string.toBoolean(isFormat) == true ? JSON.stringify(result, null, 2) : result;
            } catch (error) {
                result = error.message;
            }

            return result;
        },

        text2Json(data, delimiter, newLine) {
            if (delimiter == undefined) {
                delimiter = ',';
            }

            if (newLine == undefined) {
                newLine = '\n';
            }

            var titles = data.slice(0, data.indexOf(newLine)).split(delimiter);
            return data
                .slice(data.indexOf(newLine) + 1)
                .split(newLine)
                .map(function (v) {
                    var values = v.split(delimiter);
                    return titles.reduce(function (obj, title, index) {
                        return (obj[title] = values[index]), obj;
                    }, {});
                });
        },

        json2Text(arr, columns, delimiter, newLine) {
            function _toConsumableArray(arr) {
                return (
                    _arrayWithoutHoles(arr) ||
                    _iterableToArray(arr) ||
                    _unsupportedIterableToArray(arr) ||
                    _nonIterableSpread()
                );
            }

            function _nonIterableSpread() {
                throw new TypeError('유효하지 않은 데이터 타입');
            }

            function _unsupportedIterableToArray(o, minLen) {
                if (!o) return;
                if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
                var n = Object.prototype.toString.call(o).slice(8, -1);
                if (n === 'Object' && o.constructor) n = o.constructor.name;
                if (n === 'Map' || n === 'Set') return Array.from(o);
                if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
                    return _arrayLikeToArray(o, minLen);
            }

            function _iterableToArray(iter) {
                if (typeof Symbol !== 'undefined' && Symbol.iterator in Object(iter))
                    return Array.from(iter);
            }

            function _arrayWithoutHoles(arr) {
                if (Array.isArray(arr)) return _arrayLikeToArray(arr);
            }

            function _arrayLikeToArray(arr, len) {
                if (len == null || len > arr.length) len = arr.length;
                for (var i = 0, arr2 = new Array(len); i < len; i++) {
                    arr2[i] = arr[i];
                }
                return arr2;
            }

            if (delimiter == delimiter) {
                delimiter = ',';
            }

            if (newLine == undefined) {
                newLine = '\n';
            }

            return [columns.join(delimiter)]
                .concat(
                    _toConsumableArray(
                        arr.map(function (obj) {
                            return columns.reduce(function (acc, key) {
                                return ''
                                    .concat(acc)
                                    .concat(!acc.length ? '' : delimiter)
                                    .concat(!obj[key] ? '' : obj[key]);
                            }, '');
                        })
                    )
                )
                .join(newLine);
        },

        nested2Flat(data, itemID, parentItemID, childrenID) {
            var result = [];

            if (data) {
                if ($object.isNullOrUndefined(childrenID) == true) {
                    childrenID = 'items';
                }

                var root = $object.clone(data, false);
                delete root[childrenID];
                root[parentItemID] = null;
                result.push(root);

                syn.$l.parseNested2Flat(data, result, itemID, parentItemID, childrenID);
            }
            else {
                syn.$l.eventLog('$l.nested2Flat', '필수 데이터 확인 필요', 'Warning');
            }

            return result;
        },

        parseNested2Flat(data, newData, itemID, parentItemID, childrenID) {
            var result = null;

            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var items = data[childrenID];
            if (data && items) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];

                    var cloneItem = $object.clone(item, false);
                    delete cloneItem[childrenID];
                    cloneItem[parentItemID] = data[itemID];

                    newData.push(cloneItem);

                    if (item[childrenID] && item[childrenID].length > 0) {
                        syn.$l.parseNested2Flat(item, newData, itemID, parentItemID, childrenID);
                    }
                }
            }

            return result;
        },

        flat2Nested(data, itemID, parentItemID, childrenID) {
            var result = null;

            if (data && itemID && parentItemID) {
                if ($object.isNullOrUndefined(childrenID) == true) {
                    childrenID = 'items';
                }

                var root = data.find(function (item) { return item[parentItemID] == null });
                var json = syn.$l.parseFlat2Nested(data, root, [], itemID, parentItemID, childrenID);
                root[childrenID] = json[childrenID];
                result = root;
            }
            else {
                syn.$l.eventLog('$l.flat2Nested', '필수 데이터 확인 필요', 'Warning');
            }

            return result;
        },

        parseFlat2Nested(data, root, newData, itemID, parentItemID, childrenID) {
            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var child = data.filter(function (item) { return item[parentItemID] == root[itemID] });
            if (child.length > 0) {
                if (!newData[childrenID]) {
                    newData[childrenID] = [];
                }
                for (var i = 0; i < child.length; i++) {
                    newData[childrenID].push($object.clone(child[i]));
                    syn.$l.parseFlat2Nested(data, child[i], newData[childrenID][i], itemID, parentItemID, childrenID);
                }
            }
            return newData;
        },

        findNestedByID(data, findID, itemID, childrenID) {
            var result = null;

            if ($object.isNullOrUndefined(childrenID) == true) {
                childrenID = 'items';
            }

            var items = data[childrenID];
            if (data && items) {
                if (data[itemID] == findID) {
                    result = data;

                    return result;
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];

                    if (item[itemID] == findID) {
                        result = item;

                        return result;
                    }
                    else if (item[childrenID] && item[childrenID].length > 0) {
                        result = syn.$l.findNestedByID(item, findID, itemID, childrenID);

                        if (result) {
                            return result;
                        }
                    }
                }
            }

            return result;
        },

        deepFreeze(object) {
            var propNames = Object.getOwnPropertyNames(object);
            for (let name of propNames) {
                let value = object[name];

                object[name] = value && typeof value === 'object' ? syn.$l.deepFreeze(value) : value;
            }

            return Object.freeze(object);
        },

        createBlob(data, type) {
            try {
                return new Blob([data], { type: type });
            } catch (e) {
                var BlobBuilder = globalRoot.BlobBuilder || globalRoot.WebKitBlobBuilder || globalRoot.MozBlobBuilder || globalRoot.MSBlobBuilder;
                var builder = new BlobBuilder();
                builder.append(data.buffer || data);
                return builder.getBlob(type);
            }
        },

        dataUriToBlob(dataUri) {
            var result = null;

            try {
                var byteString = syn.$c.base64Decode(dataUri.split(',')[1]);
                var mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                result = new Blob([ab], { type: mimeString });
            } catch (error) {
                syn.$l.eventLog('$w.dataUriToBlob', error, 'Warning');
            }
            return result;
        },

        dataUriToText(dataUri) {
            var result = null;

            try {
                result = {
                    value: syn.$c.base64Decode(dataUri.split(',')[1]),
                    mime: dataUri.split(',')[0].split(':')[1].split(';')[0]
                };
            } catch (error) {
                syn.$l.eventLog('$w.dataUriToText', error, 'Warning');
            }
            return result;
        },

        blobToDataUri(blob, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobToDataUri', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var reader = new FileReader();
            reader.onloadend = function () {
                var base64data = reader.result;
                callback(base64data);
            }
            reader.onerror = function () {
                syn.$l.eventLog('$l.blobToDataUri', reader.error, 'Error');
                reader.abort();
            }
            reader.readAsDataURL(blob);
        },

        blobToDownload(blob, fileName) {
            if (context.navigator && context.navigator.msSaveOrOpenBlob) {
                context.navigator.msSaveOrOpenBlob(blob, fileName);
            } else {
                var blobUrl = syn.$r.createBlobUrl(blob);
                var link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;

                syn.$l.dispatchClick(link);

                setTimeout(function () {
                    syn.$r.revokeBlobUrl(blobUrl);
                    if (link.remove) {
                        link.remove();
                    }
                }, 100);
            }
        },

        blobUrlToBlob(url, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobUrlToBlob', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open('GET', url);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            xhr.responseType = 'blob';
            xhr.onload = function () {
                callback(xhr.response);
            }
            xhr.onerror = function () {
                syn.$l.eventLog('$l.blobUrlToBlob', 'url: {0}, status: {1}'.format(url, xhr.statusText), 'Warning');
            }
            xhr.send();
        },

        blobUrlToDataUri(url, callback) {
            if ($object.isNullOrUndefined(callback) == true) {
                syn.$l.eventLog('$l.blobUrlToDataUri', 'blob 결과 callback 확인 필요', 'Warning');
                return;
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open('GET', url);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            xhr.responseType = 'blob';
            xhr.onload = function () {
                var reader = new FileReader();
                reader.onloadend = function () {
                    var base64data = reader.result;
                    setTimeout(function () {
                        syn.$r.revokeBlobUrl(url);
                    }, 25);
                    callback(null, base64data);
                }
                reader.onerror = function () {
                    syn.$l.eventLog('$l.blobUrlToDataUri', reader.error, 'Error');
                    reader.abort();
                    callback(reader.error.message, null);
                }
                reader.readAsDataURL(xhr.response);
            }
            xhr.onerror = function () {
                syn.$l.eventLog('$l.blobUrlToDataUri', 'url: {0}, status: {1}'.format(url, xhr.statusText), 'Warning');
                callback('url: {0}, status: {1}'.format(url, xhr.statusText), null);
            }
            xhr.send();
        },

        async blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(blob);
            });
        },

        base64ToBlob(b64Data, contentType, sliceSize) {
            if (b64Data === '' || b64Data === undefined) {
                return;
            }

            if ($string.isNullOrEmpty(contentType) == true) {
                contentType = '';
            }

            if ($string.isNullOrEmpty(sliceSize) == true) {
                sliceSize = 512;
            }

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);
                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        },

        async blobToFile(blob, fileName, mimeType = 'text/plain') {
            var result = null;
            if (blob && blob.type && blob.size) {
                result = new File([blob], fileName, { type: mimeType });
            }

            return result;
        },

        async fileToBase64(file) {
            return new Promise((resolve, reject) => {
                var reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        },

        async fileToBlob(file) {
            var base64 = await syn.$l.fileToBase64(file);

            var mimeType = base64?.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            var realData = base64.split(',')[1];

            return syn.$l.base64ToBlob(realData, mimeType);
        },

        async resizeImage(blob, maxSize) {
            var reader = new FileReader();
            var image = new Image();
            var canvas = document.createElement('canvas');
            var dataURItoBlob = function (dataURI) {
                var bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
                    atob(dataURI.split(',')[1]) :
                    decodeURIComponent(dataURI.split(',')[1]);
                var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var max = bytes.length;
                var ia = new Uint8Array(max);
                for (var i = 0; i < max; i++)
                    ia[i] = bytes.charCodeAt(i);
                return new Blob([ia], { type: mime || 'image/jpeg' });
            };
            var resize = function () {
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (maxSize <= 0) {
                        maxSize = 80;
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                } else {
                    if (maxSize <= 0) {
                        maxSize = 80;
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg');
                return {
                    blob: dataURItoBlob(dataUrl),
                    width: width,
                    height: height,
                };
            };
            return new Promise(function (success, failure) {
                if (!blob.type.match(/image.*/)) {
                    failure(new Error("이미지 파일 확인 필요"));
                    return;
                }
                reader.onload = function (readerEvent) {
                    image.onload = function () { return success(resize()); };
                    image.src = readerEvent.target.result;
                };
                reader.readAsDataURL(blob);
            });
        },

        logLevel: new function () {
            this.Verbose = 0;
            this.Debug = 1;
            this.Information = 2;
            this.Warning = 3;
            this.Error = 4;
            this.Fatal = 5;
        },

        start: (new Date()).getTime(),
        eventLogTimer: null,
        eventLogCount: 0,
        eventLog(event, data, logLevel) {
            var message = typeof data == 'object' ? data.message : data;
            var stack = typeof data == 'object' ? data.stack : data;
            if (logLevel) {
                if ($object.isString(logLevel) == true) {
                    logLevel = syn.$l.logLevel[logLevel];
                }
            }
            else {
                logLevel = 0;
            }

            if (syn.Config && syn.Config.UIEventLogLevel) {
                if (syn.$l.logLevel[syn.Config.UIEventLogLevel] > logLevel) {
                    return;
                }
            }

            var logLevelText = syn.$l.toEnumText(syn.$l.logLevel, logLevel);
            var now = (new Date()).getTime(),
                diff = now - syn.$l.start,
                value, div, text;

            if (globalRoot.devicePlatform === 'node') {
                value = syn.$l.eventLogCount.toString() +
                    '@' + (diff / 1000).toString().format('0.000') +
                    ' [' + event + '] ' + (message === stack ? message : stack);

                switch (logLevelText) {
                    case 'Debug':
                        globalRoot.$logger.debug(value);
                        break;
                    case 'Information':
                        globalRoot.$logger.info(value);
                        break;
                    case 'Warning':
                        globalRoot.$logger.warn(value);
                        break;
                    case 'Error':
                        globalRoot.$logger.error(value);
                        break;
                    case 'Fatal':
                        globalRoot.$logger.fatal(value);
                        break;
                    default:
                        globalRoot.$logger.trace(value);
                        break;
                }
            }
            else {
                value = syn.$l.eventLogCount.toString() +
                    '@' + (diff / 1000).toString().format('0.000') +
                    ' [' + logLevelText + '] ' +
                    '[' + event + '] ' + (message === stack ? message : stack);

                if (syn.Config.IsDebugMode == true && syn.Config.Environment == 'Development' && ['Warning', 'Error', 'Fatal'].indexOf(logLevelText) > -1) {
                    debugger;
                }

                if (context.console) {
                    console.log(value);
                }
                else {
                    div = document.createElement('DIV');
                    text = document.createTextNode(value);

                    div.appendChild(text);

                    var eventlogs = document.getElementById('eventlogs');
                    if (eventlogs) {
                        eventlogs.appendChild(div);

                        clearTimeout(syn.$l.eventLogTimer);
                        syn.$l.eventLogTimer = setTimeout(function () {
                            eventlogs.scrollTop = eventlogs.scrollHeight;
                        }, 10);
                    }
                    else {
                        document.body.appendChild(div);
                    }
                }

                if (context.bound) {
                    bound.browserEvent('browser', {
                        ID: 'EventLog',
                        Data: value
                    }, function (error, json) {
                        if (error) {
                            console.log('browser EventLog - {0}'.format(error));
                        }
                    });
                }
            }

            syn.$l.eventLogCount++;
        },

        moduleEventLog(moduleID, event, data, logLevel) {
            var message = typeof data == 'object' ? data.message : data;
            var stack = typeof data == 'object' ? data.stack : data;
            if (logLevel) {
                if ($object.isString(logLevel) == true) {
                    logLevel = syn.$l.logLevel[logLevel];
                }
            }
            else {
                logLevel = 0;
            }

            if (syn.Config && syn.Config.UIEventLogLevel) {
                if (syn.$l.logLevel[syn.Config.UIEventLogLevel] > logLevel) {
                    return;
                }
            }

            var logLevelText = syn.$l.toEnumText(syn.$l.logLevel, logLevel);
            var now = (new Date()).getTime(),
                diff = now - syn.$l.start,
                value;

            value = syn.$l.eventLogCount.toString() +
                '@' + (diff / 1000).toString().format('0.000') +
                ' [' + event + '] ' + (message === stack ? message : stack);

            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                var logger = moduleLibrary.logger;
                switch (logLevelText) {
                    case 'Debug':
                        logger.debug(value);
                        break;
                    case 'Information':
                        logger.info(value);
                        break;
                    case 'Warning':
                        logger.warn(value);
                        break;
                    case 'Error':
                        logger.error(value);
                        break;
                    case 'Fatal':
                        logger.fatal(value);
                        break;
                    default:
                        logger.trace(value);
                        break;
                }
            }
            else {
                console.log('ModuleID 확인 필요 - {0}'.format(moduleID));
            }

            syn.$l.eventLogCount++;
        }
    });

    syn.$l = $library;
    if (globalRoot.devicePlatform === 'node') {
        delete syn.$l.addEvent;
        delete syn.$l.addLive;
        delete syn.$l.removeEvent;
        delete syn.$l.hasEvent;
        delete syn.$l.trigger;
        delete syn.$l.triggerEvent;
        delete syn.$l.addBind;
        delete syn.$l.get;
        delete syn.$l.querySelector;
        delete syn.$l.getName;
        delete syn.$l.querySelectorAll;
        delete syn.$l.getElementsById;
        delete syn.$l.getElementsByClassName;
        delete syn.$l.getElementsByTagName;
    }
    else {
        delete syn.$l.moduleEventLog;

        context.onevent = syn.$l.addEvent;
        context.bind = syn.$l.addBind;
        context.trigger = syn.$l.trigger;

        syn.$l.addEvent(context, 'unload', events.flush);
    }
})(globalRoot);

/// <reference path='syn.library.js' />
/// <reference path='syn.browser.js' />

(function (context) {
    'use strict';
    var $request = context.$request || new syn.module();
    var document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        document = context.document;
    }

    $request.extend({
        version: '1.0.0',
        params: {},
        path: (globalRoot.devicePlatform === 'node') ? '' : location.pathname,

        query(param, url) {
            url = url || location.href;

            return function (url) {
                var url = url.split('?');
                var query = ((url.length == 1) ? url[0] : url[1]).split('&');
                for (var i = 0; i < query.length; i++) {
                    var splitIndex = query[i].indexOf('=');
                    var key = query[i].substring(0, splitIndex);
                    var value = query[i].substring(splitIndex + 1);
                    syn.$r.params[key] = value;
                }
                return syn.$r.params;
            }(url)[param];
        },

        url() {
            var url = syn.$r.path.split('?');
            var param = '';

            param = syn.$r.path + ((syn.$r.path.length > 0 && url.length > 1) ? '&' : '?');
            for (var key in $request.params) {
                if (typeof (syn.$r.params[key]) == 'string') {
                    param += key + '=' + syn.$r.params[key] + '&';
                }
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == false) {
                param += '&noCache=' + (new Date()).getTime();
            }

            return encodeURI(param.substring(0, param.length - 1));
        },

        toQueryString(jsonObject, isQuestion) {
            var result = jsonObject ? Object.entries(jsonObject).reduce((queryString, ref, index) => {
                var key = ref[0];
                var val = ref[1];
                queryString += `&${key}=${$string.toValue(val, '')}`;
                return queryString;
            }, '') : '';

            if ($string.isNullOrEmpty(result) == false && $string.toBoolean(isQuestion) == true) {
                result = '?' + result.substring(1);
            }

            return result;
        },

        toUrlObject(url) {
            url = url || location.href;
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
            }, {});
        },

        async isCorsEnabled(url) {
            var result = false;
            try {
                var response = await fetch(url, { method: 'HEAD', timeout: 200 });
                result = (response.status >= 200 && response.status <= 299);

                if (result == false) {
                    syn.$l.eventLog('$w.isCorsEnabled', '{0}, {1}:{2}'.format(url, response.status, response.statusText), 'Warning');
                }
            } catch (error) {
                syn.$l.eventLog('$w.isCorsEnabled', error.message, 'Error');
            }

            return result;
        },

        // var result = await syn.$r.httpRequest('GET', '/index');
        httpRequest(method, url, data, callback) {
            if ($object.isNullOrUndefined(data) == true) {
                data = {};
            }

            var contentType = 'application/json';
            var formData = null;
            if ($object.isNullOrUndefined(data.body) == false) {
                contentType = null;
                var params = data.body;
                if (method.toUpperCase() == 'GET') {
                    var paramUrl = url + ((url.split('?').length > 1) ? '&' : '?');

                    for (var key in params) {
                        paramUrl += key + '=' + params[key].toString() + '&';
                    }

                    url = encodeURI(paramUrl.substring(0, paramUrl.length - 1));
                }
                else {
                    formData = new FormData();

                    for (var key in params) {
                        formData.append(key, params[key].toString());
                    }
                }
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open(method, url, true);

            if (syn.$w.setServiceClientHeader) {
                if (syn.$w.setServiceClientHeader(xhr) == false) {
                    return;
                }
            }

            if (callback) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            if (xhr.status == 0) {
                                syn.$l.eventLog('$r.httpRequest', 'X-Requested transfort error', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$r.httpRequest', 'response status - {0}'.format(xhr.statusText) + xhr.responseText, 'Error');
                            }
                            return;
                        }

                        if (callback) {
                            callback({
                                status: xhr.status,
                                response: xhr.responseText
                            });
                        }
                    }
                }

                if (formData == null) {
                    if (data != {}) {
                        xhr.send(JSON.stringify(data));
                    } else {
                        xhr.send();
                    }
                }
                else {
                    xhr.send(formData);
                }
            }
            else if (globalRoot.Promise) {
                return new Promise(function (resolve) {
                    xhr.onload = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.responseText
                        });
                    };
                    xhr.onerror = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.responseText
                        });
                    };

                    if (contentType != null) {
                        xhr.setRequestHeader('Content-Type', contentType);
                    }

                    if (formData == null) {
                        if (data != {}) {
                            xhr.send(JSON.stringify(data));
                        } else {
                            xhr.send();
                        }
                    }
                    else {
                        xhr.send(formData);
                    }
                });
            }
            else {
                syn.$l.eventLog('$w.httpRequest', '지원하지 않는 기능. 매개변수 확인 필요', 'Error');
            }
        },

        httpSubmit(url, formID, method) {
            if (document.forms.length == 0) {
                return false;
            }
            else if (document.forms.length > 0 && $object.isNullOrUndefined(formID) == true) {
                formID = document.forms[0].id;
            }

            var form = document.forms[formID];
            if (form) {
                form.method = method || 'POST';
                form.action = url;
                form.submit();
            }
            else {
                return false;
            }
        },

        createBlobUrl: (globalRoot.URL && URL.createObjectURL && URL.createObjectURL.bind(URL)) || (globalRoot.webkitURL && webkitURL.createObjectURL && webkitURL.createObjectURL.bind(webkitURL)) || globalRoot.createObjectURL,
        revokeBlobUrl: (globalRoot.URL && URL.revokeObjectURL && URL.revokeObjectURL.bind(URL)) || (globalRoot.webkitURL && webkitURL.revokeObjectURL && webkitURL.revokeObjectURL.bind(webkitURL)) || globalRoot.revokeObjectURL,

        getCookie(id) {
            var matches = document.cookie.match(
                new RegExp(
                    '(?:^|; )' +
                    id.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
                    '=([^;]*)'
                )
            );
            return matches ? decodeURIComponent(matches[1]) : undefined;
        },

        setCookie(id, val, expires, path, domain, secure) {
            if ($object.isNullOrUndefined(expires) == true) {
                expires = new Date((new Date()).getTime() + (1000 * 60 * 60 * 24));
            }

            if ($object.isNullOrUndefined(path) == true) {
                path = '/';
            }

            document.cookie = id + '=' + encodeURI(val) + ((expires) ? ';expires=' + expires.toGMTString() : '') + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ((secure) ? ';secure' : '');
            return $request;
        },

        deleteCookie(id, path, domain) {
            if (syn.$r.getCookie(id)) {
                document.cookie = id + '=' + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
            }
            return $request;
        }
    });
    syn.$r = $request;
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $network = context.$network || new syn.module();
    var document = context.document;

    $network.extend({
        version: '1.0.0',

        myChannelID: null,
        connections: [],
        concreate($network) {
            $network.myChannelID = syn.$r.query('channelID') || syn.$r.query('ChannelID') || syn.$r.query('CHANNELID') || syn.$r.query('channelid') || '';
        },

        rooms: (function () {
            var currentTransactionID = Math.floor(Math.random() * 1000001);
            var boundChannels = {};

            function addChannel(channelWindow, origin, scope, handler) {
                function hasWin(arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].channelWindow === channelWindow) {
                            return true;
                        }
                    }
                    return false;
                }

                var exists = false;

                if (origin === '*') {
                    for (var k in boundChannels) {
                        if (!boundChannels.hasOwnProperty(k)) {
                            continue;
                        }

                        if (k === '*') {
                            continue;
                        }

                        if (typeof boundChannels[k][scope] === 'object') {
                            exists = hasWin(boundChannels[k][scope]);
                            if (exists) {
                                break;
                            }
                        }
                    }
                } else {
                    if ((boundChannels['*'] && boundChannels['*'][scope])) {
                        exists = hasWin(boundChannels['*'][scope]);
                    }
                    if (!exists && boundChannels[origin] && boundChannels[origin][scope]) {
                        exists = hasWin(boundChannels[origin][scope]);
                    }
                }

                if (exists) {
                    syn.$l.eventLog('$network.addChannel', 'origin: ' + origin + ', scope: ' + scope + '에 해당하는 채널이 이미 있습니다', 'Warning');
                    return;
                }

                if (typeof boundChannels[origin] != 'object') {
                    boundChannels[origin] = {};
                }

                if (typeof boundChannels[origin][scope] != 'object') {
                    boundChannels[origin][scope] = [];
                }

                boundChannels[origin][scope].push({
                    channelWindow: channelWindow,
                    handler: handler
                });
            }

            function removeChannel(channelWindow, origin, scope) {
                var arr = boundChannels[origin][scope];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].channelWindow === channelWindow) {
                        arr.splice(i, 1);
                    }
                }

                if (boundChannels[origin][scope].length === 0) {
                    delete boundChannels[origin][scope];
                }

                var idx = $network.connections.findIndex((item) => { return item.options.origin == origin && item.options.scope == scope });
                if (idx > -1) {
                    $network.connections.splice(idx, 1);
                }
            }

            function isArray(obj) {
                if (Array.isArray) {
                    return Array.isArray(obj);
                }
                else {
                    return (obj.constructor.toString().indexOf('Array') != -1);
                }
            }

            var transactionMessages = {};

            var onPostMessage = function (evt) {
                try {
                    if ($string.isNullOrEmpty(evt.data) == true) {
                        return;
                    }

                    var parsedMessage = JSON.parse(evt.data);
                    if (typeof parsedMessage !== 'object' || parsedMessage === null) {
                        syn.$l.eventLog('$network.onPostMessage', 'postMessage data 확인 필요', 'Warning');
                        return;
                    }
                } catch (error) {
                    return;
                }

                var sourceWindow = evt.source;
                var channelOrigin = evt.origin;
                var channelScope = null;
                var messageID = null;
                var methodName = null;

                if (typeof parsedMessage.method === 'string') {
                    var ar = parsedMessage.method.split('::');
                    if (ar.length == 2) {
                        channelScope = ar[0];
                        methodName = ar[1];
                    } else {
                        methodName = parsedMessage.method;
                    }
                }

                if (typeof parsedMessage.id !== 'undefined') {
                    messageID = parsedMessage.id;
                }

                if (typeof methodName === 'string') {
                    var delivered = false;
                    if (boundChannels[channelOrigin] && boundChannels[channelOrigin][channelScope]) {
                        for (var j = 0; j < boundChannels[channelOrigin][channelScope].length; j++) {
                            if (boundChannels[channelOrigin][channelScope][j].channelWindow === sourceWindow) {
                                boundChannels[channelOrigin][channelScope][j].handler(channelOrigin, methodName, parsedMessage);
                                delivered = true;
                                break;
                            }
                        }
                    }

                    if (!delivered && boundChannels['*'] && boundChannels['*'][channelScope]) {
                        for (var j = 0; j < boundChannels['*'][channelScope].length; j++) {
                            if (boundChannels['*'][channelScope][j].channelWindow === sourceWindow) {
                                boundChannels['*'][channelScope][j].handler(channelOrigin, methodName, parsedMessage);
                                break;
                            }
                        }
                    }
                }
                else if (typeof messageID != 'undefined') {
                    if (transactionMessages[messageID]) {
                        transactionMessages[messageID](channelOrigin, methodName, parsedMessage);
                    }
                }
            };

            if (context.addEventListener) {
                context.addEventListener('message', onPostMessage, false);
            }
            else if (context.attachEvent) {
                context.attachEvent('onmessage', onPostMessage);
            }

            var connectChannel = {
                connect(options) {
                    var channelID = options.scope || syn.$l.random();

                    var channel = $network.findChannel(channelID);
                    if (channel) {
                        syn.$l.eventLog('$network.connect', 'channelID: {0} 중복 확인 필요'.format(channelID), 'Warning');
                        return;
                    }

                    var debug = function (message) {
                        if (options.debugOutput) {
                            try {
                                if (typeof message !== 'string') {
                                    message = JSON.stringify(message);
                                }
                            }
                            catch (error) {
                                syn.$l.eventLog('$network.debug', 'channelID: {0}, message: {1}'.format(channelID, error.message), 'Error');
                            }

                            syn.$l.eventLog('$network.debug', 'channelID: {0}, message: {1}'.format(channelID, message), 'Information');
                        }
                    };

                    if (typeof options != 'object') {
                        syn.$l.eventLog('$network.options', '유효한 매개변수 없이 호출된 채널 빌드', 'Error');
                        return;
                    }

                    if (!options.window || !options.window.postMessage) {
                        syn.$l.eventLog('$network.context', '필수 매개변수 없이 호출된 채널 빌드', 'Error');
                        return;
                    }

                    if (context === options.window) {
                        syn.$l.eventLog('$network.context', '동일한 화면에서 거래되는 채널 생성은 허용되지 않음', 'Error');
                        return;
                    }

                    if (!options.origin) {
                        options.origin = '*';
                    }

                    var validOrigin = false;
                    if (typeof options.origin === 'string') {
                        var oMatch;
                        if (options.origin === '*') {
                            validOrigin = true;
                        }
                        else if (null !== (oMatch = options.origin.match(/^https?:\/\/(?:[-a-zA-Z0-9_\.])+(?::\d+)?/))) {
                            options.origin = oMatch[0].toLowerCase();
                            validOrigin = true;
                        }
                    }

                    if (!validOrigin) {
                        syn.$l.eventLog('$network.origin', '유효한 origin 없이 호출된 채널 빌드', 'Error');
                        return;
                    }

                    if (typeof options.scope !== 'undefined') {
                        if (typeof options.scope !== 'string') {
                            syn.$l.eventLog('$network.scope', 'scope는 문자열이어야 함', 'Error');
                            return;
                        }

                        if (options.scope.split('::').length > 1) {
                            syn.$l.eventLog('$network.scope', 'scope에는 이중 콜론 ("::")이 포함될 수 없음', 'Error');
                            return;
                        }
                    }

                    var registrationMappingMethods = {};
                    var sendRequests = {};
                    var receivedRequests = {};
                    var ready = false;
                    var pendingQueue = [];

                    var createTransaction = function (id, origin, callbacks) {
                        var shouldDelayReturn = false;
                        var completed = false;

                        return {
                            origin: origin,
                            invoke(callbackName, v) {
                                if (!receivedRequests[id]) {
                                    syn.$l.eventLog('$network.invoke', '존재하지 않는 트랜잭션의 콜백 호출 시도: ' + id, 'Warning');
                                    return;
                                }

                                var valid = false;
                                for (var i = 0; i < callbacks.length; i++) {
                                    if (callbackName === callbacks[i]) {
                                        valid = true;
                                        break;
                                    }
                                }
                                if (!valid) {
                                    syn.$l.eventLog('$network.invoke', '존재하지 않는 콜백 호출 시도: ' + callbackName, 'Warning');
                                    return;
                                }

                                postMessage({ id: id, callback: callbackName, params: v });
                            },
                            error(error, message) {
                                completed = true;
                                if (!receivedRequests[id]) {
                                    syn.$l.eventLog('$network.error', '존재하지 않는 메시지의 호출 시도: ' + id, 'Warning');
                                    return;
                                }

                                delete receivedRequests[id];

                                postMessage({ id: id, error: error, message: message });
                            },
                            complete(v) {
                                completed = true;
                                if (!receivedRequests[id]) {
                                    syn.$l.eventLog('$network.complete', '존재하지 않는 메시지의 호출 시도: ' + id, 'Warning');
                                    return;
                                }

                                delete receivedRequests[id];
                                postMessage({ id: id, result: v });
                            },
                            delayReturn(delay) {
                                if (typeof delay === 'boolean') {
                                    shouldDelayReturn = (delay === true);
                                }
                                return shouldDelayReturn;
                            },
                            completed() {
                                return completed;
                            }
                        };
                    };

                    var setTransactionTimeout = function (transactionID, timeout, method) {
                        return setTimeout(function () {
                            if (sendRequests[transactionID]) {
                                var message = '"' + method + '" 타임아웃 (' + timeout + 'ms) ';
                                (1, sendRequests[transactionID].error)('timeout_error', message);
                                delete sendRequests[transactionID];
                                delete transactionMessages[transactionID];
                            }
                        }, timeout);
                    };

                    var onMessage = function (origin, method, data) {
                        if (typeof options.gotMessageObserver === 'function') {
                            try {
                                options.gotMessageObserver(origin, data);
                            } catch (error) {
                                debug('gotMessageObserver() 오류: ' + error.toString());
                            }
                        }

                        if (data.id && method) {
                            if (registrationMappingMethods[method]) {
                                var transaction = createTransaction(data.id, origin, data.callbacks ? data.callbacks : []);
                                receivedRequests[data.id] = {};
                                try {
                                    if (data.callbacks && isArray(data.callbacks) && data.callbacks.length > 0) {
                                        for (var i = 0; i < data.callbacks.length; i++) {
                                            var path = data.callbacks[i];
                                            var params = data.params;
                                            var pathItems = path.split('/');
                                            for (var j = 0; j < pathItems.length - 1; j++) {
                                                var cp = pathItems[j];
                                                if (typeof params[cp] !== 'object') {
                                                    params[cp] = {};
                                                }
                                                params = params[cp];
                                            }
                                            params[pathItems[pathItems.length - 1]] = (function () {
                                                var callbackName = path;
                                                return function (data) {
                                                    return transaction.invoke(callbackName, data);
                                                };
                                            })();
                                        }
                                    }
                                    var resp = registrationMappingMethods[method](transaction, data.params);
                                    if (!transaction.delayReturn() && !transaction.completed()) {
                                        transaction.complete(resp);
                                    }
                                } catch (e) {
                                    var error = 'runtime_error';
                                    var message = null;
                                    if (typeof e === 'string') {
                                        message = e;
                                    } else if (typeof e === 'object') {
                                        if (e && isArray(e) && e.length == 2) {
                                            error = e[0];
                                            message = e[1];
                                        }
                                        else if (typeof e.error === 'string') {
                                            error = e.error;
                                            if (!e.message) {
                                                message = '';
                                            }
                                            else if (typeof e.message === 'string') {
                                                message = e.message;
                                            }
                                            else {
                                                e = e.message;
                                            }
                                        }
                                    }

                                    if (message === null) {
                                        try {
                                            message = JSON.stringify(e);
                                            if (typeof (message) == 'undefined') {
                                                message = e.toString();
                                            }
                                        } catch (e2) {
                                            message = e.toString();
                                        }
                                    }

                                    transaction.error(error, message);
                                }
                            }
                        } else if (data.id && data.callback) {
                            if (!sendRequests[data.id] || !sendRequests[data.id].callbacks || !sendRequests[data.id].callbacks[data.callback]) {
                                debug('유효하지 않는 콜백, id:' + data.id + ' (' + data.callback + ')');
                            } else {
                                sendRequests[data.id].callbacks[data.callback](data.params);
                            }
                        } else if (data.id) {
                            if (!sendRequests[data.id]) {
                                debug('유효하지 않는 응답: ' + data.id);
                            } else {
                                if (data.error) {
                                    (1, sendRequests[data.id].error)(data.error, data.message);
                                } else {
                                    if (data.result !== undefined) {
                                        (1, sendRequests[data.id].success)(data.result);
                                    }
                                    else {
                                        (1, sendRequests[data.id].success)();
                                    }
                                }
                                delete sendRequests[data.id];
                                delete transactionMessages[data.id];
                            }
                        } else if (method) {
                            if (registrationMappingMethods[method]) {
                                registrationMappingMethods[method]({ origin: origin }, data.params);
                            }
                        }
                    };

                    addChannel(options.window, options.origin, ((typeof options.scope === 'string') ? options.scope : ''), onMessage);

                    var scopeMethod = function (data) {
                        if (typeof options.scope === 'string' && options.scope.length) data = [options.scope, data].join('::');
                        return data;
                    };

                    var postMessage = function (message, force) {
                        if (!message) {
                            syn.$l.eventLog('$network.postMessage', 'null 메시지로 postMessage 호출', 'Error');
                            return;
                        }

                        var verb = (ready ? 'post ' : 'queue ');
                        debug(verb + ' message: ' + JSON.stringify(message));
                        if (!force && !ready) {
                            pendingQueue.push(message);
                        } else {
                            if (typeof options.postMessageObserver === 'function') {
                                try {
                                    options.postMessageObserver(options.origin, message);
                                } catch (e) {
                                    debug('postMessageObserver() 확인 필요: ' + e.toString());
                                }
                            }

                            options.window.postMessage(JSON.stringify(message), options.origin);
                        }
                    };

                    var onReady = function (transaction, type) {
                        debug('ready message received');
                        if (ready) {
                            syn.$l.eventLog('$network.onReady', 'ready 메시지 확인 필요', 'Warning');
                            return;
                        }

                        if (type === 'T') {
                            channelID += '-R';
                        } else {
                            channelID += '-L';
                        }

                        boundMessage.unbind('__ready');
                        ready = true;
                        debug('ready message accepted');

                        if (type === 'T') {
                            boundMessage.emit({ method: '__ready', params: 'A' });
                        }

                        while (pendingQueue.length) {
                            postMessage(pendingQueue.pop());
                        }

                        if (typeof options.onReady === 'function') {
                            options.onReady(boundMessage);
                        }
                    };

                    var boundMessage = {
                        unbind(method) {
                            if (registrationMappingMethods[method]) {
                                if (!(delete registrationMappingMethods[method])) {
                                    syn.$l.eventLog('$network.unbind', 'registrationMappingMethods 삭제 확인 필요: ' + method, 'Warning');
                                    return;
                                }

                                return true;
                            }
                            return false;
                        },
                        bind(method, callback) {
                            if (!method || typeof method !== 'string') {
                                syn.$l.eventLog('$network.bind', 'method 매개변수 확인 필요', 'Warning');
                                return;
                            }

                            if (!callback || typeof callback !== 'function') {
                                syn.$l.eventLog('$network.bind', 'callback 매개변수 확인 필요', 'Warning');
                                return;
                            }

                            if (registrationMappingMethods[method]) {
                                syn.$l.eventLog('$network.bind', method + ' method 중복 확인 필요', 'Warning');
                                return;
                            }

                            registrationMappingMethods[method] = callback;
                            return $network;
                        },
                        call(data) {
                            if (!data) {
                                syn.$l.eventLog('$network.call', '매개변수 확인 필요', 'Warning');
                                return;
                            }

                            if (!data.method || typeof data.method !== 'string') {
                                syn.$l.eventLog('$network.call', 'method 매개변수 확인 필요', 'Warning');
                                return;
                            }

                            if (!data.success || typeof data.success !== 'function') {
                                syn.$l.eventLog('$network.call', 'callback 매개변수 확인 필요', 'Warning');
                                return;
                            }

                            var callbacks = {};
                            var callbackNames = [];
                            var seen = [];

                            var pruneFunctions = function (path, params) {
                                if (seen.indexOf(params) >= 0) {
                                    syn.$l.eventLog('$network.pruneFunctions', 'recursive params 데이터 없음', 'Warning');
                                    return;
                                }
                                seen.push(params);

                                if (typeof params === 'object') {
                                    for (var k in params) {
                                        if (!params.hasOwnProperty(k)) {
                                            continue;
                                        }

                                        var np = path + (path.length ? '/' : '') + k;
                                        if (typeof params[k] === 'function') {
                                            callbacks[np] = params[k];
                                            callbackNames.push(np);
                                            delete params[k];
                                        } else if (typeof params[k] === 'object') {
                                            pruneFunctions(np, params[k]);
                                        }
                                    }
                                }
                            };
                            pruneFunctions('', data.params);

                            var message = { id: currentTransactionID, method: scopeMethod(data.method), params: data.params };
                            if (callbackNames.length) {
                                message.callbacks = callbackNames;
                            }

                            if (data.timeout) {
                                setTransactionTimeout(currentTransactionID, data.timeout, scopeMethod(data.method));
                            }

                            sendRequests[currentTransactionID] = { callbacks: callbacks, error: data.error, success: data.success };
                            transactionMessages[currentTransactionID] = onMessage;

                            currentTransactionID++;

                            postMessage(message);
                        },
                        emit(data) {
                            if (!data) {
                                throw 'missing arguments to emit function';
                                syn.$l.eventLog('$network.emit', 'emit params 데이터 없음', 'Warning');
                                return;
                            }

                            if (!data.method || typeof data.method !== 'string') {
                                syn.$l.eventLog('$network.emit', 'method 매개변수 확인 필요', 'Warning');
                                return;
                            }

                            postMessage({ method: scopeMethod(data.method), params: data.params });
                        },
                        destroy() {
                            removeChannel(options.window, options.origin, ((typeof options.scope === 'string') ? options.scope : ''));
                            if (context.removeEventListener) {
                                context.removeEventListener('message', onMessage, false);
                            }
                            else if (context.detachEvent) {
                                context.detachEvent('onmessage', onMessage);
                            }

                            ready = false;
                            registrationMappingMethods = {};
                            receivedRequests = {};
                            sendRequests = {};
                            options.origin = null;
                            pendingQueue = [];
                            channelID = '';
                            debug('채널 삭제');
                        }
                    };

                    boundMessage.bind('__ready', onReady);
                    setTimeout(function () {
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
            return $network.connections.find((item) => { return item.options.scope == channelID });
        },

        // syn.$n.call('local-channelID', 'pageLoad', '?')
        call(channelID, evt, params) {
            var connection = $network.findChannel(channelID);
            if (connection) {
                var val = {
                    method: evt,
                    params: params,
                    error: (error, message) => { },
                    success: (val) => { }
                };

                if (connection.options.debugOutput === true) {
                    val.error = (error, message) => {
                        syn.$l.eventLog('$network.call.error', '"{0}" call error: {1}, message: {2}, channelID: {3}'.format(evt, error, message, connection.options.scope), 'Information');
                    };

                    val.success = (val) => {
                        syn.$l.eventLog('$network.call.success', '"{0}" call returns: {1}, channelID: {2}'.format(evt, val, connection.options.scope), 'Information');
                    };
                }

                connection.call(val);
            }
        },

        // syn.$n.broadCast('pageLoad', '?')
        broadCast(evt, params) {
            for (var i = 0; i < connections.length; i++) {
                var connection = connections[i];
                if (connection) {
                    var val = {
                        method: evt,
                        params: params,
                        error: (error, message) => { },
                        success: (val) => { }
                    };

                    if (connection.options.debugOutput === true) {
                        val.error = (error, message) => {
                            syn.$l.eventLog('$network.call.error', '"{0}" call error: {1}, message: {2}, channelID: {3}'.format(evt, error, message, connection.options.scope), 'Information');
                        };

                        val.success = (val) => {
                            syn.$l.eventLog('$network.call.success', '"{0}" call returns: {1}, channelID: {2}'.format(evt, val, connection.options.scope), 'Information');
                        };
                    }

                    connection.call(val);
                }
            }
        },

        // syn.$n.emit('pageLoad', '?')
        emit(evt, params) {
            if ($string.isNullOrEmpty($network.myChannelID) == false) {
                var connection = $network.findChannel($network.myChannelID);
                if (connection) {
                    var val = {
                        method: evt,
                        params: params,
                        error: (error, message) => { },
                        success: (val) => { }
                    };

                    if (connection.options.debugOutput === true) {
                        val.error = (error, message) => {
                            syn.$l.eventLog('$network.emit.error', '"{0}" emit error: {1}, message: {2}'.format(evt, error, message), 'Information');
                        };

                        val.success = (val) => {
                            syn.$l.eventLog('$network.emit.success', '"{0}" emit returns: {1}'.format(evt, val), 'Information');
                        };
                    }

                    connection.emit(val);
                }
            }
        }
    });

    $network.myChannelID = syn.$r.query('channelID') || syn.$r.query('ChannelID') || syn.$r.query('CHANNELID') || syn.$r.query('channelid') || '';
    syn.$n = $network;
})(globalRoot);

/// <reference path='syn.core.js' />
/// <reference path='syn.library.js' />

(function (context) {
    'use strict';
    var $webform = context.$webform || new syn.module();
    var document = null;
    if (globalRoot.devicePlatform === 'node') {
    }
    else {
        $webform.context = context;
        $webform.document = context.document;
        document = context.document;
    }

    $webform.extend({
        version: '1.0.0',
        localeID: 'ko-KR',
        cookiePrefixName: 'HandStack',
        method: 'POST',
        isPageLoad: false,
        transactionLoaderID: null,
        pageReadyTimeout: 60000,
        eventAddReady: (globalRoot.devicePlatform === 'node') ? null : new CustomEvent('addready'),
        eventRemoveReady: (globalRoot.devicePlatform === 'node') ? null : new CustomEvent('removeready'),
        mappingModule: true,
        moduleReadyIntervalID: null,
        remainingReadyIntervalID: null,
        remainingReadyCount: 0,

        defaultControlOptions: {
            value: '',
            text: '',
            dataType: 'string',
            bindingID: '',
            resourceKey: '',
            localeID: 'ko-KR',
            required: false,
            tooltip: ''
        },

        setStorage(prop, val, isLocal, ttl) {
            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal == true) {
                    localStorage.setItem(prop, JSON.stringify(val));
                }
                else {
                    if (ttl == undefined || ttl == null) {
                        ttl = 1200000;
                    }

                    var now = new Date();
                    var item = {
                        value: val,
                        expiry: now.getTime() + ttl,
                        ttl: ttl
                    };
                    localStorage.setItem(prop, JSON.stringify(item));
                }
            }
            else {
                if (isLocal == true) {
                    localStorage.setItem(prop, JSON.stringify(val));
                }
                else {
                    sessionStorage.setItem(prop, JSON.stringify(val));
                }
            }

            return $webform;
        },

        getStorage(prop, isLocal) {
            var result = null;
            var val = null;

            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal == true) {
                    val = localStorage.getItem(prop);
                }
                else {
                    var itemStr = localStorage.getItem(prop)
                    if (!itemStr) {
                        return null;
                    }
                    var item = JSON.parse(itemStr)
                    var now = new Date()
                    if (now.getTime() > item.expiry) {
                        localStorage.removeItem(prop);
                        return null;
                    }

                    result = item.value;

                    var ttl = item.ttl;
                    var now = new Date();
                    var item = {
                        value: result,
                        expiry: now.getTime() + ttl,
                        ttl: ttl
                    };
                    localStorage.setItem(prop, JSON.stringify(item));
                }
            }
            else {
                if (isLocal == true) {
                    result = JSON.parse(localStorage.getItem(prop));
                }
                else {
                    result = JSON.parse(sessionStorage.getItem(prop));
                }
            }

            return result;
        },

        removeStorage(prop, isLocal) {
            if (isLocal == undefined || isLocal == null) {
                isLocal = false;
            }

            if (globalRoot.devicePlatform === 'node') {
                localStorage.removeItem(prop);
            }
            else {
                if (isLocal == true) {
                    localStorage.removeItem(prop);
                }
                else {
                    sessionStorage.removeItem(prop);
                }
            }
        },

        activeControl(evt) {
            var result = null;
            evt = evt || context.event || null;
            if (evt) {
                result = evt.target || evt.srcElement || evt || null;
            }
            else {
                result = document.activeElement || null;
            }

            if (result == null) {
                if (globalRoot.$this) {
                    result = $this.context.focusControl || null;
                }
            }
            else {
                $this.context.focusControl = result;
            }

            return result;
        },

        async contentLoaded() {
            syn.$l.addEvent(document, 'addready', function () {
                syn.$w.remainingReadyCount++;
            });

            syn.$l.addEvent(document, 'removeready', function () {
                syn.$w.remainingReadyCount--;
            });

            if (syn.$l.get('moduleScript')) {
                syn.$w.extend({ pageScript: syn.$l.get('moduleScript').value });
            }
            else {
                var pathname = location.pathname;
                if (pathname.split('/').length > 0) {
                    var filename = pathname.split('/')[pathname.split('/').length - 1];
                    $webform.extend({
                        pageProject: pathname.split('/')[pathname.split('/').length - 2],
                        pageScript: '$' + (filename.indexOf('.') > -1 ? filename.substring(0, filename.indexOf('.')) : filename)
                    });
                }

                var input = document.createElement('input');
                input.id = 'moduleScript';
                input.type = 'text';
                input.style.display = 'none';
                input.value = syn.$w.pageScript;
                document.body.appendChild(input);

                if (document.forms) {
                    for (var i = 0; i < document.forms.length; i++) {
                        syn.$l.addEvent(document.forms[i], 'submit', function (e) {
                            var result = false;
                            var el = e.target || e.srcElement;
                            if ($this && $this.hook && $this.hook.frameEvent) {
                                result = $this.hook.frameEvent('beforeSubmit', {
                                    el: el,
                                    evt: e
                                });

                                if ($object.isNullOrUndefined(result) == true || $string.toBoolean(result) == false) {
                                    result = false;
                                }
                            }

                            if (result == false) {
                                e.returnValue = false;
                                e.cancel = true;
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }

                                if (e.stopPropagation) {
                                    e.stopPropagation();
                                }
                                return false;
                            }
                        });
                    }
                }
            }

            var pageLoad = function () {
                if (context.domainPageLoad) {
                    context.domainPageLoad();
                }

                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.pageLoad) {
                    mod.hook.pageLoad();
                }

                if (mod && mod.hook.pageMatch) {
                    var matchMedia_change = function (evt) {
                        var media = evt.media;
                        var classInfix = 'xs';
                        switch (media) {
                            case '(min-width: 576px)':
                                classInfix = 'sm';
                                break;
                            case '(min-width: 768px)':
                                classInfix = 'md';
                                break;
                            case '(min-width: 992px)':
                                classInfix = 'lg';
                                break;
                            case '(min-width: 1200px)':
                                classInfix = 'xl';
                                break;
                            case '(min-width: 1400px)':
                                classInfix = 'xxl';
                                break;
                        }

                        document.dispatchEvent(new CustomEvent('mediaquery', { detail: classInfix }));
                        mod.hook.pageMatch(classInfix);

                        if (context.domainPageMediaQuery) {
                            context.domainPageMediaQuery(classInfix);
                        }
                    }

                    syn.$l.addEvent(matchMedia('(min-width: 0px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 576px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 768px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 992px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 1200px)'), 'change', matchMedia_change);
                    syn.$l.addEvent(matchMedia('(min-width: 1400px)'), 'change', matchMedia_change);
                }

                if ($object.isNullOrUndefined(syn.$w.User) == true) {
                    var sso = {
                        TokenID: '',
                        UserNo: 0,
                        UserID: '',
                        UserName: '',
                        BusinessTel: '',
                        BusinessEMail: '',
                        DepartmentID: '',
                        DepartmentName: '',
                        PositionID: '',
                        PositionName: '',
                        CompanyNo: '',
                        CompanyName: '',
                        Roles: [],
                        Claims: []
                    }

                    if (syn.$w.getSSOInfo) {
                        syn.$w.User = syn.$w.getSSOInfo() || sso;
                    }
                    else {
                        syn.$w.User = sso;
                    }
                }

                if ($object.isNullOrUndefined(syn.$w.User) == false) {
                    syn.$l.deepFreeze(syn.$w.User);
                }

                if ($object.isNullOrUndefined(syn.$w.Variable) == false) {
                    syn.$l.deepFreeze(syn.$w.Variable);
                }

                var hidden = null;
                if (document.forms) {
                    for (var i = 0; i < document.forms.length; i++) {
                        var form = document.forms[i];
                        hidden = form.getAttribute('hidden');
                        if ($object.isNullOrUndefined(hidden) == false && $string.toBoolean(hidden) == false) {
                            form.removeAttribute('hidden');
                            syn.$m.removeClass(form, 'hidden');
                            form.style.display = '';
                        }
                    }
                }

                hidden = document.body.getAttribute('hidden');
                if ($object.isNullOrUndefined(hidden) == false && $string.toBoolean(hidden) == false) {
                    document.body.removeAttribute('hidden');
                    syn.$m.removeClass(document.body, 'hidden');
                    document.body.style.display = '';
                }

                if (mod && mod.context.synControls && ($object.isNullOrUndefined(mod.context.tabOrderControls) == true || mod.context.tabOrderControls.length == 0)) {
                    var synTagNames = [];
                    var syn_tags = document.body.outerHTML.match(/<(syn_).+?>/gi);
                    if (syn_tags) {
                        var synControlCount = syn_tags.length;
                        for (var i = 0; i < synControlCount; i++) {
                            var syn_tag = syn_tags[i];
                            var tagName = syn_tag.substring(1, syn_tag.indexOf(' ')).toUpperCase();
                            synTagNames.push(tagName);
                        }
                    }

                    synTagNames = $array.distinct(synTagNames);
                    var findElements = document.querySelectorAll('input,select,textarea,button' + (synTagNames.length > 0 ? ',' + synTagNames.join(',') : ''));
                    var els = [];
                    var length = findElements.length;
                    for (var idx = 0; idx < length; idx++) {
                        var el = findElements[idx];
                        if (el && el.style && el.style.display == 'none' || el.type == 'hidden') {
                            if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
                                els.push(el);
                            }
                            else {
                                continue;
                            }
                        }
                        else {
                            if (el.id && el.id.includes('btn_syneditor_') == false && el.id.includes('chk_syngrid_') == false && el.id.includes('_hidden') == false) {
                                els.push(el);
                            }
                            else if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
                                els.push(el);
                            }
                            else if (el.id && el.tagName.includes('SYN_') == true) {
                                els.push(el);
                            }
                        }
                    }

                    var items = [];
                    var i = 0;
                    length = els.length;
                    for (var idx = 0; idx < length; idx++) {
                        var el = els[idx];
                        if (el.id && el.id.includes('btn_syneditor_') == false && el.id.includes('chk_syngrid_') == false && el.id.includes('_hidden') == false) {
                            var elID = el.id;
                            var offset = syn.$d.offset(el);
                            var baseID = el.getAttribute('baseID');
                            if (baseID) {
                                elID = baseID;
                            }

                            var setting = mod.context.synControls.find(function (item) { return item.id == elID });

                            if (setting) {
                                if (setting.type == 'datepicker') {
                                    offset = syn.$d.offset(el.parentElement);
                                }
                                else if (setting.type == 'colorpicker') {
                                    offset = syn.$d.offset(el.parentElement.parentElement);
                                }

                                items.push({
                                    elID: el.id,
                                    tagName: el.tagName,
                                    formID: setting.formDataFieldID,
                                    type: setting.type,
                                    top: offset.top,
                                    left: offset.left
                                });
                            }
                        }
                        else if (el.id && el.tagName.toUpperCase() == 'SELECT' && (el.getAttribute('syn-datafield') != null || el.getAttribute('syn-datafield') != undefined)) {
                            var offset = null;
                            if (el.getAttribute('multiple') === false) {
                                var control = syn.uicontrols.$select.getControl(el.id);
                                if (control) {
                                    offset = syn.$d.offset(control.picker.select);
                                }
                            }
                            else {
                                var control = syn.uicontrols.$multiselect.getControl(el.id);
                                if (control) {
                                    offset = syn.$d.offset(control.picker.select);
                                }
                            }

                            if (offset) {
                                var setting = mod.context.synControls.find(function (item) { return item.id == el.id });

                                if (setting) {
                                    items.push({
                                        elID: el.id,
                                        tagName: el.tagName,
                                        formID: setting.formDataFieldID,
                                        type: setting.type,
                                        top: offset.top,
                                        left: offset.left
                                    });
                                }
                            }
                        }
                        else if (el.id && el.tagName.includes('SYN_') == true) {
                            var elID = el.id.replace('_hidden', '');
                            var offset = null;
                            if (el.tagName == 'SYN_DATEPICKER') {
                                // var offset = syn.$d.offset(el);
                            }
                            else if (el.tagName == 'SYN_COLORPICKER') {
                                // var offset = syn.$d.offset(el);
                            }

                            if (offset) {
                                var setting = mod.context.synControls.find(function (item) { return item.id == elID });
                                if (setting) {
                                    items.push({
                                        elID: elID,
                                        tagName: el.tagName,
                                        formID: setting.formDataFieldID,
                                        type: setting.type,
                                        top: offset.top,
                                        left: offset.left
                                    });
                                }
                            }
                        }

                        i = i + 1;
                    }

                    mod.context.focusControl = null;
                    mod.context.tabOrderFocusID = null;
                    mod.context.tabOrderControls = items;

                    if (mod && mod.hook.frameEvent) {
                        mod.hook.frameEvent('tabOrderControls', mod.context.tabOrderControls);
                    }

                    if (mod.context.tabOrderControls.length > 0) {
                        if (mod.config) {
                            // html (html defined), tdlr (top > down > left > right), lrtd (left > right > top > down)
                            if ($string.isNullOrEmpty(mod.context.tapOrderFlow) == true) {
                                mod.context.tapOrderFlow = 'html';
                            }

                            if (mod.context.tapOrderFlow == 'tdlr') {
                                mod.context.tabOrderControls.sort(
                                    function (a, b) {
                                        if (a.top === b.top) {
                                            return a.left - b.left;
                                        }
                                        return a.top > b.top ? 1 : -1;
                                    });
                            }
                            else if (mod.context.tapOrderFlow == 'lrtd') {
                                mod.context.tabOrderControls.sort(
                                    function (a, b) {
                                        if (a.left === b.left) {
                                            return a.top - b.top;
                                        }
                                        return a.left > b.left ? 1 : -1;
                                    });
                            }
                        }
                        else {
                            mod.context.tabOrderControls.sort(
                                function (a, b) {
                                    if (a.top === b.top) {
                                        return a.left - b.left;
                                    }
                                    return a.top > b.top ? 1 : -1;
                                });
                        }
                    }

                    var focusEL = syn.$l.querySelector("[autofocus]")
                    if (focusEL && focusEL.id && focusEL.tagName) {
                        var tagName = focusEL.tagName.toUpperCase();
                        var tags = 'input,select,textarea,button'.toUpperCase().split(',');
                        if (tags.indexOf(tagName) > -1) {
                            mod.context.focusControl = focusEL;
                            mod.context.tabOrderFocusID = focusEL.id;
                            setTimeout(function () {
                                focusEL.focus();
                            });
                        }
                    }
                }

                if (mod && mod.hook.pageComplete) {
                    mod.hook.pageComplete();
                }

                if (context.domainPageComplete) {
                    context.domainPageComplete();
                }
            }

            var pageFormInit = async function () {
                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.pageFormInit) {
                    await mod.hook.pageFormInit();
                }

                if (context.domainLibraryLoad) {
                    var isContinue = domainLibraryLoad();
                    if ($object.isNullOrUndefined(isContinue) == false && isContinue === false) {
                        return false;
                    }
                }

                var synControlList = [];
                var synControls = document.querySelectorAll('[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';
                        var controlType = '';

                        var controlOptions = synControl.getAttribute('syn-options') || null;
                        if (controlOptions != null) {
                            try {
                                controlOptions = eval('(' + controlOptions + ')');
                            } catch (error) {
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요 '.format(elementID) + error.message, 'Warning');
                            }
                        }
                        else {
                            controlOptions = {};
                        }

                        var controlModule = null;
                        if (syn.uicontrols) {
                            if (tagName.indexOf('SYN_') > -1) {
                                var moduleName = tagName.substring(4).toLowerCase();
                                controlModule = syn.uicontrols['$' + moduleName];
                                controlType = moduleName;
                            }
                            else {
                                switch (tagName) {
                                    case 'BUTTON':
                                        controlModule = syn.uicontrols.$button;
                                        controlType = 'button';
                                        break;
                                    case 'INPUT':
                                        controlType = synControl.getAttribute('type').toLowerCase();
                                        switch (controlType) {
                                            case 'hidden':
                                            case 'text':
                                            case 'password':
                                            case 'color':
                                            case 'email':
                                            case 'number':
                                            case 'search':
                                            case 'tel':
                                            case 'url':
                                                controlModule = syn.uicontrols.$textbox;
                                                break;
                                            case 'submit':
                                            case 'reset':
                                            case 'button':
                                                controlModule = syn.uicontrols.$button;
                                                break;
                                            case 'radio':
                                                controlModule = syn.uicontrols.$radio;
                                                break;
                                            case 'checkbox':
                                                controlModule = syn.uicontrols.$checkbox;
                                                break;
                                        }
                                        break;
                                    case 'TEXTAREA':
                                        controlModule = syn.uicontrols.$textarea;
                                        controlType = 'textarea';
                                        break;
                                    case 'SELECT':
                                        if (synControl.getAttribute('multiple') == null) {
                                            controlModule = syn.uicontrols.$select;
                                            controlType = 'select';
                                        }
                                        else {
                                            controlModule = syn.uicontrols.$multiselect;
                                            controlType = 'multiselect';
                                        }
                                        break;
                                    default:
                                        controlModule = syn.uicontrols.$element;
                                        controlType = 'element';
                                        break;
                                }
                            }
                        }

                        syn.$l.addEvent(synControl.id, 'focus', function (evt) {
                            $this.context.focusControl = evt.target || evt.currentTarget || evt.srcElement;
                            if ($this.context.focusControl) {
                                $this.context.tabOrderFocusID = $this.context.focusControl.id;
                            }
                            else {
                                $this.context.tabOrderFocusID = null;
                            }
                        });

                        if (controlModule) {
                            if (controlModule.addModuleList) {
                                controlModule.addModuleList(synControl, synControlList, controlOptions, controlType);
                            }

                            controlModule.controlLoad(elementID, controlOptions);
                        }
                        else {
                            if (elementID) {
                                synControlList.push({
                                    id: elementID,
                                    formDataFieldID: formDataField,
                                    field: dataField,
                                    module: null,
                                    type: controlType ? controlType : synControl.tagName.toLowerCase()
                                });
                            }

                            if ($this.hook.controlLoad) {
                                $this.hook.controlLoad(elementID, controlOptions);
                            }
                        }
                    }
                }

                var synEventControls = document.querySelectorAll('[syn-events]');
                for (var i = 0; i < synEventControls.length; i++) {
                    var synControl = synEventControls[i];
                    var events = null;

                    try {
                        events = eval('(' + synControl.getAttribute('syn-events') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요 '.format(synControl.id) + error.message, 'Warning');
                    }

                    if (events && $this.event) {
                        var length = events.length;
                        for (var j = 0; j < length; j++) {
                            var event = events[j];

                            var func = $this.event[synControl.id + '_' + event];
                            if (func) {
                                syn.$l.addEvent(synControl.id, event, func);
                            }
                        }
                    }
                }

                var synOptionControls = document.querySelectorAll('[syn-options]');
                for (var i = 0; i < synOptionControls.length; i++) {
                    var synControl = synOptionControls[i];
                    var elID = synControl.id.replace('_hidden', '');
                    var options = null;

                    try {
                        var el = syn.$l.get(synControl.id + '_hidden') || syn.$l.get(synControl.id);
                        options = eval('(' + el.getAttribute('syn-options') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요'.format(synControl.id) + error.message, 'Warning');
                    }

                    if (options && options.transactConfig && options.transactConfig.triggerEvent) {
                        if ($object.isString(options.transactConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.transactConfig.triggerEvent, function (evt) {
                                var el = $webform.activeControl(evt);
                                var options = eval('(' + el.getAttribute('syn-options') + ')');
                                var transactConfig = null;
                                if (options && options.transactConfig) {
                                    transactConfig = options.transactConfig;
                                }

                                if (transactConfig) {
                                    syn.$w.transactionAction(transactConfig, transactConfig.options);
                                }
                            });
                        }
                        else if ($object.isArray(options.transactConfig.triggerEvent) == true) {
                            var triggerFunction = function (evt) {
                                var el = $webform.activeControl(evt);
                                var options = eval('(' + el.getAttribute('syn-options') + ')');
                                var transactConfig = null;
                                if (options && options.transactConfig) {
                                    transactConfig = options.transactConfig;
                                }

                                if (transactConfig) {
                                    syn.$w.transactionAction(transactConfig, transactConfig.options);
                                }
                            };

                            for (var key in options.transactConfig.triggerEvent) {
                                var eventName = options.transactConfig.triggerEvent[key];
                                syn.$l.addEvent(elID, eventName, triggerFunction);
                            }
                        }
                    }

                    if (options && options.triggerConfig && options.triggerConfig.triggerEvent) {
                        if ($object.isString(options.triggerConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.triggerConfig.triggerEvent, function (triggerConfig) {
                                var el = $webform.activeControl(evt);
                                if (triggerConfig && $object.isNullOrUndefined(triggerConfig.triggerEvent) == true) {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    triggerConfig = options.triggerConfig;
                                }
                                else {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    if (options && options.triggerConfig) {
                                        triggerConfig = options.triggerConfig;
                                    }
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            });
                        }
                        else if ($object.isArray(options.triggerConfig.triggerEvent) == true) {
                            var triggerFunction = function (triggerConfig) {
                                var el = $webform.activeControl(evt);
                                if (triggerConfig && $object.isNullOrUndefined(triggerConfig.triggerEvent) == true) {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    triggerConfig = options.triggerConfig;
                                }
                                else {
                                    var options = eval('(' + el.getAttribute('syn-options') + ')');
                                    if (options && options.triggerConfig) {
                                        triggerConfig = options.triggerConfig;
                                    }
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            };

                            for (var key in options.triggerConfig.triggerEvent) {
                                var eventName = options.triggerConfig.triggerEvent[key];
                                syn.$l.addEvent(elID, eventName, triggerFunction);
                            }
                        }
                    }
                }

                var elem = document.createElement('input');
                elem.type = 'hidden';
                elem.id = 'synControlList';
                elem.textContent = JSON.stringify(synControlList);;
                document.body.appendChild(elem);

                if (mod) {
                    mod.context.synControls = synControlList;
                }
                else {
                    context.synControls = synControlList;
                }

                syn.$w.remainingReadyIntervalID = setInterval(function () {
                    if (syn.$w.remainingReadyCount == 0) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;

                        pageLoad();
                        syn.$w.isPageLoad = true;
                    }
                }, 25);

                setTimeout(function () {
                    if (syn.$w.remainingReadyIntervalID != null) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;
                        syn.$l.eventLog('pageLoad', '화면 초기화 오류, remainingReadyCount: {0} 확인 필요'.format(syn.$w.remainingReadyCount), 'Fatal');
                    }
                }, syn.$w.pageReadyTimeout);
            };

            if (syn.$w.mappingModule == true) {
                var module = {};
                if (syn.$l.get('moduleScript')) {
                    syn.$w.extend({ pageScript: syn.$l.get('moduleScript').value });
                }

                if ($string.toBoolean(window.noPageScript) == false) {
                    module = await syn.$w.fetchScript(syn.$w.pageScript.replace('$', ''));
                }

                var mod = context[syn.$w.pageScript] || new syn.module();
                mod.config = {
                    programID: syn.Config.ApplicationID,
                    businessID: syn.$w.pageProject || syn.Config.ProjectID,
                    systemID: syn.Config.SystemID,
                    transactionID: syn.$w.pageScript.replace('$', ''),
                    transactions: [],
                    dataSource: {},
                    actionButtons: []
                };
                mod.prop = {};
                mod.model = {};
                mod.hook = {};
                mod.event = {};
                mod.translate = {};
                mod.transaction = {};
                mod.method = {};
                mod.store = {};
                mod.context = {};

                mod.extend(module);
                context[syn.$w.pageScript] = mod;
                context['$this'] = mod;

                if (window.synLoader) {
                    syn.$l.addEvent(document, 'pageReady', pageFormInit);
                    context.pageFormReady = true;
                    setTimeout(function () {
                        syn.$l.removeEvent(document, 'pageReady', pageFormInit);

                        if (syn.$w.remainingReadyIntervalID != null) {
                            syn.$l.eventLog('pageReady', '화면 초기화 오류, loader 또는 dispatchEvent 확인 필요', 'Fatal');
                        }
                    }, syn.$w.pageReadyTimeout);
                }
                else {
                    await pageFormInit();
                }
            }
            else {
                pageLoad();
                syn.$w.isPageLoad = true;
            }
        },

        addReadyCount() {
            if (syn.$w.eventAddReady && syn.$w.isPageLoad == false) {
                document.dispatchEvent(syn.$w.eventAddReady);
            }
        },

        removeReadyCount() {
            if (syn.$w.eventRemoveReady && syn.$w.isPageLoad == false) {
                document.dispatchEvent(syn.$w.eventRemoveReady);
            }
        },

        createSelection(el, start, end) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (el.createTextRange) {
                var newend = end - start;
                var selRange = el.createTextRange();
                selRange.collapse(true);
                selRange.moveStart('character', start);
                selRange.moveEnd('character', newend);
                selRange.select();
                newend = null;
                selRange = null;
            }
            else if (el.type != 'email' && el.setSelectionRange) {
                el.setSelectionRange(start, end);
            }

            el.focus();
        },

        argumentsExtend() {
            var extended = {};

            for (var key in arguments) {
                var argument = arguments[key];
                for (var prop in argument) {
                    if (Object.prototype.hasOwnProperty.call(argument, prop)) {
                        extended[prop] = argument[prop];
                    }
                }
            }

            return extended;
        },

        loadJson(url, setting, success, callback, async, isForceCallback) {
            if (async == undefined || async == null) {
                async = true;
            }

            if (isForceCallback == undefined || isForceCallback == null) {
                isForceCallback = false;
            }

            var xhr = new XMLHttpRequest();
            if (async === true) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            if (success) {
                                success(setting, JSON.parse(xhr.responseText));
                            }

                            if (callback) {
                                callback();
                            }
                        }
                        else {
                            syn.$l.eventLog('$w.loadJson', 'async url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                        }

                        if (xhr.status !== 200 && callback && isForceCallback == true) {
                            callback();
                        }
                    }
                };
                xhr.open('GET', url, true);

                if (syn.$w.setServiceClientHeader) {
                    if (syn.$w.setServiceClientHeader(xhr) == false) {
                        return;
                    }
                }

                xhr.send();
            }
            else {
                xhr.open('GET', url, false);

                if (syn.$w.setServiceClientHeader) {
                    if (syn.$w.setServiceClientHeader(xhr) == false) {
                        return;
                    }
                }

                xhr.send();

                if (xhr.status === 200) {
                    if (success) {
                        success(setting, JSON.parse(xhr.responseText));
                    }

                    if (callback) {
                        callback();
                    }
                }
                else {
                    syn.$l.eventLog('$w.loadJson', 'sync url: ' + url + ', status: ' + xhr.status.toString() + ', responseText: ' + xhr.responseText, 'Error');
                }

                if (callback && isForceCallback == true) {
                    callback();
                }
            }
        },

        getTriggerOptions(el) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            return JSON.parse(el.getAttribute('triggerOptions'));
        },

        triggerAction(triggerConfig) {
            if ($this) {
                var isContinue = true;

                var defaultParams = {
                    args: [],
                    options: {}
                };

                triggerConfig.params = syn.$w.argumentsExtend(defaultParams, triggerConfig.params);

                if ($this.hook.beforeTrigger) {
                    isContinue = $this.hook.beforeTrigger(triggerConfig.triggerID, triggerConfig.action, triggerConfig.params);
                }

                if ($object.isNullOrUndefined(isContinue) == true || isContinue == true) {
                    var el = syn.$l.get(triggerConfig.triggerID);
                    var triggerResult = null;
                    var trigger = null;

                    if (triggerConfig.action && triggerConfig.action.startsWith('syn.uicontrols.$') == true) {
                        trigger = syn.uicontrols;
                        var currings = triggerConfig.action.split('.');
                        if (currings.length > 3) {
                            for (var i = 2; i < currings.length; i++) {
                                var curring = currings[i];
                                if (trigger) {
                                    trigger = trigger[curring];
                                }
                                else {
                                    trigger = context[curring];
                                }
                            }
                        }
                        else {
                            trigger = context[triggerConfig.action];
                        }
                    }
                    else {
                        trigger = $this.event ? $this.event['{0}_{1}'.format(triggerConfig.triggerID, triggerConfig.action)] : null;
                    }

                    if (trigger) {
                        el.setAttribute('triggerOptions', JSON.stringify(triggerConfig.params.options));

                        if (triggerConfig.action.indexOf('$') > -1) {
                            $array.addAt(triggerConfig.params.args, 0, triggerConfig.triggerID);
                        }

                        triggerResult = trigger.apply(el, triggerConfig.params.args);
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, {
                                elID: triggerConfig.triggerID,
                                result: triggerResult
                            });
                        }
                    }
                    else {
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger('{0} trigger 확인 필요'.format(triggerConfig.action), triggerConfig.action, null);
                        }
                    }
                }
                else {
                    if ($this.hook.afterTrigger) {
                        $this.hook.afterTrigger('hook.beforeTrigger continue false', triggerConfig.action, null);
                    }
                }
            }
        },

        tryAddFunction(transactConfig) {
            if (transactConfig && $this && $this.config) {
                if ($object.isNullOrUndefined(transactConfig.noProgress) == true) {
                    transactConfig.noProgress = false;
                }

                try {
                    if ($object.isNullOrUndefined($this.config.transactions) == true) {
                        $this.config.transactions = [];
                    }

                    var transactions = $this.config.transactions;
                    for (var i = 0; i < transactions.length; i++) {
                        if (transactConfig.functionID == transactions[i].functionID) {
                            transactions.splice(i, 1);
                            break;
                        }
                    }

                    var synControlList = $this.context.synControls;
                    var transactionObject = {};
                    transactionObject.functionID = transactConfig.functionID;
                    transactionObject.transactionResult = $object.isNullOrUndefined(transactConfig.transactionResult) == true ? true : transactConfig.transactionResult === true;
                    transactionObject.inputs = [];
                    transactionObject.outputs = [];

                    if (transactConfig.inputs) {
                        var inputs = transactConfig.inputs;
                        var inputsLength = inputs.length;
                        for (var i = 0; i < inputsLength; i++) {
                            var inputConfig = inputs[i];
                            var input = {
                                requestType: inputConfig.type,
                                dataFieldID: inputConfig.dataFieldID ? inputConfig.dataFieldID : document.forms.length > 0 ? document.forms[0].getAttribute('syn-datafield') : '',
                                items: {}
                            };

                            var synControlConfigs = null;
                            if (inputConfig.type == 'Row') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == input.dataFieldID && ['grid', 'chart', 'chartjs'].indexOf(item.type) == -1;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || synControlConfig.field == '') {
                                            continue;
                                        }

                                        var isBelong = false;
                                        if (synOptions.belongID) {
                                            if ($object.isString(synOptions.belongID) == true) {
                                                isBelong = transactConfig.functionID == synOptions.belongID;
                                            }
                                            else if ($object.isArray(synOptions.belongID) == true) {
                                                isBelong = synOptions.belongID.indexOf(transactConfig.functionID) > -1;
                                            }
                                        }

                                        if (isBelong == true) {
                                            input.items[synControlConfig.field] = {
                                                fieldID: synControlConfig.field,
                                                dataType: synOptions.dataType || 'string'
                                            };
                                        }
                                    }
                                }
                                else {
                                    var synControlConfigs = synControlList.filter(function (item) {
                                        return item.field == input.dataFieldID && item.type == 'grid';
                                    });

                                    if (synControlConfigs && synControlConfigs.length > 0) {
                                        for (var k = 0; k < synControlConfigs.length; k++) {
                                            var synControlConfig = synControlConfigs[k];

                                            var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                            var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                            if (synOptions == null) {
                                                continue;
                                            }

                                            for (var l = 0; l < synOptions.columns.length; l++) {
                                                var column = synOptions.columns[l];
                                                var dataType = 'string'
                                                switch (column.columnType) {
                                                    case 'checkbox':
                                                        dataType = 'bool';
                                                        break;
                                                    case 'numeric':
                                                        dataType = 'int';
                                                        break;
                                                    case 'date':
                                                        dataType = 'date';
                                                        break;
                                                }

                                                var isBelong = false;
                                                if (column.data == 'Flag') {
                                                    isBelong = true;
                                                }
                                                else if (column.belongID) {
                                                    if ($object.isString(column.belongID) == true) {
                                                        isBelong = transactConfig.functionID == column.belongID;
                                                    }
                                                    else if ($object.isArray(column.belongID) == true) {
                                                        isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                    }
                                                }

                                                if (isBelong == true) {
                                                    input.items[column.data] = {
                                                        fieldID: column.data,
                                                        dataType: dataType
                                                    };
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == input.dataFieldID) {
                                                    for (var l = 0; l < store.columns.length; l++) {
                                                        var column = store.columns[l];
                                                        var isBelong = false;
                                                        if ($object.isString(column.belongID) == true) {
                                                            isBelong = transactConfig.functionID == column.belongID;
                                                        }
                                                        else if ($object.isArray(column.belongID) == true) {
                                                            isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                        }

                                                        if (isBelong == true) {
                                                            input.items[column.data] = {
                                                                fieldID: column.data,
                                                                dataType: column.dataType || 'string'
                                                            };
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (inputConfig.type == 'List') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.field == input.dataFieldID && item.type == 'grid';
                                });

                                if (synControlConfigs && synControlConfigs.length == 1) {
                                    var synControlConfig = synControlConfigs[0];

                                    var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                    var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                    if (synOptions == null) {
                                        continue;
                                    }

                                    for (var k = 0; k < synOptions.columns.length; k++) {
                                        var column = synOptions.columns[k];
                                        var dataType = 'string'
                                        switch (column.columnType) {
                                            case 'checkbox':
                                                dataType = 'bool';
                                                break;
                                            case 'numeric':
                                                dataType = 'int';
                                                break;
                                            case 'date':
                                                dataType = 'date';
                                                break;
                                        }

                                        var isBelong = false;
                                        if (column.data == 'Flag') {
                                            isBelong = true;
                                        }
                                        else if (column.belongID) {
                                            if ($object.isString(column.belongID) == true) {
                                                isBelong = transactConfig.functionID == column.belongID;
                                            }
                                            else if ($object.isArray(column.belongID) == true) {
                                                isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                            }
                                        }

                                        if (isBelong == true) {
                                            input.items[column.data] = {
                                                fieldID: column.data,
                                                dataType: dataType
                                            };
                                        }
                                    }
                                }
                                else {
                                    var isMapping = false;
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            var store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Grid' && store.dataSourceID == input.dataFieldID) {
                                                isMapping = true;
                                                for (var l = 0; l < store.columns.length; l++) {
                                                    var column = store.columns[l];
                                                    var isBelong = false;
                                                    if ($object.isString(column.belongID) == true) {
                                                        isBelong = transactConfig.functionID == column.belongID;
                                                    }
                                                    else if ($object.isArray(column.belongID) == true) {
                                                        isBelong = column.belongID.indexOf(transactConfig.functionID) > -1;
                                                    }

                                                    if (isBelong == true) {
                                                        input.items[column.data] = {
                                                            fieldID: column.data,
                                                            dataType: column.dataType || 'string'
                                                        };
                                                    }
                                                }

                                                break;
                                            }
                                        }
                                    }

                                    if (isMapping == false) {
                                        syn.$l.eventLog('$w.tryAddFunction', '{0} 컬럼 ID 중복 또는 존재여부 확인 필요'.format(input.dataFieldID), 'Warning');
                                    }
                                }
                            }

                            transactionObject.inputs.push(input);
                        }
                    }

                    if (transactConfig.outputs) {
                        var outputs = transactConfig.outputs;
                        var outputsLength = outputs.length;
                        var synControls = $this.context.synControls;
                        for (var i = 0; i < outputsLength; i++) {
                            var outputConfig = outputs[i];
                            var output = {
                                responseType: outputConfig.type,
                                dataFieldID: outputConfig.dataFieldID ? outputConfig.dataFieldID : '',
                                items: {}
                            };

                            var synControlConfigs = null;
                            if (outputConfig.type == 'Form') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.formDataFieldID == output.dataFieldID && ['grid', 'chart', 'chartjs'].indexOf(item.type) == -1;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || synControlConfig.field == '') {
                                            continue;
                                        }

                                        output.items[synControlConfig.field] = {
                                            fieldID: synControlConfig.field,
                                            dataType: synOptions.dataType
                                        };

                                        if (outputConfig.clear == true) {
                                            if (synControls && synControls.length == 1) {
                                                var bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if (controlInfo.module == null) {
                                                        continue;
                                                    }

                                                    var controlID = controlInfo.id;
                                                    var controlField = controlInfo.field;
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var l = 0; l < currings.length; l++) {
                                                            var curring = currings[l];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    if (controlModule.clear) {
                                                        controlModule.clear(controlID);
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.tryAddFunction Form', '{0} dataFieldID 중복 또는 존재여부 확인 필요'.format(outputConfig.dataFieldID), 'Warning');
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            var store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Form' && store.dataSourceID == output.dataFieldID) {
                                                for (var l = 0; l < store.columns.length; l++) {
                                                    var column = store.columns[l];

                                                    output.items[column.data] = {
                                                        fieldID: column.data,
                                                        dataType: column.dataType || 'string'
                                                    };
                                                }

                                                if (outputConfig.clear == true) {
                                                    var dataStore = $this.store[store.dataSourceID];
                                                    if (dataStore) {
                                                        dataStore.length = 0;
                                                    }
                                                }

                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            else if (outputConfig.type == 'Grid') {
                                var synControlConfigs = synControlList.filter(function (item) {
                                    return item.field == output.dataFieldID && item.type == 'grid';
                                });

                                if (synControlConfigs && synControlConfigs.length == 1) {
                                    var synControlConfig = synControlConfigs[0];

                                    var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                    var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                    if (synOptions == null) {
                                        continue;
                                    }

                                    for (var k = 0; k < synOptions.columns.length; k++) {
                                        var column = synOptions.columns[k];
                                        var dataType = 'string'
                                        switch (column.type) {
                                            case 'checkbox':
                                                dataType = 'bool';
                                                break;
                                            case 'numeric':
                                                dataType = 'int';
                                                break;
                                            case 'date':
                                                dataType = 'date';
                                                break;
                                        }

                                        output.items[column.data] = {
                                            fieldID: column.data,
                                            dataType: dataType
                                        };
                                    }

                                    if (outputConfig.clear == true) {
                                        if (synControls && synControls.length > 0) {
                                            var bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == output.dataFieldID;
                                            });

                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var l = 0; l < currings.length; l++) {
                                                    var curring = currings[l];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            if (controlModule.clear) {
                                                controlModule.clear(controlInfo.id);
                                            }
                                        }
                                    }
                                }
                                else {
                                    synControlConfigs = synControlList.filter(function (item) {
                                        return item.field == output.dataFieldID && ['chart', 'chartjs'].indexOf(item.type) > -1;
                                    });

                                    if (synControlConfigs && synControlConfigs.length == 1) {
                                        var synControlConfig = synControlConfigs[0];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        if (synOptions == null) {
                                            continue;
                                        }

                                        for (var k = 0; k < synOptions.series.length; k++) {
                                            var column = synOptions.series[k];
                                            output.items[column.columnID] = {
                                                fieldID: column.columnID,
                                                dataType: column.dataType ? column.dataType : 'string'
                                            };
                                        }

                                        if (outputConfig.clear == true) {
                                            if (synControls && synControls.length == 1) {
                                                var bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if (controlInfo.module == null) {
                                                        continue;
                                                    }

                                                    var controlID = controlInfo.id;
                                                    var controlField = controlInfo.field;
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var l = 0; l < currings.length; l++) {
                                                            var curring = currings[l];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    if (controlModule.clear) {
                                                        controlModule.clear(controlID);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == output.dataFieldID) {
                                                    isMapping = true;

                                                    for (var l = 0; l < store.columns.length; l++) {
                                                        var column = store.columns[l];

                                                        output.items[column.data] = {
                                                            fieldID: column.data,
                                                            dataType: column.dataType || 'string'
                                                        };
                                                    }

                                                    if (outputConfig.clear == true) {
                                                        var dataStore = $this.store[store.dataSourceID];
                                                        if (dataStore) {
                                                            dataStore.length = 0;
                                                        }
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.tryAddFunction Grid', '{0} dataFieldID 중복 또는 존재여부 확인 필요'.format(output.dataFieldID), 'Warning');
                                        }
                                    }
                                }
                            }

                            transactionObject.outputs.push(output);
                        }
                    }

                    $this.config.transactions.push(transactionObject);
                } catch (error) {
                    syn.$l.eventLog('$w.tryAddFunction', error, 'Error');
                }
            }
            else {
                syn.$l.eventLog('$w.tryAddFunction', '{0} 거래 ID 또는 설정 확인 필요'.format(transactConfig), 'Warning');
            }
        },

        transactionAction(transactConfig, options) {
            if ($object.isString(transactConfig) == true) {
                var functionID = transactConfig;
                transactConfig = $this.transaction[transactConfig];

                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.transactionAction', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }
            }

            if (transactConfig && $this && $this.config) {
                if ($object.isNullOrUndefined(transactConfig.noProgress) == true) {
                    transactConfig.noProgress = false;
                }

                if (syn.$w.progressMessage && transactConfig.noProgress == false) {
                    syn.$w.progressMessage($resource.translations.progress);
                }

                try {
                    if ($object.isNullOrUndefined($this.config.transactions) == true) {
                        $this.config.transactions = [];
                    }

                    var isContinue = true;
                    if ($this.hook.beforeTransaction) {
                        isContinue = $this.hook.beforeTransaction(transactConfig);
                    }

                    if ($object.isNullOrUndefined(isContinue) == true || isContinue == true) {
                        options = syn.$w.argumentsExtend({
                            message: '',
                            dynamic: 'Y',
                            authorize: 'N',
                            commandType: 'D',
                            returnType: 'Json',
                            transactionScope: 'N',
                            transactionLog: 'Y'
                        }, options);

                        if (options) {

                            if (syn.$w.progressMessage) {
                                syn.$w.progressMessage(options.message);
                            }
                        }

                        syn.$w.tryAddFunction(transactConfig);
                        syn.$w.transaction(transactConfig.functionID, function (result, addtionalData, correlationID) {
                            var error = null;
                            if (result && result.errorText.length > 0) {
                                error = result.errorText[0];
                                syn.$l.eventLog('$w.transaction.callback', error, 'Error');
                            }

                            var callbackResult = null;
                            if (transactConfig.callback && $object.isFunction(transactConfig.callback) == true) {
                                callbackResult = transactConfig.callback(error, result, addtionalData, correlationID);
                            }

                            if (callbackResult == null || callbackResult === true) {
                                if ($this.hook.afterTransaction) {
                                    $this.hook.afterTransaction(null, transactConfig.functionID, result, addtionalData, correlationID);
                                }
                            }
                            else if (callbackResult === false) {
                                if ($this.hook.afterTransaction) {
                                    $this.hook.afterTransaction('callbackResult continue false', transactConfig.functionID, null, null, correlationID);
                                }
                            }

                            if (transactConfig.callback && $object.isArray(transactConfig.callback) == true) {
                                setTimeout(function () {
                                    var eventData = {
                                        error: error,
                                        result: result,
                                        addtionalData: addtionalData,
                                        correlationID: correlationID
                                    }
                                    syn.$l.trigger(transactConfig.callback[0], transactConfig.callback[1], eventData);
                                });
                            }
                        }, options);
                    }
                    else {
                        if (syn.$w.closeProgressMessage) {
                            syn.$w.closeProgressMessage();
                        }

                        if ($this.hook.afterTransaction) {
                            $this.hook.afterTransaction('beforeTransaction continue false', transactConfig.functionID, null, null);
                        }
                    }
                } catch (error) {
                    syn.$l.eventLog('$w.transactionAction', error, 'Error');

                    if (syn.$w.closeProgressMessage) {
                        syn.$w.closeProgressMessage();
                    }
                }
            }
            else {
                syn.$l.eventLog('$w.transactionAction', '{0} 거래 ID 또는 설정 확인 필요'.format(transactConfig), 'Warning');
            }
        },

        /*
        var directObject = {
            programID: 'SVU',
            businessID: 'ZZW',
            systemID: 'BP01',
            transactionID: 'ZZA010',
            functionID: 'L01',
            dataMapInterface: 'Row|Form',
            transactionResult: true,
            inputObjects: [
                { prop: 'ApplicationID', val: '' },
                { prop: 'ProjectID', val: '' },
                { prop: 'TransactionID', val: '' }
            ]
        };

        syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
            debugger;
        });
        */
        transactionDirect(directObject, callback, options) {
            directObject.transactionResult = $object.isNullOrUndefined(directObject.transactionResult) == true ? true : directObject.transactionResult === true;
            directObject.systemID = directObject.systemID || $this.config.systemID;

            var transactionObject = syn.$w.transactionObject(directObject.functionID, 'Json');

            transactionObject.programID = directObject.programID;
            transactionObject.businessID = directObject.businessID;
            transactionObject.systemID = directObject.systemID;
            transactionObject.transactionID = directObject.transactionID;
            transactionObject.dataMapInterface = directObject.dataMapInterface || 'Row|Form';
            transactionObject.transactionResult = $object.isNullOrUndefined(directObject.transactionResult) == true ? true : directObject.transactionResult === true;

            options = syn.$w.argumentsExtend({
                message: '',
                dynamic: 'Y',
                authorize: 'N',
                commandType: 'D',
                returnType: 'Json',
                transactionScope: 'N',
                transactionLog: 'Y'
            }, options);

            if (options) {

                if (syn.$w.progressMessage) {
                    syn.$w.progressMessage(options.message);
                }
            }
            transactionObject.options = options;

            if (globalRoot.devicePlatform === 'node') {
                transactionObject.screenID = directObject.screenID || directObject.transactionID;
            }
            else {
                transactionObject.screenID = syn.$w.pageScript.replace('$', '');
            }
            transactionObject.startTraceID = directObject.startTraceID || options.startTraceID || '';

            if (directObject.inputLists && directObject.inputLists.length > 0) {
                for (var key in directObject.inputLists) {
                    transactionObject.inputs.push(directObject.inputLists[key]);
                }
                transactionObject.inputsItemCount.push(directObject.inputLists.length);
            }
            else {
                transactionObject.inputs.push(directObject.inputObjects);
                transactionObject.inputsItemCount.push(1);
            }

            syn.$w.executeTransaction(directObject, transactionObject, function (responseData, addtionalData) {
                if (callback) {
                    callback(responseData, addtionalData);
                }
            });
        },

        transaction(functionID, callback, options) {
            var errorText = '';
            try {
                if (syn.$w.domainTransactionLoaderStart) {
                    syn.$w.domainTransactionLoaderStart();
                }

                options = syn.$w.argumentsExtend({
                    message: '',
                    dynamic: 'Y',
                    authorize: 'N',
                    commandType: 'D',
                    returnType: 'Json',
                    transactionScope: 'N',
                    transactionLog: 'Y'
                }, options);

                if (options) {

                    if (syn.$w.progressMessage) {
                        syn.$w.progressMessage(options.message);
                    }
                }

                var result = {
                    errorText: [],
                    outputStat: []
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];
                        var transactionObject = syn.$w.transactionObject(transaction.functionID, 'Json');

                        transactionObject.programID = $this.config.programID;
                        transactionObject.businessID = $this.config.businessID;
                        transactionObject.systemID = $this.config.systemID;
                        transactionObject.transactionID = $this.config.transactionID;
                        transactionObject.screenID = syn.$w.pageScript.replace('$', '');
                        transactionObject.startTraceID = options.startTraceID || '';
                        transactionObject.options = options;

                        // synControls 컨트롤 목록
                        var synControls = $this.context.synControls;

                        // Input Mapping
                        var inputLength = transaction.inputs.length;
                        for (var inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            var inputMapping = transaction.inputs[inputIndex];
                            var inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                var bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    var controlInfo = bindingControlInfos[0];

                                    if (['grid', 'chart'].indexOf(controlInfo.type) > -1) {
                                        var dataFieldID = inputMapping.dataFieldID; // syn-datafield

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                for (var k = 0; k < synOptions.columns.length; k++) {
                                                    var column = synOptions.columns[k];
                                                    if (column.validators && $validation.transactionValidate) {
                                                        column.controlText = synOptions.controlText || '';
                                                        var isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

                                                        if (isValidate == false) {
                                                            if ($this.hook.afterTransaction) {
                                                                $this.hook.afterTransaction('validators continue false', functionID, column, null);
                                                            }

                                                            if (syn.$w.domainTransactionLoaderEnd) {
                                                                syn.$w.domainTransactionLoaderEnd();
                                                            }

                                                            return false;
                                                        }
                                                    }
                                                }

                                                inputObjects = controlModule.getValue(controlInfo.id, 'Row', inputMapping.items)[0];
                                            }
                                            else {
                                                syn.$l.eventLog('$w.transaction', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (var key in inputMapping.items) {
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key; // syn-datafield
                                            var fieldID = meta.fieldID; // DbColumnID
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    if ($object.isNullOrUndefined(controlInfo.module) == true) {
                                                        controlValue = syn.$l.get(controlInfo.id).value;
                                                    }
                                                    else {
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                                        if (synOptions.validators && $validation.transactionValidate) {
                                                            var isValidate = $validation.transactionValidate(controlModule, controlInfo, synOptions, inputMapping.requestType);

                                                            if (isValidate == false) {
                                                                if ($this.hook.afterTransaction) {
                                                                    $this.hook.afterTransaction('validators continue false', functionID, synOptions, null);
                                                                }

                                                                if (syn.$w.domainTransactionLoaderEnd) {
                                                                    syn.$w.domainTransactionLoaderEnd();
                                                                }

                                                                return false;
                                                            }
                                                        }

                                                        controlValue = controlModule.getValue(controlInfo.id, meta);

                                                        if ($object.isNullOrUndefined(controlValue) == true && dataType == 'int') {
                                                            controlValue = 0;
                                                        }
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.transaction', '"{0}" Row Control Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    continue;
                                                }
                                            }

                                            serviceObject.val = controlValue;
                                            inputObjects.push(serviceObject);
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var key in inputMapping.items) {
                                            var isMapping = false;
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key; // syn-datafield
                                            var fieldID = meta.fieldID; // DbColumnID
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if (!controlValue && dataType == 'int') {
                                                            controlValue = 0;
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true) {
                                                            controlValue = '';
                                                        }
                                                    }
                                                    else {
                                                        syn.$l.eventLog('$w.transaction', '"{0}" Row Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    }

                                                    break;
                                                }
                                            }

                                            if (isMapping == true) {
                                                serviceObject.val = controlValue;
                                                inputObjects.push(serviceObject);
                                            }
                                            else {
                                                syn.$l.eventLog('$w.transaction', '{0} Row 컨트롤 ID 중복 또는 존재여부 확인 필요'.format(inputMapping.dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                }

                                transactionObject.inputs.push(inputObjects); // transactionObject.inputs.push($object.clone(inputObjects));
                                transactionObject.inputsItemCount.push(1);
                            }
                            else if (inputMapping.requestType == 'List') {
                                var dataFieldID = inputMapping.dataFieldID; // syn-datafield

                                var controlValue = '';
                                if (synControls && synControls.length > 0) {
                                    var bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        var controlInfo = bindingControlInfos[0];
                                        var controlModule = null;
                                        var currings = controlInfo.module.split('.');
                                        if (currings.length > 0) {
                                            for (var i = 0; i < currings.length; i++) {
                                                var curring = currings[i];
                                                if (controlModule) {
                                                    controlModule = controlModule[curring];
                                                }
                                                else {
                                                    controlModule = context[curring];
                                                }
                                            }
                                        }
                                        else {
                                            controlModule = context[controlInfo.module];
                                        }

                                        var el = syn.$l.get(controlInfo.id + '_hidden') || syn.$l.get(controlInfo.id);
                                        var synOptions = JSON.parse(el.getAttribute('syn-options'));

                                        for (var k = 0; k < synOptions.columns.length; k++) {
                                            var column = synOptions.columns[k];
                                            column.controlText = synOptions.controlText || '';
                                            if (column.validators && $validation.transactionValidate) {
                                                var isValidate = $validation.transactionValidate(controlModule, controlInfo, column, inputMapping.requestType);

                                                if (isValidate == false) {
                                                    if ($this.hook.afterTransaction) {
                                                        $this.hook.afterTransaction('validators continue false', functionID, column, null);
                                                    }

                                                    if (syn.$w.domainTransactionLoaderEnd) {
                                                        syn.$w.domainTransactionLoaderEnd();
                                                    }

                                                    return false;
                                                }
                                            }
                                        }

                                        inputObjects = controlModule.getValue(controlInfo.id, 'List', inputMapping.items);
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    var bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        var controlValue = [];
                                                        var items = $this.store[store.dataSourceID];
                                                        var length = items.length;
                                                        for (var i = 0; i < length; i++) {
                                                            var item = items[i];

                                                            var row = [];
                                                            for (var key in item) {
                                                                var serviceObject = { prop: key, val: item[key] };
                                                                row.push(serviceObject);
                                                            }
                                                            controlValue.push(row);
                                                        }

                                                        inputObjects = controlValue;
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.transaction', '"{0}" List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                        }
                                    }
                                }

                                for (var key in inputObjects) {
                                    transactionObject.inputs.push(inputObjects[key]);
                                }
                                transactionObject.inputsItemCount.push(inputObjects.length);
                            }
                        }

                        syn.$w.executeTransaction($this.config, transactionObject, function (responseData, addtionalData, correlationID) {
                            var isDynamicOutput = false;
                            for (var i = 0; i < transaction.outputs.length; i++) {
                                if (transaction.outputs[i].responseType == 'Dynamic') {
                                    isDynamicOutput = true;
                                    break;
                                }
                            }

                            if (isDynamicOutput == true) {
                                result.outputStat.push({
                                    fieldID: 'Dynamic',
                                    count: 1,
                                    dynamicData: responseData
                                });
                            }
                            else {
                                if (responseData.length == transaction.outputs.length) {
                                    // synControls 컨트롤 목록
                                    var synControls = $this.context.synControls;

                                    // Output Mapping을 설정
                                    var outputLength = transaction.outputs.length;
                                    for (var outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                                        var outputMapping = transaction.outputs[outputIndex];
                                        var dataMapItem = responseData[outputIndex];
                                        var responseFieldID = dataMapItem['id'];
                                        var outputData = dataMapItem['value'];

                                        if ($this.outputDataBinding) {
                                            $this.outputDataBinding(functionID, responseFieldID, outputData);
                                        }

                                        if (outputMapping.responseType == 'Form') {
                                            if ($object.isNullOrUndefined(outputData) == true || $object.isObjectEmpty(outputData) == true) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
                                            }
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 1
                                                });

                                                for (var key in outputMapping.items) {
                                                    var meta = outputMapping.items[key];
                                                    var dataFieldID = key; // syn-datafield
                                                    var fieldID = meta.fieldID; // DbColumnID

                                                    var controlValue = outputData[fieldID];
                                                    if (controlValue != undefined && synControls && synControls.length > 0) {
                                                        var bindingControlInfos = synControls.filter(function (item) {
                                                            return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                                        });

                                                        if (bindingControlInfos.length == 1) {
                                                            var controlInfo = bindingControlInfos[0];
                                                            var controlModule = null;
                                                            var currings = controlInfo.module.split('.');
                                                            if (currings.length > 0) {
                                                                for (var i = 0; i < currings.length; i++) {
                                                                    var curring = currings[i];
                                                                    if (controlModule) {
                                                                        controlModule = controlModule[curring];
                                                                    }
                                                                    else {
                                                                        controlModule = context[curring];
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                controlModule = context[controlInfo.module];
                                                            }

                                                            controlModule.setValue(controlInfo.id, controlValue, meta);
                                                        }
                                                        else {
                                                            var isMapping = false;
                                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                                for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                                    var store = syn.uicontrols.$data.storeList[k];
                                                                    if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                                        $this.store[store.dataSourceID] = {};
                                                                    }

                                                                    if (store.storeType == 'Form' && store.dataSourceID == outputMapping.dataFieldID) {
                                                                        isMapping = true;
                                                                        bindingControlInfos = store.columns.filter(function (item) {
                                                                            return item.data == dataFieldID;
                                                                        });

                                                                        if (bindingControlInfos.length == 1) {
                                                                            $this.store[store.dataSourceID][dataFieldID] = controlValue;
                                                                        }

                                                                        break;
                                                                    }
                                                                }
                                                            }

                                                            if (isMapping == false) {
                                                                errorText = '"{0}" Form Output Mapping 확인 필요'.format(dataFieldID);
                                                                result.errorText.push(errorText);
                                                                syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else if (outputMapping.responseType == 'Grid') {
                                            if (outputData.length && outputData.length > 0) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: outputData.length
                                                });
                                                var dataFieldID = outputMapping.dataFieldID; // syn-datafield
                                                if (synControls && synControls.length > 0) {
                                                    var bindingControlInfos = synControls.filter(function (item) {
                                                        return item.field == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                                    }
                                                    else {
                                                        var isMapping = false;
                                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                                var store = syn.uicontrols.$data.storeList[k];
                                                                if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                                    $this.store[store.dataSourceID] = [];
                                                                }

                                                                if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                                    isMapping = true;
                                                                    var bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                                    });

                                                                    var length = outputData.length;
                                                                    for (var i = 0; i < length; i++) {
                                                                        outputData[i].Flag = 'R';
                                                                    }

                                                                    if (bindingInfos.length > 0) {
                                                                        for (var binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                            var bindingInfo = bindingInfos[binding_i];
                                                                            $this.store[store.dataSourceID][bindingInfo.dataFieldID] = outputData;
                                                                        }
                                                                    }
                                                                    else {
                                                                        $this.store[store.dataSourceID] = outputData;
                                                                    }
                                                                    break;
                                                                }
                                                            }
                                                        }

                                                        if (isMapping == false) {
                                                            errorText = '"{0}" Grid Output Mapping 확인 필요'.format(dataFieldID);
                                                            result.errorText.push(errorText);
                                                            syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
                                            }
                                        }
                                        else if (outputMapping.responseType == 'Chart') {
                                            if (outputData.length && outputData.length > 0) {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: outputData.length
                                                });
                                                var dataFieldID = outputMapping.dataFieldID; // syn-datafield

                                                if (synControls && synControls.length > 0) {
                                                    var bindingControlInfos = synControls.filter(function (item) {
                                                        return item.field == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        var controlModule = null;
                                                        var currings = controlInfo.module.split('.');
                                                        if (currings.length > 0) {
                                                            for (var i = 0; i < currings.length; i++) {
                                                                var curring = currings[i];
                                                                if (controlModule) {
                                                                    controlModule = controlModule[curring];
                                                                }
                                                                else {
                                                                    controlModule = context[curring];
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            controlModule = context[controlInfo.module];
                                                        }

                                                        controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                                    }
                                                    else {
                                                        errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                                        result.errorText.push(errorText);
                                                        syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                    }
                                                }
                                            }
                                            else {
                                                result.outputStat.push({
                                                    fieldID: responseFieldID,
                                                    Count: 0
                                                });
                                            }
                                        }
                                    }
                                }
                                else {
                                    errorText = '"{0}" 기능의 거래 응답 정의와 데이터 갯수가 다릅니다'.format(transaction.functionID);
                                    result.errorText.push(errorText);
                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                }
                            }

                            if (callback) {
                                callback(result, addtionalData, correlationID);
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                        });
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errorText.push(errorText);
                        syn.$l.eventLog('$w.transaction', errorText, 'Error');

                        if (callback) {
                            callback(result);
                        }

                        if (syn.$w.domainTransactionLoaderEnd) {
                            syn.$w.domainTransactionLoaderEnd();
                        }
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errorText.push(errorText);
                    syn.$l.eventLog('$w.transaction', errorText, 'Error');

                    if (callback) {
                        callback(result);
                    }

                    if (syn.$w.domainTransactionLoaderEnd) {
                        syn.$w.domainTransactionLoaderEnd();
                    }
                }
            } catch (error) {
                syn.$l.eventLog('$w.transaction', error, 'Error');

                if (syn.$w.domainTransactionLoaderEnd) {
                    syn.$w.domainTransactionLoaderEnd();
                }
            }
        },

        getterValue(functionID) {
            try {
                var transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.setterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                var errorText = '';
                var result = {
                    errors: [],
                    inputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];

                        var synControls = context[syn.$w.pageScript].context.synControls;

                        var inputLength = transaction.inputs.length;
                        for (var inputIndex = 0; inputIndex < inputLength; inputIndex++) {
                            var inputMapping = transaction.inputs[inputIndex];
                            var inputObjects = [];

                            if (inputMapping.requestType == 'Row') {
                                var bindingControlInfos = synControls.filter(function (item) {
                                    return item.field == inputMapping.dataFieldID;
                                });

                                if (bindingControlInfos.length == 1) {
                                    var controlInfo = bindingControlInfos[0];

                                    if (['grid', 'chart'].indexOf(controlInfo.type) > -1) {
                                        var dataFieldID = inputMapping.dataFieldID;

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                inputObjects = controlModule.getValue(controlInfo.id, 'Row', inputMapping.items)[0];
                                            }
                                            else {
                                                syn.$l.eventLog('$w.getterValue', '"{0}" Row List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                    else {
                                        for (var key in inputMapping.items) {
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key;
                                            var fieldID = meta.fieldID;
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            if (synControls.length > 0) {
                                                bindingControlInfos = synControls.filter(function (item) {
                                                    return item.field == dataFieldID && item.formDataFieldID == inputMapping.dataFieldID;
                                                });

                                                if (bindingControlInfos.length == 1) {
                                                    var controlInfo = bindingControlInfos[0];
                                                    var controlModule = null;
                                                    var currings = controlInfo.module.split('.');
                                                    if (currings.length > 0) {
                                                        for (var i = 0; i < currings.length; i++) {
                                                            var curring = currings[i];
                                                            if (controlModule) {
                                                                controlModule = controlModule[curring];
                                                            }
                                                            else {
                                                                controlModule = context[curring];
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        controlModule = context[controlInfo.module];
                                                    }

                                                    controlValue = controlModule.getValue(controlInfo.id, meta);

                                                    if (!controlValue && dataType == 'int') {
                                                        controlValue = 0;
                                                    }
                                                }
                                                else {
                                                    syn.$l.eventLog('$w.getterValue', '"{0}" Row Control Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    continue;
                                                }
                                            }

                                            serviceObject.val = controlValue;
                                            inputObjects.push(serviceObject);
                                        }
                                    }
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var key in inputMapping.items) {
                                            var isMapping = false;
                                            var meta = inputMapping.items[key];
                                            var dataFieldID = key;
                                            var fieldID = meta.fieldID;
                                            var dataType = meta.dataType;
                                            var serviceObject = { prop: fieldID, val: '' };

                                            var controlValue = '';
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Form' && store.dataSourceID == inputMapping.dataFieldID) {
                                                    isMapping = true;
                                                    bindingControlInfos = store.columns.filter(function (item) {
                                                        return item.data == dataFieldID;
                                                    });

                                                    if (bindingControlInfos.length == 1) {
                                                        var controlInfo = bindingControlInfos[0];
                                                        controlValue = $this.store[store.dataSourceID][controlInfo.data];

                                                        if (!controlValue && dataType == 'int') {
                                                            controlValue = 0;
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true) {
                                                            controlValue = '';
                                                        }
                                                    }
                                                    else {
                                                        syn.$l.eventLog('$w.getterValue', '"{0}" Row Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                                    }

                                                    break;
                                                }
                                            }

                                            if (isMapping == true) {
                                                serviceObject.val = controlValue;
                                                inputObjects.push(serviceObject);
                                            }
                                            else {
                                                syn.$l.eventLog('$w.getterValue', '{0} Row 컨트롤 ID 중복 또는 존재여부 확인 필요'.format(inputMapping.dataFieldID), 'Warning');
                                            }
                                        }
                                    }
                                }

                                var input = {};
                                for (var i = 0; i < inputObjects.length; i++) {
                                    var inputObject = inputObjects[i];
                                    input[inputObject.prop] = inputObject.val;
                                }
                                result.inputs.push(input);
                            }
                            else if (inputMapping.requestType == 'List') {
                                var dataFieldID = inputMapping.dataFieldID;

                                var controlValue = '';
                                if (synControls && synControls.length > 0) {
                                    var bindingControlInfos = synControls.filter(function (item) {
                                        return item.field == dataFieldID;
                                    });

                                    if (bindingControlInfos.length == 1) {
                                        var controlInfo = bindingControlInfos[0];
                                        var controlModule = null;
                                        var currings = controlInfo.module.split('.');
                                        if (currings.length > 0) {
                                            for (var i = 0; i < currings.length; i++) {
                                                var curring = currings[i];
                                                if (controlModule) {
                                                    controlModule = controlModule[curring];
                                                }
                                                else {
                                                    controlModule = context[curring];
                                                }
                                            }
                                        }
                                        else {
                                            controlModule = context[controlInfo.module];
                                        }

                                        inputObjects = controlModule.getValue(controlInfo.id, 'List', inputMapping.items);
                                    }
                                    else {
                                        var isMapping = false;
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == dataFieldID) {
                                                    isMapping = true;
                                                    var bindingInfo = syn.uicontrols.$data.bindingList.find(function (item) {
                                                        return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                    });

                                                    if (bindingInfo) {
                                                        inputObjects = $this.store[store.dataSourceID][bindingInfo.dataFieldID];
                                                    }
                                                    else {
                                                        var controlValue = [];
                                                        var items = $this.store[store.dataSourceID];
                                                        var length = items.length;
                                                        for (var i = 0; i < length; i++) {
                                                            var item = items[i];

                                                            var row = [];
                                                            for (var key in item) {
                                                                var serviceObject = { prop: key, val: item[key] };
                                                                row.push(serviceObject);
                                                            }
                                                            controlValue.push(row);
                                                        }

                                                        inputObjects = controlValue;
                                                    }

                                                    break;
                                                }
                                            }
                                        }

                                        if (isMapping == false) {
                                            syn.$l.eventLog('$w.getterValue', '"{0}" List Input Mapping 확인 필요'.format(dataFieldID), 'Warning');
                                        }
                                    }
                                }

                                for (var key in inputObjects) {
                                    var input = {};
                                    var inputList = inputObjects[key];
                                    for (var i = 0; i < inputList.length; i++) {
                                        var inputObject = inputList[i];
                                        input[inputObject.prop] = inputObject.val;
                                    }
                                    result.inputs.push(input);
                                }
                            }
                        }

                        return result;
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errors.push(errorText);
                        syn.$l.eventLog('$w.getterValue', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.getterValue', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.getterValue', error, 'Error');

                result.errors.push(error.message);
                return result;
            }
        },

        setterValue(functionID, responseData) {
            try {
                var transactConfig = $this.transaction[functionID];
                if ($object.isNullOrUndefined(transactConfig) == true) {
                    syn.$l.eventLog('$w.setterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
                    return;
                }

                if ($string.isNullOrEmpty(transactConfig.functionID) == true) {
                    transactConfig.functionID = functionID;
                }

                syn.$w.tryAddFunction(transactConfig);

                var errorText = '';
                var result = {
                    errors: [],
                    outputs: [],
                };

                if ($this && $this.config && $this.config.transactions) {
                    var transactions = $this.config.transactions.filter(function (item) {
                        return item.functionID == functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];
                        var synControls = context[syn.$w.pageScript].context.synControls;
                        var outputLength = transaction.outputs.length;
                        for (var outputIndex = 0; outputIndex < outputLength; outputIndex++) {
                            var outputMapping = transaction.outputs[outputIndex];
                            var responseFieldID = outputMapping.responseType + 'Data' + outputIndex.toString();
                            var outputData = responseData[outputIndex];

                            if (outputMapping.responseType == 'Form') {
                                if ($object.isNullOrUndefined(outputData) == true || $object.isObjectEmpty(outputData) == true) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 1
                                    });

                                    for (var key in outputMapping.items) {
                                        var meta = outputMapping.items[key];
                                        var dataFieldID = key;
                                        var fieldID = meta.fieldID;

                                        var controlValue = outputData[fieldID];
                                        if (controlValue != undefined && synControls && synControls.length > 0) {
                                            var bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID && item.formDataFieldID == outputMapping.dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = null;
                                                var currings = controlInfo.module.split('.');
                                                if (currings.length > 0) {
                                                    for (var i = 0; i < currings.length; i++) {
                                                        var curring = currings[i];
                                                        if (controlModule) {
                                                            controlModule = controlModule[curring];
                                                        }
                                                        else {
                                                            controlModule = context[curring];
                                                        }
                                                    }
                                                }
                                                else {
                                                    controlModule = context[controlInfo.module];
                                                }

                                                controlModule.setValue(controlInfo.id, controlValue, meta);
                                            }
                                            else {
                                                var isMapping = false;
                                                if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                    for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                        var store = syn.uicontrols.$data.storeList[k];
                                                        if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                            $this.store[store.dataSourceID] = {};
                                                        }

                                                        if (store.storeType == 'Form' && store.dataSourceID == outputMapping.dataFieldID) {
                                                            isMapping = true;
                                                            bindingControlInfos = store.columns.filter(function (item) {
                                                                return item.data == dataFieldID;
                                                            });

                                                            if (bindingControlInfos.length == 1) {
                                                                $this.store[store.dataSourceID][dataFieldID] = controlValue;
                                                            }

                                                            break;
                                                        }
                                                    }
                                                }

                                                if (isMapping == false) {
                                                    errorText = '"{0}" Form Output Mapping 확인 필요'.format(dataFieldID);
                                                    result.errors.push(errorText);
                                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (outputMapping.responseType == 'Grid') {
                                if (outputData.length && outputData.length > 0) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: outputData.length
                                    });
                                    var dataFieldID = outputMapping.dataFieldID;
                                    if (synControls && synControls.length > 0) {
                                        var bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var i = 0; i < currings.length; i++) {
                                                    var curring = currings[i];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                        }
                                        else {
                                            var isMapping = false;
                                            if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                                for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                    var store = syn.uicontrols.$data.storeList[k];
                                                    if ($object.isNullOrUndefined($this.store[store.dataSourceID]) == true) {
                                                        $this.store[store.dataSourceID] = [];
                                                    }

                                                    if (store.storeType == 'Grid' && store.dataSourceID == outputMapping.dataFieldID) {
                                                        isMapping = true;
                                                        var bindingInfos = syn.uicontrols.$data.bindingList.filter(function (item) {
                                                            return (item.dataSourceID == store.dataSourceID && item.controlType == 'grid');
                                                        });

                                                        var length = outputData.length;
                                                        for (var i = 0; i < length; i++) {
                                                            outputData[i].Flag = 'R';
                                                        }

                                                        if (bindingInfos.length > 0) {
                                                            for (var binding_i = 0; binding_i < bindingInfos.length; binding_i++) {
                                                                var bindingInfo = bindingInfos[binding_i];
                                                                $this.store[store.dataSourceID][bindingInfo.dataFieldID] = outputData;
                                                            }
                                                        }
                                                        else {
                                                            $this.store[store.dataSourceID] = outputData;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }

                                            if (isMapping == false) {
                                                errorText = '"{0}" Grid Output Mapping 확인 필요'.format(dataFieldID);
                                                result.errors.push(errorText);
                                                syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                            }
                                        }
                                    }
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                            }
                            else if (outputMapping.responseType == 'Chart') {
                                if (outputData.length && outputData.length > 0) {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: outputData.length
                                    });
                                    var dataFieldID = outputMapping.dataFieldID;

                                    if (synControls && synControls.length > 0) {
                                        var bindingControlInfos = synControls.filter(function (item) {
                                            return item.field == dataFieldID;
                                        });

                                        if (bindingControlInfos.length == 1) {
                                            var controlInfo = bindingControlInfos[0];
                                            var controlModule = null;
                                            var currings = controlInfo.module.split('.');
                                            if (currings.length > 0) {
                                                for (var i = 0; i < currings.length; i++) {
                                                    var curring = currings[i];
                                                    if (controlModule) {
                                                        controlModule = controlModule[curring];
                                                    }
                                                    else {
                                                        controlModule = context[curring];
                                                    }
                                                }
                                            }
                                            else {
                                                controlModule = context[controlInfo.module];
                                            }

                                            controlModule.setValue(controlInfo.id, outputData, outputMapping.items);
                                        }
                                        else {
                                            errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                            result.errors.push(errorText);
                                            syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                        }
                                    }
                                }
                                else {
                                    result.outputs.push({
                                        fieldID: responseFieldID,
                                        Count: 0
                                    });
                                }
                            }
                        }

                        return result;
                    }
                    else {
                        errorText = '"{0}" 거래 중복 또는 존재여부 확인 필요'.format(functionID);
                        result.errors.push(errorText);
                        syn.$l.eventLog('$w.transaction', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.transaction', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.transaction', error, 'Error');
                result.errors.push(error.message);
                return result;
            }
        },

        scrollToTop() {
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            if (scrollTop > 0) {
                context.requestAnimationFrame(syn.$w.scrollToTop);
                context.scrollTo(0, scrollTop - scrollTop / 8);
            }
        },

        setFavicon(url) {
            var favicon = document.querySelector('link[rel="icon"]');

            if (favicon) {
                favicon.href = url;
            } else {
                var link = document.createElement('link');
                link.rel = 'icon';
                link.href = url;

                document.head.appendChild(link);
            }
        },

        fileDownload(url, fileName) {
            var downloadFileName = '';
            if (fileName) {
                downloadFileName = fileName;
            }
            else {
                var match = url.toString().match(/.*\/(.+?)\./);
                if (match && match.length > 1) {
                    downloadFileName = match[1];
                }
            }

            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', downloadFileName);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        sleep(ms, callback) {
            if (callback) {
                setTimeout(callback, ms);
            }
            else if (globalRoot.Promise) {
                return new Promise(function (resolve) {
                    return setTimeout(resolve, ms);
                });
            }
            else {
                syn.$l.eventLog('$w.sleep', '지원하지 않는 기능. 매개변수 확인 필요', 'Debug');
            }
        },

        purge(el) {
            var a = el.attributes, i, l, n;
            if (a) {
                for (i = a.length - 1; i >= 0; i -= 1) {
                    n = a[i].name;
                    if (typeof el[n] === 'function') {
                        el[n] = null;
                    }
                }
            }
            a = el.childNodes;
            if (a) {
                l = a.length;
                for (i = 0; i < l; i += 1) {
                    syn.$w.purge(el.childNodes[i]);
                }
            }
        },

        setServiceObject(value) {
            var message = typeof value == 'string' ? value : JSON.stringify(value);

            return $webform;
        },

        setServiceClientHeader(xhr) {
            xhr.setRequestHeader('CertificationKey', 'SGFuZFN0YWNr');
            return true;
        },

        xmlParser(xml) {
            var parser = new globalRoot.DOMParser();
            return parser.parseFromString(xml, 'text/xml');
        },

        apiHttp(url) {
            return new Proxy({}, {
                get(target, action) {
                    return async function (raw, options) {
                        if (['send'].indexOf(action) == -1) {
                            return Promise.resolve({ error: `${action} 메서드 확인 필요` });
                        }

                        options = syn.$w.argumentsExtend({
                            method: 'GET'
                        }, options);

                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            options.method = 'POST';

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', 'application/json');
                            }

                            if (syn.Environment) {
                                var environment = syn.Environment;
                                if (environment.Header) {
                                    for (var item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                data.timeout = options.timeout;
                            }

                            var response = await fetch(url, data);
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', 'text/plain');
                            }

                            if (syn.Environment) {
                                var environment = syn.Environment;
                                if (environment.Header) {
                                    for (var item in environment.Header) {
                                        if (options.headers.has(item) == false) {
                                            options.headers.append(item, environment.Header[item]);
                                        }
                                    }
                                }
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                data.timeout = options.timeout;
                            }

                            var response = await fetch(url, data);
                        }

                        if (response.ok == true) {
                            var result = null;
                            var contentType = response.headers.get('Content-Type');
                            if (contentType.indexOf('application/json') > -1) {
                                result = response.json();
                            }
                            else {
                                result = response.text();
                            }
                            return Promise.resolve(result);
                        }
                        else {
                            syn.$l.eventLog('$w.apiHttp', `status: ${response.status}, text: ${await response.text()}`, 'Error');
                        }

                        return Promise.resolve({ error: '요청 정보 확인 필요' });
                    };
                }
            });
        },

        xmlHttp() {
            return new globalRoot.XMLHttpRequest();
        },

        loadScript(url, scriptID) {
            var head;
            var resourceID;
            if (document.getElementsByTagName('head')) {
                head = document.getElementsByTagName('head')[0];
            }
            else {
                document.documentElement.insertBefore(document.createElement('head'), document.documentElement.firstChild);
                head = document.getElementsByTagName('head')[0];
            }

            resourceID = scriptID || 'id_' + syn.$l.random();

            var el = document.createElement('script');
            el.setAttribute('type', 'text/javascript');
            el.setAttribute('id', resourceID);
            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                el.setAttribute('src', url);
            }
            else {
                el.setAttribute('src', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
            }

            head.insertBefore(el, head.firstChild);

            return $webform;
        },

        loadStyle(url, styleID) {
            var head;
            var resourceID;
            if (document.getElementsByTagName('head')) {
                head = document.getElementsByTagName('head')[0];
            }
            else {
                document.documentElement.insertBefore(document.createElement('head'), document.documentElement.firstChild);
                head = document.getElementsByTagName('head')[0];
            }

            resourceID = styleID || 'id_' + syn.$l.random();

            var el = document.createElement('link');
            el.setAttribute('rel', 'stylesheet');
            el.setAttribute('type', 'text/css');
            el.setAttribute('id', resourceID);
            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                el.setAttribute('href', url);
            }
            else {
                el.setAttribute('href', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
            }

            head.appendChild(el);

            return $webform;
        },

        async fetchScript(moduleUrl) {
            var result = null;
            var moduleName;
            if (moduleUrl.split('/').length > 1) {
                moduleName = moduleUrl.split('/')[location.pathname.split('/').length - 1];
                moduleName = moduleName.split('.').length == 2 ? (moduleName.indexOf('.') > -1 ? moduleName.substring(0, moduleName.indexOf('.')) : moduleName) : '';
            }
            else {
                moduleName = moduleUrl;
            }

            var moduleScript;
            if ($string.isNullOrEmpty(moduleName) == false) {
                try {
                    var module;
                    if (eval('typeof $' + moduleName) == 'object') {
                        var $module = new syn.module();
                        module = $module.extend(eval('$' + moduleName));
                    }
                    else {
                        if (syn.Config && syn.Config.IsClientCaching == true) {
                            moduleScript = await syn.$w.fetchText(moduleUrl + '.js');
                        }
                        else {
                            moduleScript = await syn.$w.fetchText(moduleUrl + '.js?tick=' + new Date().getTime());
                        }

                        if (moduleScript) {
                            var moduleFunction = "return (function() {var module = {};(function (window, module) {'use strict';" + moduleScript + ";var $module = new syn.module();$module.extend($" + moduleName + ");module.exports = $module;})(typeof window !== 'undefined' ? window : {},typeof module !== 'undefined' ? module : {});return module.exports;})();";
                            module = new Function(moduleFunction).call(globalRoot);
                        }
                        else {
                            module = new syn.module();
                        }
                    }

                    if (module.extends && $object.isArray(module.extends) == true) {
                        for (var i = 0; i < module.extends.length; i++) {
                            var name = module.extends[i];
                            var result = await syn.$w.fetchText(name + '.js');
                            var moduleText = result.substring(result.indexOf('{')).replace(/;\r\n?$/, '');
                            var base = eval('(' + moduleText + ')');

                            var $base = new syn.module();
                            $base.extend(base);

                            module = syn.$w.argumentsExtend($base, module);
                            module.config = syn.$w.argumentsExtend($base.config, module.config);
                            module.prop = syn.$w.argumentsExtend($base.prop, module.prop);
                            module.hook = syn.$w.argumentsExtend($base.hook, module.hook);
                            module.event = syn.$w.argumentsExtend($base.event, module.event);
                            module.model = syn.$w.argumentsExtend($base.model, module.model);
                            module.transaction = syn.$w.argumentsExtend($base.transaction, module.transaction);
                            module.method = syn.$w.argumentsExtend($base.method, module.method);
                            module.message = syn.$w.argumentsExtend($base.message, module.message);

                            if ($base.hook && $base.hook.extendLoad) {
                                base.hook.extendLoad(module);
                            }
                        }
                    }

                    result = module;
                }
                catch (error) {
                    syn.$l.eventLog('$w.fetchScript', error, 'Warning');
                    if (moduleScript) {
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인 필요'.format(moduleUrl), 'Information');
                    }
                }
            }

            return result;
        },

        fetchText(url) {
            var fetchOptions = {};
            if (syn.$w.getFetchClientOptions) {
                fetchOptions = syn.$w.getFetchClientOptions(fetchOptions);
            }
            else {
                fetchOptions = {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer-when-downgrade'
                };
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tick=' + new Date().getTime();
            }

            return new Promise(function (resolve, reject) {
                fetch(url, fetchOptions).then(async function (response) {
                    var statusHead = response.status?.toString().substring(0, 1);
                    if (statusHead == '2') {
                        return resolve(response.text());
                    }

                    syn.$l.eventLog('$w.fetchText', `status: ${response.status}, text: ${await response.text()}`, 'Warning');
                    return resolve(null);
                }).catch(function (error) {
                    syn.$l.eventLog('$w.fetchText', error, 'Error');
                    return reject(error);
                });
            });
        },

        fetchJson(url) {
            var fetchOptions = {};
            if (syn.$w.getFetchClientOptions) {
                fetchOptions = syn.$w.getFetchClientOptions(fetchOptions);
            }
            else {
                fetchOptions = {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer-when-downgrade'
                };
            }

            fetchOptions.headers['Content-Type'] = 'application/json';

            if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'tick=' + new Date().getTime();
            }

            return new Promise(function (resolve, reject) {
                fetch(url, fetchOptions).then(function (response) {
                    var statusHead = response.status?.toString().substring(0, 1);
                    if (statusHead == '2') {
                        return resolve(response.json());
                    }

                    syn.$l.eventLog('$w.fetchJson', `status: ${response.status}, text: ${response.text()}`, 'Warning');
                    return resolve(null);
                }).catch(function (error) {
                    syn.$l.eventLog('$w.fetchJson', error, 'Error');
                    return reject(null);
                });

            });
        },

        transactionObject(functionID, returnType) {
            var dataType = 'Json';
            if (returnType) {
                dataType = returnType;
            }

            var jsonObject = {};
            jsonObject.programID = '';
            jsonObject.businessID = '';
            jsonObject.systemID = '';
            jsonObject.transactionID = '';
            jsonObject.dataMapInterface = null;
            jsonObject.transactionResult = true;
            jsonObject.functionID = functionID;
            jsonObject.screenID = '';
            jsonObject.startTraceID = '';
            jsonObject.requestID = null;
            jsonObject.returnType = dataType;
            jsonObject.resultAlias = [];
            jsonObject.inputsItemCount = [];
            jsonObject.inputs = [];

            if (syn.$w.setServiceObject) {
                syn.$w.setServiceObject(jsonObject);
            }

            return jsonObject;
        },

        dynamicType: new function () {
            this.DataSet = '0';
            this.Json = '1';
            this.Scalar = '2';
            this.NonQuery = '3';
            this.SQLText = '4';
            this.SchemeOnly = '5';
            this.CodeHelp = '6';
            this.Xml = '7';
            this.DynamicJson = '8';
        },

        async executeTransaction(config, transactionObject, callback, async, token) {
            if ($object.isNullOrUndefined(config) == true || $object.isNullOrUndefined(transactionObject) == true) {
                if (globalRoot.devicePlatform === 'browser') {
                    alert('서비스 호출에 필요한 거래 정보가 구성되지 않았습니다');
                }

                syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 거래 정보 확인 필요', 'Error');
                return;
            }

            var apiService = null;
            if (globalRoot.devicePlatform === 'node') {
                var apiServices = syn.$w.getStorage('apiServices', false);
                if (apiServices) {
                    apiService = apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)];
                    if ($object.isNullOrUndefined(apiServices.BearerToken) == true && globalRoot.bearerToken) {
                        apiServices.BearerToken = globalRoot.bearerToken;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                        syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요 systemApi: {0}'.format(JSON.stringify(apiService)), 'Warning');
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 BP 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }

            var apiServices = syn.$w.getStorage('apiServices', false);
            if (apiServices) {
                apiService = apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)];
            }

            if (apiService == null) {
                syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요', 'Fatal');
            }
            else {
                if (apiService.exceptionText) {
                    syn.$l.eventLog('$w.executeTransaction', 'apiService 확인 필요 SystemID: {0}, ServerType: {1}, Message: {2}'.format(config.systemID, syn.Config.Environment.substring(0, 1), apiService.exceptionText), 'Fatal');
                    return;
                }

                var ipAddress = syn.$w.getStorage('ipAddress', false);
                if ($object.isNullOrUndefined(ipAddress) == true && $string.isNullOrEmpty(syn.Config.FindClientIPServer) == false) {
                    ipAddress = await syn.$w.apiHttp(syn.Config.FindClientIPServer).send(null, {
                        method: 'GET',
                        redirect: 'follow',
                        timeout: 1000
                    });
                }

                if ($object.isNullOrUndefined(ipAddress) == true) {
                    ipAddress = 'localhost';
                }

                syn.$w.setStorage('ipAddress', ipAddress, false);

                var url = '';
                if (apiService.Port && apiService.Port != '') {
                    url = '{0}://{1}:{2}{3}'.format(apiService.Protocol, apiService.IP, apiService.Port, apiService.Path);
                }
                else {
                    url = '{0}://{1}{2}'.format(apiService.Protocol, apiService.IP, apiService.Path);
                }

                url = '/transact/api/transaction/execute';

                var installType = syn.$w.Variable && syn.$w.Variable.InstallType ? syn.$w.Variable.InstallType : 'L';
                var environment = syn.Config && syn.Config.Environment ? syn.Config.Environment.substring(0, 1) : 'D';
                var machineTypeID = syn.Config && syn.Config.Transaction ? syn.Config.Transaction.MachineTypeID.substring(0, 1) : 'W';
                var programID = (syn.$w.Variable && syn.$w.Variable.ProgramID ? syn.$w.Variable.ProgramID : config.programID).padStart(8, '0');
                var businessID = config.businessID.padStart(3, '0').substring(0, 3);
                var transactionID = transactionObject.transactionID.padStart(6, '0').substring(0, 6);
                var functionID = transactionObject.functionID.padStart(4, '0').substring(0, 4);
                var tokenID = (syn.$w.User && syn.$w.User.TokenID ? syn.$w.User.TokenID : syn.$l.random(6)).padStart(6, '0').substring(0, 6);
                var requestTime = $date.toString(new Date(), 's').substring(0, 6);
                // -- 36바이트 = 설치구분 1자리(L: Local, C: Cloud, O: Onpremise) + 환경 ID 1자리 + 애플리케이션 ID 8자리 + 프로젝트 ID 3자리 + 거래 ID 6자리 + 기능 ID 4자리 + 시스템 구분 1자리 (W: WEB, P: Program, S: SVR, E: EXT) + ClientTokenID 6자리 + Timestamp (HHmmss) 6자리
                var requestID = `${installType}${environment}${programID}${businessID}${transactionID}${functionID}${machineTypeID}${tokenID}${requestTime}`.toUpperCase();
                var globalID = '';

                if ($string.isNullOrEmpty(syn.Config.FindGlobalIDServer) == false) {
                    apiService.GlobalID = await syn.$w.apiHttp(syn.Config.FindGlobalIDServer).send({
                        applicationID: programID,
                        projectID: businessID,
                        transactionID: transactionID,
                        serviceID: functionID,
                        screenID: transactionObject.screenID,
                        tokenID: tokenID
                    }, {
                        method: 'POST',
                        redirect: 'follow',
                        timeout: 1000
                    });
                }

                if ($string.isNullOrEmpty(apiService.GlobalID) == false) {
                    globalID = apiService.GlobalID;
                }
                else {
                    globalID = requestID;
                }

                var transactionRequest = {
                    accessToken: apiServices.BearerToken,
                    action: 'SYN', // "SYN: Request/Response, PSH: Execute/None, ACK: Subscribe",
                    kind: 'BIZ', // "DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish",
                    clientTag: syn.Config.SystemID.concat('|', syn.Config.HostName, '|', syn.Config.Program.ProgramName, '|', syn.Config.Environment.substring(0, 1)),
                    loadOptions: {
                        encryptionType: syn.Config.Transaction.EncryptionType, // "P:Plain, F:Full, H:Header, B:Body",
                        encryptionKey: syn.Config.Transaction.EncryptionKey, // "P:프로그램, K:KMS 서버, G:GlobalID 키",
                        platform: syn.$b.platform
                    },
                    requestID: requestID,
                    version: syn.Config.Transaction.ProtocolVersion,
                    environment: syn.Config.Environment.substring(0, 1),
                    system: {
                        programID: config.programID,
                        version: syn.Config.SystemVersion,
                        routes: [
                            {
                                systemID: config.systemID,
                                requestTick: (new Date()).getTime()
                            }
                        ],
                        localeID: syn.Config.Program.LocaleID,
                        hostName: globalRoot.devicePlatform == 'browser' ? location.host : syn.Config.HostName,
                        pathName: globalRoot.devicePlatform == 'browser' ? location.pathname : ''
                    },
                    interface: {
                        devicePlatform: globalRoot.devicePlatform,
                        interfaceID: syn.Config.Transaction.MachineTypeID,
                        sourceIP: ipAddress,
                        sourcePort: 0,
                        sourceMAC: '',
                        connectionType: globalRoot.devicePlatform == 'node' ? 'unknown' : navigator.connection.effectiveType,
                        timeout: syn.Config.TransactionTimeout
                    },
                    transaction: {
                        globalID: globalID,
                        businessID: config.businessID,
                        transactionID: transactionObject.transactionID,
                        functionID: transactionObject.functionID,
                        commandType: transactionObject.options ? (transactionObject.options.commandType || 'D') : 'D',
                        simulationType: syn.Config.Transaction.SimulationType, // "D:더미 P:운영 T:테스트",
                        terminalGroupID: globalRoot.devicePlatform == 'browser' ? (syn.$w.User ? '{0}|{1}'.format(syn.$w.User.CompanyID, syn.$w.User.DepartmentID) : '') : syn.Config.Program.BranchCode,
                        operatorID: globalRoot.devicePlatform == 'browser' ? (syn.$w.User ? syn.$w.User.UserID : '') : syn.Config.Program.ProgramName,
                        screenID: transactionObject.screenID,
                        startTraceID: transactionObject.startTraceID,
                        dataFormat: syn.Config.Transaction.DataFormat,
                        compressionYN: syn.Config.Transaction.CompressionYN
                    },
                    payLoad: {
                        property: {},
                        mapID: '',
                        dataMapInterface: '',
                        dataMapCount: [],
                        dataMapSet: []
                    }
                };

                if (syn.$w.transactionLoadOptions) {
                    syn.$w.transactionLoadOptions(transactionRequest.loadOptions);
                }

                if ($object.isNullOrUndefined(transactionObject.options) == false) {
                    for (var key in transactionObject.options) {
                        var item = transactionObject.options[key];

                        if (key == 'encryptionType' || key == 'encryptionKey' || key == 'platform') {
                            throw new Error('{0} 옵션 사용 불가'.format(key));
                        }
                        else {
                            transactionRequest.loadOptions[key] = item;
                        }
                    }

                    var dynamic = transactionRequest.loadOptions['dynamic'];
                    if ($string.isNullOrEmpty(dynamic) == false && $string.toBoolean(dynamic) == false) {
                        delete transactionRequest.loadOptions['dynamic'];
                        delete transactionRequest.loadOptions['authorize'];
                        delete transactionRequest.loadOptions['commandType'];
                        delete transactionRequest.loadOptions['returnType'];
                        delete transactionRequest.loadOptions['transactionScope'];
                        delete transactionRequest.loadOptions['transactionLog'];
                    }

                    var action = transactionRequest.loadOptions['action'];
                    if ($string.isNullOrEmpty(action) == false) {
                        transactionRequest.action = action;
                        delete transactionRequest.loadOptions['action'];
                    }

                    var kind = transactionRequest.loadOptions['kind'];
                    if ($string.isNullOrEmpty(kind) == false) {
                        transactionRequest.kind = kind;
                        delete transactionRequest.loadOptions['kind'];
                    }

                    delete transactionRequest.loadOptions['message'];
                }

                var mod = context[syn.$w.pageScript];
                if (mod && mod.hook.payLoadProperty) {
                    var property = {};
                    property = mod.hook.payLoadProperty(transactionObject.transactionID, transactionObject.functionID);
                    if ($object.isNullOrUndefined(property) == true) {
                        property = {};
                    }

                    transactionRequest.payLoad.property = property;
                }

                if (config.transactions) {
                    var transactions = config.transactions.filter(function (item) {
                        return item.functionID == transactionObject.functionID;
                    });

                    if (transactions.length == 1) {
                        var transaction = transactions[0];

                        var inputs = transaction.inputs.map(function (item) { return item.requestType; }).join(',');
                        var outputs = transaction.outputs.map(function (item) { return item.responseType; }).join(',');
                        transactionRequest.payLoad.dataMapInterface = '{0}|{1}'.format(inputs, outputs);
                    }
                }
                else if (transactionObject.dataMapInterface) {
                    transactionRequest.payLoad.dataMapInterface = transactionObject.dataMapInterface;
                }

                if (transactionRequest.transaction.dataFormat == 'J' || transactionRequest.transaction.dataFormat == 'T') {
                }
                else {
                    throw new Error('transaction.dataFormat 확인 필요: {0}'.format(transactionRequest.transaction.dataFormat));
                }

                transactionRequest.payLoad.dataMapCount = transactionObject.inputsItemCount;
                transactionRequest.payLoad.dataMapSet = [];
                transactionRequest.payLoad.dataMapSetRaw = [];
                var length = transactionObject.inputs.length;

                for (var i = 0; i < length; i++) {
                    var inputs = transactionObject.inputs[i];

                    var reqInputs = [];
                    for (var j = 0; j < inputs.length; j++) {
                        var item = inputs[j];

                        reqInputs.push({
                            id: item.prop,
                            value: item.val
                        });
                    }

                    if (syn.Config.Transaction.CompressionYN == 'Y') {
                        if (transactionRequest.transaction.dataFormat == 'J') {
                            transactionRequest.payLoad.dataMapSetRaw.push(syn.$c.LZString.compressToBase64(JSON.stringify(reqInputs)));
                        }
                        else {
                            transactionRequest.payLoad.dataMapSetRaw.push(syn.$c.LZString.compressToBase64($object.toCSV(reqInputs, { delimeter: '｜', newline: '↵' })));
                        }
                    }
                    else {
                        if (transactionRequest.transaction.dataFormat == 'J') {
                            transactionRequest.payLoad.dataMapSet.push(reqInputs);
                        }
                        else {
                            transactionRequest.payLoad.dataMapSetRaw.push($object.toCSV(reqInputs, { delimeter: '｜', newline: '↵' }));
                        }
                    }
                }

                if (transactionRequest.action == 'PSH') {
                    var blob = new Blob([JSON.stringify(transactionRequest)], { type: 'application/json; charset=UTF-8' });
                    navigator.sendBeacon(url, blob);

                    if (syn.$w.domainTransactionLoaderEnd) {
                        syn.$w.domainTransactionLoaderEnd();
                    }

                    if (syn.$w.closeProgressMessage) {
                        syn.$w.closeProgressMessage();
                    }
                }
                else {
                    var xhr = syn.$w.xmlHttp();
                    xhr.open(syn.$w.method, url, true);
                    xhr.setRequestHeader('Accept-Language', syn.$w.localeID);
                    xhr.setRequestHeader('Server-SystemID', config.systemID);
                    xhr.setRequestHeader('Server-BusinessID', config.businessID);

                    if (syn.Environment) {
                        var environment = syn.Environment;
                        if (environment.Header) {
                            for (var item in environment.Header) {
                                xhr.setRequestHeader(item, environment.Header[item]);
                            }
                        }
                    }

                    if (syn.$w.setServiceClientHeader) {
                        if (syn.$w.setServiceClientHeader(xhr) == false) {
                            return;
                        }
                    }

                    if (async !== undefined && xhr.async == true) {
                        xhr.async = async;

                        if (xhr.async == false) {
                            xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                            xhr.setRequestHeader('Content-Type', 'application/json');
                            xhr.send(transactionRequest);

                            return xhr;
                        }
                    }

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status !== 200) {
                                if (xhr.status == 0) {
                                    syn.$l.eventLog('$w.executeTransaction', 'X-Requested transfort error', 'Fatal');
                                }
                                else {
                                    syn.$l.eventLog('$w.executeTransaction', 'response status - {0}'.format(xhr.statusText) + xhr.responseText, 'Error');
                                }

                                if (syn.$w.domainTransactionLoaderEnd) {
                                    syn.$w.domainTransactionLoaderEnd();
                                }
                                return;
                            }

                            if (syn.$w.clientTag && syn.$w.serviceClientInterceptor) {
                                if (syn.$w.serviceClientInterceptor(syn.$w.clientTag, xhr) === false) {
                                    return;
                                }
                            }

                            try {
                                var transactionResponse = JSON.parse(xhr.responseText);
                                if (transactionObject.transactionResult == true) {
                                    if (transactionResponse.acknowledge == 1) {
                                        var jsonResult = [];
                                        var message = transactionResponse.message;
                                        if (transactionResponse.result.dataSet != null && transactionResponse.result.dataSet.length > 0) {
                                            var mapID = transactionResponse.result.mapID;
                                            var dataMapItem = transactionResponse.result.dataSet;
                                            var length = dataMapItem.length;
                                            for (var i = 0; i < length; i++) {
                                                var item = dataMapItem[i];

                                                if (transactionResponse.transaction.simulationType == syn.$w.dynamicType.CodeHelp) {
                                                    jsonResult.push({
                                                        id: item.id,
                                                        value: item.value
                                                    });
                                                    continue;
                                                }

                                                if (transactionResponse.transaction.dataFormat == 'J') {
                                                    if (transactionResponse.transaction.compressionYN == 'Y') {
                                                        jsonResult.push({
                                                            id: item.id,
                                                            value: JSON.parse(syn.$c.LZString.decompressFromBase64(item.value))
                                                        });
                                                    }
                                                    else {
                                                        jsonResult.push({
                                                            id: item.id,
                                                            value: item.value
                                                        });
                                                    }
                                                }
                                                else {
                                                    if (config.transactions) {
                                                        var transaction = config.transactions.find(function (item) {
                                                            return item.functionID == transactionObject.functionID;
                                                        });

                                                        if (transaction) {
                                                            var value = null;
                                                            if ($object.isEmpty(item.value) == false) {
                                                                value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value).split('＾') : item.value.split('＾');
                                                                var meta = $string.toParameterObject(value[0]);
                                                                value = $string.toJson(value[1], { delimeter: '｜', newline: '↵', meta: meta });

                                                                var outputMapping = transaction.outputs[i];
                                                                if (outputMapping.responseType == 'Form') {
                                                                    value = value[0];
                                                                    if ($object.isNullOrUndefined(value) == true) {
                                                                        value = {};
                                                                    }
                                                                }
                                                                else {
                                                                    if ($object.isNullOrUndefined(value) == true) {
                                                                        value = [];
                                                                    }
                                                                }
                                                            }

                                                            jsonResult.push({
                                                                id: item.id,
                                                                value: value
                                                            });
                                                        }
                                                    }
                                                    else {
                                                        var value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value).split('＾') : item.value.split('＾');
                                                        var meta = $string.toParameterObject(value[0]);
                                                        value = $string.toJson(value[1], { delimeter: '｜', newline: '↵', meta: meta });
                                                        if (item.id.startsWith('Form') == true) {
                                                            value = value[0];
                                                            if ($object.isNullOrUndefined(value) == true) {
                                                                value = {};
                                                            }
                                                            else {
                                                                if ($object.isNullOrUndefined(value) == true) {
                                                                    value = [];
                                                                }
                                                            }
                                                        }

                                                        jsonResult.push({
                                                            id: item.id,
                                                            value: value
                                                        });
                                                    }
                                                }
                                            }
                                        }

                                        if (callback) {
                                            var addtionalData = {};
                                            if (message.additions && message.additions.length > 0) {
                                                for (var i = 0; i < message.additions.length; i++) {
                                                    var addition = message.additions[i];

                                                    if (addition.code == 'F' && $object.isNullOrUndefined(addtionalData[addition.code]) == true) {
                                                        addtionalData[addition.code] = addition.text;
                                                    }
                                                    else if (addition.code == 'P') {

                                                    }
                                                    else if (addition.code == 'S') {

                                                    }
                                                }
                                            }

                                            try {
                                                callback(jsonResult, addtionalData, transactionResponse.correlationID);
                                            } catch (error) {
                                                syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                            }
                                        }
                                    }
                                    else {
                                        var errorText = transactionResponse.exceptionText;
                                        var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                        if (syn.$w.serviceClientException) {
                                            syn.$w.serviceClientException('요청오류', errorMessage, errorText);
                                        }

                                        syn.$l.eventLog('$w.executeTransaction', errorText, 'Warning');

                                        if (globalRoot.devicePlatform === 'browser') {
                                            if ($this && $this.hook && $this.hook.frameEvent) {
                                                $this.hook.frameEvent('transactionException', {
                                                    transactionID: transactionRequest.transaction.transactionID,
                                                    functionID: transactionRequest.transaction.functionID,
                                                    errorText: errorText,
                                                    errorMessage: errorMessage
                                                });
                                            }
                                        }
                                        else {
                                            if (callback) {
                                                try {
                                                    callback([], null), transactionResponse.correlationID;
                                                } catch (error) {
                                                    syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (callback) {
                                        if (transactionResponse && transactionResponse.acknowledge && transactionResponse.acknowledge == 1) {
                                            try {
                                                if (transactionResponse.result.dataSet != null && transactionResponse.result.dataSet.length > 0) {
                                                    var mapID = transactionResponse.result.mapID;
                                                    var dataMapItem = transactionResponse.result.dataSet;
                                                    var length = dataMapItem.length;
                                                    for (var i = 0; i < length; i++) {
                                                        var item = dataMapItem[i];
                                                        if (transactionResponse.transaction.dataFormat == 'J') {
                                                            if (transactionResponse.transaction.compressionYN == 'Y') {
                                                                item.value = JSON.parse(syn.$c.LZString.decompressFromBase64(item.value));
                                                            }
                                                        }
                                                        else {
                                                            item.value = transactionResponse.transaction.compressionYN == 'Y' ? syn.$c.LZString.decompressFromBase64(item.value) : item.value;
                                                        }
                                                    }
                                                }
                                            } catch (error) {
                                                syn.$l.eventLog('$w.executeTransaction', error, 'Error');
                                            }
                                        }

                                        try {
                                            callback(transactionResponse, null, transactionResponse.correlationID);
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                if (syn.$w.serviceClientException) {
                                    syn.$w.serviceClientException('요청오류', errorMessage, error.stack);
                                }

                                syn.$l.eventLog('$w.executeTransaction', error, 'Error');

                                if (globalRoot.devicePlatform === 'browser') {
                                    if ($this && $this.hook && $this.hook.frameEvent) {
                                        $this.hook.frameEvent('transactionError', {
                                            transactionID: transactionRequest.transaction.transactionID,
                                            functionID: transactionRequest.transaction.functionID,
                                            errorText: error.message,
                                            errorMessage: errorMessage
                                        });
                                    }
                                }
                                else {
                                    if (callback) {
                                        try {
                                            callback([], null);
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction callback', error, 'Error');
                                        }
                                    }
                                }
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                        }
                    }

                    syn.$l.eventLog('$w.executeTransaction', transactionRequest.requestID, 'Verbose');

                    xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.timeout = syn.Config.TransactionTimeout;
                    xhr.send(JSON.stringify(transactionRequest));
                }
            }
        }
    });

    if (syn && !syn.Config) {
        syn.Config = {};
    }

    syn.$w = $webform;
    if (globalRoot.devicePlatform === 'node') {
        var fs = require('fs');
        var path = require('path');

        if (process.env.SYN_CONFIG) {
            syn.Config = JSON.parse(process.env.SYN_CONFIG);
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), 'BusinessContract/Database/DataSource.xml');
        }

        delete syn.$w.isPageLoad;
        delete syn.$w.pageReadyTimeout;
        delete syn.$w.eventAddReady;
        delete syn.$w.eventRemoveReady;
        delete syn.$w.moduleReadyIntervalID;
        delete syn.$w.remainingReadyIntervalID;
        delete syn.$w.remainingReadyCount;
        delete syn.$w.defaultControlOptions;
        delete syn.$w.initializeScript;
        delete syn.$w.activeControl;
        delete syn.$w.contentLoaded;
        delete syn.$w.addReadyCount;
        delete syn.$w.removeReadyCount;
        delete syn.$w.createSelection;
        delete syn.$w.getTriggerOptions;
        delete syn.$w.triggerAction;
        delete syn.$w.transactionAction;
        delete syn.$w.transaction;
        delete syn.$w.scrollToTop;
        delete syn.$w.setFavicon;
        delete syn.$w.fileDownload;
    }
    else {
        var pathname = location.pathname;
        if (pathname.split('/').length > 0) {
            var filename = pathname.split('/')[pathname.split('/').length - 1];
            $webform.extend({
                pageProject: pathname.split('/')[pathname.split('/').length - 2],
                pageScript: '$' + (filename.indexOf('.') > -1 ? filename.substring(0, filename.indexOf('.')) : filename)
            });
        }

        syn.$l.addEvent(context, 'load', function () {
            var mod = context[syn.$w.pageScript];
            if (mod && mod.hook.windowLoad) {
                mod.hook.windowLoad();
            }
        });

        var urlArgs = syn.$r.getCookie('syn.iscache') == 'true' ? '' : '?tick=' + new Date().getTime();
        var isAsyncLoad = syn.$b.isIE == false;

        globalRoot.isLoadConfig = false;
        if (context.synConfig) {
            syn.Config = syn.$w.argumentsExtend(synConfig, syn.Config);
            context.synConfig = undefined;

            globalRoot.isLoadConfig = true;
            setTimeout(async function () {
                await $webform.contentLoaded();
            });
        }
        else {
            $webform.loadJson('/' + (context.synConfigName || 'syn.config.json') + urlArgs, null, function (setting, json) {
                syn.Config = syn.$w.argumentsExtend(json, syn.Config);

                globalRoot.isLoadConfig = true;
                setTimeout(async function () {
                    await $webform.contentLoaded();
                });
            }, null, isAsyncLoad);
        }

        if (context.Configuration) {
            syn.Environment = context.Configuration;
            syn.$l.deepFreeze(syn.Environment);
            delete context.Configuration;
        }

        if (syn.Environment) {
            var environment = syn.Environment;
            if (environment.Cookie) {
                for (var item in environment.Cookie) {
                    var value = syn.$r.getCookie(item);
                    if ($object.isNullOrUndefined(value) == true) {
                        syn.$r.setCookie(item, environment.Cookie[item]);
                    }
                }
            }
        }

        if (globalRoot.devicePlatform === 'browser') {
            syn.$b.appName = syn.Config.HostName;
            syn.$b.appCodeName = syn.Config.ApplicationID;
        }
    }
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $resource = context.$resource || new syn.module();
    var document = context.document;

    $resource.extend({
        version: '1.0.0',
        localeID: 'ko-KR',
        fullyQualifiedLocale: {
            ko: 'ko-KR',
            en: 'en-US',
            ja: 'ja-JP',
            zh: 'zh-CN'
        },

        translations: {},
        translateControls: [],

        concreate() {
            var els = document.querySelectorAll('[syn-i18n]');
            for (var i = 0; i < els.length; i++) {
                var el = els[i];

                var tagName = el.tagName.toUpperCase();
                var elID = el.getAttribute('id');
                var i18nOption = el.getAttribute('syn-i18n');

                if (i18nOption === undefined || i18nOption === null || i18nOption === '') {
                    continue;
                }

                var options = null;
                if (i18nOption.startsWith('{') == true) {
                    try {
                        options = eval('(' + i18nOption + ')');
                        if (options.options.bindSource === undefined || options.options.bindSource === null) {
                            options.bindSource = 'content';
                        }
                        else {
                            options.bindSource = options.options.bindSource;
                        }
                    } catch (error) {
                        console.log('$resource.concreate, tagName: "' + tagName + '", elID: "' + elID + '" syn-i18n 확인 필요, error: ' + error.message);
                    }
                }
                else {
                    options = {
                        key: i18nOption,
                        bindSource: 'content'
                    };
                }

                if (options && (options.key === undefined || options.key === null || options.key === '') == false) {
                    el.setAttribute('i18n-key', options.key);
                    var controlType = '';
                    var moduleName = null;

                    if (tagName.indexOf('SYN_') > -1) {
                        moduleName = tagName.substring(4).toLowerCase();
                        controlType = moduleName;
                    }
                    else {
                        switch (tagName) {
                            case 'BUTTON':
                                moduleName = 'button';
                                controlType = 'button';
                                break;
                            case 'INPUT':
                                controlType = el.getAttribute('type').toLowerCase();
                                switch (controlType) {
                                    case 'hidden':
                                    case 'text':
                                    case 'password':
                                    case 'color':
                                    case 'email':
                                    case 'number':
                                    case 'search':
                                    case 'tel':
                                    case 'url':
                                        moduleName = 'textbox';
                                        break;
                                    case 'submit':
                                    case 'reset':
                                    case 'button':
                                        moduleName = 'button';
                                        break;
                                    case 'radio':
                                        moduleName = 'radio';
                                        break;
                                    case 'checkbox':
                                        moduleName = 'checkbox';
                                        break;
                                }
                                break;
                            case 'TEXTAREA':
                                moduleName = 'textarea';
                                controlType = 'textarea';
                                break;
                            case 'SELECT':
                                if (el.getAttribute('multiple') == null) {
                                    moduleName = 'select';
                                    controlType = 'select';
                                }
                                else {
                                    moduleName = 'multiselect';
                                    controlType = 'multiselect';
                                }
                                break;
                            default:
                                moduleName = 'element';
                                break;
                        }
                    }

                    var key = options.key;
                    var bindSource = options.bindSource;

                    delete options.key;
                    delete options.bindSource;

                    $resource.translateControls.push({
                        elID: elID,
                        key: key,
                        bindSource: bindSource,
                        tag: tagName,
                        module: moduleName,
                        type: controlType,
                        options: options
                    });
                }
                else {
                    console.log('$resource.concreate, tagName: "' + tagName + '", elID: "' + elID + '" key 확인 필요');
                }
            }

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.pageResource) {
                mod.hook.pageResource($resource.localeID);
            }

            if (syn.Config && $string.toBoolean(syn.Config.IsLocaleTranslations) == true) {
                $resource.remainingReadyIntervalID = setInterval(function () {
                    if (syn.$w.isPageLoad == true) {
                        clearInterval($resource.remainingReadyIntervalID);
                        $resource.remainingReadyIntervalID = null;
                        $resource.setLocale($resource.localeID);
                    }
                }, 25);
            }
        },

        add(id, val) {
            $resource.translations[id] = val;
        },

        remove(id) {
            delete $resource.translations[id];
        },

        interpolate(message, interpolations) {
            return Object.keys(interpolations).reduce(function (interpolated, key) {
                return interpolated.replace(new RegExp('#{s*' + key + 's*}', 'g'), interpolations[key]);
            }, message);
        },

        getControl(el) {
            var result = null;
            if ($object.isString(el) == true) {
                el = syn.$l.get(el);
            }

            if ($object.isNullOrUndefined(el) == false) {
                var elID = el.id;
                var tag = el.tagName;
                var key = el.getAttribute('i18n-key');

                if ($string.isNullOrEmpty(elID) == true) {
                    result = $resource.translateControls.find(function (item) { return item.tag == tag && item.key == key; });
                }
                else {
                    result = $resource.translateControls.find(function (item) { return item.elID == elID && item.tag == tag && item.key == key; });
                }
            }

            return result;
        },

        translatePage() {
            $resource.translateControls.forEach(function (control) {
                $resource.translateControl(control);
            });
        },

        translateElement(el, options) {
            var control = $resource.getControl(el);
            if ($object.isNullOrUndefined(control) == false) {
                $resource.translateControl(control, options);
            }
        },

        translateControl(control, options) {
            if ($object.isNullOrUndefined(control) == false) {
                var el = null;
                if ($string.isNullOrEmpty(control.elID) == false) {
                    el = syn.$l.get(control.elID);
                }
                else {
                    el = syn.$l.querySelector('{0}[i18n-key="{1}"]'.format(control.tag, control.key));
                }

                if ($object.isNullOrUndefined(control.module) == true) {
                    var bind = $resource.getBindSource(control);
                    if ($string.isNullOrEmpty(bind) == false) {
                        el[bind] = $resource.translateText(control, options);
                    }
                }
                else {
                    if (syn.uicontrols) {
                        var controlModule = syn.uicontrols['$' + control.module];
                        if (controlModule && controlModule.setLocale) {
                            controlModule.setLocale(control.elID, $resource.translations, control, options);
                        }
                    }
                }
            }
        },

        translateText(control, options) {
            var result = '';
            if (control) {
                var key = control.key;
                var translation = $resource.translations[key];

                var text = null;
                if ($object.isString(translation) == true) {
                    text = translation;
                }
                else if ($object.isArray(translation) == true) {
                    text = translation[0];
                }
                else if ($object.isObject(translation) == true) {
                    text = translation.Text;
                }

                if (/#{s*\w+s*}/g.test(text) == true) {
                    var interpolateOption = syn.$w.getSSOInfo();
                    if (interpolateOption) {
                        if (options) {
                            interpolateOption = syn.$w.argumentsExtend(interpolateOption, options);
                        }
                    }
                    else {
                        interpolateOption = options;
                    }

                    result = interpolateOption ? $resource.interpolate(text, interpolateOption) : text;
                }
                else {
                    result = text;
                }
            }

            return result;
        },

        getBindSource(control) {
            var result = null;
            switch (control.bindSource) {
                case 'text':
                    result = 'innerText';
                    break;
                case 'content':
                    result = 'textContent';
                    break;
                case 'html':
                    result = 'innerHTML';
                    break;
                case 'url':
                    result = 'src';
                    break;
                case 'placeholder':
                    result = 'placeholder';
                    break;
                case 'control':
                    result = 'controlText';
                    break;
                case 'value':
                    result = 'value';
                    break;
            }

            return result;
        },

        async setLocale(localeID) {
            var localeUrl = '/assets/shared/language/';
            if (syn && syn.Config) {
                localeUrl = syn.Config.LocaleAssetUrl ? syn.Config.LocaleAssetUrl : syn.Config.SharedAssetUrl + 'language/';
            }

            $resource.localeID = localeID;
            localeUrl = `${localeUrl}${localeID}.json`;
            var enabled = await syn.$r.isCorsEnabled(localeUrl);
            if (enabled == true) {
                try {
                    var translations = await syn.$w.fetchJson(localeUrl);
                    $resource.translations = syn.$w.argumentsExtend($resource.translations, translations);
                } catch (error) {
                    syn.$l.eventLog('$resource.setLocale', error.message, 'Warning');
                }
            }
            document.documentElement.lang = localeID.substring(0, 2);
            $resource.translatePage();
        }
    });

    context.$resource = $resource;
})(globalRoot);

(function (context, $res) {
    if (!$res) {
        throw new Error("$res 리소스 객체가 없습니다.");
    }
    $resource.add('localeID', 'ko-KR');

    $resource.add('progress', '진행 중입니다.');
    $resource.add('appendTo', '신규 입력 상태입니다.');
    $resource.add('appendPre', '화면 구성 중...');
    $resource.add('retrieve', '정상적으로 조회되었습니다.');
    $resource.add('retrieveException', '데이터를 조회하는 과정에서 문제가 발생하였습니다.');
    $resource.add('retrievePre', '데이터 조회 중...');
    $resource.add('save', '정상적으로 저장되었습니다.');
    $resource.add('saveException', '데이터를 저장하는 과정에서 문제가 발생하였습니다.');
    $resource.add('savePre', '저장 중...');
    $resource.add('update', '정상적으로 수정되었습니다.');
    $resource.add('updateException', '데이터를 수정하는 과정에서 문제가 발생하였습니다.');
    $resource.add('updatePre', '수정 중...');
    $resource.add('remove', '정상적으로 삭제되었습니다.');
    $resource.add('removeException', '데이터를 삭제하는 과정에서 문제가 발생하였습니다.');
    $resource.add('removePre', '삭제 중...');
    $resource.add('copyAppend', '기존 데이터를 복사하여 입력 상태로 전환했습니다.');
    $resource.add('userInfoNothing', '사용자 정보에 문제가 발생했습니다.');

    $resource.add('isLogOut', '정말로 로그아웃 하시겠습니까?');
    $resource.add('waiting', '잠시만 기다려주세요...');
    $resource.add('notElemnet', '컨트롤이 발견되지 않았습니다. 쿼리나 HTML 디자인을 살펴보세요');
    $resource.add('dualElemnet', '"{0}"의 아이디는 현재 페이지에서 중복된 이름 또는 아이디의 컨트롤로 발견되었습니다.');
    $resource.add('requiredKeyData', '필수 입력 항목 오류');
    $resource.add('requiredInsertData', '아래 항목은 필수 입력 항목입니다.');
    $resource.add('errorMessage', '에러가 발생했습니다.');
    $resource.add('serverErrorMessage', '서버에서 에러가 발생했습니다.');
    $resource.add('initialComplete', '화면 구성 완료');
    $resource.add('initialException', '화면 구성 실패');
    $resource.add('isDateTimeInsert', '"{0}" 포맷의 날짜와 시간을 입력해야 합니다.');
    $resource.add('isDateInsert', '"{0}" 포맷의 날짜를 입력해야 합니다.');
    $resource.add('isTimeInsert', '"{0}" 포맷의 시간을 입력해야 합니다.');
    $resource.add('isNumericInsert', '숫자를 입력해야 합니다.');
    $resource.add('forceSave', '편집중인 데이터를 저장하시겠습니까?');
    $resource.add('textMaxLength', '입력 가능한 "{0}"자리수를 넘었습니다');

    $resource.add('create', '입력');
    $resource.add('read', '조회');
    $resource.add('find', '검색');
    $resource.add('edit', '수정');
    $resource.add('delele', '삭제');
    $resource.add('removeStatusNo', '삭제 가능한 상태가 아닙니다. 데이터를 조회한 후 삭제 해야 합니다.');
    $resource.add('removeConfirm', '정말로 삭제 하시겠습니까?');
    $resource.add('notData', '데이터가 없습니다.');
    $resource.add('notCondData', '입력하신 조건에 맞는 데이터가 없습니다.');
    $resource.add('notRetrieveCond', '조회에 필요한 항목이 입력되지 않았습니다.');
    $resource.add('notDateBetween', '기간이 올바르게 설정되지 않았습니다.');
    $resource.add('notDate', '정확한 날짜를 입력 하거나 선택해야 합니다.');
    $resource.add('notFindCond', '검색에 필요한 문장을 입력해야 합니다. 정확한 검색을 위해 두글자 이상 입력해야 합니다.');
    $resource.add('selectData', '데이터를 선택해야 합니다.');
    $resource.add('selectAll', '전체');
    $resource.add('saveExcel', '엑셀 다운로드 중입니다.');
    $resource.add('saveExcelComplete', '엑셀 파일을 다운로드 했습니다.');
    $resource.add('saveExcelFail', '엑셀 파일 다운로드를 실패 했습니다');
    $resource.add('notSupportContent', '지원 하지 않는 컨텐츠 타입입니다.');
})(globalRoot, $resource);
