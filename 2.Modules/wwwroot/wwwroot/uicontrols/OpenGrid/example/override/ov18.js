'use strict';

whenGridReady('grdOv18', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv18';

    $opengrid.setValue(id, sampleMembers(40));
    grid.override('freezeRows', function (orig, count) {
        $opengrid.setFixedRowCount(id, count);
        log('OV-18: 상단 ' + count + '행 고정');
    });
    on(id + '_freeze', 'click', function () { grid.freezeRows(2); });
    on(id + '_unfreeze', 'click', function () { grid.freezeRows(0); });
});
