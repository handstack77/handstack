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
            syn.$l.get('txt_toCSV').value = $object.toCSV([{ a: 1, b: 2 }, { a: 3, b: 4, c: 5 }, { a: 6 }, { b: 7 }], { delimiter: ';' });
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

        btn_clone_click() {
            var source = { a: 1, b: { c: 2 } };
            var cloned = $object.clone(source);
            cloned.b.c = 99;
            syn.$l.get('txt_clone').value = `source: ${JSON.stringify(source)}, cloned: ${JSON.stringify(cloned)}`;
        },

        btn_extend_click() {
            var to = { a: 1, nested: { x: 1 } };
            var from = { a: 2, b: 3, nested: { y: 2 } };
            syn.$l.get('txt_extend').value = JSON.stringify($object.extend(to, from));
        },

        btn_excludeKeys_click() {
            var source = { a: 1, b: 2, c: 3 };
            syn.$l.get('txt_excludeKeys').value = JSON.stringify($object.excludeKeys(source, ['b']));
        },

        btn_parseJsonValue_integer_click() {
            syn.$l.get('txt_parseJsonValue').value = $object.parseJsonValue('123', 'integer');
        },

        btn_parseJsonValue_boolean_click() {
            syn.$l.get('txt_parseJsonValue').value = $object.parseJsonValue('Y', 'boolean');
        },

        btn_parseJsonValue_array_click() {
            syn.$l.get('txt_parseJsonValue').value = $object.parseJsonValue('[1,2,3]', 'array');
        },
    },
};
