'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF205';
    var grid = createRawGrid(id, [['name', '이름', 160, false, 'text'], ['title', '직책', 120, false, 'text']], {
        masterDetail: { enabled: true, height: 60, renderer: function (row, container) { container.innerHTML = '<div style="padding:8px; font-size:12px;">' + row.name + '(' + row.title + ') 상세 메모</div>'; } }
    });
    $opengrid.setValue(id, sampleOrgTree(2));
    grid.enableTree();
});
