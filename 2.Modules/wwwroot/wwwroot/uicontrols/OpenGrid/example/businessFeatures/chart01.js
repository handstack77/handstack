'use strict';

whenGridReady('grdChart01', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdChart01', sampleProducts(8));
    on('grdChart01_show', 'click', function () { grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '상품별 가격', placement: 'inline' }); });
});
