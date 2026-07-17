'use strict';

whenGridReady('grdF301', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF301';

    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_apply', 'click', function () {
        var rows = $opengrid.countRows(id);
        for (var i = 0; i < rows; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
        $opengrid.setFooter(id, [{ field: 'Total', op: 'SUM' }]);
        log('F3-01: 견적 합계 수식 + Footer SUM 적용');
    });
});
