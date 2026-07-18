'use strict';

whenGridReady('grdImageButton', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdImageButton', sampleMembers(15));
});
