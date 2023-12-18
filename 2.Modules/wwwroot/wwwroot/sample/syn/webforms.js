'use strict';
let $webforms = {
    extends: [
        'parsehtml'
    ],

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
        },
    },

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
        }
    },

    event: {
        btn_setStorage_sessionStorage_click() {
            syn.$w.setStorage('storageKey1', 'hello world');
            syn.$w.setStorage('storageKey2', 12345);
            syn.$w.setStorage('storageKey3', new Date());
            syn.$w.setStorage('storageKey4', true);
            syn.$w.setStorage('storageKey5', { key: 'hello world' });

            syn.$l.get('txt_setStorage').value = 'sessionStorage 저장';
        },

        btn_setStorage_localStorage_click() {
            syn.$w.setStorage('storageKey1', 'hello world', true);
            syn.$w.setStorage('storageKey2', 12345, true);
            syn.$w.setStorage('storageKey3', new Date(), true);
            syn.$w.setStorage('storageKey4', true, true);
            syn.$w.setStorage('storageKey5', { key: 'hello world' }, true);

            syn.$l.get('txt_setStorage').value = 'localStorage 저장';
        },

        btn_getStorage_sessionStorage_click() {
            var storageKey1 = syn.$w.getStorage('storageKey1');
            var storageKey2 = syn.$w.getStorage('storageKey2');
            var storageKey3 = syn.$w.getStorage('storageKey3');
            var storageKey4 = syn.$w.getStorage('storageKey4');
            var storageKey5 = syn.$w.getStorage('storageKey5');

            syn.$l.get('txt_getStorage').value = `sessionStorage storageKey1: ${storageKey1}, storageKey2: ${storageKey2}, storageKey3: ${storageKey3}, storageKey4: ${storageKey4}, storageKey5: ${storageKey5}`;
        },

        btn_getStorage_localStorage_click() {
            var storageKey1 = syn.$w.getStorage('storageKey1', true);
            var storageKey2 = syn.$w.getStorage('storageKey2', true);
            var storageKey3 = syn.$w.getStorage('storageKey3', true);
            var storageKey4 = syn.$w.getStorage('storageKey4', true);
            var storageKey5 = syn.$w.getStorage('storageKey5', true);

            syn.$l.get('txt_getStorage').value = `localStorage storageKey1: ${storageKey1}, storageKey2: ${storageKey2}, storageKey3: ${storageKey3}, storageKey4: ${storageKey4}, storageKey5: ${storageKey5}`;
        },

        btn_removeStorage_sessionStorage_click() {
            syn.$w.removeStorage('storageKey1');
            syn.$w.removeStorage('storageKey2');
            syn.$w.removeStorage('storageKey3');
            syn.$w.removeStorage('storageKey4');
            syn.$w.removeStorage('storageKey5');

            syn.$l.get('txt_removeStorage').value = `sessionStorage 삭제`;
        },

        btn_removeStorage_localStorage_click() {
            syn.$w.removeStorage('storageKey1', true);
            syn.$w.removeStorage('storageKey2', true);
            syn.$w.removeStorage('storageKey3', true);
            syn.$w.removeStorage('storageKey4', true);
            syn.$w.removeStorage('storageKey5', true);

            syn.$l.get('txt_removeStorage').value = `localStorage 삭제`;
        },

        btn_activeControl_click() {
            var el = syn.$w.activeControl();
            syn.$l.get('txt_activeControl').value = el.outerHTML;
        },

        btn_argumentsExtend_click() {
            var parameter = {
                aaaa: 1234,
                bbbb: '2222'
            };

            var extend = syn.$w.argumentsExtend({
                aaaa: 0,
                bbbb: '',
                cccc: false
            }, parameter);

            extend.bbbb = 'hello world';

            syn.$l.get('txt_argumentsExtend').value = JSON.stringify(extend);
        },

        btn_getterValue_click() {
            var result = syn.$w.getterValue('GD01');
            syn.$l.get('txt_getterValue').value = JSON.stringify(result);
        },

        btn_setterValue_click() {
            var dataSet = [{
                setStorage: 'setStorage',
                getStorage: 'getStorage',
                removeStorage: 'removeStorage',
                activeControl: 'activeControl',
                argumentsExtend: 'argumentsExtend',
                getterValue: 'getterValue'
            }];

            var result = syn.$w.setterValue('GD01', dataSet);
            syn.$l.get('txt_setterValue').value = JSON.stringify(result);
        },

        btn_scrollToTop_click() {
            syn.$w.scrollToTop();
        },

        btn_setFavicon_click() {
            syn.$w.setFavicon('/img/logo.ico');
        },

        btn_fileDownload_click() {
            var url = syn.$l.get('txt_fileDownload').value;
            syn.$w.fileDownload(url, 'download.txt');
        },

        async btn_apiHttp_get_click() {
            var result = await syn.$w.apiHttp('sample.json').send();
            syn.$l.get('txt_apiHttp').value = JSON.stringify(result);
        },

        async btn_apiHttp_post_click() {
            var result = await syn.$w.apiHttp('sample.json').send({
                applicationID: 'programID',
                projectID: 'businessID',
                transactionID: 'transactionID',
                serviceID: 'functionID'
            });
            syn.$l.get('txt_apiHttp').value = JSON.stringify(result);
        },

        async btn_apiHttp_form_click() {
            var formData = new FormData();
            formData.append('field', 'data');

            var result = await syn.$w.apiHttp('sample.json').send(formData);
            syn.$l.get('txt_apiHttp').value = JSON.stringify(result);
        },

        btn_loadScript_click() {
            var url = syn.$l.get('txt_loadScript').value;
            syn.$w.loadScript(url);
            alert(`url: ${url} 요청 완료`);
        },

        btn_loadStyle_click() {
            var url = syn.$l.get('txt_loadStyle').value;
            syn.$w.loadStyle(url);
            alert(`url: ${url} 요청 완료`);
        },

        async btn_fetchText_click() {
            var url = syn.$l.get('txt_loadStyle').value;
            syn.$l.get('txt_fetchText').value = await syn.$w.fetchText(url);
        },

        async btn_fetchJson_click() {
            var result = await syn.$w.fetchJson('sample.json');
            syn.$l.get('txt_fetchJson').value = JSON.stringify(result);
        }
    }
};
