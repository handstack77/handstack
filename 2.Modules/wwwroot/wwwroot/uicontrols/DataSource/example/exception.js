'use strict';
let $exception = {
    // 실무 코드의 hook.afterTransaction(error, functionID, responseData) 콜백을 흉내 낸 헬퍼.
    // 실제 화면에서는 서버가 내려준 값이 $this.store.Exception에 이미 채워져 있는 상태로 호출된다.
    method: {
        afterTransaction() {
            if ($string.toBoolean($this.store.Exception.Error) == false) {
                syn.$w.notify('success', '저장 되었습니다');
            }
            else {
                syn.$w.alert($this.store.Exception.Message);
                syn.$l.eventLog('afterTransaction', 'MD01: ' + JSON.stringify($this.store.Exception), 'Warning');
            }

            // 실무 코드에서는 확인 처리(알림/모달 표시) 직후 트랜잭션마다 저장소를 비워
            // 다음 트랜잭션에서 이전 오류가 남아있지 않도록 한다.
            syn.uicontrols.$data.clear('srcException');
        }
    },

    event: {
        btnSimulateSuccess_click() {
            // 서버 응답이 정상이면 Exception 저장소는 애초에 채워지지 않는다(Error: false 그대로).
            $this.method.afterTransaction();
        },

        btnSimulateFail_click() {
            // 서버가 저장 실패 응답을 내려준 상황을 흉내 낸다. 실제로는 이 값들이
            // transaction.MD01.outputs의 { type: 'Form', dataFieldID: 'Exception' } 항목을 통해 채워진다.
            $this.store.Exception.Error = true;
            $this.store.Exception.Level = 'Error';
            $this.store.Exception.Message = '그룹코드가 이미 사용 중입니다 (unique 제약 위반)';
            $this.store.Exception.StackTrace = 'at BDL.MD01.Execute()';

            $this.method.afterTransaction();
        }
    }
}
