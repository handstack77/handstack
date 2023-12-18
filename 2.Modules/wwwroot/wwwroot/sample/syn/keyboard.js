'use strict';
let $keyboard = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$k.version;

            syn.$l.addEvent('txt_version', 'keypress', (evt) => {
                console.log(evt.keyCode);
            });
        }
    },

    event: {
        btn_setElement_click() {
            syn.$k.setElement('txt_setElement');
            syn.$l.get('txt_setElement').value = '설정 되었습니다';
        },

        btn_addKeyCode_click() {
            syn.$k.setElement('txt_setElement');
            syn.$k.addKeyCode('keydown', syn.$k.keyCodes.a, function (evt) {
                alert(evt.keyCode);
            });

            syn.$k.addKeyCode('keyup', syn.$k.keyCodes.c, function (evt) {
                alert(evt.keyCode);
            });
        },

        removeKeyCode_click() {
            syn.$k.setElement('txt_setElement');
            syn.$k.removeKeyCode('keydown', syn.$k.keyCodes.a);
        }
    }
};
