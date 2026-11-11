'use strict';

whenGridReady('grdOv14', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv14';

    $opengrid.setValue(id, sampleMembers(10));
    grid.override('deleteById', function (orig, memberNo) {
        var idx = $opengrid.getRowIndexByValue(id, 'MemberNo', memberNo);
        if (idx == null || idx < 0) { log('OV-14: MemberNo=' + memberNo + ' 없음'); return false; }
        grid.deleteRow(idx);
        log('OV-14: deleteById(' + memberNo + ') → 삭제 완료');
        return true;
    });
    on(id + '_del', 'click', function () { grid.deleteById(Number(byId(id + '_id').value)); });
});
