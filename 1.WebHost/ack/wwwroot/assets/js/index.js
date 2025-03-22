/*!
HandStack Javascript Library v2025.3.23
https://handshake.kr

Copyright 2025, HandStack
*/

const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    if (typeof this !== 'undefined') return this;
    throw new Error('전역 객체를 찾을 수 없습니다');
};

const globalRoot = getGlobal();

globalRoot.devicePlatform = 'browser';
if ('AndroidScript' in globalRoot) {
    globalRoot.devicePlatform = 'android';
} else if ('webkit' in globalRoot) {
    globalRoot.devicePlatform = 'ios';
} else if ('process' in globalRoot && typeof module === 'object') {
    globalRoot.devicePlatform = 'node';
}

class Module {
    constructor(config) {
        if (config) {
            this.extend(config);
        }
    }

    concreate() { }

    extend(source, val) {
        if (arguments.length > 1) {
            const ancestor = this[source];
            if (
                ancestor &&
                typeof val === 'function' &&
                (!ancestor.valueOf || ancestor.valueOf() !== val.valueOf()) &&
                /\bbase\b/.test(val)
            ) {
                const method = val.valueOf();

                val = function () {
                    const previous = this.base || Module.prototype.base;
                    this.base = ancestor;
                    const returnValue = method.apply(this, arguments);
                    this.base = previous;
                    return returnValue;
                };

                val.valueOf = (type) => (type === 'object' ? val : method);
                val.toString = Module.toString;
            }

            if (source === 'config') {
                const argumentsExtend = (...args) => {
                    const extended = {};
                    for (const arg of args) {
                        for (const prop in arg) {
                            if (Object.prototype.hasOwnProperty.call(arg, prop)) {
                                extended[prop] = arg[prop];
                            }
                        }
                    }
                    return extended;
                };

                this[source] = argumentsExtend(this[source], val);
            } else {
                this[source] = val;
            }
        } else if (source) {
            let extend = Module.prototype.extend;

            if (!Module.prototyping && typeof this !== 'function') {
                extend = this.extend || extend;
            }

            const prototype = { toSource: null };
            const hidden = ['constructor', 'toString', 'valueOf', 'concreate'];
            let i = Module.prototyping ? 0 : 1;
            let key;

            while ((key = hidden[i++])) {
                if (source[key] != prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            for (const key in source) {
                if (!prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            const concreate = source['concreate'];
            if (concreate) {
                concreate(source);
            }
        }
        return this;
    }

    base() { }

    static extend(newType, staticType) {
        Module.prototyping = true;
        const prototype = new this();

        prototype.extend(newType);
        prototype.base = function () { };

        delete Module.prototyping;

        const constructor = prototype.constructor;
        const object = prototype.constructor = function () {
            if (!Module.prototyping) {
                if (this.constructing || this.constructor === object) {
                    this.constructing = true;
                    constructor.apply(this, arguments);
                    delete this.constructing;
                } else if (arguments[0] != null) {
                    return (arguments[0].extend || Module.prototype.extend).call(arguments[0], prototype);
                }
            }
        };

        object.ancestor = this;
        object.extend = this.extend;
        object.each = this.each;
        object.implement = this.implement;
        object.prototype = prototype;
        object.toString = this.toString;
        object.valueOf = (type) => (type === 'object' ? object : constructor.valueOf());

        object.extend(staticType);

        if (typeof object.init === 'function') {
            object.init();
        }

        return object;
    }

    static each(elements, func, props) {
        if (func === undefined || func.length === 0) {
            return;
        }

        for (const key in elements) {
            if (typeof elements[key] === 'object') {
                func.apply(elements[key], props);
            }
        }
    }

    static implement(...args) {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'function') {
                args[i](this.prototype);
            } else {
                this.prototype.extend(args[i]);
            }
        }
        return this;
    }

    static toString() {
        return String(this.valueOf());
    }
}

Module.ancestor = Object;
Module.version = 'v2025.3.12';

const syn = { Module };
syn.Config = {
    SystemID: 'HANDSTACK',
    ApplicationID: 'HDS',
    ProjectID: 'SYS',
    SystemVersion: '1.0.0',
    TransactionTimeout: 180000,
    HostName: 'WebClient',
    UIEventLogLevel: 'Verbose',
    IsLocaleTranslations: false,
    LocaleAssetUrl: '/assets/shared/language/',
    AssetsCachingID: 'cache-id',
    IsClientCaching: true,
    IsDebugMode: false,
    IsBundleLoad: false,
    ContractRequestPath: 'view',
    TenantAppRequestPath: 'app',
    SharedAssetUrl: '/assets/shared/',
    IsApiFindServer: false,
    DiscoveryApiServerUrl: '',
    ReportServer: '',
    FileManagerServer: 'http://localhost:8000',
    FindClientIPServer: '/checkip',
    FindGlobalIDServer: '',
    FileServerType: 'L',
    FileBusinessIDSource: 'None',
    CookiePrefixName: 'HandStack',
    Environment: 'Development',
    DomainAPIServer: {
        ServerID: 'SERVERD01',
        ServerType: 'D',
        Protocol: 'http',
        IP: 'localhost',
        Port: '8000',
        Path: '/transact/api/transaction/execute',
        ClientIP: 'localhost'
    },
    Program: {
        ProgramName: 'ack',
        ProgramVersion: '1.0.0',
        LanguageID: 'ko',
        LocaleID: 'ko-KR',
        BranchCode: ''
    },
    Transaction: {
        ProtocolVersion: '001',
        SimulationType: 'P',
        DataFormat: 'J',
        MachineTypeID: 'WEB',
        EncryptionType: 'P',
        EncryptionKey: 'G',
        CompressionYN: 'N'
    },
    EnvironmentSetting: {
        Application: {
            LoaderPath: '/js/syn.domain.js'
        }
    }
};

syn.module = Module;

globalRoot.syn = syn;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = syn;
}

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $cryptography = context.$cryptography || new syn.module();

    $cryptography.extend({
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

        isWebCryptoSupported() {
            return (typeof window.crypto !== 'undefined' && typeof window.crypto.subtle !== 'undefined');
        },

        padKey(key, length) {
            var result = null;
            if (typeof key === 'string') {
                key = new TextEncoder().encode(key);

                if (key.length >= length) {
                    return key.slice(0, length);
                }

                result = new Uint8Array(length);
                result.set(key);
            }
            return result;
        },

        // syn.$c.generateHMAC().then((signature) => { debugger; });
        async generateHMAC(key, message) {
            var result = null;
            var encoder = new TextEncoder();
            var keyData = encoder.encode(key);
            var messageData = encoder.encode(message);
            var cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            var signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
            result = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
            return result;
        },

        // syn.$c.verifyHMAC('handstack', 'hello world', '25a00a2d55bbb313329c8abba5aebc8b282615876544c5be236d75d1418fc612').then((result) => { debugger; });
        async verifyHMAC(key, message, signature) {
            return await $cryptography.generateHMAC(key, message) === signature;
        },

        // syn.$c.generateRSAKey().then((cryptoKey) => { debugger; });
        async generateRSAKey() {
            var result = null;
            result = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ['encrypt', 'decrypt']
            );
            return result;
        },

        // syn.$c.exportCryptoKey(cryptoKey.publicKey, true).then((result) => { debugger; });
        async exportCryptoKey(cryptoKey, isPublic) {
            var result = '';
            isPublic = $string.toBoolean(isPublic);
            var exportLabel = isPublic == true ? 'PUBLIC' : 'PRIVATE';
            var exported = await window.crypto.subtle.exportKey(
                (isPublic == true ? 'spki' : 'pkcs8'),
                cryptoKey
            );
            var exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
            var exportedAsBase64 = window.btoa(exportedAsString);
            result = `-----BEGIN ${exportLabel} KEY-----\n${exportedAsBase64}\n-----END ${exportLabel} KEY-----`;

            var lines = result.split('\n');
            result = lines.map(line => {
                return line.match(/.{1,64}/g).join('\n');
            });
            return result.join('\n');
        },

        // syn.$c.importCryptoKey('-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----', true).then((result) => { debugger; });
        async importCryptoKey(pem, isPublic) {
            var result = null;
            isPublic = $string.toBoolean(isPublic);
            var exportLabel = isPublic == true ? 'PUBLIC' : 'PRIVATE';
            var pemHeader = `-----BEGIN ${exportLabel} KEY-----`;
            var pemFooter = `-----END ${exportLabel} KEY-----`;
            var pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).replaceAll('\n', '');
            var binaryDerString = window.atob(pemContents);
            var binaryDer = syn.$l.stringToArrayBuffer(binaryDerString);
            var importMode = isPublic == true ? ['encrypt'] : ['decrypt'];

            result = await crypto.subtle.importKey(
                (isPublic == true ? 'spki' : 'pkcs8'),
                binaryDer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                true,
                importMode
            );
            return result;
        },

