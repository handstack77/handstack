'use strict';

whenGridReady('grdFormula', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFormula';

    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_apply', 'click', function () {
        var rows = $opengrid.countRows(id);
        for (var i = 0; i < rows; i++) {
            $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty');
        }
        log('전체 행 Total = Price*Qty 수식 적용');
    });
});
