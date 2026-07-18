'use strict';

whenGridReady('grdOv21', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv21', sampleMembers(20));
    var priority = { '개발팀': 0, '영업팀': 1, '지원팀': 2, '경영지원팀': 3 };
    grid.override.strategy('sortComparator', function (a, b, field, dir) {
        if (field !== 'Department') { return null; }
        var d = (priority[a] ?? 9) - (priority[b] ?? 9);
        return dir === 'desc' ? -d : d;
    });
    log('OV-21: 부서 컬럼에 우선순위 정렬 전략 등록');
});
