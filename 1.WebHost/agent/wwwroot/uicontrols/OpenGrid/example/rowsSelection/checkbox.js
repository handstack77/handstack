'use strict';

whenGridReady('grdCheckbox', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCheckbox';

    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_checked', 'click', function () {
        var items = $opengrid.getCheckedRowItems(id);
        log('체크된 행 ' + items.length + '건');
    });
});
