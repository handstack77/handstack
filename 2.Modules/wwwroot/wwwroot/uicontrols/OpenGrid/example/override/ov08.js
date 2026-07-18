'use strict';

whenGridReady('grdOv08', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv08';

    function migrateOptions(legacy) {
        var migrated = {};
        if (legacy.cols) { migrated.columns = legacy.cols; }
        if (legacy.rowH) { migrated.rowHeight = legacy.rowH; }
        return migrated;
    }
    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_migrate', 'click', function () {
        var legacyConfig = { cols: [['MemberNo', '번호(구)', 90, false, 'number', true, 'center'], ['MemberName', '이름(구)', 140, false, 'text']], rowH: 40 };
        var migrated = migrateOptions(legacyConfig);
        var initCols = $opengrid.getInitializeColumns(id, migrated.columns, false);
        grid.applyColumns($opengrid.toColumnDefs(initCols));
        log('OV-08: 레거시 옵션(cols/rowH) → 신규 옵션(columns/rowHeight) 마이그레이션 완료(컬럼 재적용, rowHeight=' + migrated.rowHeight + ')');
    });
});
