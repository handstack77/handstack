'use strict';

whenGridReady('grdChangeTracking', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChangeTracking';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_edit', 'click', function () {
        var item = $opengrid.getItemByRowIndex(id, 0);
        if (item) {
            $opengrid.setCellValue(id, 0, 'Point', (item.Point || 0) + 100);
        }
    });
    on(id + '_check', 'click', function () {
        var items = $opengrid.getUpdateItems(id);
        log('변경분 ' + items.length + '건: ' + JSON.stringify(items.map(function (i) { return { Flag: i.Flag, MemberNo: i.MemberNo }; })));
    });
});