        // syn.$c.rsaEncode('hello world', result).then((result) => { debugger; });
        async rsaEncode(text, publicKey) {
            var result = null;
            var encoder = new TextEncoder();
            var data = encoder.encode(text);
            var encrypted = await crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP'
                },
                publicKey,
                data
            );

            result = $cryptography.base64Encode(new Uint8Array(encrypted));
            return result;
        },

        // syn.$c.rsaDecode(encryptData, result).then((result) => { debugger; });
        async rsaDecode(encryptedData, privateKey) {
            var result = null;
            var encrypted = new Uint8Array($cryptography.base64Decode(encryptedData).split(',').map(Number));
            var decrypted = await crypto.subtle.decrypt(
                {
                    name: 'RSA-OAEP'
                },
                privateKey,
                encrypted
            );

            var decoder = new TextDecoder();
            result = decoder.decode(decrypted);
            return result;
        },

        generateIV(key, ivLength) {
            var result;
            ivLength = ivLength || 16;
            if (key && key.toUpperCase() == '$RANDOM$') {
                result = window.crypto.getRandomValues(new Uint8Array(ivLength));
            }
            else {
                key = key || '';
                result = $cryptography.padKey(key, ivLength);
            }

            return result;
        },

        async aesEncode(text, key, algorithm, keyLength) {
            var result = null;
            key = key || '';
            algorithm = algorithm || 'AES-CBC'; // AES-CBC, AES-GCM
            keyLength = keyLength || 256; // 128, 256
            var ivLength = algorithm === 'AES-GCM' ? 12 : 16;
            var iv = $cryptography.generateIV(key, ivLength);
            var encoder = new TextEncoder();
            var data = encoder.encode(text);

            var cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                $cryptography.padKey(key, keyLength / 8),
                { name: algorithm },
                false,
                ['encrypt']
            );

            var encrypted = await window.crypto.subtle.encrypt(
                {
                    name: algorithm,
                    iv: iv
                },
                cryptoKey,
                data
            );

            result = {
                iv: $cryptography.base64Encode(iv),
                encrypted: $cryptography.base64Encode(new Uint8Array(encrypted))
            };

            return result;
        },

        async aesDecode(encryptedData, key, algorithm, keyLength) {
            var result = null;
            key = key || '';
            algorithm = algorithm || 'AES-CBC'; // AES-CBC, AES-GCM
            keyLength = keyLength || 256; // 128, 256
            if (encryptedData && encryptedData.iv && encryptedData.encrypted) {
                var iv = new Uint8Array($cryptography.base64Decode(encryptedData.iv).split(',').map(Number));
                var encrypted = new Uint8Array($cryptography.base64Decode(encryptedData.encrypted).split(',').map(Number));
                var cryptoKey = await window.crypto.subtle.importKey(
                    'raw',
                    $cryptography.padKey(key, keyLength / 8),
                    { name: algorithm },
                    false,
                    ['decrypt']
                );

                const decrypted = await window.crypto.subtle.decrypt(
                    {
                        name: algorithm,
                        iv: iv
                    },
                    cryptoKey,
                    encrypted
                );

                const decoder = new TextDecoder();
                result = decoder.decode(decrypted);
            }

            return result;
        },

        async sha(message, algorithms) {
            var result = '';
            algorithms = algorithms || 'SHA-1'; // SHA-1,SHA-2,SHA-224,SHA-256,SHA-384,SHA-512,SHA3-224,SHA3-256,SHA3-384,SHA3-512,SHAKE128,SHAKE256
            var encoder = new TextEncoder();
            var data = encoder.encode(message);
            var hash = await crypto.subtle.digest(algorithms, data);
            result = Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return result;
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
    context.$cryptography = syn.$c = $cryptography;
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

        toString(date, format, options) {
            var result = '';
            if ($object.isString(date) == true && $date.isDate(date) == true) {
                date = new Date(date);
            }

            if ($object.isDate(date) == false) {
                return result;
            }

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
                case 'i':
                    result = year.toString().concat('-', month, '-', day, 'T', hours, ':', minutes, ':', seconds, '.', milliseconds);
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
                case 'nt':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = year.toString().concat('년 ', month, '월 ', day, '일 ', '(', dayOfWeek, ')') + ', ' + hours.toString().concat(':', minutes, ':', seconds);
                    break;
                case 'mdn':
                    var dayOfWeek = weekNames[date.getDay()];
                    result = month.toString().concat('월 ', day, '일');
                    break;
                case 'w':
                    options = syn.$w.argumentsExtend({
                        weekStartSunday: true
                    }, options);
                    var weekNumber = 1;
                    var weekOfMonths = $date.weekOfMonth(year, month, options.weekStartSunday);
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
                case 'y':
                    result = year.toString();
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
                    var diff = end - start;
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
                result = $date.toString(date, 'i').indexOf(val) > -1;
            }

            return result;
        },

        weekOfMonth(year, month, weekStartSunday) {
            var result = [];
            weekStartSunday = $object.isNullOrUndefined(weekStartSunday) == true ? true : $string.toBoolean(weekStartSunday);
            month = month || new Date().getMonth() + 1;
            var weekStand = weekStartSunday == true ? 7 : 8;
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
                        if (weekStartSunday == false) {
                            firstDay.setDate(firstDay.getDate() + 1);
                        }
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
        },

        timeAgo(date) {
            if ($date.isISOString(date) == true) {
                var seconds = Math.floor((new Date() - new Date(date)) / 1000);
                var interval = Math.floor(seconds / 31536000);

                if (interval > 1) {
                    return interval + " 년전";
                }
                interval = Math.floor(seconds / 2592000);
                if (interval > 1) {
                    return interval + " 달전";
                }
                interval = Math.floor(seconds / 604800);
                if (interval > 1) {
                    return interval + " 주전";
                }
                interval = Math.floor(seconds / 86400);
                if (interval > 1) {
                    return interval + " 일전";
                }
                interval = Math.floor(seconds / 3600);
                if (interval > 1) {
                    return interval + " 시간전";
                }
                interval = Math.floor(seconds / 60);
                if (interval > 1) {
                    return interval + " 분전";
                }
                return Math.floor(seconds) + " 초전";
            }

            return '';
        }
    });
    context.$date = $date;

    $string.extend({
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
        toHtmlChar(val, charStrings) {
            charStrings = charStrings || `&'<>!"#%()*+,./;=@[\]^\`{|}~`;
            var charMap = {
                '&': '&amp;', '\'': '&apos;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '!': '&excl;', '#': '&num;', '%': '&percnt;',
                '(': '&lpar;', ')': '&rpar;', '*': '&ast;', '+': '&plus;', ',': '&comma;', '.': '&period;', '/': '&sol;', ';': '&semi;',
                '=': '&equals;', '@': '&commat;', '[': '&lsqb;', '\\': '&bsol;', ']': '&rsqb;', '^': '&Hat;', '`': '&grave;', '{': '&lcub;',
                '|': '&verbar;', '}': '&rcub;', '~': '&tilde;'
            };
            return val.replace(new RegExp(`[${charStrings.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g'), char => charMap[char] || char);
        },

        toCharHtml(val, htmlStrings) {
            htmlStrings = htmlStrings || '&amp|&apos|&lt|&gt|&quot|&excl|&num|&percnt|&lpar|&rpar|&ast|&plus|&comma|&period|&sol|&semi|&equals|&commat|&lsqb|&bsol|&rsqb|&Hat|&grave|&lcub|&verbar|&rcub|&tilde';
            var charMap = {
                '&amp;': '&', '&apos;': '\'', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&excl;': '!', '&num;': '#', '&percnt;': '%',
                '&lpar;': '(', '&rpar;': ')', '&ast;': '*', '&plus;': '+', '&comma;': ',', '&period;': '.', '&sol;': '/', '&semi;': ';',
                '&equals;': '=', '&commat;': '@', '&lsqb;': '[', '&bsol;': '\\', '&rsqb;': ']', '&Hat;': '^', '&grave;': '`', '&lcub;': '{',
                '&verbar;': '|', '&rcub;': '}', '&tilde;': '~'
            };
            return val.replace(/&(\w+);/g, function (match, entity) {
                return charMap[match] || match;
            });
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
            char = char || ',';
            return $string.isNullOrEmpty(val) == true ? [] : val.split(char).filter(p => p);
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

        toUrlObject(url) {
            url = url || '';
            return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function (a, v) {
                return a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1), a;
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
                    case 'numeric':
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
        },

        pad(val, length, fix, isLeft) {
            fix = fix || '0';
            if ($object.isNullOrUndefined(isLeft) == true) {
                isLeft = true;
            }
            else {
                isLeft = $string.toBoolean(isLeft);
            }
            val = val.toString();
            var padding = fix.repeat(Math.max(0, length - val.length));

            return isLeft ? padding + val : val + padding;
        }
    });
    context.$string = $string;

    $array.extend({
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
            else {
                arr.push(val);
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
                    parseParameter = items.find(function (item) { return item.ParameterName == parameterName || item.parameterName == parameterName; });
                }

                if (parseParameter) {
                    if (valueProperty) {
                        result = parseParameter[valueProperty];
                    }
                    else {
                        result = parseParameter.Value || parseParameter.value;
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
        },

        split(value, flag) {
            var result = [];
            if ($object.isNullOrUndefined(value) == false && $object.isString(value) == true) {
                flag = flag || ',';
                result = value.split(flag).map(item => item.trim()).filter(item => item.length > 0);
            }

            return result;
        }
    });
    context.$array = $array;

    $number.extend({
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
                case 'numeric':
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
    }

    $library.extend({
        prefixs: ['webkit', 'moz', 'ms', 'o', ''],

        eventMap: {
            'mousedown': 'touchstart',
            'mouseup': 'touchend',
            'mousemove': 'touchmove'
        },

        events: function () {
            var items = [];

            return {
                items: items,
                add(el, eventName, handler) {
                    var result = false;
                    if (el && eventName && handler) {
                        items.push(arguments);
                        result = true;
                    }

                    return result;
                },
                remove(el, eventName, handler) {
                    var index = -1;
                    if (el && eventName && handler) {
                        index = items.findIndex((item) => { return item[0] == el && item[1] == eventName && item[2] == handler });
                    }
                    else if (el && eventName) {
                        index = items.findIndex((item) => { return item[0] == el && item[1] == eventName });
                    }

                    if (index > -1) {
                        items.splice(index, 1);
                    }

                    return index > -1;
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
        }(),

        concreate($library) {
            if (globalRoot.devicePlatform !== 'node') {
                document.addEventListener('DOMContentLoaded', () => {
                    $library.addEvent(context, 'unload', $library.events.flush);
                });
            }
        },

        guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
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
                var hasEvent = syn.$l.hasEvent(el, type, func);
                if (hasEvent == false) {
                    if (el.addEventListener) {
                        el.addEventListener(type, func, false);
                    }
                    else if (el.attachEvent) {
                        el.attachEvent('on' + type, func);
                    }
                    else {
                        el['on' + type] = el['e' + type + func];
                    }

                    syn.$l.events.add(el, type, func);

                    if ($object.isString(type) == true && type.toLowerCase() === 'resize') {
                        func();
                    }
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

        addLive(query, type, fn) {
            $library.addEvent(document, type, function (evt) {
                var found;
                var targetEL = syn.$w.activeControl(evt);
                while (targetEL && !(found = targetEL.matches(query))) {
                    targetEL = targetEL.parentElement;
                }

                if (found) {
                    fn.call(targetEL, evt);

                    evt.preventDefault();
                    evt.stopPropagation();
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

                syn.$l.events.remove(el, type, func);
            }

            return $library;
        },

        hasEvent(el, type, func) {
            var result = false;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (func && $object.isFunction(func) == true) {
                result = syn.$l.events.items.some(item => (item[0] instanceof context.constructor || item[0] instanceof document.constructor || item[0] == el) && item[1] == type && item[2] == func)
            }
            else {
                result = syn.$l.events.items.some(item => (item[0] instanceof context.constructor || item[0] instanceof document.constructor || item[0] == el) && item[1] == type)
            }
            return result;
        },

        trigger(el, type, value) {
            var result = false;
            var item = null;
            var action = null;
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            for (var i = 0, len = syn.$l.events.items.length; i < len; i++) {
                item = syn.$l.events.items[i];

                if (el instanceof HTMLElement) {
                    if (item[0].id == el.id && item[1] == type) {
                        action = item[2];
                        break;
                    }
                }
                else if (item[0] instanceof context.constructor || item[0] instanceof document.constructor) {
                    if (item[1] == type) {
                        action = item[2];
                        break;
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

        getValue(elID, defaultValue) {
            var result = defaultValue === undefined ? '' : defaultValue;
            var synControls = $this.context.synControls;
            var controlInfo = synControls.find(function (item) {
                return item.id == elID || item.id == `${elID}_hidden`;
            });

            if (controlInfo != null) {
                var controlModule = syn.$w.getControlModule(controlInfo.module);
                if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                    if (controlInfo.type.indexOf('grid') > -1 || controlInfo.type.indexOf('chart') > -1) {
                        var input = {
                            requestType: inputConfig.type,
                            dataFieldID: inputConfig.dataFieldID ? inputConfig.dataFieldID : document.forms.length > 0 ? document.forms[0].getAttribute('syn-datafield') : '',
                            items: {}
                        }

                        if (controlModule.setTransactionBelongID) {
                            controlModule.setTransactionBelongID(synControlConfig.id, input);
                            result = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'List', input.items);
                        }

                    }
                    else {
                        result = controlModule.getValue(controlInfo.id.replace('_hidden', ''));
                    }
                }
            }

            return result;
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
                    if (query.startsWith('//') || query.startsWith('.//')) {
                        var xpathResult = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (xpathResult.snapshotLength > 0) {
                            find = xpathResult.snapshotItem(0);
                        }
                    } else {
                        find = document.querySelector(query);
                    }

                    if (find) {
                        result.push(find);
                    }
                }
            }

            if (result.length <= 1) {
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
                    if (query.startsWith('//') || query.startsWith('.//')) {
                        var xpathResult = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        for (var j = 0; j < xpathResult.snapshotLength; j++) {
                            result.push(xpathResult.snapshotItem(j));
                        }
                    } else {
                        var els = document.querySelectorAll(query);
                        for (var k = 0, length = els.length; k < length; k++) {
                            result.push(els[k]);
                        }
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
            var result = null;
            if (Object.isFrozen(object) == false) {
                var propNames = Object.getOwnPropertyNames(object);
                for (var name of propNames) {
                    if (Object.isFrozen(object[name]) == true) {
                        continue;
                    }

                    var value = object[name];
                    object[name] = value && typeof value === 'object' ? syn.$l.deepFreeze(value) : value;
                }

                result = Object.freeze(object);
            }
            else {
                result = object;
            }

            return result;
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

        async blobToBase64(blob, base64Only) {
            base64Only = $string.toBoolean(base64Only);
            if (globalRoot.devicePlatform === 'node') {
                return new Promise((resolve, reject) => {
                    blob.arrayBuffer()
                        .then(arrayBuffer => {
                            var buffer = Buffer.from(arrayBuffer);
                            var base64Data = buffer.toString('base64');
                            if (base64Only == true) {
                                resolve(base64Data);
                            } else {
                                const mimeType = blob.type || 'application/octet-stream';
                                resolve(`data:${mimeType};base64,${base64Data}`);
                            }
                        })
                        .catch(error => reject(error));
                });
            }
            else {
                return new Promise((resolve, reject) => {
                    var reader = new FileReader();
                    reader.onloadend = () => {
                        if (base64Only == true) {
                            var base64Content = null;
                            var base64Index = reader.result.indexOf(';base64,');
                            if (base64Index > -1) {
                                base64Content = reader.result.substring(base64Index + 8);
                            }
                            resolve(base64Content);
                        } else {
                            resolve(reader.result);
                        }
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(blob);
                });
            }
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
            if (globalRoot.devicePlatform === 'node') {
                if (file.startsWith('http:') == true || file.startsWith('https:') == true) {
                    var response = await fetch(file);
                    var contentType = response.headers.get('Content-Type') || 'application/octet-stream';
                    var arrayBuffer = await response.arrayBuffer();
                    var buffer = Buffer.from(arrayBuffer);
                    var base64Data = buffer.toString('base64');

                    return `data:${contentType};base64,${base64Data}`;
                }
                else {
                    var fs = require('fs').promises;
                    var buffer = await fs.readFile(filePath);
                    var base64Data = buffer.toString('base64');

                    var path = require('path');
                    var extension = path.extname(filePath).toLowerCase();
                    var mimeType = 'application/octet-stream';

                    var mimeTypes = {
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.png': 'image/png',
                        '.gif': 'image/gif',
                        '.pdf': 'application/pdf',
                        '.txt': 'text/plain',
                        '.html': 'text/html',
                        '.json': 'application/json'
                    };

                    if (mimeTypes[extension]) {
                        mimeType = mimeTypes[extension];
                    }

                    return `data:${mimeType};base64,${base64Data}`;
                }
            }
            else {
                return new Promise((resolve, reject) => {
                    var reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            }
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

                if (globalRoot.console) {
                    console.log(`${logLevelText}: ${value}`);
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

        getBasePath(basePath, defaultPath) {
            const path = require('path');
            let entryBasePath = process.cwd();

            if (!basePath) {
                basePath = '';
            } else if (basePath.startsWith('.')) {
                basePath = path.resolve(entryBasePath, basePath);
            } else {
                basePath = path.resolve(basePath);
            }

            if (!basePath && defaultPath) {
                basePath = defaultPath;
            }

            return basePath;
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

                if (globalRoot.console) {
                    console.log(`${logLevelText}: ${value}`);
                }
            }
            else {
                console.log('ModuleID 확인 필요 - {0}'.format(moduleID));
            }

            syn.$l.eventLogCount++;
        }
    });

    context.$library = syn.$l = $library;
    if (globalRoot.devicePlatform === 'node') {
        delete syn.$l.addEvent;
        delete syn.$l.addLive;
        delete syn.$l.removeEvent;
        delete syn.$l.hasEvent;
        delete syn.$l.trigger;
        delete syn.$l.triggerEvent;
        delete syn.$l.addBind;
        delete syn.$l.getValue;
        delete syn.$l.get;
        delete syn.$l.querySelector;
        delete syn.$l.getName;
        delete syn.$l.querySelectorAll;
        delete syn.$l.getElementsById;
        delete syn.$l.getElementsByClassName;
        delete syn.$l.getElementsByTagName;
    }
    else {
        delete syn.$l.getBasePath;
        delete syn.$l.moduleEventLog;
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

        httpFetch(url) {
            return new Proxy({}, {
                get(target, action) {
                    return async function (raw, options) {
                        if (['send'].indexOf(action) == -1) {
                            return Promise.resolve({ error: `${action} 메서드 확인 필요` });
                        }

                        options = syn.$w.argumentsExtend({
                            method: 'GET'
                        }, options);

                        var requestTimeoutID = null;
                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            options.method = options.method || 'POST';

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                if (raw instanceof FormData) {
                                }
                                else {
                                    options.headers.append('Content-Type', options.contentType || 'application/json');
                                }
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

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', options.contentType || 'application/json');
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

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }

                        if (response.ok == true) {
                            var result = null;
                            var contentType = response.headers.get('Content-Type') || '';
                            if (contentType.includes('application/json') == true) {
                                result = await response.json();
                            }
                            else if (contentType.includes('text/') == true) {
                                result = await response.text();
                            }
                            else {
                                result = await response.blob();
                            }
                            return Promise.resolve(result);
                        }
                        else {
                            syn.$l.eventLog('$r.httpFetch', `status: ${response.status}, text: ${await response.text()}`, 'Error');
                        }

                        return Promise.resolve({ error: '요청 정보 확인 필요' });
                    };
                }
            });
        },

        // var result = await syn.$r.httpRequest('GET', '/index');
        httpRequest(method, url, data, callback, options) {
            options = syn.$w.argumentsExtend({
                timeout: 0,
                responseType: 'text'
            }, options);

            if ($object.isNullOrUndefined(data) == true) {
                data = {};
            }

            var xhr = syn.$w.xmlHttp();
            xhr.open(method, url, true);
            xhr.timeout = options.timeout;
            xhr.responseType = options.responseType;
            xhr.setRequestHeader('OffsetMinutes', syn.$w.timezoneOffsetMinutes);

            var formData = null;
            if ($object.isNullOrUndefined(data.body) == false) {
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
            else {
                xhr.setRequestHeader('Content-Type', options.contentType || 'application/json');
            }

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
                                syn.$l.eventLog('$r.httpRequest', 'X-Requested transport error', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$r.httpRequest', 'response status - {0}'.format(xhr.statusText) + xhr.response, 'Error');
                            }
                            return;
                        }

                        if (callback) {
                            callback({
                                status: xhr.status,
                                response: xhr.response
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
                            response: xhr.response
                        });
                    };
                    xhr.onerror = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };

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

        httpDataSubmit(formData, url, callback, options) {
            options = syn.$w.argumentsExtend({
                timeout: 0,
                responseType: 'text'
            }, options);

            var xhr = syn.$w.xmlHttp();
            xhr.open('POST', url, true);
            xhr.timeout = options.timeout;
            xhr.responseType = options.responseType;
            xhr.setRequestHeader('OffsetMinutes', syn.$w.timezoneOffsetMinutes);

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
                                syn.$l.eventLog('$r.httpDataSubmit', 'X-Requested transfort error', 'Fatal');
                            }
                            else {
                                syn.$l.eventLog('$r.httpDataSubmit', 'response status - {0}'.format(xhr.statusText) + xhr.response, 'Error');
                            }
                            return;
                        }

                        if (callback) {
                            callback({
                                status: xhr.status,
                                response: xhr.response
                            });
                        }
                    }
                }
                xhr.send(formData);
            }
            else if (globalThis.Promise) {
                return new Promise(function (resolve) {
                    xhr.onload = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };
                    xhr.onerror = function () {
                        return resolve({
                            status: xhr.status,
                            response: xhr.response
                        });
                    };

                    xhr.send(formData);
                });
            }
            else {
                syn.$l.eventLog('$r.httpDataSubmit', '지원하지 않는 기능. 매개변수 확인 필요', 'Error');
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

            document.cookie = id + '=' + encodeURI(val) + ((expires) ? ';expires=' + expires.toUTCString() : '') + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ((secure) ? ';secure' : '');
            return $request;
        },

        deleteCookie(id, path, domain) {
            if (syn.$r.getCookie(id)) {
                document.cookie = id + '=' + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
            }
            return $request;
        }
    });
    context.$request = syn.$r = $request;
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
        localeID: 'ko-KR',
        cookiePrefixName: 'HandStack',
        timezoneOffsetMinutes: -(new Date().getTimezoneOffset()),
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
            dataType: 'string', // string, bool, number, int, date
            belongID: null,
            controlText: null,
            validators: ['require', 'unique', 'numeric', 'ipaddress', 'email', 'date', 'url'],
            transactConfig: null,
            triggerConfig: null,
            getter: false,
            setter: false,
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
                input.type = 'hidden';
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
                        BusinessPhoneNo: '',
                        BusinessEmail: '',
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
                            if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
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
                            else if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
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
                        else if (el.id && el.tagName.toUpperCase() == 'SELECT' && $string.isNullOrEmpty(el.getAttribute('syn-datafield')) == false) {
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

            var pageFormInit = async () => {
                var mod = context[syn.$w.pageScript];
                if (mod.config && $string.isNullOrEmpty(mod.config.layoutPage) == false) {
                    var masterLayout = await syn.$w.fetchText(mod.config.layoutPage);
                    if (masterLayout) {
                        var parser = new DOMParser();
                        var masterPage = parser.parseFromString(masterLayout, 'text/html');
                        if (masterPage) {
                            document.body.style.visibility = 'hidden';
                            var heads = syn.$l.querySelectorAll('syn-head');
                            for (var i = 0, length = heads.length; i < length; i++) {
                                var head = heads[i];
                                document.head.insertAdjacentHTML('afterbegin', head.innerHTML);
                            }

                            var sections = syn.$l.querySelectorAll('syn-section');
                            for (var i = 0, length = sections.length; i < length; i++) {
                                var section = sections[i];
                                var componentSection = masterPage.querySelector(section.getAttribute('selector'));
                                if (componentSection) {
                                    componentSection.innerHTML = section.innerHTML;
                                }
                            }

                            var bodys = syn.$l.querySelectorAll('syn-body');
                            for (var i = 0, length = bodys.length; i < length; i++) {
                                var body = bodys[i];
                                var position = body.getAttribute('position');
                                if ($string.isNullOrEmpty(position) == false && ['beforebegin', 'afterbegin', 'beforeend', 'afterend'].indexOf(position) > -1) {
                                    masterPage.body.insertAdjacentHTML(position, body.innerHTML);
                                }
                            }

                            document.body.innerHTML = masterPage.body.innerHTML;
                        }
                    }
                }

                if (mod && mod.hook.pageFormInit) {
                    await mod.hook.pageFormInit();
                }

                if (context.domainLibraryLoad) {
                    var isContinue = domainLibraryLoad();
                    if ($object.isNullOrUndefined(isContinue) == false && isContinue === false) {
                        return false;
                    }
                }

                var getTagModule = (tagName) => {
                    var controlModule = null;
                    if (syn.uicontrols) {
                        var controlType = '';
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
                                    controlType = (synControl.getAttribute('type') || 'text').toLowerCase();
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

                    return {
                        module: controlModule,
                        type: controlType
                    };
                }

                var synControlList = [];
                var synControls = document.querySelectorAll('[tag^="syn_"],[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';

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

                        var tagModule = getTagModule(tagName);
                        if (tagModule.module) {
                            tagModule.module.controlLoad(elementID, controlOptions);
                        }
                        else {
                            if ($this.hook.controlLoad) {
                                $this.hook.controlLoad(elementID, controlOptions);
                            }
                        }
                    }
                }

                synControls = document.querySelectorAll('[tag^="syn_"],[syn-datafield],[syn-options],[syn-events]');
                for (var i = 0; i < synControls.length; i++) {
                    var synControl = synControls[i];
                    if (synControl.tagName) {
                        var tagName = synControl.tagName.toUpperCase();
                        var dataField = synControl.getAttribute('syn-datafield');
                        var elementID = synControl.getAttribute('id');
                        var formDataField = synControl.closest('form') ? synControl.closest('form').getAttribute('syn-datafield') : '';

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

                        syn.$l.addEvent(synControl.id, 'focus', function (evt) {
                            $this.context.focusControl = evt.target || evt.currentTarget || evt.srcElement;
                            if ($this.context.focusControl) {
                                $this.context.tabOrderFocusID = $this.context.focusControl.id;
                            }
                            else {
                                $this.context.tabOrderFocusID = null;
                            }
                        });

                        var tagModule = getTagModule(tagName);
                        if (tagModule.module) {
                            if (tagModule.module.addModuleList) {
                                tagModule.module.addModuleList(synControl, synControlList, controlOptions, tagModule.type);
                            }
                        }
                        else {
                            if (elementID && dataField) {
                                synControlList.push({
                                    id: elementID,
                                    formDataFieldID: formDataField,
                                    field: dataField,
                                    module: null,
                                    type: tagModule.type ? tagModule.type : synControl.tagName.toLowerCase()
                                });
                            }
                        }
                    }
                }

                var synEventControls = document.querySelectorAll('[syn-events]');
                for (var i = 0; i < synEventControls.length; i++) {
                    var synControl = synEventControls[i];
                    var elEvents = null;

                    try {
                        elEvents = eval('(' + synControl.getAttribute('syn-events') + ')');
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요 '.format(synControl.id) + error.message, 'Warning');
                    }

                    if (elEvents && $this.event) {
                        var length = elEvents.length;
                        for (var j = 0; j < length; j++) {
                            var elEvent = elEvents[j];

                            var func = $this.event[synControl.id + '_' + elEvent];
                            if (func) {
                                syn.$l.addEvent(synControl.id, elEvent, func);
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
                        var synOptions = el.getAttribute('syn-options') || null;
                        if (synOptions != null) {
                            options = eval('(' + synOptions + ')');
                        }
                    } catch (error) {
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요'.format(synControl.id) + error.message, 'Warning');
                    }

                    if (options && options.transactConfig && options.transactConfig.triggerEvent) {
                        if ($object.isString(options.transactConfig.triggerEvent) == true) {
                            syn.$l.addEvent(elID, options.transactConfig.triggerEvent, function (evt) {
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }

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
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }

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
                            syn.$l.addEvent(elID, options.triggerConfig.triggerEvent, function (evt) {
                                var triggerConfig = null;
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }
                                else {
                                    synOptions = el.parentElement.getAttribute('syn-options') || null;
                                    if (synOptions != null) {
                                        options = eval('(' + synOptions + ')');
                                    }
                                }

                                if (options && options.triggerConfig) {
                                    triggerConfig = options.triggerConfig;
                                }

                                if (triggerConfig) {
                                    syn.$w.triggerAction(triggerConfig);
                                }
                            });
                        }
                        else if ($object.isArray(options.triggerConfig.triggerEvent) == true) {
                            var triggerFunction = function (evt) {
                                var triggerConfig = null;
                                var el = syn.$w.activeControl(evt);
                                var synOptions = el.getAttribute('syn-options') || null;
                                if (synOptions != null) {
                                    options = eval('(' + synOptions + ')');
                                }
                                else {
                                    synOptions = el.parentElement.getAttribute('syn-options') || null;
                                    if (synOptions != null) {
                                        options = eval('(' + synOptions + ')');
                                    }
                                }

                                if (options && options.triggerConfig) {
                                    triggerConfig = options.triggerConfig;
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
                    if ($object.isNullOrUndefined(syn.$w.remainingReadyIntervalID) == false && syn.$w.remainingReadyCount == 0) {
                        clearInterval(syn.$w.remainingReadyIntervalID);
                        syn.$w.remainingReadyIntervalID = null;

                        pageLoad();
                        syn.$w.isPageLoad = true;
                    }
                }, 25);

                setTimeout(function () {
                    if ($object.isNullOrUndefined(syn.$w.remainingReadyIntervalID) == false) {
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
                    moduleID: (globalRoot.devicePlatform == 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID,
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
                    setTimeout(async () => {
                        await pageFormInit();
                    }, 25);
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
                    arguments: [],
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
                    else if (triggerConfig.triggerID && triggerConfig.action) {
                        trigger = $this.event ? $this.event['{0}_{1}'.format(triggerConfig.triggerID, triggerConfig.action)] : null;
                    }

                    if (el && trigger) {
                        el.setAttribute('triggerOptions', JSON.stringify(triggerConfig.params.options));

                        if (triggerConfig.action.indexOf('$') > -1) {
                            $array.addAt(triggerConfig.params.arguments, 0, triggerConfig.triggerID);
                        }

                        triggerResult = trigger.apply(el, triggerConfig.params.arguments);
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, {
                                elID: triggerConfig.triggerID,
                                result: triggerResult
                            });
                        }
                    }
                    else if (triggerConfig.method) {
                        var func = eval(triggerConfig.method);
                        if (typeof func === 'function') {
                            trigger = func;

                            triggerResult = trigger.apply($this, triggerConfig.params.arguments);
                            if ($this.hook.afterTrigger) {
                                $this.hook.afterTrigger(null, triggerConfig.action, {
                                    elID: triggerConfig.triggerID,
                                    result: triggerResult
                                });
                            }
                        }
                    }
                    else {
                        if ($this.hook.afterTrigger) {
                            $this.hook.afterTrigger('{0} trigger 확인 필요'.format(JSON.stringify(triggerConfig)), triggerConfig.action, null);
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

        getControlModule(module) {
            var result = null;
            var currings = module.split('.');
            if (currings.length > 0) {
                for (var i = 0; i < currings.length; i++) {
                    var curring = currings[i];
                    if (result) {
                        result = result[curring];
                    }
                    else {
                        result = context[curring];
                    }
                }
            }
            else {
                result = context[controlInfo.module];
            }

            return result;
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
                                    return item.formDataFieldID == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1 || item.type.indexOf('data') > -1) == false;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el && el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || $string.isNullOrEmpty(synControlConfig.field) == true) {
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
                                    var synControlConfig = synControlList.find(function (item) {
                                        return item.field == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                    });

                                    var controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                        controlModule.setTransactionBelongID(synControlConfig.id, input, transactConfig);
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
                                var synControlConfig = synControlList.find(function (item) {
                                    return item.field == input.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                });

                                var controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                    controlModule.setTransactionBelongID(synControlConfig.id, input, transactConfig);
                                }
                                else {
                                    if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                        for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                            var store = syn.uicontrols.$data.storeList[k];
                                            if (store.storeType == 'Grid' && store.dataSourceID == input.dataFieldID) {
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
                                    return item.formDataFieldID == output.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1 || item.type.indexOf('data') > -1) == false;
                                });

                                if (synControlConfigs && synControlConfigs.length > 0) {
                                    for (var k = 0; k < synControlConfigs.length; k++) {
                                        var synControlConfig = synControlConfigs[k];

                                        var el = syn.$l.get(synControlConfig.id + '_hidden') || syn.$l.get(synControlConfig.id);
                                        var options = el && el.getAttribute('syn-options');
                                        if (options == null) {
                                            continue;
                                        }

                                        var synOptions = null;

                                        try {
                                            synOptions = JSON.parse(options);
                                        } catch (e) {
                                            synOptions = eval('(' + options + ')');
                                        }

                                        if (synOptions == null || $string.isNullOrEmpty(synControlConfig.field) == true) {
                                            continue;
                                        }

                                        output.items[synControlConfig.field] = {
                                            fieldID: synControlConfig.field,
                                            dataType: synOptions.dataType
                                        };

                                        if (outputConfig.clear == true) {
                                            if (synControls && synControls.length > 0) {
                                                var controlInfo = synControls.find(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if ($string.isNullOrEmpty(controlInfo.module) == true) {
                                                    continue;
                                                }

                                                var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
                                                    controlModule.clear(controlInfo.id);
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
                                var synControlConfig = synControlList.find(function (item) {
                                    return item.field == output.dataFieldID && (item.type.indexOf('grid') > -1 || item.type.indexOf('chart') > -1) == true;
                                });

                                var controlModule = $object.isNullOrUndefined(synControlConfig) == true ? null : syn.$w.getControlModule(synControlConfig.module);
                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setTransactionBelongID) {
                                    controlModule.setTransactionBelongID(synControlConfig.id, output);

                                    if (outputConfig.clear == true) {
                                        if (synControls && synControls.length > 0) {
                                            var controlInfo = synControls.find(function (item) {
                                                return item.field == output.dataFieldID;
                                            });

                                            var controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
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
                                            if (synControls && synControls.length > 0) {
                                                var controlInfo = synControls.find(function (item) {
                                                    return item.field == outputConfig.dataFieldID;
                                                });

                                                if ($string.isNullOrEmpty(controlInfo.module) == true) {
                                                    continue;
                                                }

                                                var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.clear) {
                                                    controlModule.clear(controlInfo.id);
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (syn.uicontrols.$data && syn.uicontrols.$data.storeList.length > 0) {
                                            for (var k = 0; k < syn.uicontrols.$data.storeList.length; k++) {
                                                var store = syn.uicontrols.$data.storeList[k];
                                                if (store.storeType == 'Grid' && store.dataSourceID == output.dataFieldID) {
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

                        if ($object.isNullOrUndefined(transactConfig.noProgress) == true) {
                            transactConfig.noProgress = false;
                        }

                        if (syn.$w.progressMessage && $string.toBoolean(transactConfig.noProgress) == false) {
                            syn.$w.progressMessage();
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
            if (syn.$w.progressMessage && directObject && $string.toBoolean(directObject.noProgress) == false) {
                syn.$w.progressMessage();
            }

            directObject.transactionResult = $object.isNullOrUndefined(directObject.transactionResult) == true ? true : directObject.transactionResult === true;
            directObject.systemID = directObject.systemID || (globalRoot.devicePlatform == 'browser' ? $this.config.systemID : '');

            var transactionObject = syn.$w.transactionObject(directObject.functionID, 'Json');

            transactionObject.programID = directObject.programID;
            transactionObject.moduleID = directObject.moduleID || (globalRoot.devicePlatform == 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID;
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

                                    if (controlInfo.type.indexOf('grid') > -1 || controlInfo.type.indexOf('chart') > -1) {
                                        var dataFieldID = inputMapping.dataFieldID;

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = syn.$w.getControlModule(controlInfo.module);

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

                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                    inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'Row', inputMapping.items)[0];
                                                }
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
                                                        var controlModule = syn.$w.getControlModule(controlInfo.module);

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

                                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                            controlValue = controlModule.getValue(controlInfo.id.replace('_hidden', ''), meta);
                                                        }

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
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

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
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
                                        var controlModule = syn.$w.getControlModule(controlInfo.module);

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

                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                            inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'List', inputMapping.items);
                                        }
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

                                        if ($this.hook.outputDataBinding) {
                                            $this.hook.outputDataBinding(functionID, responseFieldID, outputData);
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
                                                            var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), controlValue, meta);
                                                            }
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
                                                    var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                        controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                                    }
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
                                        else if (outputMapping.responseType == 'Chart') {
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
                                                    var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                        controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                                    }
                                                }
                                                else {
                                                    errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                                    result.errorText.push(errorText);
                                                    syn.$l.eventLog('$w.transaction', errorText, 'Error');
                                                }
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
                    syn.$l.eventLog('$w.getterValue', 'functionID "{0}" 확인 필요'.format(functionID), 'Warning');
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

                                    if (controlInfo.type.indexOf('grid') > -1 || controlInfo.type.indexOf('chart') > -1) {
                                        var dataFieldID = inputMapping.dataFieldID;

                                        var controlValue = '';
                                        if (synControls && synControls.length > 0) {
                                            bindingControlInfos = synControls.filter(function (item) {
                                                return item.field == dataFieldID;
                                            });

                                            if (bindingControlInfos.length == 1) {
                                                var controlInfo = bindingControlInfos[0];
                                                var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                    inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'Row', inputMapping.items)[0];
                                                }
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
                                                    var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                    if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                                        controlValue = controlModule.getValue(controlInfo.id.replace('_hidden', ''), meta);
                                                    }

                                                    if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
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

                                                        if ($object.isNullOrUndefined(controlValue) == true && (dataType == 'number' || dataType == 'numeric')) {
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
                                        var controlModule = syn.$w.getControlModule(controlInfo.module);
                                        if ($object.isNullOrUndefined(controlModule) == false && controlModule.getValue) {
                                            inputObjects = controlModule.getValue(controlInfo.id.replace('_hidden', ''), 'List', inputMapping.items);
                                        }
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
                                                var controlModule = syn.$w.getControlModule(controlInfo.module);
                                                if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                    controlModule.setValue(controlInfo.id.replace('_hidden', ''), controlValue, meta);
                                                }
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
                                                    syn.$l.eventLog('$w.setterValue', errorText, 'Error');
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
                                            var controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                            }
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
                                                syn.$l.eventLog('$w.setterValue', errorText, 'Error');
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
                                            var controlModule = syn.$w.getControlModule(controlInfo.module);
                                            if ($object.isNullOrUndefined(controlModule) == false && controlModule.setValue) {
                                                controlModule.setValue(controlInfo.id.replace('_hidden', ''), outputData, outputMapping.items);
                                            }
                                        }
                                        else {
                                            errorText = '"{0}" Chart Output Mapping 확인 필요'.format(dataFieldID);
                                            result.errors.push(errorText);
                                            syn.$l.eventLog('$w.setterValue', errorText, 'Error');
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
                        syn.$l.eventLog('$w.setterValue', errorText, 'Error');

                        return result;
                    }
                }
                else {
                    errorText = '화면 매핑 정의 데이터가 없습니다';
                    result.errors.push(errorText);
                    syn.$l.eventLog('$w.setterValue', errorText, 'Error');

                    return result;
                }
            } catch (error) {
                syn.$l.eventLog('$w.setterValue', error, 'Error');
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

                        var requestTimeoutID = null;
                        if ($object.isNullOrUndefined(raw) == false && $object.isString(raw) == false) {
                            options.method = options.method || 'POST';

                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                if (raw instanceof FormData) {
                                }
                                else {
                                    options.headers.append('Content-Type', options.contentType || 'application/json');
                                }
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

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                body: raw instanceof FormData ? raw : JSON.stringify(raw),
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }
                        else {
                            if ($object.isNullOrUndefined(options.headers) == true) {
                                options.headers = new Headers();
                                options.headers.append('Content-Type', options.contentType || 'application/json');
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

                            if (options.headers.has('OffsetMinutes') == false) {
                                options.headers.append('OffsetMinutes', syn.$w.timezoneOffsetMinutes);
                            }

                            var data = {
                                method: options.method,
                                headers: options.headers,
                                redirect: 'follow'
                            };

                            if ($object.isNullOrUndefined(options.timeout) == false) {
                                var controller = new AbortController();
                                requestTimeoutID = setTimeout(() => controller.abort(), options.timeout);
                                data.signal = controller.signal;
                            }

                            var response = await fetch(url, data);

                            if (requestTimeoutID) {
                                clearTimeout(requestTimeoutID);
                            }
                        }

                        if (response.ok == true) {
                            var result = null;
                            var contentType = response.headers.get('Content-Type') || '';
                            if (contentType.includes('application/json') == true) {
                                result = await response.json();
                            }
                            else if (contentType.includes('text/') == true) {
                                result = await response.text();
                            }
                            else {
                                result = await response.blob();
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

        loadScript(url, scriptID, callback) {
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

            var scriptTag = document.getElementById(resourceID);
            if (scriptTag) {
                callback();
            } else {
                var el = document.createElement('script');
                el.setAttribute('type', 'text/javascript');
                el.setAttribute('id', resourceID);
                if (syn.Config && $string.toBoolean(syn.Config.IsClientCaching) == true) {
                    el.setAttribute('src', url);
                }
                else {
                    el.setAttribute('src', url + (url.indexOf('?') > -1 ? '&' : '?') + 'noCache=' + (new Date()).getTime());
                }

                if (callback && typeof callback === 'function') {
                    el.onload = function () {
                        callback();
                    };
                }

                head.insertBefore(el, head.firstChild);
            }

            return $webform;
        },

        loadStyle(url, styleID, callback) {
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

            var styleTag = document.getElementById('scriptID');
            if (styleTag) {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            } else {
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

                if (callback && typeof callback === 'function') {
                    callback();
                }
            }

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

            moduleName = moduleName.replaceAll('-', '_');

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

                        var isBase64 = function (str) {
                            var result = false;
                            if (str && str.length > 32) {
                                var base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
                                if (base64Regex.test(str.substring(0, 32)) == true) {
                                    result = true;
                                }
                            }
                            return result;
                        }

                        if (isBase64(moduleScript) == true) {
                            var decodeError = null;
                            var decodeScript;
                            try {
                                decodeScript = syn.$c.LZString.decompressFromBase64(moduleScript);
                                if (decodeScript == null) {
                                    decodeError = 'LZString decompress 오류';
                                }
                            } catch {
                                decodeError = 'LZString decompress 오류';
                            }

                            if (decodeError) {
                                try {
                                    decodeScript = syn.$c.base64Decode(moduleScript);
                                    decodeError = null;
                                } catch {
                                    decodeError = 'base64Decode 오류';
                                }
                            }

                            if (decodeError) {
                                syn.$l.eventLog('$w.fetchScript', `${decodeError}, <script src="${moduleUrl}.js"></script> 문법 확인 필요`, 'Error');
                            }
                            else {
                                moduleScript = decodeScript;
                            }
                        }

                        if (moduleScript) {
                            var moduleFunction = "return (function(){var module={};(function(window,module){'use strict';" + moduleScript + ";var $module=new syn.module();$module.extend($" + moduleName + ");module.exports=$module;})(typeof window!=='undefined'?window:{},typeof module!=='undefined'?module:{});return module.exports;})();";
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
                            var moduleText = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
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
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인 필요'.format(moduleUrl), 'Error');
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

            var serviceID = syn.Config.SystemID + syn.Config.Environment.substring(0, 1) + ($string.isNullOrEmpty(syn.Config.LoadModuleID) == true ? '' : syn.Config.LoadModuleID);
            var apiService = null;
            var apiServices = syn.$w.getStorage('apiServices', false);
            if (globalRoot.devicePlatform === 'node') {
                if (apiServices) {
                    apiService = apiServices[serviceID];
                    if (apiService) {
                        if ($object.isNullOrUndefined(apiServices.BearerToken) == true && globalRoot.bearerToken) {
                            apiServices.BearerToken = globalRoot.bearerToken;
                            syn.$w.setStorage('apiServices', apiServices, false);
                        }
                    }
                    else if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (token || globalRoot.bearerToken) {
                            apiServices.BearerToken = token || globalRoot.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }
            else {
                if (apiServices) {
                    apiService = apiServices[serviceID];
                    if (apiService) {
                        if ((apiServices.BearerToken == null || apiServices.BearerToken == undefined) && window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                            syn.$w.setStorage('apiServices', apiServices, false);
                        }
                    }
                    else if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
                else {
                    if (syn.Config.DomainAPIServer != null) {
                        apiService = syn.Config.DomainAPIServer;
                        apiServices = apiServices || {};
                        if (window.bearerToken) {
                            apiServices.BearerToken = window.bearerToken;
                        }
                        apiServices[serviceID] = apiService;
                        syn.$w.setStorage('apiServices', apiServices, false);
                    }
                    else {
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보가 구성되지 확인 필요', 'Error');
                    }
                }
            }

            var apiServices = syn.$w.getStorage('apiServices', false);
            if (apiServices) {
                apiService = apiServices[serviceID];
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
                    ipAddress = await syn.$r.httpFetch(syn.Config.FindClientIPServer || '/checkip').send(null, {
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
                    apiService.GlobalID = await syn.$r.httpFetch(syn.Config.FindGlobalIDServer).send({
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
                    accessToken: token || globalRoot.bearerToken || apiServices.BearerToken,
                    action: 'SYN', // "SYN: Request/Response, PSH: Execute/None, ACK: Subscribe",
                    kind: 'BIZ', // "DBG: Debug, BIZ: Business, URG: Urgent, FIN: Finish",
                    clientTag: syn.Config.SystemID.concat('|', syn.Config.HostName, '|', syn.Config.Program.ProgramName, '|', syn.Config.Environment.substring(0, 1)),
                    loadOptions: {
                        encryptionType: syn.Config.Transaction.EncryptionType, // "P:Plain, F:Full, H:Header, B:Body",
                        encryptionKey: syn.Config.Transaction.EncryptionKey, // "P:프로그램, K:KMS 서버, G:GlobalID 키",
                        platform: globalRoot.devicePlatform == 'browser' ? syn.$b.platform : globalRoot.devicePlatform
                    },
                    requestID: requestID,
                    version: syn.Config.Transaction.ProtocolVersion,
                    environment: syn.Config.Environment.substring(0, 1),
                    system: {
                        programID: config.programID,
                        moduleID: transactionObject.moduleID || (globalRoot.devicePlatform == 'browser' ? globalRoot[syn.$w.pageScript].config.moduleID : undefined) || (globalRoot.devicePlatform == 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID,
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

                if (globalThis.devicePlatform != 'node' && transactionRequest.action == 'PSH') {
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

                    syn.$l.eventLog('$w.executeTransaction', transactionRequest.transaction.globalID, 'Verbose');

                    xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.timeout = syn.Config.TransactionTimeout;
                    xhr.send(JSON.stringify(transactionRequest));
                }
            }
        },

        // syn.$w.pseudoStyle('styGrid1', '.handsontable tbody tr td:nth-of-type(3)', `color: red;text-decoration: underline;font-weight: 600;cursor: pointer;`)
        pseudoStyle(elID, selector, cssText) {
            var head = document.head || (document.getElementsByTagName('head').length == 0 ? null : document.getElementsByTagName('head')[0]);
            if (head) {
                var sheet = document.getElementById(elID) || document.createElement('style');
                if (sheet.id == '') {
                    sheet.id = elID;
                }

                sheet.innerHTML = selector + '{' + cssText + '}';
                head.appendChild(sheet);
            }
        },

        // syn.$w.pseudoStyles('styGrid1', [{selector: '.handsontable tbody tr td:nth-of-type(3)', cssText: `color: red;text-decoration: underline;font-weight: 600;cursor: pointer;`}])
        pseudoStyles(elID, styles) {
            var head = document.head || (document.getElementsByTagName('head').length == 0 ? null : document.getElementsByTagName('head')[0]);
            if (head && $object.isArray(styles) == true && styles.length > 0) {
                var sheet = document.getElementById(elID) || document.createElement('style');
                if (sheet.id == '') {
                    sheet.id = elID;
                }

                var styleTexts = [];
                for (var i = 0, length = styles.length; i < length; i++) {
                    var style = styles[i];

                    styleTexts.push(style.selector + '{' + style.cssText + '}');
                }

                sheet.innerHTML = styleTexts.join('\n');
                head.appendChild(sheet);
            }
        }
    });

    if (syn && !syn.Config) {
        syn.Config = {};
    }

    context.$webform = syn.$w = $webform;
    if (globalRoot.devicePlatform === 'node') {
        var fs = require('fs');
        var path = require('path');

        if (process.env.SYN_CONFIG) {
            syn.Config = JSON.parse(process.env.SYN_CONFIG);
        }
        else {
            var filePath = path.join(process.cwd(), 'node.config.json');
            if (fs.existsSync(filePath) == true) {
                var data = fs.readFileSync(filePath, 'utf8');
                syn.Config = JSON.parse(data);

                process.env.SYN_LogMinimumLevel = syn.Config.LogMinimumLevel || 'trace';
                process.env.SYN_FileLogBasePath = syn.Config.FileLogBasePath || path.join(process.cwd(), '..', 'log', 'function', 'javascript');
                process.env.SYN_LocalStoragePath = syn.Config.LocalStoragePath || path.join(process.cwd(), '..', 'cache', 'function');
            }
            else {
                console.error('Node.js 환경설정 파일이 존재하지 않습니다. 파일경로: {0}'.format(filePath));
            }
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), '..', 'modules', 'dbclient', 'module.json');
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
        delete syn.$w.pseudoStyle;
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

(function (context) {
    'use strict';
    var $print = context.$print || new syn.module();

    $print.extend({
        base64ExcelFile: null,
        reportName: `report-${$date.toString(new Date(), 'd')}.pdf`,
        datetimeFormat: 'yyyy-MM-dd',
        boolTrue: '○',
        boolFalse: '×',
        workitems: [],
        workData: null,
        reportifyServer: '',
        reportifyPath: '/reportify/api/brief',
        reportifyTemplateUrl: '/reportify/api/index/download-template?reportFileID=',
        pageExportScheme: 'export-scheme',
        pageExcelToPdf: 'excel-to-pdf',

        concreate() {
            if (globalRoot.devicePlatform == 'browser') {
                if (!window.PDFObject) {
                    syn.$w.loadScript('/reportify/lib/pdfobject/pdfobject.min.js');
                }

                if (!window.printJS) {
                    syn.$w.loadScript('/reportify/lib/print-js/print.min.js');
                }
            }
            else if (globalRoot.devicePlatform == 'node') {
                $print.reportifyServer = 'http://localhost:8000';
            }
        },

        getReportifyUrl(actionName) {
            return `${$print.reportifyServer}${$print.reportifyPath}/${actionName}`;
        },

        getDocumentTemplateUrl(reportFileID) {
            return `${$print.reportifyServer}${$print.reportifyTemplateUrl}${reportFileID}`;
        },

        formatDate(date, format) {
            const map = {
                yyyy: date.getFullYear(),
                MM: ('0' + (date.getMonth() + 1)).slice(-2),
                dd: ('0' + date.getDate()).slice(-2),
                HH: ('0' + date.getHours()).slice(-2),
                mm: ('0' + date.getMinutes()).slice(-2),
                ss: ('0' + date.getSeconds()).slice(-2)
            };
            return format.replace(/yyyy|MM|dd|HH|mm|ss/gi, matched => map[matched]);
        },

        updateOptions(options) {
            if (options) {
                if ($string.isNullOrEmpty(options.base64ExcelFile) == false) {
                    $print.base64ExcelFile = options.base64ExcelFile;
                }

                if ($string.isNullOrEmpty(options.reportName) == false) {
                    $print.reportName = options.reportName;
                }

                if ($string.isNullOrEmpty(options.datetimeFormat) == false) {
                    $print.datetimeFormat = options.datetimeFormat;
                }

                if ($string.isNullOrEmpty(options.boolTrue) == false) {
                    $print.boolTrue = options.boolTrue;
                }

                if ($string.isNullOrEmpty(options.boolFalse) == false) {
                    $print.boolFalse = options.boolFalse;
                }
            }
        },

        async generate(templateID, excelUrl) {
            var result = {
                templateID: templateID,
                reportName: $print.reportName,
                datetimeFormat: $print.datetimeFormat,
                boolTrue: $print.boolTrue,
                boolFalse: $print.boolFalse,
                workitems: $print.workitems
            };

            if ($string.isNullOrEmpty(excelUrl) == false) {
                if ((excelUrl.startsWith('http:') == true || excelUrl.startsWith('https:') == true) == false) {
                    excelUrl = `${$print.reportifyServer}${excelUrl}`
                }
                $print.base64ExcelFile = await $print.getUrlToBase64(excelUrl);
            }

            if ($string.isNullOrEmpty($print.base64ExcelFile) == false) {
                result.base64ExcelFile = $print.base64ExcelFile;
            }

            for (var i = 0, length = result.workitems.length; i < length; i++) {
                var workitem = result.workitems[i];
                if (workitem.options && $object.isObject(workitem.options) == true) {
                    workitem.options = JSON.stringify(workitem.options);
                }
            }

            return result;
        },

        addWorkItem(document, worksheet, bind, row, col, type, data, overtake, step) {
            if ($object.isNumber(document) == true) {
                if (document || worksheet || bind || row || col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = { document, worksheet, bind, row, col, type, data, step };
                    if (overtake) {
                        workItem.overtake = overtake;
                    }
                    $print.workitems.push(workItem);
                }
            }
            else if ($object.isObject(document) == true) {
                var workObject = document;
                if (!workObject.document || !workObject.worksheet || !workObject.bind || !workObject.row || !workObject.col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = {
                        document: workObject.document,
                        worksheet: workObject.worksheet,
                        bind: workObject.bind,
                        row: workObject.row,
                        col: workObject.col,
                        type: workObject.type,
                        data: workObject.data,
                        step: workObject.step
                    };
                    if (workObject.overtake) {
                        workItem.overtake = workObject.overtake;
                    }
                    $print.workitems.push(workItem);
                }
            }
        },

        addAtWorkItem(document, worksheet, datafield, target, nextDirection) {
            nextDirection = nextDirection || true;

            var index = $print.workitems.findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index === -1) {
                syn.$l.eventLog('addAtWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
                return;
            }

            index = $print.workitems.findIndex(item =>
                item.document === target.document &&
                item.worksheet === target.worksheet &&
                ($string.isNullOrEmpty(target.datafield) == false && item.datafield === target.datafield)
            );

            if (index === -1) {
                syn.$l.eventLog('addAtWorkItem', `datafield: ${target.datafield} 중복 항목 확인 필요`, 'Warning');
                return;
            }

            var newItem = {
                document: target.document,
                worksheet: target.worksheet,
                datafield: target.datafield,
                bind: target.bind,
                row: target.row,
                col: target.col,
                type: target.type,
                data: target.data,
            };

            if (target.overtake) {
                newItem.overtake = target.overtake;
            }

            if ($string.toBoolean(nextDirection) == true) {
                $print.workitems.splice(index + 1, 0, newItem);
            } else {
                $print.workitems.splice(index, 0, newItem);
            }
        },

        removeWorkItem(document, worksheet, datafield) {
            var index = $print.workitems.findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index > -1) {
                $print.workitems.splice(index, 1);
            }
            else {
                syn.$l.eventLog('removeWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
            }
        },

        updateWorkItem(document, worksheet, datafield, updates) {
            var item = $print.workitems.find(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (item) {
                Object.assign(item, updates);
            }
            else {
                syn.$l.eventLog('updateWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
            }
        },

        bindingWorkItems(workItems, dataSource) {
            var reportWorkItems = JSON.parse(JSON.stringify(workItems));
            for (var key in dataSource) {
                var dataItem = dataSource[key];
                if (dataItem) {
                    for (var i = 0, length = reportWorkItems.length; i < length; i++) {
                        var item = reportWorkItems[i];
                        if ($object.isNullOrUndefined(item.bind) == true) {
                            item.bind = 'cell';
                        }

                        if (['cell'].includes(item.bind) == true && dataItem.hasOwnProperty(item.datafield) == true && Array.isArray(dataItem) == false) {
                            var binds = item.bind.split(':');
                            if (binds.length == 1 || (binds.length > 1 && binds[1] == key)) {
                                item.data = dataItem[item.datafield] || '';
                            }
                        }
                        else if (['item', 'list'].includes(item.bind.split(':')[0]) == true && Array.isArray(dataItem) == true) {
                            var binds = item.bind.split(':');
                            if (binds.length == 1 || (binds.length > 1 && binds[1] == key)) {
                                item.data = dataItem.map(dataItem => {
                                    return item.datafield.map(field => dataItem[field] || '');
                                });
                            }
                        }

                        item.bind = item.bind.split(':')[0];
                    }
                }
            }
            $print.workitems = reportWorkItems;
            return reportWorkItems;
        },

        // var workData = syn.$p.transformWorkData(data, ['DETAIL_CONTENTS', 'RESULTS']);
        transformWorkData(jsonData, keys) {
            return jsonData.map(item => {
                return keys.map(key => item[key]);
            });
        },

        // var chunkDatas = splitDataChunks(dataList, 2, 3);
        splitDataChunks(dataList, firstLength, chunkSize) {
            var result = [];

            if (firstLength > 0 && firstLength <= dataList.length) {
                result.push(dataList.slice(0, firstLength));
            }

            for (var i = firstLength, length = dataList.length; i < length; i += chunkSize) {
                result.push(dataList.slice(i, i + chunkSize));
            }

            return result;
        },

        async renderViewer(templateID, el, options) {
            el = $object.isString(el) == true ? syn.$l.get(el) : el;
            if (el) {
                if (parent.syn && parent.syn.$w.progressMessage) {
                    parent.syn.$w.progressMessage();
                }

                options = syn.$w.argumentsExtend({
                    width: '100%',
                    height: '100%',
                    forcePDFJS: true,
                    PDFJS_URL: '/reportify/lib/pdfjs/web/viewer.html',
                    pdfOpenParams: {
                        navpanes: 0,
                        toolbar: 0,
                        statusbar: 0,
                        view: 'FitH'
                    },
                    fallbackLink: '<p>이 브라우저는 인라인 PDF를 지원하지 않습니다. 내용을 확인하려면 PDF를 다운로드하세요. <a href="[url]"> PDF 다운로드 </a> </ p>',
                    excelUrl: '',
                    workData: null
                }, options);

                var payLoad = await $print.generate(templateID, options.excelUrl);
                if (options.workData != null) {
                    payLoad.workData = options.workData;
                }
                var pdfResult = await syn.$r.httpRequest('POST', $print.getReportifyUrl($print.pageExcelToPdf), payLoad, null, { responseType: 'blob' });
                if (pdfResult && pdfResult.status == 200) {
                    var pdfFileUrl = syn.$r.createBlobUrl(pdfResult.response);
                    PDFObject.embed(pdfFileUrl, el, options);
                }

                if (parent.syn && parent.syn.$w.progressMessage) {
                    parent.syn.$w.closeProgress();
                }
            }
        },

        async renderPrint(templateID, options) {
            if (parent.syn && parent.syn.$w.progressMessage) {
                parent.syn.$w.progressMessage();
            }

            options = syn.$w.argumentsExtend({
                excelUrl: '',
                workData: null
            }, options);

            var payLoad = await $print.generate(templateID, options.excelUrl);
            if (options.workData != null) {
                payLoad.workData = options.workData;
            }
            var pdfResult = await syn.$r.httpRequest('POST', $print.getReportifyUrl($print.pageExcelToPdf), payLoad, null, { responseType: 'blob' });
            if (pdfResult && pdfResult.status == 200) {
                var pdfFileUrl = syn.$r.createBlobUrl(pdfResult.response);
                printJS(pdfFileUrl);
            }

            if (parent.syn && parent.syn.$w.progressMessage) {
                parent.syn.$w.closeProgress();
            }
        },

        async getUrlToBase64(url) {
            var result = null;
            var excelResult = await syn.$r.httpFetch(url).send();
            if (excelResult && excelResult.error) {
                return result;
            }
            result = await syn.$l.blobToBase64(excelResult, true);
            return result;
        },

        async getSchemeText(excelUrl, formatted, indent) {
            var result = '';
            var base64ExcelFile = await $print.getUrlToBase64(excelUrl);
            if (base64ExcelFile) {
                var reportifyUrl = $print.getReportifyUrl($print.pageExportScheme);
                var data = {
                    body: {
                        base64ExcelFile: base64ExcelFile,
                        indent: $string.toBoolean(indent),
                        formatted: $string.toBoolean(formatted)
                    }
                };

                var httpResult = await syn.$r.httpRequest('POST', reportifyUrl, data);
                if (httpResult && httpResult.status == 200) {
                    result = httpResult.response;
                    if (window.ClipboardJS) {
                        var tempButton = syn.$l.get('btn-clipboard-text') || document.createElement('button');
                        if (tempButton.id == '') {
                            tempButton.id = 'btn-clipboard-text';
                            tempButton.style.display = 'none';
                        }
                        tempButton.setAttribute('data-clipboard-text', result);
                        document.body.appendChild(tempButton);

                        var clipboard = new ClipboardJS(tempButton);

                        return new Promise((resolve, reject) => {
                            clipboard.on('success', (e) => {
                                clipboard.destroy();
                                document.body.removeChild(tempButton);
                                resolve(true);
                            });

                            clipboard.on('error', (e) => {
                                clipboard.destroy();
                                document.body.removeChild(tempButton);
                                reject(false);
                            });

                            tempButton.click();
                        });
                    }
                }
                else {
                    syn.$l.eventLog('getSchemeText', `작업 항목 요청 오류: ${reportifyUrl}`, 'Error');
                }
            }
            return result;
        },

        requestReportValue(moduleID, dataMapInterface, pdfOption, callback) {
            var defaultPdfOption = {
                REPORT_ID: '',
                COMPANY_NO: '',
                DOCUMENT_FORM_ID: '',
                DOCUMENT_NO: '',
                EMPLOYEE_NO: '',
                PRINT_TYPE: '',
                ENV: 'D'
            };

            if (syn.Config && syn.Config.Environment) {
                defaultPdfOption.ENV = syn.Config.Environment.substring(0, 1);
            }

            pdfOption = syn.$w.argumentsExtend(defaultPdfOption, pdfOption);

            var directObject = {
                programID: 'HDS',
                businessID: 'RPT',
                systemID: 'BP01',
                transactionID: pdfOption.REPORT_ID,
                functionID: 'PD01',
                dataMapInterface: dataMapInterface || 'Row|Form',
                inputObjects: []
            };

            for (var key in pdfOption) {
                directObject.inputObjects.push({ prop: key, val: pdfOption[key] });
            }

            try {
                syn.$w.transactionDirect(directObject, function (response) {
                    var result = {};
                    if (response && response.length > 0) {
                        for (var i = 0; i < response.length; i++) {
                            var item = response[i];
                            result[item.id] = item.value;
                        }
                    }
                    else {
                        syn.$l.moduleEventLog(moduleID, 'requestReportValue', '보고서 요청 오류, directObject: {0}'.format(JSON.stringify(directObject)), 'Error');
                    }

                    callback(null, result);
                });
            } catch (error) {
                callback(error, null);
            }
        }
    });

    context.$print = syn.$p = $print;

    if (globalRoot.devicePlatform === 'node') {
        delete syn.$p.renderViewer;
        delete syn.$p.renderPrint;
        delete syn.$p.getSchemeText;
    }
})(globalRoot);

/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $system = context.$system || new syn.module();

    $system.extend({
        getDataSource(moduleID, dataSourceID, callback) {
            if (!callback) {
                throw new Error('callback 함수 정의 필요');
            }

            try {
                var moduleLibrary = syn.getModuleLibrary(moduleID);
                if (moduleLibrary) {
                    var moduleConfig = moduleLibrary.config;

                    var fs = require('fs');
                    if (fs.existsSync(syn.Config.DataSourceFilePath) == true) {
                        fs.readFile(syn.Config.DataSourceFilePath, function (error, data) {
                            if (error) {
                                callback(error, null);
                            }
                            else {
                                var dbclientJson = JSON.parse(data);
                                var dataSource = dbclientJson.ModuleConfig.DataSource;
                                if ($object.isArray(dataSource) == false) {
                                    if (dataSource.DataSourceID === dataSourceID
                                        && dataSource.ApplicationID === moduleConfig.ApplicationID
                                        && (dataSource.ProjectID.includes('*') || dataSource.ProjectID.split(',').indexOf(moduleConfig.ProjectID) > -1)
                                    ) {
                                        if ($string.toBoolean(dataSource.IsEncryption) == true) {
                                            dataSource.ConnectionString = syn.$s.decryptConnectionString(dataSource);
                                            dataSource.IsEncryption = false;
                                        }

                                        callback(null, {
                                            connectionString: dataSource.ConnectionString,
                                            provider: dataSource.DataProvider
                                        });
                                    }
                                    else {
                                        callback('DataSourceID: {0}, ApplicationID: {1}, ProjectID: {2} 환경 설정 확인 필요'.format(dataSourceID, moduleConfig.ApplicationID, moduleConfig.ProjectID), null);
                                    }
                                }
                                else {
                                    var findDataSource = dataSource.find(function (item) {
                                        return item.DataSourceID == dataSourceID
                                            && item.ApplicationID === moduleConfig.ApplicationID
                                            && (item.ProjectID.includes('*') || item.ProjectID.split(',').indexOf(moduleConfig.ProjectID) > -1);
                                    });
                                    if (findDataSource) {
                                        if ($string.toBoolean(findDataSource.IsEncryption) == true) {
                                            findDataSource.ConnectionString = syn.$s.decryptConnectionString(findDataSource);
                                            findDataSource.IsEncryption = false;
                                        }

                                        callback(null, {
                                            connectionString: findDataSource.ConnectionString,
                                            provider: findDataSource.DataProvider
                                        });
                                    }
                                    else {
                                        callback('DataSourceID: {0}, ApplicationID: {1}, ProjectID: {2} 환경 설정 확인 필요'.format(dataSourceID, moduleConfig.ApplicationID, moduleConfig.ProjectID), null);
                                    }
                                }
                            }
                        });
                    }
                    else {
                        callback('DataSource 설정 파일 경로 확인 필요', null);
                    }
                }
                else {
                    callback('ModuleID 확인 필요', null);
                }
            } catch (error) {
                callback(error, null);
            }
        },

        decryptConnectionString(dataSource) {
            var result = '';
            if (dataSource && dataSource.ConnectionString) {
                try {
                    var values = $string.split(dataSource.ConnectionString, '.');
                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

                    if (syn.$c.sha256(`${encrypt}.${decryptKey}.${hostName}`) === hash) {
                        var processedKey = syn.$c.base64Decode(decryptKey).padEnd(32, '0').substring(0, 32);
                        result = syn.$c.aesDecode(encrypt, processedKey);
                    }
                } catch (exception) {
                    syn.$l.eventLog('decryptConnectionString', `${JSON.stringify(dataSource)} 확인 필요`, 'Error');
                }
            }

            return result;
        },

        getStatement(moduleID, statementID, parameters) {
            var result = null;

            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                try {
                    var featureSQLPath = moduleLibrary.featureSQLPath;

                    if (featureSQLPath && fs.existsSync(featureSQLPath) == true) {
                        var mybatisMapper = require('mybatis-mapper');
                        mybatisMapper.createMapper([featureSQLPath]);
                        mybatisMapper.featureSQLPath = featureSQLPath;
                        result = mybatisMapper.getStatement('feature', statementID, parameters);
                    }
                    else {
                        syn.$l.eventLog('getStatement', 'featureSQLPath - {0} 확인 필요'.format(featureSQLPath), 'Error');
                    }
                } catch (error) {
                    syn.$l.eventLog('getStatement', error, 'Error');
                }
            }
            else {
                syn.$l.eventLog('getStatement', 'ModuleID 확인 필요', 'Error');
            }

            return result;
        },

        executeQuery(moduleID, statementID, parameters, callback) {
            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                var moduleConfig = moduleLibrary.config;
                syn.$s.getDataSource(moduleID, moduleConfig.DataSourceID, function (error, dataSource) {
                    if (error) {
                        if (callback) {
                            callback(error, null);
                        }
                    }
                    else {
                        if (dataSource.provider == 'SqlServer') {
                            var db = require('mssql');
                            db.connect(dataSource.connectionString, function (error) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        if (sql == null) {
                                            var message = 'moduleID: {0}, statementID: {1} - 쿼리 매핑 확인 필요'.format(moduleID, statementID);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }

                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.query(sql, function (error, result) {
                                            db.close();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else if (dataSource.provider == 'MySQL') {
                            var mysql = require('mysql');
                            var mysqlConnectionInfos = dataSource.connectionString.split(';');

                            // https://www.npmjs.com/package/mysql
                            // 'mysql://user:pass@host/db?&charset=UTF8_GENERAL_CI&timezone=local&connectTimeout=10000&multipleStatements=true'
                            var mysqlConnectionObject = {
                                host: 'localhost',
                                user: '',
                                password: '',
                                database: '',
                                multipleStatements: true
                            };

                            var length = mysqlConnectionInfos.length;
                            for (var i = 0; i < length; i++) {
                                var item = mysqlConnectionInfos[i];
                                if (item.indexOf('Server=') > -1) {
                                    mysqlConnectionObject.host = item.substring(7);
                                    continue;
                                }

                                if (item.indexOf('Uid=') > -1) {
                                    mysqlConnectionObject.user = item.substring(4);
                                    continue;
                                }

                                if (item.indexOf('Pwd=') > -1) {
                                    mysqlConnectionObject.password = item.substring(4);
                                    continue;
                                }

                                if (item.indexOf('Database=') > -1) {
                                    mysqlConnectionObject.database = item.substring(9);
                                    continue;
                                }

                                if (item.indexOf('Timeout=') > -1) {
                                    mysqlConnectionObject.connectTimeout = item.substring(8);
                                    continue;
                                }
                            }

                            var db = mysql.createConnection(mysqlConnectionObject);
                            db.connect(function (error) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.end();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.end();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.query(sql, function (error, result) {
                                            db.end();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else if (dataSource.provider == 'Oracle') {
                            var oracledb = require('oracledb');
                            var oracledbConnectionInfos = dataSource.connectionString.split(';');

                            // https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
                            // https://oracle.github.io/node-oracledb/INSTALL.html
                            var oracledbConnectionObject = {
                                user: '',
                                password: '',
                                connectString: dataSource.connectionString
                            };

                            var length = oracledbConnectionInfos.length;
                            for (var i = 0; i < length; i++) {
                                var item = oracledbConnectionInfos[i];
                                if (item.indexOf('User Id=') > -1) {
                                    oracledbConnectionObject.user = item.substring(8);
                                    continue;
                                }

                                if (item.indexOf('Password=') > -1) {
                                    oracledbConnectionObject.password = item.substring(9);
                                    continue;
                                }
                            }

                            oracledb.getConnection(oracledbConnectionObject, function (error, db) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.execute(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.execute(sql, function (error, result) {
                                            db.close();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else {
                            callback('데이터 원본 "{0}" 확인 필요'.format(dataSource.provider), null);
                        }
                    }
                });
            }
            else {
                callback('ModuleID 확인 필요', null);
            }
        }
    });
    context.$system = syn.$s = $system;
})(globalRoot);

/// <summary>
/// Node.js 용 exports 기능
/// </summary>
if (globalRoot.devicePlatform === 'node') {
    var fs = require('fs');
    var path = require('path');

    if (typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        globalRoot.localStorage = new LocalStorage(process.env.SYN_LocalStoragePath || '../cache/function');
    }

    var moduleLogDirectory = path.join((process.env.SYN_FileLogBasePath || '../log/function/javascript'), syn.Config.ApplicationID, syn.Config.ProjectID);
    if (fs.existsSync(moduleLogDirectory) == false) {
        fs.mkdirSync(moduleLogDirectory, {
            recursive: true
        });
    }

    if (typeof globalRoot.$logger === 'undefined' || globalRoot.$logger === null) {
        var options = {
            logDirectory: moduleLogDirectory,
            fileNamePattern: '{0}_function_<DATE>.log'.format(syn.Config.ApplicationID),
            dateFormat: 'YYYYMMDD'
        };

        var logger = require('simple-node-logger').createRollingFileLogger(options);
        logger.setLevel((process.env.SYN_LogMinimumLevel || 'trace'));
        globalRoot.$logger = logger;
    }

    if (syn && !syn.initializeModuleScript) {
        syn.initializeModuleScript = function (functionID, moduleFileName) {
            var result = null;
            if (moduleFileName) {
                try {
                    var fileDirectory = path.dirname(moduleFileName);
                    var fileDirectoryName = path.basename(fileDirectory);
                    var moduleID = functionID;

                    var functionModule = syn.functionModules[moduleID];
                    if (functionModule == undefined) {
                        functionModule = {
                            path: fileDirectory,
                            config: eval('(' + fs.readFileSync(moduleFileName.replace('featureMain.js', 'featureMeta.json'), 'utf8') + ')').Header,
                            featureSQLPath: null,
                            logger: null,
                        };

                        var featureSQLPath = path.join(fileDirectory, 'featureSQL.xml');
                        if (fs.existsSync(featureSQLPath) == true) {
                            functionModule.featureSQLPath = featureSQLPath;
                        }

                        var moduleLogDirectory = path.join((process.env.SYN_FileLogBasePath || '../log/function/javascript'), functionModule.config.ApplicationID, functionModule.config.ProjectID, fileDirectoryName);
                        if (fs.existsSync(moduleLogDirectory) == false) {
                            fs.mkdirSync(moduleLogDirectory, {
                                recursive: true
                            });
                        }

                        var options = {
                            logDirectory: moduleLogDirectory,
                            fileNamePattern: '{0}_<DATE>.log'.format(fileDirectoryName),
                            dateFormat: 'YYYYMMDD'
                        };

                        var logger = require('simple-node-logger').createRollingFileLogger(options);
                        logger.setLevel((process.env.SYN_LogMinimumLevel || 'trace'));
                        functionModule.logger = logger;
                        syn.functionModules[moduleID] = functionModule;
                        result = moduleID;
                    }
                    else {
                        result = moduleID;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            else {
                console.log(moduleFileName + ' 모듈 확인 필요');
            }

            return result;
        };
    }

    if (syn && !syn.getModuleLibrary) {
        syn.getModuleLibrary = function (moduleID, moduleFileName) {
            var result = null;
            result = syn.functionModules[moduleID];
            if ($object.isNullOrUndefined(result) == true && moduleFileName) {
                syn.initializeModuleScript(moduleID, moduleFileName);
                result = syn.functionModules[moduleID];
            }

            return result;
        };
    }

    globalRoot.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    syn.functionModules = {};
}
