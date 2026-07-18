'use strict';

whenGridReady('grdChart08', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChart08';

    $opengrid.setValue(id, sampleProducts(8));
    on(id + '_show', 'click', function () { grid.createChart({ type: 'bar', source: { kind: 'all' }, title: '반응형 차트', placement: 'inline', size: { width: 480 } }); });
    on(id + '_narrow', 'click', function () { byId(id).style.maxWidth = (byId(id).style.maxWidth ? '' : '320px'); log('통합차트-08: 그리드 폭 토글 → 차트가 ResizeObserver로 자동 재조정됩니다'); });
});
