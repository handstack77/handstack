"use strict";

(function (root) {
    const MAX_VALUE = 0x7fffffff;

    // https://github.com/dchest/scrypt-async-js
    function SHA256(m) {
        const K = new Uint32Array([
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
            0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
            0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
            0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
            0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
            0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
            0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ]);

        let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
        let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
        const w = new Uint32Array(64);

        function blocks(p) {
            let off = 0, len = p.length;
            while (len >= 64) {
                let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7, u, i, j, t1, t2;

                for (i = 0; i < 16; i++) {
                    j = off + i * 4;
                    w[i] = ((p[j] & 0xff) << 24) | ((p[j + 1] & 0xff) << 16) |
                        ((p[j + 2] & 0xff) << 8) | (p[j + 3] & 0xff);
                }

                for (i = 16; i < 64; i++) {
                    u = w[i - 2];
                    t1 = ((u >>> 17) | (u << (32 - 17))) ^ ((u >>> 19) | (u << (32 - 19))) ^ (u >>> 10);

                    u = w[i - 15];
                    t2 = ((u >>> 7) | (u << (32 - 7))) ^ ((u >>> 18) | (u << (32 - 18))) ^ (u >>> 3);

                    w[i] = (((t1 + w[i - 7]) | 0) + ((t2 + w[i - 16]) | 0)) | 0;
                }

                for (i = 0; i < 64; i++) {
                    t1 = ((((((e >>> 6) | (e << (32 - 6))) ^ ((e >>> 11) | (e << (32 - 11))) ^
                        ((e >>> 25) | (e << (32 - 25)))) + ((e & f) ^ (~e & g))) | 0) +
                        ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;

                    t2 = ((((a >>> 2) | (a << (32 - 2))) ^ ((a >>> 13) | (a << (32 - 13))) ^
                        ((a >>> 22) | (a << (32 - 22)))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;

                    h = g;
                    g = f;
                    f = e;
                    e = (d + t1) | 0;
                    d = c;
                    c = b;
                    b = a;
                    a = (t1 + t2) | 0;
                }

                h0 = (h0 + a) | 0;
                h1 = (h1 + b) | 0;
                h2 = (h2 + c) | 0;
                h3 = (h3 + d) | 0;
                h4 = (h4 + e) | 0;
                h5 = (h5 + f) | 0;
                h6 = (h6 + g) | 0;
                h7 = (h7 + h) | 0;

                off += 64;
                len -= 64;
            }
        }

        blocks(m);

        let i, bytesLeft = m.length % 64,
            bitLenHi = (m.length / 0x20000000) | 0,
            bitLenLo = m.length << 3,
            numZeros = (bytesLeft < 56) ? 56 : 120,
            p = m.slice(m.length - bytesLeft, m.length);

        p.push(0x80);
        for (i = bytesLeft + 1; i < numZeros; i++) { p.push(0); }
        p.push((bitLenHi >>> 24) & 0xff);
        p.push((bitLenHi >>> 16) & 0xff);
        p.push((bitLenHi >>> 8) & 0xff);
        p.push((bitLenHi >>> 0) & 0xff);
        p.push((bitLenLo >>> 24) & 0xff);
        p.push((bitLenLo >>> 16) & 0xff);
        p.push((bitLenLo >>> 8) & 0xff);
        p.push((bitLenLo >>> 0) & 0xff);

        blocks(p);

        return [
            (h0 >>> 24) & 0xff, (h0 >>> 16) & 0xff, (h0 >>> 8) & 0xff, (h0 >>> 0) & 0xff,
            (h1 >>> 24) & 0xff, (h1 >>> 16) & 0xff, (h1 >>> 8) & 0xff, (h1 >>> 0) & 0xff,
            (h2 >>> 24) & 0xff, (h2 >>> 16) & 0xff, (h2 >>> 8) & 0xff, (h2 >>> 0) & 0xff,
            (h3 >>> 24) & 0xff, (h3 >>> 16) & 0xff, (h3 >>> 8) & 0xff, (h3 >>> 0) & 0xff,
            (h4 >>> 24) & 0xff, (h4 >>> 16) & 0xff, (h4 >>> 8) & 0xff, (h4 >>> 0) & 0xff,
            (h5 >>> 24) & 0xff, (h5 >>> 16) & 0xff, (h5 >>> 8) & 0xff, (h5 >>> 0) & 0xff,
            (h6 >>> 24) & 0xff, (h6 >>> 16) & 0xff, (h6 >>> 8) & 0xff, (h6 >>> 0) & 0xff,
            (h7 >>> 24) & 0xff, (h7 >>> 16) & 0xff, (h7 >>> 8) & 0xff, (h7 >>> 0) & 0xff
        ];
    }

    function PBKDF2_HMAC_SHA256_OneIter(password, salt, dkLen) {
        password = (password.length <= 64) ? password : SHA256(password);

        const innerLen = 64 + salt.length + 4;
        const inner = new Array(innerLen);
        const outerKey = new Array(64);

        let i;
        let dk = [];

        for (i = 0; i < 64; i++) { inner[i] = 0x36; }
        for (i = 0; i < password.length; i++) { inner[i] ^= password[i]; }
        for (i = 0; i < salt.length; i++) { inner[64 + i] = salt[i]; }
        for (i = innerLen - 4; i < innerLen; i++) { inner[i] = 0; }
        for (i = 0; i < 64; i++) outerKey[i] = 0x5c;
        for (i = 0; i < password.length; i++) outerKey[i] ^= password[i];

        function incrementCounter() {
            for (let i = innerLen - 1; i >= innerLen - 4; i--) {
                inner[i]++;
                if (inner[i] <= 0xff) return;
                inner[i] = 0;
            }
        }

        while (dkLen >= 32) {
            incrementCounter();
            dk = dk.concat(SHA256(outerKey.concat(SHA256(inner))));
            dkLen -= 32;
        }
        if (dkLen > 0) {
            incrementCounter();
            dk = dk.concat(SHA256(outerKey.concat(SHA256(inner))).slice(0, dkLen));
        }

        return dk;
    }

    // https://www.npmjs.com/package/scryptsy
    function blockmix_salsa8(BY, Yi, r, x, _X) {
        let i;

        arraycopy(BY, (2 * r - 1) * 16, _X, 0, 16);
        for (i = 0; i < 2 * r; i++) {
            blockxor(BY, i * 16, _X, 16);
            salsa20_8(_X, x);
            arraycopy(_X, 0, BY, Yi + (i * 16), 16);
        }

        for (i = 0; i < r; i++) {
            arraycopy(BY, Yi + (i * 2) * 16, BY, (i * 16), 16);
        }

        for (i = 0; i < r; i++) {
            arraycopy(BY, Yi + (i * 2 + 1) * 16, BY, (i + r) * 16, 16);
        }
    }

    function R(a, b) {
        return (a << b) | (a >>> (32 - b));
    }

    function salsa20_8(B, x) {
        arraycopy(B, 0, x, 0, 16);

        for (let i = 8; i > 0; i -= 2) {
            x[4] ^= R(x[0] + x[12], 7);
            x[8] ^= R(x[4] + x[0], 9);
            x[12] ^= R(x[8] + x[4], 13);
            x[0] ^= R(x[12] + x[8], 18);
            x[9] ^= R(x[5] + x[1], 7);
            x[13] ^= R(x[9] + x[5], 9);
            x[1] ^= R(x[13] + x[9], 13);
            x[5] ^= R(x[1] + x[13], 18);
            x[14] ^= R(x[10] + x[6], 7);
            x[2] ^= R(x[14] + x[10], 9);
            x[6] ^= R(x[2] + x[14], 13);
            x[10] ^= R(x[6] + x[2], 18);
            x[3] ^= R(x[15] + x[11], 7);
            x[7] ^= R(x[3] + x[15], 9);
            x[11] ^= R(x[7] + x[3], 13);
            x[15] ^= R(x[11] + x[7], 18);
            x[1] ^= R(x[0] + x[3], 7);
            x[2] ^= R(x[1] + x[0], 9);
            x[3] ^= R(x[2] + x[1], 13);
            x[0] ^= R(x[3] + x[2], 18);
            x[6] ^= R(x[5] + x[4], 7);
            x[7] ^= R(x[6] + x[5], 9);
            x[4] ^= R(x[7] + x[6], 13);
            x[5] ^= R(x[4] + x[7], 18);
            x[11] ^= R(x[10] + x[9], 7);
            x[8] ^= R(x[11] + x[10], 9);
            x[9] ^= R(x[8] + x[11], 13);
            x[10] ^= R(x[9] + x[8], 18);
            x[12] ^= R(x[15] + x[14], 7);
            x[13] ^= R(x[12] + x[15], 9);
            x[14] ^= R(x[13] + x[12], 13);
            x[15] ^= R(x[14] + x[13], 18);
        }

        for (let i = 0; i < 16; ++i) {
            B[i] += x[i];
        }
    }

    function blockxor(S, Si, D, len) {
        for (let i = 0; i < len; i++) {
            D[i] ^= S[Si + i]
        }
    }

    function arraycopy(src, srcPos, dest, destPos, length) {
        while (length--) {
            dest[destPos++] = src[srcPos++];
        }
    }

    function checkBufferish(o) {
        if (!o || typeof (o.length) !== 'number') { return false; }

        for (let i = 0; i < o.length; i++) {
            const v = o[i];
            if (typeof (v) !== 'number' || v % 1 || v < 0 || v >= 256) {
                return false;
            }
        }

        return true;
    }

    function ensureInteger(value, name) {
        if (typeof (value) !== "number" || (value % 1)) { throw new Error('invalid ' + name); }
        return value;
    }

    function _scrypt(password, salt, N, r, p, dkLen, callback) {

        N = ensureInteger(N, 'N');
        r = ensureInteger(r, 'r');
        p = ensureInteger(p, 'p');

        dkLen = ensureInteger(dkLen, 'dkLen');

        if (N === 0 || (N & (N - 1)) !== 0) { throw new Error('N must be power of 2'); }

        if (N > MAX_VALUE / 128 / r) { throw new Error('N too large'); }
        if (r > MAX_VALUE / 128 / p) { throw new Error('r too large'); }

        if (!checkBufferish(password)) {
            throw new Error('password must be an array or buffer');
        }
        password = Array.prototype.slice.call(password);

        if (!checkBufferish(salt)) {
            throw new Error('salt must be an array or buffer');
        }
        salt = Array.prototype.slice.call(salt);

        let b = PBKDF2_HMAC_SHA256_OneIter(password, salt, p * 128 * r);
        const B = new Uint32Array(p * 32 * r)
        for (let i = 0; i < B.length; i++) {
            const j = i * 4;
            B[i] = ((b[j + 3] & 0xff) << 24) |
                ((b[j + 2] & 0xff) << 16) |
                ((b[j + 1] & 0xff) << 8) |
                ((b[j + 0] & 0xff) << 0);
        }

        const XY = new Uint32Array(64 * r);
        const V = new Uint32Array(32 * r * N);

        const Yi = 32 * r;

        const x = new Uint32Array(16);
        const _X = new Uint32Array(16);

        const totalOps = p * N * 2;
        let currentOp = 0;
        let lastPercent10 = null;
        let stop = false;
        let state = 0;
        let i0 = 0, i1;
        let Bi;

        const limit = callback ? parseInt(1000 / r) : 0xffffffff;
        const nextTick = (typeof (setImmediate) !== 'undefined') ? setImmediate : setTimeout;
        const incrementalSMix = function () {
            if (stop) {
                return callback(new Error('cancelled'), currentOp / totalOps);
            }

            let steps;

            switch (state) {
                case 0:
                    Bi = i0 * 32 * r;

                    arraycopy(B, Bi, XY, 0, Yi);

                    state = 1;
                    i1 = 0;
                case 1:
                    steps = N - i1;
                    if (steps > limit) { steps = limit; }
                    for (let i = 0; i < steps; i++) {
                        arraycopy(XY, 0, V, (i1 + i) * Yi, Yi)
                        blockmix_salsa8(XY, Yi, r, x, _X);
                    }

                    // for (var i = 0; i < N; i++)
                    i1 += steps;
                    currentOp += steps;

                    if (callback) {
                        const percent10 = parseInt(1000 * currentOp / totalOps);
                        if (percent10 !== lastPercent10) {
                            stop = callback(null, currentOp / totalOps);
                            if (stop) { break; }
                            lastPercent10 = percent10;
                        }
                    }

                    if (i1 < N) { break; }

                    i1 = 0;
                    state = 2;
                case 2:
                    steps = N - i1;
                    if (steps > limit) { steps = limit; }
                    for (let i = 0; i < steps; i++) {
                        const offset = (2 * r - 1) * 16;
                        const j = XY[offset] & (N - 1);
                        blockxor(V, j * Yi, XY, Yi);
                        blockmix_salsa8(XY, Yi, r, x, _X);
                    }

                    i1 += steps;
                    currentOp += steps;

                    if (callback) {
                        const percent10 = parseInt(1000 * currentOp / totalOps);
                        if (percent10 !== lastPercent10) {
                            stop = callback(null, currentOp / totalOps);
                            if (stop) { break; }
                            lastPercent10 = percent10;
                        }
                    }

                    if (i1 < N) { break; }

                    arraycopy(XY, 0, B, Bi, Yi);

                    i0++;
                    if (i0 < p) {
                        state = 0;
                        break;
                    }

                    b = [];
                    for (let i = 0; i < B.length; i++) {
                        b.push((B[i] >> 0) & 0xff);
                        b.push((B[i] >> 8) & 0xff);
                        b.push((B[i] >> 16) & 0xff);
                        b.push((B[i] >> 24) & 0xff);
                    }

                    const derivedKey = PBKDF2_HMAC_SHA256_OneIter(password, b, dkLen);

                    if (callback) { callback(null, 1.0, derivedKey); }

                    return derivedKey;
            }

            if (callback) { nextTick(incrementalSMix); }
        }

        if (!callback) {
            while (true) {
                const derivedKey = incrementalSMix();
                if (derivedKey != undefined) { return derivedKey; }
            }
        }

        incrementalSMix();
    }

    const lib = {
        scrypt: function (password, salt, N, r, p, dkLen, progressCallback) {
            return new Promise(function (resolve, reject) {
                let lastProgress = 0;
                if (progressCallback) { progressCallback(0); }
                _scrypt(password, salt, N, r, p, dkLen, function (error, progress, key) {
                    if (error) {
                        reject(error);
                    } else if (key) {
                        if (progressCallback && lastProgress !== 1) {
                            progressCallback(1);
                        }
                        resolve(new Uint8Array(key));
                    } else if (progressCallback && progress !== lastProgress) {
                        lastProgress = progress;
                        return progressCallback(progress);
                    }
                });
            });
        },
        syncScrypt: function (password, salt, N, r, p, dkLen) {
            return new Uint8Array(_scrypt(password, salt, N, r, p, dkLen));
        }
    };

    if (typeof (exports) !== 'undefined') {
        module.exports = lib;

        // RequireJS/AMD
        // http://www.requirejs.org/docs/api.html
        // https://github.com/amdjs/amdjs-api/wiki/AMD
    } else if (typeof (define) === 'function' && define.amd) {
        define(lib);
    } else if (root) {
        if (root.scrypt) {
            root._scrypt = root.scrypt;
        }

        root.scrypt = lib;
    }

})(this);

(function (global) {
    'use strict';

    class HandStackLicenseValidator {
        constructor() {
            this.saltValue = 'handstack-salt-value';
            this.publisher = 'handstack.kr';
            this.allowedDomains = ['localhost', '127.0.0.1'];
            this.validationCache = new Map();
            this.validationCount = 0;
            this.maxValidationAttempts = 1000;
            this.algorithm = 'AES-CBC';
            this.keyDerivation = 'PBKDF2';
            this.hashAlgorithm = 'SHA-256';
            this.encoding = 'base64';
            this.currentUser = 'handstack';
        }

        async validateLicense(moduleId, options = {}) {
            try {
                const {
                    throwOnError = true,
                    enableCache = true,
                    customErrorMessage = null
                } = options;

                this.validationCount++;
                if (this.validationCount > this.maxValidationAttempts) {
                    const error = new Error('유효성 검사 시도 횟수가 너무 많습니다.');
                    if (throwOnError) throw error;
                    return { valid: false, error: error.message };
                }

                const cacheKey = `${moduleId}_${this.getCurrentDomain()}`;
                if (enableCache && this.validationCache.has(cacheKey)) {
                    const cached = this.validationCache.get(cacheKey);
                    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                        return cached.result;
                    }
                }

                const licenseVarName = this.moduleIdToVariableName(moduleId) + 'License';
                const licenseKey = global[licenseVarName];
                if (!licenseKey) {
                    const error = new Error(`라이선스를 찾을 수 없습니다: ${licenseVarName}이(가) 정의되지 않았습니다.`);
                    if (throwOnError) throw error;
                    return { valid: false, error: error.message };
                }

                const parsedLicense = this.parseLicenseKey(licenseKey);
                if (!parsedLicense.valid) {
                    const error = new Error(`잘못된 라이선스 형식: ${parsedLicense.error}`);
                    if (throwOnError) throw error;
                    return { valid: false, error: error.message };
                }

                const validationResult = await this.performLicenseValidation(
                    moduleId,
                    parsedLicense.encryptedKey,
                    parsedLicense.signKey
                );

                if (!validationResult.valid) {
                    const errorMessage = customErrorMessage || `라이선스 유효성 검사 실패: ${validationResult.reason}`;
                    const error = new Error(errorMessage);
                    if (throwOnError) throw error;
                    return { valid: false, error: errorMessage };
                }

                const domainResult = this.validateDomain(validationResult.data.allowedHosts);
                if (!domainResult.valid) {
                    const errorMessage = customErrorMessage || `도메인이 승인되지 않았습니다: ${domainResult.reason}`;
                    const error = new Error(errorMessage);
                    if (throwOnError) throw error;
                    return { valid: false, error: errorMessage };
                }

                const expirationResult = this.validateExpiration(validationResult.data.expiresAt);
                if (!expirationResult.valid) {
                    const errorMessage = customErrorMessage || `라이선스 만료: ${expirationResult.reason}`;
                    const error = new Error(errorMessage);
                    if (throwOnError) throw error;
                    return { valid: false, error: errorMessage };
                }

                const result = {
                    valid: true,
                    data: {
                        moduleId: moduleId,
                        company: validationResult.data.companyName,
                        environment: validationResult.data.environment,
                        createdAt: validationResult.data.createdAt,
                        expiresAt: validationResult.data.expiresAt,
                        allowedHosts: validationResult.data.allowedHosts,
                        currentDomain: this.getCurrentDomain(),
                        domainMatch: domainResult.matchType,
                        validatedAt: new Date().toISOString()
                    }
                };

                if (enableCache) {
                    this.validationCache.set(cacheKey, {
                        result: result,
                        timestamp: Date.now()
                    });
                }

                return result;

            } catch (error) {
                console.error('HandStackLicenseValidator 오류:', error.message);
                if (options.throwOnError !== false) {
                    throw error;
                }
                return { valid: false, error: error.message };
            }
        }

        moduleIdToVariableName(moduleId) {
            if (typeof moduleId !== 'string' || moduleId.trim() === '') {
                return '';
            }

            return moduleId
                .split(/[-_]/)
                .map((word, index) => {
                    if (index === 0) {
                        return word.toLowerCase();
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join('');
        }

        parseLicenseKey(licenseKey) {
            try {
                if (!licenseKey || typeof licenseKey !== 'string') {
                    return { valid: false, error: '라이선스 키가 문자열이 아닙니다.' };
                }

                const parts = licenseKey.split('.');
                if (parts.length !== 2) {
                    return { valid: false, error: '잘못된 라이선스 키 형식 (Key.SignKey 형식을 예상했습니다.)' };
                }

                const [encryptedKey, signKey] = parts;

                if (!encryptedKey || !signKey) {
                    return { valid: false, error: '암호화된 키 또는 서명이 누락되었습니다.' };
                }

                if (!this.isValidBase64(encryptedKey)) {
                    return { valid: false, error: '암호화된 키의 Base64 형식이 잘못되었습니다.' };
                }

                if (!/^[a-fA-F0-9]+$/.test(signKey)) {
                    return { valid: false, error: '잘못된 서명 형식입니다.' };
                }

                return {
                    valid: true,
                    encryptedKey: encryptedKey,
                    signKey: signKey
                };

            } catch (error) {
                return { valid: false, error: error.message };
            }
        }

        isValidBase64(str) {
            try {
                return btoa(atob(str)) === str;
            } catch (err) {
                return false;
            }
        }

        async performLicenseValidation(moduleId, encryptedKey, signKey) {
            try {
                let decodedData;
                try {
                    decodedData = atob(encryptedKey);
                } catch (error) {
                    return { valid: false, reason: '라이선스 키 디코딩에 실패했습니다.' };
                }

                if (!decodedData || decodedData.length < 20) {
                    return { valid: false, reason: '잘못된 라이선스 데이터 구조입니다.' };
                }

                if (signKey.length !== 64) {
                    return { valid: false, reason: '잘못된 서명 길이입니다.' };
                }

                const extractData = await this.extractLicenseData(decodedData, moduleId, signKey);
                if (extractData.error) {
                    return { valid: false, reason: extractData.error };
                }

                return {
                    valid: true,
                    data: extractData
                };

            } catch (error) {
                return { valid: false, reason: error.message };
            }
        }

        hexToUint8Array(hexString) {
            if (hexString.length % 2 !== 0) {
                throw new Error("Invalid hexString");
            }
            const a = [];
            for (let i = 0; i < hexString.length; i += 2) {
                a.push(parseInt(hexString.substr(i, 2), 16));
            }
            return new Uint8Array(a);
        }

        async extractLicenseData(decodedData, moduleId, signKey) {
            const [ivHex, encryptedDataHex] = decodedData.split(':');

            if (!ivHex || !encryptedDataHex) {
                throw new Error('Invalid encrypted key format');
            }

            const secretKeyBytes = new TextEncoder().encode(moduleId);
            const saltBytes = new TextEncoder().encode(this.saltValue);
            const keyBytes = await scrypt.scrypt(secretKeyBytes, saltBytes, 16384, 8, 1, 32);

            const ivBytes = this.hexToUint8Array(ivHex);
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: this.algorithm },
                false,
                ['decrypt']
            );

            const encryptedBytes = this.hexToUint8Array(encryptedDataHex);
            const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: ivBytes
                },
                cryptoKey,
                encryptedBytes
            );

            const decryptedData = new TextDecoder().decode(decryptedArrayBuffer);
            const expectedSignKey = await this.generateSignKey(decryptedData, this.saltValue);
            if (expectedSignKey !== signKey) {
                return { valid: false, reason: 'Invalid signature' };
            }

            const dataParts = decryptedData.split('|');
            const result = {
                companyName: dataParts[0],
                createdAt: dataParts[1],
                expiresAt: dataParts[2],
                environment: dataParts[3],
                allowedHosts: dataParts[4].split(',')
            };

            return result;
        }

        async generateSignKey(data, saltValue) {
            try {
                const combinedString = data + saltValue;
                const encoder = new TextEncoder();
                const dataBytes = encoder.encode(combinedString);
                const hashBuffer = await window.crypto.subtle.digest(this.hashAlgorithm, dataBytes);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray
                    .map(byte => byte.toString(16).padStart(2, '0'))
                    .join('');

                return hashHex;
            } catch (error) {
                console.error("SHA-256 해시 생성에 실패했습니다:", error);
                throw new Error(`Failed to generate SHA-256 hash: ${error.message}`);
            }
        }

        validateDomain(allowedHosts) {
            const currentDomain = this.getCurrentDomain();

            if (allowedHosts.includes(currentDomain)) {
                return { valid: true, matchType: '정확히 일치' };
            }

            const domainMatch = allowedHosts.find(allowedHost => {
                if (allowedHost.startsWith('*.')) {
                    const baseDomain = allowedHost.substring(2);
                    return currentDomain.endsWith('.' + baseDomain) || currentDomain === baseDomain;
                }
                return currentDomain.endsWith('.' + allowedHost);
            });

            if (domainMatch) {
                return { valid: true, matchType: '서브도메인', matchedHost: domainMatch };
            }

            return {
                valid: false,
                reason: `도메인 '${currentDomain}'이(가) 허용된 목록에 없습니다: ${allowedHosts.join(', ')}`
            };
        }

        validateExpiration(expiresAt) {
            if (!expiresAt) {
                return { valid: true, reason: '만료일 없음' };
            }

            const expiryDate = new Date(expiresAt);
            const now = new Date();

            if (expiryDate < now) {
                return {
                    valid: false,
                    reason: `라이선스가 ${expiryDate.toISOString()}에 만료되었습니다.`
                };
            }

            return { valid: true, reason: '만료되지 않음' };
        }

        getCurrentDomain() {
            if (typeof window !== 'undefined' && window.location) {
                return window.location.hostname;
            }
            return '알 수 없음';
        }

        clearCache() {
            this.validationCache.clear();
            this.validationCount = 0;
        }

        getValidationStats() {
            return {
                validationCount: this.validationCount,
                cacheSize: this.validationCache.size,
                maxAttempts: this.maxValidationAttempts
            };
        }
    }

    const validator = new HandStackLicenseValidator();

    async function validateHandStackLicense(moduleId, options = {}) {
        return await validator.validateLicense(moduleId, options);
    }

    async function validateMultipleLicenses(moduleIds, options = {}) {
        const results = {};
        for (const moduleId of moduleIds) {
            try {
                results[moduleId] = await validator.validateLicense(moduleId, {
                    ...options,
                    throwOnError: false
                });
            } catch (error) {
                results[moduleId] = { valid: false, error: error.message };
            }
        }

        return results;
    }

    function injectAntiDebugger(moduleId) {
        const licenseVarName = validator.moduleIdToVariableName(moduleId) + 'License';
        try {
            console.error(`${licenseVarName} 라이선스 확인이 필요합니다.`);
            (function functlon1(counter) {
                if (201 >= 200) {
                    try {
                        (function functionX() {
                            try {
                                (function functlon2() {
                                    if (Math.floor(Math.random() * 100000) % 5 == 0 && Math.floor(Math.random() * 100000) % 10 == 0) {
                                        (function () { }
                                        ['constructor']('debugger')());
                                    }
                                    functlon2();
                                }
                                )();
                            } catch (ax) {
                                setTimeout(functionX, /constructor/i.test(window.HTMLElement) || (function (p) {
                                    return p.toString() === '[object SafariRemoteNotification]';
                                }
                                )(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification)) ? 3500 : typeof InstallTrigger !== 'undefined' ? 4000 : !!window.chrome && !!window.chrome.webstore ? 1500 : (false || !!document.documentMode) ? (/msie /gi.test(navigator.userAgent.toLowerCase()) ? 1500 : 1500) : 1500);
                            }
                        }
                        )();
                    } catch (ax) {
                        setTimeout(function () {
                            console.error(`${licenseVarName} 라이선스 확인이 필요합니다.`);
                        }, 5000);
                    }
                } else {
                    functlon1(counter + 1);
                }
            }
            )(0)
        } catch (ax) {
            setTimeout(function () {
                console.error(`${licenseVarName} 라이선스 확인이 필요합니다.`);
            }, 5000);
        }
    }

    global.HandStackLicenseValidator = HandStackLicenseValidator;
    global.validateHandStackLicense = validateHandStackLicense;
    global.validateMultipleLicenses = validateMultipleLicenses;
    global.injectAntiDebugger = injectAntiDebugger;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            HandStackLicenseValidator,
            validateHandStackLicense,
            validateMultipleLicenses,
            injectAntiDebugger
        };
    }

})(typeof window !== 'undefined' ? window : global);
