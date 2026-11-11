'use strict';
let $leaverequest = {
    method: {
        // 실무 코드에서 흔히 보이는 방식: 두 날짜 문자열을 $date.parseDate로 Date 객체로 바꾼 뒤 $date.diff로 일수를 구한다.
        // (raw Date 비교나 getValue 문자열을 그대로 빼는 대신 항상 $date 헬퍼를 거친다)
        recalcLeaveDays() {
            var startDate = syn.uicontrols.$datepicker.getValue('dtpStartDate');
            var endDate = syn.uicontrols.$datepicker.getValue('dtpEndDate');

            if ($string.isNullOrEmpty(startDate) == false && $string.isNullOrEmpty(endDate) == false) {
                var diffDay = $date.diff($date.parseDate(startDate), $date.parseDate(endDate));
                syn.$l.get('txtLeaveDays').value = diffDay + 1;
            }
        }
    },

    event: {
        dtpStartDate_change() {
            $this.method.recalcLeaveDays();
        },

        dtpEndDate_change() {
            $this.method.recalcLeaveDays();
        },

        btnSave_click() {
            // 실무 코드의 저장 전 필수값 검증 패턴: getValue가 빈 문자열이면 alert 후 저장을 막는다.
            if (syn.uicontrols.$datepicker.getValue('dtpStartDate') == '') {
                syn.$w.alert('휴가 시작일 항목은 반드시 입력해야 합니다.');
                return;
            }

            if (syn.uicontrols.$datepicker.getValue('dtpEndDate') == '') {
                syn.$w.alert('휴가 종료일 항목은 반드시 입력해야 합니다.');
                return;
            }

            syn.$l.eventLog('btnSave_click', '{0} ~ {1}, {2}일 신청'.format(
                syn.uicontrols.$datepicker.getValue('dtpStartDate'),
                syn.uicontrols.$datepicker.getValue('dtpEndDate'),
                syn.$l.get('txtLeaveDays').value
            ));
        }
    }
}
