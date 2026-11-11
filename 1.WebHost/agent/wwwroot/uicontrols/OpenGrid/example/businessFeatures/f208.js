'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF208';
    var style = document.createElement('style');
    style.textContent = '#' + id + ' td:first-child { min-width: 44px; } #' + id + ' .og-cell { min-height: 44px; }';
    document.head.appendChild(style);
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text']], {
        rowHeight: 44,
        masterDetail: { enabled: true, height: 60, renderer: function (row, container) { container.innerHTML = '<div style="padding:8px;">' + row.MemberName + ' 상세</div>'; } }
    });
    $opengrid.setValue(id, sampleMembers(15));
});
