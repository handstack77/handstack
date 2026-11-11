'use strict';

whenGridReady('grdOv28', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv28';

    $opengrid.setValue(id, sampleMembers(5));
    on(id + '_apply', 'click', function () {
        grid.override('getDisplayValue', function (orig, r, f) { return f === 'MemberName' ? '[적용됨] ' + orig(r, f) : orig(r, f); });
        $opengrid.setValue(id, $opengrid.getGridData(id));
        log('OV-28: 오버라이드 적용됨 → hasOverride=' + grid.hasOverride('getDisplayValue'));
    });
    on(id + '_restore', 'click', function () {
        grid.restore('getDisplayValue');
        $opengrid.setValue(id, $opengrid.getGridData(id));
        log('OV-28: restore 완료 → hasOverride=' + grid.hasOverride('getDisplayValue'));
    });
    on(id + '_names', 'click', function () { log('OV-28: getOverrideNames() = ' + JSON.stringify(grid.getOverrideNames())); });
});
