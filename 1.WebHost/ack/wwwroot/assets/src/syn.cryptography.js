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
