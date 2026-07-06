'use strict';
let $keyboard = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_keyCodes').value = JSON.stringify(syn.$k.keyCodes);
            syn.$l.get('txt_keyNames').value = JSON.stringify(syn.$k.keyNames);
            syn.$l.get('txt_targetEL').value = syn.$k.targetEL ? syn.$k.targetEL.id : '';
            syn.$l.get('txt_elements').value = JSON.stringify(Object.keys(syn.$k.elements));
        }
    },

    event: {
        btn_setElement_click() {
            syn.$k.setElement('txt_setElement');
            syn.$l.get('txt_setElement').value = '설정 되었습니다';

            syn.$l.get('txt_targetEL').value = syn.$k.targetEL ? syn.$k.targetEL.id : '';
            syn.$l.get('txt_elements').value = JSON.stringify(Object.keys(syn.$k.elements));
        },

        btn_addKeyCode_click() {
            syn.$k.setElement('txt_setElement');
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.a, function (evt) {
                alert(evt.keyCode);
            });

            syn.$k.addKeyCode('keyup', syn.$k.keyCodes.c, function (evt) {
                alert(evt.keyCode);
            });

            syn.$l.get('txt_elements').value = JSON.stringify(Object.keys(syn.$k.elements));
        },

        btn_removeKeyCode_click() {
            syn.$k.setElement('txt_setElement');
            syn.$k.removeKeyCode('keydown', syn.$k.keyCodes.a);
        },

        btn_getKeyCode_click() {
            syn.$l.get('txt_getKeyCode').value = syn.$k.getKeyCode('KeyA');
        }
    }
};
