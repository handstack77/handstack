'use strict';
let $search = {
    hook: {
        pageLoad() {
            // 실무 목록 화면은 syn-options의 value:'month:-3' 같은 기본 기간이 이미 채워진 상태에서
            // 별도 조작 없이 pageLoad 시점에 바로 첫 조회를 실행하는 경우가 많다.
            $this.method.search();
        }
    },

    method: {
        search() {
            // 실무 코드는 컨트롤의 getValue API보다, 컨트롤이 만들어낸 두 입력창(_StartedAt/_EndedAt)의
            // 값을 문자열 그대로 비교하는 방식을 더 많이 사용한다(YYYY-MM-DD 포맷이라 문자열 비교로 충분).
            var startDate = syn.$l.get('dtpOrderDate_StartedAt').value.trim();
            var endDate = syn.$l.get('dtpOrderDate_EndedAt').value.trim();

            if (startDate == '' || endDate == '') {
                syn.$w.alert('조회 기간을 입력 하세요');
                return;
            }

            if (startDate > endDate) {
                syn.$w.alert('종료 일은 시작 일보다 이전 일 수 없습니다.');
                return;
            }

            syn.$l.eventLog('search', startDate + ' ~ ' + endDate + ' 조회');
        }
    },

    event: {
        btnSearch_click() {
            $this.method.search();
        }
    }
}
