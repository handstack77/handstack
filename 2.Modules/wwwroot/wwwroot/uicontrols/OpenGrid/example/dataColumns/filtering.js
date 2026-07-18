'use strict';

whenGridReady('grdFiltering', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFiltering';

    $opengrid.setValue(id, sampleMembers(40));
    on(id + '_filterDept', 'click', function () { $opengrid.addCondition(id, 'Department', 'eq', '개발팀'); log('부서 필터 적용'); });
    on(id + '_filterPoint', 'click', function () { $opengrid.addCondition(id, 'Point', 'gte', 5000); log('포인트 필터 적용'); });
    on(id + '_clearFilter', 'click', function () { $opengrid.clearConditions(id); log('필터 초기화'); });
});
