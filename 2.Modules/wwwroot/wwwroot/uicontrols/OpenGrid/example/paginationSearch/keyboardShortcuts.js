'use strict';

whenGridReady('grdKeyboardShortcuts', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdKeyboardShortcuts', sampleMembers(15));
});
