'use strict';

whenGridReady('grdLink', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdLink', sampleMembers(15));
});
