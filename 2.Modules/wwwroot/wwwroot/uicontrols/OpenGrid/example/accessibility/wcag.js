'use strict';

whenGridReady('grdWcag', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdWcag', sampleMembers(10));
});
