'use strict';

whenGridReady('grdCurrencyFormat', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdCurrencyFormat', sampleMembers(15));
});
