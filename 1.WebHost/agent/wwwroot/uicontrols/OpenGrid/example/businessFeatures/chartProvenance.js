'use strict';

whenGridReady('grdChartProvenance', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChartProvenance';

    $opengrid.setValue(id, sampleProducts(8));
    on(id + '_show', 'click', function () {
        grid.createChart({ type: 'bar', source: { kind: 'range' }, engine: 'echarts', title: 'provenance 데모', placement: 'inline' });
        setTimeout(function () {
            var badges = byId(id).querySelectorAll('.og-chart-badge');
            var texts = Array.prototype.map.call(badges, function (b) { return b.textContent; });
            log('provenance: 표시된 배지 = ' + JSON.stringify(texts));
        }, 50);
    });
});
