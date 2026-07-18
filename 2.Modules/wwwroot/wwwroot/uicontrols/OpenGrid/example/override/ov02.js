'use strict';

whenGridReady('grdOv02', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv02';

    $opengrid.setValue(id, sampleMembers(5));
    grid.override('insertRow', function (orig, item) {
        if (!item || !item.MemberName) { log('OV-02: 이름 없는 행 → 추가 차단'); return; }
        return orig(item);
    });
    on(id + '_ok', 'click', function () { grid.insertRow({ MemberNo: 900, MemberName: '정상 추가' }); });
    on(id + '_bad', 'click', function () { grid.insertRow({ MemberNo: 901 }); });
});
