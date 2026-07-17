'use strict';

whenGridReady('grdMapLink', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdMapLink', sampleMembers(15));
});
