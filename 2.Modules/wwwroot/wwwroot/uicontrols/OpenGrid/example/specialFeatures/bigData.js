'use strict';

whenGridReady('grdBigData', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdBigData';

    function load(count) {
        var start = performance.now();
        $opengrid.setValue(id, sampleProducts(count));
        var ms = Math.round(performance.now() - start);
        measure(count, ms);
    }
    function measure(total, loadMs) {
        var domRows = byId(id).querySelectorAll('[data-og-row], .og-row').length;
        byId(id + '_hud').innerHTML = '총 데이터: <b>' + (total != null ? total.toLocaleString() : $opengrid.countRows(id).toLocaleString()) + '</b>행 · 실제 렌더된 DOM 행: <b>' + domRows + '</b>행' + (loadMs != null ? ' · 로드 ' + loadMs + 'ms' : '');
    }
    load(10000);
    on(id + '_load10', 'click', function () { load(10000); });
    on(id + '_load100', 'click', function () { load(100000); });
    on(id + '_load1m', 'click', function () { load(1000000); });
    on(id + '_measure', 'click', function () { measure(null, null); });
});
