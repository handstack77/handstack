'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF103';
    var grid = createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['Point', '포인트', 100, false, 'number']], { editable: true, rangeSelection: { enabled: true, fillHandle: true, seriesFill: true } });
    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_read', 'click', function () { log('F1-03: getRangeValues() = ' + JSON.stringify(grid.getRangeValues())); });
});
