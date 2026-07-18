'use strict';

whenGridReady('grdTreeStructure', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdTreeStructure';

    var grid = $opengrid.getGridControl(id);
    $opengrid.setValue(id, sampleOrgTree(3));
    if (grid) {
        grid.enableTree();
    }
    on(id + '_expand', 'click', function () { $opengrid.expandAllNodes(id); });
    on(id + '_collapse', 'click', function () { $opengrid.collapseAllNodes(id); });
});
