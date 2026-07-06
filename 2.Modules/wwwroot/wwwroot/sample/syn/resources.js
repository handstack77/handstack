'use strict';
let $resources = {
    prop: {
    },

    hook: {
        pageLoad() {
            syn.$l.get('txt_localeID').value = syn.$res.localeID;
            syn.$l.get('txt_fullyQualifiedLocale').value = JSON.stringify(syn.$res.fullyQualifiedLocale);
            $resources.method.refreshState();
        }
    },

    method: {
        refreshState() {
            syn.$l.get('txt_translations').value = JSON.stringify(syn.$res.translations, null, 2);
            syn.$l.get('txt_translateControls').value = JSON.stringify(syn.$res.translateControls, null, 2);
        }
    },

    event: {
        btn_add_click() {
            var id = syn.$l.get('txt_add_id').value;
            var val = syn.$l.get('txt_add_val').value;
            syn.$res.add(id, val);
            $resources.method.refreshState();
        },

        btn_remove_click() {
            var id = syn.$l.get('txt_remove_id').value;
            syn.$res.remove(id);
            $resources.method.refreshState();
        },

        btn_interpolate_click() {
            var message = syn.$l.get('txt_interpolate_message').value;
            var interpolations = JSON.parse(syn.$l.get('txt_interpolate_json').value);
            syn.$l.get('txt_interpolate_result').value = syn.$res.interpolate(message, interpolations);
        },

        btn_getControl_click() {
            var el = syn.$l.get('txt_getControl_el').value;
            var control = syn.$res.getControl(el);
            syn.$l.get('txt_getControl_result').value = JSON.stringify(control, null, 2);
        },

        btn_translatePage_click() {
            syn.$res.translatePage();
            $resources.method.refreshState();
        },

        btn_translateElement_click() {
            var el = syn.$l.get('txt_translateElement_el').value;
            syn.$res.translateElement(el);
        },

        btn_translateControl_click() {
            var control = syn.$res.getControl('demo_greeting');
            var text = syn.$res.translateText(control);
            syn.$res.translateControl(control);
            syn.$l.get('txt_translateControl_result').value = 'translateText() 결과: ' + text + '\ntranslateControl() 실행 완료 (demo_greeting 요소에 반영됨)';
        },

        btn_getBindSource_click() {
            var bindSource = syn.$l.get('sel_getBindSource').value;
            var result = syn.$res.getBindSource({ bindSource: bindSource });
            syn.$l.get('txt_getBindSource_result').value = result;
        }
    }
};
