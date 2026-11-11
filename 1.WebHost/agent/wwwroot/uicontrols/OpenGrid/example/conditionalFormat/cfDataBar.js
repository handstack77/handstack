'use strict';

whenGridReady('grdCfDataBar', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCfDataBar';

    $opengrid.setValue(id, sampleMembers(20));
    on(id + '_apply', 'click', function () {
        grid.setConditionalFormat([{ id: 'databar-point', priority: 1, scope: { columnId: 'Point' }, when: { type: 'compare', op: '>=', a: 0 }, encode: { kind: 'bar', axis: 'zero', clamp: true } }]);
        log('데이터바 적용: Point');
    });
    on(id + '_clear', 'click', function () { grid.setConditionalFormat([]); log('조건부서식 해제'); });
});
