'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF106';
    createRawGrid(id, [['Price', '단가', 100, false, 'number'], ['Qty', '수량', 90, false, 'number'], ['Total', '합계(수식)', 110, false, 'number']], { editable: true, rangeSelection: { enabled: true, fillOverwriteFormula: false } });
    $opengrid.setValue(id, sampleProducts(10));
    on(id + '_apply', 'click', function () { $opengrid.setCellFormula(id, 0, 'Total', '=Price*Qty'); log('F1-06: 1행 Total = Price*Qty 수식 적용. 이제 Total 열을 드래그로 채워도 수식이 보존됩니다.'); });
});
