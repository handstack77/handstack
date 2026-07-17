'use strict';

// syn_opengrid 태그가 초기화될 때 controlLoad가 이 elID의 syn-events 속성과
// window[syn.$w.pageScript].event 를 읽어 이벤트를 배선하므로, 태그 스캔(DOMContentLoaded)이
// 일어나기 전인 스크립트 최상위 레벨에서 미리 설정해 둔다.
var id = 'grdCellEdit';
window.$cellEdit = {
    hook: { controlInit: function (cid, setting) { return setting; } },
    event: {}
};
window.$cellEdit.event[id + '_cellEditEnd'] = function (cid, rowIndex, field, oldValue, newValue) {
    log('편집: [' + field + '] "' + oldValue + '" → "' + newValue + '"');
};
syn.$w.pageScript = '$cellEdit';
document.getElementById(id).setAttribute('syn-events', "['cellEditEnd']");

whenGridReady(id, function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue(id, sampleMembers(15));
});
