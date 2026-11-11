'use strict';

whenGridReady('grdOv06', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv06', sampleMembers(10));
    grid.override('exportExcel', function (orig, opts) {
        opts = opts || {};
        opts.filename = opts.filename || ('members_' + Date.now() + '.xlsx');
        log('OV-06: 내보내기 파일명 = ' + opts.filename);
        return orig(opts);
    });
    on('grdOv06_export', 'click', function () { grid.exportExcel({}); });
});
