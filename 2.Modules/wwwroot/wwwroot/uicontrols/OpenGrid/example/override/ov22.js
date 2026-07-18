'use strict';

whenGridReady('grdOv22', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv22', sampleMembers(30));
    grid.override.strategy('filterPredicate', function (value, filterItem) {
        if (Array.isArray(filterItem.value)) { return filterItem.value.indexOf(value) !== -1; }
        switch (filterItem.operator) {
            case '=': return value === filterItem.value;
            case '!=': return value !== filterItem.value;
            case '>': return value > filterItem.value;
            case '>=': return value >= filterItem.value;
            case '<': return value < filterItem.value;
            case '<=': return value <= filterItem.value;
            default: return true;
        }
    });
    on('grdOv22_apply', 'click', function () {
        grid.setFilter('Department', [{ value: ['개발팀', '지원팀'] }]);
        log('OV-22: OR 필터(부서 in [개발팀, 지원팀]) 적용');
    });
    on('grdOv22_clear', 'click', function () { grid.resetFilter('Department'); log('OV-22: 필터 초기화'); });
});
