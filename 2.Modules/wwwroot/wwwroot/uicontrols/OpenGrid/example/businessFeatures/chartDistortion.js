'use strict';

whenGridReady('grdChartDistortion', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdChartDistortion', sampleMembers(10));
    on('grdChartDistortion_show', 'click', function () { grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '증감률(0 기준선 강제 포함)', placement: 'inline' }); });
});
