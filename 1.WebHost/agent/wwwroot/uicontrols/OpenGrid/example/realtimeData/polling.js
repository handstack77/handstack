'use strict';

whenGridReady('grdPolling', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdPolling';

    $opengrid.setValue(id, sampleMembers(15));
    var timer = null;
    on(id + '_toggle', 'click', function () {
        if (timer) {
            clearInterval(timer); timer = null; log('폴링 중지');
            return;
        }
        timer = setInterval(function () {
            $opengrid.setValue(id, sampleMembers(15));
            log('폴링: 전체 데이터 재조회');
        }, 2000);
        log('폴링 시작(2초 간격)');
    });
});
