'use strict';

whenGridReady('grdOv19', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv19';

    $opengrid.setValue(id, sampleOrgTree(2));
    grid.enableTree();
    grid.override('addTreeRow', function (orig, parentId, item) {
        var data = $opengrid.getGridData(id);
        item = Object.assign({ id: Date.now() % 1000000, parentId: parentId }, item);
        data.push(item);
        $opengrid.setValue(id, data);
        grid.enableTree();
        log('OV-19: parentId=' + parentId + ' 아래 노드 추가');
    });
    on(id + '_add', 'click', function () { grid.addTreeRow(1, { name: '신규 팀원', title: '팀원' }); });
});
