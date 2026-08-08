'use strict';

whenGridReady('grdCfHeatmap', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCfHeatmap';

    $opengrid.setValue(id, sampleMembers(25));
    on(id + '_apply', 'click', function () {
        grid.setConditionalFormat([{ id: 'heat-salary', priority: 1, scope: { columnId: 'Salary' }, when: { type: 'compare', op: '>=', a: 0 }, encode: { kind: 'scale', mode: 'continuous' } }]);
        log('히트맵 적용: Salary');
    });
    on(id + '_clear', 'click', function () { grid.setConditionalFormat([]); log('조건부서식 해제'); });
});
