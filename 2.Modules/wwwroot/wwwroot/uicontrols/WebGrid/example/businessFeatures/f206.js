'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF206';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text']], {
        masterDetail: { enabled: true, height: 60, cache: true, renderer: function (row, container) { container.innerHTML = '<div style="padding:8px;">메모: <input type="text" placeholder="스크롤 후에도 유지됩니다" style="width:200px;" /></div>'; } }
    });
    $opengrid.setValue(id, sampleMembers(30));
});
