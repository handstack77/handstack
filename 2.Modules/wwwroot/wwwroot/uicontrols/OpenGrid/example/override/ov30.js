'use strict';

whenGridReady('grdOv30', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv30';

    $opengrid.setValue(id, sampleMembers(3));
    on(id + '_run', 'click', function () {
        var tempID = id + '_scratch';
        var host = document.createElement('div');
        host.id = tempID;
        host.style.cssText = 'width:200px;height:120px;position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(host);
        $opengrid.controlLoad(tempID, { columns: [['MemberName', '이름', 120, false, 'text']] });
        var temp = $opengrid.getGridControl(tempID);
        temp.override('getDisplayValue', function (orig, r, f) { return orig(r, f); });
        var before = temp.hasOverride('getDisplayValue');
        temp.destroy();
        document.body.removeChild(host);
        log('OV-30: destroy 전 hasOverride=' + before + ' (destroy가 내부적으로 restoreAll 실행)');
    });
});
