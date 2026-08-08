'use strict';

whenGridReady('grdContextMenu', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdContextMenu', sampleMembers(15));
});
