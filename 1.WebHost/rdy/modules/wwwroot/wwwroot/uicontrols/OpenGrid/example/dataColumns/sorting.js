'use strict';

whenGridReady('grdSorting', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdSorting';

    $opengrid.setValue(id, sampleMembers(30));
    on(id + '_sortAsc', 'click', function () { $opengrid.setSorting(id, 'Point', 'asc'); });
    on(id + '_sortDesc', 'click', function () { $opengrid.setSorting(id, 'Point', 'desc'); });
    on(id + '_clearSort', 'click', function () { $opengrid.clearSorting(id); });
});
