'use strict';

whenGridReady('grdOv20', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv20';

    $opengrid.setValue(id, sampleMembers(15));
    function findScrollable(container) {
        var all = container.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) { if (all[i].scrollWidth > all[i].clientWidth + 2) { return all[i]; } }
        return container;
    }
    grid.override('jumpToCol', function (orig, field) {
        var defs = grid.getColumnDefs();
        var offset = 0;
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].field === field) { break; }
            offset += defs[i].width || 100;
        }
        findScrollable(byId(id)).scrollLeft = offset;
        log('OV-20: ' + field + ' 컬럼으로 가로 스크롤(offset=' + offset + ')');
    });
    on(id + '_jump', 'click', function () { grid.jumpToCol('Memo'); });
});
