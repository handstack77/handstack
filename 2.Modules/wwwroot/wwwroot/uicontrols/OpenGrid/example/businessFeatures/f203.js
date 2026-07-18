'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF203';
    createRawGrid(id, [['OrderNo', '주문번호', 110, false, 'text'], ['CustomerName', '고객', 100, false, 'text']], {
        masterDetail: { enabled: true, height: 170, cache: true, renderer: function (row, container) {
            var innerID = 'inner_f203_' + row.OrderNo;
            container.innerHTML = '<div id="' + innerID + '" style="width:100%; height:150px;"></div>';
            createRawGrid(innerID, [['ProdName', '상품명', 140, false, 'text'], ['Amount', '금액', 100, false, 'number']], {
                masterDetail: { enabled: true, height: 60, cache: true, renderer: function (r2, c2) { c2.innerHTML = '<div style="padding:6px; font-size:11px; color:#6b7280;">2단 중첩 상세: ' + r2.ProdName + ' 추가 메모(중첩 깊이 한계에 도달하면 이 레벨은 열리지 않습니다)</div>'; } }
            });
            $opengrid.setValue(innerID, row.Details || []);
        } }
    });
    $opengrid.setValue(id, sampleOrders(6));
});
