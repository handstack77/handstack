'use strict';

whenGridReady('grdF304', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF304';

    $opengrid.setValue(id, sampleMembers(3));
    on(id + '_apply', 'click', function () {
        $opengrid.setCellFormula(id, 0, 'Point', '=0.1+0.2');
        var v = $opengrid.getCellValue(id, 0, 'Point');
        log('F3-04: 0.1+0.2 = ' + v + ' (부동소수점 오차 확인)');
    });
});
