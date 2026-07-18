'use strict';

whenGridReady('grdOv27', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv27', sampleMembers(3));
    on('grdOv27_layer', 'click', function () {
        var order = [];
        grid.override('getDisplayValue', function (orig, r, f) { order.push('L1-in'); var v = orig(r, f); order.push('L1-out'); return v; });
        grid.override('getDisplayValue', function (orig, r, f) { order.push('L2-in'); var v = orig(r, f); order.push('L2-out'); return v; });
        grid.override('getDisplayValue', function (orig, r, f) { order.push('L3-in'); var v = orig(r, f); order.push('L3-out'); return v; });
        grid.getDisplayValue(0, 'MemberName');
        log('OV-27: 실행 순서 = ' + order.join(' → ') + ' (등록 FIFO, 실행은 onion)');
        grid.restore('getDisplayValue');
    });
});
