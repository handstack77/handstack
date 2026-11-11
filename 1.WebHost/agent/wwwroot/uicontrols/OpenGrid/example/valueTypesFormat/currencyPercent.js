'use strict';

whenGridReady('grdCurrencyPercent', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdCurrencyPercent';

    var data = sampleMembers(15).map(function (m) { return Object.assign({}, m, { Point: Math.round((m.Point / 10000) * 100) }); });
    $opengrid.setValue(id, data);
    grid.override.strategy('displayFormatter', function (value, field) {
        if (field === 'ChangeRate' && typeof value === 'number') {
            var arrow = value > 0 ? '▲' : value < 0 ? '▼' : '－';
            return arrow + ' ' + Math.abs(value).toFixed(1);
        }
        return String(value == null ? '' : value);
    });
    $opengrid.setValue(id, data);
});
