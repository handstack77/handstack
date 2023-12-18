'use strict';
let $requests = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$k.version;
            syn.$l.get('txt_params').value = JSON.stringify(syn.$r.params);

            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
            }, 200);
        }
    },

    method: {
        customValidation(options) {
            console.log(options);
            return syn.$l.get('txt_custom').value.trim() != '';
        }
    },

    event: {
        btn_query_click() {
            syn.$l.get('txt_query').value = syn.$r.query('param1');
        },

        btn_query_url_click() {
            syn.$l.get('txt_query').value = syn.$r.query('param1', '/page.html?param1=hello world&param2=url');
        },

        btn_url_click() {
            syn.$r.params.p1 = 'aaa';
            syn.$r.params.p2 = 'bbb';
            syn.$r.params.p3 = 'ccc';
            syn.$l.get('txt_url').value = syn.$r.url();
        },

        btn_toQueryString_click() {
            var json = JSON.parse(syn.$l.get('txt_toQueryString_json').value);
            syn.$l.get('txt_toQueryString').value = syn.$r.toQueryString(json);
        },

        btn_toQueryString_isQuestion_click() {
            var json = JSON.parse(syn.$l.get('txt_toQueryString_json').value);
            syn.$l.get('txt_toQueryString').value = syn.$r.toQueryString(json, true);
        },

        btn_toUrlObject_click() {
            syn.$l.get('txt_toUrlObject').value = JSON.stringify(syn.$r.toUrlObject());
        },

        btn_toUrlObject_url_click() {
            syn.$l.get('txt_toUrlObject').value = JSON.stringify(syn.$r.toUrlObject('/page.html?param1=hello world&param2=url'));
        },

        async btn_isCorsEnabled_click() {
            syn.$l.get('txt_isCorsEnabled').value = await syn.$r.isCorsEnabled('sample.json');
        },

        btn_getCookie_click() {
            syn.$l.get('txt_getCookie').value = syn.$r.getCookie('Cookie');
        },

        btn_setCookie_click() {
            syn.$r.setCookie('Cookie', 'hello world');
            syn.$l.get('txt_setCookie').value = '완료';
        },

        btn_deleteCookie_click() {
            syn.$r.deleteCookie('Cookie');
            syn.$l.get('txt_deleteCookie').value = '완료';
        }
    }
};
