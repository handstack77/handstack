'use strict';

whenGridReady('grdCustomCss', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCustomCss';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_purple', 'click', function () { $opengrid.setThemeVar(id, '--og-primary', '#7c3aed'); });
    on(id + '_reset', 'click', function () { $opengrid.setThemeVar(id, '--og-primary', '#1976d2'); });
});
