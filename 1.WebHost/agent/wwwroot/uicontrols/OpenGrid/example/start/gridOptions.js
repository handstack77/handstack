'use strict';

whenGridReady('grdGridOptions', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdGridOptions';

    $opengrid.setValue(id, sampleMembers(20));

    var editable = true;
    on(id + '_toggleEditable', 'click', function () {
        editable = !editable;
        $opengrid.setProperty(id, 'editable', editable);
        log('editable = ' + editable);
    });
});
