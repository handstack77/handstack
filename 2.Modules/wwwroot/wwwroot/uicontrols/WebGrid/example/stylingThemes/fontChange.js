'use strict';

whenGridReady('grdFontChange', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFontChange';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_serif', 'click', function () { byId(id).style.fontFamily = 'Batang, serif'; });
    on(id + '_reset', 'click', function () { byId(id).style.fontFamily = ''; });
});
