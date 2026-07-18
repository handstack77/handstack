'use strict';

whenGridReady('grdChart07', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChart07';

    $opengrid.setValue(id, sampleProducts(6));
    on(id + '_show', 'click', function () {
        grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '접근성 테스트', placement: 'inline' });
        setTimeout(function () {
            var table = byId(id).querySelector('.og-chart-a11y');
            log('통합차트-07: a11y 표 존재 여부 = ' + !!table + (table ? (', 행수=' + table.querySelectorAll('tr').length) : ''));
        }, 50);
    });
});
