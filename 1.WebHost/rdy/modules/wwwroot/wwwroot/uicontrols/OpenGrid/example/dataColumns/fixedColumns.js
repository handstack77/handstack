'use strict';

whenGridReady('grdFixedColumns', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFixedColumns';

    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_freeze2', 'click', function () { $opengrid.setFixedColumnCount(id, 2); log('왼쪽 2컬럼 고정'); });
    on(id + '_freeze0', 'click', function () { $opengrid.setFixedColumnCount(id, 0); log('고정 해제'); });
});
