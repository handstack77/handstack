'use strict';

whenGridReady('grdOv15', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv15';
    var undoStack = [], redoStack = [];

    $opengrid.setValue(id, sampleMembers(8));
    grid.override('undo', function () {
        if (!undoStack.length) { log('OV-15: undo 스택 비어있음'); return; }
        redoStack.push(dedupeByKey($opengrid.getGridData(id), '_ogRowId'));
        $opengrid.setValue(id, undoStack.pop());
        log('OV-15: undo 실행');
    });
    grid.override('redo', function () {
        if (!redoStack.length) { log('OV-15: redo 스택 비어있음'); return; }
        undoStack.push(dedupeByKey($opengrid.getGridData(id), '_ogRowId'));
        $opengrid.setValue(id, redoStack.pop());
        log('OV-15: redo 실행');
    });
    on(id + '_snap', 'click', function () {
        undoStack.push(dedupeByKey($opengrid.getGridData(id), '_ogRowId').map(function (r) { return Object.assign({}, r); }));
        redoStack = [];
        var item = $opengrid.getItemByRowIndex(id, 0);
        if (item) { $opengrid.setCellValue(id, 0, 'Point', (item.Point || 0) + 100); }
    });
    on(id + '_undo', 'click', function () { grid.undo(); });
    on(id + '_redo', 'click', function () { grid.redo(); });
});
