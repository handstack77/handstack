'use strict';

whenGridReady('grdF302', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF302';

    $opengrid.setValue(id, sampleProducts(8));
    for (var i = 0; i < 8; i++) { $opengrid.setCellFormula(id, i, 'Total', '=Price*Qty'); }
});
