'use strict';

whenGridReady('grdOv05', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv05';

    $opengrid.setValue(id, sampleMembers(5));
    grid.override('insertRow', function (orig, item) {
        item = Object.assign({ MemberNo: 9000 + Math.floor(Math.random() * 99), MemberName: '신규 회원', JoinDate: new Date().toISOString().slice(0, 10) }, item);
        return orig(item);
    });
    on(id + '_add', 'click', function () { grid.insertRow({}); log('OV-05: 자동값으로 행 추가됨'); });
});
