'use strict';

whenGridReady('grdExtendOverride', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdExtendOverride';

    $opengrid.setValue(id, sampleMembers(10));
    on(id + '_catalog', 'click', function () {
        var grid = $opengrid.getGridControl(id);
        if (grid && grid.extensions && grid.extensions.catalog) {
            var items = grid.extensions.catalog();
            log('확장 카탈로그 ' + items.length + '건: ' + items.map(function (i) { return i.name + '(' + i.category + ')'; }).join(', '));
        } else {
            log('extensions.catalog() 를 찾을 수 없습니다');
        }
    });
});
