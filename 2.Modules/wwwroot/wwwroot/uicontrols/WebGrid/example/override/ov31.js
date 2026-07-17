'use strict';

whenGridReady('grdOv31', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv31';

    $opengrid.setValue(id, sampleMembers(3));
    on(id + '_register', 'click', function () {
        if (window.OpenGrid && window.OpenGrid.defaultOverride) {
            window.OpenGrid.defaultOverride('getDisplayValue', function (orig, r, f) { return f === 'MemberName' ? '(global) ' + orig(r, f) : orig(r, f); });
            log('OV-31: 전역 defaultOverride 등록 완료');
        } else {
            log('OV-31: OpenGrid.defaultOverride 를 찾을 수 없습니다(엔진 로딩 대기 중일 수 있음)');
        }
    });
    on(id + '_create', 'click', function () {
        var tempID = id + '_scratch2';
        var host = document.createElement('div');
        host.id = tempID;
        host.style.cssText = 'width:200px;height:120px;';
        byId(id).parentNode.appendChild(host);
        $opengrid.controlLoad(tempID, { columns: [['MemberName', '이름', 120, false, 'text']] });
        $opengrid.setValue(tempID, sampleMembers(3));
        log('OV-31: 새로 만든 그리드에도 전역 기본 오버라이드가 자동 적용됩니다(아래 새 그리드의 이름 앞 "(global)" 확인)');
    });
});
