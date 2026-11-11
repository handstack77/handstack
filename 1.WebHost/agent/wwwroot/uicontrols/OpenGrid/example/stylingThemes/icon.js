'use strict';

whenGridReady('grdIcon', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdIcon';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_customIcon', 'click', function () {
        var g = $opengrid.getGridControl(id);
        if (g) {
            g.setIcon('sort.asc', '▲');
            g.setIcon('sort.desc', '▼');
            log('정렬 아이콘 교체');
        }
    });
});
