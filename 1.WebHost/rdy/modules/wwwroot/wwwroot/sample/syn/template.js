'use strict';
let $template = {
    extends: [
        'parsehtml'
    ],
    hook: {
        pageLoad() {
            // const fpPromise = FingerprintJS.load();
            // 
            // fpPromise
            //     .then(fp => fp.get())
            //     .then(result => console.log(result));
        }
    },
    event: {
        btnBase64Encode_click() {
            syn.$l.get('txtBase64Encode').value = syn.$c.base64Encode(syn.$l.get('txtBase64Encode').value);
        },
        btnBase64Decode_click() {
            syn.$l.get('txtBase64Decode').value = syn.$c.base64Decode(syn.$l.get('txtBase64Decode').value);
        },
        btnUtf8Encode_click() {
            syn.$l.get('txtUtf8Encode').value = syn.$c.utf8Encode(syn.$l.get('txtUtf8Encode').value);
        },
        btnUtf8Decode_click() {
            syn.$l.get('txtUtf8Decode').value = syn.$c.utf8Decode(syn.$l.get('txtUtf8Decode').value);
        },
    },
};
