'use strict';
let rsaKeyPair = null;
let hmacSignature = '';
let aesEncryptedData = null;

let $cryptography = {
    extends: [
        'parsehtml'
    ],

    event: {
        btn_isWebCryptoSupported_click() {
            syn.$l.get('txt_isWebCryptoSupportedResult').value = syn.$c.isWebCryptoSupported();
        },

        btn_base64Encode_click() {
            syn.$l.get('txt_base64EncodeResult').value = syn.$c.base64Encode(syn.$l.get('txt_base64Encode').value);
        },

        btn_base64Decode_click() {
            syn.$l.get('txt_base64DecodeResult').value = syn.$c.base64Decode(syn.$l.get('txt_base64Decode').value);
        },

        btn_utf8Encode_click() {
            syn.$l.get('txt_utf8EncodeResult').value = syn.$c.utf8Encode(syn.$l.get('txt_utf8Encode').value);
        },

        btn_utf8Decode_click() {
            syn.$l.get('txt_utf8DecodeResult').value = syn.$c.utf8Decode(syn.$l.get('txt_utf8Decode').value);
        },

        btn_padKey_click() {
            var key = syn.$l.get('txt_padKey').value;
            var length = parseInt(syn.$l.get('txt_padKeyLength').value, 10) || 16;
            var padded = syn.$c.padKey(key, length);
            syn.$l.get('txt_padKeyResult').value = padded ? Array.from(padded).join(',') : '';
        },

        btn_convertToBuffer_click() {
            var values = syn.$l.get('txt_convertToBuffer').value.split(',').map(Number);
            var buffer = syn.$c.convertToBuffer(values);
            syn.$l.get('txt_convertToBufferResult').value = Array.from(new Uint8Array(buffer)).join(',');
        },

        btn_sha_click() {
            var message = syn.$l.get('txt_sha').value;
            var algorithm = syn.$l.get('txt_shaAlgorithm').value || 'SHA-1';
            syn.$c.sha(message, algorithm).then((result) => {
                syn.$l.get('txt_shaResult').value = result;
            });
        },

        btn_sha256_click() {
            syn.$l.get('txt_sha256Result').value = syn.$c.sha256(syn.$l.get('txt_sha256').value);
        },

        btn_generateHMAC_click() {
            var key = syn.$l.get('txt_hmacKey').value;
            var message = syn.$l.get('txt_hmacMessage').value;
            syn.$c.generateHMAC(key, message).then((signature) => {
                hmacSignature = signature;
                syn.$l.get('txt_hmacResult').value = signature;
            });
        },

        btn_verifyHMAC_click() {
            var key = syn.$l.get('txt_hmacKey').value;
            var message = syn.$l.get('txt_hmacMessage').value;
            syn.$c.verifyHMAC(key, message, hmacSignature).then((isValid) => {
                syn.$l.get('txt_hmacResult').value = isValid ? '검증 성공' : '검증 실패';
            });
        },

        btn_generateRSAKey_click() {
            syn.$c.generateRSAKey().then((cryptoKey) => {
                rsaKeyPair = cryptoKey;
                return Promise.all([
                    syn.$c.exportCryptoKey(cryptoKey.publicKey, true),
                    syn.$c.exportCryptoKey(cryptoKey.privateKey, false)
                ]);
            }).then(([publicPem, privatePem]) => {
                syn.$l.get('txt_rsaPublicKey').value = publicPem;
                syn.$l.get('txt_rsaPrivateKey').value = privatePem;
            });
        },

        btn_importRSAKey_click() {
            var publicPem = syn.$l.get('txt_rsaPublicKey').value;
            var privatePem = syn.$l.get('txt_rsaPrivateKey').value;
            Promise.all([
                syn.$c.importCryptoKey(publicPem, true),
                syn.$c.importCryptoKey(privatePem, false)
            ]).then(([publicKey, privateKey]) => {
                rsaKeyPair = { publicKey: publicKey, privateKey: privateKey };
                alert('PEM 문자열로부터 CryptoKey를 가져왔습니다.');
            });
        },

        btn_rsaEncode_click() {
            if (!rsaKeyPair) {
                alert('먼저 RSA 키를 생성해 주세요.');
                return;
            }
            var text = syn.$l.get('txt_rsaText').value;
            syn.$c.rsaEncode(text, rsaKeyPair.publicKey).then((encrypted) => {
                syn.$l.get('txt_rsaResult').value = encrypted;
            });
        },

        btn_rsaDecode_click() {
            if (!rsaKeyPair) {
                alert('먼저 RSA 키를 생성해 주세요.');
                return;
            }
            var encrypted = syn.$l.get('txt_rsaResult').value;
            syn.$c.rsaDecode(encrypted, rsaKeyPair.privateKey).then((decrypted) => {
                syn.$l.get('txt_rsaResult').value = decrypted;
            });
        },

        btn_generateIV_click() {
            var key = syn.$l.get('txt_ivKey').value;
            var iv = syn.$c.generateIV(key, 16);
            syn.$l.get('txt_ivResult').value = Array.from(iv).join(',');
        },

        btn_aesEncode_click() {
            var text = syn.$l.get('txt_aesText').value;
            var key = syn.$l.get('txt_aesKey').value;
            syn.$c.aesEncode(text, key).then((result) => {
                aesEncryptedData = result;
                syn.$l.get('txt_aesResult').value = JSON.stringify(result);
            });
        },

        btn_aesDecode_click() {
            var key = syn.$l.get('txt_aesKey').value;
            if (!aesEncryptedData) {
                try {
                    aesEncryptedData = JSON.parse(syn.$l.get('txt_aesResult').value);
                } catch (e) {
                    alert('먼저 AES 암호화를 실행해 주세요.');
                    return;
                }
            }
            syn.$c.aesDecode(aesEncryptedData, key).then((decrypted) => {
                syn.$l.get('txt_aesResult').value = decrypted;
            });
        },

        btn_encrypt_click() {
            syn.$l.get('txt_encryptResult').value = syn.$c.encrypt(syn.$l.get('txt_encrypt').value, syn.$l.get('txt_encryptKey').value);
        },

        btn_decrypt_click() {
            syn.$l.get('txt_encryptResult').value = syn.$c.decrypt(syn.$l.get('txt_encryptResult').value, syn.$l.get('txt_encryptKey').value);
        },

        btn_LZStringCompress_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.compress(syn.$l.get('txt_LZString').value);
        },

        btn_LZStringCompressBase64_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.compressToBase64(syn.$l.get('txt_LZString').value);
        },

        btn_LZStringCompressUTF16_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.compressToUTF16(syn.$l.get('txt_LZString').value);
        },

        btn_LZStringCompressURI_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.compressToEncodedURIComponent(syn.$l.get('txt_LZString').value);
        },

        btn_LZStringDecompressBase64_click() {
            syn.$l.get('txt_LZStringDecompressResult').value = syn.$c.LZString.decompressFromBase64(syn.$l.get('txt_LZStringDecompress').value);
        },

        btn_LZStringDecompressUTF16_click() {
            syn.$l.get('txt_LZStringDecompressResult').value = syn.$c.LZString.decompressFromUTF16(syn.$l.get('txt_LZStringDecompress').value);
        },

        btn_LZStringDecompressURI_click() {
            syn.$l.get('txt_LZStringDecompressResult').value = syn.$c.LZString.decompressFromEncodedURIComponent(syn.$l.get('txt_LZStringDecompress').value);
        }
    }
};
