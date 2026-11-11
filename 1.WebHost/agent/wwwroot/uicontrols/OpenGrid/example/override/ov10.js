'use strict';

whenGridReady('grdOv10', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv10', sampleMembers(5));
    grid.override('getAddedRows', function (orig) {
        return orig().map(function (r) { return Object.assign({}, r, { _exportedAt: new Date().toLocaleTimeString() }); });
    });
    on('grdOv10_add', 'click', function () { grid.insertRow({ MemberNo: 950, MemberName: '신규' }); });
    on('grdOv10_check', 'click', function () { log('OV-10: ' + JSON.stringify(grid.getAddedRows())); });
});
