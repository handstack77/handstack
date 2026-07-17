'use strict';

whenOpenGridReady(function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF202';
    createRawGrid(id, [['MemberNo', '번호', 70, false, 'number', true, 'center'], ['MemberName', '이름', 120, false, 'text']], {
        masterDetail: { enabled: true, height: 150, cache: true, renderer: function (row, container) {
            var subID = 'sub_f202_' + row.MemberNo;
            container.innerHTML = '<div id="' + subID + '" style="width:100%; height:130px;"></div>';
            $opengrid.controlLoad(subID, { columns: [['Round', '회차', 60, false, 'text'], ['Evaluator', '평가자', 90, false, 'text'], ['Score', '점수', 70, false, 'number'], ['Comment', '코멘트', 220, false, 'text']] });
            $opengrid.setValue(subID, sampleReviewHistory(row.MemberNo));
        } }
    });
    $opengrid.setValue(id, sampleMembers(10));
});
