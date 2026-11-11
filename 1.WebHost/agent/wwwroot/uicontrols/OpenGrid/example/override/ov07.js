'use strict';

whenGridReady('grdOv07', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv07', sampleMembers(10));
    grid.override('applyColumns', function (orig, cols) {
        log('OV-07: 컬럼 적용 전 가공(' + cols.length + '개)');
        var result = orig(cols);
        log('OV-07: 컬럼 적용 후 가공 완료');
        return result;
    });
    on('grdOv07_apply', 'click', function () {
        var defs = grid.getColumnDefs().map(function (c) { return Object.assign({}, c, { width: Math.max(40, Math.round((c.width || 100) / 2)) }); });
        grid.applyColumns(defs);
    });
});
