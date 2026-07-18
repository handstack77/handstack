'use strict';

whenGridReady('grdCsvJson', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCsvJson';

    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_csv', 'click', function () { $opengrid.exportFile(id, { fileName: 'members.csv' }); });
    on(id + '_json', 'click', function () { $opengrid.exportJson(id, { filename: 'members.json' }); });
});
