'use strict';

whenGridReady('grdOv25', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv25', sampleMembers(30));
    grid.override.strategy('groupKeyFn', function (row, remainingFields) {
        if (remainingFields[0] !== 'Point') { return null; }
        var p = row.Point || 0;
        return p < 3000 ? '0~3000' : p < 7000 ? '3000~7000' : '7000+';
    });
    on('grdOv25_group', 'click', function () { $opengrid.groupBy('grdOv25', ['Point']); log('OV-25: 포인트 구간 그룹 키 전략 적용'); });
});
