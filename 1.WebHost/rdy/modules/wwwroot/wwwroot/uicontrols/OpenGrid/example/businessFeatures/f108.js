'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF108';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['Point', '포인트', 100, false, 'number']], { editable: true, rangeSelection: { enabled: true, fillHandle: true } });
    $opengrid.setValue(id, sampleMembers(20));
});
