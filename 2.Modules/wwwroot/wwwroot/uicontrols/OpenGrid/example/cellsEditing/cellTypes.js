'use strict';

// dropdown 컬럼의 storeSourceID('ROLE')가 window[syn.$w.pageScript].config.dataSource 에서
// 옵션 목록을 찾으므로, controlLoad(태그 스캔)가 실행되기 전인 최상위 레벨에서 설정한다.
window.$cellTypes = { config: { dataSource: { ROLE: { CodeColumnID: 'CodeID', ValueColumnID: 'CodeValue', DataSource: ROLES } } }, hook: {}, event: {} };
syn.$w.pageScript = '$cellTypes';

whenGridReady('grdCellTypes', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdCellTypes', sampleMembers(15));
});
