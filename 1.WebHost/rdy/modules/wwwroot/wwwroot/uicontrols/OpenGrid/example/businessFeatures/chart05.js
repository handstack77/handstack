'use strict';

whenGridReady('grdChart05', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChart05';

    on(id + '_load', 'click', function () { $opengrid.setValue(id, sampleProducts(5000)); log('통합차트-05: 5000행 로드'); });
    on(id + '_show', 'click', function () { grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '대용량 샘플', placement: 'inline' }); });
});
