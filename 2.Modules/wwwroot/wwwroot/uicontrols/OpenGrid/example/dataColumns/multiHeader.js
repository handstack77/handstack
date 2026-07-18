'use strict';

whenGridReady('grdMultiHeader', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdMultiHeader';

    $opengrid.setValue(id, sampleMembers(20));
});
