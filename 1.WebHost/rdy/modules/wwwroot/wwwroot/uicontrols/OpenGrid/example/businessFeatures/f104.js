'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF104';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['Point', '포인트', 100, false, 'number'], ['Salary', '급여', 120, false, 'number']], { editable: true, rangeSelection: { enabled: true } });
    $opengrid.setValue(id, sampleMembers(20));
});
