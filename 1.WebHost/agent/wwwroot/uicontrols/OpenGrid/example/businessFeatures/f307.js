'use strict';

whenGridReady('grdF307', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF307';

    $opengrid.setValue(id, sampleProducts(500));
    on(id + '_run', 'click', function () {
        var start = performance.now();
        for (var i = 0; i < 500; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
        log('F3-07: 500행 재계산 완료 · ' + Math.round(performance.now() - start) + 'ms');
    });
});
