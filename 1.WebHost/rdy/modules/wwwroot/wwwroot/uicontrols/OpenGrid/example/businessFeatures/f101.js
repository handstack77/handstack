'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF101';
    var grid = createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text'], ['Point', '포인트', 100, false, 'number']], { rangeSelection: { enabled: true } });
    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_read', 'click', function () { log('F1-01: getActiveRange() = ' + JSON.stringify(grid.getActiveRange())); });
});
