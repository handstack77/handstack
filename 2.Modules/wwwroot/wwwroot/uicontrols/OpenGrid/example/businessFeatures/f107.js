'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF107';
    var grid = createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['Point', '포인트', 100, false, 'number']], { rangeSelection: { enabled: true } });
    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_sort', 'click', function () {
        $opengrid.setSorting(id, 'Point', 'asc');
        log('F1-07: 정렬 후 getRangeSelection() = ' + JSON.stringify(grid.getRangeSelection()));
    });
});
