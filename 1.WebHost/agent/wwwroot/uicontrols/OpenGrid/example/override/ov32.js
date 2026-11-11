'use strict';

(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var hostID = 'grdOv32_component';

    on('grdOv32_mount', 'click', function () {
        if (byId(hostID).childElementCount) { log('OV-32: 이미 마운트되어 있습니다'); return; }
        $opengrid.controlLoad(hostID, { columns: [['MemberName', '이름', 120, false, 'text']] });
        $opengrid.setValue(hostID, sampleMembers(5));
        log('OV-32: 컴포넌트 마운트(그리드 생성)');
    });
    on('grdOv32_unmount', 'click', function () {
        var g = $opengrid.getGridControl(hostID);
        if (!g) { log('OV-32: 마운트된 그리드가 없습니다'); return; }
        g.destroy();
        byId(hostID).innerHTML = '';
        log('OV-32: 컴포넌트 언마운트 → grid.destroy() 실행(리스너/오버라이드/차트 자동 정리)');
    });
})();
