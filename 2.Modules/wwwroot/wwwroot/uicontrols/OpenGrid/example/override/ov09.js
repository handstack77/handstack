'use strict';

whenGridReady('grdOv09', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv09', sampleMembers(8));
    var lastRun = 0, executed = 0;
    grid.override('setSkinVar', function (orig, name, value) {
        var now = Date.now();
        if (now - lastRun < 300) { return; }
        lastRun = now; executed++;
        return orig(name, value);
    });
    on('grdOv09_burst', 'click', function () {
        executed = 0;
        for (var i = 0; i < 10; i++) { grid.setSkinVar('--og-radius-sm', (i % 2 === 0 ? '4px' : '6px')); }
        log('OV-09: 10회 호출 중 실제 실행 ' + executed + '회(쓰로틀 300ms)');
    });
});
