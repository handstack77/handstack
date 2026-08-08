'use strict';

whenGridReady('grdOv12', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv12', sampleMembers(10));
    grid.override('openContextMenu', function (orig, e, actions) {
        log('OV-12: 커스텀 컨텍스트 메뉴 훅 실행됨');
        return orig(e, actions);
    });
});
