'use strict';
let $extension_string = {
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
        btn_toValue_click() {
            syn.$l.get('txt_toValue').value = `${$string.toValue('hello world')}, ${$string.toValue(new Date())}, ${$string.toValue({})}, ${$string.toValue(true)}, ${$string.toValue(null, 'default')}`;
        },

        btn_br_click() {
            syn.$l.get('txt_br').value = $string.br('hello\nworld');
        },

        btn_interpolate_click() {
            var json = {
                symbol: 'hello world',
                price: 12345,
                date: new Date(),
                boolean: true
            };

            syn.$l.get('txt_interpolate').value = $string.interpolate(`<span>#{symbol}</span> <span>#{price}</span> <span>#{date}</span> <span>#{boolean}</span>`, json);
        },

        btn_interpolates_click() {
            var json = [
                {
                    symbol: 'hello world1',
                    price: 12345,
                    date: new Date(),
                    boolean: true
                },
                {
                    symbol: 'hello world2',
                    price: 12345,
                    date: new Date(),
                    boolean: true
                },
                {
                    symbol: 'hello world3',
                    price: 12345,
                    date: new Date(),
                    boolean: true
                }
            ];

            syn.$l.get('txt_interpolate').value = $string.interpolate(`<span>#{symbol}</span> <span>#{price}</span> <span>#{date}</span> <span>#{boolean}</span>`, json);
        },

        btn_isNullOrEmpty_click() {
            syn.$l.get('txt_isNullOrEmpty').value = `${$string.isNullOrEmpty('')}, ${$string.isNullOrEmpty(undefined)}, ${$string.isNullOrEmpty(null)}, ${$string.isNullOrEmpty({})}`;
        },

        btn_sanitizeHTML_click() {
            syn.$l.get('txt_sanitizeHTML').value = $string.sanitizeHTML('<label class="form-label">$string.isNullOrEmpty()</label>');
        },

        btn_cleanHTML_click() {
            syn.$l.get('txt_cleanHTML').value = $string.cleanHTML('<label class="form-label">$string.isNullOrEmpty()</label>');
        },

        btn_toHtmlChar_click() {
            syn.$l.get('txt_toHtmlChar').value = $string.toHtmlChar('<label class="form-label">$string.isNullOrEmpty()</label>');
        },

        btn_toCharHtml_click() {
            syn.$l.get('txt_toCharHtml').value = $string.toCharHtml('&lt;label class="form-label"&gt;$string.isNullOrEmpty()&lt;/label&gt;');
        },

        btn_length_click() {
            syn.$l.get('txt_length').value = $string.length('안녕하세요 hello world');
        },

        btn_split_click() {
            syn.$l.get('txt_split').value = JSON.stringify($string.split('1,2,3,4,5', ','));
        },

        btn_isNumber_click() {
            syn.$l.get('txt_isNumber').value = $string.isNumber('-12,345.123');
        },

        btn_toNumber_click() {
            syn.$l.get('txt_toNumber').value = $string.toNumber('-12,345.123');
        },

        btn_capitalize_click() {
            syn.$l.get('txt_capitalize').value = $string.capitalize('aaa bbb ccc');
        },

        btn_toJson_click() {
            var json = $string.toJson('col1;col2\na;b\nc;d', {
                delimeter: ';'
            });
            syn.$l.get('txt_toJson').value = JSON.stringify(json);
        },

        btn_toParameterObject_click() {
            var json = $string.toParameterObject('@Name1:Value1;@Name2:Value2;@Name3:Value3');
            syn.$l.get('txt_toParameterObject').value = JSON.stringify(json);
        },

        btn_toBoolean_click() {
            syn.$l.get('txt_toBoolean').value = `${$string.toBoolean('true')}, ${$string.toBoolean('True')}, ${$string.toBoolean('TRUE')}, ${$string.toBoolean('Y')}, ${$string.toBoolean('1')}, ${$string.toBoolean(true)}`;
        },

        btn_toDynamic_click() {
            syn.$l.get('txt_toDynamic').value = `${$string.toDynamic('true')}, ${$string.toDynamic('')}, ${$string.toDynamic('', true)}, ${$string.toDynamic('12345')}, ${$string.toDynamic('2023-12-11T04:45:56.558Z')}`;
        },

        btn_toParseType_click() {
            syn.$l.get('txt_toParseType').value = `${$string.toParseType('true', 'bool')}, ${$string.toParseType('')}, ${$string.toParseType('12345', 'number')}, ${$string.toParseType('2023-12-11T04:45:56.558Z', 'date')}`;
        },

        btn_toNumberString_click() {
            syn.$l.get('txt_toNumberString').value = $string.toNumberString('f-1,234.12');
        },
    }
};
