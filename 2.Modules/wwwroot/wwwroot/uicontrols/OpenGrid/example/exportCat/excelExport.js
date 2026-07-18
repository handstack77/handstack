'use strict';

whenGridReady('grdExcelExport', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdExcelExport';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_export', 'click', function () { $opengrid.exportExcel(id, { filename: 'members.xlsx' }); });
});
