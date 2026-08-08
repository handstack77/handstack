'use strict';

whenGridReady('grdOv01', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv01';

    $opengrid.setValue(id, sampleMembers(10));
    grid.override('getDisplayValue', function (orig, rowIndex, field) {
        var v = orig(rowIndex, field);
        return field === 'MemberName' ? '★ ' + v : v;
    });
    $opengrid.setValue(id, $opengrid.getGridData(id));
    log('OV-01 적용: 이름 표시값 앞에 ★ 표시');
});
