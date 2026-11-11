'use strict';
let $practical = {
    prop: {
        format: 'YYYY-MM-DD HH:mm'
    },

    method: {
        // 'YYYY-MM-DD HH:mm' 문자열을 moment 로 해석한다. 값이 없거나 형식이 맞지 않으면 null 을 돌려준다.
        parse(elID) {
            let value = syn.uicontrols.$datepicker.getValue(elID);
            let parsed = moment(value, $this.prop.format, true);
            return parsed.isValid() == true ? parsed : null;
        },

        // 시작/종료 일시로 이용 시간을 계산해 카드 머리글에 표시한다.
        refreshDuration() {
            let startedAt = $this.method.parse('dtpStartedAt');
            let endedAt = $this.method.parse('dtpEndedAt');
            let label = syn.$l.get('spnDuration');

            if (startedAt == null || endedAt == null) {
                label.innerText = '이용 시간을 선택하세요';
                return;
            }

            let minutes = endedAt.diff(startedAt, 'minutes');
            if (minutes <= 0) {
                label.innerText = '종료 일시가 시작 일시보다 빠릅니다';
                return;
            }

            let days = Math.floor(minutes / 1440);
            let hours = Math.floor((minutes % 1440) / 60);
            let remain = minutes % 60;
            label.innerText = `이용 시간 ${days > 0 ? days + '일 ' : ''}${hours}시간${remain > 0 ? ' ' + remain + '분' : ''}`;
        },

        setPeriod(startedAt, endedAt) {
            // useRangeSelect 로 걸려 있는 시작/종료 제한을 먼저 풀어야 이전 값과 무관하게 새 기간을 지정할 수 있다.
            syn.uicontrols.$datepicker.getControl('dtpStartedAt').picker.setMaxDate(null);
            syn.uicontrols.$datepicker.getControl('dtpEndedAt').picker.setMinDate(new Date());

            syn.uicontrols.$datepicker.setValue('dtpStartedAt', startedAt.format($this.prop.format));
            syn.uicontrols.$datepicker.setValue('dtpEndedAt', endedAt.format($this.prop.format));
            $this.method.refreshDuration();
        },

        validate() {
            if (syn.uicontrols.$textbox.getValue('txtTitle') == '') {
                syn.$w.alert('회의 제목 항목은 반드시 입력 해야합니다.');
                return false;
            }

            let startedAt = $this.method.parse('dtpStartedAt');
            let endedAt = $this.method.parse('dtpEndedAt');
            if (startedAt == null || endedAt == null) {
                syn.$w.alert('시작 일시와 종료 일시를 모두 선택 해야합니다.');
                return false;
            }

            if (endedAt.isAfter(startedAt) == false) {
                syn.$w.alert('종료 일시는 시작 일시보다 늦어야 합니다.');
                return false;
            }

            if (startedAt.isBefore(moment()) == true) {
                syn.$w.alert('이미 지난 시간은 예약할 수 없습니다.');
                return false;
            }

            return true;
        },

        save() {
            if ($this.method.validate() == false) {
                return;
            }

            let data = {
                Title: syn.uicontrols.$textbox.getValue('txtTitle'),
                StartedAt: syn.uicontrols.$datepicker.getValue('dtpStartedAt'),
                EndedAt: syn.uicontrols.$datepicker.getValue('dtpEndedAt'),
                PersonCount: Number(syn.uicontrols.$textbox.getValue('txtPersonCount') || 1),
                RepeatUntil: syn.uicontrols.$datepicker.getValue('dtpRepeatUntil')
            };

            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', `${data.StartedAt} ~ ${data.EndedAt} 예약을 신청했습니다.`);
        },

        reset() {
            syn.uicontrols.$textbox.clear('txtTitle');
            syn.uicontrols.$textbox.setValue('txtPersonCount', 2);
            ['dtpStartedAt', 'dtpEndedAt', 'dtpRepeatUntil'].forEach((id) => {
                syn.uicontrols.$datepicker.clear(id);
            });
            $this.method.refreshDuration();
            syn.$l.get('preResult').innerText = '예약 신청 버튼을 누르면 입력 내용이 JSON 으로 표시됩니다.';
        }
    },

    event: {
        dtpStartedAt_onselect() {
            $this.method.refreshDuration();
        },

        dtpEndedAt_onselect() {
            $this.method.refreshDuration();
        },

        btnQuick1_click() {
            let startedAt = moment().hour(14).minute(0).second(0);
            $this.method.setPeriod(startedAt, startedAt.clone().add(1, 'hours'));
        },

        btnQuick2_click() {
            let startedAt = moment().add(1, 'days').hour(10).minute(0).second(0);
            $this.method.setPeriod(startedAt, startedAt.clone().add(2, 'hours'));
        },

        btnQuick3_click() {
            let startedAt = moment().add(7, 'days').hour(9).minute(0).second(0);
            $this.method.setPeriod(startedAt, startedAt.clone().add(1, 'hours'));
        },

        btnSave_click() {
            $this.method.save();
        },

        btnReset_click() {
            $this.method.reset();
        }
    }
}
