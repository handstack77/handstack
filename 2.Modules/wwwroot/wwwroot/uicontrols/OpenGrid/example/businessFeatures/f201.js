'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF201';
    createRawGrid(id, [['OrderNo', '주문번호', 110, false, 'text'], ['CustomerName', '고객', 100, false, 'text'], ['Status', '상태', 90, false, 'text'], ['TotalAmount', '총액', 110, false, 'number']], {
        masterDetail: { enabled: true, height: 140, renderer: function (row, container) {
            var html = '<table style="width:100%; border-collapse:collapse; font-size:12px;"><tr style="text-align:left; color:#6b7280;"><th>상품명</th><th>단가</th><th>수량</th><th>금액</th></tr>';
            (row.Details || []).forEach(function (d) { html += '<tr><td>' + d.ProdName + '</td><td>' + d.Price.toLocaleString() + '</td><td>' + d.Qty + '</td><td>' + d.Amount.toLocaleString() + '</td></tr>'; });
            container.innerHTML = html + '</table>';
        } }
    });
    $opengrid.setValue(id, sampleOrders(10));
});
