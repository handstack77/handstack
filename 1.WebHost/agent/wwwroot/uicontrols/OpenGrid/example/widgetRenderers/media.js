'use strict';

whenGridReady('grdMedia', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdMedia', sampleProducts(15));
});
