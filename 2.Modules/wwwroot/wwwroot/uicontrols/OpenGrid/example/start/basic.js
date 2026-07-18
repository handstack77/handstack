'use strict';

whenGridReady('grdBasic', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdBasic';

    $opengrid.setValue(id, sampleMembers(50));

    on(id + '_load', 'click', function () { $opengrid.setValue(id, sampleMembers(50)); log('기본 그리드: 50건 조회'); });
    on(id + '_insert', 'click', function () { $opengrid.insertRow(id, { MemberNo: $opengrid.countRows(id) + 1, MemberName: '신규 사용자' }); log('행 추가'); });
    on(id + '_remove', 'click', function () { $opengrid.removeRow(id); log('선택 행 삭제'); });
    on(id + '_export', 'click', function () { $opengrid.exportFile(id, { fileName: 'basic.csv' }); });
});
