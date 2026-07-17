'use strict';

whenGridReady('grdRowState', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdRowState';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_add', 'click', function () { $opengrid.insertRow(id, { MemberNo: 900 + Math.floor(Math.random() * 99), MemberName: '신규' }); });
    on(id + '_del', 'click', function () { $opengrid.removeRow(id); });
    on(id + '_dump', 'click', function () {
        var rows = $opengrid.getGridData(id);
        log(rows.map(function (r) { return r.MemberNo + ':' + r.Flag; }).join(', '));
    });
});
