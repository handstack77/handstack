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
