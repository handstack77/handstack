'use strict';

whenGridReady('grdColumnReorder', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdColumnReorder';

    $opengrid.setValue(id, sampleMembers(20));
});
