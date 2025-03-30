/*!
HandStack Javascript Library v2025.3.30
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

                val = (...args) => {
                    const previous = this.base || Module.prototype.base;
                    this.base = ancestor;
                    const returnValue = method.apply(this, args);
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
            let extendFunc = Module.prototype.extend;

            if (!Module.prototyping && typeof this !== 'function') {
                extendFunc = this.extend || extendFunc;
            }

            const prototype = { toSource: null };
            const hidden = ['constructor', 'toString', 'valueOf', 'concreate'];

            hidden.forEach((key, index) => {
                if (!Module.prototyping && index === 0) return;
                if (source[key] !== prototype[key]) {
                    extendFunc.call(this, key, source[key]);
                }
            });

            for (const key in source) {
                if (!prototype[key] && Object.prototype.hasOwnProperty.call(source, key)) {
                    extendFunc.call(this, key, source[key]);
                }
            }

            const concreateFunc = source['concreate'];
            if (concreateFunc) {
                concreateFunc.call(this, source);
            }
        }
        return this;
    }

    base() { }

    static extend(newType, staticType) {
        Module.prototyping = true;
        const prototype = new this();

        prototype.extend(newType);
        prototype.base = () => { };

        delete Module.prototyping;

        const originalConstructor = prototype.constructor;
        const object = prototype.constructor = function (...args) {
            if (!Module.prototyping) {
                if (this.constructing || this.constructor === object) {
                    this.constructing = true;
                    originalConstructor.apply(this, args);
                    delete this.constructing;
                } else if (args[0] != null) {
                    return (args[0].extend || Module.prototype.extend).call(args[0], prototype);
                }
            }
        };

        object.ancestor = this;
        object.extend = this.extend;
        object.each = this.each;
        object.implement = this.implement;
        object.prototype = prototype;
        object.toString = this.toString;
        object.valueOf = (type) => (type === 'object' ? object : originalConstructor.valueOf());

        object.extend(staticType);

        if (typeof object.init === 'function') {
            object.init();
        }

        return object;
    }

    static each(elements, func, props) {
        if (typeof func !== 'function' || func.length === 0) {
            return;
        }

        for (const key in elements) {
            if (Object.prototype.hasOwnProperty.call(elements, key) && typeof elements[key] === 'object' && elements[key] !== null) {
                func.apply(elements[key], props);
            }
        }
    }

    static implement(...args) {
        args.forEach(arg => {
            if (typeof arg === 'function') {
                arg(this.prototype);
            } else {
                this.prototype.extend(arg);
            }
        });
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

(function (context) {
    'use strict';
    const $cryptography = context.$cryptography || new syn.module();
    const $l = context.$library;

    const defaultKeyLength = 256;
    const defaultAlgorithm = 'AES-CBC';

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    $cryptography.extend({
        base64Encode(val) {
            if (globalRoot.devicePlatform === 'node') {
                return Buffer.from(val, 'utf8').toString('base64');
            } else {
                try {
                    const bytes = encoder.encode(String(val));
                    return btoa(String.fromCharCode(...bytes));
                } catch (e) {
                    console.error("Base64 encoding failed:", e);
                    return null;
                }
            }
        },

        base64Decode(val) {
            if (globalRoot.devicePlatform === 'node') {
                return Buffer.from(val, 'base64').toString('utf8');
            } else {
                try {
                    const binaryString = atob(String(val));
                    const bytes = new Uint8Array([...binaryString].map(c => c.charCodeAt(0)));
                    return decoder.decode(bytes);
                } catch (e) {
                    console.error("Base64 decoding failed:", e);
                    return null;
                }
            }
        },

        utf8Encode(plainString) {
            if (typeof plainString !== 'string') {
                throw new TypeError('parameter is not a plain string');
            }
            try {
                return decoder.decode(encoder.encode(plainString));
            } catch (e) {
                console.error("UTF-8 encoding failed:", e);
                return plainString;
            }
        },

        utf8Decode(utf8String) {
            if (typeof utf8String !== 'string') {
                throw new TypeError('parameter is not a utf8 string');
            }
            try {
                return decoder.decode(encoder.encode(utf8String));
            } catch (e) {
                console.warn("UTF-8 decoding failed:", e);
                return utf8String;
            }
        },

        isWebCryptoSupported() {
            return !!(context.crypto?.subtle);
        },

        padKey(key, length) {
            if (typeof key !== 'string') return null;
            
            let encodedKey = encoder.encode(key);

            if (encodedKey.length >= length) {
                return encodedKey.slice(0, length);
            }

            const paddedKey = new Uint8Array(length);
            paddedKey.set(encodedKey);
            return paddedKey;
        },

        async generateHMAC(key, message) {
            if (!this.isWebCryptoSupported()) return null;
            
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(message);

            try {
                const cryptoKey = await crypto.subtle.importKey(
                    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                );
                const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
                return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (error) {
                $l.eventLog('$c.generateHMAC', error, 'Error');
                return null;
            }
        },

        async verifyHMAC(key, message, signature) {
            const generatedSignature = await this.generateHMAC(key, message);
            return generatedSignature === signature;
        },

        async generateRSAKey(hash = "SHA-256", modulusLength = 2048) {
            if (!this.isWebCryptoSupported()) return null;
            try {
                return await crypto.subtle.generateKey(
                    {
                        name: "RSA-OAEP",
                        modulusLength: modulusLength,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: hash
                    },
                    true,
                    ['encrypt', 'decrypt']
                );
            } catch (error) {
                $l.eventLog('$c.generateRSAKey', error, 'Error');
                return null;
            }
        },

        async exportCryptoKey(cryptoKey, isPublic = true) {
            if (!this.isWebCryptoSupported() || !cryptoKey) return '';
            const format = isPublic ? 'spki' : 'pkcs8';
            const typeLabel = isPublic ? 'PUBLIC' : 'PRIVATE';

            try {
                const exported = await crypto.subtle.exportKey(format, cryptoKey);
                const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
                const exportedAsBase64 = btoa(exportedAsString);
                const pemFormatted = exportedAsBase64.match(/.{1,64}/g)?.join('\n') || '';

                return `----- BEGIN ${typeLabel} KEY-----\n${pemFormatted} \n----- END ${typeLabel} KEY----- `;
            } catch (error) {
                $l.eventLog('$c.exportCryptoKey', error, 'Error');
                return '';
            }
        },

        async importCryptoKey(pem, isPublic = true) {
            if (!this.isWebCryptoSupported() || !pem) return null;
            const typeLabel = isPublic ? 'PUBLIC' : 'PRIVATE';
            const pemHeader = `----- BEGIN ${typeLabel} KEY----- `;
            const pemFooter = `----- END ${typeLabel} KEY----- `;

            try {
                const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).replace(/\s+/g, '');
                const binaryDerString = atob(pemContents);
                const binaryDer = new Uint8Array(binaryDerString.length).map((_, i) => binaryDerString.charCodeAt(i));

                const format = isPublic ? 'spki' : 'pkcs8';
                const usage = isPublic ? ['encrypt'] : ['decrypt'];

                return await crypto.subtle.importKey(
                    format,
                    binaryDer.buffer,
                    { name: 'RSA-OAEP', hash: 'SHA-256' },
                    true,
                    usage
                );
            } catch (error) {
                $l.eventLog('$c.importCryptoKey', error, 'Error');
                return null;
            }
        },

        async rsaEncode(text, publicKey) {
            if (!this.isWebCryptoSupported() || !publicKey) return null;
            
            const data = encoder.encode(text);
            try {
                const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
                const base64String = this.base64Encode(String.fromCharCode(...new Uint8Array(encrypted)));
                return base64String;
            } catch (error) {
                $l.eventLog('$c.rsaEncode', error, 'Error');
                return null;
            }
        },

        async rsaDecode(encryptedBase64, privateKey) {
            if (!this.isWebCryptoSupported() || !privateKey || !encryptedBase64) return null;
            try {
                const encryptedString = this.base64Decode(encryptedBase64);
                if (encryptedString === null) throw new Error("Base64 decoding failed");
                const encryptedBuffer = new Uint8Array(encryptedString.length).map((_, i) => encryptedString.charCodeAt(i)).buffer;

                const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedBuffer);
                
                return decoder.decode(decrypted);
            } catch (error) {
                $l.eventLog('$c.rsaDecode', error, 'Error');
                return null;
            }
        },


        generateIV(key, ivLength = 16) {
            if (key && key.toUpperCase() === '$RANDOM$') {
                if (context.crypto?.getRandomValues) {
                    return context.crypto.getRandomValues(new Uint8Array(ivLength));
                } else {
                    console.warn("crypto.getRandomValues not available, using less secure random IV generation.");
                    const randomBytes = new Uint8Array(ivLength);
                    for (let i = 0; i < ivLength; i++) {
                        randomBytes[i] = Math.floor(Math.random() * 256);
                    }
                    return randomBytes;
                }
            }

            return this.padKey(key || '', ivLength);
        },

        async aesEncode(text, key = '', algorithm = defaultAlgorithm, keyLength = defaultKeyLength) {
            if (!this.isWebCryptoSupported()) return null;
            const ivLength = algorithm === 'AES-GCM' ? 12 : 16;
            const iv = this.generateIV(key, ivLength);
            
            const data = encoder.encode(text);
            const paddedKey = this.padKey(key, keyLength / 8);

            try {
                const cryptoKey = await crypto.subtle.importKey(
                    'raw', paddedKey, { name: algorithm }, false, ['encrypt']
                );
                const encrypted = await crypto.subtle.encrypt(
                    { name: algorithm, iv: iv }, cryptoKey, data
                );

                const ivBase64 = this.base64Encode(String.fromCharCode(...iv));
                const encryptedBase64 = this.base64Encode(String.fromCharCode(...new Uint8Array(encrypted)));

                return { iv: ivBase64, encrypted: encryptedBase64 };
            } catch (error) {
                $l.eventLog('$c.aesEncode', error, 'Error');
                return null;
            }
        },

        async aesDecode(encryptedData, key = '', algorithm = defaultAlgorithm, keyLength = defaultKeyLength) {
            if (!this.isWebCryptoSupported() || !encryptedData?.iv || !encryptedData?.encrypted) return null;

            try {
                const ivString = this.base64Decode(encryptedData.iv);
                const encryptedString = this.base64Decode(encryptedData.encrypted);

                if (ivString === null || encryptedString === null) {
                    throw new Error("Base64 decoding failed for IV or encrypted data.");
                }

                const iv = new Uint8Array(ivString.length).map((_, i) => ivString.charCodeAt(i));
                const encrypted = new Uint8Array(encryptedString.length).map((_, i) => encryptedString.charCodeAt(i));


                const paddedKey = this.padKey(key, keyLength / 8);
                const cryptoKey = await crypto.subtle.importKey(
                    'raw', paddedKey, { name: algorithm }, false, ['decrypt']
                );
                const decrypted = await crypto.subtle.decrypt(
                    { name: algorithm, iv: iv }, cryptoKey, encrypted
                );

                
                return decoder.decode(decrypted);
            } catch (error) {
                $l.eventLog('$c.aesDecode', error, 'Error');
                return null;
            }
        },

        async sha(message, algorithm = 'SHA-256') {
            const webCryptoAlgorithm = algorithm.toUpperCase().replace('SHA-2', 'SHA-').replace('SHA3-', 'SHA-');
            if (!this.isWebCryptoSupported()) return '';
            
            const data = encoder.encode(message);
            try {
                const hashBuffer = await crypto.subtle.digest(webCryptoAlgorithm, data);
                return Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            } catch (error) {
                if (error.name === 'OperationError' || error.name === 'SyntaxError') {
                    console.warn(`SHA algorithm '${webCryptoAlgorithm}' not supported by Web Crypto API.Falling back if possible or returning empty.`);
                    return '';
                }
                $l.eventLog('$c.sha', error, 'Error');
                return '';
            }
        },

        sha256(s) {
            const chrsz = 8;
            const hexcase = 0;

            const safe_add = (x, y) => {
                const lsw = (x & 0xFFFF) + (y & 0xFFFF);
                const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            };

            const S = (X, n) => (X >>> n) | (X << (32 - n));
            const R = (X, n) => (X >>> n);
            const Ch = (x, y, z) => ((x & y) ^ ((~x) & z));
            const Maj = (x, y, z) => ((x & y) ^ (x & z) ^ (y & z));
            const Sigma0256 = (x) => (S(x, 2) ^ S(x, 13) ^ S(x, 22));
            const Sigma1256 = (x) => (S(x, 6) ^ S(x, 11) ^ S(x, 25));
            const Gamma0256 = (x) => (S(x, 7) ^ S(x, 18) ^ R(x, 3));
            const Gamma1256 = (x) => (S(x, 17) ^ S(x, 19) ^ R(x, 10));

            const core_sha256 = (m, l) => {
                const K = [
                    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
                    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
                    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
                    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
                    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
                    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
                    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
                    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
                ];
                const HASH = [
                    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
                ];
                const W = new Array(64);
                let a, b, c, d, e, f, g, h, T1, T2;

                m[l >> 5] |= 0x80 << (24 - l % 32);
                m[((l + 64 >> 9) << 4) + 15] = l;

                for (let i = 0; i < m.length; i += 16) {
                    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3];
                    e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];

                    for (let j = 0; j < 64; j++) {
                        if (j < 16) W[j] = m[j + i];
                        else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);

                        T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                        T2 = safe_add(Sigma0256(a), Maj(a, b, c));

                        h = g; g = f; f = e; e = safe_add(d, T1);
                        d = c; c = b; b = a; a = safe_add(T1, T2);
                    }
                    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
                    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
                }
                return HASH;
            };

            const str2binb = (str) => {
                const bin = [];
                const mask = (1 << chrsz) - 1;
                for (let i = 0; i < str.length * chrsz; i += chrsz) {
                    bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
                }
                return bin;
            };

            const binb2hex = (binarray) => {
                const hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
                let str = "";
                for (let i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                        hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
                }
                return str;
            };

            const utf8String = this.utf8Encode(s);
            return binb2hex(core_sha256(str2binb(utf8String), utf8String.length * chrsz));
        },

        encrypt(value, key) {
            if (value === undefined || value === null) return null;

            const keyLength = key ? key.length : 6;
            const effectiveKey = this.sha256(key || '').substring(0, keyLength);

            const encryptFunc = (content, passcode) => {
                const result = [];
                const passLen = passcode.length;
                for (let i = 0; i < content.length; i++) {
                    const passOffset = i % passLen;
                    const calAscii = (content.charCodeAt(i) + passcode.charCodeAt(passOffset));
                    result.push(calAscii);
                }
                return JSON.stringify(result);
            };

            const encryptedContent = encryptFunc(String(value), effectiveKey);
            const combined = `${encryptedContent}.${effectiveKey}`;
            return encodeURIComponent(this.base64Encode(combined));
        },

        decrypt(value, key) {
            if (value === undefined || value === null) return null;

            try {
                const decodedValue = this.base64Decode(decodeURIComponent(value));
                if (!decodedValue || decodedValue.indexOf('.') === -1) return null;

                const [content, passcodeFromFile] = decodedValue.split('.');

                const decryptFunc = (encryptedContent, providedPasscode) => {
                    const keyLength = key ? key.length : 6;
                    const expectedPasscode = this.sha256(key || '').substring(0, keyLength);

                    if (providedPasscode !== expectedPasscode) return '';

                    const codesArr = JSON.parse(encryptedContent);
                    const passLen = providedPasscode.length;
                    let decryptedString = '';
                    for (let i = 0; i < codesArr.length; i++) {
                        const passOffset = i % passLen;
                        const calAscii = (codesArr[i] - providedPasscode.charCodeAt(passOffset));
                        decryptedString += String.fromCharCode(calAscii);
                    }
                    return decryptedString;
                };

                return decryptFunc(content, passcodeFromFile);
            } catch (error) {
                $l.eventLog('$c.decrypt', error, 'Error');
                return null;
            }
        },

        LZString: (function () {
            const f = String.fromCharCode;
            const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
            const baseReverseDic = {};

            function getBaseValue(alphabet, character) {
                if (!baseReverseDic[alphabet]) {
                    baseReverseDic[alphabet] = {};
                    for (let i = 0; i < alphabet.length; i++) {
                        baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                    }
                }
                return baseReverseDic[alphabet][character];
            }

            const LZStringInternal = {
                compressToBase64(input) {
                    if (input == null) return '';
                    let res = LZStringInternal._compress(input, 6, (a) => keyStrBase64.charAt(a));
                    switch (res.length % 4) {
                        case 0: return res;
                        case 1: return res + '===';
                        case 2: return res + '==';
                        case 3: return res + '=';
                    }
                },

                decompressFromBase64(input) {
                    if (input == null) return '';
                    if (input == '') return null;
                    return LZStringInternal._decompress(input.length, 32, (index) => getBaseValue(keyStrBase64, input.charAt(index)));
                },

                compressToUTF16(input) {
                    if (input == null) return '';
                    return LZStringInternal._compress(input, 15, (a) => f(a + 32)) + ' ';
                },

                decompressFromUTF16(compressed) {
                    if (compressed == null) return '';
                    if (compressed == '') return null;
                    return LZStringInternal._decompress(compressed.length, 16384, (index) => compressed.charCodeAt(index) - 32);
                },

                compressToUint8Array(uncompressed) {
                    const compressed = LZStringInternal.compress(uncompressed);
                    const buf = new Uint8Array(compressed.length * 2);

                    for (let i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                        const current_value = compressed.charCodeAt(i);
                        buf[i * 2] = current_value >>> 8;
                        buf[i * 2 + 1] = current_value % 256;
                    }
                    return buf;
                },

                decompressFromUint8Array(compressed) {
                    if (compressed == null) {
                        return LZStringInternal.decompress(null);
                    }
                    if (!compressed?.length) {
                        return LZStringInternal.decompress('');
                    }

                    const buf = new Array(compressed.length / 2);
                    for (let i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                        buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                    }

                    const result = buf.map(c => f(c));
                    return LZStringInternal.decompress(result.join(''));
                },

                compressToEncodedURIComponent(input) {
                    if (input == null) return '';
                    return LZStringInternal._compress(input, 6, (a) => keyStrUriSafe.charAt(a));
                },

                decompressFromEncodedURIComponent(input) {
                    if (input == null) return "";
                    if (input == "") return null;
                    input = input.replace(/ /g, "+");
                    return LZStringInternal._decompress(input.length, 32, (index) => getBaseValue(keyStrUriSafe, input.charAt(index)));
                },

                compress(uncompressed) {
                    return LZStringInternal._compress(uncompressed, 16, (a) => f(a));
                },

                _compress(uncompressed, bitsPerChar, getCharFromInt) {
                    if (uncompressed == null) return '';
                    let i, value,
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

                _decompress(length, resetValue, getNextValue) {
                    const dictionary = [];
                    let enlargeIn = 4,
                        dictSize = 4,
                        numBits = 3,
                        entry = '',
                        result = [],
                        w,
                        bits, resb, maxpower, power,
                        c;
                    const data = { val: getNextValue(0), position: resetValue, index: 1 };

                    for (let i = 0; i < 3; i += 1) {
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

                    switch (bits) {
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
            return LZStringInternal;
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
        interval: Object.freeze({
            year: 31536000000,
            week: 604800000,
            day: 86400000,
            hour: 3600000,
            minute: 60000,
            second: 1000,
        }),

        now() {
            return new Date();
        },

        clone(date) {
            if (date instanceof Date) {
                return new Date(date.getTime());
            } else if ($object.isString(date)) {
                try {
                    return new Date(date);
                } catch {
                    return null;
                }
            }
            return null;
        },

        isBetween(date, start, end) {
            if (!(date instanceof Date && start instanceof Date && end instanceof Date)) return false;
            const time = date.getTime();
            return time >= start.getTime() && time <= end.getTime();
        },

        equals(date, targetDate) {
            return date instanceof Date && targetDate instanceof Date && date.getTime() === targetDate.getTime();
        },

        equalDay(date, targetDate) {
            return date instanceof Date && targetDate instanceof Date && date.toDateString() === targetDate.toDateString();
        },

        isToday(date) {
            return date instanceof Date && this.equalDay(date, new Date());
        },

        toString(date, format, options = {}) {
            let dateObj = date;
            if ($object.isString(date) && this.isDate(date)) {
                dateObj = new Date(date);
            }

            if (!($object.isDate(dateObj) && !isNaN(dateObj))) {
                return '';
            }

            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            const hours = dateObj.getHours();
            const minutes = dateObj.getMinutes();
            const seconds = dateObj.getSeconds();
            const milliseconds = dateObj.getMilliseconds();
            const weekNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayOfWeek = weekNames[dateObj.getDay()];

            const pad = (num, len = 2) => String(num).padStart(len, '0');

            switch (format) {
                case 'd': return `${year}-${pad(month)}-${pad(day)}`;
                case 't': return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'a': return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'i': return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)} Z`; // Assuming UTC for ISO
                case 'f': return `${year}${pad(month)}${pad(day)}${pad(hours)}${pad(minutes)}${pad(seconds)}${pad(milliseconds, 3)}`;
                case 's': return `${pad(hours)}${pad(minutes)}${pad(seconds)}${pad(milliseconds, 3)}`;
                case 'n': return `${year}년 ${pad(month)}월 ${pad(day)} 일(${dayOfWeek})`;
                case 'nt': return `${year}년 ${pad(month)}월 ${pad(day)} 일(${dayOfWeek}), ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                case 'mdn': return `${pad(month)}월 ${pad(day)} 일`;
                case 'w':
                    const opts = { weekStartSunday: true, ...options };
                    const yearNum = dateObj.getFullYear();
                    const monthNum = dateObj.getMonth() + 1;
                    const weeksInMonth = this.weekOfMonth(yearNum, monthNum, opts.weekStartSunday);
                    const currentDateNum = parseInt(`${yearNum}${pad(monthNum)}${pad(day)}`, 10);

                    for (let i = 0; i < weeksInMonth.length; i++) {
                        const week = weeksInMonth[i];
                        const start = parseInt(week.weekStartDate.replace(/-/g, ''), 10);
                        const end = parseInt(week.weekEndDate.replace(/-/g, ''), 10);
                        if (currentDateNum >= start && currentDateNum <= end) {
                            return i + 1;
                        }
                    }
                    return 1;
                case 'wn': return dayOfWeek;
                case 'm': return pad(month);
                case 'y': return String(year);
                case 'ym': return `${year}-${pad(month)}`;
                default: return pad(day);
            }
        },


        addSecond(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.second);
        },

        addMinute(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.minute);
        },

        addHour(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            return new Date(date.getTime() + val * this.interval.hour);
        },

        addDay(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            newDate.setDate(date.getDate() + val);
            return newDate;
        },

        addWeek(date, val) {
            return this.addDay(date, val * 7);
        },

        addMonth(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            const targetMonth = date.getMonth() + val;
            newDate.setMonth(targetMonth);
            if (newDate.getMonth() !== (targetMonth % 12 + 12) % 12) {
                newDate.setDate(0);
            }
            return newDate;
        },

        addYear(date, val) {
            if (!(date instanceof Date) || isNaN(val)) return null;
            const newDate = new Date(date.getTime());
            newDate.setFullYear(date.getFullYear() + val);
            if (date.getMonth() === 1 && date.getDate() === 29 && newDate.getDate() !== 29) {
                newDate.setDate(0);
            }
            return newDate;
        },


        getFirstDate(date) {
            if (!(date instanceof Date)) return null;
            return new Date(date.getFullYear(), date.getMonth(), 1);
        },

        getLastDate(date) {
            if (!(date instanceof Date)) return null;
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        },

        diff(start, end, interval = 'day') {
            if (!(start instanceof Date && end instanceof Date)) return 0;

            if (interval === 'month') {
                return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            } else if (this.interval[interval]) {
                const diffMs = end.getTime() - start.getTime();
                return Math.floor(diffMs / this.interval[interval]);
            }
            return 0;
        },

        toTicks(date) {
            if (!(date instanceof Date)) return 0;
            return date.getTime() * 10000 + 621355968000000000;
        },

        isDate(val) {
            if (val instanceof Date && !isNaN(val)) return true;
            if (!$object.isString(val)) return false;

            const parsedDate = new Date(val);
            if (!isNaN(parsedDate)) return true;

            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                const parts = val.split('-');
                if (parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
                    const specificDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    return !isNaN(specificDate);
                }
            }

            return false;
        },

        isISOString(val) {
            return $object.isString(val) && $validation.regexs.isoDate.test(val);
        },

        weekOfMonth(year, month, weekStartSunday = true) {
            const result = [];
            const normalizedWeekStartSunday = typeof weekStartSunday === 'boolean'
                ? weekStartSunday
                : weekStartSunday === 'true';
            const currentMonth = month || new Date().getMonth() + 1;
            const weekStand = normalizedWeekStartSunday ? 7 : 8;

            const date = new Date(year, currentMonth - 1);
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const numberPad = (num, width) =>
                String(num).padStart(width, '0');

            let firstWeekEndDate = true;
            const thisMonthFirstWeek = firstDay.getDay();

            for (let num = 1; num <= 6; num++) {
                if (lastDay.getMonth() !== firstDay.getMonth()) {
                    break;
                }

                const week = {};
                if (firstDay.getDay() <= 1) {
                    if (firstDay.getDay() === 0 && !normalizedWeekStartSunday) {
                        firstDay.setDate(firstDay.getDate() + 1);
                    }

                    week.weekStartDate = `${firstDay.getFullYear()}-${numberPad(firstDay.getMonth() + 1, 2)}-${numberPad(firstDay.getDate(), 2)}`;
                }

                if (weekStand > thisMonthFirstWeek) {
                    if (firstWeekEndDate) {
                        if (weekStand - firstDay.getDay() === 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        } else if (weekStand - firstDay.getDay() > 1) {
                            firstDay.setDate(firstDay.getDate() + (weekStand - firstDay.getDay()) - 1);
                        }
                        firstWeekEndDate = false;
                    } else {
                        firstDay.setDate(firstDay.getDate() + 6);
                    }
                } else {
                    firstDay.setDate(firstDay.getDate() + (6 - firstDay.getDay()) + weekStand);
                }

                if (week.weekStartDate) {
                    week.weekEndDate = `${firstDay.getFullYear()}-${numberPad(firstDay.getMonth() + 1, 2)}-${numberPad(firstDay.getDate(), 2)}`;
                    result.push(week);
                }

                firstDay.setDate(firstDay.getDate() + 1);
            }

            return result;
        },

        timeAgo(dateInput) {
            let date;
            if ($object.isString(dateInput) && this.isDate(dateInput)) {
                date = new Date(dateInput);
            } else if (dateInput instanceof Date) {
                date = dateInput;
            } else {
                return '';
            }

            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 0) return 'in the future';

            const intervals = [
                { label: '년', seconds: 31536000 },
                { label: '달', seconds: 2592000 },
                { label: '주', seconds: 604800 },
                { label: '일', seconds: 86400 },
                { label: '시간', seconds: 3600 },
                { label: '분', seconds: 60 },
                { label: '초', seconds: 1 }
            ];

            for (const interval of intervals) {
                const count = Math.floor(seconds / interval.seconds);
                if (count >= 1) {
                    return `${count}${interval.label} 전`;
                }
            }
            return '방금 전';
        }

    });
    context.$date = $date;

    $string.extend({
        toValue(value, defaultValue = '') {
            return (value === undefined || value === null) ? String(defaultValue) : String(value);
        },

        br(val) {
            return String(val).replace(/(\r\n|\r|\n)/g, '<br />');
        },

        interpolate(text, json, options = {}) {
            if (json === null || json === undefined || typeof text !== 'string') return text;

            const { defaultValue = null, separator = '\n' } = options;

            const replaceFunc = (template, item) => {
                return template.replace(/#\{([^{}]*)\}/g, (match, key) => {
                    const value = item[key];
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) return value.join(', ');
                        if (value instanceof Date) return $date.toString(value, 'a');
                        return String(value);
                    }
                    return defaultValue !== null ? defaultValue : match;
                });
            };

            if (Array.isArray(json)) {
                return json.map(item => replaceFunc(text, item)).join(separator);
            } else if (typeof json === 'object') {
                return replaceFunc(text, json);
            }

            return text;
        },

        isNullOrEmpty(val) {
            return val === undefined || val === null || String(val).trim() === '';
        },

        sanitizeHTML(val, removeSpecialChars = false) {
            if (typeof val !== 'string') return '';
            let result = val.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/gi, ' ');
            if (removeSpecialChars) {
                result = result.replace(/[.,;:'"!?%#$*_+=\-\\/()[\]{}<>~`“”’]/g, '');
            }
            return result.trim();
        },

        cleanHTML(val) {
            if (typeof val !== 'string' || globalRoot.devicePlatform === 'node') return val;
            try {
                const el = document.createElement('div');
                el.innerHTML = val.replace(/<br\s*\/?>/gi, '\n');
                return el.textContent || el.innerText || '';
            } catch {
                return val;
            }
        },

        toHtmlChar(val, charStrings = `&'<>!"#%()*+,./;=@[\]^\`{|}~`) {
            if (typeof val !== 'string') return '';
            const charMap = {
                '&': '&amp;', '\'': '&#39;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '!': '&#33;', '#': '&#35;', '%': '&#37;',
                '(': '&#40;', ')': '&#41;', '*': '&#42;', '+': '&#43;', ',': '&#44;', '.': '&#46;', '/': '&#47;', ';': '&#59;',
                '=': '&#61;', '@': '&#64;', '[': '&#91;', '\\': '&#92;', ']': '&#93;', '^': '&#94;', '`': '&#96;', '{': '&#123;',
                '|': '&#124;', '}': '&#125;', '~': '&#126;'
            };
            const escapedChars = charStrings.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`[${escapedChars}]`, 'g');
            return val.replace(regex, char => charMap[char] || char);
        },

        toCharHtml(val, escapedChars = '&(amp|#39|lt|gt|quot|#33|#35|#37|#40|#41|#42|#43|#44|#46|#47|#59|#61|#64|#91|#92|#93|#94|#96|#123|#124|#125|#126);') {
            if (typeof val !== 'string') return '';
            const entityMap = {
                '&amp;': '&', '&#39;': '\'', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#33;': '!', '&#35;': '#', '&#37;': '%',
                '&#40;': '(', '&#41;': ')', '&#42;': '*', '&#43;': '+', '&#44;': ',', '&#46;': '.', '&#47;': '/', '&#59;': ';',
                '&#61;': '=', '&#64;': '@', '&#91;': '[', '&#92;': '\\', '&#93;': ']', '&#94;': '^', '&#96;': '`', '&#123;': '{',
                '&#124;': '|', '&#125;': '}', '&#126;': '~'
            };
            const regex = new RegExp(escapedChars, 'g');
            return val.replace(regex, match => entityMap[match] || match);
        },

        length(val) {
            if (typeof val !== 'string') return 0;
            let byteLength = 0;
            for (let i = 0; i < val.length; i++) {
                const charCode = val.charCodeAt(i);
                if (charCode <= 0x7F) {
                    byteLength += 1;
                } else if (charCode <= 0x7FF) {
                    byteLength += 2;
                } else if (charCode <= 0xFFFF) {
                    byteLength += 3;
                } else {
                    byteLength += 4;
                }
            }
            return byteLength;
        },

        split(val, char = ',') {
            return typeof val === 'string' ? val.split(char).filter(p => p.trim() !== '') : [];
        },

        isNumber(num) {
            if (num === null || num === undefined || String(num).trim() === '') return false;
            const regex = /^-?(\d+|\d{1,3}(,\d{3})*)(\.\d+)?$/;
            const strNum = String(num).trim();
            if (regex.test(strNum)) {
                const cleanedNum = strNum.replace(/,/g, '');
                return !isNaN(parseFloat(cleanedNum));
            }
            return false;
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
            return typeof val === 'string'
                ? val.replace(/\b([a-z])/g, match => match.toUpperCase())
                : '';
        },

        toJson(val, options = {}) {
            if (typeof val !== 'string') return [];

            const { delimiter = ',', newline = '\n', meta = {} } = options;
            const lines = val.split(newline);
            if (lines.length < 1) return [];

            const headers = lines[0].split(delimiter).map(header => header.trim().replace(/^"|"$/g, ''));
            const headerLength = headers.length;
            const result = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                const row = line.split(delimiter);
                const item = {};

                for (let j = 0; j < headerLength; j++) {
                    const columnName = headers[j];
                    const cellValue = row[j]?.trim() ?? '';

                    item[columnName] = meta[columnName]
                        ? this.toParseType(cellValue, meta[columnName])
                        : this.toDynamic(cellValue);
                }
                result.push(item);
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

        toDynamic(val, emptyIsNull = false) {
            const strVal = String(val).trim();

            if (emptyIsNull && strVal === '') return null;
            if (strVal === '') return '';

            if (/^(true|y|1)$/i.test(strVal)) return true;
            if (/^(false|n|0)$/i.test(strVal)) return false;

            const numStr = strVal.replace(/,/g, '');
            if ($validation.regexs.float.test(numStr)) {
                const num = parseFloat(numStr);
                if (!isNaN(num)) return num;
            }

            if ($validation.regexs.isoDate.test(strVal)) {
                const date = new Date(strVal);
                if (!isNaN(date)) return date;
            }

            return val;
        },

        toParseType(val, metaType = 'string', emptyIsNull = false) {
            const strVal = String(val).trim();

            if (emptyIsNull && strVal === '') return null;

            switch (String(metaType).toLowerCase()) {
                case 'string':
                    return strVal;
                case 'bool':
                case 'boolean':
                    return this.toBoolean(strVal);
                case 'number':
                case 'numeric':
                case 'int':
                    const numStr = strVal.replace(/,/g, '');
                    if ($validation.regexs.float.test(numStr)) {
                        const num = parseFloat(numStr);
                        return isNaN(num) ? (emptyIsNull ? null : 0) : num;
                    }
                    return emptyIsNull ? null : 0;
                case 'date':
                case 'datetime':
                    if ($validation.regexs.isoDate.test(strVal)) {
                        const date = new Date(strVal);
                        return isNaN(date) ? null : date;
                    } else if ($date.isDate(strVal)) {
                        const date = new Date(strVal);
                        return isNaN(date) ? null : date;
                    }
                    return null;
                default:
                    return strVal;
            }
        },

        toNumberString(val) {
            return typeof val === 'string' ? val.trim().replace(/[^\d.-]/g, '') : '';
        },

        toCurrency(val, localeID, options = {}) {
            const num = this.toNumber(val);
            if (isNaN(num)) return null;

            if (localeID && typeof Intl !== 'undefined' && Intl.NumberFormat) {
                const formatOptions = {
                    style: 'currency',
                    currency: 'KRW',
                    ...options
                };
                try {
                    return new Intl.NumberFormat(localeID, formatOptions).format(num);
                } catch (e) {
                    $l.eventLog('$string.toCurrency', `Intl formatting error for locale ${localeID}: ${e}`, 'Warning');
                }
            }

            const [integerPart, decimalPart] = String(num).split('.');
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
        },


        pad(val, length, fix = '0', isLeft = true) {
            const strVal = String(val);
            const padLength = Math.max(0, length - strVal.length);
            const padding = String(fix).repeat(padLength);
            return $string.toBoolean(isLeft) ? padding + strVal : strVal + padding;
        }

    });
    context.$string = $string;

    $array.extend({
        distinct(arr) {
            return Array.isArray(arr) ? [...new Set(arr)] : [];
        },

        sort(arr, ascending = true) {
            if (!Array.isArray(arr)) return [];
            return [...arr].sort((a, b) => {
                if (a < b) return ascending ? -1 : 1;
                if (a > b) return ascending ? 1 : -1;
                return 0;
            });
        },

        objectSort(arr, prop, ascending = true) {
            if (!Array.isArray(arr) || !prop) return [];
            return [...arr].sort((v1, v2) => {
                const prop1 = v1[prop];
                const prop2 = v2[prop];
                if (prop1 < prop2) return ascending ? -1 : 1;
                if (prop1 > prop2) return ascending ? 1 : -1;
                return 0;
            });
        },

        groupBy(data, predicate) {
            if (!Array.isArray(data)) return {};
            const keySelector = typeof predicate === 'function' ? predicate : (item => item[predicate]);
            return data.reduce((result, value) => {
                const groupKey = keySelector(value);
                (result[groupKey] = result[groupKey] || []).push(value);
                return result;
            }, {});
        },

        shuffle(arr) {
            if (!Array.isArray(arr)) return [];
            const shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        addAt(arr, index, val) {
            if (!Array.isArray(arr)) return [];
            const copy = [...arr];
            const effectiveIndex = Math.max(0, Math.min(index, copy.length));
            copy.splice(effectiveIndex, 0, val);
            return copy;
        },

        removeAt(arr, index) {
            if (!Array.isArray(arr)) return [];
            const copy = [...arr];
            if (index >= 0 && index < copy.length) {
                copy.splice(index, 1);
            }
            return copy;
        },

        contains(arr, val) {
            return Array.isArray(arr) && arr.includes(val);
        },

        merge(arr, brr, predicate = (a, b) => a === b) {
            if (!Array.isArray(arr) || !Array.isArray(brr)) return arr || [];
            const crr = [...arr];
            brr.forEach(bItem => {
                if (!crr.some(cItem => predicate(bItem, cItem))) {
                    crr.push(bItem);
                }
            });
            return crr;
        },

        union(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            return [...new Set([...sourceArray, ...targetArray])];
        },

        difference(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const targetSet = new Set(targetArray);
            return sourceArray.filter(x => !targetSet.has(x));
        },

        intersect(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const targetSet = new Set(targetArray);
            return sourceArray.filter(x => targetSet.has(x));
        },

        symmetryDifference(sourceArray, targetArray) {
            if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return [];
            const sourceSet = new Set(sourceArray);
            const targetSet = new Set(targetArray);
            const diff1 = sourceArray.filter(x => !targetSet.has(x));
            const diff2 = targetArray.filter(x => !sourceSet.has(x));
            return [...diff1, ...diff2];
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
            }

            if (result == null) {
                if (defaultValue === undefined) {
                    result = '';
                }
                else {
                    result = defaultValue;
                }
            }

            return result;
        },

        ranks(values, asc = false) {
            if (!Array.isArray(values)) return [];

            const indexedValues = values.map((value, index) => ({ value: $string.toNumber(value), index }));

            indexedValues.sort((a, b) => asc ? a.value - b.value : b.value - a.value);

            const ranks = new Array(values.length);
            let currentRank = 1;
            for (let i = 0; i < indexedValues.length; i++) {
                if (i > 0 && indexedValues[i].value !== indexedValues[i - 1].value) {
                    currentRank = i + 1;
                }
                ranks[indexedValues[i].index] = currentRank;
            }

            return ranks;
        },

        split(value, flag = ',') {
            if (typeof value !== 'string') return [];
            return value.split(flag).map(item => item.trim()).filter(item => item.length > 0);
        }
    });
    context.$array = $array;

    $number.extend({
        duration(ms) {
            if (typeof ms !== 'number' || isNaN(ms)) return {};
            const absMs = Math.abs(ms);
            const seconds = Math.floor(absMs / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const years = Math.floor(days / 365);
            const weeks = Math.floor((days % 365) / 7);

            return {
                year: years,
                week: weeks,
                day: days,
                hour: hours % 24,
                minute: minutes % 60,
                second: seconds % 60,
                millisecond: absMs % 1000
            };
        },

        toByteString(num, precision = 3, addSpace = true) {
            if (typeof num !== 'number' || isNaN(num)) return `0${addSpace ? ' ' : ''}B`;

            const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const absNum = Math.abs(num);

            if (absNum < 1) return `${num}${addSpace ? ' ' : ''}${units[0]}`;

            const exponent = Math.min(
                Math.floor(Math.log(absNum) / Math.log(1024)),
                units.length - 1
            );

            const scaledNum = absNum / Math.pow(1024, exponent);
            const formattedNum = Number(scaledNum.toPrecision(precision));

            return `${num < 0 ? '-' : ''}${formattedNum}${addSpace ? ' ' : ''}${units[exponent]}`;
        },


        random(start = 0, end = 10) {
            const min = Math.ceil(Math.min(start, end));
            const max = Math.floor(Math.max(start, end));
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        isRange(num, low, high) {
            return typeof num === 'number' && num >= low && num <= high;
        },

        limit(num, low, high) {
            return typeof num === 'number' ? Math.max(low, Math.min(num, high)) : low;
        },

        percent(num, total, precision = 0) {
            if (typeof num !== 'number' || typeof total !== 'number' || total === 0) return 0;
            const factor = Math.pow(10, precision);
            return Math.round((num * 100 / total) * factor) / factor;
        }
    });
    context.$number = $number;

    $object.extend({
        isNullOrUndefined(val) {
            return val === undefined || val === null;
        },

        toCSV(obj, options = {}) {
            if (typeof obj !== 'object' || obj === null) return null;

            const { scopechar = '/', delimiter = ',', newline = '\n' } = options;
            const dataArray = Array.isArray(obj) ? obj : [obj];
            if (dataArray.length === 0) return '';

            const rowsData = [];
            const headersSet = new Set();

            dataArray.forEach(item => {
                const flatRow = {};
                const queue = [[item, '']];

                while (queue.length > 0) {
                    const [currentObj, prefix] = queue.pop();

                    if (currentObj !== null && typeof currentObj === 'object' && !Array.isArray(currentObj) && !(currentObj instanceof Date)) {
                        Object.entries(currentObj).forEach(([key, value]) => {
                            queue.push([value, prefix ? `${prefix}${scopechar}${key}` : key]);
                        });
                    } else {
                        const headerName = prefix || 'value';
                        headersSet.add(headerName);
                        flatRow[headerName] = (Array.isArray(currentObj) || currentObj instanceof Date)
                            ? JSON.stringify(currentObj)
                            : (currentObj ?? '');
                    }
                }
                rowsData.push(flatRow);
            });

            const headersArray = Array.from(headersSet).sort();
            const headerRow = headersArray.join(delimiter);

            const valueRows = rowsData.map(row =>
                headersArray.map(header => {
                    let cellValue = String(row[header] ?? '');
                    if (cellValue.includes(delimiter) || cellValue.includes(newline) || cellValue.includes('"')) {
                        cellValue = `"${cellValue.replace(/"/g, '""')}"`;
                    }
                    return cellValue;
                }).join(delimiter)
            );

            return [headerRow, ...valueRows].join(newline);
        },

        toParameterString(jsonObject) {
            if (!jsonObject || typeof jsonObject !== 'object') return '';
            return Object.entries(jsonObject)
                .map(([key, val]) => `@${key}:${$string.toValue($string.toDynamic(val), '')}`)
                .join(';');
        },

        getType(val) {
            const type = typeof val;
            if (type === 'object') {
                if (val === null) return 'null';
                if (Array.isArray(val)) return 'array';
                if (val instanceof Date) return 'date';
                if (globalRoot.devicePlatform !== 'node' && val instanceof HTMLElement) return 'element';
                return 'object';
            }
            return type;
        },

        defaultValue(type) {
            switch (String(type).toLowerCase()) {
                case 'boolean': return false;
                case 'function': return () => { };
                case 'null': return null;
                case 'number': case 'numeric': case 'int': return 0;
                case 'object': return {};
                case 'date': case 'datetime': return new Date();
                case 'string': return '';
                case 'symbol': return Symbol();
                case 'undefined': return undefined;
                case 'array': return [];
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
            return Array.isArray(val);
        },

        isDate(val) {
            return val instanceof Date && !isNaN(val.getTime());
        },

        isString(val) {
            return typeof val === 'string';
        },

        isNumber(val) {
            return typeof val === 'number' && !isNaN(val);
        },

        isFunction(val) {
            return typeof val === 'function';
        },

        isObject(val) {
            return typeof val === 'object' && val !== null;
        },

        isObjectEmpty(val) {
            return typeof val === 'object' && val !== null && Object.keys(val).length === 0 && val.constructor === Object;
        },

        isBoolean(val) {
            if (typeof val === 'boolean') return true;
            if (val === undefined || val === null) return false;
            const strVal = String(val).toUpperCase();
            return ['TRUE', 'FALSE', 'Y', 'N', '1', '0'].includes(strVal);
        },

        isEmpty(val) {
            if (val === undefined || val === null) return true;
            if (typeof val === 'number' && isNaN(val)) return true;
            if (typeof val === 'string' && val.trim() === '') return true;
            if (Array.isArray(val) && val.length === 0) return true;
            if (typeof val === 'object' && !(val instanceof Date) && Object.keys(val).length === 0 && val.constructor === Object) return true;
            return false;
        },

        clone(val, isNested = true) {
            if (typeof val !== 'object' || val === null) {
                return val;
            }

            if (val instanceof Date) {
                return new Date(val.getTime());
            }

            if (Array.isArray(val)) {
                return isNested ? val.map(item => this.clone(item, true)) : [...val];
            }

            if (val instanceof HTMLElement && typeof val.cloneNode === 'function') {
                return val.cloneNode(isNested);
            }

            if (typeof val === 'object') {
                const clonedObj = Object.create(Object.getPrototypeOf(val));
                if (isNested) {
                    Object.keys(val).forEach(key => {
                        clonedObj[key] = this.clone(val[key], true);
                    });
                } else {
                    Object.assign(clonedObj, val);
                }
                return clonedObj;
            }

            return val;
        },

        extend(to, from, overwrite = true) {
            if (!from || typeof from !== 'object') return to;

            Object.entries(from).forEach(([prop, fromVal]) => {
                const toVal = to[prop];
                const hasProp = Object.prototype.hasOwnProperty.call(to, prop);

                if (this.isObject(fromVal) && fromVal !== null && !this.isDate(fromVal) && !Array.isArray(fromVal) && !(fromVal instanceof HTMLElement)) {
                    if (!hasProp || !this.isObject(toVal)) {
                        to[prop] = {};
                    }
                    this.extend(to[prop], fromVal, overwrite);
                } else if (overwrite || !hasProp) {
                    to[prop] = this.clone(fromVal, false);
                }
            });
            return to;
        }
    });
    context.$object = $object;
})(globalRoot);

(function (context) {
    'use strict';
    const $library = context.$library || new syn.module();
    let doc = null;

    if (globalRoot.devicePlatform !== 'node') {
        doc = context.document;

        if (typeof context.CustomEvent !== 'function') {
            let customEventPolyfill = function (event, params = {}) {
                const evt = doc.createEvent('CustomEvent');
                const { bubbles = false, cancelable = false, detail = undefined } = params;
                evt.initCustomEvent(event, bubbles, cancelable, detail);
                return evt;
            };
            customEventPolyfill.prototype = context.Event.prototype;
            context.CustomEvent = customEventPolyfill;
        }
    }

    const eventRegistry = (() => {
        const items = [];
        return Object.freeze({
            add(el, type, handler, capture = false) {
                if (!el || !type || typeof handler !== 'function') return false;
                if (!items.some(item => item.el === el && item.type === type && item.handler === handler && item.capture === capture)) {
                    items.push({ el, type, handler, capture });
                    return true;
                }
                return false;
            },
            remove(el, type, handler, capture = false) {
                const initialLength = items.length;
                for (let i = items.length - 1; i >= 0; i--) {
                    const item = items[i];
                    if (item.el === el && item.type === type && item.handler === handler && item.capture === capture) {
                        items.splice(i, 1);
                    }
                }
                return items.length < initialLength;
            },
            removeAllForElement(el) {
                for (let i = items.length - 1; i >= 0; i--) {
                    if (items[i].el === el) {
                        items.splice(i, 1);
                    }
                }
            },
            findByArgs(el, type, handler, capture = false) {
                return items.filter(item =>
                    item.el === el &&
                    item.type === type &&
                    item.handler === handler &&
                    item.capture === capture
                );
            },
            findAllByArgs(el, type) {
                return items.filter(item => item.el === el && item.type === type);
            },
            getAll() {
                return [...items];
            },
            flush() {
                this.getAll().forEach(({ el, type, handler, capture }) => {
                    if (el.removeEventListener) {
                        el.removeEventListener(type, handler, capture);
                    }
                });
                items.length = 0;
            }
        });
    })();

    $library.extend({
        prefixs: Object.freeze(['webkit', 'moz', 'ms', 'o', '']),
        eventMap: Object.freeze({
            'mousedown': 'touchstart',
            'mouseup': 'touchend',
            'mousemove': 'touchmove'
        }),

        events: eventRegistry,

        concreate() {
            if (globalRoot.devicePlatform !== 'node') {
                doc.addEventListener('DOMContentLoaded', () => {
                    this.addEvent(context, 'unload', () => this.events.flush());
                }, { once: true });
            }
        },

        guid() {
            if (context.crypto?.randomUUID) {
                return context.crypto.randomUUID();
            }

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        getElement(el) {
            return $object.isString(el) ? this.get(el) : el;
        },

        stringToArrayBuffer(value, isTwoByte = false) {
            const str = String(value);
            const bufferLength = str.length * (isTwoByte ? 2 : 1);
            const buffer = new ArrayBuffer(bufferLength);
            const bufView = isTwoByte ? new Uint16Array(buffer) : new Uint8Array(buffer);
            for (let i = 0; i < str.length; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buffer;
        },

        arrayBufferToString(buffer) {
            if (!(buffer instanceof ArrayBuffer)) return '';

            try {
                if (typeof TextDecoder !== 'undefined') {
                    return new TextDecoder().decode(buffer);
                }

                const uint8Array = new Uint8Array(buffer);
                let binaryString = '';
                for (const byte of uint8Array) {
                    binaryString += String.fromCharCode(byte);
                }

                return binaryString;
            } catch (e) {
                console.error("ArrayBuffer 문자열 변환 실패:", e);
                return '';
            }
        },

        random(len = 8, toLower = false) {
            let result = '';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            if (context.crypto?.getRandomValues) {
                const randomValues = new Uint32Array(len);
                context.crypto.getRandomValues(randomValues);
                for (let i = 0; i < len; i++) {
                    result += chars[randomValues[i] % chars.length];
                }
            } else {
                for (let i = 0; i < len; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            }
            return toLower ? result.toLowerCase() : result.toUpperCase();
        },

        execPrefixFunc(el, funcName) {
            if (!el || !funcName) return undefined;

            for (const prefix of this.prefixs) {
                let methodName = funcName;
                if (prefix) {
                    methodName = prefix + funcName.charAt(0).toUpperCase() + funcName.slice(1);
                } else {
                    methodName = funcName.charAt(0).toLowerCase() + funcName.slice(1);
                }

                if (typeof el[methodName] !== 'undefined') {
                    return typeof el[methodName] === 'function' ? el[methodName]() : el[methodName];
                }
            }
            return undefined;
        },

        dispatchClick(el, options = {}) {
            el = this.getElement(el);
            if (!el || globalRoot.devicePlatform === 'node' || !doc?.createEvent) return;

            try {
                const defaultOptions = {
                    bubbles: true,
                    cancelable: true,
                    view: context,
                    detail: 1,
                    screenX: 0, screenY: 0, clientX: 0, clientY: 0,
                    ctrlKey: false, altKey: false, shiftKey: false, metaKey: false,
                    button: 0,
                    relatedTarget: null,
                    ...options
                };

                const evt = new MouseEvent('click', defaultOptions);
                el.dispatchEvent(evt);

            } catch (error) {
                $l.eventLog('$l.dispatchClick', `클릭 디스패치 오류: ${error}`, 'Warning');
            }
        },

        addEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el || typeof handler !== 'function') return this;

            if (this.events.add(el, type, handler, false)) {
                if (el.addEventListener) {
                    el.addEventListener(type, handler, false);
                }
            }

            if ($object.isString(type) && type.toLowerCase() === 'resize') {
                handler();
            }

            return this;
        },

        addEvents(query, type, handler) {
            if (typeof handler !== 'function') return this;

            let elements = [];
            if ($object.isString(query)) {
                elements = this.querySelectorAll(query);
            } else if (Array.isArray(query)) {
                query.forEach(item => {
                    if ($object.isString(item)) {
                        elements = elements.concat(this.querySelectorAll(item));
                    } else if ($object.isObject(item)) {
                        elements.push(item);
                    }
                });
                elements = [...new Set(elements)];
            } else if ($object.isObject(query)) {
                elements = [query];
            }


            elements.forEach(el => this.addEvent(el, type, handler));

            return this;
        },

        addLive(query, type, handler) {
            if (globalRoot.devicePlatform === 'node') return this;

            this.addEvent(doc, type, (evt) => {
                const targetElement = evt.target.closest(query);
                if (targetElement) {
                    handler.call(targetElement, evt);
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            });
            return this;
        },

        removeEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el || typeof handler !== 'function') return this;

            if (this.events.remove(el, type, handler, false)) {
                if (el.removeEventListener) {
                    el.removeEventListener(type, handler, false);
                }
            }
            return this;
        },

        hasEvent(el, type, handler) {
            el = this.getElement(el);
            if (!el) return false;

            if (typeof handler === 'function') {
                return this.events.findByArgs(el, type, handler, false).length > 0;
            } else {
                return this.events.findAllByArgs(el, type).length > 0;
            }
        },

        trigger(el, type, value) {
            el = this.getElement(el);
            if (!el) return false;

            let triggered = false;
            const handlers = this.events.findAllByArgs(el, type);

            handlers.forEach(({ handler }) => {
                try {
                    handler.call(el, value);
                    triggered = true;
                } catch (e) {
                    $l.eventLog('$l.trigger', `"${type}" 이벤트 핸들러 실행 오류: ${e}`, 'Warning');
                }
            });

            return triggered;
        },

        triggerEvent(el, type, customData) {
            el = this.getElement(el);
            if (!el || globalRoot.devicePlatform === 'node') return this;

            try {
                let event;
                if (typeof context.CustomEvent === 'function') {
                    event = new CustomEvent(type, { detail: customData, bubbles: true, cancelable: true });
                }
                else if (doc.createEvent) {
                    event = doc.createEvent('HTMLEvents');
                    event.initEvent(type, true, true);
                }

                if (event) {
                    el.dispatchEvent(event);
                }
            } catch (error) {
                $l.eventLog('$l.triggerEvent', `"${type}" 이벤트 디스패치 오류: ${error}`, 'Warning');
            }

            return this;
        },

        getValue(elID, defaultValue = '') {
            if (!$this?.context?.synControls) return defaultValue;

            const synControls = $this.context.synControls;
            const controlInfo = synControls.find(item => item.id === elID || item.id === `${elID}_hidden`);

            if (controlInfo?.module) {
                const controlModule = $webform.getControlModule(controlInfo.module);
                if (controlModule?.getValue) {
                    try {
                        return controlModule.getValue(controlInfo.id.replace('_hidden', ''), controlInfo) ?? defaultValue;
                    } catch (e) {
                        $l.eventLog('$l.getValue', `"${elID}" 값 가져오기 오류: ${e}`, 'Warning');
                    }
                }
            } else if (doc) {
                const el = this.get(elID);
                if (el) return el.value ?? defaultValue;
            }

            return defaultValue;
        },

        get(...ids) {
            if (globalRoot.devicePlatform === 'node' || !doc) return ids.length === 1 ? null : [];
            const results = ids.map(id => $object.isString(id) ? doc.getElementById(id) : null).filter(el => el !== null);
            return ids.length === 1 ? results[0] || null : results;
        },

        querySelector(...queries) {
            if (globalRoot.devicePlatform === 'node' || !doc) return queries.length === 1 ? null : [];

            const results = [];
            queries.forEach(query => {
                if ($object.isString(query)) {
                    try {
                        if (query.startsWith('//') || query.startsWith('.//')) {
                            const xpathResult = doc.evaluate(query, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                                results.push(xpathResult.snapshotItem(i));
                            }
                        } else {
                            const el = doc.querySelector(query);
                            if (el) results.push(el);
                        }
                    } catch (e) {
                        $l.eventLog('$l.querySelector', `잘못된 셀렉터 "${query}": ${e}`, 'Warning');
                    }
                }
            });

            return queries.length === 1 ? results[0] || null : results;
        },


        getTagName(...tagNames) {
            if (globalRoot.devicePlatform === 'node' || !doc) return [];
            let results = [];
            tagNames.forEach(tagName => {
                if ($object.isString(tagName)) {
                    results = results.concat(Array.from(doc.getElementsByTagName(tagName)));
                }
            });
            return results;
        },

        querySelectorAll(...queries) {
            if (globalRoot.devicePlatform === 'node' || !doc) return [];
            let results = [];
            queries.forEach(query => {
                if ($object.isString(query)) {
                    try {
                        if (query.startsWith('//') || query.startsWith('.//')) {
                            const xpathResult = doc.evaluate(query, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                                results.push(xpathResult.snapshotItem(i));
                            }
                        } else {
                            results = results.concat(Array.from(doc.querySelectorAll(query)));
                        }
                    } catch (e) {
                        $l.eventLog('$l.querySelectorAll', `잘못된 셀렉터 "${query}": ${e}`, 'Warning');
                    }
                }
            });
            return results;
        },

        toEnumText(enumObject, value) {
            if (!$object.isObject(enumObject)) return null;
            const entry = Object.entries(enumObject).find(([key, val]) => val === value);
            return entry ? entry[0] : null;
        },

        prettyTSD(tsd, isFormat = false) {
            if (typeof tsd !== 'string') return tsd;
            try {
                const parts = tsd.split('＾');
                let jsonData;
                const options = { delimiter: '｜', newline: '↵' };

                if (parts.length > 1) {
                    options.meta = $string.toParameterObject(parts[0]);
                    jsonData = $string.toJson(parts[1], options);
                } else {
                    jsonData = $string.toJson(parts[0], options);
                }

                return $string.toBoolean(isFormat) ? JSON.stringify(jsonData, null, 2) : jsonData;
            } catch (error) {
                $l.eventLog('$l.prettyTSD', `TSD 파싱 오류: ${error}`, 'Error');
                return `TSD 파싱 오류: ${error.message}`;
            }
        },

        text2Json(data, delimiter = ',', newLine = '\n') {
            if (typeof data !== 'string') return [];
            const lines = data.trim().split(newLine);
            if (lines.length < 2) return [];

            const titles = lines[0].split(delimiter).map(t => t.trim());

            return lines.slice(1).map(line => {
                const values = line.split(delimiter);
                return titles.reduce((obj, title, index) => {
                    obj[title] = values[index]?.trim() ?? '';
                    return obj;
                }, {});
            }).filter(obj => Object.keys(obj).length > 0);
        },

        json2Text(arr, columns, delimiter = ',', newLine = '\n') {
            if (!Array.isArray(arr) || !Array.isArray(columns)) return '';

            const headerRow = columns.join(delimiter);

            const valueRows = arr.map(obj =>
                columns.map(key => {
                    let cellValue = obj[key] ?? '';
                    cellValue = String(cellValue);
                    if (cellValue.includes(delimiter) || cellValue.includes(newLine) || cellValue.includes('"')) {
                        cellValue = `"${cellValue.replace(/"/g, '""')}"`;
                    }
                    return cellValue;
                }).join(delimiter)
            );

            return [headerRow, ...valueRows].join(newLine);
        },


        nested2Flat(data, itemID, parentItemID, childrenID = 'items') {
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

        parseNested2Flat(data, newData, itemID, parentItemID, childrenID = 'items') {
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

        flat2Nested(data, itemID, parentItemID, childrenID = 'items') {
            var result = null;

            if (data && itemID && parentItemID) {
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

        parseFlat2Nested(data, root, newData, itemID, parentItemID, childrenID = 'items') {
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

        findNestedByID(data, findID, itemID, childrenID = 'items') {
            if (!data || !itemID) return null;

            const itemsToSearch = Array.isArray(data) ? data : [data];

            for (const item of itemsToSearch) {
                if (item[itemID] == findID) {
                    return item;
                }

                if (Array.isArray(item[childrenID])) {
                    const foundInChildren = this.findNestedByID(item[childrenID], findID, itemID, childrenID);
                    if (foundInChildren) {
                        return foundInChildren;
                    }
                }
            }

            return null;
        },


        deepFreeze(object) {
            if (!object || typeof object !== 'object' || Object.isFrozen(object)) {
                return object;
            }

            Object.getOwnPropertyNames(object).forEach(name => {
                const value = object[name];
                if (typeof value === 'object' && value !== null) {
                    this.deepFreeze(value);
                }
            });

            return Object.freeze(object);
        },

        createBlob(data, type) {
            try {
                return new Blob([data], { type });
            } catch {
                try {
                    const BlobBuilder = context.BlobBuilder || context.WebKitBlobBuilder || context.MozBlobBuilder || context.MSBlobBuilder;
                    if (!BlobBuilder) throw new Error("BlobBuilder가 지원되지 않습니다.");
                    const builder = new BlobBuilder();
                    builder.append(data.buffer || data);
                    return builder.getBlob(type);
                } catch (fallbackError) {
                    $l.eventLog('$l.createBlob', `Blob 생성 실패: ${fallbackError}`, 'Error');
                    return null;
                }
            }
        },

        dataUriToBlob(dataUri) {
            if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;
            try {
                const parts = dataUri.split(',');
                const meta = parts[0].split(':')[1].split(';');
                const mimeType = meta[0];
                const base64 = meta.includes('base64');
                const dataString = base64 ? atob(parts[1]) : decodeURIComponent(parts[1]);

                const byteNumbers = new Array(dataString.length);
                for (let i = 0; i < dataString.length; i++) {
                    byteNumbers[i] = dataString.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                return new Blob([byteArray], { type: mimeType });
            } catch (error) {
                $l.eventLog('$l.dataUriToBlob', `Data URI -> Blob 변환 오류: ${error}`, 'Warning');
                return null;
            }
        },

        dataUriToText(dataUri) {
            if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;
            try {
                const parts = dataUri.split(',');
                const meta = parts[0].split(':')[1].split(';');
                const mimeType = meta[0];
                const base64 = meta.includes('base64');
                const value = base64 ? $cryptography.base64Decode(parts[1]) : decodeURIComponent(parts[1]);

                return { value, mime: mimeType };
            } catch (error) {
                $l.eventLog('$l.dataUriToText', `Data URI -> Text 변환 오류: ${error}`, 'Warning');
                return null;
            }
        },

        blobToDataUri(blob, callback) {
            if (!(blob instanceof Blob) || typeof callback !== 'function') {
                $l.eventLog('$l.blobToDataUri', '잘못된 Blob 또는 콜백 함수가 제공되었습니다.', 'Warning');
                if (callback) callback(new Error("잘못된 입력값"), null);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.error) {
                    $l.eventLog('$l.blobToDataUri', `FileReader 오류: ${reader.error}`, 'Error');
                    callback(reader.error, null);
                } else {
                    callback(null, reader.result);
                }
            };
            reader.onerror = () => {
                const error = reader.error || new Error('알 수 없는 FileReader 오류');
                $l.eventLog('$l.blobToDataUri', `FileReader 오류: ${error}`, 'Error');
                callback(error, null);
            };
            reader.readAsDataURL(blob);
        },


        blobToDownload(blob, fileName) {
            if (globalRoot.devicePlatform === 'node') return;

            if (!(blob instanceof Blob) || !fileName) {
                $l.eventLog('$l.blobToDownload', '잘못된 Blob 또는 파일 이름이 제공되었습니다.', 'Warning');
                return;
            }

            if (context.navigator && context.navigator.msSaveOrOpenBlob) {
                try {
                    context.navigator.msSaveOrOpenBlob(blob, fileName);
                } catch (e) {
                    $l.eventLog('$l.blobToDownload', `msSaveOrOpenBlob 실패: ${e}`, 'Error');
                }
                return;
            }

            let blobUrl = null;
            try {
                blobUrl = URL.createObjectURL(blob);
                const link = doc.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                doc.body.appendChild(link);
                link.click();
                doc.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

            } catch (e) {
                $l.eventLog('$l.blobToDownload', `다운로드 실패: ${e}`, 'Error');
                if (blobUrl) URL.revokeObjectURL(blobUrl);
            }
        },

        blobUrlToBlob(url, callback) {
            if (typeof callback !== 'function') {
                $l.eventLog('$l.blobUrlToBlob', '콜백 함수 확인 필요', 'Warning');
                if (callback) callback(new Error("콜백 함수가 필요합니다."), null);
                return;
            }
            if (!url || typeof url !== 'string') {
                if (callback) callback(new Error("잘못된 URL"), null);
                return;
            }

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP 오류! 상태: ${response.status} ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => callback(null, blob))
                .catch(error => {
                    $l.eventLog('$l.blobUrlToBlob', `url: ${url}, 오류: ${error}`, 'Warning');
                    callback(error, null);
                });
        },

        blobUrlToDataUri(url, callback) {
            if (typeof callback !== 'function') {
                $l.eventLog('$l.blobUrlToDataUri', '콜백 함수 확인 필요', 'Warning');
                if (callback) callback(new Error("콜백 함수가 필요합니다."), null);
                return;
            }
            if (!url || typeof url !== 'string') {
                if (callback) callback(new Error("잘못된 URL"), null);
                return;
            }

            this.blobUrlToBlob(url, (error, blob) => {
                if (error) {
                    callback(error, null);
                    return;
                }
                if (blob) {
                    this.blobToDataUri(blob, callback);
                } else {
                    callback(new Error("URL에서 Blob 가져오기 실패"), null);
                }
            });
        },

        async blobToBase64(blob, base64Only = false) {
            if (!(blob instanceof Blob)) return null;

            if (globalRoot.devicePlatform === 'node' && typeof Buffer !== 'undefined') {
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64Data = buffer.toString('base64');
                    if (base64Only) return base64Data;

                    const mimeType = blob.type || 'application/octet-stream';
                    return `data:${mimeType};base64,${base64Data}`;
                } catch (error) {
                    $l.eventLog('$l.blobToBase64 (Node)', `Blob -> Base64 변환 오류(Node): ${error}`, 'Error');
                    return null;
                }
            } else if (typeof FileReader !== 'undefined') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.error) {
                            reject(reader.error);
                        } else {
                            const dataUrl = reader.result;
                            if (base64Only) {
                                const base64Content = dataUrl.split(';base64,')[1] || null;
                                resolve(base64Content);
                            } else {
                                resolve(dataUrl);
                            }
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(blob);
                });
            } else {
                return null;
            }
        },

        base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
            if (!b64Data || typeof b64Data !== 'string') return null;

            try {
                const byteCharacters = atob(b64Data);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    const slice = byteCharacters.slice(offset, offset + sliceSize);
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    byteArrays.push(new Uint8Array(byteNumbers));
                }

                return new Blob(byteArrays, { type: contentType });
            } catch (e) {
                $l.eventLog('$l.base64ToBlob', `Base64 디코딩 또는 Blob 생성 실패: ${e}`, 'Error');
                return null;
            }
        },

        async blobToFile(blob, fileName, mimeType) {
            if (!(blob instanceof Blob) || !fileName) return null;
            const effectiveMimeType = mimeType || blob.type || 'application/octet-stream';
            return new File([blob], fileName, { type: effectiveMimeType });
        },

        async fileToBase64(file) {
            if (globalRoot.devicePlatform === 'node') {
                const fs = require('fs').promises;
                const path = require('path');
                const fetch = require('node-fetch');

                try {
                    let buffer;
                    let mimeType = 'application/octet-stream';

                    if (typeof file === 'string' && (file.startsWith('http:') || file.startsWith('https:'))) {
                        const response = await fetch(file);
                        if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
                        mimeType = response.headers.get('content-type') || mimeType;
                        buffer = Buffer.from(await response.arrayBuffer());
                    } else if (typeof file === 'string') {
                        const filePath = file;
                        buffer = await fs.readFile(filePath);
                        const extension = path.extname(filePath).toLowerCase();
                        const mimeTypes = {
                            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
                            '.pdf': 'application/pdf', '.txt': 'text/plain', '.html': 'text/html', '.json': 'application/json'
                        };
                        mimeType = mimeTypes[extension] || mimeType;
                    } else {
                        throw new Error("Node.js에서 fileToBase64에 잘못된 입력 유형입니다.");
                    }

                    const base64Data = buffer.toString('base64');
                    return `data:${mimeType};base64,${base64Data}`;

                } catch (error) {
                    $l.eventLog('$l.fileToBase64 (Node)', `파일 -> Base64 변환 오류(Node): ${error}`, 'Error');
                    return null;
                }

            } else if (file instanceof File && typeof FileReader !== 'undefined') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            } else {
                $l.eventLog('$l.fileToBase64', '잘못된 입력 또는 환경입니다.', 'Warning');
                return null;
            }
        },

        async fileToBlob(file) {
            const base64 = await this.fileToBase64(file);
            if (!base64) return null;

            const match = base64.match(/^data:(.+?);base64,(.+)$/);
            if (!match) return null;

            const mimeType = match[1];
            const realData = match[2];

            return this.base64ToBlob(realData, mimeType);
        },

        async resizeImage(blob, maxSize) {
            if (globalRoot.devicePlatform === 'node' || !(blob instanceof Blob) || !blob.type.startsWith('image/')) {
                const errorMsg = globalRoot.devicePlatform === 'node'
                    ? "Node.js 환경에서는 이미지 크기 조정을 지원하지 않습니다."
                    : "잘못된 입력: 이미지 Blob이 아닙니다.";
                $l.eventLog('$l.resizeImage', errorMsg, 'Warning');
                return Promise.reject(new Error(errorMsg));
            }

            const targetSize = (typeof maxSize === 'number' && maxSize > 0) ? maxSize : 80;

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                const image = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                image.onload = () => {
                    let { width, height } = image;

                    if (width > height) {
                        if (width > targetSize) {
                            height = Math.round(height * (targetSize / width));
                            width = targetSize;
                        }
                    } else {
                        if (height > targetSize) {
                            width = Math.round(width * (targetSize / height));
                            height = targetSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(image, 0, 0, width, height);

                    canvas.toBlob(resizedBlob => {
                        if (resizedBlob) {
                            resolve({ blob: resizedBlob, width, height });
                        } else {
                            reject(new Error("캔버스 -> Blob 변환 실패."));
                        }
                    }, 'image/jpeg', 0.9);
                };

                image.onerror = () => reject(new Error("이미지 로드 실패"));
                reader.onload = (e) => image.src = e.target.result;
                reader.onerror = () => reject(new Error("Blob 읽기 실패"));
                reader.readAsDataURL(blob);
            });
        },


        logLevel: Object.freeze({
            Verbose: 0, Debug: 1, Information: 2, Warning: 3, Error: 4, Fatal: 5
        }),

        start: Date.now(),
        eventLogTimer: null,
        eventLogCount: 0,

        eventLog(event, data, logLevelInput = 'Verbose') {
            const message = data instanceof Error ? data.message : String(data);
            const stack = data instanceof Error ? data.stack : undefined;

            let logLevelNum;
            if (typeof logLevelInput === 'string' && this.logLevel.hasOwnProperty(logLevelInput)) {
                logLevelNum = this.logLevel[logLevelInput];
            } else if (typeof logLevelInput === 'number') {
                logLevelNum = logLevelInput;
            } else {
                logLevelNum = this.logLevel.Verbose;
            }

            const configuredLevelName = syn.Config?.UIEventLogLevel || 'Verbose';
            const configuredLevelNum = this.logLevel[configuredLevelName] ?? this.logLevel.Verbose;

            if (logLevelNum < configuredLevelNum) {
                return;
            }

            const logLevelText = this.toEnumText(this.logLevel, logLevelNum) || 'Unknown';
            const diff = (Date.now() - this.start) / 1000;
            const timestamp = diff.toFixed(3);
            const logMessageBase = `${this.eventLogCount}@${timestamp} [${logLevelText}] [${event}]`;
            const logDetails = stack ? `${message}\n${stack}` : message;
            const finalLogMessage = `${logMessageBase} ${logDetails}`;

            if (globalRoot.devicePlatform === 'node' && globalRoot.$logger) {
                const loggerMethod = logLevelText.toLowerCase();
                if (typeof globalRoot.$logger[loggerMethod] === 'function') {
                    globalRoot.$logger[loggerMethod](finalLogMessage);
                } else {
                    globalRoot.$logger.trace(finalLogMessage);
                }
                if (context.console) console.log(finalLogMessage);

            } else if (context.console) {
                switch (logLevelNum) {
                    case this.logLevel.Error:
                    case this.logLevel.Fatal:
                        console.error(finalLogMessage); break;
                    case this.logLevel.Warning:
                        console.warn(finalLogMessage); break;
                    case this.logLevel.Information:
                        console.info(finalLogMessage); break;
                    case this.logLevel.Debug:
                        console.debug(finalLogMessage); break;
                    default: // Verbose
                        console.log(finalLogMessage); break;
                }

                if (syn.Config?.IsDebugMode === true && syn.Config?.Environment === 'Development' && logLevelNum >= this.logLevel.Warning) {
                    debugger;
                }

                if (doc && !context.console) {
                    const div = doc.createElement('div');
                    div.textContent = finalLogMessage;
                    const eventlogs = doc.getElementById('eventlogs');
                    if (eventlogs) {
                        eventlogs.appendChild(div);
                        clearTimeout(this.eventLogTimer);
                        this.eventLogTimer = setTimeout(() => {
                            eventlogs.scrollTop = eventlogs.scrollHeight;
                        }, 10);
                    } else {
                        doc.body?.appendChild(div);
                    }
                }

                if (context.bound?.browserEvent) {
                    try {
                        context.bound.browserEvent('browser', {
                            ID: 'EventLog',
                            Data: finalLogMessage
                        }, (error, json) => {
                            if (error) console.log(`browserEvent EventLog 콜백 오류: ${error}`);
                        });
                    } catch (bridgeError) {
                        console.log(`bound.browserEvent 호출 오류: ${bridgeError}`);
                    }
                }
            }

            this.eventLogCount++;
        },

        getBasePath(basePathInput, defaultPath) {
            if (globalRoot.devicePlatform !== 'node') return basePathInput || defaultPath || '';

            const path = require('path');
            const entryBasePath = process.cwd();
            let resolvedPath = '';

            if (!basePathInput) {
                resolvedPath = defaultPath ? path.resolve(entryBasePath, defaultPath) : entryBasePath;
            } else if (path.isAbsolute(basePathInput)) {
                resolvedPath = basePathInput;
            } else {
                resolvedPath = path.resolve(entryBasePath, basePathInput);
            }

            return resolvedPath;
        },

        moduleEventLog(moduleID, event, data, logLevelInput = 'Verbose') {
            if (globalRoot.devicePlatform !== 'node' || !moduleID) return;

            const message = data instanceof Error ? data.message : String(data);
            const stack = data instanceof Error ? data.stack : undefined;

            let logLevelNum;
            if (typeof logLevelInput === 'string' && this.logLevel.hasOwnProperty(logLevelInput)) {
                logLevelNum = this.logLevel[logLevelInput];
            } else if (typeof logLevelInput === 'number') {
                logLevelNum = logLevelInput;
            } else {
                logLevelNum = this.logLevel.Verbose;
            }


            const configuredLevelName = syn.Config?.UIEventLogLevel || 'Verbose';
            const configuredLevelNum = this.logLevel[configuredLevelName] ?? this.logLevel.Verbose;

            if (logLevelNum < configuredLevelNum) {
                return;
            }

            const logLevelText = this.toEnumText(this.logLevel, logLevelNum) || 'Unknown';
            const diff = (Date.now() - this.start) / 1000;
            const timestamp = diff.toFixed(3);

            const logMessageBase = `${this.eventLogCount}@${timestamp} [${event}]`;
            const logDetails = stack ? `${message}\n${stack}` : message;
            const finalLogMessage = `${logMessageBase} ${logDetails}`;

            const moduleLibrary = syn.getModuleLibrary ? syn.getModuleLibrary(moduleID) : null;
            const logger = moduleLibrary?.logger;

            if (logger) {
                const loggerMethod = logLevelText.toLowerCase();
                if (typeof logger[loggerMethod] === 'function') {
                    logger[loggerMethod](finalLogMessage);
                } else {
                    logger.trace(finalLogMessage);
                }
                if (context.console) console.log(`[${moduleID}] ${logLevelText}: ${finalLogMessage}`);

            } else {
                console.log(`모듈 로거 오류: ModuleID "${moduleID}"에 대한 로거를 찾을 수 없습니다. 메시지: ${finalLogMessage}`);
            }

            this.eventLogCount++;
        }

    });

    if (globalRoot.devicePlatform === 'node') {
        const browserOnlyMethods = [
            'addEvent', 'addEvents', 'addLive', 'removeEvent', 'hasEvent', 'trigger',
            'triggerEvent', 'getValue', 'get', 'querySelector', 'getTagName',
            'querySelectorAll', 'dispatchClick'
        ];
        browserOnlyMethods.forEach(method => { delete $library[method]; });
    } else {
        const nodeOnlyMethods = ['getBasePath', 'moduleEventLog'];
        nodeOnlyMethods.forEach(method => { delete $library[method]; });
    }

    context.$library = syn.$l = $library;
})(globalRoot);

(function (context) {
    'use strict';
    const $request = context.$request || new syn.module();
    let doc = null;
    let currentPath = '';
    let currentHref = '';

    const $s = context.$string;
    const $l = context.$library;
    const $w = context.$webform;

    if (globalRoot.devicePlatform !== 'node') {
        doc = context.document;
        currentPath = context.location?.pathname ?? '';
        currentHref = context.location?.href ?? '';
    }

    $request.extend({
        params: {},
        path: currentPath,

        query(param, url) {
            const targetUrl = url || currentHref;
            if (!this.params[targetUrl]) {
                this.params[targetUrl] = {};
                try {
                    const searchParams = new URL(targetUrl).searchParams;
                    searchParams.forEach((value, key) => {
                        this.params[targetUrl][key] = value;
                    });
                } catch (e) {
                    const queryString = targetUrl.split('?')[1] || '';
                    queryString.split('&').forEach(pair => {
                        const parts = pair.split('=');
                        if (parts.length === 2) {
                            const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
                            const value = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                            if (key) this.params[targetUrl][key] = value;
                        }
                    });
                }
            }
            return this.params[targetUrl][param];
        },

        url() {
            let baseUrl = this.path;
            const currentParams = { ...this.params[currentHref] };

            if (syn.Config?.IsClientCaching === false) {
                currentParams.noCache = Date.now();
            }

            const queryString = this.toQueryString(currentParams, true);
            return encodeURI(baseUrl + queryString);
        },

        toQueryString(jsonObject, includeQuestionMark = false) {
            if (!jsonObject || typeof jsonObject !== 'object') return '';
            const params = new URLSearchParams();
            Object.entries(jsonObject).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    params.append(key, $s.toValue(val, ''));
                }
            });
            const queryString = params.toString();
            if (queryString && includeQuestionMark) {
                return `?${queryString}`;
            }
            return queryString ? `&${queryString}` : '';
        },

        toUrlObject(url) {
            const targetUrl = url || currentHref;
            const params = {};
            try {
                const urlObj = new URL(targetUrl);
                urlObj.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            } catch (e) {
                const queryString = targetUrl.split('?')[1] || '';
                queryString.split('&').forEach(pair => {
                    const parts = pair.split('=');
                    if (parts.length === 2) {
                        const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
                        const value = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                        if (key) params[key] = value;
                    }
                });
            }
            return params;
        },

        async isCorsEnabled(url) {
            if (!url || globalRoot.devicePlatform === 'node') return true;
            try {
                const response = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache', signal: AbortSignal.timeout(2000) });
                const corsOk = response.ok;
                if (!corsOk) {
                    $l.eventLog('$r.isCorsEnabled', `${url}, Status: ${response.status} ${response.statusText}`, 'Warning');
                }
                return corsOk;
            } catch (error) {
                $l.eventLog('$r.isCorsEnabled', `${url}, Error: ${error.message}`, (error.name === 'AbortError' ? 'Warning' : 'Error'));
                return false;
            }
        },

        httpFetch(url) {
            if (!url) return Promise.reject(new Error("URL is required for httpFetch"));

            return {
                send: async (rawData, options = {}) => {
                    const { method = 'GET', timeout, contentType, ...restOptions } = options;
                    const effectiveMethod = (rawData !== null && rawData !== undefined && method === 'GET') ? 'POST' : method;
                    const headers = new Headers(restOptions.headers || {});

                    if (!(rawData instanceof FormData) && !headers.has('Content-Type')) {
                        headers.set('Content-Type', contentType || 'application/json');
                    }

                    if (syn.Environment?.Header) {
                        Object.entries(syn.Environment.Header).forEach(([key, value]) => {
                            if (!headers.has(key)) headers.append(key, value);
                        });
                    }

                    if (!headers.has('OffsetMinutes')) {
                        headers.append('OffsetMinutes', String($w?.timezoneOffsetMinutes ?? -(new Date().getTimezoneOffset())));
                    }

                    const fetchOptions = {
                        method: effectiveMethod,
                        headers: headers,
                        redirect: 'follow',
                        body: (rawData instanceof FormData) ? rawData : (rawData !== null && rawData !== undefined ? JSON.stringify(rawData) : null),
                        ...restOptions
                    };

                    let timeoutId = null;
                    if (typeof timeout === 'number' && timeout > 0) {
                        const controller = new AbortController();
                        fetchOptions.signal = controller.signal;
                        timeoutId = setTimeout(() => controller.abort(), timeout);
                    }

                    try {
                        const response = await fetch(url, fetchOptions);

                        if (timeoutId) clearTimeout(timeoutId);

                        if (!response.ok) {
                            const errorText = await response.text().catch(() => 'Failed to read error response body');
                            const errorMsg = `HTTP error! status: ${response.status}, text: ${errorText}`;
                            $l.eventLog('$r.httpFetch', errorMsg, 'Error');
                            return { error: errorMsg };
                        }

                        const responseContentType = response.headers.get('Content-Type') || '';
                        if (responseContentType.includes('application/json')) {
                            return await response.json();
                        } else if (responseContentType.includes('text/')) {
                            return await response.text();
                        } else {
                            return await response.blob();
                        }

                    } catch (error) {
                        if (timeoutId) clearTimeout(timeoutId);
                        $l.eventLog('$r.httpFetch', `Fetch error: ${error.message}`, 'Error');
                        return { error: `Fetch error: ${error.message}` };
                    }
                }
            };
        },

        httpRequest(method, url, data = {}, callback, options = {}) {
            const { timeout = 0, responseType = 'text', contentType } = options;
            const effectiveMethod = String(method).toUpperCase();
            let requestUrl = url;
            let requestBody = null;
            const headers = {};

            headers['OffsetMinutes'] = String($w?.timezoneOffsetMinutes ?? -(new Date().getTimezoneOffset()));

            if (data && Object.keys(data).length > 0) {
                if (effectiveMethod === 'GET') {
                    const queryString = $r.toQueryString(data, !url.includes('?'));
                    requestUrl += queryString;
                } else {
                    if (data instanceof FormData) {
                        requestBody = data;
                    } else if (typeof data === 'object') {
                        if (contentType === 'application/x-www-form-urlencoded') {
                            requestBody = $r.toQueryString(data, false).substring(1);
                            headers['Content-Type'] = 'application/x-www-form-urlencoded';
                        } else {
                            try {
                                requestBody = JSON.stringify(data);
                                headers['Content-Type'] = contentType || 'application/json';
                            } catch (e) {
                                const errorMsg = 'Failed to stringify data for request body';
                                $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                                if (callback) return callback({ status: -1, response: errorMsg });
                                return Promise.resolve({ status: -1, response: errorMsg });
                            }
                        }
                    } else {
                        requestBody = String(data);
                        headers['Content-Type'] = contentType || 'text/plain';
                    }
                }
            } else if (!headers['Content-Type'] && effectiveMethod !== 'GET' && effectiveMethod !== 'HEAD') {
                headers['Content-Type'] = contentType || 'application/json';
            }

            if (!callback && typeof Promise !== 'undefined') {
                const fetchOptions = {
                    method: effectiveMethod,
                    headers: { ...headers },
                    body: requestBody,
                    signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined
                };
                if ($w?.setServiceClientHeader) {
                    const tempHeaders = new Headers(fetchOptions.headers);
                    if ($w.setServiceClientHeader(tempHeaders) === false) {
                        return Promise.resolve({ status: -1, response: 'ServiceClientHeader check failed' });
                    }
                    fetchOptions.headers = tempHeaders;
                }

                return fetch(requestUrl, fetchOptions)
                    .then(async response => ({
                        status: response.status,
                        response: responseType === 'blob' ? await response.blob()
                            : responseType === 'json' ? await response.json()
                                : await response.text()
                    }))
                    .catch(error => {
                        const errorMsg = error.name === 'AbortError' ? 'Request timed out' : `Fetch error: ${error.message}`;
                        $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                        return { status: -1, response: errorMsg };
                    });
            }

            if (!context.XMLHttpRequest) {
                const errorMsg = 'XMLHttpRequest not supported';
                $l.eventLog('$r.httpRequest', errorMsg, 'Error');
                if (callback) return callback({ status: -1, response: errorMsg });
                return;
            }

            const xhr = new context.XMLHttpRequest();
            xhr.open(effectiveMethod, requestUrl, true);
            xhr.timeout = timeout;
            try {
                xhr.responseType = responseType;
            } catch {
                $l.eventLog('$r.httpRequest', `XHR responseType '${responseType}' not supported`, 'Warning');
            }

            Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));

            if ($w?.setServiceClientHeader && $w.setServiceClientHeader(xhr) === false) {
                if (callback) callback({ status: -1, response: 'ServiceClientHeader check failed' });
                return;
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && callback) {
                    if (xhr.status === 0 && !xhr.response) {
                        $l.eventLog('$r.httpRequest', 'XHR Request failed (Network error or CORS)', 'Fatal');
                        callback({ status: xhr.status, response: 'XHR Request failed (Network error or CORS)' });
                    } else if (xhr.status < 200 || xhr.status >= 300) {
                        $l.eventLog('$r.httpRequest', `XHR response status - ${xhr.status} ${xhr.statusText}: ${xhr.response}`, 'Error');
                        callback({ status: xhr.status, response: xhr.response || xhr.statusText });
                    } else {
                        callback({ status: xhr.status, response: xhr.response });
                    }
                }
            };

            xhr.onerror = () => {
                if (callback) {
                    $l.eventLog('$r.httpRequest', 'XHR Network Error', 'Error');
                    callback({ status: -1, response: 'XHR Network Error' });
                }
            };
            xhr.ontimeout = () => {
                if (callback) {
                    $l.eventLog('$r.httpRequest', 'XHR Request Timed Out', 'Error');
                    callback({ status: -1, response: 'XHR Request Timed Out' });
                }
            };

            try {
                xhr.send(requestBody);
            } catch (e) {
                if (callback) {
                    $l.eventLog('$r.httpRequest', `XHR send error: ${e}`, 'Error');
                    callback({ status: -1, response: `XHR send error: ${e.message}` });
                }
            }
        },

        httpSubmit(url, formID, method = 'POST') {
            if (globalRoot.devicePlatform === 'node' || !doc?.forms) return false;

            const form = formID ? doc.forms[formID] : doc.forms[0];
            if (form instanceof HTMLFormElement) {
                form.method = method;
                form.action = url;
                form.submit();
                return true;
            }
            return false;
        },

        httpDataSubmit(formData, url, callback, options = {}) {
            return this.httpRequest('POST', url, formData, callback, options);
        },

        createBlobUrl: context.URL?.createObjectURL?.bind(context.URL) ?? context.webkitURL?.createObjectURL?.bind(context.webkitURL),
        revokeBlobUrl: context.URL?.revokeObjectURL?.bind(context.URL) ?? context.webkitURL?.revokeObjectURL?.bind(context.webkitURL),

        getCookie(id) {
            if (globalRoot.devicePlatform === 'node' || !doc?.cookie) return undefined;
            const cookies = doc.cookie.split('; ');
            for (const cookie of cookies) {
                const [name, ...valueParts] = cookie.split('=');
                if (name === id) {
                    return decodeURIComponent(valueParts.join('='));
                }
            }
            return undefined;
        },

        setCookie(id, val, expires, path = '/', domain, secure = false) {
            if (globalRoot.devicePlatform === 'node' || !doc) return this;
            let cookieString = `${id}=${encodeURIComponent(val)}`;

            if (expires instanceof Date) {
                cookieString += `; expires=${expires.toUTCString()}`;
            } else if (typeof expires === 'number') {
                cookieString += `; max-age=${expires}`;
            }

            cookieString += `; path=${path}`;
            if (domain) cookieString += `; domain=${domain}`;
            if (secure) cookieString += `; secure`;
            cookieString += `; SameSite=Lax`;

            doc.cookie = cookieString;
            return this;
        },

        deleteCookie(id, path = '/', domain) {
            this.setCookie(id, '', new Date(0), path, domain);
            return this;
        }
    });
    context.$request = syn.$r = $request;
})(globalRoot);

(function (context) {
    'use strict';
    const $webform = context.$webform || new syn.module();
    let doc = null;
    if (globalRoot.devicePlatform !== 'node') {
        $webform.context = context;
        $webform.document = context.document;
        doc = context.document;
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
            dataType: 'string',
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

        setStorage(prop, val, isLocal = false, ttl) {
            const storageKey = prop;
            const storageValue = JSON.stringify(val);

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal) {
                    localStorage.setItem(storageKey, storageValue);
                } else {
                    const effectiveTTL = ttl ?? 1200000;
                    const now = Date.now();
                    const item = {
                        value: val,
                        expiry: now + effectiveTTL,
                        ttl: effectiveTTL
                    };
                    localStorage.setItem(storageKey, JSON.stringify(item));
                }
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                storage.setItem(storageKey, storageValue);
            }

            return this;
        },

        getStorage(prop, isLocal = false) {
            const storageKey = prop;

            if (globalRoot.devicePlatform === 'node') {
                if (isLocal) {
                    const val = localStorage.getItem(storageKey);
                    return val ? JSON.parse(val) : null;
                } else {
                    const itemStr = localStorage.getItem(storageKey);
                    if (!itemStr) return null;

                    try {
                        const item = JSON.parse(itemStr);
                        const now = Date.now();

                        if (now > item.expiry) {
                            localStorage.removeItem(storageKey);
                            return null;
                        }

                        const refreshedItem = {
                            ...item,
                            expiry: now + item.ttl,
                        };
                        localStorage.setItem(storageKey, JSON.stringify(refreshedItem));
                        return item.value;

                    } catch (e) {
                        syn.$l.eventLog('$w.getStorage (Node)', `키 "${storageKey}"에 대한 스토리지 항목 파싱 오류: ${e}`, 'Error');
                        localStorage.removeItem(storageKey);
                        return null;
                    }
                }
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                const val = storage.getItem(storageKey);
                try {
                    return val ? JSON.parse(val) : null;
                } catch (e) {
                    syn.$l.eventLog('$w.getStorage (Browser)', `키 "${storageKey}"에 대한 스토리지 항목 파싱 오류: ${e}`, 'Error');
                    storage.removeItem(storageKey);
                    return null;
                }
            }
        },

        removeStorage(prop, isLocal = false) {
            const storageKey = prop;
            if (globalRoot.devicePlatform === 'node') {
                localStorage.removeItem(storageKey);
            } else {
                const storage = isLocal ? localStorage : sessionStorage;
                storage.removeItem(storageKey);
            }
            return this;
        },

        activeControl(evt) {
            const event = evt || context.event || null;
            let result = null;

            if (event) {
                result = event.target || event.srcElement || event || null;
            } else if (doc) {
                result = doc.activeElement || null;
            }

            if (!result && globalRoot.$this?.context) {
                result = $this.context.focusControl || null;
            }

            if (result && globalRoot.$this?.context) {
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
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(elementID) + error.message, 'Warning');
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
                                syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(elementID) + error.message, 'Warning');
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
                        syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-events 확인 필요: '.format(synControl.id) + error.message, 'Warning');
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
                         syn.$l.eventLog('$w.contentLoaded', 'elID: "{0}" syn-options 확인 필요: '.format(synControl.id) + error.message, 'Warning');
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
                context.$this = mod;

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
                doc.dispatchEvent(syn.$w.eventAddReady);
            }
        },

        removeReadyCount() {
            if (syn.$w.eventRemoveReady && syn.$w.isPageLoad == false) {
                doc.dispatchEvent(syn.$w.eventRemoveReady);
            }
        },

        createSelection(el, start, end) {
            const element = syn.$l.getElement(el);
            if (!element) return;

            try {
                if (element.setSelectionRange && element.type !== 'email') {
                    element.setSelectionRange(start, end);
                } else if (element.createTextRange) { // IE
                    const range = element.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', start);
                    range.moveEnd('character', end - start);
                    range.select();
                }
                element.focus();
            } catch (e) {
                syn.$l.eventLog('$w.createSelection', `${element.id}의 선택 영역 설정 오류: ${e}`, 'Warning');
            }
        },

        argumentsExtend(...args) {
            return Object.assign({}, ...args);
        },

        loadJson(url, setting, success, callback, async = true, isForceCallback = false) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, async);

            if (syn.$w.setServiceClientHeader && !this.setServiceClientHeader(xhr)) {
                syn.$l.eventLog('$w.loadJson', `URL ${url}에 대한 setServiceClientHeader 실패`, 'Error');
                if (callback && isForceCallback) callback();
                return;
            }

            const handleResponse = () => {
                if (xhr.status === 200) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        if (success) success(setting, responseData);
                    } catch (e) {
                        syn.$l.eventLog('$w.loadJson', `URL: ${url}, 상태: ${xhr.status}, 오류: ${e}에 대한 JSON 파싱 오류`, 'Error');
                    } finally {
                        if (callback) callback();
                    }
                } else {
                    syn.$l.eventLog('$w.loadJson', `URL: ${url}, 상태: ${xhr.status}, 응답 텍스트: ${xhr.responseText} HTTP 오류`, 'Error');
                    if (callback && isForceCallback) callback();
                }
            };

            if (async) {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        handleResponse();
                    }
                };
                xhr.onerror = () => {
                    syn.$l.eventLog('$w.loadJson', `URL ${url} 네트워크 오류`, 'Error');
                    if (callback && isForceCallback) callback();
                };
                xhr.send();
            } else {
                try {
                    xhr.send();
                    handleResponse();
                } catch (e) {
                    syn.$l.eventLog('$w.loadJson', `URL: ${url}, 오류: ${e}에 대한 동기 요청 중 오류 발생`, 'Error');
                    if (callback && isForceCallback) callback();
                }
            }
        },

        getTriggerOptions(el) {
            const element = syn.$l.getElement(el);
            const optionsAttr = element?.getAttribute('triggerOptions');
            if (!optionsAttr) return null;
            try {
                return JSON.parse(optionsAttr);
            } catch (e) {
                syn.$l.eventLog('$w.getTriggerOptions', `엘리먼트 ${element?.id}의 triggerOptions 파싱 실패: ${e}`, 'Warning');
                return null;
            }
        },

        triggerAction(triggerConfig) {
            if (!$this) return;

            let isContinue = true;
            const defaults = { arguments: [], options: {} };
            const configParams = syn.$w.argumentsExtend(defaults, triggerConfig.params);

            if ($this.hook?.beforeTrigger) {
                isContinue = $this.hook.beforeTrigger(triggerConfig.triggerID, triggerConfig.action, configParams);
            }

            if (isContinue ?? true) {
                const el = syn.$l.get(triggerConfig.triggerID);
                let triggerResult = null;
                let trigger = null;

                try {
                    if (triggerConfig.action?.startsWith('syn.uicontrols.$')) {
                        trigger = triggerConfig.action.split('.').slice(1).reduce((obj, prop) => obj?.[prop], syn);
                    } else if (triggerConfig.triggerID && triggerConfig.action && $this.event) {
                        trigger = $this.event[`${triggerConfig.triggerID}_${triggerConfig.action}`];
                    } else if (triggerConfig.method) {
                        trigger = new Function(`return (${triggerConfig.method})`)();
                    }

                    if (typeof trigger === 'function') {
                        if (el && triggerConfig.action?.startsWith('syn.uicontrols.$')) {
                            el.setAttribute('triggerOptions', JSON.stringify(configParams.options || {}));
                            configParams.arguments.unshift(triggerConfig.triggerID);
                            triggerResult = trigger.apply(el, configParams.arguments);
                        } else if (el && triggerConfig.triggerID && triggerConfig.action && $this.event) {
                            triggerResult = trigger.apply(el, configParams.arguments);
                        }
                        else if (triggerConfig.method) {
                            triggerResult = trigger.apply($this, configParams.arguments);
                        } else {
                            throw new Error("트리거 컨텍스트 불일치 또는 잘못된 설정입니다.");
                        }

                        if ($this.hook?.afterTrigger) {
                            $this.hook.afterTrigger(null, triggerConfig.action, { elID: triggerConfig.triggerID, result: triggerResult });
                        }
                    } else {
                        throw new Error(`액션: ${triggerConfig.action || triggerConfig.method}에 대한 트리거 함수를 찾을 수 없거나 유효하지 않습니다.`);
                    }
                } catch (error) {
                    const errorMessage = `트리거 실행 실패: ${error.message}`;
                    syn.$l.eventLog('$w.triggerAction', errorMessage, 'Error');
                    if ($this.hook?.afterTrigger) {
                        $this.hook.afterTrigger(errorMessage, triggerConfig.action, null);
                    }
                }
            } else {
                if ($this.hook?.afterTrigger) {
                    $this.hook.afterTrigger('hook.beforeTrigger가 false를 반환했습니다', triggerConfig.action, null);
                }
            }
        },

        getControlModule(modulePath) {
            if (!modulePath) return null;
            try {
                return modulePath.split('.').reduce((obj, prop) => obj?.[prop], context);
            } catch (e) {
                syn.$l.eventLog('$w.getControlModule', `모듈 경로 "${modulePath}" 접근 오류: ${e}`, 'Warning');
                return null;
            }
        },

        tryAddFunction(transactConfig) {
            if (!transactConfig || !$this?.config) {
                syn.$l.eventLog('$w.tryAddFunction', `functionID: ${transactConfig?.functionID}에 대해 transactConfig가 유효하지 않거나 $this.config가 없습니다.`, 'Warning');
                return;
            }

            try {
                transactConfig.noProgress = transactConfig.noProgress ?? false;
                $this.config.transactions = $this.config.transactions || [];

                const transactions = $this.config.transactions;
                const existingIndex = transactions.findIndex(t => t.functionID === transactConfig.functionID);
                if (existingIndex > -1) {
                    transactions.splice(existingIndex, 1);
                }

                const synControlList = $this.context?.synControls ?? [];
                const defaultFormId = doc?.forms?.[0]?.getAttribute('syn-datafield') ?? '';

                const transactionObject = {
                    functionID: transactConfig.functionID,
                    transactionResult: transactConfig.transactionResult ?? true,
                    inputs: [],
                    outputs: []
                };

                (transactConfig.inputs || []).forEach(inputConfig => {
                    const input = {
                        requestType: inputConfig.type,
                        dataFieldID: inputConfig.dataFieldID || defaultFormId,
                        items: {}
                    };

                    const isBelong = (belongID) => {
                        if (!belongID) return false;
                        return Array.isArray(belongID)
                            ? belongID.includes(transactConfig.functionID)
                            : transactConfig.functionID === belongID;
                    };

                    const processControlOptions = (controlConfig) => {
                        const el = syn.$l.get(`${controlConfig.id} _hidden`) || syn.$l.get(controlConfig.id);
                        const optionsStr = el?.getAttribute('syn-options') || '{}';
                        try {
                            const synOptions = new Function(`return (${optionsStr})`)();
                            if (synOptions && controlConfig.field && isBelong(synOptions.belongID)) {
                                input.items[controlConfig.field] = {
                                    fieldID: controlConfig.field,
                                    dataType: synOptions.dataType || 'string'
                                };
                            }
                        } catch (e) {
                            syn.$l.eventLog('$w.tryAddFunction.input', `${controlConfig.id}의 syn - options 파싱 오류: ${e}`, 'Warning');
                        }
                    };

                    const processStoreColumns = (store, type) => {
                        if (store?.storeType === type && store.dataSourceID === input.dataFieldID) {
                            (store.columns || []).forEach(column => {
                                if (isBelong(column.belongID)) {
                                    input.items[column.data] = {
                                        fieldID: column.data,
                                        dataType: column.dataType || 'string'
                                    };
                                }
                            });
                            return true;
                        }
                        return false;
                    };

                    if (inputConfig.type === 'Row') {
                        const formControls = synControlList.filter(item =>
                            item.formDataFieldID === input.dataFieldID &&
                            !item.type?.includes('grid') && !item.type?.includes('chart') && !item.type?.includes('data')
                        );

                        if (formControls.length > 0) {
                            formControls.forEach(processControlOptions);
                        } else {
                            let storeProcessed = false;
                            if (syn.uicontrols?.$data?.storeList) {
                                for (const store of syn.uicontrols.$data.storeList) {
                                    if (processStoreColumns(store, 'Form')) {
                                        storeProcessed = true;
                                        break;
                                    }
                                }
                            }
                            if (!storeProcessed) {
                                const specificControlConfig = synControlList.find(item => item.field === input.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart')));
                                const controlModule = specificControlConfig ? syn.$w.getControlModule(specificControlConfig.module) : null;
                                controlModule?.setTransactionBelongID?.(specificControlConfig.id, input, transactConfig);
                            }
                        }
                    } else if (inputConfig.type === 'List') {
                        const listControlConfig = synControlList.find(item => item.field === input.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart')));
                        const controlModule = listControlConfig ? syn.$w.getControlModule(listControlConfig.module) : null;

                        if (controlModule?.setTransactionBelongID) {
                            controlModule.setTransactionBelongID(listControlConfig.id, input, transactConfig);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreColumns(store, 'Grid')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.input', `dataFieldID "${input.dataFieldID}"에 대한 목록(List) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        }
                    }
                    transactionObject.inputs.push(input);
                });

                (transactConfig.outputs || []).forEach(outputConfig => {
                    const output = {
                        responseType: outputConfig.type,
                        dataFieldID: outputConfig.dataFieldID || '',
                        items: {}
                    };

                    const processControlOutput = (controlConfig) => {
                        const el = syn.$l.get(`${controlConfig.id} _hidden`) || syn.$l.get(controlConfig.id);
                        const optionsStr = el?.getAttribute('syn-options') || '{}';
                        try {
                            const synOptions = new Function(`return (${optionsStr})`)();
                            if (synOptions && controlConfig.field) {
                                output.items[controlConfig.field] = {
                                    fieldID: controlConfig.field,
                                    dataType: synOptions.dataType || 'string'
                                };
                            }
                        } catch (e) {
                            syn.$l.eventLog('$w.tryAddFunction.output', `${controlConfig.id}의 syn - options 파싱 오류: ${e}`, 'Warning');
                        }

                        if (outputConfig.clear) {
                            const controlModule = syn.$w.getControlModule(controlConfig.module);
                            controlModule?.clear?.(controlConfig.id);
                        }
                    };

                    const processStoreOutput = (store, type) => {
                        if (store?.storeType === type && store.dataSourceID === output.dataFieldID) {
                            (store.columns || []).forEach(column => {
                                output.items[column.data] = {
                                    fieldID: column.data,
                                    dataType: column.dataType || 'string'
                                };
                            });
                            if (outputConfig.clear && $this?.store?.[store.dataSourceID]) {
                                if (Array.isArray($this.store[store.dataSourceID])) {
                                    $this.store[store.dataSourceID].length = 0;
                                } else {
                                    $this.store[store.dataSourceID] = {};
                                }
                            }
                            return true;
                        }
                        return false;
                    };

                    if (outputConfig.type === 'Form') {
                        const formControls = synControlList.filter(item =>
                            item.formDataFieldID === output.dataFieldID &&
                            !item.type?.includes('grid') && !item.type?.includes('chart') && !item.type?.includes('data')
                        );
                        if (formControls.length > 0) {
                            formControls.forEach(processControlOutput);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreOutput(store, 'Form')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.output', `dataFieldID "${output.dataFieldID}"에 대한 폼(Form) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        }
                    } else if (outputConfig.type === 'Grid') {
                        const listControlConfig = synControlList.find(item => item.field === output.dataFieldID && (item.type?.includes('grid') || item.type?.includes('chart'))); // Allow chart as grid output sometimes
                        const controlModule = listControlConfig ? syn.$w.getControlModule(listControlConfig.module) : null;

                        if (controlModule?.setTransactionBelongID) {
                            controlModule.setTransactionBelongID(listControlConfig.id, output);
                            if (outputConfig.clear) controlModule.clear?.(listControlConfig.id);
                        } else if (syn.uicontrols?.$data?.storeList) {
                            let storeProcessed = false;
                            for (const store of syn.uicontrols.$data.storeList) {
                                if (processStoreOutput(store, 'Grid')) {
                                    storeProcessed = true;
                                    break;
                                }
                            }
                            if (!storeProcessed) {
                                syn.$l.eventLog('$w.tryAddFunction.output', `dataFieldID "${output.dataFieldID}"에 대한 그리드(Grid) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        }
                    }
                    transactionObject.outputs.push(output);
                });

                transactions.push(transactionObject);
            } catch (error) {
                syn.$l.eventLog('$w.tryAddFunction', `함수 ${transactConfig.functionID} 처리 중 오류 발생: ${error}`, 'Error');
            }
        },

        transactionAction(transactConfigInput, options) {
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                const functionID = transactConfigInput;
                transactConfig = $this?.transaction?.[functionID];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.transactionAction', `functionID "${functionID}"에 대한 거래 설정을 찾을 수 없습니다.`, 'Warning');
                    return;
                }

                transactConfig.functionID = transactConfig.functionID || functionID;
            }

            if (!transactConfig || !$this?.config) {
                syn.$l.eventLog('$w.transactionAction', '거래 설정이 유효하지 않거나 $this 컨텍스트가 없습니다.', 'Warning');
                return;
            }


            try {
                let isContinue = true;
                if ($this.hook?.beforeTransaction) {
                    isContinue = $this.hook.beforeTransaction(transactConfig);
                }

                if (isContinue ?? true) {
                    const mergedOptions = syn.$w.argumentsExtend({
                        message: '', dynamic: 'Y', authorize: 'N', commandType: 'D',
                        returnType: 'Json', transactionScope: 'N', transactionLog: 'Y'
                    }, options);

                    transactConfig.noProgress = transactConfig.noProgress ?? false;

                    if (syn.$w.progressMessage && !transactConfig.noProgress) {
                        syn.$w.progressMessage(mergedOptions.message);
                    }

                    syn.$w.tryAddFunction(transactConfig);

                    syn.$w.transaction(transactConfig.functionID, (result, additionalData, correlationID) => {
                        let error = null;
                        if (result?.errorText?.length > 0) {
                            error = result.errorText[0];
                            syn.$l.eventLog('$w.transactionAction.callback', `거래 오류: ${error}`, 'Error');
                            return;
                        }

                        let callbackResult = null;
                        if (typeof transactConfig.callback === 'function') {
                            try {
                                callbackResult = transactConfig.callback(error, result, additionalData, correlationID);
                            } catch (e) {
                                syn.$l.eventLog('$w.transactionAction.callbackExec', `콜백 실행 오류: ${e}`, 'Error');
                            }
                        } else if (Array.isArray(transactConfig.callback) && transactConfig.callback.length === 2) {
                            setTimeout(() => {
                                syn.$l.trigger(transactConfig.callback[0], transactConfig.callback[1], { error, result, additionalData, correlationID });
                            }, 0);
                        }

                        if (callbackResult === null || callbackResult === true || Array.isArray(transactConfig.callback)) {
                            if ($this.hook?.afterTransaction) {
                                $this.hook.afterTransaction(null, transactConfig.functionID, result, additionalData, correlationID);
                            }
                        } else if (callbackResult === false) {
                            if ($this.hook?.afterTransaction) {
                                $this.hook.afterTransaction('callbackResult가 false를 반환했습니다', transactConfig.functionID, null, null, correlationID);
                            }
                        }
                    }, mergedOptions);

                } else {
                    if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
                    if ($this.hook?.afterTransaction) {
                        $this.hook.afterTransaction('beforeTransaction이 false를 반환했습니다', transactConfig.functionID, null, null);
                    }
                }
            } catch (error) {
                syn.$l.eventLog('$w.transactionAction', `거래 액션 실행 중 오류 발생: ${error}`, 'Error');
                if (syn.$w.closeProgressMessage) syn.$w.closeProgressMessage();
            }
        },

        transactionDirect(directObject, callback, options) {
            if (!directObject) {
                syn.$l.eventLog('$w.transactionDirect', 'directObject 파라미터가 필요합니다.', 'Error');
                return;
            }

            if (syn.$w.progressMessage && !(directObject.noProgress === true)) {
                syn.$w.progressMessage();
            }

            const transactionObj = syn.$w.transactionObject(directObject.functionID, 'Json');

            transactionObj.programID = directObject.programID || syn.Config.ApplicationID;
            transactionObj.moduleID = directObject.moduleID || (globalRoot.devicePlatform === 'browser' ? location.pathname.split('/').filter(Boolean)[0] : undefined) || syn.Config.ModuleID;
            transactionObj.businessID = directObject.businessID || syn.Config.ProjectID;
            transactionObj.systemID = directObject.systemID || globalRoot.$this?.config?.systemID || syn.Config.SystemID;
            transactionObj.transactionID = directObject.transactionID;
            transactionObj.dataMapInterface = directObject.dataMapInterface || 'Row|Form';
            transactionObj.transactionResult = directObject.transactionResult ?? true;
            transactionObj.screenID = globalRoot.devicePlatform === 'node'
                ? (directObject.screenID || directObject.transactionID)
                : (syn.$w.pageScript?.replace('$', '') ?? '');
            transactionObj.startTraceID = directObject.startTraceID || options?.startTraceID || '';

            const mergedOptions = syn.$w.argumentsExtend({
                message: '', dynamic: 'Y', authorize: 'N', commandType: 'D',
                returnType: 'Json', transactionScope: 'N', transactionLog: 'Y'
            }, options);
            transactionObj.options = mergedOptions;


            if (directObject.inputLists?.length > 0) {
                transactionObj.inputs.push(...directObject.inputLists);
                transactionObj.inputsItemCount.push(directObject.inputLists.length);
            } else if (directObject.inputObjects) {
                transactionObj.inputs.push(directObject.inputObjects);
                transactionObj.inputsItemCount.push(1);
            }

            syn.$w.executeTransaction(directObject, transactionObj, (responseData, additionalData) => {
                if (callback) {
                    try {
                        callback(responseData, additionalData);
                    } catch (e) {
                        syn.$l.eventLog('$w.transactionDirect.callback', `콜백 오류: ${e}`, 'Error');
                    }
                }
            });
        },

        transaction(functionID, callback, options) {
            let errorText = '';
            const result = { errorText: [], outputStat: [] };

            try {
                if (syn.$w.domainTransactionLoaderStart) syn.$w.domainTransactionLoaderStart();

                const mergedOptions = syn.$w.argumentsExtend({
                    message: '',
                    dynamic: 'Y',
                    authorize: 'N',
                    commandType: 'D',
                    returnType: 'Json',
                    transactionScope: 'N',
                    transactionLog: 'Y'
                }, options);

                if (syn.$w.progressMessage) syn.$w.progressMessage(mergedOptions.message);

                if (!$this?.config?.transactions) {
                    throw new Error('거래 설정($this.config.transactions)이 없습니다.');
                }

                const transactions = $this.config.transactions.filter(item => item.functionID === functionID);

                if (transactions.length !== 1) {
                    throw new Error(`functionID "${functionID}"에 대한 거래 정의를 찾을 수 없거나 중복됩니다.`);
                }

                const transaction = transactions[0];
                const transactionObject = syn.$w.transactionObject(transaction.functionID, 'Json');

                transactionObject.programID = $this.config.programID;
                transactionObject.businessID = $this.config.businessID;
                transactionObject.systemID = $this.config.systemID;
                transactionObject.transactionID = $this.config.transactionID;
                transactionObject.screenID = syn.$w.pageScript?.replace('$', '') ?? '';
                transactionObject.startTraceID = mergedOptions.startTraceID || '';
                transactionObject.options = mergedOptions;

                const synControls = $this.context?.synControls ?? [];

                transaction.inputs.forEach(inputMapping => {
                    let inputObjects = [];
                    const dataFieldID = inputMapping.dataFieldID;

                    const getControlValue = (controlInfo, meta) => {
                        if (!controlInfo) return meta?.dataType?.includes('num') ? 0 : '';
                        const controlModule = syn.$w.getControlModule(controlInfo.module);
                        let value = controlModule?.getValue?.(controlInfo.id.replace('_hidden', ''), meta);

                        if (value === undefined || value === null) {
                            value = meta?.dataType?.includes('num') ? 0 : '';
                        }
                        return value;
                    };

                    const validateControl = (controlInfo, options, type) => {
                        if (options?.validators && $validation?.transactionValidate) {
                            const controlModule = syn.$w.getControlModule(controlInfo.module);
                            return $validation.transactionValidate(controlModule, controlInfo, options, type);
                        }
                        return true;
                    };

                    if (inputMapping.requestType === 'Row') {
                        const rowData = [];
                        const formControls = synControls.filter(item => item.field === dataFieldID || item.formDataFieldID === dataFieldID);

                        if (formControls.length > 0) {
                            const gridChartControl = formControls.find(c => c.type?.includes('grid') || c.type?.includes('chart'));
                            if (gridChartControl && gridChartControl.field === dataFieldID) {
                                const controlModule = syn.$w.getControlModule(gridChartControl.module);
                                const values = controlModule?.getValue?.(gridChartControl.id.replace('_hidden', ''), 'Row', inputMapping.items);
                                inputObjects = values?.[0] ?? [];
                            } else {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const controlInfo = formControls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    const el = controlInfo ? (syn.$l.get(`${controlInfo.id} _hidden`) || syn.$l.get(controlInfo.id)) : null;
                                    const synOptionsStr = el?.getAttribute('syn-options') || '{}';
                                    try {
                                        const synOptions = new Function(`return (${synOptionsStr})`)();
                                        if (!validateControl(controlInfo, synOptions, 'Row')) {
                                            throw new Error(`컨트롤 유효성 검사 실패: ${controlInfo?.id}`);
                                        }
                                        const controlValue = getControlValue(controlInfo, meta);
                                        rowData.push({ prop: meta.fieldID, val: controlValue });
                                    } catch (e) {
                                        throw new Error(`행(Row) 컨트롤 ${itemDataField} 처리 오류: ${e.message}`);
                                    }
                                });
                                inputObjects = rowData;
                            }
                        } else {
                            if (syn.uicontrols?.$data?.storeList) {
                                const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Form' && s.dataSourceID === dataFieldID);
                                if (store && $this.store?.[store.dataSourceID]) {
                                    Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                        const storeData = $this.store[store.dataSourceID];
                                        const controlValue = storeData?.[itemDataField] ?? (meta.dataType?.includes('num') ? 0 : '');
                                        rowData.push({ prop: meta.fieldID, val: controlValue });
                                    });
                                    inputObjects = rowData;
                                } else {
                                    syn.$l.eventLog('$w.transaction', `dataFieldID "${dataFieldID}"에 대한 행(Row) 소스를 찾을 수 없습니다.`, 'Warning');
                                }
                            } else {
                                syn.$l.eventLog('$w.transaction', `dataFieldID "${dataFieldID}"에 대한 행(Row) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        }
                        transactionObject.inputs.push(inputObjects);
                        transactionObject.inputsItemCount.push(1);

                    } else if (inputMapping.requestType === 'List') {
                        let listData = [];
                        const listControl = synControls.find(item => item.field === dataFieldID);

                        if (listControl) {
                            const controlModule = syn.$w.getControlModule(listControl.module);
                            const el = syn.$l.get(`${listControl.id} _hidden`) || syn.$l.get(listControl.id);
                            const synOptionsStr = el?.getAttribute('syn-options') || '{}';
                            try {
                                const synOptions = new Function(`return (${synOptionsStr})`)();
                                (synOptions?.columns || []).forEach(column => {
                                    column.controlText = synOptions.controlText || '';
                                    if (!validateControl(listControl, column, 'List')) {
                                        throw new Error(`목록(List) 컨트롤 컬럼 유효성 검사 실패: ${column.data}`);
                                    }
                                });

                                listData = controlModule?.getValue?.(listControl.id.replace('_hidden', ''), 'List', inputMapping.items) ?? [];

                            } catch (e) {
                                throw new Error(`목록(List) 컨트롤 ${dataFieldID} 처리 오류: ${e.message}`);
                            }
                        } else {
                            if (syn.uicontrols?.$data?.storeList) {
                                const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Grid' && s.dataSourceID === dataFieldID);
                                if (store && $this.store?.[store.dataSourceID]) {
                                    const storeItems = $this.store[store.dataSourceID];
                                    listData = storeItems.map(item =>
                                        Object.entries(inputMapping.items).map(([df, meta]) => ({
                                            prop: meta.fieldID,
                                            val: item[df] ?? (meta.dataType?.includes('num') ? 0 : '')
                                        }))
                                    );
                                } else {
                                    syn.$l.eventLog('$w.transaction', `dataFieldID "${dataFieldID}"에 대한 목록(List) 소스를 찾을 수 없습니다.`, 'Warning');
                                }
                            } else {
                                syn.$l.eventLog('$w.transaction', `dataFieldID "${dataFieldID}"에 대한 목록(List) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        }
                        transactionObject.inputs.push(...listData);
                        transactionObject.inputsItemCount.push(listData.length);
                    }
                });

                syn.$w.executeTransaction($this.config, transactionObject, (responseData, additionalData, correlationID) => {
                    try {
                        const isDynamicOutput = transaction.outputs.some(o => o.responseType === 'Dynamic');

                        if (isDynamicOutput) {
                            result.outputStat.push({ fieldID: 'Dynamic', count: 1, dynamicData: responseData });
                        } else if (responseData?.length === transaction.outputs.length) {
                            transaction.outputs.forEach((outputMapping, outputIndex) => {
                                const dataMapItem = responseData[outputIndex];
                                const responseFieldID = dataMapItem?.id;
                                const outputData = dataMapItem?.value;

                                if ($this.hook?.outputDataBinding) {
                                    $this.hook.outputDataBinding(functionID, responseFieldID, outputData);
                                }

                                const mapOutputData = (targetType, dataFieldID, data) => {
                                    const controls = synControls.filter(item => item.field === dataFieldID || (targetType === 'Form' && item.formDataFieldID === dataFieldID));

                                    if (controls.length > 0) {
                                        const targetControl = controls.find(c => c.field === dataFieldID) || controls[0];
                                        const controlModule = syn.$w.getControlModule(targetControl.module);
                                        if (controlModule?.setValue) {
                                            if (targetType === 'Form') {
                                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                                    const formControlInfo = controls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                                    if (formControlInfo && data?.[meta.fieldID] !== undefined) {
                                                        const formModule = syn.$w.getControlModule(formControlInfo.module);
                                                        formModule?.setValue?.(formControlInfo.id.replace('_hidden', ''), data[meta.fieldID], meta);
                                                    }
                                                });
                                            } else {
                                                controlModule.setValue(targetControl.id.replace('_hidden', ''), data, outputMapping.items);
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                };

                                const mapOutputToStore = (targetType, dataFieldID, data) => {
                                    if (syn.uicontrols?.$data?.storeList) {
                                        const store = syn.uicontrols.$data.storeList.find(s => s.storeType === targetType && s.dataSourceID === dataFieldID);
                                        if (store && $this?.store) {
                                            if (targetType === 'Form') {
                                                $this.store[store.dataSourceID] = $this.store[store.dataSourceID] ?? {};
                                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                                    if (data?.[meta.fieldID] !== undefined) {
                                                        $this.store[store.dataSourceID][itemDataField] = data[meta.fieldID];
                                                    }
                                                });
                                            } else {
                                                $this.store[store.dataSourceID] = (data || []).map(item => ({ ...item, Flag: 'R' }));
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                };

                                if (outputMapping.responseType === 'Form') {
                                    const count = (outputData && Object.keys(outputData).length > 0) ? 1 : 0;
                                    result.outputStat.push({ fieldID: responseFieldID, Count: count });
                                    if (count > 0) {
                                        if (!mapOutputData('Form', outputMapping.dataFieldID, outputData)) {
                                            if (!mapOutputToStore('Form', outputMapping.dataFieldID, outputData)) {
                                                result.errorText.push(`"${outputMapping.dataFieldID}" 폼(Form) 출력 매핑 대상을 찾을 수 없습니다.`);
                                                syn.$l.eventLog('$w.transaction', `"${outputMapping.dataFieldID}" 폼(Form) 출력 매핑 대상을 찾을 수 없습니다.`, 'Error');
                                            }
                                        }
                                    }
                                } else if (outputMapping.responseType === 'Grid' || outputMapping.responseType === 'Chart') {
                                    const count = outputData?.length ?? 0;
                                    result.outputStat.push({ fieldID: responseFieldID, Count: count });
                                    if (count > 0) {
                                        if (!mapOutputData(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                            if (!mapOutputToStore(outputMapping.responseType, outputMapping.dataFieldID, outputData)) { // Try store mapping
                                                const targetDesc = outputMapping.responseType === 'Grid' ? '그리드(Grid)' : '차트(Chart)';
                                                result.errorText.push(`"${outputMapping.dataFieldID}" ${targetDesc} 출력 매핑 대상을 찾을 수 없습니다.`);
                                                syn.$l.eventLog('$w.transaction', `"${outputMapping.dataFieldID}" ${targetDesc} 출력 매핑 대상을 찾을 수 없습니다.`, 'Error');
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            throw new Error(`출력 정의(${transaction.outputs.length})와 응답 데이터(${responseData?.length ?? 0}) 수가 일치하지 않습니다.`);
                        }

                        if (callback) callback(result, additionalData, correlationID);

                    } catch (mappingError) {
                        result.errorText.push(`출력 매핑 오류: ${mappingError.message}`);
                        syn.$l.eventLog('$w.transaction.outputMap', `출력 매핑 오류: ${mappingError}`, 'Error');
                        if (callback) callback(result, additionalData, correlationID);
                    } finally {
                        if (syn.$w.domainTransactionLoaderEnd) syn.$w.domainTransactionLoaderEnd();
                    }
                });

            } catch (error) {
                errorText = `거래 설정 오류: ${error.message}`;
                result.errorText.push(errorText);
                syn.$l.eventLog('$w.transaction', errorText, 'Error');
                if (callback) callback(result, null, null);
                if (syn.$w.domainTransactionLoaderEnd) syn.$w.domainTransactionLoaderEnd();
            }
        },

        getterValue(transactConfigInput) {
            const result = { errors: [], inputs: [] };
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                transactConfig = $this?.transaction?.[transactConfigInput];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.getterValue', `functionID "${transactConfigInput}"에 대한 거래 설정을 찾을 수 없습니다.`, 'Warning');
                    return;
                }
            }

            try {
                syn.$w.tryAddFunction(transactConfig);

                if (!$this?.config?.transactions) {
                    throw new Error('거래 설정($this.config.transactions)이 없습니다.');
                }

                const transactions = $this.config.transactions.filter(item => item.functionID === transactConfig.functionID);
                if (transactions.length !== 1) {
                    throw new Error(`functionID "${transactConfig.functionID}"에 대한 거래 정의를 찾을 수 없거나 중복됩니다.`);
                }
                const transaction = transactions[0];
                const synControls = $this.context?.synControls ?? [];

                transaction.inputs.forEach(inputMapping => {
                    let inputObjects = [];
                    const dataFieldID = inputMapping.dataFieldID;

                    const getControlValue = (controlInfo, meta) => {
                        if (!controlInfo) return meta?.dataType?.includes('num') ? 0 : '';
                        const controlModule = syn.$w.getControlModule(controlInfo.module);
                        let value = controlModule?.getValue?.(controlInfo.id.replace('_hidden', ''), meta);
                        return value ?? (meta?.dataType?.includes('num') ? 0 : '');
                    };


                    if (inputMapping.requestType === 'Row') {
                        const rowData = {};
                        const formControls = synControls.filter(item => item.field === dataFieldID || item.formDataFieldID === dataFieldID);

                        if (formControls.length > 0) {
                            const gridChartControl = formControls.find(c => c.type?.includes('grid') || c.type?.includes('chart'));
                            if (gridChartControl && gridChartControl.field === dataFieldID) {
                                const controlModule = syn.$w.getControlModule(gridChartControl.module);
                                const values = controlModule?.getValue?.(gridChartControl.id.replace('_hidden', ''), 'Row', inputMapping.items);
                                inputObjects = values?.[0] ?? [];
                                inputObjects.forEach(item => { rowData[item.prop] = item.val; });

                            } else {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const controlInfo = formControls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    rowData[meta.fieldID] = getControlValue(controlInfo, meta);
                                });
                            }
                        } else if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Form' && s.dataSourceID === dataFieldID);
                            if (store && $this.store?.[store.dataSourceID]) {
                                Object.entries(inputMapping.items).forEach(([itemDataField, meta]) => {
                                    const storeData = $this.store[store.dataSourceID];
                                    rowData[meta.fieldID] = storeData?.[itemDataField] ?? (meta.dataType?.includes('num') ? 0 : '');
                                });
                            } else {
                                syn.$l.eventLog('$w.getterValue', `dataFieldID "${dataFieldID}"에 대한 행(Row) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        } else {
                            syn.$l.eventLog('$w.getterValue', `dataFieldID "${dataFieldID}"에 대한 행(Row) 소스를 찾을 수 없습니다.`, 'Warning');
                        }
                        result.inputs.push(rowData);

                    } else if (inputMapping.requestType === 'List') {
                        let listData = [];
                        const listControl = synControls.find(item => item.field === dataFieldID);

                        if (listControl) {
                            const controlModule = syn.$w.getControlModule(listControl.module);
                            const rawListData = controlModule?.getValue?.(listControl.id.replace('_hidden', ''), 'List', inputMapping.items) ?? [];
                            listData = rawListData.map(rowItems =>
                                rowItems.reduce((obj, item) => {
                                    obj[item.prop] = item.val;
                                    return obj;
                                }, {})
                            );
                        } else if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === 'Grid' && s.dataSourceID === dataFieldID);
                            if (store && $this.store?.[store.dataSourceID]) {
                                const storeItems = $this.store[store.dataSourceID];
                                listData = storeItems.map(item =>
                                    Object.entries(inputMapping.items).reduce((obj, [df, meta]) => {
                                        obj[meta.fieldID] = item[df] ?? (meta.dataType?.includes('num') ? 0 : '');
                                        return obj;
                                    }, {})
                                );
                            } else {
                                syn.$l.eventLog('$w.getterValue', `dataFieldID "${dataFieldID}"에 대한 목록(List) 소스를 찾을 수 없습니다.`, 'Warning');
                            }
                        } else {
                            syn.$l.eventLog('$w.getterValue', `dataFieldID "${dataFieldID}"에 대한 목록(List) 소스를 찾을 수 없습니다.`, 'Warning');
                        }
                        result.inputs.push(...listData);
                    }
                });

            } catch (error) {
                result.errors.push(`Getter 오류: ${error.message}`);
                syn.$l.eventLog('$w.getterValue', `Getter 오류: ${error}`, 'Error');
            }
            return result;
        },

        setterValue(transactConfigInput, responseData) {
            const result = { errors: [], outputs: [] };
            let transactConfig = transactConfigInput;
            if (typeof transactConfigInput === 'string') {
                transactConfig = $this?.transaction?.[transactConfigInput];
                if (!transactConfig) {
                    syn.$l.eventLog('$w.setterValue', `functionID "${transactConfigInput}"에 대한 거래 설정을 찾을 수 없습니다.`, 'Warning');
                    return;
                }
            }

            try {
                syn.$w.tryAddFunction(transactConfig);

                if (!$this?.config?.transactions) {
                    throw new Error('거래 설정($this.config.transactions)이 없습니다.');
                }
                const transactions = $this.config.transactions.filter(item => item.functionID === transactConfig.functionID);
                if (transactions.length !== 1) {
                    throw new Error(`functionID "${transactConfig.functionID}"에 대한 거래 정의를 찾을 수 없거나 중복됩니다.`);
                }
                const transaction = transactions[0];
                const synControls = $this.context?.synControls ?? [];

                if (responseData?.length !== transaction.outputs.length) {
                    throw new Error(`출력 정의(${transaction.outputs.length})와 응답 데이터(${responseData?.length ?? 0}) 수가 일치하지 않습니다.`);
                }

                transaction.outputs.forEach((outputMapping, outputIndex) => {
                    const outputData = responseData[outputIndex];
                    const responseFieldID = outputMapping.responseType + 'Data' + outputIndex;

                    const mapOutputData = (targetType, dataFieldID, data) => {
                        const controls = synControls.filter(item => item.field === dataFieldID || (targetType === 'Form' && item.formDataFieldID === dataFieldID));
                        if (controls.length === 0) return false;

                        const targetControl = controls.find(c => c.field === dataFieldID) || controls[0];
                        const controlModule = syn.$w.getControlModule(targetControl.module);
                        if (controlModule?.setValue) {
                            if (targetType === 'Form') {
                                Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                    const formControlInfo = controls.find(c => c.field === itemDataField && c.formDataFieldID === dataFieldID);
                                    if (formControlInfo && data?.[meta.fieldID] !== undefined) {
                                        const formModule = syn.$w.getControlModule(formControlInfo.module);
                                        formModule?.setValue?.(formControlInfo.id.replace('_hidden', ''), data[meta.fieldID], meta);
                                    }
                                });
                            } else {
                                controlModule.setValue(targetControl.id.replace('_hidden', ''), data, outputMapping.items);
                            }
                            return true;
                        }
                        return false;
                    };

                    const mapOutputToStore = (targetType, dataFieldID, data) => {
                        if (syn.uicontrols?.$data?.storeList) {
                            const store = syn.uicontrols.$data.storeList.find(s => s.storeType === targetType && s.dataSourceID === dataFieldID);
                            if (store && $this?.store) {
                                if (targetType === 'Form') {
                                    $this.store[store.dataSourceID] = $this.store[store.dataSourceID] ?? {};
                                    Object.entries(outputMapping.items).forEach(([itemDataField, meta]) => {
                                        if (data?.[meta.fieldID] !== undefined) {
                                            $this.store[store.dataSourceID][itemDataField] = data[meta.fieldID];
                                        }
                                    });
                                } else {
                                    $this.store[store.dataSourceID] = (data || []).map(item => ({ ...item, Flag: 'R' }));
                                }
                                return true;
                            }
                        }
                        return false;
                    };


                    if (outputMapping.responseType === 'Form') {
                        const count = (outputData && Object.keys(outputData).length > 0) ? 1 : 0;
                        result.outputs.push({ fieldID: responseFieldID, Count: count });
                        if (count > 0) {
                            if (!mapOutputData('Form', outputMapping.dataFieldID, outputData)) {
                                if (!mapOutputToStore('Form', outputMapping.dataFieldID, outputData)) {
                                    result.errors.push(`"${outputMapping.dataFieldID}" 폼(Form) 출력 매핑 대상을 찾을 수 없습니다.`);
                                    syn.$l.eventLog('$w.setterValue', `"${outputMapping.dataFieldID}" 폼(Form) 출력 매핑 대상을 찾을 수 없습니다.`, 'Error');
                                }
                            }
                        }
                    } else if (outputMapping.responseType === 'Grid' || outputMapping.responseType === 'Chart') {
                        const count = outputData?.length ?? 0;
                        result.outputs.push({ fieldID: responseFieldID, Count: count });
                        if (count > 0) {
                            if (!mapOutputData(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                if (!mapOutputToStore(outputMapping.responseType, outputMapping.dataFieldID, outputData)) {
                                    const targetDesc = outputMapping.responseType === 'Grid' ? '그리드(Grid)' : '차트(Chart)';
                                    result.errors.push(`"${outputMapping.dataFieldID}" ${targetDesc} 출력 매핑 대상을 찾을 수 없습니다.`);
                                    syn.$l.eventLog('$w.setterValue', `"${outputMapping.dataFieldID}" ${targetDesc} 출력 매핑 대상을 찾을 수 없습니다.`, 'Error');
                                }
                            }
                        }
                    }
                });

            } catch (error) {
                result.errors.push(`Setter 오류: ${error.message}`);
                syn.$l.eventLog('$w.setterValue', `Setter 오류: ${error}`, 'Error');
            }
            return result;
        },

        scrollToTop() {
            if (!doc?.documentElement || !context.requestAnimationFrame || !context.scrollTo) return;

            const scrollStep = () => {
                const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
                if (scrollTop > 0) {
                    context.requestAnimationFrame(scrollStep);
                    context.scrollTo(0, scrollTop - scrollTop / 8);
                }
            };
            context.requestAnimationFrame(scrollStep);
        },

        setFavicon(url) {
            if (!doc) return;
            let favicon = doc.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = url;
            } else {
                favicon = doc.createElement('link');
                favicon.rel = 'icon';
                favicon.href = url;
                doc.head?.appendChild(favicon);
            }
        },

        fileDownload(url, fileName) {
            if (!doc || !url) return;

            const downloadFileName = fileName || url.substring(url.lastIndexOf('/') + 1).split('.')[0] || 'download';
            const link = doc.createElement('a');
            link.href = url;
            link.download = downloadFileName;
            link.style.display = 'none';

            doc.body.appendChild(link);
            try {
                link.click();
            } catch (e) {
                syn.$l.eventLog('$w.fileDownload', `${url} 다운로드 실행 오류: ${e}`, 'Error');
            } finally {
                setTimeout(() => doc.body.removeChild(link), 100);
            }
        },

        sleep(ms, callback) {
            if (typeof callback === 'function') {
                return setTimeout(callback, ms);
            } else if (typeof Promise !== 'undefined') {
                return new Promise(resolve => setTimeout(resolve, ms));
            } else {
                syn.$l.eventLog('$w.sleep', '콜백 또는 Promise 지원이 필요합니다.', 'Debug');
                const start = Date.now();
                while (Date.now() < start + ms) { }
                return undefined;
            }
        },

        purge(el) {
            if (!el) return;
            const attributes = el.attributes;
            if (attributes) {
                for (let i = attributes.length - 1; i >= 0; i--) {
                    const name = attributes[i].name;
                    if (name.startsWith('on') && typeof el[name] === 'function') {
                        try { el[name] = null; } catch (e) { }
                    }
                }
            }

            let child = el.firstChild;
            while (child) {
                syn.$w.purge(child);
                child = child.nextSibling;
            }

            if (syn.$l?.events?.removeAllForElement) {
                syn.$l.events.removeAllForElement(el);
            }
        },

        setServiceObject(value) {
            syn.$w.serviceObject = typeof value === 'string' ? value : JSON.stringify(value);
            return this;
        },

        setServiceClientHeader(xhr) {
            xhr.setRequestHeader('CertificationKey', 'SGFuZFN0YWNr');
            return true;
        },

        xmlParser(xmlString) {
            if (typeof DOMParser === 'undefined') {
                syn.$l.eventLog('$w.xmlParser', '이 환경에서는 DOMParser가 지원되지 않습니다.', 'Error');
                return null;
            }
            try {
                const parser = new DOMParser();
                return parser.parseFromString(xmlString, 'text/xml');
            } catch (e) {
                syn.$l.eventLog('$w.xmlParser', `XML 파싱 오류: ${e}`, 'Error');
                return null;
            }
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
                        var result = { error: '요청 정보 확인 필요' };
                        if (response.ok == true) {
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
                            result = { error: `상태: ${response.status}, 텍스트: ${await response.text()}` }
                            syn.$l.eventLog('$w.apiHttp', `API HTTP 오류: ${result.error}`, 'Error');
                        }

                        return Promise.resolve(result);
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
                                syn.$l.eventLog('$w.fetchScript', `${decodeError} 오류, <script src="${moduleUrl}.js"></script> 문법 확인이 필요합니다`, 'Error');
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
                    syn.$l.eventLog('$w.fetchScript', `스크립트 로드 오류: ${error}`, 'Warning');
                    if (moduleScript) {
                        syn.$l.eventLog('$w.fetchScript', '<script src="{0}.js"></script> 문법 확인이 필요합니다'.format(moduleUrl), 'Error');
                    }
                }
            }

            return result;
        },

        async fetchText(url) {
            const defaultOptions = {
                method: 'GET',
                mode: 'cors',
                cache: 'default',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'text/plain' },
                redirect: 'follow',
                referrerPolicy: 'no-referrer-when-downgrade'
            };
            const fetchOptions = syn.$w.getFetchClientOptions ? syn.$w.getFetchClientOptions(defaultOptions) : defaultOptions;
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'} tick = ${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchText', `${finalUrl} Fetch 실패: 상태 ${response.status}, 텍스트: ${errorText}`, 'Warning');
                    return null;
                }
                return await response.text();
            } catch (error) {
                syn.$l.eventLog('$w.fetchText', `${finalUrl} Fetch 오류: ${error}`, 'Error');
                throw error;
            }
        },

        async fetchJson(url) {
            const defaultOptions = {
                method: 'GET',
                mode: 'cors',
                cache: 'default',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                redirect: 'follow',
                referrerPolicy: 'no-referrer-when-downgrade'
            };
            const fetchOptions = syn.$w.getFetchClientOptions ? syn.$w.getFetchClientOptions(defaultOptions) : defaultOptions;
            const cacheBust = (syn.Config?.IsClientCaching === false) ? `${url.includes('?') ? '&' : '?'} tick = ${Date.now()}` : '';
            const finalUrl = url + cacheBust;

            try {
                const response = await fetch(finalUrl, fetchOptions);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => `HTTP ${response.status} ${response.statusText}`);
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} Fetch 실패: 상태 ${response.status}, 텍스트: ${errorText}`, 'Warning');
                    return null;
                }

                const contentType = response.headers.get('Content-Type') || '';
                if (!contentType.includes('application/json')) {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl}에서 JSON을 예상했지만 Content - Type: ${contentType}을 받았습니다.`, 'Warning');
                }

                return await response.json();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} JSON 파싱 오류: ${error}`, 'Error');
                } else {
                    syn.$l.eventLog('$w.fetchJson', `${finalUrl} Fetch 오류: ${error}`, 'Error');
                }
                return null;
            }
        },

        transactionObject(functionID, returnType = 'Json') {
            const jsonObject = {
                programID: '',
                businessID: '',
                systemID: '',
                transactionID: '',
                dataMapInterface: null,
                transactionResult: true,
                functionID: functionID,
                screenID: '',
                startTraceID: '',
                requestID: null,
                returnType: returnType,
                resultAlias: [],
                inputsItemCount: [],
                inputs: []
            };

            if (syn.$w.setServiceObject) syn.$w.setServiceObject(jsonObject);
            return jsonObject;
        },

        dynamicType: Object.freeze({
            DataSet: '0', Json: '1', Scalar: '2', NonQuery: '3',
            SQLText: '4', SchemeOnly: '5', CodeHelp: '6', Xml: '7', DynamicJson: '8'
        }),

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
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보 확인 필요', 'Error');
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
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보 확인 필요', 'Error');
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
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보 확인 필요', 'Error');
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
                        syn.$l.eventLog('$w.executeTransaction', '서비스 호출에 필요한 DomainAPIServer 정보 확인 필요', 'Error');
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
                    xhr.setRequestHeader('Server-SystemID', config.systemID || syn.Config.SystemID);
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
                                    syn.$l.eventLog('$w.executeTransaction', 'X-Requested 전송 오류', 'Fatal');
                                }
                                else {
                                    syn.$l.eventLog('$w.executeTransaction', '응답 상태 - {0}: '.format(xhr.statusText) + xhr.responseText, 'Error');
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
                                                syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                            }
                                        }
                                    }
                                    else {
                                        var errorText = transactionResponse.exceptionText;
                                        var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                        if (syn.$w.serviceClientException) {
                                            syn.$w.serviceClientException('요청오류', errorMessage, errorText);
                                        }
                                        syn.$l.eventLog('$w.executeTransaction', `거래 실행 오류: ${errorText}`, 'Warning');

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
                                                    callback([], null, transactionResponse.correlationID); // Pass correlationID even on error
                                                } catch (error) {
                                                    syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
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
                                                syn.$l.eventLog('$w.executeTransaction', `executeTransaction 오류: ${error}`, 'Error');
                                            }
                                        }

                                        try {
                                            callback(transactionResponse, null, transactionResponse.correlationID);
                                        } catch (error) {
                                            syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                var errorMessage = '거래: {0}, 기능: {1} 수행중 오류가 발생하였습니다\nGlobalID: {2}'.format(transactionRequest.transaction.transactionID, transactionRequest.transaction.functionID, transactionRequest.transaction.globalID);
                                if (syn.$w.serviceClientException) {
                                    syn.$w.serviceClientException('요청오류', errorMessage, error.stack);
                                }
                                syn.$l.eventLog('$w.executeTransaction', `executeTransaction 오류: ${error}`, 'Error');

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
                                            syn.$l.eventLog('$w.executeTransaction callback', `executeTransaction 콜백 오류: ${error}`, 'Error');
                                        }
                                    }
                                }
                            }

                            if (syn.$w.domainTransactionLoaderEnd) {
                                syn.$w.domainTransactionLoaderEnd();
                            }
                        }
                    }
                    syn.$l.eventLog('$w.executeTransaction', `거래 GlobalID: ${transactionRequest.transaction.globalID}`, 'Verbose');

                    xhr.setRequestHeader('X-Requested-With', 'HandStack ServiceClient');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.timeout = syn.Config.TransactionTimeout;
                    xhr.send(JSON.stringify(transactionRequest));
                }
            }
        },

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
                console.error('Node.js 환경설정 파일이 존재하지 않습니다. 파일 경로: {0}'.format(filePath));
            }
        }

        if (syn.Config && $string.isNullOrEmpty(syn.Config.DataSourceFilePath) == true) {
            syn.Config.DataSourceFilePath = path.join(process.cwd(), '..', 'modules', 'dbclient', 'module.json');
        }

        const browserOnlyMethods = [
            'activeControl', 'contentLoaded', 'addReadyCount', 'removeReadyCount', 'createSelection',
            'getTriggerOptions', 'scrollToTop', 'setFavicon', 'fileDownload', 'pseudoStyle', 'pseudoStyles',
            'isPageLoad', 'pageReadyTimeout', 'eventAddReady', 'eventRemoveReady', 'moduleReadyIntervalID',
            'remainingReadyIntervalID', 'remainingReadyCount', 'defaultControlOptions', 'mappingModule'
        ];
        browserOnlyMethods.forEach(method => { delete $webform[method]; });
    }
    else {
        const pathname = location.pathname;
        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            const filename = pathSegments[pathSegments.length - 1];
            const pageProject = pathSegments[pathSegments.length - 2] || '';
            const pageScript = '$' + (filename.includes('.') ? filename.substring(0, filename.indexOf('.')) : filename);
            $webform.extend({ pageProject, pageScript });
        }

        syn.$l.addEvent(context, 'load', () => {
            const mod = context[$webform.pageScript];
            mod?.hook?.windowLoad?.();
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
            el = syn.$l.getElement(el);
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

        requestReportValue(moduleID, pdfOptions, transactionOptions, callback) {
            var defaultPdfOptions = {
                REPORT_ID: '',
                COMPANY_NO: '',
                DOCUMENT_FORM_ID: '',
                DOCUMENT_NO: '',
                EMPLOYEE_NO: '',
                PRINT_TYPE: '',
                ENV: 'D'
            };

            if (syn.Config && syn.Config.Environment) {
                defaultPdfOptions.ENV = syn.Config.Environment.substring(0, 1);
            }

            pdfOptions = syn.$w.argumentsExtend(defaultPdfOptions, pdfOptions);

            const directObject = {
                programID: syn.Config.ApplicationID,
                businessID: transactionOptions.businessID || syn.Config.ProjectID || 'RPT',
                transactionID: transactionOptions.transactionID || pdfOptions.REPORT_ID,
                functionID: transactionOptions.functionID || 'PD01',
                dataMapInterface: transactionOptions.dataMapInterface || 'Row|Form',
                inputObjects: Object.entries(pdfOptions).map(([key, val]) => ({ prop: key, val }))
            };

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
                                            var message = 'moduleID: {0}, statementID: {1}- 쿼리 매핑 확인 필요'.format(moduleID, statementID);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }

                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1}- SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
                                            var message = 'moduleID: {0}, statementID: {1}- SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.end();
                                        var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.end();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
                                            var message = 'moduleID: {0}, statementID: {1}- SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.execute(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
                                                var message = 'moduleID: {0}, statementID: {1}- {2}'.format(moduleID, statementID, error.message);
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
