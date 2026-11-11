'use strict';

whenGridReady('grdVariableRowHeight', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdVariableRowHeight';

    $opengrid.setValue(id, sampleMembers(15));
});
