'use strict';

whenGridReady('grdOv24', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv24', sampleMembers(15));
    grid.override.strategy('cellSerializer', function (value, col) {
        if (col.field === 'UseYN') { return value === '1' ? '사용' : '미사용'; }
        return value;
    });
    on('grdOv24_export', 'click', function () { grid.exportExcel({ filename: 'ov24.xlsx' }); log('OV-24: cellSerializer 적용된 엑셀 내보내기'); });
});
