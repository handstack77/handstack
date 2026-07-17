'use strict';

whenGridReady('grdOv17', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdOv17';

    $opengrid.setValue(id, sampleMembers(10));
    grid.override('setColWidths', function (orig, widths) {
        Object.keys(widths).forEach(function (f) { $opengrid.setColumnWidth(id, f, widths[f]); });
        log('OV-17: setColWidths ' + JSON.stringify(widths));
    });
    on(id + '_apply', 'click', function () { grid.setColWidths({ MemberName: 200, Point: 60 }); });
});
