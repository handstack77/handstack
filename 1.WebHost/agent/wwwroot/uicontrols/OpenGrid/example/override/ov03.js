'use strict';

whenGridReady('grdOv03', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv03', sampleMembers(10));
    grid.override('writeCell', function (orig, rowIndex, field, value) {
        if (field === 'Point' && Number(value) < 0) {
            log('OV-03: 음수(' + value + ') 입력 → 0으로 보정');
            value = 0;
        }
        return orig(rowIndex, field, value);
    });
});
