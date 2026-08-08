'use strict';

whenGridReady('grdF306', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdF306';

    $opengrid.setValue(id, [
        { Label: '0으로 나눔', Price: 0 },
        { Label: '순환 참조', Price: 100 },
        { Label: '없는 필드 참조', Price: 100 }
    ]);
    on(id + '_trigger', 'click', function () {
        $opengrid.setCellFormula(id, 0, 'Result', '=100/Price');
        $opengrid.setCellFormula(id, 1, 'Result', '=Result+1');
        $opengrid.setCellFormula(id, 2, 'Result', '=NotExistField*2');
        log('F3-06: div0 / cycle / name 오류 3종을 셀에 적용했습니다. 각 셀의 오류 표시를 확인하세요.');
    });
});
