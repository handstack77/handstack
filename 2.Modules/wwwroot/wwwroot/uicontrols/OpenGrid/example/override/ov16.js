'use strict';

whenGridReady('grdOv16', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv16';

    $opengrid.setValue(id, sampleMembers(10));
    grid.override('checkById', function (orig, memberNo) {
        var idx = $opengrid.getRowIndexByValue(id, 'MemberNo', memberNo);
        if (idx >= 0) { $opengrid.setCellValue(id, idx, 'UseYN', '1'); log('OV-16: checkById(' + memberNo + ')'); }
    });
    grid.override('uncheckById', function (orig, memberNo) {
        var idx = $opengrid.getRowIndexByValue(id, 'MemberNo', memberNo);
        if (idx >= 0) { $opengrid.setCellValue(id, idx, 'UseYN', '0'); log('OV-16: uncheckById(' + memberNo + ')'); }
    });
    on(id + '_check', 'click', function () { grid.checkById(Number(byId(id + '_id').value)); });
    on(id + '_uncheck', 'click', function () { grid.uncheckById(Number(byId(id + '_id').value)); });
});
