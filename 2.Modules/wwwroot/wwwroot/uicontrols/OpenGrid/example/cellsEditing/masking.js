'use strict';

whenGridReady('grdMasking', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdMasking';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_mask', 'click', function () { $opengrid.setMaskEnabled(id, 'Email', true); log('Email 마스킹 ON'); });
    on(id + '_unmask', 'click', function () { $opengrid.setMaskEnabled(id, 'Email', false); log('Email 마스킹 OFF'); });
});
