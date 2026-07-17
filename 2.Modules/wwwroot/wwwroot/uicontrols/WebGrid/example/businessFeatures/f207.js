'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF207';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text']], {
        masterDetail: { enabled: true, height: 60, renderer: function (row, container) { container.innerHTML = '<div style="padding:8px;">' + row.MemberName + ' 상세(키보드로 펼침)</div>'; } }
    });
    $opengrid.setValue(id, sampleMembers(15));
    on(id + '_focus', 'click', function () { byId(id).focus(); log('F2-07: 그리드에 포커스됨 — 방향키로 이동 후 Enter로 펼쳐보세요'); });
});
