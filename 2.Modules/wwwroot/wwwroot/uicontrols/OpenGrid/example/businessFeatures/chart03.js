'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdChart03';
    var grid = createRawGrid(id, [['ProdName', '상품명', 130, false, 'text'], ['Price', '가격', 100, false, 'number']], { checkColumn: true });
    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_checkFirst3', 'click', function () {
        var rows = $opengrid.getGridData(id);
        for (var i = 0; i < Math.min(3, rows.length); i++) { grid.checkByValue('ProdID', rows[i].ProdID); }
        log('통합차트-03: 앞 3개 행 체크');
    });
    on(id + '_show', 'click', function () {
        var checked = grid.getChecked ? grid.getChecked() : [];
        if (!checked.length) { log('통합차트-03: 비교할 행을 먼저 체크하세요(왼쪽 체크박스 열 또는 "앞 3개 체크" 버튼)'); return; }
        grid.createChart({ type: 'bar', source: { kind: 'checked' }, title: '체크 행 비교', placement: 'inline' });
    });
});
