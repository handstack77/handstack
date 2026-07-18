'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF105';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text'], ['Point', '포인트', 100, false, 'number']], { editable: true, clipboard: true, rangeSelection: { enabled: true } });
    $opengrid.setValue(id, sampleMembers(20));
});
