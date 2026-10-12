'use strict';
let $practical = {
    prop: {
        defaults: { UseNotify: true, Channel: 'EMAIL', Email: 'admin@example.com', DailyLimit: 50, QuietStart: '22:00', QuietEnd: '07:00', Priority: 3, BadgeColor: '#d63939', Keywords: ['긴급', '결제'] },
        saved: null
    },

    hook: {
        pageComplete() {
            $this.prop.saved = syn.uicontrols.$propertypanel.getValue('ppSetting');
            $this.method.refreshChanges();
        }
    },

    method: {
        // 마지막으로 저장한 값과 현재 값을 비교해 바뀐 항목만 모은다.
        changes() {
            let current = syn.uicontrols.$propertypanel.getValue('ppSetting');
            let result = [];
            Object.keys(current).forEach((key) => {
                if (JSON.stringify(current[key]) != JSON.stringify($this.prop.saved[key])) {
                    result.push({ key: key, before: $this.prop.saved[key], after: current[key] });
                }
            });

            return result;
        },

        refreshChanges() {
            let changes = $this.method.changes();
            syn.$l.get('spnDirty').innerText = changes.length == 0 ? '변경 없음' : `${changes.length}개 항목 변경`;
            syn.$l.get('spnDirty').classList.toggle('text-danger', changes.length > 0);
            syn.$l.get('preChanges').textContent = changes.length == 0
                ? '변경된 항목이 없습니다.'
                : changes.map((item) => { return `${item.key}: ${JSON.stringify(item.before)} → ${JSON.stringify(item.after)}`; }).join('\n');
        },

        validate(setting) {
            if (setting.UseNotify == true && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(setting.Email || '') == false) {
                syn.$w.alert('수신 이메일 형식을 확인 하세요.');
                return false;
            }

            if (Number(setting.DailyLimit) < 1 || Number(setting.DailyLimit) > 500) {
                syn.$w.alert('일일 최대 건수는 1~500 사이여야 합니다.');
                return false;
            }

            if (/^([01]\d|2[0-3]):[0-5]\d$/.test(setting.QuietStart) == false || /^([01]\d|2[0-3]):[0-5]\d$/.test(setting.QuietEnd) == false) {
                syn.$w.alert('방해 금지 시간은 HH:mm 형식으로 입력 하세요.');
                return false;
            }

            return true;
        }
    },

    event: {
        // 값이 바뀔 때마다 변경 내역을 갱신한다. 알림을 끄면 나머지 항목은 의미가 없음을 안내한다.
        ppSetting_change(element, name, value, control) {
            $this.method.refreshChanges();
            if (name == 'UseNotify') {
                syn.$l.eventLog('ppSetting_change', value == true ? '알림을 사용합니다.' : '알림을 끄면 아래 설정은 적용되지 않습니다.');
            }
        },

        btnSave_click() {
            let setting = syn.uicontrols.$propertypanel.getValue('ppSetting');
            if ($this.method.validate(setting) == false) {
                return;
            }

            $this.prop.saved = setting;
            $this.method.refreshChanges();
            syn.$l.get('preResult').textContent = JSON.stringify(setting, null, 2);
            syn.$l.eventLog('save', '알림 설정을 저장했습니다.');
        },

        btnDefault_click() {
            syn.uicontrols.$propertypanel.setValue('ppSetting', Object.assign({}, $this.prop.defaults));
            $this.method.refreshChanges();
        }
    }
}
