'use strict';
let $extension_object = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
            }, 200);
        }
    },

    event: {
        btn_isNullOrUndefined_click() {
            syn.$l.get('txt_isNullOrUndefined').value = `${$object.isNullOrUndefined('')}, ${$object.isNullOrUndefined(undefined)}, ${$object.isNullOrUndefined(null)}, ${$object.isNullOrUndefined({})}`;
        },

        btn_toCSV_click() {
            syn.$l.get('txt_toCSV').value = $object.toCSV([{ a: 1, b: 2 }, { a: 3, b: 4, c: 5 }, { a: 6 }, { b: 7 }], ['a', 'b'], ';');
        },

        btn_toParameterString_click() {
            var json = {
                symbol: 'hello world1',
                price: 12345,
                date: new Date(),
                boolean: true
            };

            syn.$l.get('txt_toParameterString').value = $object.toParameterString(json);
        },

        btn_getType_click() {
            syn.$l.get('txt_getType').value = `${$object.getType('')}, ${$object.getType(12345)}, ${$object.getType(true)}, ${$object.getType({})}, ${$object.getType(new Date())}, ${$object.getType(null)}, ${$object.getType(syn.$l.get('txt_getType'))}`;
        },

        btn_defaultValue_click() {
            syn.$l.get('txt_defaultValue').value = `${$object.defaultValue('string')}, ${$object.defaultValue('bool')}, ${$object.defaultValue('date')}, ${$object.defaultValue('number')}`;
        },

        btn_isDefined_click() {
            syn.$l.get('txt_valueType').value = $object.isDefined(undefined);
        },

        btn_isNull_click() {
            syn.$l.get('txt_valueType').value = $object.isNull(null);
        },

        btn_isArray_click() {
            syn.$l.get('txt_valueType').value = $object.isArray([]);
        },

        btn_isDate_click() {
            syn.$l.get('txt_valueType').value = $object.isDate(new Date());
        },

        btn_isString_click() {
            syn.$l.get('txt_valueType').value = $object.isString('');
        },

        btn_isNumber_click() {
            syn.$l.get('txt_valueType').value = $object.isNumber(12345);
        },

        btn_isFunction_click() {
            syn.$l.get('txt_valueType').value = $object.isFunction(() => { });
        },

        btn_isObject_click() {
            syn.$l.get('txt_valueType').value = $object.isObject({});
        },

        btn_isObjectEmpty_click() {
            syn.$l.get('txt_valueType').value = $object.isObjectEmpty({});
        },

        btn_isBoolean_click() {
            syn.$l.get('txt_valueType').value = $object.isBoolean(false);
        },

        btn_isEmpty_click() {
            syn.$l.get('txt_isEmpty').value = $object.isEmpty([]);
        },
    },
};
