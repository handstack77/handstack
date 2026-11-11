'use strict';

whenGridReady('grdPrint', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdPrint';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_print', 'click', function () { var g = $opengrid.getGridControl(id); if (g) g.print({ title: '회원 목록' }); });
});
