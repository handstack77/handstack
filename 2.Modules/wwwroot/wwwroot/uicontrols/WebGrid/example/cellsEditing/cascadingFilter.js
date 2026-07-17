'use strict';

whenGridReady('grdCascadingFilter', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCascadingFilter';

    $opengrid.setValue(id, sampleMembers(30));
    on(id + '_attach', 'click', function () {
        $opengrid.setFilterSelect(id, { columns: [{ field: 'Department' }] });
        log('캐스케이딩 필터 패널 부착');
    });
    on(id + '_detach', 'click', function () { $opengrid.setFilterSelect(id, null); log('패널 제거'); });
});
