'use strict';

whenGridReady('grdRowHeaderHeight', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdRowHeaderHeight', sampleMembers(15));
});
