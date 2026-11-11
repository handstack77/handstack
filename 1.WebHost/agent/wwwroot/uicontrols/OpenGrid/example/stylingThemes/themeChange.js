'use strict';

whenGridReady('grdThemeChange', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdThemeChange';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_theme', 'change', function (e) { $opengrid.setTheme(id, e.target.value); log('theme = ' + e.target.value); });
});
