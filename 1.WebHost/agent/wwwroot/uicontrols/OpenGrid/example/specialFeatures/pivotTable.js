'use strict';

whenGridReady('grdPivotTable', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdPivotTable';
    var roleCols = ROLES.map(function (r) { return r.CodeID; });

    function buildPivot() {
        var members = sampleMembers(60);
        var byDept = {};
        members.forEach(function (m) {
            if (!byDept[m.Department]) {
                byDept[m.Department] = { Department: m.Department };
                roleCols.forEach(function (rc) { byDept[m.Department][rc] = 0; });
            }
            byDept[m.Department][m.RoleID] += m.Point;
        });
        $opengrid.setValue(id, Object.keys(byDept).map(function (k) { return byDept[k]; }));
        log('피벗 재계산: 부서 x 역할');
    }
    buildPivot();
    on(id + '_pivot', 'click', buildPivot);
});
