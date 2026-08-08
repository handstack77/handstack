'use strict';

whenGridReady('grdI18n', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdI18n';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_ko', 'click', function () { $opengrid.setGridLocale(id, 'ko'); log('locale = ko'); });
    on(id + '_en', 'click', function () { $opengrid.setGridLocale(id, 'en'); log('locale = en'); });
});
