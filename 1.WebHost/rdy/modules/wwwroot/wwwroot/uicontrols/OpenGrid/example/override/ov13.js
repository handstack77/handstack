'use strict';

whenGridReady('grdOv13', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv13', sampleMembers(150));
    grid.override('scrollToRow', function (orig, rowIndex) {
        var result = orig(rowIndex);
        log('OV-13: ' + rowIndex + '행으로 점프 보정 적용');
        return result;
    });
    on('grdOv13_jump', 'click', function () { grid.scrollToRow(80); });
});
