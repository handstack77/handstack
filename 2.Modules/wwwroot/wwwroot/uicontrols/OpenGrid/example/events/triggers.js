'use strict';

whenGridReady('grdTriggers', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdTriggers';

    $opengrid.setValue(id, sampleMembers(5));
    var grid = $opengrid.getGridControl(id);
    if (grid) {
        grid.addTrigger('before:insertRow', function (ctx) {
            var item = ctx.args[0];
            if (!item || !item.MemberName) {
                log('트리거: MemberName 없는 행 추가 취소');
                ctx.cancel();
            }
        });
    }
    on(id + '_insertOk', 'click', function () { $opengrid.insertRow(id, { MemberNo: 1, MemberName: '정상 추가' }); });
    on(id + '_insertBad', 'click', function () { $opengrid.insertRow(id, { MemberNo: 2 }); });
});
