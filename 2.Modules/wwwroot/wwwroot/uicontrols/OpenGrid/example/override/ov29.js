'use strict';

whenGridReady('grdOv29', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv29', sampleMembers(3));
    on('grdOv29_strict', 'click', function () {
        grid.override('getDisplayValue', function () { throw new Error('의도된 오류'); });
        try { grid.getDisplayValue(0, 'MemberName'); log('OV-29: 에러가 전파되지 않음(예상과 다름)'); }
        catch (e) { log('OV-29: strict 모드 → 에러 전파됨(' + e.message + ')'); }
        grid.restore('getDisplayValue');
    });
    on('grdOv29_fallback', 'click', function () {
        grid.override('getDisplayValue', function () { throw new Error('의도된 오류'); }, { onError: 'fallback' });
        var v = grid.getDisplayValue(0, 'MemberName');
        log('OV-29: onError:fallback → 원본 값으로 폴백(' + v + ')');
        grid.restore('getDisplayValue');
    });
});
