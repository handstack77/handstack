'use strict';

whenGridReady('grdSapVoucher', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdSapVoucher';

    $opengrid.setValue(id, [
        { Account: '현금', Description: '상품 매출', Debit: 500000, Credit: 0 },
        { Account: '매출', Description: '상품 매출', Debit: 0, Credit: 500000 }
    ]);
    on(id + '_addLine', 'click', function () { $opengrid.insertRow(id, { Account: '', Description: '', Debit: 0, Credit: 0 }); });
    on(id + '_save', 'click', function () {
        var rows = dedupeByKey($opengrid.getGridData(id), '_ogRowId');
        var debit = 0, credit = 0;
        rows.forEach(function (r) { debit += Number(r.Debit) || 0; credit += Number(r.Credit) || 0; });
        if (debit === credit) {
            log('전표 저장 성공: 차변 ' + debit.toLocaleString() + ' = 대변 ' + credit.toLocaleString());
        } else {
            log('전표 저장 실패: 대차 불일치(차변 ' + debit.toLocaleString() + ' ≠ 대변 ' + credit.toLocaleString() + ')');
        }
    });
});
