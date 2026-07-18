'use strict';

whenGridReady('grdCfRuleStack', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCfRuleStack';

    $opengrid.setValue(id, sampleMembers(25));
    on(id + '_apply', 'click', function () {
        grid.setConditionalFormat([
            { id: 'stack-high', priority: 1, stopIfTrue: true, scope: { columnId: 'Point' }, when: { type: 'compare', op: '>=', a: 8000 }, encode: { kind: 'icon', steps: 3 } },
            { id: 'stack-mid', priority: 2, stopIfTrue: true, scope: { columnId: 'Point' }, when: { type: 'compare', op: '>=', a: 4000 }, encode: { kind: 'scale', mode: 'discrete', bands: 3 } },
            { id: 'stack-low', priority: 3, scope: { columnId: 'Point' }, when: { type: 'compare', op: '<', a: 4000 }, encode: { kind: 'bar', axis: 'zero' } }
        ]);
        log('규칙 3종 스택 적용(priority 1→3)');
    });
    on(id + '_clear', 'click', function () { grid.setConditionalFormat([]); log('조건부서식 해제'); });
});
