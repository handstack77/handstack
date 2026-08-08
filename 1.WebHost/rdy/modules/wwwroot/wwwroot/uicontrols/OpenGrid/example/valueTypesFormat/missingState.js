'use strict';

whenGridReady('grdMissingState', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdMissingState';

    $opengrid.setValue(id, [
        { MemberName: '사용자 1(null=미수집)', Point: null },
        { MemberName: '사용자 2(undefined=해당없음)', Point: undefined },
        { MemberName: '사용자 3(빈값=입력안함)', Point: '' },
        { MemberName: '사용자 4(0=실측값)', Point: 0 },
        { MemberName: '사용자 5(정상값)', Point: 1234 }
    ]);
    grid.override('getDisplayValue', function (orig, rowIndex, field) {
        if (field === 'Point') {
            var v = grid.readCell(rowIndex, field);
            if (v === null) { return '— (미수집)'; }
            if (v === undefined) { return 'N/A (해당없음)'; }
            if (v === '') { return '(입력안함)'; }
            if (v === 0) { return '0 (실측값)'; }
        }
        return orig(rowIndex, field);
    });
    $opengrid.setValue(id, $opengrid.getGridData(id));
});
