'use strict';
let $features = {
    method: {
        show(title, text) {
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text);
        }
    },

    event: {
        // intro.js 투어에만 연결되는 이벤트들이다(툴팁/입력창 안내/도움말에는 연결되지 않는다).
        hlpMain_change(targetElement) {
            syn.$l.eventLog('hlpMain_change', `단계 전환: ${targetElement && targetElement.id ? '#' + targetElement.id : ''}`);
        },

        hlpMain_beforechange(targetElement) {
            syn.$l.eventLog('hlpMain_beforechange', '단계 전환 직전');
        },

        hlpMain_afterchange(targetElement) {
            syn.$l.eventLog('hlpMain_afterchange', '단계 전환 완료');
        },

        hlpMain_beforeexit() {
            syn.$l.eventLog('hlpMain_beforeexit', '투어 종료 직전');
        },

        hlpMain_exit() {
            syn.$l.eventLog('hlpMain_exit', '투어 종료(완료 또는 중간 종료)');
        },

        hlpMain_complete() {
            syn.$l.eventLog('hlpMain_complete', '투어를 끝까지 마쳤습니다.');
        },

        btnStart_click() {
            syn.uicontrols.$guide.introStart('hlpMain');
        },

        // contentType 이 html 이므로 subject/sentence 로 만든 HTML 이 팝업 창에 표시된다.
        btnHelp_click() {
            syn.uicontrols.$guide.openUIHelp('hlpMain');
        },

        btnControl_click() {
            let control = syn.uicontrols.$guide.getGuideControl('hlpMain');
            $this.method.show('btnControl_click', `항목 ${control.items.length}개, 툴팁 ${control.tooltip ? control.tooltip.length : 0}개, 투어 ${control.intro ? '있음' : '없음'}, 입력창 안내 ${control.placeholder ? control.placeholder.length : 0}개`);
        },

        // 서버 응답 등으로 안내 항목을 동적으로 바꿀 때 사용한다. 기존 구성은 모두 정리된다.
        btnRefresh_click() {
            syn.uicontrols.$guide.dataRefresh('hlpMain', [
                { helpType: 'I', selector: '#btnQuery', subject: '교체된 안내 1', sentence: 'dataRefresh 로 항목을 새로 구성했습니다.', sortingNo: 1 },
                { helpType: 'I', selector: '#btnExport', subject: '교체된 안내 2', sentence: '두 번째 단계입니다.', sortingNo: 2 }
            ]);
            $this.method.show('btnRefresh_click', '안내 항목을 2개의 투어 단계로 교체했습니다. introStart 로 확인하세요.');
        },

        btnClear_click() {
            syn.uicontrols.$guide.clear('hlpMain');
            $this.method.show('btnClear_click', '툴팁, 투어, 입력창 안내를 모두 해제했습니다.');
        }
    }
}
