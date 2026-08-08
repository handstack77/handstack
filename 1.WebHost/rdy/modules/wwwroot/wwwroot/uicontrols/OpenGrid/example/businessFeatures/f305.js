'use strict';

whenGridReady('grdF305', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF305';

    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_fillAll', 'click', function () {
        var rows = $opengrid.countRows(id);
        for (var i = 0; i < rows; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
        log('F3-05: ' + rows + '개 행 각각의 Price*Qty로 자동 적용(상대 참조 효과)');
    });
});
