'use strict';

whenGridReady('grdStreaming', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdStreaming';

    $opengrid.setValue(id, sampleMembers(20));
    var timer = null;
    on(id + '_start', 'click', function () {
        if (timer) { return; }
        timer = setInterval(function () {
            var rows = $opengrid.countRows(id);
            if (!rows) { return; }
            var idx = Math.floor(Math.random() * rows);
            var item = $opengrid.getItemByRowIndex(id, idx);
            if (item) {
                $opengrid.setCellValue(id, idx, 'Point', Math.max(0, (item.Point || 0) + Math.round((Math.random() - 0.5) * 500)));
            }
        }, 800);
        log('스트리밍 시작');
    });
    on(id + '_stop', 'click', function () { clearInterval(timer); timer = null; log('스트리밍 중지'); });
});
