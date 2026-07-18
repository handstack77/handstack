'use strict';

whenGridReady('grdCellMerge', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCellMerge';

    var data = sampleMembers(20).sort(function (a, b) { return a.Department < b.Department ? -1 : 1; });
    $opengrid.setValue(id, data);
    on(id + '_merge', 'click', function () { var g = $opengrid.getGridControl(id); if (g) g.autoMerge(['Department']); });
    on(id + '_clear', 'click', function () { var g = $opengrid.getGridControl(id); if (g) g.clearMerge(); });
});
