'use strict';

whenGridReady('grdChart04', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChart04';

    $opengrid.setValue(id, sampleProducts(8));
    for (var i = 0; i < 8; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
    on(id + '_show', 'click', function () { grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '상품별 합계(라이브)', placement: 'inline', live: true }); });
});
