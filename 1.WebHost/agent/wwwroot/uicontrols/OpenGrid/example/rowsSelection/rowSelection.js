'use strict';

whenGridReady('grdRowSelection', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdRowSelection';

    $opengrid.setValue(id, sampleMembers(20));
    var gridEl = document.getElementById(id);
    gridEl.addEventListener('click', function () {
        var item = $opengrid.getSelectedItem(id);
        if (item) {
            log('선택: ' + item.MemberName);
        }
    });
});
