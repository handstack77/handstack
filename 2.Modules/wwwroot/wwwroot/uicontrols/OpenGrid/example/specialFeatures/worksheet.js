'use strict';

whenGridReady('grdWorksheet', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdWorksheet';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_addSheet', 'click', function () {
        $opengrid.addWorksheet(id, 'products', [
            ['ProdID', '상품코드', 90, false, 'text'],
            ['ProdName', '상품명', 140, false, 'text']
        ], sampleProducts(10));
        $opengrid.switchWorksheet(id, 'products');
        log('products 워크시트로 전환');
    });
    on(id + '_toMember', 'click', function () {
        var names = $opengrid.getWorksheetNames(id);
        if (names && names.length > 0) {
            $opengrid.switchWorksheet(id, names[0]);
        }
    });
});
