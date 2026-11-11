'use strict';

whenGridReady('grdTextureMatrix', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdTextureMatrix';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_density', 'change', function (e) { $opengrid.setDensity(id, e.target.value); });
    on(id + '_texture', 'change', function (e) { $opengrid.setTexture(id, e.target.value); });
});
