'use strict';

whenGridReady('grdOv23', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv23';

    $opengrid.setValue(id, sampleMembers(15));
    grid.override.strategy('displayFormatter', function (value, field) {
        if ((field === 'Point' || field === 'Salary') && typeof value === 'number') { return value.toLocaleString() + (field === 'Salary' ? '원' : 'P'); }
        return value == null ? '' : String(value);
    });
    $opengrid.setValue(id, $opengrid.getGridData(id));
    log('OV-23: 공유 포맷터 등록(Point/Salary 공통)');
});
