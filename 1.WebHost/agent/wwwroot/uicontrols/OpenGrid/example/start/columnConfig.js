'use strict';

whenGridReady('grdColumnConfig', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdColumnConfig';

    $opengrid.setValue(id, sampleMembers(30));

    var shown = true;
    on(id + '_toggleEmail', 'click', function () {
        shown = !shown;
        $opengrid.visibleColumns(id, 'Email', shown);
        log('Email 컬럼 ' + (shown ? '표시' : '숨김'));
    });
});
