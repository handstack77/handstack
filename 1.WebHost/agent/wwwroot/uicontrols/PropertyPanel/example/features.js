'use strict';
let $features = {
    prop: {
        replaceData: { ServiceName: 'billing-api', Port: 9000, UseSsl: true, LogLevel: 'Warning', ThemeColor: '#2fb344', Environment: 'Staging', RetryPolicy: { count: 5, delaySeconds: 10 }, Satisfaction: 2 }
    },

    method: {
        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, (key, value) => { return typeof value == 'function' ? '[function]' : value; }, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        }
    },

    event: {
        // 값이 바뀔 때마다 (element, name, value, control) 로 호출된다(callback 옵션).
        ppMain_change(element, name, value, control) {
            syn.$l.eventLog('ppMain_change', `${name} = ${JSON.stringify(value)}`);
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$propertypanel.getValue('ppMain'));
        },

        btnSetValue_click() {
            syn.uicontrols.$propertypanel.setValue('ppMain', $this.prop.replaceData);
        },

        btnSetMeta_click() {
            syn.uicontrols.$propertypanel.setValue('ppMain', { Name: '새 항목', Count: 10, Enabled: true }, {
                Name: { name: '이름', group: '기본' },
                Count: { name: '개수', group: '기본', type: 'number', options: { min: 0, max: 100, step: 5 } },
                Enabled: { name: '사용', group: '상태' }
            });
        },

        btnClear_click() {
            syn.uicontrols.$propertypanel.clear('ppMain');
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$propertypanel.getControl('ppMain');
            $this.method.show('btnGetControl_click', `id: ${control.id}, 속성 수: ${Object.keys(control.fields || {}).length}`);
        },

        btnInfer_click() {
            let samples = [true, 12, 'text', '#ff8800', { a: 1 }, null, function () { }];
            $this.method.show('btnInfer_click', samples.map((value) => {
                return `${typeof value == 'function' ? 'function' : JSON.stringify(value)} -> ${syn.uicontrols.$propertypanel.inferType(value)}`;
            }).join('\n'));
        }
    }
}
