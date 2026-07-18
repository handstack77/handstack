'use strict';

whenGridReady('grdRowDrag', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdRowDrag';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_up', 'click', function () {
        var idx = $opengrid.getSelectedIndex(id);
        if (idx > 0) {
            log('버튼 기반 이동만 지원(네이티브 드래그 재정렬은 $opengrid에 미연결)');
        }
    });
    on(id + '_down', 'click', function () {
        log('버튼 기반 이동만 지원(네이티브 드래그 재정렬은 $opengrid에 미연결)');
    });
});
