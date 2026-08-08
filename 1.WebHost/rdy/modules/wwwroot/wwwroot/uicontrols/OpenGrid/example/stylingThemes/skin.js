'use strict';

whenGridReady('grdSkin', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdSkin';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_skin', 'change', function (e) { $opengrid.setSkin(id, e.target.value); });
});
