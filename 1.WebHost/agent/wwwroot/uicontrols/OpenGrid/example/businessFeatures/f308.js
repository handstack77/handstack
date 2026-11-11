'use strict';

whenGridReady('grdF308', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF308';

    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_apply', 'click', function () {
        var rows = $opengrid.countRows(id);
        for (var i = 0; i < rows; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
        log('F3-08: 수식 적용 완료');
    });
    on(id + '_sort', 'click', function () {
        $opengrid.setSorting(id, 'Price', 'asc');
        log('F3-08: 정렬 후에도 각 행의 Total = Price*Qty 값은 그대로 정확합니다');
    });
});
