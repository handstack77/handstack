'use strict';

whenGridReady('grdCrossGridMove_left', function () {
    whenGridReady('grdCrossGridMove_right', function () {
        var $opengrid = syn.uicontrols.$opengrid;
        var id = 'grdCrossGridMove';

        $opengrid.setValue(id + '_left', sampleMembers(10).map(function (m) { return { MemberNo: m.MemberNo, MemberName: m.MemberName, UseYN: false }; }));
        $opengrid.setValue(id + '_right', []);

        function move(fromID, toID) {
            var fromRows = dedupeByKey($opengrid.getGridData(fromID), 'MemberNo');
            var checked = fromRows.filter(function (r) { return r.UseYN === true; });
            if (!checked.length) {
                log('그리드 간 이동: 체크된 행이 없습니다');
                return;
            }
            var target = dedupeByKey($opengrid.getGridData(toID), 'MemberNo').concat(checked.map(function (c) { return { MemberNo: c.MemberNo, MemberName: c.MemberName, UseYN: false }; }));
            $opengrid.setValue(toID, target);
            var remain = fromRows.filter(function (r) { return r.UseYN !== true; });
            $opengrid.setValue(fromID, remain);
            log(checked.length + '건 이동');
        }
        on(id + '_toRight', 'click', function () { move(id + '_left', id + '_right'); });
        on(id + '_toLeft', 'click', function () { move(id + '_right', id + '_left'); });
    });
});
