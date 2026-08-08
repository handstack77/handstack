'use strict';

whenGridReady('grdCfIconDelta', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCfIconDelta';

    $opengrid.setValue(id, sampleMembers(25));
    on(id + '_apply', 'click', function () {
        grid.setConditionalFormat([{ id: 'icon-changerate', priority: 1, scope: { columnId: 'ChangeRate' }, when: { type: 'compare', op: '>=', a: -999999 }, encode: { kind: 'icon', steps: 3 } }]);
        log('아이콘셋 적용: ChangeRate');
    });
    on(id + '_clear', 'click', function () { grid.setConditionalFormat([]); log('조건부서식 해제'); });
});
