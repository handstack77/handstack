'use strict';

whenGridReady('grdF303', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF303';

    $opengrid.setValue(id, sampleMembers(30));
    on(id + '_filter', 'click', function () { $opengrid.addCondition(id, 'Department', 'eq', '개발팀'); log('F3-03: 개발팀 필터 적용'); });
    on(id + '_footer', 'click', function () { $opengrid.setFooter(id, [{ field: 'Point', op: 'SUM' }]); log('F3-03: 필터가 적용된 상태에서 보이는 행만 집계됩니다'); });
    on(id + '_clear', 'click', function () { $opengrid.clearConditions(id); log('F3-03: 필터 해제'); });
});
