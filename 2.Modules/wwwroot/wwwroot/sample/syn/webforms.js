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
        },

        // transactionAction()/transaction()이 완료되면 결과를 데모 화면에 표시합니다.
        // 백엔드가 연결되어 있지 않으면 error 값이 채워지는 것이 정상입니다.
        afterTransaction(error, functionID, result, additionalData, correlationID) {
            var el = syn.$l.get('txt_transactionAction');
            if (el) {
                el.value = error ? `오류: ${error}` : `거래(${functionID}) 완료: ${JSON.stringify(result)}`;
            }
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

        btn_getStorageKeys_sessionStorage_click() {
            syn.$w.setStorage('storageKeysDemo1', 'a');
            syn.$w.setStorage('storageKeysDemo2', 'b');
            var keys = syn.$w.getStorageKeys();
            syn.$l.get('txt_getStorageKeys').value = `sessionStorage 키: ${JSON.stringify(keys)}`;
        },

        btn_getStorageKeys_localStorage_click() {
            syn.$w.setStorage('storageKeysDemo1', 'a', true);
            syn.$w.setStorage('storageKeysDemo2', 'b', true);
            var keys = syn.$w.getStorageKeys(true);
            syn.$l.get('txt_getStorageKeys').value = `localStorage 키: ${JSON.stringify(keys)}`;
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

        btn_contentLoaded_click() {
            syn.$l.get('txt_contentLoaded').value = `pageScript: ${syn.$w.pageScript}, isPageLoad: ${syn.$w.isPageLoad}`;
        },

        btn_getTriggerOptions_click() {
            var el = syn.$l.get('btn_getTriggerOptions');
            el.setAttribute('triggerOptions', JSON.stringify({ demo: true, value: 123 }));
            var options = syn.$w.getTriggerOptions(el);
            syn.$l.get('txt_getTriggerOptions').value = JSON.stringify(options);
        },

        btn_triggerAction_click() {
            syn.$w.triggerAction({
                triggerID: 'btn_scrollToTop',
                action: 'click',
                params: { arguments: [], options: {} }
            });
            syn.$l.get('txt_triggerAction').value = 'btn_scrollToTop 클릭 이벤트를 간접 실행했습니다.';
        },

        btn_getControlModule_click() {
            var mod = syn.$w.getControlModule('syn.$l');
            syn.$l.get('txt_getControlModule').value = mod ? `syn.$l 모듈 참조 반환됨 (typeof: ${typeof mod})` : '모듈을 찾을 수 없음';
        },

        btn_tryAddFunction_click() {
            syn.$w.tryAddFunction($webforms.transaction.GD01);
            var count = (window.$this && window.$this.config && window.$this.config.transactions) ? window.$this.config.transactions.length : 0;
            syn.$l.get('txt_tryAddFunction').value = `등록된 거래 함수 수: ${count}`;
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

        btn_transactionAction_click() {
            // 주의: 실제 HandStack 백엔드/거래 모듈이 연결되어 있어야 정상 응답을 받습니다.
            // 백엔드 없이 실행하면 hook.afterTransaction으로 오류 메시지가 전달되는 것이 정상입니다.
            syn.$l.get('txt_transactionAction').value = '거래 요청을 전송했습니다...';
            syn.$w.transactionAction('GD01', { message: '거래 실행 중...' });
        },

        async btn_transactionDirect_click() {
            // 주의: 실제 HandStack 백엔드/거래 모듈이 연결되어 있어야 정상 응답을 받습니다.
            try {
                var result = await syn.$w.transactionDirect({
                    functionID: 'GD01',
                    transactionID: 'GD01',
                    inputObjects: {}
                });
                syn.$l.get('txt_transactionDirect').value = JSON.stringify(result);
            } catch (e) {
                syn.$l.get('txt_transactionDirect').value = `오류: ${e.message}`;
            }
        },

        btn_transactionObject_click() {
            var obj = syn.$w.transactionObject('GD01');
            syn.$l.get('txt_transactionObject').value = JSON.stringify(obj);
        },

        btn_scrollToTop_click() {
            syn.$w.scrollToTop();
        },

        btn_scrollToElement_click() {
            syn.$w.scrollToElement('#anchor_bottom', 80);
        },

        btn_setFavicon_click() {
            syn.$w.setFavicon('/img/logo.ico');
        },

        btn_fileDownload_click() {
            var url = syn.$l.get('txt_fileDownload').value;
            syn.$w.fileDownload(url, 'download.txt');
        },

        async btn_sleep_click() {
            syn.$l.get('txt_sleep').value = '대기 중...';
            await syn.$w.sleep(1500);
            syn.$l.get('txt_sleep').value = '1.5초 대기 완료';
        },

        btn_purge_click() {
            var wrapper = document.createElement('div');
            wrapper.id = 'purge_demo_temp';
            wrapper.innerHTML = '<button type="button" onclick="alert(1)">클릭 안내</button>';
            document.body.appendChild(wrapper);

            var before = typeof wrapper.firstChild.onclick;
            syn.$w.purge(wrapper);
            var after = typeof wrapper.firstChild.onclick;
            document.body.removeChild(wrapper);

            syn.$l.get('txt_purge').value = `제거 전 onclick 타입: ${before}, 제거 후 onclick 타입: ${after}`;
        },

        btn_setServiceObject_click() {
            syn.$w.setServiceObject({ demo: true, createdAt: new Date().toISOString() });
            syn.$l.get('txt_setServiceObject').value = syn.$w.serviceObject;
        },

        btn_setServiceClientHeader_click() {
            var xhr = syn.$w.xmlHttp();
            xhr.open('GET', location.href, true);
            var result = syn.$w.setServiceClientHeader(xhr);
            syn.$l.get('txt_setServiceClientHeader').value = `xmlHttp() 인스턴스 생성 및 setServiceClientHeader() 반환값: ${result}`;
        },

        btn_xmlParser_click() {
            var xmlDoc = syn.$w.xmlParser('<root><item>hello world</item></root>');
            syn.$l.get('txt_xmlParser').value = xmlDoc ? xmlDoc.getElementsByTagName('item')[0].textContent : '파싱 실패';
        },

        async btn_apiHttp_w_click() {
            var result = await syn.$w.apiHttp('sample.json').send();
            syn.$l.get('txt_apiHttp_w').value = JSON.stringify(result);
        },

        async btn_apiHttp_get_click() {
            var result = await syn.$r.httpFetch('sample.json').send();
            syn.$l.get('txt_apiHttp').value = JSON.stringify(result);
        },

        async btn_apiHttp_post_click() {
            var result = await syn.$r.httpFetch('sample.json').send({
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

            var result = await syn.$r.httpFetch('sample.json').send(formData);
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

        btn_addCssRule_click() {
            syn.$w.addCssRule('#txt_addCssRule { color: red; font-weight: bold; }', 'webforms-demo-style');
            syn.$l.get('txt_addCssRule').value = '규칙 추가됨: 이 텍스트가 빨간색으로 보이면 성공';
        },

        btn_removeCssRule_click() {
            syn.$w.removeCssRule('#txt_addCssRule', 'webforms-demo-style');
            syn.$l.get('txt_addCssRule').value = '규칙 제거됨: 색상이 원래대로 돌아옵니다';
        },

        btn_pseudoStyle_click() {
            syn.$w.pseudoStyle('webforms_pseudo_demo', '#txt_pseudoStyle', 'background-color: yellow;');
            syn.$l.get('txt_pseudoStyle').value = '배경색이 노란색으로 적용되었는지 확인하세요';
        },

        btn_pseudoStyles_click() {
            syn.$w.pseudoStyles('webforms_pseudo_demo', [
                { selector: '#txt_pseudoStyle', cssText: 'background-color: #cfe8ff;' },
                { selector: '#txt_pseudoStyles', cssText: 'border: 2px dashed #3399ff;' }
            ]);
            syn.$l.get('txt_pseudoStyles').value = '여러 스타일 규칙이 한번에 적용되었습니다';
        },

        async btn_fetchText_click() {
            var url = syn.$l.get('txt_loadStyle').value;
            syn.$l.get('txt_fetchText').value = await syn.$w.fetchText(url);
        },

        async btn_fetchJson_click() {
            var result = await syn.$w.fetchJson('sample.json');
            syn.$l.get('txt_fetchJson').value = JSON.stringify(result);
        },

        btn_loadJson_click() {
            syn.$w.loadJson('sample.json', null, function (setting, json) {
                syn.$l.get('txt_loadJson').value = JSON.stringify(json);
            });
        },

        async btn_fetchImage_click() {
            try {
                var img = await syn.$w.fetchImage('/img/logo.ico', '/img/logo.ico');
                syn.$l.get('txt_fetchImage').value = `이미지 로드 성공: ${img.src}`;
            } catch (e) {
                syn.$l.get('txt_fetchImage').value = `이미지 로드 실패: ${e}`;
            }
        },

        btn_startIntersection_click() {
            var count = 0;
            syn.$w.startIntersection('webforms_demo_scroll', '#intersection_placeholder', function (done) {
                count++;
                syn.$l.get('txt_intersection').value = `추가 로드 트리거 횟수: ${count}`;
                done(count >= 3);
            }, { root: syn.$l.get('intersection_container') });
            syn.$l.get('txt_intersection').value = 'Intersection 관찰 시작됨. 위 영역을 스크롤하세요.';
        },

        btn_stopIntersection_click() {
            syn.$w.stopIntersection('webforms_demo_scroll');
            syn.$l.get('txt_intersection').value = 'Intersection 관찰 중지됨';
        },

        btn_stopAllIntersections_click() {
            syn.$w.stopAllIntersections();
            syn.$l.get('txt_intersection').value = '모든 Intersection 관찰 중지됨';
        }
    }
};
