'use strict';

var id = 'grdOv11';
window.$ov11 = { hook: { controlInit: function (cid, setting) { return setting; } }, event: {} };
window.$ov11.event[id + '_selectionChange'] = function (cid, rowIndex, item) {
    var $opengrid = syn.uicontrols.$opengrid;
    if (item && item.UseYN === '0') {
        $opengrid.clearSelection(id);
        log('OV-11: 비활성 회원 선택 차단 → ' + item.MemberName);
    }
};
syn.$w.pageScript = '$ov11';
document.getElementById(id).setAttribute('syn-events', "['selectionChange']");

whenGridReady(id, function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue(id, sampleMembers(15));
});
