'use strict';
let $crytography = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$d.version;
        }
    },

    event: {
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

        btn_sha256_click() {
            syn.$l.get('txt_sha256Result').value = syn.$c.sha256(syn.$l.get('txt_sha256').value);
        },

        btn_encrypt_click() {
            syn.$l.get('txt_encryptResult').value = syn.$c.encrypt(syn.$l.get('txt_encrypt').value);
        },

        btn_decrypt_click() {
            syn.$l.get('txt_decryptResult').value = syn.$c.decrypt(syn.$l.get('txt_decrypt').value);
        },

        btn_LZStringEncode_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.compressToBase64(syn.$l.get('txt_LZString').value);
        },

        btn_LZStringDecode_click() {
            syn.$l.get('txt_LZStringResult').value = syn.$c.LZString.decompressFromBase64(syn.$l.get('txt_LZString').value);
        }
    }
};
