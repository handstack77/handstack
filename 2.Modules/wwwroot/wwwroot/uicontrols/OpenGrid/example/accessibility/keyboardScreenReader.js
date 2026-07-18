'use strict';

whenGridReady('grdKeyboardScreenReader', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdKeyboardScreenReader', sampleMembers(10));
});
