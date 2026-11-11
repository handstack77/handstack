'use strict';

whenGridReady('grdOv04', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv04';

    $opengrid.setValue(id, sampleMembers(8));
    grid.override('deleteRow', function (orig, rowIndex) {
        if (!window.confirm('정말 삭제하시겠습니까?')) { log('OV-04: 삭제 취소'); return; }
        log('OV-04: 권한 확인 통과 → 삭제');
        return orig(rowIndex);
    });
    on(id + '_del', 'click', function () { grid.deleteRow(0); });
});
