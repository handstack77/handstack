'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF204';
    var grid = createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text']], {
        masterDetail: { enabled: true, height: 60, renderer: function (row, container) { container.innerHTML = '<div style="padding:8px; font-size:12px;">' + row.MemberName + '의 상세 정보</div>'; } }
    });
    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_expand', 'click', function () { grid.expandRow(0); log('F2-04: 0번 행 펼침 = ' + grid.isRowExpanded(0)); });
    on(id + '_sort', 'click', function () {
        $opengrid.setSorting(id, 'MemberName', 'desc');
        log('F2-04: 정렬 후에도 상세 패널이 유지됩니다(행 재배치만 발생)');
    });
});
